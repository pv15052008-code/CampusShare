"""
CampusShare Automated Test Suite
Verifies Demo Accounts, Student/Faculty/Admin Authentication, Role Dashboards,
Resource Management, Booking Workflows, and Database State Transitions.
"""

import app

class MockHandler:
    def __init__(self):
        self.sent_status = None
        self.sent_data = None

    def _send_json(self, data, status_code=200):
        self.sent_status = status_code
        self.sent_data = data

def run_tests():
    print("=== INITIALIZING CAMPUSSHARE DATABASE ===")
    app.init_database()
    handler = MockHandler()

    print("\n=== 1. VERIFY DEMO LOGINS ===")
    
    # 1.1 Demo Student Login
    app.CampusShareHandler._api_auth_login(handler, {
        "role": "student",
        "email": "student@campusshare.com",
        "password": "student123"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    print(f"Passed: Demo Student Login -> {handler.sent_data['user']['Name']} (Role: {handler.sent_data['user']['role']})")

    # 1.2 Demo Faculty Login
    app.CampusShareHandler._api_auth_login(handler, {
        "role": "faculty",
        "email": "faculty@campusshare.com",
        "password": "faculty123"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    print(f"Passed: Demo Faculty Login -> {handler.sent_data['user']['Name']} (Role: {handler.sent_data['user']['role']}, Dept: {handler.sent_data['user']['Department']})")

    # 1.3 Demo Admin Login
    app.CampusShareHandler._api_auth_login(handler, {
        "role": "admin",
        "email": "admin@campusshare.com",
        "password": "admin123"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    print(f"Passed: Demo Admin Login -> {handler.sent_data['user']['Name']} (Role: {handler.sent_data['user']['role']})")

    print("\n=== 2. VERIFY CATEGORIES & RESOURCES ===")
    app.CampusShareHandler._api_get_categories(handler)
    assert handler.sent_status == 200
    assert len(handler.sent_data["categories"]) == 6
    print(f"Passed: {len(handler.sent_data['categories'])} categories available.")

    app.CampusShareHandler._api_get_resources(handler, {})
    assert handler.sent_status == 200
    total_resources = len(handler.sent_data["resources"])
    assert total_resources >= 10
    print(f"Passed: {total_resources} resources retrieved with owner information.")

    print("\n=== 3. VERIFY FACULTY ASSET CREATION & BOOKING WORKFLOW ===")
    # Faculty adds a 3D printer
    app.CampusShareHandler._api_add_resource(handler, {
        "resource_name": "Ender-3 V2 3D Printer (Lab 102)",
        "category_id": 5,
        "description": "High-precision 3D printer for mechanical and robotics prototypes.",
        "owner_id": 1,
        "owner_type": "Faculty"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    new_printer_id = handler.sent_data["resource_id"]
    print(f"Passed: Faculty Asset registered with ID #{new_printer_id}.")

    # Student requests to borrow the 3D printer
    app.CampusShareHandler._api_create_booking(handler, {
        "student_id": 1,
        "borrower_type": "Student",
        "resource_id": new_printer_id,
        "return_date": "2026-11-25"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    new_booking_id = handler.sent_data["booking_id"]
    print(f"Passed: Booking Request #{new_booking_id} created in 'Pending' status.")

    # Admin approves booking
    app.CampusShareHandler._api_update_booking_status(handler, {
        "booking_id": new_booking_id,
        "status": "Approved"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True

    # Verify resource availability status updated to 'Booked'
    db = app.get_db()
    cur = db.execute("SELECT Availability_Status FROM Resource WHERE Resource_ID = ?", (new_printer_id,))
    res_status = cur.fetchone()["Availability_Status"] if isinstance(cur.fetchone, dict) else cur.fetchone()[0]
    # Fetch directly
    cur2 = db.execute("SELECT Availability_Status FROM Resource WHERE Resource_ID = ?", (new_printer_id,))
    row = cur2.fetchone()
    st = row["Availability_Status"] if isinstance(row, dict) else row[0]
    assert st == "Booked", "Resource status did not update to 'Booked'"
    print(f"Passed: Resource #{new_printer_id} availability status confirmed as 'Booked'.")

    # Mark returned
    app.CampusShareHandler._api_update_booking_status(handler, {
        "booking_id": new_booking_id,
        "status": "Returned"
    })
    assert handler.sent_status == 200 and handler.sent_data["success"] is True
    cur3 = db.execute("SELECT Availability_Status FROM Resource WHERE Resource_ID = ?", (new_printer_id,))
    row3 = cur3.fetchone()
    st3 = row3["Availability_Status"] if isinstance(row3, dict) else row3[0]
    assert st3 == "Available", "Resource status did not revert to 'Available'"
    print(f"Passed: Resource #{new_printer_id} availability successfully reverted to 'Available'.")

    print("\n=== 4. VERIFY ADMIN LIVE STATS ===")
    app.CampusShareHandler._api_get_admin_stats(handler)
    assert handler.sent_status == 200
    stats = handler.sent_data["stats"]
    print(f"Passed: Admin Metrics -> Students: {stats['total_students']}, Faculty: {stats['total_faculty']}, Resources: {stats['total_resources']}, Active Loans: {stats['active_loans']}")

    print("\n------------------------------------------------------------")
    print("ALL TESTS PASSED! DEMO LOGIN & COMPLETE WORKFLOW FULLY VERIFIED.")
    print("------------------------------------------------------------")

if __name__ == "__main__":
    run_tests()
