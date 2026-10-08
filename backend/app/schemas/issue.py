from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class IssueImageOut(BaseModel):
    id: str
    url: str
    caption: Optional[str] = None
    uploadedAt: str
    uploadedByRole: str

class AIAnalysisOut(BaseModel):
    id: str
    detectedCategory: str
    suggestedSeverity: str
    confidenceScore: float
    aiReasoning: str
    duplicateDetected: bool = False
    potentialDuplicateIds: List[str] = []
    processedAt: str
    isDemo: bool = False

class CitizenReportOut(BaseModel):
    id: str
    citizenId: str
    citizenName: str
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: str
    ward: str
    images: List[IssueImageOut] = []
    reportedAt: str

class IssueStatusEventOut(BaseModel):
    id: str
    issueId: str
    status: str
    updatedBy: str
    userRole: str
    timestamp: str
    comment: Optional[str] = None

class IssueOut(BaseModel):
    id: str
    trackingNumber: str
    status: str
    severity: str
    priority: str
    isDuplicate: bool = False
    parentIssueId: Optional[str] = None
    assignedDepartmentId: Optional[str] = None
    assignedTeamId: Optional[str] = None
    createdAt: str
    updatedAt: str
    report: CitizenReportOut
    statusHistory: List[IssueStatusEventOut] = []
    aiAnalysis: Optional[AIAnalysisOut] = None
    supportingCount: int = 1
    linkedChildIds: List[str] = []
    reportCount: int = 1

class MergeRequest(BaseModel):
    masterIssueId: str

class AssignRequest(BaseModel):
    departmentId: Optional[str] = None
    teamId: Optional[str] = None

class WorkNoteRequest(BaseModel):
    note: str

class DepartmentOverrideRequest(BaseModel):
    departmentId: str

class FactorDetail(BaseModel):
    factor: str
    value: str
    points: int

class PriorityFactorsOut(BaseModel):
    priority: str
    totalScore: int
    explanation: str
    factors: List[FactorDetail]

class NotificationOut(BaseModel):
    id: str
    userId: str
    userRole: str
    title: str
    message: str
    type: str = "Info"
    issueId: Optional[str] = None
    read: bool = False
    createdAt: str
