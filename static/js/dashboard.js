/* ============================================================
   CampusShare – Student Dashboard Controller
   File: static/js/dashboard.js
   ============================================================ */

let currentUser = null;
let currentCategoryId = "";
let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check student login session
  const userStr = localStorage.getItem("campus_user");
  if (!userStr) {
    window.location.href = "/";
    return;
  }

  currentUser = JSON.parse(userStr);
  if (currentUser.role === "admin") {
    window.location.href = "/admin";
    return;
  }

  // Update user badge in navbar
  document.getElementById("user-name").textContent = currentUser.Name;
  document.getElementById("user-branch").textContent = currentUser.Branch;

  // Set default minimum date for booking return to today
  const todayStr = new Date().toISOString().split("T")[0];
  const returnInput = document.getElementById("booking-return-date");
  if (returnInput) {
    returnInput.min = todayStr;
    returnInput.value = todayStr;
  }

  // Load initial data
  loadCategories();
  loadResources();
  loadMyBookings();
});

function handleLogout() {
  localStorage.removeItem("campus_user");
  window.location.href = "/";
}

function switchDashboardTab(tab) {
  const exploreTab = document.getElementById("tab-explore");
  const myBookingsTab = document.getElementById("tab-my-bookings");
  const sectionExplore = document.getElementById("section-explore");
  const sectionMyBookings = document.getElementById("section-my-bookings");

  if (tab === "explore") {
    exploreTab.classList.add("active");
    myBookingsTab.classList.remove("active");
    sectionExplore.style.display = "block";
    sectionMyBookings.style.display = "none";
  } else {
    exploreTab.classList.remove("active");
    myBookingsTab.classList.add("active");
    sectionExplore.style.display = "none";
    sectionMyBookings.style.display = "block";
    loadMyBookings();
  }
}

// ------------------------------------------------------------
// Categories
// ------------------------------------------------------------
async function loadCategories() {
  try {
    const apiBase = window.CAMPUS_API_BASE || "";
    const res = await fetch(`${apiBase}/api/categories`);
    const data = await res.json();
    if (!data.success) return;

    const pillsContainer = document.getElementById("category-pills");
    const addResCategorySelect = document.getElementById("res-category");

    data.categories.forEach(cat => {
      // Category Filter Pill
      const pill = document.createElement("button");
      pill.className = "category-pill";
      pill.textContent = cat.Category_Name;
      pill.onclick = function() { filterCategory(cat.Category_ID, this); };
      pillsContainer.appendChild(pill);

      // Select Dropdown for Add Resource Modal
      const opt = document.createElement("option");
      opt.value = cat.Category_ID;
      opt.textContent = cat.Category_Name;
      addResCategorySelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function filterCategory(categoryId, pillElement) {
  currentCategoryId = categoryId;
  document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
  pillElement.classList.add("active");
  loadResources();
}

function handleSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadResources();
  }, 250);
}

// ------------------------------------------------------------
// Resources
// ------------------------------------------------------------
async function loadResources() {
  const grid = document.getElementById("resource-grid");
  const loading = document.getElementById("resource-loading");
  const empty = document.getElementById("resource-empty");
  const search = document.getElementById("search-input").value.trim();
  const status = document.getElementById("status-filter").value;

  loading.style.display = "block";
  grid.style.display = "none";
  empty.style.display = "none";

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (currentCategoryId) params.append("category_id", currentCategoryId);
  if (status) params.append("status", status);

  try {
    const apiBase = window.CAMPUS_API_BASE || "";
    const res = await fetch(`${apiBase}/api/resources?${params.toString()}`);
    const data = await res.json();
    loading.style.display = "none";

    if (!data.success || data.resources.length === 0) {
      empty.style.display = "block";
      return;
    }

    grid.innerHTML = "";
    data.resources.forEach(r => {
      const isOwner = currentUser && currentUser.Student_ID === r.Owner_ID;
      const isAvailable = r.Availability_Status === "Available";

      let statusClass = "status-available";
      if (r.Availability_Status === "Booked") statusClass = "status-booked";
      if (r.Availability_Status === "Maintenance") statusClass = "status-maintenance";

      let actionBtn = "";
      if (isOwner) {
        actionBtn = `<span class="badge" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">(Your Shared Item)</span>`;
      } else if (isAvailable) {
        actionBtn = `<button class="btn btn-primary btn-sm" onclick='openBookingModal(${JSON.stringify(r)})'>Request to Borrow</button>`;
      } else {
        actionBtn = `<button class="btn btn-outline btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Unavailable</button>`;
      }

      const card = document.createElement("div");
      card.className = "resource-card";
      card.innerHTML = `
        <div class="card-header-bar">
          <span class="category-tag">${r.Category_Name}</span>
          <span class="status-badge ${statusClass}">● ${r.Availability_Status}</span>
        </div>
        <div class="card-body">
          <h3 class="resource-title">${escapeHtml(r.Resource_Name)}</h3>
          <p class="resource-desc">${escapeHtml(r.Description || "No additional description provided.")}</p>
          <div class="resource-owner">
            Shared by: <strong>${escapeHtml(r.Owner_Name)}</strong>
          </div>
          <div class="card-footer-actions">
            ${actionBtn}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.style.display = "grid";
  } catch (err) {
    loading.textContent = "Failed to load resources. Is the server running?";
  }
}

// ------------------------------------------------------------
// Request to Borrow Modal
// ------------------------------------------------------------
function openBookingModal(resource) {
  document.getElementById("modal-resource-id").value = resource.Resource_ID;
  document.getElementById("modal-resource-title").textContent = `Borrow: ${resource.Resource_Name}`;
  document.getElementById("modal-resource-desc").textContent = resource.Description || "No description provided.";
  document.getElementById("modal-owner-name").textContent = `${resource.Owner_Name} (${resource.Owner_Email})`;
  
  const alertEl = document.getElementById("modal-alert");
  alertEl.style.display = "none";

  document.getElementById("booking-modal").classList.add("active");
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.remove("active");
}

async function submitBookingRequest() {
  const resourceId = document.getElementById("modal-resource-id").value;
  const returnDate = document.getElementById("booking-return-date").value;
  const alertEl = document.getElementById("modal-alert");
  const confirmBtn = document.getElementById("confirm-booking-btn");

  if (!returnDate) {
    alertEl.className = "alert alert-error";
    alertEl.textContent = "Please select a return due date.";
    alertEl.style.display = "block";
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Submitting...";

  try {
    const apiBase = window.CAMPUS_API_BASE || "";
    const res = await fetch(`${apiBase}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: currentUser.Student_ID,
        resource_id: resourceId,
        return_date: returnDate
      })
    });
    const data = await res.json();

    if (data.success) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = data.message;
      alertEl.style.display = "block";

      setTimeout(() => {
        closeBookingModal();
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Submit Request";
        loadResources();
        loadMyBookings();
        switchDashboardTab("my-bookings");
      }, 1200);
    } else {
      alertEl.className = "alert alert-error";
      alertEl.textContent = data.message || "Failed to submit request.";
      alertEl.style.display = "block";
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Submit Request";
    }
  } catch (err) {
    alertEl.className = "alert alert-error";
    alertEl.textContent = "Server communication error.";
    alertEl.style.display = "block";
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Submit Request";
  }
}

// ------------------------------------------------------------
// Share / Add New Resource Modal
// ------------------------------------------------------------
function openAddResourceModal() {
  document.getElementById("add-resource-form").reset();
  const alertEl = document.getElementById("add-res-alert");
  alertEl.style.display = "none";
  document.getElementById("add-resource-modal").classList.add("active");
}

function closeAddResourceModal() {
  document.getElementById("add-resource-modal").classList.remove("active");
}

async function submitNewResource(e) {
  e.preventDefault();
  const alertEl = document.getElementById("add-res-alert");
  const addBtn = document.getElementById("add-res-btn");

  const name = document.getElementById("res-name").value.trim();
  const categoryId = document.getElementById("res-category").value;
  const description = document.getElementById("res-desc").value.trim();

  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    const apiBase = window.CAMPUS_API_BASE || "";
    const res = await fetch(`${apiBase}/api/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource_name: name,
        category_id: categoryId,
        description: description,
        owner_id: currentUser.Student_ID
      })
    });
    const data = await res.json();

    if (data.success) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = data.message;
      alertEl.style.display = "block";

      setTimeout(() => {
        closeAddResourceModal();
        addBtn.disabled = false;
        addBtn.textContent = "Add to Inventory";
        loadResources();
      }, 1000);
    } else {
      alertEl.className = "alert alert-error";
      alertEl.textContent = data.message || "Failed to add resource.";
      alertEl.style.display = "block";
      addBtn.disabled = false;
      addBtn.textContent = "Add to Inventory";
    }
  } catch (err) {
    alertEl.className = "alert alert-error";
    alertEl.textContent = "Server error while saving resource.";
    alertEl.style.display = "block";
    addBtn.disabled = false;
    addBtn.textContent = "Add to Inventory";
  }
}

// ------------------------------------------------------------
// My Bookings History
// ------------------------------------------------------------
async function loadMyBookings() {
  const tbody = document.getElementById("my-bookings-table-body");
  const countBadge = document.getElementById("my-bookings-count");

  try {
    const apiBase = window.CAMPUS_API_BASE || "";
    const res = await fetch(`${apiBase}/api/bookings?student_id=${currentUser.Student_ID}`);
    const data = await res.json();

    if (!data.success) return;

    countBadge.textContent = data.bookings.length;

    if (data.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">You haven't requested any resources yet. Explore resources and place a request!</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.bookings.forEach(b => {
      let statusClass = "status-pending";
      if (b.Booking_Status === "Approved") statusClass = "status-approved";
      if (b.Booking_Status === "Rejected") statusClass = "status-rejected";
      if (b.Booking_Status === "Returned") statusClass = "status-returned";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${b.Booking_ID}</strong></td>
        <td><strong>${escapeHtml(b.Resource_Name)}</strong></td>
        <td><span class="category-tag">${escapeHtml(b.Category_Name)}</span></td>
        <td>${b.Booking_Date}</td>
        <td>${b.Return_Date}</td>
        <td><span class="status-badge ${statusClass}">● ${b.Booking_Status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load student bookings:", err);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
