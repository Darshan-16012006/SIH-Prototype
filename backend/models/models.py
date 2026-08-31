import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Viewer") # Admin, Officer, Viewer
    department = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, unique=True, index=True, nullable=False) # e.g. PRJ-NGP-001
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    implementing_agency = Column(String, nullable=False)
    manager = Column(String, nullable=False)
    category = Column(String, nullable=False) # Infrastructure, Transport, Energy, Water, Smart City
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    approved_budget = Column(Float, nullable=False) # In Crores (INR)
    expenditure = Column(Float, default=0.0) # In Crores (INR)
    physical_progress = Column(Float, default=0.0) # Percentage (0-100)
    planned_physical_progress = Column(Float, default=0.0) # Percentage (0-100)
    financial_progress = Column(Float, default=0.0) # Percentage (0-100)
    planned_financial_progress = Column(Float, default=0.0) # Percentage (0-100)
    start_date = Column(String, nullable=False) # YYYY-MM-DD
    expected_completion_date = Column(String, nullable=False) # YYYY-MM-DD
    status = Column(String, default="ON_TRACK") # ON_TRACK, WARNING, DELAYED, HIGH_RISK
    risk_score = Column(Float, default=10.0) # 0 to 100
    risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    progress_updates = relationship("ProgressUpdate", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    month = Column(String, nullable=False) # YYYY-MM
    planned_physical_progress = Column(Float, nullable=False)
    actual_physical_progress = Column(Float, nullable=False)
    planned_financial_progress = Column(Float, nullable=False)
    actual_financial_progress = Column(Float, nullable=False)
    expenditure = Column(Float, nullable=False) # Total cumulative expenditure to date
    milestones_completed = Column(Integer, default=0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="progress_updates")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String, nullable=False) # YYYY-MM-DD
    completion_date = Column(String, nullable=True) # YYYY-MM-DD
    status = Column(String, default="Not Started") # Not Started, In Progress, Completed, Delayed

    project = relationship("Project", back_populates="milestones")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String, nullable=False) # Progress Delay, Cost Overrun, Missed Milestone, High Risk, Abnormal Progress
    severity = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    message = Column(Text, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="alerts")

class RiskAnalysis(Base):
    __tablename__ = "risk_analysis"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    level = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    progress_variance = Column(Float, nullable=False)
    cost_variance = Column(Float, nullable=False)
    missed_milestones = Column(Integer, nullable=False)
    predicted_delay_days = Column(Integer, default=0)
    risk_factors_json = Column(Text, nullable=False) # JSON string of factors breakdown
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)
