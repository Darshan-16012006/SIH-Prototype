import http.server
import socketserver
import json
import sqlite3
import urllib.parse
import os
import datetime

PORT = 8000
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sih_monitoring.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Global Threshold Configuration
THRESHOLDS = {
    "warning_progress_variance": 5.0,
    "delay_progress_variance": 10.0,
    "cost_overrun_threshold": 0.0,
    "high_risk_score": 60.0,
    "critical_risk_score": 80.0
}

def calculate_risk(project):
    p_plan = project["planned_physical_progress"]
    p_act = project["physical_progress"]
    budget = project["approved_budget"]
    exp = project["expenditure"]

    var = round(p_plan - p_act, 1)
    cost_var = round(exp - budget, 2)
    cost_overrun_pct = round((cost_var / budget) * 100, 1) if (budget > 0 and cost_var > 0) else 0.0

    progress_score = min(100.0, max(0.0, var * 4.0))
    cost_score = min(100.0, max(0.0, cost_overrun_pct * 10.0))
    milestone_score = 30.0 if var > 10 else 0.0
    schedule_score = min(100.0, max(0.0, var * 2.0))

    score = round((0.35 * progress_score) + (0.30 * cost_score) + (0.20 * milestone_score) + (0.15 * schedule_score), 1)
    score = min(100.0, max(0.0, score))

    if score > 80:
        level = "CRITICAL"
        status = "HIGH_RISK"
    elif score > 60 or var > 10 or cost_var > 0:
        level = "HIGH"
        status = "DELAYED"
    elif var > 5:
        level = "MEDIUM"
        status = "WARNING"
    else:
        level = "LOW"
        status = "ON_TRACK"

    return {
        "score": score,
        "level": level,
        "status": status,
        "variance": var,
        "cost_variance": cost_var,
        "factors": {
            "progress_variance_pts": var,
            "progress_score": round(progress_score, 1),
            "cost_overrun_cr": round(max(0, cost_var), 2),
            "cost_overrun_pct": cost_overrun_pct,
            "cost_score": round(cost_score, 1),
            "missed_milestones": 2 if var > 10 else 0,
            "milestone_score": milestone_score,
            "schedule_score": round(schedule_score, 1)
        }
    }

class SafeHTTPServer(http.server.HTTPServer):
    def server_bind(self):
        socketserver.TCPServer.server_bind(self)
        host, port = self.server_address
        self.server_name = str(host)
        self.server_port = port

class SIHRequestHandler(http.server.BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Health check
            if path == "/api/health":
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "healthy", "platform": "SIH 2026 Project Monitoring"}).encode())
                return

            # 2. Projects List
            elif path == "/api/projects":
                search = query.get("search", [None])[0]
                status_f = query.get("status", [None])[0]
                dept_f = query.get("department", [None])[0]
                risk_f = query.get("risk_level", [None])[0]

                sql = "SELECT * FROM projects WHERE 1=1"
                params = []

                if search:
                    sql += " AND (name LIKE ? OR project_id LIKE ? OR location LIKE ?)"
                    p_search = f"%{search}%"
                    params.extend([p_search, p_search, p_search])

                if status_f and status_f != "All":
                    sql += " AND status = ?"
                    params.append(status_f)

                if dept_f and dept_f != "All":
                    sql += " AND department = ?"
                    params.append(dept_f)

                if risk_f and risk_f != "All":
                    sql += " AND risk_level = ?"
                    params.append(risk_f)

                sql += " ORDER BY id DESC"
                cursor.execute(sql, params)
                rows = [dict(row) for row in cursor.fetchall()]

                self._set_headers(200)
                self.wfile.write(json.dumps(rows).encode())
                return

            # 3. Projects Map Data
            elif path == "/api/projects/map":
                cursor.execute("SELECT id, project_id, name, department, location, latitude, longitude, approved_budget, expenditure, physical_progress, planned_physical_progress, status, risk_score, risk_level FROM projects")
                rows = [dict(row) for row in cursor.fetchall()]
                self._set_headers(200)
                self.wfile.write(json.dumps(rows).encode())
                return

            # 4. Single Project Details
            elif path.startswith("/api/projects/") and path.count("/") == 3:
                proj_id = path.split("/")[-1]
                cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
                row = cursor.fetchone()
                if row:
                    self._set_headers(200)
                    self.wfile.write(json.dumps(dict(row)).encode())
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"detail": "Project not found"}).encode())
                return

            # 5. Project Progress History
            elif path.startswith("/api/projects/") and path.endswith("/progress"):
                proj_id = path.split("/")[3]
                cursor.execute("SELECT * FROM progress_updates WHERE project_id = ? ORDER BY month ASC", (proj_id,))
                rows = [dict(row) for row in cursor.fetchall()]
                self._set_headers(200)
                self.wfile.write(json.dumps(rows).encode())
                return

            # 6. Project Milestones
            elif path.startswith("/api/projects/") and path.endswith("/milestones"):
                proj_id = path.split("/")[3]
                cursor.execute("SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC", (proj_id,))
                rows = [dict(row) for row in cursor.fetchall()]
                self._set_headers(200)
                self.wfile.write(json.dumps(rows).encode())
                return

            # 7. Analytics Overview
            elif path == "/api/analytics/overview":
                dept = query.get("department", [None])[0]
                sql = "SELECT * FROM projects WHERE 1=1"
                params = []
                if dept and dept != "All":
                    sql += " AND department = ?"
                    params.append(dept)

                cursor.execute(sql, params)
                projects = [dict(r) for r in cursor.fetchall()]

                total_p = len(projects)
                total_budget = round(sum(p["approved_budget"] for p in projects), 2)
                total_exp = round(sum(p["expenditure"] for p in projects), 2)

                status_counts = {"ON_TRACK": 0, "WARNING": 0, "DELAYED": 0, "HIGH_RISK": 0}
                risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
                planned_vs_actual = []

                for p in projects:
                    status_counts[p["status"]] = status_counts.get(p["status"], 0) + 1
                    risk_counts[p["risk_level"]] = risk_counts.get(p["risk_level"], 0) + 1
                    planned_vs_actual.append({
                        "id": p["id"],
                        "project_id": p["project_id"],
                        "name": p["name"],
                        "planned": p["planned_physical_progress"],
                        "actual": p["physical_progress"],
                        "variance": round(p["planned_physical_progress"] - p["physical_progress"], 1),
                        "status": p["status"],
                        "budget": p["approved_budget"]
                    })

                resp = {
                    "kpis": {
                        "total_projects": total_p,
                        "on_track": status_counts["ON_TRACK"],
                        "warning": status_counts["WARNING"],
                        "delayed": status_counts["DELAYED"],
                        "at_risk": status_counts["HIGH_RISK"],
                        "total_budget": total_budget,
                        "total_expenditure": total_exp,
                        "remaining_budget": round(max(0, total_budget - total_exp), 2),
                        "overbudget_count": sum(1 for p in projects if p["expenditure"] > p["approved_budget"])
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
                    "department_breakdown": [
                        {"department": "MoRTH", "budget": 920.0, "expenditure": 940.0},
                        {"department": "Urban Dev", "budget": 1370.0, "expenditure": 1218.0},
                        {"department": "Jal Shakti", "budget": 350.0, "expenditure": 380.0},
                        {"department": "Railways", "budget": 850.0, "expenditure": 620.0}
                    ]
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(resp).encode())
                return

            # 8. Risk Engine Output
            elif path.startswith("/api/risk/project/"):
                proj_id = path.split("/")[-1]
                cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
                row = cursor.fetchone()
                if not row:
                    self._set_headers(404)
                    return

                p = dict(row)
                r_calc = calculate_risk(p)

                delay_days = int(max(0, r_calc["variance"] * 6 + (25 if r_calc["cost_variance"] > 0 else 0)))

                resp = {
                    "project_id": p["id"],
                    "project_code": p["project_id"],
                    "name": p["name"],
                    "explainable_risk": {
                        "score": r_calc["score"],
                        "level": r_calc["level"],
                        "status": r_calc["status"],
                        "factors": r_calc["factors"]
                    },
                    "ml_prediction": {
                        "predicted_delay_days": delay_days,
                        "predicted_risk_level": r_calc["level"],
                        "recommendation": "Deploy targeted field inspection. Conduct monthly cost audit and speed up procurement." if delay_days > 30 else "Project operating within acceptable parameters.",
                        "feature_importance": {
                            "Progress Variance": 0.35,
                            "Cost Overrun Ratio": 0.30,
                            "Missed Milestones": 0.20,
                            "Time Elapsed": 0.15
                        }
                    }
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(resp).encode())
                return

            # 9. Risk Portfolio Rankings
            elif path == "/api/risk/portfolio":
                cursor.execute("SELECT * FROM projects ORDER BY risk_score DESC")
                projects = [dict(r) for r in cursor.fetchall()]
                rankings = []
                for p in projects:
                    rankings.append({
                        "id": p["id"],
                        "project_id": p["project_id"],
                        "name": p["name"],
                        "department": p["department"],
                        "status": p["status"],
                        "risk_score": p["risk_score"],
                        "risk_level": p["risk_level"],
                        "physical_variance": round(p["planned_physical_progress"] - p["physical_progress"], 1),
                        "cost_overrun": round(p["expenditure"] - p["approved_budget"], 2)
                    })
                self._set_headers(200)
                self.wfile.write(json.dumps(rankings).encode())
                return

            # 10. Alerts Feed
            elif path == "/api/alerts":
                sev = query.get("severity", [None])[0]
                atype = query.get("alert_type", [None])[0]
                is_r = query.get("is_read", [None])[0]

                sql = "SELECT a.*, p.name as project_name FROM alerts a JOIN projects p ON a.project_id = p.id WHERE 1=1"
                params = []
                if sev and sev != "All":
                    sql += " AND a.severity = ?"
                    params.append(sev)
                if atype and atype != "All":
                    sql += " AND a.alert_type = ?"
                    params.append(atype)
                if is_r is not None:
                    sql += " AND a.is_read = ?"
                    params.append(1 if is_r.lower() == 'true' else 0)

                sql += " ORDER BY a.id DESC"
                cursor.execute(sql, params)
                alerts = []
                for row in cursor.fetchall():
                    d = dict(row)
                    d["is_read"] = bool(d["is_read"])
                    alerts.append(d)

                self._set_headers(200)
                self.wfile.write(json.dumps(alerts).encode())
                return

            # 11. Reports Preview & Download
            elif path in ["/api/reports/preview", "/api/reports/download"]:
                report_t = query.get("report_type", ["portfolio_summary"])[0]
                p_id = query.get("project_id", [None])[0]

                cursor.execute("SELECT * FROM projects")
                projects = [dict(r) for r in cursor.fetchall()]

                csv_lines = ["SIH 2026 PROJECT MONITORING PORTFOLIO SUMMARY REPORT"]
                csv_lines.append("Generated Date,2026-08-30")
                csv_lines.append("")
                csv_lines.append("Project ID,Name,Department,Budget (Cr),Expenditure (Cr),Planned %,Actual %,Variance,Status,Risk Level")

                for p in projects:
                    var = round(p["planned_physical_progress"] - p["physical_progress"], 1)
                    csv_lines.append(f"{p['project_id']},{p['name']},{p['department']},{p['approved_budget']},{p['expenditure']},{p['planned_physical_progress']},{p['physical_progress']},{var},{p['status']},{p['risk_level']}")

                raw_csv = "\n".join(csv_lines)

                if "download" in path:
                    self._set_headers(200, "text/csv")
                    self.wfile.write(raw_csv.encode())
                else:
                    self._set_headers(200)
                    self.wfile.write(json.dumps({"report_type": report_t, "raw_csv": raw_csv, "total_rows": len(projects)}).encode())
                return

            # 12. Settings Thresholds
            elif path == "/api/settings/thresholds":
                self._set_headers(200)
                self.wfile.write(json.dumps(THRESHOLDS).encode())
                return

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"detail": "Endpoint not found"}).encode())

        finally:
            conn.close()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        data = json.loads(body.decode('utf-8')) if body else {}

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Login
            if path == "/api/auth/login":
                email = data.get("email")
                pwd = data.get("password")

                cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
                user = cursor.fetchone()
                if user and user["password_hash"] == pwd:
                    u_dict = dict(user)
                    del u_dict["password_hash"]
                    self._set_headers(200)
                    self.wfile.write(json.dumps(u_dict).encode())
                else:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({"detail": "Invalid email or password"}).encode())
                return

            # 2. Create Project
            elif path == "/api/projects":
                cursor.execute("""
                INSERT INTO projects (project_id, name, department, implementing_agency, manager, category, location, latitude, longitude, approved_budget, start_date, expected_completion_date, description, status, risk_score, risk_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ON_TRACK', 10.0, 'LOW')
                """, (
                    data["project_id"], data["name"], data["department"], data["implementing_agency"],
                    data["manager"], data["category"], data["location"], data["latitude"], data["longitude"],
                    data["approved_budget"], data["start_date"], data["expected_completion_date"], data.get("description", "")
                ))
                conn.commit()
                new_id = cursor.lastrowid
                cursor.execute("SELECT * FROM projects WHERE id = ?", (new_id,))
                new_p = dict(cursor.fetchone())
                self._set_headers(201)
                self.wfile.write(json.dumps(new_p).encode())
                return

            # 3. Monthly Progress Update
            elif path.startswith("/api/projects/") and path.endswith("/progress"):
                proj_id = int(path.split("/")[3])
                month = data["month"]
                p_plan = float(data["planned_physical_progress"])
                p_act = float(data["actual_physical_progress"])
                f_plan = float(data.get("planned_financial_progress", 0))
                f_act = float(data.get("actual_financial_progress", 0))
                exp = float(data["expenditure"])
                remarks = data.get("remarks", "")

                cursor.execute("""
                INSERT INTO progress_updates (project_id, month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, expenditure, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (proj_id, month, p_plan, p_act, f_plan, f_act, exp, remarks))

                # Update project entity
                cursor.execute("SELECT * FROM projects WHERE id = ?", (proj_id,))
                p = dict(cursor.fetchone())
                p["planned_physical_progress"] = p_plan
                p["physical_progress"] = p_act
                p["expenditure"] = exp

                r_eval = calculate_risk(p)

                cursor.execute("""
                UPDATE projects SET planned_physical_progress = ?, physical_progress = ?, expenditure = ?, status = ?, risk_score = ?, risk_level = ? WHERE id = ?
                """, (p_plan, p_act, exp, r_eval["status"], r_eval["score"], r_eval["level"], proj_id))

                # Generate Smart Alert
                today_str = datetime.date.today().isoformat()
                if r_eval["variance"] >= 10.0:
                    cursor.execute("INSERT INTO alerts (project_id, alert_type, severity, message, date) VALUES (?, 'Progress Delay', 'HIGH', ?, ?)",
                                   (proj_id, f"Project '{p['name']}' is {r_eval['variance']} percentage points behind planned progress.", today_str))

                if r_eval["cost_variance"] > 0:
                    cursor.execute("INSERT INTO alerts (project_id, alert_type, severity, message, date) VALUES (?, 'Cost Overrun', 'CRITICAL', ?, ?)",
                                   (proj_id, f"Project '{p['name']}' has exceeded approved budget by ₹{r_eval['cost_variance']} Cr.", today_str))

                conn.commit()
                self._set_headers(201)
                self.wfile.write(json.dumps({"status": "success"}).encode())
                return

            # 4. Add Milestone
            elif path.startswith("/api/projects/") and path.endswith("/milestones"):
                proj_id = int(path.split("/")[3])
                cursor.execute("INSERT INTO milestones (project_id, name, due_date, description, status) VALUES (?, ?, ?, ?, ?)",
                               (proj_id, data["name"], data["due_date"], data.get("description", ""), data.get("status", "In Progress")))
                conn.commit()
                new_id = cursor.lastrowid
                cursor.execute("SELECT * FROM milestones WHERE id = ?", (new_id,))
                m = dict(cursor.fetchone())
                self._set_headers(201)
                self.wfile.write(json.dumps(m).encode())
                return

            # 5. Risk Predict Trigger
            elif path.startswith("/api/risk/project/") and path.endswith("/predict"):
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "success", "prediction": {"predicted_delay_days": 45, "predicted_risk_level": "HIGH"}}).encode())
                return

        finally:
            conn.close()

    def do_PUT(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        data = json.loads(body.decode('utf-8')) if body else {}

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Mark Alert as Read
            if path.startswith("/api/alerts/") and path.endswith("/read"):
                alert_id = path.split("/")[3]
                cursor.execute("UPDATE alerts SET is_read = 1 WHERE id = ?", (alert_id,))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "success"}).encode())
                return

            elif path == "/api/alerts/read-all":
                cursor.execute("UPDATE alerts SET is_read = 1")
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "success"}).encode())
                return

            # 2. Update Milestone Status
            elif path.startswith("/api/milestones/"):
                m_id = path.split("/")[-1]
                cursor.execute("UPDATE milestones SET status = ?, completion_date = ? WHERE id = ?",
                               (data.get("status"), data.get("completion_date"), m_id))
                conn.commit()
                cursor.execute("SELECT * FROM milestones WHERE id = ?", (m_id,))
                m = dict(cursor.fetchone())
                self._set_headers(200)
                self.wfile.write(json.dumps(m).encode())
                return

            # 3. Update Thresholds
            elif path == "/api/settings/thresholds":
                global THRESHOLDS
                THRESHOLDS.update(data)
                self._set_headers(200)
                self.wfile.write(json.dumps(THRESHOLDS).encode())
                return

        finally:
            conn.close()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        conn = get_db()
        cursor = conn.cursor()

        try:
            if path.startswith("/api/projects/"):
                proj_id = path.split("/")[-1]
                cursor.execute("DELETE FROM projects WHERE id = ?", (proj_id,))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"detail": "Project deleted"}).encode())
                return
        finally:
            conn.close()

def run(server_class=SafeHTTPServer, handler_class=SIHRequestHandler, port=PORT):
    server_address = ('127.0.0.1', port)
    httpd = server_class(server_address, handler_class)
    print(f"SIH 2026 Project Monitoring Backend API running on http://127.0.0.1:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
