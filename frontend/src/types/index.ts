/**
 * NagarMitra — Central TypeScript Definitions
 */

export type Role = 'Citizen' | 'Authority' | 'Worker' | 'Admin';

export type IssueStatus =
  | 'Reported'
  | 'Under Review'
  | 'Confirmed'
  | 'Assigned'
  | 'Work Scheduled'
  | 'In Progress'
  | 'Resolution Submitted'
  | 'Awaiting Verification'
  | 'Resolved'
  | 'Verified'
  | 'Reopened'
  | 'Rejected'
  | 'Duplicate';

export type IssueCategory =
  | 'Roads & Potholes'
  | 'Street Lighting'
  | 'Garbage & Sanitation'
  | 'Water Supply & Leakage'
  | 'Drainage & Sewage'
  | 'Traffic & Signs'
  | 'Parks & Trees'
  | 'Public Property Damage'
  | 'Other';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  ward?: string;
  departmentId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface IssueImage {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedByRole: Role;
}

export interface AIAnalysis {
  id: string;
  detectedCategory: IssueCategory;
  suggestedSeverity: IssueSeverity;
  confidenceScore: number; // 0.0 to 1.0
  aiReasoning: string;
  duplicateDetected: boolean;
  potentialDuplicateIds: string[];
  processedAt: string;
  isDemo: boolean;
}

export interface DuplicateCandidate {
  originalIssueId: string;
  candidateIssueId: string;
  candidateTitle: string;
  similarityScore: number; // 0 to 100
  reason: string;
  distanceMeters: number;
  status: 'Pending' | 'Merged' | 'Dismissed';
}

export interface CitizenReport {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  address: string;
  ward: string;
  images: IssueImage[];
  reportedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  activeTeamsCount: number;
  openIssuesCount: number;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  leaderName: string;
  workersCount: number;
  assignedIssuesCount: number;
  ward: string;
}

export interface Worker {
  id: string;
  userId: string;
  name: string;
  teamId: string;
  teamName: string;
  departmentId: string;
  roleInTeam: string;
  phone: string;
  status: 'Available' | 'On Duty' | 'Off Duty';
}

export interface Assignment {
  id: string;
  issueId: string;
  assignedBy: string;
  departmentId: string;
  departmentName: string;
  teamId: string;
  teamName: string;
  workerIds: string[];
  assignedAt: string;
  targetResolutionDate: string;
  notes?: string;
}

export interface IssueStatusEvent {
  id: string;
  issueId: string;
  status: IssueStatus;
  updatedBy: string;
  userRole: Role;
  timestamp: string;
  comment?: string;
}

export interface ResolutionEvidence {
  id: string;
  afterImages: IssueImage[];
  completionNotes: string;
  materialsUsed?: string[];
  completedAt: string;
  workerName: string;
}

export interface Resolution {
  id: string;
  issueId: string;
  evidence: ResolutionEvidence;
  submittedAt: string;
  status: 'Submitted' | 'Verified' | 'Rejected';
}

export interface CitizenVerification {
  id: string;
  issueId: string;
  citizenId: string;
  satisfied: boolean;
  rating: number; // 1 to 5
  feedback?: string;
  verifiedAt: string;
}

export interface Issue {
  id: string;
  trackingNumber: string;
  report: CitizenReport;
  status: IssueStatus;
  severity: IssueSeverity;
  priority: IssuePriority;
  aiAnalysis?: AIAnalysis;
  isDuplicate: boolean;
  parentIssueId?: string;
  mergedDuplicateIds?: string[];
  linkedChildIds?: string[];
  reportCount?: number;
  assignment?: Assignment;
  resolution?: Resolution;
  citizenVerification?: CitizenVerification;
  statusHistory: IssueStatusEvent[];
  supportingCount: number;
  assignedDepartmentId?: string;
  assignedTeamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  userRole: Role;
  title: string;
  message: string;
  type: 'Info' | 'StatusUpdate' | 'Assignment' | 'VerificationRequest' | 'Alert';
  issueId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalReported: number;
  totalResolved: number;
  totalPending: number;
  duplicatesMerged: number;
  avgResolutionHours: number;
  citizenSatisfactionPercentage: number;
  byCategory: Record<string, number>;
  byWard: Record<string, number>;
  byStatus: Record<string, number>;
}
