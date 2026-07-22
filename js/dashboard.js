
/* =========================================
   INVESTORS EDGE - ENHANCED UX VERSION
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

  if (sessionStorage.getItem("investorAuth") === "true") {
    showApp();
  } else {
    showLogin();
  }

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", authenticateUser);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

function showLogin() {
  document.getElementById("loginScreen").style.display = "block";
  document.getElementById("appContainer").style.display = "none";
}
function logout() {

  sessionStorage.clear();

  showLogin();

}



function showApp() {

    document.getElementById("loginScreen").style.display = "none";

    document.getElementById("appContainer").style.display = "block";

    loadDashboard();    

}

async function loadDashboard() {

    try {

        const response = await fetch(
            `${WEB_APP_URL2}?action=getSummary`
        );

        if (!response.ok) {

            throw new Error("Unable to load dashboard.");

        }

        const data = await response.json();

        console.log("Dashboard Data", data);

        populateSummaryCards(data);

    }
    catch (err) {

        console.error(err);

        alert("Unable to load dashboard.");

    }

}

function populateSummaryCards(data) {

    document.getElementById("totalUsers").textContent =
        data.users.length;

    document.getElementById("totalDeals").textContent =
        data.summary.lifetime.pageViews.deals;

    document.getElementById("totalComps").textContent =
        data.summary.lifetime.pageViews.comps;

    document.getElementById("totalFlip").textContent =
        data.summary.lifetime.pageViews.analyzer;

    document.getElementById("totalRental").textContent =
        data.summary.lifetime.pageViews.rentalAnalyzer;

    //
    // Total Logins
    //

    if (data.dashboard.totalLogins !== undefined) {

        document.getElementById("totalLogins").textContent =
            data.dashboard.totalLogins;

    }
    else {

        document.getElementById("totalLogins").textContent = "--";

        console.warn("dashboard.totalLogins not returned by API.");

    }

}
  
// 2. Your existing function with the minor validation upgrade
async function authenticateUser() {

  const user =
    document.getElementById("loginUser")
      .value
      .trim();

  const pass =
    document.getElementById("loginPass")
      .value
      .trim();

   const loginBtn =
     document.getElementById("loginBtn");
   
   loginBtn.disabled = true;
   loginBtn.textContent =
     "Loading Investors Edge...";
   
   document.getElementById(
     "loginError"
   ).textContent = "";
   
  try {

    const response =
      await fetch(WEB_APP_URL2, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body: new URLSearchParams({

          type: "login",

          userId: user,

          password: pass

        })

      });

    const result = await response.json();
     

    if (!result.success) {

      document
        .getElementById("loginError")
        .textContent =
        "Invalid credentials.";
       
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
       
      return;

    }

    if (result.userId !== "sklope") {

       document.getElementById("loginError").textContent =
           "You are not authorized to access the Admin Dashboard.";
   
       sessionStorage.clear();
   
       loginBtn.disabled = false;
       loginBtn.textContent = "Login";
   
       return;
   }
    
    sessionStorage.setItem(
      "investorAuth",
      "true"
    );

    sessionStorage.setItem(
      "userID",
      result.userId
    );

    sessionStorage.setItem(
      "firstName",
      result.firstName || ""
    );

    sessionStorage.setItem(
      "lastName",
      result.lastName || ""
    );

    updateLastLogin(
      result.userId
    );
   
    loginBtn.disabled = false;
    loginBtn.textContent = "Login"; 
     
    showApp();

  }
  catch(err) {

    console.error(err);

    document
      .getElementById("loginError")
      .textContent =
      "Login failed.";

  }

}
