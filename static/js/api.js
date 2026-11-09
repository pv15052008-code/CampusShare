/* ============================================================
   CampusShare – Dual Architecture API & Client-Side Engine
   File: static/js/api.js
   
   Provides:
   1. Direct REST communication with live backend (Render / Local).
   2. Automatic Client-Side Database Engine fallback for permanent
      zero-server hosting (GitHub Pages / Vercel Static).
   ============================================================ */

window.CAMPUS_API_BASE = (function() {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  const stored = localStorage.getItem("CAMPUS_API_URL");
  if (stored) return stored.replace(/\/$/, "");
  return "";
})();

// In-Memory & LocalStorage Relational Store
const DEFAULT_STORE = {
  categories: [
    { Category_ID: 1, Category_Name: "Laptops & Computing" },
    { Category_ID: 2, Category_Name: "Cameras & Media" },
    { Category_ID: 3, Category_Name: "Projectors & AV" },
    { Category_ID: 4, Category_Name: "Books & Reference" },
    { Category_ID: 5, Category_Name: "Lab Equipment & Kits" },
    { Category_ID: 6, Category_Name: "Study & Discussion Rooms" }
  ],
  students: [
    { Student_ID: 1, Name: "Demo Student", Email: "student@campusshare.com", Password: "student123", Branch: "Computer Science", Year: 3 },
    { Student_ID: 2, Name: "Aarav Sharma", Email: "aarav.sharma@campus.edu", Password: "student123", Branch: "Computer Science", Year: 3 },
    { Student_ID: 3, Name: "Priya Patel", Email: "priya.patel@campus.edu", Password: "student123", Branch: "Electronics & Comm", Year: 4 },
    { Student_ID: 4, Name: "Rohan Verma", Email: "rohan.verma@campus.edu", Password: "student123", Branch: "Mechanical Engg", Year: 2 },
    { Student_ID: 5, Name: "Ananya Iyer", Email: "ananya.iyer@campus.edu", Password: "student123", Branch: "Information Tech", Year: 3 }
  ],
  faculty: [
    { Faculty_ID: 1, Name: "Demo Faculty", Email: "faculty@campusshare.com", Password: "faculty123", Department: "Computer Science", Designation: "Associate Professor" },
    { Faculty_ID: 2, Name: "Dr. Sunita Rao", Email: "sunita.rao@campus.edu", Password: "faculty123", Department: "Electronics & Comm", Designation: "Professor" }
  ],
  admins: [
    { Admin_ID: 1, Name: "Demo Admin", Email: "admin@campusshare.com", Password: "admin123" },
    { Admin_ID: 2, Name: "Prof. S. K. Gupta", Email: "admin@campus.edu", Password: "admin123" }
  ],
  resources: [
    { Resource_ID: 1, Resource_Name: "Dell Inspiron 15 (16GB RAM, i7)", Category_ID: 1, Category_Name: "Laptops & Computing", Description: "High-performance laptop suitable for programming, CAD, and simulations.", Owner_ID: 1, Owner_Type: "Student", Owner_Name: "Demo Student", Owner_Email: "student@campusshare.com", Availability_Status: "Available" },
    { Resource_ID: 2, Resource_Name: "Canon EOS 1500D DSLR Camera", Category_ID: 2, Category_Name: "Cameras & Media", Description: "24.1 MP DSLR with 18-55mm lens and tripod, ideal for college media events.", Owner_ID: 2, Owner_Type: "Student", Owner_Name: "Aarav Sharma", Owner_Email: "aarav.sharma@campus.edu", Availability_Status: "Booked" },
    { Resource_ID: 3, Resource_Name: "Epson Full HD Projector (EB-FH06)", Category_ID: 3, Category_Name: "Projectors & AV", Description: "3500 lumens bright display projector with HDMI & VGA cables.", Owner_ID: 1, Owner_Type: "Faculty", Owner_Name: "Demo Faculty", Owner_Email: "faculty@campusshare.com", Availability_Status: "Available" },
    { Resource_ID: 4, Resource_Name: "Database System Concepts (Korth, 7th Ed)", Category_ID: 4, Category_Name: "Books & Reference", Description: "Standard reference book for Database Management Systems coursework.", Owner_ID: 1, Owner_Type: "Student", Owner_Name: "Demo Student", Owner_Email: "student@campusshare.com", Availability_Status: "Available" },
    { Resource_ID: 5, Resource_Name: "Arduino Complete Starter Kit", Category_ID: 5, Category_Name: "Lab Equipment & Kits", Description: "Includes Arduino Uno board, breadboard, sensors, jumper wires, and LEDs.", Owner_ID: 3, Owner_Type: "Student", Owner_Name: "Priya Patel", Owner_Email: "priya.patel@campus.edu", Availability_Status: "Booked" },
    { Resource_ID: 6, Resource_Name: "Digital Storage Oscilloscope (50 MHz)", Category_ID: 5, Category_Name: "Lab Equipment & Kits", Description: "Dual-channel lab equipment for electronics and circuit troubleshooting.", Owner_ID: 2, Owner_Type: "Faculty", Owner_Name: "Dr. Sunita Rao", Owner_Email: "sunita.rao@campus.edu", Availability_Status: "Maintenance" },
    { Resource_ID: 7, Resource_Name: "Discussion Room 204 (Whiteboard & AC)", Category_ID: 6, Category_Name: "Study & Discussion Rooms", Description: "Group study room with seating for 6 students, projector, and high-speed Wi-Fi.", Owner_ID: 1, Owner_Type: "Faculty", Owner_Name: "Demo Faculty", Owner_Email: "faculty@campusshare.com", Availability_Status: "Available" },
    { Resource_ID: 8, Resource_Name: "Sony Alpha A6400 Mirrorless Camera", Category_ID: 2, Category_Name: "Cameras & Media", Description: "Compact 4K camera with 16-50mm power zoom lens for tech club coverage.", Owner_ID: 5, Owner_Type: "Student", Owner_Name: "Ananya Iyer", Owner_Email: "ananya.iyer@campus.edu", Availability_Status: "Available" },
    { Resource_ID: 9, Resource_Name: "NVIDIA Jetson Nano Developer Kit", Category_ID: 5, Category_Name: "Lab Equipment & Kits", Description: "AI/ML embedded computing board for robotics and computer vision research.", Owner_ID: 1, Owner_Type: "Faculty", Owner_Name: "Demo Faculty", Owner_Email: "faculty@campusshare.com", Availability_Status: "Available" },
    { Resource_ID: 10, Resource_Name: "MacBook Air M2 (16GB, 512GB)", Category_ID: 1, Category_Name: "Laptops & Computing", Description: "Apple Silicon laptop for iOS app development and UI/UX design workshops.", Owner_ID: 1, Owner_Type: "Faculty", Owner_Name: "Demo Faculty", Owner_Email: "faculty@campusshare.com", Availability_Status: "Available" }
  ],
  bookings: [
    { Booking_ID: 1, Student_ID: 4, Borrower_Type: "Student", Student_Name: "Rohan Verma", Student_Email: "rohan.verma@campus.edu", Student_Branch: "Mechanical Engg", Resource_ID: 2, Resource_Name: "Canon EOS 1500D DSLR Camera", Category_Name: "Cameras & Media", Booking_Date: "2026-11-01", Return_Date: "2026-11-05", Booking_Status: "Returned" },
    { Booking_ID: 2, Student_ID: 5, Borrower_Type: "Student", Student_Name: "Ananya Iyer", Student_Email: "ananya.iyer@campus.edu", Student_Branch: "Information Tech", Resource_ID: 2, Resource_Name: "Canon EOS 1500D DSLR Camera", Category_Name: "Cameras & Media", Booking_Date: "2026-11-08", Return_Date: "2026-11-12", Booking_Status: "Approved" },
    { Booking_ID: 3, Student_ID: 2, Borrower_Type: "Student", Student_Name: "Aarav Sharma", Student_Email: "aarav.sharma@campus.edu", Student_Branch: "Computer Science", Resource_ID: 5, Resource_Name: "Arduino Complete Starter Kit", Category_Name: "Lab Equipment & Kits", Booking_Date: "2026-11-07", Return_Date: "2026-11-10", Booking_Status: "Approved" },
    { Booking_ID: 4, Student_ID: 1, Borrower_Type: "Student", Student_Name: "Demo Student", Student_Email: "student@campusshare.com", Student_Branch: "Computer Science", Resource_ID: 3, Resource_Name: "Epson Full HD Projector (EB-FH06)", Category_Name: "Projectors & AV", Booking_Date: "2026-11-09", Return_Date: "2026-11-14", Booking_Status: "Pending" },
    { Booking_ID: 5, Student_ID: 1, Borrower_Type: "Faculty", Student_Name: "Demo Faculty", Student_Email: "faculty@campusshare.com", Student_Branch: "Computer Science", Resource_ID: 9, Resource_Name: "NVIDIA Jetson Nano Developer Kit", Category_Name: "Lab Equipment & Kits", Booking_Date: "2026-11-08", Return_Date: "2026-11-15", Booking_Status: "Approved" }
  ]
};

function getLocalStore() {
  const data = localStorage.getItem("CAMPUS_STORE_DATA");
  if (!data) {
    localStorage.setItem("CAMPUS_STORE_DATA", JSON.stringify(DEFAULT_STORE));
    return DEFAULT_STORE;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_STORE;
  }
}

function saveLocalStore(store) {
  localStorage.setItem("CAMPUS_STORE_DATA", JSON.stringify(store));
}

// Universal API wrapper
window.apiCall = async function(endpoint, options = {}) {
  const apiBase = window.CAMPUS_API_BASE || "";
  const fullUrl = `${apiBase}${endpoint}`;

  // Try real backend request first
  try {
    const res = await fetch(fullUrl, options);
    if (res.ok || res.status === 400 || res.status === 401 || res.status === 404) {
      return await res.json();
    }
  } catch (netErr) {
    // If network fails (e.g. backend server is not running or static hosting on GitHub Pages),
    // smoothly fallback to client-side database engine!
  }

  // Client-Side Database Engine Fallback
  return handleClientSideFallback(endpoint, options);
};

function handleClientSideFallback(endpoint, options) {
  const store = getLocalStore();
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const [path, queryString] = endpoint.split("?");
  const params = new URLSearchParams(queryString || "");

  // Auth: Login
  if (path === "/api/auth/login" && method === "POST") {
    const { role, email, password } = body;
    let list = store.students;
    if (role === "faculty") list = store.faculty;
    if (role === "admin") list = store.admins;

    const user = list.find(u => u.Email.toLowerCase() === (email || "").toLowerCase() && u.Password === password);
    if (user) {
      const copy = { ...user, role };
      delete copy.Password;
      return { success: true, user: copy };
    }
    return { success: false, message: "Invalid email or password" };
  }

  // Auth: Register
  if (path === "/api/auth/register" && method === "POST") {
    const { role, name, email, password } = body;
    if (role === "faculty") {
      const exists = store.faculty.find(f => f.Email.toLowerCase() === email.toLowerCase());
      if (exists) return { success: false, message: "Faculty with this email already exists." };
      const newF = {
        Faculty_ID: store.faculty.length + 1,
        Name: name,
        Email: email,
        Password: password,
        Department: body.department || "Engineering",
        Designation: body.designation || "Assistant Professor"
      };
      store.faculty.push(newF);
      saveLocalStore(store);
      return { success: true, message: "Faculty registered successfully!", faculty_id: newF.Faculty_ID };
    } else {
      const exists = store.students.find(s => s.Email.toLowerCase() === email.toLowerCase());
      if (exists) return { success: false, message: "Student with this email already exists." };
      const newS = {
        Student_ID: store.students.length + 1,
        Name: name,
        Email: email,
        Password: password,
        Branch: body.branch || "Computer Science",
        Year: parseInt(body.year || 1)
      };
      store.students.push(newS);
      saveLocalStore(store);
      return { success: true, message: "Student registered successfully!", student_id: newS.Student_ID };
    }
  }

  // Categories
  if (path === "/api/categories" && method === "GET") {
    return { success: true, categories: store.categories };
  }

  // Resources: Get
  if (path === "/api/resources" && method === "GET") {
    const search = (params.get("search") || "").toLowerCase();
    const catId = params.get("category_id");
    const status = params.get("status");

    let list = [...store.resources];
    if (search) {
      list = list.filter(r => r.Resource_Name.toLowerCase().includes(search) || (r.Description || "").toLowerCase().includes(search));
    }
    if (catId) {
      list = list.filter(r => String(r.Category_ID) === String(catId));
    }
    if (status) {
      list = list.filter(r => r.Availability_Status === status);
    }
    return { success: true, resources: list };
  }

  // Resources: Add
  if (path === "/api/resources" && method === "POST") {
    const cat = store.categories.find(c => String(c.Category_ID) === String(body.category_id));
    const newRes = {
      Resource_ID: store.resources.length + 1,
      Resource_Name: body.resource_name,
      Category_ID: parseInt(body.category_id),
      Category_Name: cat ? cat.Category_Name : "General",
      Description: body.description,
      Owner_ID: parseInt(body.owner_id),
      Owner_Type: body.owner_type || "Student",
      Owner_Name: body.owner_type === "Faculty" ? "Demo Faculty" : "Demo Student",
      Owner_Email: body.owner_type === "Faculty" ? "faculty@campusshare.com" : "student@campusshare.com",
      Availability_Status: "Available"
    };
    store.resources.unshift(newRes);
    saveLocalStore(store);
    return { success: true, message: "Resource added successfully!", resource_id: newRes.Resource_ID };
  }

  // Resources: Delete
  if (path.startsWith("/api/resources/") && method === "DELETE") {
    const id = parseInt(path.split("/").pop());
    store.resources = store.resources.filter(r => r.Resource_ID !== id);
    saveLocalStore(store);
    return { success: true, message: "Resource deleted successfully." };
  }

  // Bookings: Get
  if (path === "/api/bookings" && method === "GET") {
    const sId = params.get("student_id");
    const bType = params.get("borrower_type");

    let list = [...store.bookings];
    if (sId) {
      list = list.filter(b => String(b.Student_ID) === String(sId));
    }
    if (bType) {
      list = list.filter(b => b.Borrower_Type === bType);
    }
    return { success: true, bookings: list };
  }

  // Bookings: Create
  if (path === "/api/bookings" && method === "POST") {
    const res = store.resources.find(r => r.Resource_ID === parseInt(body.resource_id));
    if (!res) return { success: false, message: "Resource not found" };
    if (res.Availability_Status !== "Available") return { success: false, message: `Resource is currently ${res.Availability_Status}` };

    const newBooking = {
      Booking_ID: store.bookings.length + 1,
      Student_ID: parseInt(body.student_id),
      Borrower_Type: body.borrower_type || "Student",
      Student_Name: body.borrower_type === "Faculty" ? "Demo Faculty" : "Demo Student",
      Student_Email: body.borrower_type === "Faculty" ? "faculty@campusshare.com" : "student@campusshare.com",
      Student_Branch: "Computer Science",
      Resource_ID: res.Resource_ID,
      Resource_Name: res.Resource_Name,
      Category_Name: res.Category_Name,
      Booking_Date: new Date().toISOString().split("T")[0],
      Return_Date: body.return_date,
      Booking_Status: "Pending"
    };
    store.bookings.unshift(newBooking);
    saveLocalStore(store);
    return { success: true, message: "Booking request submitted successfully! Awaiting approval.", booking_id: newBooking.Booking_ID };
  }

  // Bookings: Status Update
  if (path === "/api/bookings/status" && method === "POST") {
    const { booking_id, status } = body;
    const b = store.bookings.find(bk => bk.Booking_ID === parseInt(booking_id));
    if (!b) return { success: false, message: "Booking not found" };
    b.Booking_Status = status;

    const res = store.resources.find(r => r.Resource_ID === b.Resource_ID);
    if (res) {
      if (status === "Approved") res.Availability_Status = "Booked";
      if (status === "Returned" || status === "Rejected") res.Availability_Status = "Available";
    }
    saveLocalStore(store);
    return { success: true, message: `Booking marked as ${status}.` };
  }

  // Admin Stats
  if (path === "/api/admin/stats" && method === "GET") {
    return {
      success: true,
      stats: {
        total_students: store.students.length,
        total_faculty: store.faculty.length,
        total_resources: store.resources.length,
        pending_bookings: store.bookings.filter(b => b.Booking_Status === "Pending").length,
        active_loans: store.bookings.filter(b => b.Booking_Status === "Approved").length
      }
    };
  }

  // Students Directory
  if (path === "/api/students" && method === "GET") {
    return { success: true, students: store.students };
  }

  return { success: false, message: "Endpoint not found" };
}
