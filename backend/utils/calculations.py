def calculate_physical_variance(planned: float, actual: float) -> float:
    """Calculate percentage point difference: planned - actual"""
    return round(planned - actual, 2)

def calculate_financial_variance(planned: float, actual: float) -> float:
    """Calculate percentage point difference: planned - actual"""
    return round(planned - actual, 2)

def calculate_cost_variance(budget: float, expenditure: float) -> float:
    """Cost overrun in Crores: expenditure - budget"""
    return round(expenditure - budget, 2)

def determine_project_status(progress_variance: float, cost_variance: float, risk_score: float) -> str:
    """
    Status determination based on configurable thresholds:
    - 0-5 point variance & no overrun: ON_TRACK
    - 5-10 point variance: WARNING
    - >10 point variance OR overrun OR high risk: DELAYED / HIGH_RISK
    """
    if risk_score >= 80 or (progress_variance >= 15 and cost_variance > 0):
        return "HIGH_RISK"
    elif progress_variance > 10 or cost_variance > 0:
        return "DELAYED"
    elif progress_variance > 5:
        return "WARNING"
    else:
        return "ON_TRACK"

def determine_risk_level(score: float) -> str:
    """
    0-30: LOW
    31-60: MEDIUM
    61-80: HIGH
    81-100: CRITICAL
    """
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 80:
        return "HIGH"
    else:
        return "CRITICAL"
