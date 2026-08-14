
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

const ACTIVITY_PAGE_SIZE = 10;

let activityOffset = 0;
let currentActivityRows = [];
let currentActivityTitle = "";

const activityRegistry = {};
let activityRegistryId = 0;


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

       populateProperties(data);

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
                   <td>${activityLink(
                       act.today.dealsFlip,
                       act.today.properties.dealsFlip,
                       "Deals → Flip (Today)"
                   )}</td>
                   <td>${activityLink(
                       act.last7Days.dealsFlip,
                       act.last7Days.properties.dealsFlip,
                       "Deals → Flip (7 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.last30Days.dealsFlip,
                       act.last30Days.properties.dealsFlip,
                       "Deals → Flip (30 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.lifetime.dealsFlip,
                       act.lifetime.properties.dealsFlip,
                       "Deals → Flip (Lifetime)"
                   )}</td>
               </tr>
               
               <tr>
                   <td>Deals → Rental</td>
                   <td>${activityLink(
                       act.today.dealsRental,
                       act.today.properties.dealsRental,
                       "Deals → Rental (Today)"
                   )}</td>
                   <td>${activityLink(
                       act.last7Days.dealsRental,
                       act.last7Days.properties.dealsRental,
                       "Deals → Rental (7 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.last30Days.dealsRental,
                       act.last30Days.properties.dealsRental,
                       "Deals → Rental (30 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.lifetime.dealsRental,
                       act.lifetime.properties.dealsRental,
                       "Deals → Rental (Lifetime)"
                   )}</td>
               </tr>
               
               <tr>
                   <td>Comps → Flip</td>
                   <td>${activityLink(
                       act.today.compsFlip,
                       act.today.properties.compsFlip,
                       "Comps → Flip (Today)"
                   )}</td>
                   <td>${activityLink(
                       act.last7Days.compsFlip,
                       act.last7Days.properties.compsFlip,
                       "Comps → Flip (7 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.last30Days.compsFlip,
                       act.last30Days.properties.compsFlip,
                       "Comps → Flip (30 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.lifetime.compsFlip,
                       act.lifetime.properties.compsFlip,
                       "Comps → Flip (Lifetime)"
                   )}</td>
               </tr>
               
               <tr>
                   <td>Comps → Rental</td>
                   <td>${activityLink(
                       act.today.compsRental,
                       act.today.properties.compsRental,
                       "Comps → Rental (Today)"
                   )}</td>
                   <td>${activityLink(
                       act.last7Days.compsRental,
                       act.last7Days.properties.compsRental,
                       "Comps → Rental (7 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.last30Days.compsRental,
                       act.last30Days.properties.compsRental,
                       "Comps → Rental (30 Days)"
                   )}</td>
                   <td>${activityLink(
                       act.lifetime.compsRental,
                       act.lifetime.properties.compsRental,
                       "Comps → Rental (Lifetime)"
                   )}</td>
               </tr>
               
               <tr>
                   <td>View Comps</td>
                   <td>${act.today.viewComps}</td>
                   <td>${act.last7Days.viewComps}</td>
                   <td>${act.last30Days.viewComps}</td>
                   <td>${act.lifetime.viewComps}</td>
               </tr>
               
               <tr>
                   <td colspan="5">
                       <div id="activityPropertyList"></div>
                   </td>
               </tr>

            </tbody>

           </table>
      
      `;
}

function populateProperties(data) {

    const tbody =
        document.getElementById("propertiesTableBody");

    tbody.innerHTML = "";

    const properties =
        Object.values(data.properties);

    properties.sort((a, b) => {

       if (b.runtime.last7Flip !== a.runtime.last7Flip) {
           return b.runtime.last7Flip - a.runtime.last7Flip;
       }
   
       if (b.runtime.last7Rental !== a.runtime.last7Rental) {
           return b.runtime.last7Rental - a.runtime.last7Rental;
       }
   
       return (b.runtime.last7ViewComps ?? b.activity.viewComps) -
              (a.runtime.last7ViewComps ?? a.activity.viewComps);
   
   });

    properties.forEach(property => {

        const userCount =
            Object.keys(property.users).length;

        tbody.insertAdjacentHTML(

            "beforeend",

            `
            <tr class="property-row">

                <td class="property-toggle"
                    data-address="${property.address}">

                    ▶

                </td>

                <td>${property.address}</td>

                <td>${userCount}</td>

                <td>${property.runtime.last7Flip}</td>

               <td>${property.runtime.last7Rental}</td>

               <td>${property.runtime.last7ViewComps ?? property.activity.viewComps}</td>

            </tr>

            <tr class="property-detail-row"

                id="property-${property.address}"

                style="display:none;">

                <td colspan="6">

                    ${renderPropertyDetails(property)}

                </td>

            </tr>
            `
        );

    });

    document.querySelectorAll(".property-toggle").forEach(toggle => {

        toggle.onclick = function () {

            const id = this.dataset.address;

            const row =
                document.getElementById(`property-${id}`);

            const open =
                row.style.display === "table-row";

            row.style.display =
                open ? "none" : "table-row";

            this.textContent =
                open ? "▶" : "▼";

        };

    });

}

function renderPropertyDetails(property) {

    const rows = Object.values(property.users).map(user => `

        <tr>

            <td>${user.firstName} ${user.lastName}</td>

            <td>${user.activity.last7Flip}</td>

            <td>${user.activity.last7Rental}</td>

            <td>${user.activity.last7ViewComps}</td>

        </tr>

    `).join("");

    return `

        <table class="activity-detail-table">

            <thead>

                <tr>

                    <th>User</th>

                    <th>Flip (7d)</th>

                    <th>Rental (7d)</th>

                    <th>View Comps (7d)</th>

                </tr>

            </thead>

            <tbody>

                ${rows}

            </tbody>

        </table>

    `;

}

function renderActivityProperties() {

    const container =
        document.getElementById(
            "activityPropertyList"
        );

    if (!container) return;

    const rows =
        currentActivityRows.slice(
            0,
            activityOffset + ACTIVITY_PAGE_SIZE
        );

    let html = `
        <div style="margin-top:20px;">
            <h4>${currentActivityTitle}</h4>

            <table class="activityPropertyTable">
                <thead>
                    <tr>
                        <th style="text-align:left;">Address</th>
                        <th>Viewed</th>
                    </tr>
                </thead>
                <tbody>
    `;

    rows.forEach(row => {

        html += `
            <tr>
                <td>${row.address}</td>
                <td style="text-align:center;">
                    ${row.count}
                </td>
            </tr>
        `;

    });

    html += `
                </tbody>
            </table>
    `;

    if (
        currentActivityRows.length >
        rows.length
    ) {

        html += `
            <div
                id="showMoreActivity"
                style="
                    margin-top:10px;
                    cursor:pointer;
                    color:#0b66c3;
                    font-weight:bold;
                "
            >
                Show More...
            </div>
        `;

    }

    html += `</div>`;

    container.innerHTML = html;

    const btn =
        document.getElementById(
            "showMoreActivity"
        );

    if (btn) {

        btn.onclick = () => {

            activityOffset +=
                ACTIVITY_PAGE_SIZE;

            renderActivityProperties();

        };

    }

}

function activityLink(value, properties, title) {

    if (!value) return "0";

    const id = "a" + (++activityRegistryId);

    activityRegistry[id] = {
        properties: properties || {},
        title: title
    };

    return `
        <a href="#"
           onclick="showRegisteredActivity('${id}'); return false;">
            ${value}
        </a>
    `;
}
function showRegisteredActivity(id) {

    const item = activityRegistry[id];

    if (!item) return;

    showActivityProperties(
        item.properties,
        item.title
    );

}

function showActivityProperties(
    properties,
    title
) {

    currentActivityTitle =
        title;

    currentActivityRows =
       Object.values(
           properties || {}
       );

    currentActivityRows.sort((a, b) => {

       if (b.count !== a.count)
           return b.count - a.count;
   
       return a.address.localeCompare(b.address);
   
   });

    activityOffset = 0;

    renderActivityProperties();

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
