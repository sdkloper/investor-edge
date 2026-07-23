
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
            `${WEB_APP_URL2}?action=summary`
        );

        if (!response.ok) {

            throw new Error("Unable to load dashboard.");

        }

        const data = await response.json();

        console.log("Dashboard Data", data);

        populateSummaryCards(data);

       populateActivitySummary(data);

       populateWarnings(data);

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

    if (data.summary.totalLogins !== undefined) {

        document.getElementById("totalLogins").textContent =
            data.summary.totalLogins;

    }
    else {

        document.getElementById("totalLogins").textContent = "--";

        console.warn("summary.totalLogins not returned by API.");

    }

}


function populateActivitySummary(data) {

    //
    // Page Views
    //

    const periods = [
        ["today", "today"],
        ["last7Days", "week"],
        ["last30Days", "month"],
        ["lifetime", "life"]
    ];

    periods.forEach(([jsonKey, prefix]) => {

        const pageViews = data.summary[jsonKey].pageViews;
        const activity = data.summary[jsonKey].activity;

        //
        // Page Views
        //

        document.getElementById(`${prefix}Deals`).textContent =
            pageViews.deals;

        document.getElementById(`${prefix}Comps`).textContent =
            pageViews.comps;

        document.getElementById(`${prefix}FlipAnalyzer`).textContent =
            pageViews.analyzer;

        document.getElementById(`${prefix}RentalAnalyzer`).textContent =
            pageViews.rentalAnalyzer;

        //
        // Activity
        //

        document.getElementById(`${prefix}DealsFlip`).textContent =
            activity.dealsFlip;

        document.getElementById(`${prefix}DealsRental`).textContent =
            activity.dealsRental;

        document.getElementById(`${prefix}CompsFlip`).textContent =
            activity.compsFlip;

        document.getElementById(`${prefix}CompsRental`).textContent =
            activity.compsRental;

        document.getElementById(`${prefix}ViewComps`).textContent =
            activity.viewComps;

    });

}

function populateWarnings(data) {

    const container = document.getElementById("warningsContainer");

    container.innerHTML = "";

    const warnings = [];

    //
    // Inactive Users
    //

    data.dashboard.userWarnings.inactiveUsers.forEach(user => {

        warnings.push(
            `<div class="warning-item warning-inactive">
                <span class="warning-label">Inactive User</span>
                <strong>${user.firstName} ${user.lastName}</strong>
                <span class="warning-detail">${user.daysSinceLogin} days</span>
            </div>`
        );

    });

    //
    // Agreements Expiring
    //

    data.dashboard.userWarnings.expiringAgreements.forEach(user => {

        warnings.push(
            `<div class="warning-item warning-expiring">
                <span class="warning-label">Agreement Expiring</span>
                <strong>${user.firstName} ${user.lastName}</strong>
                <span class="warning-detail">${user.daysRemaining} days</span>
            </div>`
        );

    });

    //
    // High Comp Usage
    //

    data.dashboard.userWarnings.highCompsUsage.forEach(user => {

        warnings.push(
            `<div class="warning-item warning-highusage">
                <span class="warning-label">High Comp Usage</span>
                <strong>${user.firstName} ${user.lastName}</strong>
                <span class="warning-detail">${user.viewComps} Views</span>
            </div>`
        );

    });

    if (warnings.length === 0) {

        container.innerHTML =
            `<div class="no-warning">
                ✓ No warnings requiring attention.
            </div>`;

        return;

    }

    container.innerHTML = warnings.join("");

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
