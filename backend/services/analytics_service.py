from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Project, Alert

def get_portfolio_overview(db: Session, department: str = None) -> dict:
    """Return aggregated KPI numbers, chart data, status counts, and risk distribution."""
    query = db.query(Project)
    if department and department != "All":
        query = query.filter(Project.department == department)

    projects = query.all()

    total_projects = len(projects)
    total_budget = round(sum(p.approved_budget for p in projects), 2)
    total_expenditure = round(sum(p.expenditure for p in projects), 2)
    remaining_budget = round(max(0.0, total_budget - total_expenditure), 2)

    status_counts = {"ON_TRACK": 0, "WARNING": 0, "DELAYED": 0, "HIGH_RISK": 0}
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    overbudget_projects_count = 0
    avg_physical_variance = 0.0

    planned_vs_actual = []
    department_budget = {}

    for p in projects:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1
        risk_counts[p.risk_level] = risk_counts.get(p.risk_level, 0) + 1

        if p.expenditure > p.approved_budget:
            overbudget_projects_count += 1

        planned_vs_actual.append({
            "id": p.id,
            "project_id": p.project_id,
            "name": p.name,
            "planned": p.planned_physical_progress,
            "actual": p.physical_progress,
            "variance": round(p.planned_physical_progress - p.physical_progress, 1),
            "status": p.status
        })

        dept = p.department
        if dept not in department_budget:
            department_budget[dept] = {"department": dept, "budget": 0.0, "expenditure": 0.0}
        department_budget[dept]["budget"] = round(department_budget[dept]["budget"] + p.approved_budget, 2)
        department_budget[dept]["expenditure"] = round(department_budget[dept]["expenditure"] + p.expenditure, 2)

    if total_projects > 0:
        avg_physical_variance = round(
            sum(p.planned_physical_progress - p.physical_progress for p in projects) / total_projects, 1
        )

    # Department breakdown list
    dept_list = list(department_budget.values())

    return {
        "kpis": {
            "total_projects": total_projects,
            "on_track": status_counts["ON_TRACK"],
            "warning": status_counts["WARNING"],
            "delayed": status_counts["DELAYED"],
            "at_risk": status_counts["HIGH_RISK"],
            "total_budget": total_budget,
            "total_expenditure": total_expenditure,
            "remaining_budget": remaining_budget,
            "overbudget_count": overbudget_projects_count,
            "avg_physical_variance": avg_physical_variance
        },
        "status_distribution": [
            {"name": "On Track", "value": status_counts["ON_TRACK"], "color": "#10B981"},
            {"name": "Warning", "value": status_counts["WARNING"], "color": "#F59E0B"},
            {"name": "Delayed", "value": status_counts["DELAYED"], "color": "#EF4444"},
            {"name": "High Risk", "value": status_counts["HIGH_RISK"], "color": "#991B1B"}
        ],
        "risk_distribution": [
            {"name": "Low", "value": risk_counts["LOW"], "color": "#10B981"},
            {"name": "Medium", "value": risk_counts["MEDIUM"], "color": "#F59E0B"},
            {"name": "High", "value": risk_counts["HIGH"], "color": "#EF4444"},
            {"name": "Critical", "value": risk_counts["CRITICAL"], "color": "#991B1B"}
        ],
        "planned_vs_actual": planned_vs_actual,
        "department_breakdown": dept_list
    }
