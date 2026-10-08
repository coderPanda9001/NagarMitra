import type {
  Issue,
  CitizenReport,
  IssueStatus,
  IssueImage,
  IssueStatusEvent,
  Assignment,
  ResolutionEvidence,
  CitizenVerification,
} from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface PriorityFactorDetail {
  factor: string;
  value: string;
  points: number;
}

export interface PriorityFactorsResponse {
  priority: string;
  totalScore: number;
  explanation: string;
  factors: PriorityFactorDetail[];
}

export interface DuplicateCandidateRaw {
  candidate_issue_id: string;
  candidate_title: string;
  candidate_tracking_number?: string;
  similarity_score: number;
  distance_meters: number;
  classification: string;
  reason: string;
  status: string;
  loc_score: number;
  text_score: number;
  cat_score: number;
  time_score: number;
  image_score?: number;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  head_name?: string;
  created_at?: string;
}

export interface TeamDTO {
  id: string;
  department_id: string;
  name: string;
  leader_name?: string;
  ward?: string;
  created_at?: string;
}

export interface IIssueService {
  getIssues(params?: { ward?: string; status?: string }): Promise<Issue[]>;
  getIssueById(id: string): Promise<Issue | undefined>;
  createReport(report: Omit<CitizenReport, 'id' | 'reportedAt'>, imageFiles?: File[]): Promise<Issue>;
  updateStatus(id: string, status: IssueStatus, comment?: string): Promise<Issue>;
  assignIssue(assignment: Assignment): Promise<Issue>;
  submitResolution(id: string, evidence: ResolutionEvidence): Promise<Issue>;
  verifyResolution(id: string, verification: CitizenVerification): Promise<Issue>;
  reopenIssue(id: string): Promise<Issue>;
  startWork(id: string): Promise<Issue>;
  addWorkNote(id: string, note: string): Promise<Issue>;
  uploadWorkPhoto(id: string, photo: File, caption?: string): Promise<Issue>;
  completeWork(id: string): Promise<Issue>;
  getDuplicateCandidates(id: string): Promise<DuplicateCandidateRaw[]>;
  checkDuplicates(lat: number, lng: number, title?: string, description?: string, category?: string): Promise<DuplicateCandidateRaw[]>;
  mergeDuplicates(parentIssueId: string, childIssueIds: string[]): Promise<Issue>;
  mergeIssue(childId: string, masterId: string): Promise<Issue>;
  splitIssue(childId: string): Promise<Issue>;
  overrideDepartment(id: string, departmentId: string): Promise<Issue>;
  getPriorityFactors(id: string): Promise<PriorityFactorsResponse | null>;
  addSupportingReport(issueId: string): Promise<Issue | undefined>;
  getDepartments(): Promise<DepartmentDTO[]>;
  getTeams(): Promise<TeamDTO[]>;
}

const DEMO_ISSUES: Issue[] = [
  {
    id: 'iss-101',
    trackingNumber: 'CT-2026-00101',
    status: 'Reported',
    severity: 'High',
    priority: 'High',
    isDuplicate: false,
    supportingCount: 1,
    reportCount: 1,
    linkedChildIds: [],
    createdAt: '2026-10-01T09:15:00Z',
    updatedAt: '2026-10-01T09:15:00Z',
    report: {
      id: 'rep-101',
      citizenId: 'usr-citizen-demo',
      citizenName: 'Aarav Sharma',
      title: 'Deep Hazardous Pothole near SV Road Junction',
      description:
        'Large 2-foot wide crater on the southbound carriageway causing severe vehicle damage and traffic bottlenecks during peak morning hours.',
      category: 'Roads & Potholes',
      latitude: 19.0596,
      longitude: 72.8295,
      address: 'SV Road, near Bandra Railway Station West',
      ward: 'Ward K-West',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop',
          caption: 'View of pothole on outer lane',
          uploadedAt: '2026-10-01T09:15:00Z',
          uploadedByRole: 'Citizen',
        },
      ],
      reportedAt: '2026-10-01T09:15:00Z',
    },
    aiAnalysis: {
      id: 'ai-101',
      detectedCategory: 'Roads & Potholes',
      suggestedSeverity: 'High',
      confidenceScore: 0.94,
      aiReasoning: 'Arterial roadway location and high traffic volume indicate high urgency.',
      duplicateDetected: false,
      potentialDuplicateIds: [],
      processedAt: '2026-10-01T09:15:05Z',
      isDemo: true,
    },
    statusHistory: [
      {
        id: 'evt-1',
        issueId: 'iss-101',
        status: 'Reported',
        updatedBy: 'Aarav Sharma',
        userRole: 'Citizen',
        timestamp: '2026-10-01T09:15:00Z',
        comment: 'Initial complaint filed.',
      },
    ],
  },
];

const ISSUES_STORAGE_KEY = 'nagarmitra_issues_store';

function loadMemoryStore(): Issue[] {
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...DEMO_ISSUES];
}

function saveMemoryStore(list: Issue[]) {
  try {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

let issuesMemoryStore: Issue[] = loadMemoryStore();

const DEMO_DEPTS: DepartmentDTO[] = [
  { id: 'dept-roads', name: 'Public Works Department', code: 'PWD', head_name: 'Rajesh Kulkarni' },
  { id: 'dept-water', name: 'Water Supply & Sewage Board', code: 'WSSB', head_name: 'Anil Patil' },
  { id: 'dept-sanitation', name: 'Sanitation & Waste Management', code: 'SWM', head_name: 'Sanjay Deshmukh' },
  { id: 'dept-electrical', name: 'Electrical Services', code: 'ES', head_name: 'Mahesh Jadhav' },
];

const DEMO_TEAMS: TeamDTO[] = [
  { id: 'team-hwest-roads', department_id: 'dept-roads', name: 'Rapid Action Road Squad 1', leader_name: 'Ramesh Shinde', ward: 'Ward H-West' },
  { id: 'team-kwest-roads', department_id: 'dept-roads', name: 'Road Maintenance Unit K-West', leader_name: 'Dinesh Patil', ward: 'Ward K-West' },
  { id: 'team-water-crew', department_id: 'dept-water', name: 'Water Main Maintenance Crew', leader_name: 'Vijay Thorat', ward: 'Ward H-West' },
  { id: 'team-sanitation-4', department_id: 'dept-sanitation', name: 'Sanitation Crew 4', leader_name: 'Kailas More', ward: 'Ward K-West' },
  { id: 'team-lighting-a', department_id: 'dept-electrical', name: 'Street Lighting Squad A', leader_name: 'Anand Lokhande', ward: 'Ward H-West' },
];

class HybridIssueService implements IIssueService {
  private getAuthHeader(): Record<string, string> {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getIssues(params?: { ward?: string; status?: string }): Promise<Issue[]> {
    if (!USE_MOCK) {
      try {
        const query = new URLSearchParams();
        if (params?.ward) query.append('ward', params.ward);
        if (params?.status) query.append('status', params.status);

        const response = await fetch(`${API_BASE_URL}/issues/?${query.toString()}`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const data = await response.json();
          issuesMemoryStore = data;
          return data;
        }
      } catch (err) {}
    }
    return issuesMemoryStore;
  }

  async getIssueById(id: string): Promise<Issue | undefined> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const data: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) {
            const existingImgs = issuesMemoryStore[idx].report.images || [];
            const newImgs = data.report.images || [];
            const mergedImgs = [...newImgs];
            for (const ext of existingImgs) {
              if (!mergedImgs.some((m) => m.id === ext.id || m.caption === ext.caption)) {
                mergedImgs.push(ext);
              }
            }
            data.report.images = mergedImgs;
            issuesMemoryStore[idx] = data;
          } else {
            issuesMemoryStore.unshift(data);
          }
          saveMemoryStore(issuesMemoryStore);
          return data;
        }
      } catch (err) {}
    }
    return issuesMemoryStore.find((i) => i.id === id);
  }

  async createReport(
    report: Omit<CitizenReport, 'id' | 'reportedAt'>,
    imageFiles?: File[]
  ): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const formData = new FormData();
        formData.append('title', report.title);
        formData.append('description', report.description);
        formData.append('category', report.category);
        formData.append('ward', report.ward || 'Ward K-West');
        formData.append('address', report.address);
        formData.append('latitude', report.latitude.toString());
        formData.append('longitude', report.longitude.toString());

        if (imageFiles && imageFiles.length > 0) {
          imageFiles.forEach((file) => {
            formData.append('images', file);
          });
        }

        const response = await fetch(`${API_BASE_URL}/issues/`, {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: formData,
        });

        if (response.ok) {
          const newIssue: Issue = await response.json();
          issuesMemoryStore.unshift(newIssue);
          return newIssue;
        }
      } catch (err) {}
    }

    const newId = `iss-${Date.now()}`;
    const tracking = `CT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const created: Issue = {
      id: newId,
      trackingNumber: tracking,
      status: 'Reported',
      severity: 'Medium',
      priority: 'Medium',
      isDuplicate: false,
      supportingCount: 1,
      reportCount: 1,
      linkedChildIds: [],
      createdAt: now,
      updatedAt: now,
      report: {
        ...report,
        id: `rep-${Date.now()}`,
        reportedAt: now,
      },
      statusHistory: [
        {
          id: `evt-${Date.now()}`,
          issueId: newId,
          status: 'Reported',
          updatedBy: report.citizenName || 'Citizen',
          userRole: 'Citizen',
          timestamp: now,
        },
      ],
    };

    issuesMemoryStore.unshift(created);
    return created;
  }

  async updateStatus(id: string, status: IssueStatus, _comment?: string): Promise<Issue> {
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  async assignIssue(assignment: Assignment): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${assignment.issueId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
          body: JSON.stringify({
            departmentId: assignment.departmentId,
            teamId: assignment.teamId,
          }),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === updated.id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === assignment.issueId);
    if (!item) throw new Error('Issue not found');
    item.status = 'Assigned';
    item.assignment = assignment;
    return item;
  }

  async startWork(id: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/start-work`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
        if (response.status === 400) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.detail || 'Invalid status transition');
        }
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    item.status = 'In Progress';
    return item;
  }

  async addWorkNote(id: string, note: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/work-note`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
          body: JSON.stringify({ note }),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    return item;
  }

  async uploadWorkPhoto(id: string, photo: File, caption: string = 'Field photo'): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('caption', caption);

        const response = await fetch(`${API_BASE_URL}/issues/${id}/work-photos`, {
          method: 'POST',
          headers: this.getAuthHeader(),
          body: formData,
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');

    const photoUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(URL.createObjectURL(photo));
      reader.readAsDataURL(photo);
    });

    const newImage: IssueImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: photoUrl,
      caption: caption,
      uploadedAt: new Date().toISOString(),
      uploadedByRole: 'Worker',
    };

    if (!item.report.images) {
      item.report.images = [];
    }
    item.report.images.push(newImage);

    const event: IssueStatusEvent = {
      id: `evt-${Date.now()}`,
      issueId: item.id,
      status: item.status,
      updatedBy: 'Field Worker',
      userRole: 'Worker',
      timestamp: new Date().toISOString(),
      comment: `Uploaded photo: ${caption}`,
    };
    if (!item.statusHistory) item.statusHistory = [];
    item.statusHistory.unshift(event);

    const idx = issuesMemoryStore.findIndex((i) => i.id === id);
    if (idx >= 0) issuesMemoryStore[idx] = { ...item };

    saveMemoryStore(issuesMemoryStore);
    return { ...item };
  }

  async completeWork(id: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/complete-work`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
        if (response.status === 400) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.detail || 'Invalid status transition');
        }
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    item.status = 'Resolution Submitted';
    saveMemoryStore(issuesMemoryStore);
    return { ...item };
  }

  async submitResolution(id: string, _evidence: ResolutionEvidence): Promise<Issue> {
    return this.completeWork(id);
  }

  async verifyResolution(id: string, verification: CitizenVerification): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const endpoint = verification.satisfied ? 'verify' : 'reopen';
        const response = await fetch(`${API_BASE_URL}/issues/${id}/${endpoint}`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    item.status = verification.satisfied ? 'Verified' : 'Reopened';
    return item;
  }

  async reopenIssue(id: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/reopen`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    item.status = 'Reopened';
    return item;
  }

  async getDuplicateCandidates(id: string): Promise<DuplicateCandidateRaw[]> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/duplicates`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}
    }
    return [];
  }

  async checkDuplicates(lat: number, lng: number, title: string = '', description: string = '', category: string = 'Other'): Promise<DuplicateCandidateRaw[]> {
    if (!USE_MOCK) {
      try {
        const query = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          title,
          description,
          category,
        });
        const response = await fetch(`${API_BASE_URL}/issues/duplicates/check?${query.toString()}`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}
    }
    return [];
  }

  async mergeDuplicates(parentIssueId: string, childIssueIds: string[]): Promise<Issue> {
    if (childIssueIds.length > 0) {
      return this.mergeIssue(childIssueIds[0], parentIssueId);
    }
    const parent = issuesMemoryStore.find((i) => i.id === parentIssueId);
    if (!parent) throw new Error('Parent issue not found');
    return parent;
  }

  async mergeIssue(childId: string, masterId: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${childId}/merge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
          body: JSON.stringify({ masterIssueId: masterId }),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === updated.id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const master = issuesMemoryStore.find((i) => i.id === masterId);
    if (!master) throw new Error('Master issue not found');
    return master;
  }

  async splitIssue(childId: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${childId}/split`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === childId);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
        if (response.status === 400) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.detail || 'Cannot split issue');
        }
      } catch (e) {
        if (e instanceof Error) throw e;
      }
    }
    const child = issuesMemoryStore.find((i) => i.id === childId);
    if (!child) throw new Error('Child issue not found');
    child.isDuplicate = false;
    child.parentIssueId = undefined;
    return child;
  }

  async overrideDepartment(id: string, departmentId: string): Promise<Issue> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/department`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
          body: JSON.stringify({ departmentId }),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === id);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (e) {}
    }
    const item = issuesMemoryStore.find((i) => i.id === id);
    if (!item) throw new Error('Issue not found');
    return item;
  }

  async getPriorityFactors(id: string): Promise<PriorityFactorsResponse | null> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${id}/priority-factors`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) return await response.json();
      } catch (e) {}
    }
    return null;
  }

  async addSupportingReport(issueId: string): Promise<Issue | undefined> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/issues/${issueId}/affected`, {
          method: 'POST',
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          const updated: Issue = await response.json();
          const idx = issuesMemoryStore.findIndex((i) => i.id === issueId);
          if (idx >= 0) issuesMemoryStore[idx] = updated;
          return updated;
        }
      } catch (err) {}
    }

    return issuesMemoryStore.find((i) => i.id === issueId);
  }

  async getDepartments(): Promise<DepartmentDTO[]> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/departments/`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}
    }
    return DEMO_DEPTS;
  }

  async getTeams(): Promise<TeamDTO[]> {
    if (!USE_MOCK) {
      try {
        const response = await fetch(`${API_BASE_URL}/teams/`, {
          headers: this.getAuthHeader(),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}
    }
    return DEMO_TEAMS;
  }
}

export const issueService = new HybridIssueService();
