
/* =========================================
   INVESTOR EDGE - ENHANCED UX VERSION
   ========================================= */
const USER_SHEET_URL = "https://docs.google.com/spreadsheets/d/198ASh4Lh27lRk_ZOMmYJx0cCs3jIWgO1bID-COk1MEA/export?format=csv";

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

  loadCSV(); // load deals after auth
}

function authenticateUser() {

  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  Papa.parse(USER_SHEET_URL, {
    download: true,
    header: true,
    complete: function(results) {

      const users = results.data;

      const match = users.find(u =>
        u.UserID === user &&
        u.Password === pass &&
        u.Active === "TRUE"
      );

      if (match) {
        sessionStorage.setItem("investorAuth", "true");
        updateLastLogin(user);
        showApp();
      } else {
        document.getElementById("loginError").textContent =
          "Invalid credentials.";
      }
    }
  });
}

function getField(row, key) {
  return Object.keys(row).find(k => k.trim() === key)?.let
    ? row[Object.keys(row).find(k => k.trim() === key)]
    : "";
}

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY/export?format=csv&gid=0&t=" +
  new Date().getTime();

let deals = [];
let currentSort = { column: "List Price", asc: true }; // Default sort lowest price

document.addEventListener("DOMContentLoaded", () => {

  // Default hide auctions + no comps
  document.getElementById("showAuction").checked = false;
  document.getElementById("showNoComps").checked = false;
  document.getElementById("showCondo").checked = false;

  loadCSV();

  document
    .getElementById("applyFilters")
    .addEventListener("click", renderTable);
   
  document
     .getElementById("countyFilter")
     .addEventListener("change", renderTable);

  document
    .getElementById("closeModal")
    .addEventListener("click", closeModal);

  setupCurrencyInputs();
});

/* ============================= */

function loadCSV() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    worker: true,
    complete: function (results) {
      deals = results.data;
      populateCountyFilter();
      renderTable();
    },
  });
}

/* ============================= */
///********** CompModal ******************///
/* =============================
   COMPS + RENTAL COMPS MODAL
   ============================= */

function openCompModal(e) {
  e.preventDefault();

  const clicked = e.currentTarget;
//  const subject = JSON.parse(decodeURIComponent(clicked.dataset.row));
 // debug ********************************************************************** 
const el = e.currentTarget; // ALWAYS the element the listener is attached to

const compRaw = el.dataset.comp;
const rowRaw  = el.dataset.row;

let subject = {};
let comps   = [];

// Parse subject safely
if (rowRaw) {
  try {
    subject = JSON.parse(decodeURIComponent(rowRaw));
  } catch (err) {
    console.error("Subject JSON parse error:", err);
    subject = {};
  }
}

// Parse comps safely
if (compRaw) {
  try {
    const rawDecoded = decodeURIComponent(compRaw).replace(/\\"/g, '"').trim();
    comps = rawDecoded ? JSON.parse(rawDecoded) : [];
  } catch (err) {
    console.error("Comp JSON parse error:", err);
    comps = [];
  }
}

console.log("📊 Parsed comps:", comps);
//*****************************************************************************************   
  // ALWAYS get both datasets from the subject row
  let salesComps = [];
  let rentComps = [];

  try {
    salesComps = subject["Comp Details"]
      ? JSON.parse(subject["Comp Details"])
      : [];
  } catch (err) {
    console.error("Error parsing sales comps JSON:", err);
    salesComps = [];
  }

  try {
    rentComps = subject["Rent Comp Details"]
      ? JSON.parse(subject["Rent Comp Details"])
      : [];
  } catch (err) {
    console.error("Error parsing rental comps JSON:", err);
    rentComps = [];
  }

   
  // Determine starting tab
  const defaultTab = clicked.classList.contains("rentCompLink")
    ? "rent"
    : "sales";

  const modal = document.getElementById("compModal");
  const body = document.getElementById("modalBody");

  body.innerHTML = `
    <div class="modal-tabs">
      <button class="tabBtn ${defaultTab === "sales" ? "active" : ""}" data-tab="sales">Sales Comps</button>
      <button class="tabBtn ${defaultTab === "rent" ? "active" : ""}" data-tab="rent">Rental Comps</button>
    </div>
    <div id="modalContent"></div>
  `;

  const contentDiv = document.getElementById("modalContent");
  
   
  // Define a function to render content by tab
   function showTab(tab) {
     // Sort without mutating original
     const sortedSales = salesComps.slice().sort((a, b) =>
       (b.usedForARV ? 1 : 0) - (a.usedForARV ? 1 : 0)
     );
   
     const sortedRent = rentComps.slice().sort((a, b) =>
       (b.usedForRent ? 1 : 0) - (a.usedForRent ? 1 : 0)
     );
   
     if (tab === "sales") {
       renderCompTab("sales", subject, sortedSales);
     } else {
       renderCompTab("rent", subject, sortedRent);
     }
   }

  // INITIAL RENDER
  showTab(defaultTab);

  // TAB SWITCH HANDLING
  body.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", function () {
      body.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      showTab(this.dataset.tab);
    });
  });

  modal.style.display = "block";
}

function renderCompTab(type, subject, comps) {
  const container = document.getElementById("modalContent");

  const subjectSqft = subject["SQFT"] || "-";
  const subjectBeds = subject["Beds"] || "-";
  const fullBaths   = subject["Bathrooms Full"] || 0;
  const halfBaths   = subject["Bathrooms Half"] || 0;
  const subjectBaths = (fullBaths || halfBaths) ? `${fullBaths}.${halfBaths}` : "-";

  let subjectValueHTML = "";
  if (type === "sales") {
    subjectValueHTML = `
      List Price: ${formatCurrency(subject["List Price"])} ||
      ARV: ${subject.ARV && subject.ARV !== "No Comps"
        ? formatCurrency(subject.ARV)
        : subject.ARV || "-"}
    `;
  } else {
    subjectValueHTML = `
      List Price: ${formatCurrency(subject["List Price"])} ||
      Rent: ${subject.rent && subject.rent !== "No Comps"
        ? formatCurrency(subject.rent)
        : subject.rent || "-"}
    `;
  }

  let html = `
    <h3>Subject Property</h3>
    <p>
      <strong>
        <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${subject.MLS}" target="_blank">
          ${subject.Address || ""}
        </a>
      </strong>
    </p>
    <p>${subjectValueHTML}</p>
    <p>${subjectSqft} SqFt || ${subjectBeds} Beds | ${subjectBaths} Baths || DOM ${subject.CDOM || "-"}</p>
    <hr>
    <h3>${type === "sales" ? "Comparable Sales" : "Rental Comps"}</h3>
  `;

  if (!comps.length) {
    html += `<p>No comps available.</p>`;
  } else {
    comps.forEach(comp => {

      const isHighlighted =
        (type === "sales" && comp.usedForARV) ||
        (type === "rent" && comp.usedForRent);

      const highlightClass = isHighlighted ? "highlight-comp" : "";

      if (type === "sales") {
        html += `
          <p class="${highlightClass}">
            <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"] || ""}" target="_blank">
              ${comp.Address || ""}
            </a><br>
            ${comp["PR AbvFinSQFT"] || "-"} SqFt ||
            ${comp.Beds || "-"} Beds |
            ${(comp["Bathrooms Full"] || 0)}.${(comp["Bathrooms Half"] || 0)} Baths ||
            Sold: ${formatCurrency(comp["Close Price"])} ||
            DOM ${comp["CDOM"] || "-"}
          </p>
          <hr>
        `;
      } else {
        html += `
          <p class="${highlightClass}">
            <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"] || ""}" target="_blank">
              ${comp.Address || ""}
            </a><br>
            ${comp["PR AbvFinSQFT"] || "-"} SqFt ||
            ${comp.Beds || "-"} Beds ||
            Rent: ${formatCurrency(comp.adjustedRent)} ||
            DOM ${comp["CDOM"] || "-"}
          </p>
          <hr>
        `;
      }
    });
  }

  container.innerHTML = html;
}
///***********************************///


function renderTable() {
  const tbody = document.querySelector("#dealsTable tbody");
  tbody.innerHTML = "";

  let filtered = deals.filter(applyFilters);

  filtered.sort((a, b) => {
    let valA = parseNumber(a[currentSort.column]);
    let valB = parseNumber(b[currentSort.column]);
    return currentSort.asc ? valA - valB : valB - valA;
  });

  const fragment = document.createDocumentFragment();

  filtered.forEach((row) => {
    const tr = document.createElement("tr");

    const percentBelow = parseNumber(row["% Below ARV"]);
    const compCount = parseInt(row["Comp Count"]) || 0;

    const grm = calculateGRM(row["List Price"], row["Rent"]);

    let icons = "";
    if ((row["Sale Type"] || "").toLowerCase().includes("auction")) {
      icons += "🔨 ";
    }
    if (row.Waterfront === "TRUE") {
      icons += "🌊 ";
    }

   const salesCompCount = parseInt(row["Comp Count"]) || 0;
   const rentCompCount = parseInt(row["Rent Comp Count"]) || 0;
     
   tr.innerHTML = `
     <td>${icons}
        <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.MLS}" target="_blank">
          ${row.MLS}
        </a>
      </td>
      
      <td>${row["Structure Type"] || "-"}</td>
      
      <td>${row.Address || ""}</td>
      <td>${row.County || ""}</td>
     <td>${formatCurrency(row["List Price"])}</td>
   
     <td>
       ${
         row.ARV && row.ARV.toString().trim() !== "No Comps"
           ? formatCurrency(row.ARV)
           : row.ARV || ""
       }
     </td>
   
     <td>${formatCurrency(row["Diff"])}</td>
     <td>${formatPercent(row["% Below ARV"])}</td>
      <td>${row.CDOM ? row.CDOM : "-"}</td>
     <td>
  <a href="#" class="salesCompLink"
     data-sales-comp='${encodeURIComponent(row["Comp Details"] || "[]")}'
     data-row='${encodeURIComponent(JSON.stringify(row))}'>
     ${salesCompCount}
  </a>
</td>

<td>${formatCurrency(row["Rent"])}</td>

<td>
  <a href="#" class="rentCompLink"
     data-rent-comp='${encodeURIComponent(row["Rent Comp Details"] || "[]")}'
     data-row='${encodeURIComponent(JSON.stringify(row))}'>
     ${rentCompCount}
  </a>
</td>


      <td>
        <button class="analyzeFlipBtn"
          data-price="${row["List Price"]}"
          data-arv="${row["ARV"]}"
          data-taxes="${row["Tax Annual Amount"]}"
          data-hoa="${row["HOA Fee"]}"
          data-hoafreq="${row["Association Fee Frequency"]}"
          data-condo="${row["Condo/Coop Fee"]}"
          data-condofreq="${row["Condo/Coop Fee Freq"]}"
          data-address="${encodeURIComponent(row["Address"])}">
          Flip
        </button>
        <button class="analyzeRentBtn" data-mls="${row.MLS}">Rental</button>
      </td>
     
   `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

   document.querySelectorAll(".analyzeFlipBtn")
  .forEach(btn => btn.addEventListener("click", analyzeDealFromButton));

  attachSortHandlers();
  updateSortArrows();

  document
    .querySelectorAll(".compLink")
    .forEach((link) => link.addEventListener("click", openCompModal));

   document.querySelectorAll(".salesCompLink")
  .forEach(link => link.addEventListener("click", openCompModal));

   document.querySelectorAll(".rentCompLink")
     .forEach(link => link.addEventListener("click", openCompModal));
}

/* ============================= */
function populateCountyFilter() {
  const counties = [...new Set(deals.map(d => d.County).filter(Boolean))].sort();
  const select = document.getElementById("countyFilter");

  select.innerHTML = '<option value="">All Counties</option>';

  counties.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

   function applyFilters(row) {
   
     if (!row.MLS || row.MLS.trim() === "")
       return false;
   
     const selectedCounty = document.getElementById("countyFilter").value;
     const zipInput = document.getElementById("zipFilter").value.trim();
   
     const maxPrice = parseNumber(document.getElementById("priceFilter").value);
     const minDiff = parseNumber(document.getElementById("diffFilter").value);
     const minPercent = parseFloat(document.getElementById("percentFilter").value);
     
     const showCondo = document.getElementById("showCondo").checked === true;
     const showNoComps = document.getElementById("showNoComps").checked;
     const showAuction = document.getElementById("showAuction").checked;
     const hideWaterfront = document.getElementById("hideWaterfront").checked;
   
     if (selectedCounty && row.County !== selectedCounty)
       return false;
   
     // ZIP filter
     if (zipInput) {
       const zipArray = zipInput.split(",").map(z => z.trim());
       const rowZipMatch = (row.Address || "").match(/\b\d{5}\b/);
       if (!rowZipMatch || !zipArray.includes(rowZipMatch[0]))
         return false;
     }
   
     if (!showCondo && (row["Structure Type"] || "").toUpperCase() === "CONDO")
        return false;
      
      if (!showNoComps && row.ARV && row.ARV.toString().trim() === "No Comps")
       return false;
   
     if (!showAuction && (row["Sale Type"] || "").toLowerCase().includes("auction"))
       return false;
   
     if (hideWaterfront && row.Waterfront === "TRUE")
       return false;
   
     if (maxPrice && parseNumber(row["List Price"]) > maxPrice)
       return false;
   
     if (minDiff && parseNumber(row["Diff"]) < minDiff)
       return false;
   
     if (!isNaN(minPercent) && parseNumber(row["% Below ARV"]) < minPercent)
       return false;
   
     return true;
   }


/* ============================= */
/* SORT */
/* ============================= */

function attachSortHandlers() {
  document.querySelectorAll(".sortable").forEach((th) => {
    th.onclick = () => {
      const column = th.dataset.sort;

      if (currentSort.column === column) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.column = column;
        currentSort.asc = true;
      }

      renderTable();
    };
  });
}

function updateSortArrows() {
  document.querySelectorAll(".sort-arrow").forEach((el) => {
    el.textContent = "⇅";
    el.classList.remove("sort-asc", "sort-desc");
  });

  const active = document.querySelector(
    `.sortable[data-sort="${currentSort.column}"] .sort-arrow`
  );

  if (active) {
    active.textContent = currentSort.asc ? "▲" : "▼";
    active.classList.add(currentSort.asc ? "sort-asc" : "sort-desc");
  }
}

/* ============================= */
/* INPUT FORMATTING */
/* ============================= */

function setupCurrencyInputs() {
  ["priceFilter", "diffFilter"].forEach(id => {
    const input = document.getElementById(id);

    input.addEventListener("blur", () => {
      const num = parseNumber(input.value);
      if (num) {
        input.value = "$" + num.toLocaleString("en-US", {
          maximumFractionDigits: 0
        });
      }
    });

    input.addEventListener("focus", () => {
      input.value = parseNumber(input.value) || "";
    });
  });
}

/* ============================= */
/* UTILITIES */
/* ============================= */

function calculateGRM(price, rent) {
  let p = parseNumber(price);
  let r = parseNumber(rent);
  if (!p || !r) return null;
  return p / (r * 12);
}

function parseNumber(val) {
  if (!val) return 0;
  const cleaned = val.toString().replace(/[$,%]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(val) {
  const num = parseNumber(val);
  if (!num) return "";
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(val) {
  const num = parseNumber(val);
  if (!num) return "";
  return num.toFixed(0) + "%";
}

/* ============================= */



/* ============================= */
/* CLOSE MODAL */
/* ============================= */

function closeModal() {
  document.getElementById("compModal").style.display = "none";
}

/* ============================= */
/* CLICK OUTSIDE TO CLOSE */
/* ============================= */

window.addEventListener("click", function(event) {
  const modal = document.getElementById("compModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

const LOGIN_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw767VP1uUIPk3RGgxJJnPi3kymTYyhkZiRqN-6z3T27SINQzrK6fGUI7sUdFS7Q0zBtA/exec";

function updateLastLogin(userId) {
  fetch(LOGIN_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ userId: userId }),
    headers: {
      "Content-Type": "application/json"
    }
  }).catch(err => console.error("Login timestamp error:", err));
}

function normalizeFrequency(freq) {
  if (!freq) return "monthly";

  const f = freq.toLowerCase();

  if (f.includes("month")) return "monthly";
  if (f.includes("quarter")) return "quarterly";
  if (f.includes("semi")) return "semi-annually";
  if (f.includes("annual") || f.includes("year")) return "annually";

  return "monthly";
}
function analyzeDealFromButton(e) {

  const btn = e.currentTarget;


  const params = new URLSearchParams({
    price: btn.dataset.price || 0,
    arv: btn.dataset.arv || 0,
    taxes: btn.dataset.taxes || 0,
    hoa: btn.dataset.hoa || 0,
    hoaFreq: normalizeFrequency(btn.dataset.hoafreq),
    condo: btn.dataset.condo || 0,
    condoFreq: normalizeFrequency(btn.dataset.condofreq),
    address: decodeURIComponent(btn.dataset.address || "")
  });

  window.open(`analyzer.html?${params.toString()}`, "_blank");
}





















