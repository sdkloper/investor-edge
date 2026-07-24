
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

       populateUsers(data);

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
   
               <div class="warning-label">
                   High Comp Usage
               </div>
   
               <div class="warning-content">
   
                   <strong>${user.firstName} ${user.lastName}</strong>
   
                   <div class="warning-subtext">
   
                       Deals: ${user.dealClicks}
                       &nbsp;&nbsp;&nbsp;
   
                       Comps: ${user.viewComps}
                       &nbsp;&nbsp;&nbsp;
   
                       Utilization:
                       <strong>${user.utilizationPercent}%</strong>
   
                   </div>
   
               </div>
   
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

function populateUsers(data) {

    const tbody =
        document.getElementById("usersTableBody");

    tbody.innerHTML = "";

   const users = [...data.users];

   users.sort((a, b) =>
   
       b.pageViews.last7Days.deals -
   
       a.pageViews.last7Days.deals
   
   );

    users.forEach((user, index) => {

        const last7 =
            user.pageViews.last7Days;

        tbody.insertAdjacentHTML(

            "beforeend",

            `
            <tr class="user-row"
                data-user="${user.userID}">

                <td class="expand-toggle"

                   data-user="${user.userID}">
               
                   ▶
               
               </td>

                <td>${user.firstName} ${user.lastName}</td>

                <td class="${user.active ? "status-active" : "status-inactive"}">

                   ${user.active ? "●" : "●"}
               
               </td>
               
               <td>${user.agentFirstName} ${user.agentLastName}</td>

                <td>${formatDate(user.agreementExpiration)}</td>

                <td>${formatDate(user.lastLogin)}</td>

                <td>${last7.deals}</td>

                <td>${last7.comps}</td>

                <td>${last7.analyzer}</td>

                <td>${last7.rentalAnalyzer}</td>

            </tr>

            <tr class="user-detail-row"

                id="detail-${user.userID}"
            
                style="display:none;">
            
                <td colspan="10">
            
                    ${renderActivityTable(user)}
            
                </td>
            
            </tr>
            `
        );

    });

   document.querySelectorAll(".expand-toggle").forEach(toggle => {

        toggle.onclick = function () {

            const id = this.dataset.user;

            const row = document.getElementById(`detail-${id}`);

            const open = row.style.display === "table-row";

            row.style.display = open ? "none" : "table-row";

            this.textContent = open ? "▶" : "▼";

        };

    });

}


function renderActivityTable(user) {

    const pv = user.pageViews;
    const act = user.activity;

    return `
        <table class="activity-detail-table">

            <thead>

                <tr>

                    <th></th>
                    <th>Today</th>
                    <th>7 Days</th>
                    <th>30 Days</th>
                    <th>Lifetime</th>

                </tr>

            </thead>

            <tbody>

                <tr class="section-header">
                    <td colspan="5">Page Views</td>
                </tr>

                <tr>
                    <td>Deals</td>
                    <td>${pv.today.deals}</td>
                    <td>${pv.last7Days.deals}</td>
                    <td>${pv.last30Days.deals}</td>
                    <td>${pv.lifetime.deals}</td>
                </tr>

                <tr>
                    <td>Comps</td>
                    <td>${pv.today.comps}</td>
                    <td>${pv.last7Days.comps}</td>
                    <td>${pv.last30Days.comps}</td>
                    <td>${pv.lifetime.comps}</td>
                </tr>

                <tr>
                    <td>Analyzer</td>
                    <td>${pv.today.analyzer}</td>
                    <td>${pv.last7Days.analyzer}</td>
                    <td>${pv.last30Days.analyzer}</td>
                    <td>${pv.lifetime.analyzer}</td>
                </tr>

                <tr>
                    <td>Rental</td>
                    <td>${pv.today.rentalAnalyzer}</td>
                    <td>${pv.last7Days.rentalAnalyzer}</td>
                    <td>${pv.last30Days.rentalAnalyzer}</td>
                    <td>${pv.lifetime.rentalAnalyzer}</td>
                </tr>

                <tr class="section-header">
                    <td colspan="5">Activity</td>
                </tr>

                <tr>
                    <td>Deals → Flip</td>
                    <td>${act.today.dealsFlip}</td>
                    <td>${act.last7Days.dealsFlip}</td>
                    <td>${act.last30Days.dealsFlip}</td>
                    <td>${act.lifetime.dealsFlip}</td>
                </tr>

                <tr>
                    <td>Deals → Rental</td>
                    <td>${act.today.dealsRental}</td>
                    <td>${act.last7Days.dealsRental}</td>
                    <td>${act.last30Days.dealsRental}</td>
                    <td>${act.lifetime.dealsRental}</td>
                </tr>

                <tr>
                    <td>Comps → Flip</td>
                    <td>${act.today.compsFlip}</td>
                    <td>${act.last7Days.compsFlip}</td>
                    <td>${act.last30Days.compsFlip}</td>
                    <td>${act.lifetime.compsFlip}</td>
                </tr>

                <tr>
                    <td>Comps → Rental</td>
                    <td>${act.today.compsRental}</td>
                    <td>${act.last7Days.compsRental}</td>
                    <td>${act.last30Days.compsRental}</td>
                    <td>${act.lifetime.compsRental}</td>
                </tr>

                <tr>
                    <td>View Comps</td>
                    <td>${act.today.viewComps}</td>
                    <td>${act.last7Days.viewComps}</td>
                    <td>${act.last30Days.viewComps}</td>
                    <td>${act.lifetime.viewComps}</td>
                </tr>

            </tbody>

        </table>
   
    `;
}

function formatDate(dateString) {

    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString();

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
      await fetch(WEB_APP_URL, {

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
