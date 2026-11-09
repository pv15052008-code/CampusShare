/* ============================================================
   CampusShare – Authentication Logic & Demo Login
   File: static/js/auth.js
   ============================================================ */

function showAlert(message, type = "error") {
  const alertEl = document.getElementById("auth-alert");
  if (!alertEl) return;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertEl.style.display = "block";
}

function clearAlert() {
  const alertEl = document.getElementById("auth-alert");
  if (alertEl) alertEl.style.display = "none";
}

function switchAuthTab(tab) {
  clearAlert();
  const tabs = ["student", "faculty", "admin", "register"];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.classList.remove("active");
  });

  const activeTabEl = document.getElementById(`tab-${tab}`);
  if (activeTabEl) activeTabEl.classList.add("active");

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginRole = document.getElementById("login-role");
  const loginBtn = document.getElementById("login-btn");
  const emailLabel = document.getElementById("email-label");

  if (tab === "register") {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  } else {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    loginRole.value = tab;

    if (tab === "student") {
      emailLabel.textContent = "Student College Email";
      loginBtn.textContent = "Sign In as Student";
    } else if (tab === "faculty") {
      emailLabel.textContent = "Faculty Email";
      loginBtn.textContent = "Sign In as Faculty";
    } else if (tab === "admin") {
      emailLabel.textContent = "Administrator Email";
      loginBtn.textContent = "Sign In as Administrator";
    }
  }
}

function fillDemo(email, password, role) {
  switchAuthTab(role);
  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = password;
}

// 1-Click Instant Demo Login
async function quickDemoLogin(role) {
  clearAlert();
  switchAuthTab(role);

  let email = "student@campusshare.com";
  let password = "student123";

  if (role === "faculty") {
    email = "faculty@campusshare.com";
    password = "faculty123";
  } else if (role === "admin") {
    email = "admin@campusshare.com";
    password = "admin123";
  }

  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = password;

  const loginBtn = document.getElementById("login-btn");
  loginBtn.disabled = true;
  loginBtn.textContent = "Authenticating Demo Account...";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, email, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("campus_user", JSON.stringify(data.user));
      showAlert(`Authenticated as ${data.user.Name}! Redirecting...`, "success");
      setTimeout(() => {
        redirectUser(data.user.role);
      }, 400);
    } else {
      showAlert(data.message || "Demo login failed.");
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  } catch (err) {
    showAlert("Server connection failed. Is app.py running?");
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
}

async function handleLogin(e) {
  e.preventDefault();
  clearAlert();

  const role = document.getElementById("login-role").value;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const loginBtn = document.getElementById("login-btn");

  loginBtn.disabled = true;
  loginBtn.textContent = "Verifying...";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, email, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("campus_user", JSON.stringify(data.user));
      redirectUser(data.user.role);
    } else {
      showAlert(data.message || "Invalid email or password.");
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  } catch (err) {
    showAlert("Server connection error. Please verify backend is running.");
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
}

function redirectUser(role) {
  if (role === "admin") {
    window.location.href = "/admin";
  } else if (role === "faculty") {
    window.location.href = "/faculty";
  } else {
    window.location.href = "/dashboard";
  }
}

function toggleRegRoleFields() {
  const role = document.getElementById("reg-role").value;
  const studentFields = document.getElementById("student-reg-fields");
  const facultyFields = document.getElementById("faculty-reg-fields");

  if (role === "faculty") {
    studentFields.style.display = "none";
    facultyFields.style.display = "flex";
  } else {
    studentFields.style.display = "flex";
    facultyFields.style.display = "none";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearAlert();

  const role = document.getElementById("reg-role").value;
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const regBtn = document.getElementById("reg-btn");

  const payload = { role, name, email, password };

  if (role === "faculty") {
    payload.department = document.getElementById("reg-dept").value.trim() || "General Engineering";
    payload.designation = document.getElementById("reg-desig").value.trim() || "Assistant Professor";
  } else {
    payload.branch = document.getElementById("reg-branch").value;
    payload.year = document.getElementById("reg-year").value;
  }

  regBtn.disabled = true;
  regBtn.textContent = "Creating account...";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, "success");
      setTimeout(() => {
        switchAuthTab(role);
        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = password;
      }, 1200);
    } else {
      showAlert(data.message || "Registration failed.");
      regBtn.disabled = false;
      regBtn.textContent = "Create Account";
    }
  } catch (err) {
    showAlert("Server error during registration.");
    regBtn.disabled = false;
    regBtn.textContent = "Create Account";
  }
}

// Redirect logged-in users if visiting index directly
document.addEventListener("DOMContentLoaded", () => {
  const userStr = localStorage.getItem("campus_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      redirectUser(user.role);
    } catch (e) {
      localStorage.removeItem("campus_user");
    }
  }
});
