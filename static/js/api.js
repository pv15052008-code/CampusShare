/* ============================================================
   CampusShare – Central API Base Resolver
   File: static/js/api.js
   Supports both unified full-stack hosting (Render) 
   and decoupled frontend hosting (Vercel -> Render backend).
   ============================================================ */

window.CAMPUS_API_BASE = (function() {
  // If explicitly configured in localStorage or window
  if (window.API_BASE_URL) return window.API_BASE_URL;
  const stored = localStorage.getItem("CAMPUS_API_URL");
  if (stored) return stored.replace(/\/$/, "");

  // If running on Vercel (e.g. *.vercel.app) and user hasn't set custom backend yet,
  // relative API calls can be routed or overridden.
  return "";
})();
