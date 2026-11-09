/* ============================================================
   CampusShare – Faculty Dashboard Controller
   File: static/js/faculty.js
   ============================================================ */

let currentFaculty = null;
let currentFacultyCatId = "";
let facultySearchTimer = null;

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

  currentFaculty = JSON.parse(userStr);
  if (currentFaculty.role !== "faculty") {
    if (currentFaculty.role === "admin") {
      window.location.href = `${base}admin.html`;
    } else {
      window.location.href = `${base}dashboard.html`;
    }
    return;
  }

  document.getElementById("faculty-name").textContent = currentFaculty.Name;
  document.getElementById("faculty-dept").textContent = currentFaculty.Department || "Academic Dept";

  const todayStr = new Date().toISOString().split("T")[0];
  const returnInput = document.getElementById("fac-booking-return-date");
  if (returnInput) {
    returnInput.min = todayStr;
    returnInput.value = todayStr;
  }

  loadFacultyCategories();
  loadFacultyResources();
  loadFacultyBookings();
});

function handleFacultyLogout() {
  localStorage.removeItem("campus_user");
  window.location.href = `${getBasePath()}index.html`;
}

function switchFacultyTab(tab) {
  const exploreTab = document.getElementById("tab-fac-explore");
  const bookingsTab = document.getElementById("tab-fac-bookings");
  const secExplore = document.getElementById("section-fac-explore");
  const secBookings = document.getElementById("section-fac-bookings");

  if (tab === "explore") {
    exploreTab.classList.add("active");
    bookingsTab.classList.remove("active");
    secExplore.style.display = "block";
    secBookings.style.display = "none";
  } else {
    exploreTab.classList.remove("active");
    bookingsTab.classList.add("active");
    secExplore.style.display = "none";
    secBookings.style.display = "block";
    loadFacultyBookings();
  }
}

async function loadFacultyCategories() {
  try {
    const data = await window.apiCall("/api/categories");
    if (!data.success) return;

    const pills = document.getElementById("fac-category-pills");
    const select = document.getElementById("fac-res-category");

    data.categories.forEach(cat => {
      const pill = document.createElement("button");
      pill.className = "category-pill";
      pill.textContent = cat.Category_Name;
      pill.onclick = function() { filterFacultyCategory(cat.Category_ID, this); };
      pills.appendChild(pill);

      const opt = document.createElement("option");
      opt.value = cat.Category_ID;
      opt.textContent = cat.Category_Name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function filterFacultyCategory(catId, btn) {
  currentFacultyCatId = catId;
  document.querySelectorAll("#fac-category-pills .category-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  loadFacultyResources();
}

function handleFacultySearch() {
  clearTimeout(facultySearchTimer);
  facultySearchTimer = setTimeout(() => {
    loadFacultyResources();
  }, 250);
}

async function loadFacultyResources() {
  const grid = document.getElementById("fac-resource-grid");
  const loading = document.getElementById("fac-resource-loading");
  const empty = document.getElementById("fac-resource-empty");
  const search = document.getElementById("fac-search-input").value.trim();
  const status = document.getElementById("fac-status-filter").value;

  loading.style.display = "block";
  grid.style.display = "none";
  empty.style.display = "none";

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (currentFacultyCatId) params.append("category_id", currentFacultyCatId);
  if (status) params.append("status", status);

  try {
    const data = await window.apiCall(`/api/resources?${params.toString()}`);
    loading.style.display = "none";

    if (!data.success || data.resources.length === 0) {
      empty.style.display = "block";
      return;
    }

    grid.innerHTML = "";
    data.resources.forEach(r => {
      const isOwner = currentFaculty.Faculty_ID === r.Owner_ID && r.Owner_Type === "Faculty";
      const isAvailable = r.Availability_Status === "Available";

      let statusClass = "status-available";
      if (r.Availability_Status === "Booked") statusClass = "status-booked";
      if (r.Availability_Status === "Maintenance") statusClass = "status-maintenance";

      let actionBtn = "";
      if (isOwner) {
        actionBtn = `<span class="badge" style="font-size: 0.8rem; color: #0284c7; font-weight: 600;">(Your Department Asset)</span>`;
      } else if (isAvailable) {
        actionBtn = `<button class="btn btn-primary btn-sm" onclick='openFacultyBookingModal(${JSON.stringify(r)})' style="background: #0284c7;">Reserve Equipment</button>`;
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
          <p class="resource-desc">${escapeHtml(r.Description || "No description provided.")}</p>
          <div class="resource-owner">
            Custodian: <strong>${escapeHtml(r.Owner_Name)}</strong> (${r.Owner_Type})
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
    loading.textContent = "Failed to load equipment list.";
  }
}

function openFacultyBookingModal(resource) {
  document.getElementById("fac-modal-resource-id").value = resource.Resource_ID;
  document.getElementById("fac-modal-resource-title").textContent = `Reserve: ${resource.Resource_Name}`;
  document.getElementById("fac-modal-resource-desc").textContent = resource.Description || "No description.";
  document.getElementById("fac-modal-owner-name").textContent = `${resource.Owner_Name} (${resource.Owner_Email})`;
  
  const alertEl = document.getElementById("fac-modal-alert");
  alertEl.style.display = "none";
  document.getElementById("fac-booking-modal").classList.add("active");
}

function closeFacultyBookingModal() {
  document.getElementById("fac-booking-modal").classList.remove("active");
}

async function submitFacultyBookingRequest() {
  const resourceId = document.getElementById("fac-modal-resource-id").value;
  const returnDate = document.getElementById("fac-booking-return-date").value;
  const alertEl = document.getElementById("fac-modal-alert");
  const confirmBtn = document.getElementById("fac-confirm-booking-btn");

  if (!returnDate) {
    alertEl.className = "alert alert-error";
    alertEl.textContent = "Please choose a return date.";
    alertEl.style.display = "block";
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Submitting...";

  try {
    const data = await window.apiCall("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: currentFaculty.Faculty_ID,
        borrower_type: "Faculty",
        resource_id: resourceId,
        return_date: returnDate
      })
    });

    if (data.success) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = data.message;
      alertEl.style.display = "block";

      setTimeout(() => {
        closeFacultyBookingModal();
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm Reservation";
        loadFacultyResources();
        loadFacultyBookings();
        switchFacultyTab("my-bookings");
      }, 1000);
    } else {
      alertEl.className = "alert alert-error";
      alertEl.textContent = data.message || "Reservation failed.";
      alertEl.style.display = "block";
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Reservation";
    }
  } catch (err) {
    alertEl.className = "alert alert-error";
    alertEl.textContent = "Server communication error.";
    alertEl.style.display = "block";
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Reservation";
  }
}

function openAddFacultyResourceModal() {
  document.getElementById("fac-add-resource-form").reset();
  const alertEl = document.getElementById("fac-add-res-alert");
  alertEl.style.display = "none";
  document.getElementById("fac-add-resource-modal").classList.add("active");
}

function closeAddFacultyResourceModal() {
  document.getElementById("fac-add-resource-modal").classList.remove("active");
}

async function submitFacultyNewResource(e) {
  e.preventDefault();
  const alertEl = document.getElementById("fac-add-res-alert");
  const addBtn = document.getElementById("fac-add-res-btn");

  const name = document.getElementById("fac-res-name").value.trim();
  const categoryId = document.getElementById("fac-res-category").value;
  const description = document.getElementById("fac-res-desc").value.trim();

  addBtn.disabled = true;
  addBtn.textContent = "Saving...";

  try {
    const data = await window.apiCall("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource_name: name,
        category_id: categoryId,
        description: description,
        owner_id: currentFaculty.Faculty_ID,
        owner_type: "Faculty"
      })
    });

    if (data.success) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = data.message;
      alertEl.style.display = "block";

      setTimeout(() => {
        closeAddFacultyResourceModal();
        addBtn.disabled = false;
        addBtn.textContent = "Add to Inventory";
        loadFacultyResources();
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

async function loadFacultyBookings() {
  const tbody = document.getElementById("fac-bookings-tbody");
  const countBadge = document.getElementById("fac-bookings-count");

  try {
    const data = await window.apiCall(`/api/bookings?student_id=${currentFaculty.Faculty_ID}&borrower_type=Faculty`);

    if (!data.success) return;

    countBadge.textContent = data.bookings.length;

    if (data.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No reservation history found.</td></tr>`;
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
    console.error("Failed to load faculty bookings:", err);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
