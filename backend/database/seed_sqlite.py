import sqlite3
import os
import json
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sih_monitoring.db")

def init_and_seed_sqlite():
    print(f"Initializing SQLite database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop existing tables
    cursor.executescript("""
    DROP TABLE IF EXISTS alerts;
    DROP TABLE IF EXISTS risk_analysis;
    DROP TABLE IF EXISTS milestones;
    DROP TABLE IF EXISTS progress_updates;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Viewer',
        department TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        implementing_agency TEXT NOT NULL,
        manager TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        approved_budget REAL NOT NULL,
        expenditure REAL DEFAULT 0.0,
        physical_progress REAL DEFAULT 0.0,
        planned_physical_progress REAL DEFAULT 0.0,
        financial_progress REAL DEFAULT 0.0,
        planned_financial_progress REAL DEFAULT 0.0,
        start_date TEXT NOT NULL,
        expected_completion_date TEXT NOT NULL,
        status TEXT DEFAULT 'ON_TRACK',
        risk_score REAL DEFAULT 10.0,
        risk_level TEXT DEFAULT 'LOW',
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE progress_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        planned_physical_progress REAL NOT NULL,
        actual_physical_progress REAL NOT NULL,
        planned_financial_progress REAL NOT NULL,
        actual_financial_progress REAL NOT NULL,
        expenditure REAL NOT NULL,
        milestones_completed INTEGER DEFAULT 0,
        remarks TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        completion_date TEXT,
        status TEXT DEFAULT 'Not Started',
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE risk_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        score REAL NOT NULL,
        level TEXT NOT NULL,
        progress_variance REAL NOT NULL,
        cost_variance REAL NOT NULL,
        missed_milestones INTEGER NOT NULL,
        predicted_delay_days INTEGER DEFAULT 0,
        risk_factors_json TEXT NOT NULL,
        calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)

    # 1. Seed Users
    users = [
        ("admin@demo.com", "admin123", "Admin Director (MoRTH)", "Admin", "Ministry of Road Transport & Highways"),
        ("officer@demo.com", "officer123", "Rajesh Sharma (Project Officer)", "Officer", "National Highways Authority of India"),
        ("viewer@demo.com", "viewer123", "Priya Patel (Auditor)", "Viewer", "Ministry of Finance")
    ]
    cursor.executemany("INSERT INTO users (email, password_hash, full_name, role, department) VALUES (?, ?, ?, ?, ?)", users)

    # 2. Seed Projects
    projects = [
        ("PRJ-NGP-001", "Nagpur Ring Road Expansion & Elevated Corridor", "Ministry of Road Transport & Highways", "NHAI Nagpur Circle", "Dr. Amit Deshmukh", "Transport", "Nagpur, Maharashtra", 21.1458, 79.0882, 500.0, 530.0, 55.0, 70.0, 82.0, 75.0, "2024-01-15", "2026-12-31", "DELAYED", 82.0, "CRITICAL", "Construction of 4-lane outer ring road expansion with 8km elevated corridor connecting Hingna to Kamptee."),
        ("PRJ-MM-004", "Mumbai Metro Line 4 Extension", "Ministry of Urban Development", "MMRDA", "Sanjay Kapoor", "Metro Rail", "Mumbai, Maharashtra", 19.0760, 72.8777, 1250.0, 1100.0, 78.0, 80.0, 83.0, 85.0, "2023-06-01", "2026-09-30", "ON_TRACK", 18.0, "LOW", "32 km elevated metro corridor connecting Wadala to Kasarvadavali with 32 stations."),
        ("PRJ-DEL-009", "Delhi Smart Water Supply Infrastructure", "Jal Shakti Ministry", "Delhi Jal Board", "Anjali Verma", "Water Supply", "New Delhi", 28.6139, 77.2090, 350.0, 380.0, 50.0, 65.0, 78.0, 70.0, "2024-02-10", "2026-11-15", "DELAYED", 68.0, "HIGH", "24x7 automated pressurized water pipeline deployment and smart metering across East Delhi."),
        ("PRJ-BLR-012", "Bengaluru Suburban Railway Corridor 2", "Ministry of Railways", "K-RIDE", "K. R. Venkatesh", "Transport", "Bengaluru, Karnataka", 12.9716, 77.5946, 850.0, 620.0, 46.0, 60.0, 58.0, 65.0, "2024-03-01", "2027-03-31", "WARNING", 45.0, "MEDIUM", "25km suburban railway line connecting Baiyappanahalli to Chikkabanavara."),
        ("PRJ-VNS-003", "Varanasi Smart City Command Center", "Ministry of Housing & Urban Affairs", "Varanasi Smart City Ltd", "Ramanand Mishra", "Smart City", "Varanasi, Uttar Pradesh", 25.3176, 82.9739, 180.0, 172.0, 92.0, 90.0, 93.0, 92.0, "2023-09-15", "2026-10-31", "ON_TRACK", 12.0, "LOW", "Integrated traffic control, CCTV surveillance, and emergency response portal."),
        ("PRJ-AMD-007", "Ahmedabad BRTS Corridor Phase 3", "Ministry of Road Transport & Highways", "AJL", "Hardik Patel", "Transport", "Ahmedabad, Gujarat", 23.0225, 72.5714, 420.0, 410.0, 73.0, 75.0, 79.0, 80.0, "2024-01-05", "2026-08-30", "ON_TRACK", 22.0, "LOW", "Bus Rapid Transit system expansion across West Ahmedabad with electric bus charging depots."),
        ("PRJ-KOC-005", "Kochi Water Metro Phase 2", "Ministry of Ports, Shipping & Waterways", "KMRL", "Mathew Joseph", "Waterways", "Kochi, Kerala", 9.9312, 76.2673, 290.0, 315.0, 38.0, 55.0, 72.0, 60.0, "2024-04-12", "2027-01-20", "HIGH_RISK", 84.0, "CRITICAL", "Electric hybrid ferry network connecting 10 island routes with automated floating jetties."),
        ("PRJ-GHY-002", "Guwahati Brahmaputra Riverfront Corridor", "Ministry of Development of North Eastern Region", "GMDA", "Dipankar Barua", "Infrastructure", "Guwahati, Assam", 26.1445, 91.7362, 600.0, 450.0, 48.0, 50.0, 50.0, 52.0, "2024-02-20", "2027-06-30", "ON_TRACK", 15.0, "LOW", "6km flood defense embankment with riverfront promenade and eco-tourism parks."),
        ("PRJ-HYD-011", "Hyderabad IT Corridor Elevated Skywalk", "Ministry of Urban Development", "HMDA", "Srinivas Rao", "Infrastructure", "Hyderabad, Telangana", 17.3850, 78.4867, 120.0, 118.0, 96.0, 95.0, 97.0, 98.0, "2023-11-01", "2026-09-15", "ON_TRACK", 8.0, "LOW", "Multi-tier pedestrian skywalk linking HITEC city metro station to major corporate tech parks."),
        ("PRJ-JPR-008", "Jaipur Heritage Solar Street Lighting", "Ministry of New and Renewable Energy", "REIL", "Vikram Singh", "Energy", "Jaipur, Rajasthan", 26.9124, 75.7873, 210.0, 195.0, 32.0, 40.0, 42.0, 45.0, "2024-05-10", "2026-12-15", "WARNING", 42.0, "MEDIUM", "Solar micro-grid setup and LED heritage lampposts across the Walled City of Jaipur.")
    ]

    cursor.executemany("""
    INSERT INTO projects (project_id, name, department, implementing_agency, manager, category, location, latitude, longitude, approved_budget, expenditure, physical_progress, planned_physical_progress, financial_progress, planned_financial_progress, start_date, expected_completion_date, status, risk_score, risk_level, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, projects)

    # 3. Seed Milestones
    milestones = [
        (1, "Land Acquisition & Utility Shifting", "Utility clearance", "2024-06-30", "2024-07-15", "Completed"),
        (1, "Elevated Corridor Pier Construction", "Piles & piers", "2025-01-31", None, "Delayed"),
        (1, "Segment Launching & Girders", "Girder erection", "2025-06-30", None, "Delayed"),
        (1, "Bituminous Paving & Lighting", "Final surfacing", "2026-10-31", None, "Not Started"),
        (2, "Tunnelling & Viaduct Decking", "Civil works", "2024-12-31", "2024-12-20", "Completed"),
        (2, "Station Structural Work", "Station fitting", "2025-08-31", None, "In Progress"),
        (3, "Trunk Pipeline Trenching", "Trenching", "2024-09-30", "2024-11-15", "Completed"),
        (3, "Water Pumping Station Installation", "Pump testing", "2025-03-31", None, "Delayed")
    ]
    cursor.executemany("INSERT INTO milestones (project_id, name, description, due_date, completion_date, status) VALUES (?, ?, ?, ?, ?, ?)", milestones)

    # 4. Seed Monthly Progress History for Nagpur
    progress_updates = [
        (1, "2025-04", 40.0, 38.0, 45.0, 46.0, 230.0, 1, "Piling work completed."),
        (1, "2025-05", 50.0, 44.0, 55.0, 58.0, 310.0, 1, "Delay due to steel supply bottlenecks."),
        (1, "2025-06", 60.0, 48.0, 65.0, 70.0, 420.0, 1, "Rainfall slowed pier cap launching."),
        (1, "2025-07", 70.0, 55.0, 75.0, 82.0, 530.0, 1, "Significant physical lag (15%) and budget overrun of ₹30 Cr.")
    ]
    cursor.executemany("""
    INSERT INTO progress_updates (project_id, month, planned_physical_progress, actual_physical_progress, planned_financial_progress, actual_financial_progress, expenditure, milestones_completed, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, progress_updates)

    # 5. Seed Alerts
    today_str = datetime.date.today().isoformat()
    alerts = [
        (1, "Progress Delay", "CRITICAL", "Project 'Nagpur Ring Road Expansion & Elevated Corridor' is 15 percentage points behind planned progress.", today_str, 0),
        (1, "Cost Overrun", "CRITICAL", "Project 'Nagpur Ring Road Expansion & Elevated Corridor' has exceeded approved budget by ₹30 Cr (6.0% overrun).", today_str, 0),
        (1, "Missed Milestone", "MEDIUM", "Project 'Nagpur Ring Road Expansion & Elevated Corridor' has 2 delayed milestone(s).", today_str, 0),
        (3, "Progress Delay", "HIGH", "Project 'Delhi Smart Water Supply Infrastructure' is 15 percentage points behind planned progress.", today_str, 0),
        (3, "Cost Overrun", "HIGH", "Project 'Delhi Smart Water Supply Infrastructure' has exceeded approved budget by ₹30 Cr.", today_str, 0),
        (7, "High Risk", "CRITICAL", "CRITICAL RISK WARNING: Risk score for 'Kochi Water Metro Phase 2' reached 84.0/100.", today_str, 0)
    ]
    cursor.executemany("INSERT INTO alerts (project_id, alert_type, severity, message, date, is_read) VALUES (?, ?, ?, ?, ?, ?)", alerts)

    conn.commit()
    conn.close()
    print("SQLite database successfully initialized and seeded with demo infrastructure projects!")

if __name__ == "__main__":
    init_and_seed_sqlite()
