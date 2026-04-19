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
  return fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      type: "lastLogin",
      userId: userId
    })
  });
}
