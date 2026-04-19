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
