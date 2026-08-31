from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# User Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: Optional[str] = None

    class Config:
        from_attributes = True

# Milestone Schemas
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: str
    completion_date: Optional[str] = None
    status: str = "Not Started"

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    completion_date: Optional[str] = None
    status: Optional[str] = None

class MilestoneResponse(MilestoneBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

# Progress Update Schemas
class ProgressUpdateBase(BaseModel):
    month: str
    planned_physical_progress: float = Field(..., ge=0, le=100)
    actual_physical_progress: float = Field(..., ge=0, le=100)
    planned_financial_progress: float = Field(..., ge=0, le=100)
    actual_financial_progress: float = Field(..., ge=0, le=100)
    expenditure: float = Field(..., ge=0)
    milestones_completed: int = 0
    remarks: Optional[str] = None

class ProgressUpdateCreate(ProgressUpdateBase):
    pass

class ProgressUpdateResponse(ProgressUpdateBase):
    id: int
    project_id: int
    created_at: Any

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    project_id: str
    name: str
    department: str
    implementing_agency: str
    manager: str
    category: str
    location: str
    latitude: float
    longitude: float
    approved_budget: float = Field(..., gt=0)
    start_date: str
    expected_completion_date: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    expenditure: Optional[float] = 0.0
    physical_progress: Optional[float] = 0.0
    planned_physical_progress: Optional[float] = 0.0
    financial_progress: Optional[float] = 0.0
    planned_financial_progress: Optional[float] = 0.0

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    implementing_agency: Optional[str] = None
    manager: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    approved_budget: Optional[float] = None
    expenditure: Optional[float] = None
    physical_progress: Optional[float] = None
    planned_physical_progress: Optional[float] = None
    financial_progress: Optional[float] = None
    planned_financial_progress: Optional[float] = None
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    expenditure: float
    physical_progress: float
    planned_physical_progress: float
    financial_progress: float
    planned_financial_progress: float
    status: str
    risk_score: float
    risk_level: str
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    project_id: int
    project_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    date: str
    is_read: bool

    class Config:
        from_attributes = True

# Risk Analysis Schema
class RiskAnalysisResponse(BaseModel):
    id: int
    project_id: int
    score: float
    level: str
    progress_variance: float
    cost_variance: float
    missed_milestones: int
    predicted_delay_days: int
    risk_factors: Dict[str, Any]

    class Config:
        from_attributes = True

# Settings Config Schema
class SystemThresholds(BaseModel):
    warning_progress_variance: float = 5.0 # percentage points
    delay_progress_variance: float = 10.0 # percentage points
    cost_overrun_threshold: float = 0.0 # percentage
    high_risk_score: float = 60.0
    critical_risk_score: float = 80.0
