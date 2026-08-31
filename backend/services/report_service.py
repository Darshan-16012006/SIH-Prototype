import csv
import io
from sqlalchemy.orm import Session
from models import Project, ProgressUpdate, Milestone, Alert

def generate_csv_report(report_type: str, project_id: int, db: Session) -> str:
    """Generates structured CSV content for project reports."""
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "project_detail" and project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return "Project not found"

        writer.writerow(["PROJECT MONITORING DETAILED REPORT"])
        writer.writerow(["Generated Date", "2026-08-30"])
        writer.writerow([])
        writer.writerow(["Project ID", project.project_id])
        writer.writerow(["Project Name", project.name])
        writer.writerow(["Department", project.department])
        writer.writerow(["Implementing Agency", project.implementing_agency])
        writer.writerow(["Manager", project.manager])
        writer.writerow(["Location", project.location])
        writer.writerow(["Status", project.status])
        writer.writerow(["Risk Score", project.risk_score])
        writer.writerow(["Risk Level", project.risk_level])
        writer.writerow(["Approved Budget (Crores)", f"₹{project.approved_budget} Cr"])
        writer.writerow(["Expenditure (Crores)", f"₹{project.expenditure} Cr"])
        writer.writerow(["Physical Progress Planned (%)", f"{project.planned_physical_progress}%"])
        writer.writerow(["Physical Progress Actual (%)", f"{project.physical_progress}%"])
        writer.writerow(["Physical Progress Variance", f"{project.planned_physical_progress - project.physical_progress} points"])
        writer.writerow([])

        # Monthly Updates
        writer.writerow(["MONTHLY PROGRESS UPDATES"])
        writer.writerow(["Month", "Planned Phys %", "Actual Phys %", "Planned Fin %", "Actual Fin %", "Expenditure (Cr)", "Remarks"])
        updates = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == project.id).all()
        for u in updates:
            writer.writerow([u.month, u.planned_physical_progress, u.actual_physical_progress, u.planned_financial_progress, u.actual_financial_progress, u.expenditure, u.remarks or ""])

        writer.writerow([])
        # Milestones
        writer.writerow(["PROJECT MILESTONES"])
        writer.writerow(["Milestone Name", "Due Date", "Completion Date", "Status"])
        milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
        for m in milestones:
            writer.writerow([m.name, m.due_date, m.completion_date or "N/A", m.status])

    else:
        # Portfolio Summary Report
        writer.writerow(["SIH 2026 PROJECT MONITORING PORTFOLIO SUMMARY"])
        writer.writerow(["ID", "Name", "Department", "Location", "Budget (Cr)", "Expenditure (Cr)", "Planned %", "Actual %", "Variance", "Status", "Risk Level"])
        projects = db.query(Project).all()
        for p in projects:
            var = round(p.planned_physical_progress - p.physical_progress, 1)
            writer.writerow([p.project_id, p.name, p.department, p.location, p.approved_budget, p.expenditure, p.planned_physical_progress, p.physical_progress, var, p.status, p.risk_level])

    return output.getvalue()
