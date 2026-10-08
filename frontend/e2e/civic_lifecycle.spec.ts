import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8000/api/v1';

test.describe('Civic Issue End-to-End Lifecycle', () => {
  let citizenAToken: string;
  let citizenBToken: string;
  let authorityToken: string;
  let workerToken: string;

  let issueAId: string;
  let issueBId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate Citizen A
    const resA = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'citizen@demo.org', password: 'password123' },
    });
    expect(resA.ok()).toBeTruthy();
    const dataA = await resA.json();
    citizenAToken = dataA.access_token;

    // 2. Authenticate Citizen B
    const resB = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'citizen2@demo.org', password: 'password123' },
    });
    expect(resB.ok()).toBeTruthy();
    const dataB = await resB.json();
    citizenBToken = dataB.access_token;

    // 3. Authenticate Authority Official
    const resAuth = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'authority@demo.org', password: 'password123' },
    });
    expect(resAuth.ok()).toBeTruthy();
    const dataAuth = await resAuth.json();
    authorityToken = dataAuth.access_token;

    // 4. Authenticate Worker
    const resWorker = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'worker@demo.org', password: 'password123' },
    });
    expect(resWorker.ok()).toBeTruthy();
    const dataWorker = await resWorker.json();
    workerToken = dataWorker.access_token;
  });

  test('Complete Lifecycle: Report -> Duplicate -> Merge -> Assign -> Start Work -> Complete Work -> Verify -> Reopen & Split', async ({ request }) => {
    // Step 1: Citizen A reports pothole
    const resReportA = await request.post(`${API_BASE}/issues/`, {
      headers: { Authorization: `Bearer ${citizenAToken}` },
      multipart: {
        title: 'E2E Deep Pothole on Main St',
        description: 'Dangerous large pothole creating traffic hazard on Main St near Central Park',
        category: 'Roads & Footpaths',
        address: '100 Main Street',
        ward: 'Ward 12',
        latitude: '12.9716',
        longitude: '77.5946',
      },
    });
    expect(resReportA.ok()).toBeTruthy();
    const issueA = await resReportA.json();
    issueAId = issueA.id;
    expect(issueA.status).toBe('Reported');

    // Step 2: Citizen B reports similar pothole nearby (Trigger duplicate detection)
    const resReportB = await request.post(`${API_BASE}/issues/`, {
      headers: { Authorization: `Bearer ${citizenBToken}` },
      multipart: {
        title: 'E2E Big Pothole on Main Street',
        description: 'Large pothole on Main Street near Park entrance',
        category: 'Roads & Footpaths',
        address: '104 Main Street',
        ward: 'Ward 12',
        latitude: '12.9717',
        longitude: '77.5947',
      },
    });
    expect(resReportB.ok()).toBeTruthy();
    const issueB = await resReportB.json();
    issueBId = issueB.id;

    // Step 3: Check Duplicate Detection API
    const resDuplicates = await request.get(`${API_BASE}/issues/${issueBId}/duplicates`, {
      headers: { Authorization: `Bearer ${authorityToken}` },
    });
    expect(resDuplicates.ok()).toBeTruthy();
    const duplicates = await resDuplicates.json();
    const foundDuplicate = duplicates.some((d: any) => d.candidate_issue_id === issueAId || d.id === issueAId || d.issue_id === issueAId);
    expect(foundDuplicate).toBeTruthy();

    // Step 4: Authority merges Issue B into Issue A (Master)
    const resMerge = await request.post(`${API_BASE}/issues/${issueBId}/merge`, {
      headers: { Authorization: `Bearer ${authorityToken}` },
      data: { masterIssueId: issueAId },
    });
    expect(resMerge.ok()).toBeTruthy();

    // Verify Issue B status is Duplicate
    const resCheckB = await request.get(`${API_BASE}/issues/${issueBId}`, {
      headers: { Authorization: `Bearer ${authorityToken}` },
    });
    const updatedB = await resCheckB.json();
    expect(updatedB.status).toBe('Duplicate');
    expect(updatedB.parentIssueId || updatedB.parent_issue_id).toBe(issueAId);

    // Step 5: Authority assigns team to Issue A
    const resAssign = await request.post(`${API_BASE}/issues/${issueAId}/assign`, {
      headers: { Authorization: `Bearer ${authorityToken}` },
      data: { departmentId: 'dept-roads', teamId: 'team-alpha' },
    });
    expect(resAssign.ok()).toBeTruthy();
    const assignedIssue = await resAssign.json();
    expect(assignedIssue.status).toBe('Assigned');

    // Step 5b: Worker starts work on Issue A -> status becomes In Progress
    const resStart = await request.post(`${API_BASE}/issues/${issueAId}/start-work`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    expect(resStart.ok()).toBeTruthy();
    const inProgressIssue = await resStart.json();
    expect(inProgressIssue.status).toBe('In Progress');

    // Step 6: Worker completes work -> status becomes Resolution Submitted / Awaiting Verification
    const resComplete = await request.post(`${API_BASE}/issues/${issueAId}/complete-work`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    expect(resComplete.ok()).toBeTruthy();
    const completedIssue = await resComplete.json();
    expect(['Resolution Submitted', 'Awaiting Verification']).toContain(completedIssue.status);

    // Step 7: Citizen A verifies Fixed -> Issue becomes Resolved
    const resVerify = await request.post(`${API_BASE}/issues/${issueAId}/verify`, {
      headers: { Authorization: `Bearer ${citizenAToken}` },
      data: { verified: true, feedback: 'Great job! Path is smooth now.' },
    });
    expect(resVerify.ok()).toBeTruthy();
    const resolvedIssue = await resVerify.json();
    expect(['Resolved', 'Verified']).toContain(resolvedIssue.status);

    // Step 8: Reopening test ("Still Not Fixed")
    const resReopen = await request.post(`${API_BASE}/issues/${issueAId}/reopen`, {
      headers: { Authorization: `Bearer ${citizenAToken}` },
      data: { reason: 'Asphalt settled after rain, pothole reappeared.' },
    });
    expect(resReopen.ok()).toBeTruthy();
    const reopenedIssue = await resReopen.json();
    expect(['In Progress', 'Reopened']).toContain(reopenedIssue.status);

    // Step 9: Split test (Incorrectly merged issue split back)
    const resSplit = await request.post(`${API_BASE}/issues/${issueBId}/split`, {
      headers: { Authorization: `Bearer ${authorityToken}` },
    });
    expect(resSplit.ok()).toBeTruthy();
    const splitIssue = await resSplit.json();
    expect(splitIssue.status).toBe('Reported');
    expect(splitIssue.parentIssueId || splitIssue.parent_issue_id).toBeFalsy();
  });
});
