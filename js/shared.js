// ===============================
// GLOBAL WEB APP URL
// ===============================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzuGtr2AtmQB9-E0vVxRaS-Jtpgz8anqbHO6LGCxJPGPD3Oom8wV9nFRtdU-HPjPI_x/exec";

// Alias for analysis calls
const BACKEND_URL = WEB_APP_URL;


function logActivity(payload) {
  return fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      type: "activityLog",
      userID: sessionStorage.getItem("userID") || "",
      firstName: sessionStorage.getItem("firstName") || "",
      lastName: sessionStorage.getItem("lastName") || "",
      page: payload.page || "",
      address: payload.address || "",
      price: payload.price || "",
      arv: payload.arv || "",
      rent: payload.rent || "",
      action: payload.action || ""
    })
  });
}

function updateLastLogin(userId) {
  fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      type: "lastLogin",
      userId: userId
    })
  }).catch(err => console.error("Login timestamp error:", err));
}

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
let sessionTimer;

function startSessionTimer() {
  clearTimeout(sessionTimer);

  sessionTimer = setTimeout(() => {
    sessionStorage.clear();
    alert("Session expired. Please log in again.");
    window.location.href = "index.html";
  }, SESSION_TIMEOUT);
}

function resetSessionTimer() {
  startSessionTimer();
}

// Start timer on page load
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("investorAuth") === "true") {
    startSessionTimer();

    ["click", "mousemove", "keypress", "scroll"].forEach(event => {
      document.addEventListener(event, resetSessionTimer);
    });
  }
});
