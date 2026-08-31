// ============================================================
// api/lib/store.js
// In-memory data store seeded from static JSON.
// On Vercel, each cold start re-seeds from the JSON below.
// Write operations (POST/PUT/DELETE) persist within the same
// function instance but reset on cold start — acceptable for
// a prototype/demo deployment.
// ============================================================

let _data = null;

function getSeed() {
  // All project & user data from the original SQLite database
  return {
    users: [
      { id: 1, email: "admin@demo.com", password_hash: "admin123", full_name: "Admin Director (MoRTH)", role: "Admin", department: "Ministry of Road Transport & Highways", created_at: "2026-08-30 15:02:26" },
      { id: 2, email: "officer@demo.com", password_hash: "officer123", full_name: "Rajesh Sharma (Project Officer)", role: "Officer", department: "National Highways Authority of India", created_at: "2026-08-30 15:02:26" },
      { id: 3, email: "viewer@demo.com", password_hash: "viewer123", full_name: "Priya Patel (Auditor)", role: "Viewer", department: "Ministry of Finance", created_at: "2026-08-30 15:02:26" }
    ],
    projects: [
      { id: 1, project_id: "PRJ-NGP-001", name: "Nagpur Ring Road Expansion & Elevated Corridor", department: "Ministry of Road Transport & Highways", implementing_agency: "NHAI Nagpur Circle", manager: "Dr. Amit Deshmukh", category: "Transport", location: "Nagpur, Maharashtra", latitude: 21.1458, longitude: 79.0882, approved_budget: 500, expenditure: 530, physical_progress: 55, planned_physical_progress: 70, financial_progress: 82, planned_financial_progress: 75, start_date: "2024-01-15", expected_completion_date: "2026-12-31", status: "HIGH_RISK", risk_score: 84, risk_level: "CRITICAL", description: "32km ring road with 8km elevated corridor to decongest city traffic. Includes 4 interchanges and 2 rail over-bridges.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 2, project_id: "PRJ-MUM-002", name: "Mumbai Coastal Road Metro Extension", department: "Ministry of Urban Development", implementing_agency: "MMRDA", manager: "Kavita Nair", category: "Transport", location: "Mumbai, Maharashtra", latitude: 19.076, longitude: 72.8777, approved_budget: 850, expenditure: 620, physical_progress: 62, planned_physical_progress: 65, financial_progress: 55, planned_financial_progress: 60, start_date: "2023-08-01", expected_completion_date: "2027-03-31", status: "ON_TRACK", risk_score: 22, risk_level: "LOW", description: "18km coastal metro line with 12 underground stations and 2 sea tunnels along the Mumbai coastline.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 3, project_id: "PRJ-DEL-003", name: "Delhi Smart Water Supply Infrastructure", department: "Ministry of Jal Shakti", implementing_agency: "DJB Smart City Cell", manager: "Sunita Verma", category: "Water", location: "Delhi NCR", latitude: 28.7041, longitude: 77.1025, approved_budget: 350, expenditure: 380, physical_progress: 40, planned_physical_progress: 55, financial_progress: 72, planned_financial_progress: 65, start_date: "2024-03-01", expected_completion_date: "2026-09-30", status: "DELAYED", risk_score: 71, risk_level: "HIGH", description: "SCADA-integrated water network covering 14 zones of Delhi with 2800km pipeline replacement and 48 pressure monitoring nodes.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 4, project_id: "PRJ-BLR-004", name: "Bengaluru Outer Ring Road IT Flyover", department: "Ministry of Road Transport & Highways", implementing_agency: "KRDCL", manager: "Arjun Murthy", category: "Transport", location: "Bengaluru, Karnataka", latitude: 12.9716, longitude: 77.5946, approved_budget: 420, expenditure: 410, physical_progress: 78, planned_physical_progress: 75, financial_progress: 68, planned_financial_progress: 72, start_date: "2023-06-01", expected_completion_date: "2026-06-30", status: "ON_TRACK", risk_score: 18, risk_level: "LOW", description: "12-lane ORR expansion with 4 major flyovers at key IT junctions to reduce commute time.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 5, project_id: "PRJ-CHE-005", name: "Chennai Flood Resilience Stormwater Drain", department: "Ministry of Urban Development", implementing_agency: "CMDA", manager: "Meenakshi Krishnan", category: "Urban", location: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707, approved_budget: 280, expenditure: 195, physical_progress: 50, planned_physical_progress: 55, financial_progress: 48, planned_financial_progress: 55, start_date: "2024-01-10", expected_completion_date: "2026-11-30", status: "WARNING", risk_score: 38, risk_level: "MEDIUM", description: "Storm water drainage system spanning 210km across the Chennai metropolitan area.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 6, project_id: "PRJ-PUN-006", name: "Pune Heritage Metro Line Phase 2", department: "Ministry of Urban Development", implementing_agency: "PMRDA", manager: "Rahul Joshi", category: "Transport", location: "Pune, Maharashtra", latitude: 18.5204, longitude: 73.8567, approved_budget: 560, expenditure: 418, physical_progress: 45, planned_physical_progress: 48, financial_progress: 52, planned_financial_progress: 50, start_date: "2024-04-01", expected_completion_date: "2027-12-31", status: "ON_TRACK", risk_score: 20, risk_level: "LOW", description: "23km elevated metro connecting the heritage city centre to the new Hinjewadi IT Park.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 7, project_id: "PRJ-KOC-007", name: "Kochi Water Metro Phase 2", department: "Ministry of Jal Shakti", implementing_agency: "KMRL", manager: "Thomas Kurien", category: "Water", location: "Kochi, Kerala", latitude: 9.9312, longitude: 76.2673, approved_budget: 180, expenditure: 220, physical_progress: 22, planned_physical_progress: 45, financial_progress: 65, planned_financial_progress: 55, start_date: "2024-06-01", expected_completion_date: "2026-08-31", status: "HIGH_RISK", risk_score: 84, risk_level: "CRITICAL", description: "Expansion of Kochi's iconic water metro to 6 additional routes covering 38 terminal stations.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 8, project_id: "PRJ-GUW-009", name: "Guwahati Riverfront Flood Embankment", department: "Ministry of Jal Shakti", implementing_agency: "AUWSSB", manager: "Bidyut Hazarika", category: "Water", location: "Guwahati, Assam", latitude: 26.1445, longitude: 91.7362, approved_budget: 600, expenditure: 450, physical_progress: 48, planned_physical_progress: 50, financial_progress: 50, planned_financial_progress: 52, start_date: "2024-02-20", expected_completion_date: "2027-06-30", status: "ON_TRACK", risk_score: 15, risk_level: "LOW", description: "6km flood defense embankment with riverfront promenade and eco-tourism parks.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 9, project_id: "PRJ-HYD-011", name: "Hyderabad IT Corridor Elevated Skywalk", department: "Ministry of Urban Development", implementing_agency: "HMDA", manager: "Srinivas Rao", category: "Infrastructure", location: "Hyderabad, Telangana", latitude: 17.385, longitude: 78.4867, approved_budget: 120, expenditure: 118, physical_progress: 96, planned_physical_progress: 95, financial_progress: 97, planned_financial_progress: 98, start_date: "2023-11-01", expected_completion_date: "2026-09-15", status: "ON_TRACK", risk_score: 8, risk_level: "LOW", description: "Multi-tier pedestrian skywalk linking HITEC city metro station to major corporate tech parks.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" },
      { id: 10, project_id: "PRJ-JPR-008", name: "Jaipur Heritage Solar Street Lighting", department: "Ministry of New and Renewable Energy", implementing_agency: "REIL", manager: "Vikram Singh", category: "Energy", location: "Jaipur, Rajasthan", latitude: 26.9124, longitude: 75.7873, approved_budget: 210, expenditure: 195, physical_progress: 32, planned_physical_progress: 40, financial_progress: 42, planned_financial_progress: 45, start_date: "2024-05-10", expected_completion_date: "2026-12-15", status: "WARNING", risk_score: 42, risk_level: "MEDIUM", description: "Solar micro-grid setup and LED heritage lampposts across the Walled City of Jaipur.", created_at: "2026-08-30 15:02:26", updated_at: "2026-08-30 15:02:26" }
    ],
    progress: [
      { id: 1, project_id: 1, month: "2025-04", planned_physical_progress: 40, actual_physical_progress: 38, planned_financial_progress: 45, actual_financial_progress: 46, expenditure: 230, milestones_completed: 1, remarks: "Piling work completed.", created_at: "2026-08-30 15:02:26" },
      { id: 2, project_id: 1, month: "2025-05", planned_physical_progress: 50, actual_physical_progress: 44, planned_financial_progress: 55, actual_financial_progress: 58, expenditure: 310, milestones_completed: 1, remarks: "Delay due to steel supply bottlenecks.", created_at: "2026-08-30 15:02:26" },
      { id: 3, project_id: 1, month: "2025-06", planned_physical_progress: 60, actual_physical_progress: 48, planned_financial_progress: 65, actual_financial_progress: 70, expenditure: 420, milestones_completed: 1, remarks: "Rainfall slowed pier cap launching.", created_at: "2026-08-30 15:02:26" },
      { id: 4, project_id: 1, month: "2025-07", planned_physical_progress: 70, actual_physical_progress: 55, planned_financial_progress: 75, actual_financial_progress: 82, expenditure: 530, milestones_completed: 1, remarks: "Significant physical lag (15%) and budget overrun of ₹30 Cr.", created_at: "2026-08-30 15:02:26" }
    ],
    milestones: [
      { id: 1, project_id: 1, name: "Land Acquisition & Utility Shifting", description: "Utility clearance", due_date: "2024-06-30", completion_date: "2024-07-15", status: "Completed" },
      { id: 2, project_id: 1, name: "Elevated Corridor Pier Construction", description: "Piles & piers", due_date: "2025-01-31", completion_date: null, status: "Delayed" },
      { id: 3, project_id: 1, name: "Segment Launching & Girders", description: "Girder erection", due_date: "2025-06-30", completion_date: null, status: "Delayed" },
      { id: 4, project_id: 1, name: "Bituminous Paving & Lighting", description: "Final surfacing", due_date: "2026-10-31", completion_date: null, status: "Not Started" },
      { id: 5, project_id: 2, name: "Tunnelling & Viaduct Decking", description: "Civil works", due_date: "2024-12-31", completion_date: "2024-12-20", status: "Completed" },
      { id: 6, project_id: 2, name: "Station Structural Work", description: "Station fitting", due_date: "2025-08-31", completion_date: null, status: "In Progress" },
      { id: 7, project_id: 3, name: "Trunk Pipeline Trenching", description: "Trenching", due_date: "2024-09-30", completion_date: "2024-11-15", status: "Completed" },
      { id: 8, project_id: 3, name: "Water Pumping Station Installation", description: "Pump testing", due_date: "2025-03-31", completion_date: null, status: "Delayed" }
    ],
    alerts: [
      { id: 1, project_id: 1, alert_type: "Progress Delay", severity: "CRITICAL", message: "Project 'Nagpur Ring Road Expansion & Elevated Corridor' is 15 percentage points behind planned progress.", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" },
      { id: 2, project_id: 1, alert_type: "Cost Overrun", severity: "CRITICAL", message: "Project 'Nagpur Ring Road Expansion & Elevated Corridor' has exceeded approved budget by ₹30 Cr (6.0% overrun).", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" },
      { id: 3, project_id: 1, alert_type: "Missed Milestone", severity: "MEDIUM", message: "Project 'Nagpur Ring Road Expansion & Elevated Corridor' has 2 delayed milestone(s).", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" },
      { id: 4, project_id: 3, alert_type: "Progress Delay", severity: "HIGH", message: "Project 'Delhi Smart Water Supply Infrastructure' is 15 percentage points behind planned progress.", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" },
      { id: 5, project_id: 3, alert_type: "Cost Overrun", severity: "HIGH", message: "Project 'Delhi Smart Water Supply Infrastructure' has exceeded approved budget by ₹30 Cr.", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" },
      { id: 6, project_id: 7, alert_type: "High Risk", severity: "CRITICAL", message: "CRITICAL RISK WARNING: Risk score for 'Kochi Water Metro Phase 2' reached 84.0/100.", date: "2026-08-30", is_read: false, created_at: "2026-08-30 15:02:26" }
    ],
    _nextProjectId: 11,
    _nextMilestoneId: 9,
    _nextProgressId: 5,
    _nextAlertId: 7
  };
}

function getStore() {
  if (!_data) _data = getSeed();
  return _data;
}

module.exports = { getStore };
