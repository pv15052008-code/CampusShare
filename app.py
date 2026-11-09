"""
CampusShare – Smart Campus Resource Sharing & Booking System
Backend Server (Pure Python Standard Library with Optional MySQL Support)

Features:
- Dual Database Engine: SQLite (Local) & MySQL (Cloud / Production)
- Full REST JSON API with CORS enabled for decoupled frontend/backend deployment
- Student, Faculty, and Admin authentication & role-based dashboards
- Automatic database initialization on startup
- Production-ready for Render, Heroku, Railway, or local execution
"""

import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
from datetime import date

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "campus_share.db")
SQL_SCRIPT_PATH = os.path.join(BASE_DIR, "database", "campus_share.sql")

# Database Mode: 'mysql' or 'sqlite'
DB_ENGINE = "sqlite"
if os.environ.get("DATABASE_TYPE") == "mysql" or os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_HOST") or os.environ.get("MYSQLHOST"):
    try:
        import pymysql
        import pymysql.cursors
        DB_ENGINE = "mysql"
    except ImportError:
        DB_ENGINE = "sqlite"


class DBWrapper:
    """Unified wrapper providing consistent API across SQLite and MySQL."""
    def __init__(self):
        self.engine = DB_ENGINE
        if self.engine == "mysql":
            import pymysql
            import pymysql.cursors
            
            db_url = os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_URL")
            if db_url:
                parsed = urllib.parse.urlparse(db_url)
                self.conn = pymysql.connect(
                    host=parsed.hostname,
                    port=parsed.port or 3306,
                    user=parsed.username,
                    password=parsed.password,
                    database=parsed.path.lstrip("/"),
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=True
                )
            else:
                self.conn = pymysql.connect(
                    host=os.environ.get("MYSQL_HOST") or os.environ.get("MYSQLHOST", "localhost"),
                    port=int(os.environ.get("MYSQL_PORT") or os.environ.get("MYSQLPORT", 3306)),
                    user=os.environ.get("MYSQL_USER") or os.environ.get("MYSQLUSER", "root"),
                    password=os.environ.get("MYSQL_PASSWORD") or os.environ.get("MYSQLPASSWORD", ""),
                    database=os.environ.get("MYSQL_DATABASE") or os.environ.get("MYSQLDATABASE", "campusshare"),
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=True
                )
        else:
            self.conn = sqlite3.connect(DB_PATH)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON;")

    def execute(self, query, params=None):
        params = params or []
        cur = self.conn.cursor()
        if self.engine == "mysql":
            # Convert SQLite '?' placeholders to MySQL '%s' placeholders
            mysql_query = query.replace("?", "%s")
            cur.execute(mysql_query, params)
        else:
            cur.execute(query, params)
        return cur

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    return DBWrapper()


def init_database():
    """Initializes the database if it doesn't exist or is empty."""
    os.makedirs(os.path.join(BASE_DIR, "database"), exist_ok=True)
    if DB_ENGINE == "sqlite":
        conn = sqlite3.connect(DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Student'")
        if not cursor.fetchone():
            print("[DB] Initializing CampusShare SQLite database from SQL script...")
            with open(SQL_SCRIPT_PATH, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
            print("[DB] SQLite database initialized successfully.")
        conn.close()
    else:
        print("[DB] Operating in MySQL Cloud Mode.")


class CampusShareHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP Request Handler for API Endpoints and Static Pages."""

    def _send_json(self, data, status_code=200):
        response_bytes = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        # Universal CORS headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()
        self.wfile.write(response_bytes)

    def _read_body_json(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                return {}
            body = self.rfile.read(content_length).decode("utf-8")
            return json.loads(body)
        except Exception:
            return {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()

    # --------------------------------------------------------
    # GET ROUTER
    # --------------------------------------------------------
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        params = urllib.parse.parse_qs(parsed_url.query)

        # Route Pages
        if path in ["/", "/index", "/index.html"]:
            return self._serve_template("index.html")
        elif path in ["/dashboard", "/dashboard.html"]:
            return self._serve_template("dashboard.html")
        elif path in ["/faculty", "/faculty.html"]:
            return self._serve_template("faculty.html")
        elif path in ["/admin", "/admin.html"]:
            return self._serve_template("admin.html")

        # Route Static Files
        if path.startswith("/static/"):
            file_path = os.path.join(BASE_DIR, path.lstrip("/"))
            if os.path.isfile(file_path):
                return self._serve_file(file_path)

        # ----------------- REST API Endpoints -----------------
        if path == "/api/categories":
            return self._api_get_categories()
        elif path == "/api/resources":
            return self._api_get_resources(params)
        elif path == "/api/bookings":
            return self._api_get_bookings(params)
        elif path == "/api/admin/stats":
            return self._api_get_admin_stats()
        elif path == "/api/students":
            return self._api_get_students()
        elif path == "/api/faculty":
            return self._api_get_faculty()
        elif path == "/api/health":
            return self._send_json({"status": "healthy", "engine": DB_ENGINE, "service": "CampusShare API"})

        self._send_json({"error": "Resource not found"}, 404)

    # --------------------------------------------------------
    # POST ROUTER
    # --------------------------------------------------------
    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self._read_body_json()

        if path == "/api/auth/login":
            return self._api_auth_login(body)
        elif path == "/api/auth/register":
            return self._api_auth_register(body)
        elif path == "/api/resources":
            return self._api_add_resource(body)
        elif path == "/api/bookings":
            return self._api_create_booking(body)
        elif path == "/api/bookings/status":
            return self._api_update_booking_status(body)

        self._send_json({"error": "Invalid API endpoint"}, 404)

    # --------------------------------------------------------
    # DELETE ROUTER
    # --------------------------------------------------------
    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/resources/"):
            resource_id = path.split("/")[-1]
            return self._api_delete_resource(resource_id)

        self._send_json({"error": "Invalid API endpoint"}, 404)

    # --------------------------------------------------------
    # TEMPLATE & FILE SERVING HELPERS
    # --------------------------------------------------------
    def _serve_template(self, filename):
        file_path = os.path.join(BASE_DIR, "templates", filename)
        if not os.path.isfile(file_path):
            self.send_error(404, f"Template {filename} not found")
            return
        with open(file_path, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _serve_file(self, file_path):
        mime = "text/plain"
        if file_path.endswith(".css"):
            mime = "text/css"
        elif file_path.endswith(".js"):
            mime = "application/javascript"
        elif file_path.endswith(".png"):
            mime = "image/png"
        elif file_path.endswith(".jpg") or file_path.endswith(".jpeg"):
            mime = "image/jpeg"
        elif file_path.endswith(".svg"):
            mime = "image/svg+xml"

        with open(file_path, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    # --------------------------------------------------------
    # API HANDLERS (SQL OPERATIONS)
    # --------------------------------------------------------
    def _api_get_categories(self):
        db = get_db()
        cur = db.execute("SELECT * FROM Category ORDER BY Category_ID")
        categories = [dict(r) for r in cur.fetchall()]
        db.close()
        self._send_json({"success": True, "categories": categories})

    def _api_get_resources(self, params):
        search = params.get("search", [""])[0].strip()
        category_id = params.get("category_id", [""])[0].strip()
        status = params.get("status", [""])[0].strip()

        query = """
            SELECT 
                R.Resource_ID,
                R.Resource_Name,
                R.Description,
                R.Availability_Status,
                R.Category_ID,
                C.Category_Name,
                R.Owner_ID,
                R.Owner_Type,
                COALESCE(F.Name, S.Name, 'Campus Admin') AS Owner_Name,
                COALESCE(F.Email, S.Email, 'admin@campusshare.com') AS Owner_Email
            FROM Resource R
            INNER JOIN Category C ON R.Category_ID = C.Category_ID
            LEFT JOIN Student S ON (R.Owner_ID = S.Student_ID AND R.Owner_Type = 'Student')
            LEFT JOIN Faculty F ON (R.Owner_ID = F.Faculty_ID AND R.Owner_Type = 'Faculty')
            WHERE 1=1
        """
        sql_params = []

        if search:
            query += " AND (R.Resource_Name LIKE ? OR R.Description LIKE ?)"
            sql_params.extend([f"%{search}%", f"%{search}%"])
        if category_id:
            query += " AND R.Category_ID = ?"
            sql_params.append(category_id)
        if status:
            query += " AND R.Availability_Status = ?"
            sql_params.append(status)

        query += " ORDER BY R.Resource_ID DESC"

        db = get_db()
        cur = db.execute(query, sql_params)
        resources = [dict(r) for r in cur.fetchall()]
        db.close()
        self._send_json({"success": True, "resources": resources})

    def _api_get_bookings(self, params):
        student_id = params.get("student_id", [""])[0].strip()
        borrower_type = params.get("borrower_type", ["Student"])[0].strip()

        query = """
            SELECT 
                B.Booking_ID,
                B.Student_ID,
                B.Borrower_Type,
                COALESCE(F.Name, S.Name) AS Student_Name,
                COALESCE(F.Email, S.Email) AS Student_Email,
                COALESCE(F.Department, S.Branch) AS Student_Branch,
                B.Resource_ID,
                R.Resource_Name,
                R.Availability_Status AS Resource_Availability,
                C.Category_Name,
                B.Booking_Date,
                B.Return_Date,
                B.Booking_Status
            FROM Booking B
            LEFT JOIN Student S ON (B.Student_ID = S.Student_ID AND B.Borrower_Type = 'Student')
            LEFT JOIN Faculty F ON (B.Student_ID = F.Faculty_ID AND B.Borrower_Type = 'Faculty')
            INNER JOIN Resource R ON B.Resource_ID = R.Resource_ID
            INNER JOIN Category C ON R.Category_ID = C.Category_ID
        """
        sql_params = []
        if student_id:
            query += " WHERE B.Student_ID = ? AND B.Borrower_Type = ?"
            sql_params.extend([student_id, borrower_type])

        query += " ORDER BY B.Booking_ID DESC"

        db = get_db()
        cur = db.execute(query, sql_params)
        bookings = [dict(r) for r in cur.fetchall()]
        db.close()
        self._send_json({"success": True, "bookings": bookings})

    def _api_get_admin_stats(self):
        db = get_db()
        total_students = db.execute("SELECT COUNT(*) FROM Student").fetchone()
        t_students = total_students["COUNT(*)"] if isinstance(total_students, dict) else total_students[0]

        total_faculty = db.execute("SELECT COUNT(*) FROM Faculty").fetchone()
        t_faculty = total_faculty["COUNT(*)"] if isinstance(total_faculty, dict) else total_faculty[0]

        total_resources = db.execute("SELECT COUNT(*) FROM Resource").fetchone()
        t_resources = total_resources["COUNT(*)"] if isinstance(total_resources, dict) else total_resources[0]

        pending_bookings = db.execute("SELECT COUNT(*) FROM Booking WHERE Booking_Status = 'Pending'").fetchone()
        t_pending = pending_bookings["COUNT(*)"] if isinstance(pending_bookings, dict) else pending_bookings[0]

        active_loans = db.execute("SELECT COUNT(*) FROM Booking WHERE Booking_Status = 'Approved'").fetchone()
        t_active = active_loans["COUNT(*)"] if isinstance(active_loans, dict) else active_loans[0]

        cat_stats = db.execute("""
            SELECT C.Category_Name, COUNT(R.Resource_ID) AS Total
            FROM Category C
            LEFT JOIN Resource R ON C.Category_ID = R.Category_ID
            GROUP BY C.Category_ID, C.Category_Name
        """).fetchall()

        db.close()
        self._send_json({
            "success": True,
            "stats": {
                "total_students": t_students,
                "total_faculty": t_faculty,
                "total_resources": t_resources,
                "pending_bookings": t_pending,
                "active_loans": t_active,
                "categories": [dict(c) for c in cat_stats]
            }
        })

    def _api_get_students(self):
        db = get_db()
        cur = db.execute("SELECT Student_ID, Name, Email, Branch, Year FROM Student ORDER BY Student_ID")
        students = [dict(r) for r in cur.fetchall()]
        db.close()
        self._send_json({"success": True, "students": students})

    def _api_get_faculty(self):
        db = get_db()
        cur = db.execute("SELECT Faculty_ID, Name, Email, Department, Designation FROM Faculty ORDER BY Faculty_ID")
        faculty_list = [dict(r) for r in cur.fetchall()]
        db.close()
        self._send_json({"success": True, "faculty": faculty_list})

    def _api_auth_login(self, body):
        role = body.get("role", "student").lower()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "").strip()

        if not email or not password:
            return self._send_json({"success": False, "message": "Email and password are required"}, 400)

        db = get_db()
        if role == "admin":
            cur = db.execute("SELECT * FROM Admin WHERE LOWER(Email) = ? AND Password = ?", (email, password))
            row = cur.fetchone()
            if row:
                user = dict(row)
                del user["Password"]
                user["role"] = "admin"
                db.close()
                return self._send_json({"success": True, "user": user})
        elif role == "faculty":
            cur = db.execute("SELECT * FROM Faculty WHERE LOWER(Email) = ? AND Password = ?", (email, password))
            row = cur.fetchone()
            if row:
                user = dict(row)
                del user["Password"]
                user["role"] = "faculty"
                db.close()
                return self._send_json({"success": True, "user": user})
        else: # student
            cur = db.execute("SELECT * FROM Student WHERE LOWER(Email) = ? AND Password = ?", (email, password))
            row = cur.fetchone()
            if row:
                user = dict(row)
                del user["Password"]
                user["role"] = "student"
                db.close()
                return self._send_json({"success": True, "user": user})

        db.close()
        return self._send_json({"success": False, "message": "Invalid email or password"}, 401)

    def _api_auth_register(self, body):
        role = body.get("role", "student")
        name = body.get("name", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "").strip()

        if role == "faculty":
            department = body.get("department", "").strip()
            designation = body.get("designation", "Assistant Professor").strip()
            if not all([name, email, password, department]):
                return self._send_json({"success": False, "message": "All fields are required"}, 400)

            db = get_db()
            try:
                cur = db.execute("""
                    INSERT INTO Faculty (Name, Email, Password, Department, Designation)
                    VALUES (?, ?, ?, ?, ?)
                """, (name, email, password, department, designation))
                db.commit()
                new_id = cur.lastrowid
                db.close()
                return self._send_json({"success": True, "message": "Faculty registered successfully!", "faculty_id": new_id})
            except Exception as e:
                db.close()
                return self._send_json({"success": False, "message": "A user with this email already exists."}, 400)
        else:
            branch = body.get("branch", "").strip()
            year = body.get("year")
            if not all([name, email, password, branch, year]):
                return self._send_json({"success": False, "message": "All fields are required"}, 400)

            try:
                year = int(year)
                if year < 1 or year > 4:
                    return self._send_json({"success": False, "message": "Year must be between 1 and 4"}, 400)
            except ValueError:
                return self._send_json({"success": False, "message": "Invalid academic year"}, 400)

            db = get_db()
            try:
                cur = db.execute("""
                    INSERT INTO Student (Name, Email, Password, Branch, Year)
                    VALUES (?, ?, ?, ?, ?)
                """, (name, email, password, branch, year))
                db.commit()
                new_id = cur.lastrowid
                db.close()
                return self._send_json({"success": True, "message": "Student registered successfully! You can now log in.", "student_id": new_id})
            except Exception as e:
                db.close()
                return self._send_json({"success": False, "message": "A user with this email already exists."}, 400)

    def _api_add_resource(self, body):
        name = body.get("resource_name", "").strip()
        category_id = body.get("category_id")
        description = body.get("description", "").strip()
        owner_id = body.get("owner_id")
        owner_type = body.get("owner_type", "Student")

        if not name or not category_id or not owner_id:
            return self._send_json({"success": False, "message": "Name, Category, and Owner are required"}, 400)

        db = get_db()
        try:
            cur = db.execute("""
                INSERT INTO Resource (Resource_Name, Category_ID, Description, Owner_ID, Owner_Type, Availability_Status)
                VALUES (?, ?, ?, ?, ?, 'Available')
            """, (name, int(category_id), description, int(owner_id), owner_type))
            db.commit()
            new_id = cur.lastrowid
            db.close()
            return self._send_json({"success": True, "message": "Resource added successfully!", "resource_id": new_id})
        except Exception as e:
            db.close()
            return self._send_json({"success": False, "message": str(e)}, 500)

    def _api_create_booking(self, body):
        student_id = body.get("student_id")
        borrower_type = body.get("borrower_type", "Student")
        resource_id = body.get("resource_id")
        return_date = body.get("return_date")
        booking_date = body.get("booking_date") or str(date.today())

        if not student_id or not resource_id or not return_date:
            return self._send_json({"success": False, "message": "Missing required booking details"}, 400)

        if return_date < booking_date:
            return self._send_json({"success": False, "message": "Return date cannot be earlier than booking date"}, 400)

        db = get_db()
        try:
            cur = db.execute("SELECT Availability_Status, Owner_ID, Owner_Type FROM Resource WHERE Resource_ID = ?", (resource_id,))
            res = cur.fetchone()
            if not res:
                db.close()
                return self._send_json({"success": False, "message": "Resource does not exist"}, 404)

            status = res["Availability_Status"] if isinstance(res, dict) else res[0]
            owner_id = res["Owner_ID"] if isinstance(res, dict) else res[1]
            owner_type = res["Owner_Type"] if isinstance(res, dict) else res[2]

            if status != "Available":
                db.close()
                return self._send_json({"success": False, "message": f"Resource is currently {status}"}, 400)

            if int(owner_id) == int(student_id) and owner_type == borrower_type:
                db.close()
                return self._send_json({"success": False, "message": "You cannot book your own shared resource."}, 400)

            cur2 = db.execute("""
                INSERT INTO Booking (Student_ID, Borrower_Type, Resource_ID, Booking_Date, Return_Date, Booking_Status)
                VALUES (?, ?, ?, ?, ?, 'Pending')
            """, (int(student_id), borrower_type, int(resource_id), booking_date, return_date))
            db.commit()
            booking_id = cur2.lastrowid
            db.close()
            return self._send_json({
                "success": True,
                "message": "Booking request submitted successfully! Awaiting approval.",
                "booking_id": booking_id
            })
        except Exception as e:
            db.close()
            return self._send_json({"success": False, "message": str(e)}, 500)

    def _api_update_booking_status(self, body):
        booking_id = body.get("booking_id")
        new_status = body.get("status")

        if not booking_id or new_status not in ["Approved", "Rejected", "Returned"]:
            return self._send_json({"success": False, "message": "Invalid booking ID or status"}, 400)

        db = get_db()
        try:
            cur = db.execute("SELECT Resource_ID, Booking_Status FROM Booking WHERE Booking_ID = ?", (booking_id,))
            booking = cur.fetchone()
            if not booking:
                db.close()
                return self._send_json({"success": False, "message": "Booking not found"}, 404)

            resource_id = booking["Resource_ID"] if isinstance(booking, dict) else booking[0]

            db.execute("UPDATE Booking SET Booking_Status = ? WHERE Booking_ID = ?", (new_status, booking_id))

            if new_status == "Approved":
                db.execute("UPDATE Resource SET Availability_Status = 'Booked' WHERE Resource_ID = ?", (resource_id,))
            elif new_status in ["Returned", "Rejected"]:
                active = db.execute("""
                    SELECT COUNT(*) FROM Booking 
                    WHERE Resource_ID = ? AND Booking_Status = 'Approved' AND Booking_ID != ?
                """, (resource_id, booking_id)).fetchone()
                active_count = active["COUNT(*)"] if isinstance(active, dict) else active[0]
                if active_count == 0:
                    db.execute("UPDATE Resource SET Availability_Status = 'Available' WHERE Resource_ID = ?", (resource_id,))

            db.commit()
            db.close()
            return self._send_json({"success": True, "message": f"Booking marked as {new_status}."})
        except Exception as e:
            db.close()
            return self._send_json({"success": False, "message": str(e)}, 500)

    def _api_delete_resource(self, resource_id):
        db = get_db()
        try:
            db.execute("DELETE FROM Resource WHERE Resource_ID = ?", (resource_id,))
            db.commit()
            db.close()
            return self._send_json({"success": True, "message": "Resource deleted successfully."})
        except Exception as e:
            db.close()
            return self._send_json({"success": False, "message": str(e)}, 500)


def run_server():
    init_database()
    server_address = ("", PORT)
    httpd = socketserver.TCPServer(server_address, CampusShareHandler)
    print(f"==================================================")
    print(f" CampusShare Server is running in [{DB_ENGINE.upper()}] Mode!")
    print(f" Local URL: http://localhost:{PORT}")
    print(f" Press Ctrl+C in terminal to stop.")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
