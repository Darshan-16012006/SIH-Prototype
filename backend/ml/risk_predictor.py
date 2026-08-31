import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class ProjectDelayPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.scaler = StandardScaler()
        self._is_trained = False
        self._train_prototype_model()

    def _train_prototype_model(self):
        """Train a Scikit-Learn RandomForest model on synthetic historical project data."""
        np.random.seed(42)
        n_samples = 200

        # Synthetic features:
        # 1. Planned Progress (%)
        # 2. Actual Progress (%)
        # 3. Progress Variance (% points)
        # 4. Budget (Crores)
        # 5. Expenditure (Crores)
        # 6. Cost Variance Ratio
        # 7. Missed Milestones
        # 8. Time Elapsed (%)

        planned_p = np.random.uniform(20, 100, n_samples)
        actual_p = planned_p - np.random.uniform(-5, 25, n_samples)
        actual_p = np.clip(actual_p, 0, 100)
        progress_var = planned_p - actual_p

        budget = np.random.uniform(50, 1500, n_samples)
        cost_overrun_ratio = np.random.uniform(-0.1, 0.35, n_samples)
        expenditure = budget * (1 + cost_overrun_ratio)

        missed_m = np.random.poisson(1.2, n_samples)
        time_elapsed = np.random.uniform(20, 100, n_samples)

        # Target: Delay in Days
        # Formula with some random noise: delay = 5 * var + 25 * missed_m + 80 * max(0, overrun_ratio) + noise
        delay_days = (
            5.5 * np.maximum(0, progress_var) +
            22.0 * missed_m +
            95.0 * np.maximum(0, cost_overrun_ratio) +
            np.random.normal(0, 10, n_samples)
        )
        delay_days = np.clip(delay_days, 0, 365)

        X = np.column_stack([
            planned_p, actual_p, progress_var, budget, expenditure, cost_overrun_ratio, missed_m, time_elapsed
        ])

        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, delay_days)
        self._is_trained = True

    def predict_delay(self, planned_p: float, actual_p: float, budget: float, expenditure: float, missed_m: int, time_elapsed: float) -> dict:
        """Predict expected completion delay in days and risk prediction output."""
        progress_var = planned_p - actual_p
        cost_overrun_ratio = (expenditure - budget) / budget if budget > 0 else 0.0

        feature_vector = np.array([[
            planned_p, actual_p, progress_var, budget, expenditure, cost_overrun_ratio, missed_m, time_elapsed
        ]])

        feature_scaled = self.scaler.transform(feature_vector)
        predicted_delay = float(self.model.predict(feature_scaled)[0])
        predicted_delay = round(max(0.0, predicted_delay), 1)

        # Feature Importance Analysis
        feature_names = [
            "Planned Progress", "Actual Progress", "Progress Variance",
            "Approved Budget", "Expenditure", "Cost Overrun Ratio",
            "Missed Milestones", "Time Elapsed"
        ]
        importances = self.model.feature_importances_
        feature_importance_dict = {
            name: round(float(imp), 4) for name, imp in zip(feature_names, importances)
        }

        # Confidence & Risk Categorization
        if predicted_delay > 90:
            predicted_risk_level = "CRITICAL"
            recommendation = "Immediate executive intervention required. Re-evaluate contractor allocation and project milestones."
        elif predicted_delay > 45:
            predicted_risk_level = "HIGH"
            recommendation = "Deploy targeted field inspection. Conduct monthly cost audit and speed up procurement."
        elif predicted_delay > 15:
            predicted_risk_level = "MEDIUM"
            recommendation = "Monitor progress closely. Address minor milestone bottlenecks."
        else:
            predicted_risk_level = "LOW"
            recommendation = "Project operating within acceptable parameters. Continue routine tracking."

        return {
            "predicted_delay_days": predicted_delay,
            "predicted_risk_level": predicted_risk_level,
            "recommendation": recommendation,
            "feature_importance": feature_importance_dict,
            "model_type": "Scikit-Learn Random Forest Regressor (Prototype Model)"
        }

predictor = ProjectDelayPredictor()
