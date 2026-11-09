/* ============================================================
   CampusShare – Administrator Controller
   File: static/js/admin.js
   ============================================================ */

let currentAdmin = null;

function getBasePath() {
  return window.location.pathname.includes("/CampusShare") ? "/CampusShare/" : "/";
}

document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("campus_user");
  const base = getBasePath();
  if (!userStr) {
    window.location.href = `${base}index.html`;
    return;
  }

  currentAdmin = JSON.parse(userStr);
  if (currentAdmin.role !== "admin") {
    alert("Unauthorized access. Admin privileges required.");
    window.location.href = `${base}dashboard.html`;
    return;
  }

  document.getElementById("admin-name").textContent = currentAdmin.Name;
  loadAdminData();
});

function handleAdminLogout() {
  localStorage.removeItem("campus_user");
  window.location.href = `${getBasePath()}index.html`;
}

function showAdminAlert(message, type = "success") {
  const alertEl = document.getElementById("admin-alert");
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.style.display = "block";
  setTimeout(() => {
    alertEl.style.display = "none";
  }, 3500);
}

function switchAdminTab(tab) {
  const tabBookings = document.getElementById("tab-admin-bookings");
  const tabInventory = document.getElementById("tab-admin-inventory");
  const tabStudents = document.getElementById("tab-admin-students");

  const secBookings = document.getElementById("section-admin-bookings");
  const secInventory = document.getElementById("section-admin-inventory");
  const secStudents = document.getElementById("section-admin-students");

  tabBookings.classList.remove("active");
  tabInventory.classList.remove("active");
  tabStudents.classList.remove("active");

  secBookings.style.display = "none";
  secInventory.style.display = "none";
  secStudents.style.display = "none";

  if (tab === "bookings") {
    tabBookings.classList.add("active");
    secBookings.style.display = "block";
    loadBookings();
  } else if (tab === "inventory") {
    tabInventory.classList.add("active");
    secInventory.style.display = "block";
    loadInventory();
  } else if (tab === "students") {
    tabStudents.classList.add("active");
    secStudents.style.display = "block";
    loadStudents();
  }
}

async function loadAdminData() {
  await Promise.all([
    loadStats(),
    loadBookings(),
    loadInventory(),
    loadStudents()
  ]);
}

// ------------------------------------------------------------
// Statistics
// ------------------------------------------------------------
async function loadStats() {
  try {
    const data = await window.apiCall("/api/admin/stats");
    if (!data.success) return;

    document.getElementById("stat-students").textContent = data.stats.total_students;
    document.getElementById("stat-resources").textContent = data.stats.total_resources;
    document.getElementById("stat-pending").textContent = data.stats.pending_bookings;
    document.getElementById("stat-active").textContent = data.stats.active_loans;
  } catch (err) {
    console.error("Failed to load admin stats:", err);
  }
}

// ------------------------------------------------------------
// Bookings Management
// ------------------------------------------------------------
async function loadBookings() {
  const tbody = document.getElementById("admin-bookings-tbody");
  try {
    const data = await window.apiCall("/api/bookings");
    if (!data.success) return;

    if (data.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No booking requests found.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.bookings.forEach(b => {
      let statusClass = "status-pending";
      if (b.Booking_Status === "Approved") statusClass = "status-approved";
      if (b.Booking_Status === "Rejected") statusClass = "status-rejected";
      if (b.Booking_Status === "Returned") statusClass = "status-returned";

      let actions = "";
      if (b.Booking_Status === "Pending") {
        actions = `
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-success btn-sm" onclick="updateBookingStatus(${b.Booking_ID}, 'Approved')">
              ✓ Approve
            </button>
            <button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${b.Booking_ID}, 'Rejected')">
              ✕ Reject
            </button>
          </div>
        `;
      } else if (b.Booking_Status === "Approved") {
        actions = `
          <button class="btn btn-outline btn-sm" onclick="updateBookingStatus(${b.Booking_ID}, 'Returned')">
            Mark Returned
          </button>
        `;
      } else {
        actions = `<span style="color: var(--text-light); font-size: 0.8rem;">Completed</span>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${b.Booking_ID}</strong></td>
        <td><strong>${escapeHtml(b.Student_Name)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(b.Student_Email)}</small></td>
        <td>${escapeHtml(b.Student_Branch)}</td>
        <td><strong>${escapeHtml(b.Resource_Name)}</strong></td>
        <td><span class="category-tag">${escapeHtml(b.Category_Name)}</span></td>
        <td>${b.Booking_Date}</td>
        <td>${b.Return_Date}</td>
        <td><span class="status-badge ${statusClass}">● ${b.Booking_Status}</span></td>
        <td>${actions}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Error loading bookings.</td></tr>`;
  }
}

async function updateBookingStatus(bookingId, status) {
  try {
    const data = await window.apiCall("/api/bookings/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, status: status })
    });

    if (data.success) {
      showAdminAlert(`Booking #${bookingId} successfully updated to: ${status}`);
      loadStats();
      loadBookings();
      loadInventory();
    } else {
      showAdminAlert(data.message || "Operation failed", "error");
    }
  } catch (err) {
    showAdminAlert("Server error while updating booking.", "error");
  }
}

// ------------------------------------------------------------
// Resource Inventory Management
// ------------------------------------------------------------
async function loadInventory() {
  const tbody = document.getElementById("admin-inventory-tbody");
  try {
    const data = await window.apiCall("/api/resources");
    if (!data.success) return;

    tbody.innerHTML = "";
    data.resources.forEach(r => {
      let statusClass = "status-available";
      if (r.Availability_Status === "Booked") statusClass = "status-booked";
      if (r.Availability_Status === "Maintenance") statusClass = "status-maintenance";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${r.Resource_ID}</td>
        <td><strong>${escapeHtml(r.Resource_Name)}</strong></td>
        <td><span class="category-tag">${escapeHtml(r.Category_Name)}</span></td>
        <td>${escapeHtml(r.Owner_Name)} (${escapeHtml(r.Owner_Email)})</td>
        <td><span class="status-badge ${statusClass}">● ${r.Availability_Status}</span></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteResource(${r.Resource_ID}, '${escapeHtml(r.Resource_Name)}')">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading inventory.</td></tr>`;
  }
}

async function deleteResource(resourceId, name) {
  if (!confirm(`Are you sure you want to delete '${name}'? Associated bookings will also be removed.`)) {
    return;
  }

  try {
    const data = await window.apiCall(`/api/resources/${resourceId}`, {
      method: "DELETE"
    });

    if (data.success) {
      showAdminAlert(`Resource #${resourceId} '${name}' deleted successfully.`);
      loadStats();
      loadInventory();
      loadBookings();
    } else {
      showAdminAlert(data.message || "Failed to delete resource.", "error");
    }
  } catch (err) {
    showAdminAlert("Server error deleting resource.", "error");
  }
}

// ------------------------------------------------------------
// Student Directory
// ------------------------------------------------------------
async function loadStudents() {
  const tbody = document.getElementById("admin-students-tbody");
  try {
    const data = await window.apiCall("/api/students");
    if (!data.success) return;

    tbody.innerHTML = "";
    data.students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>#${s.Student_ID}</td>
        <td><strong>${escapeHtml(s.Name)}</strong></td>
        <td>${escapeHtml(s.Email)}</td>
        <td>${escapeHtml(s.Branch)}</td>
        <td>Year ${s.Year}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading students.</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
