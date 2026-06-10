
/* =========================================
   INVESTOR EDGE - ENHANCED UX VERSION
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

  document.getElementById("dealsLoading").style.display = "block";
   loadCSV(); 
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
     "Loading Investor Edge...";
   
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

    const result =
      await response.json();

    if (!result.success) {

      document
        .getElementById("loginError")
        .textContent =
        "Invalid credentials.";
       
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
       
      return;

    }

    const termsCheckbox =
      document.getElementById("terms");

    const disclaimerStatus =
      document.getElementById(
        "disclaimerStatus"
      );

    if (result.disclaimerAccepted) {

      termsCheckbox.checked = true;

      termsCheckbox.disabled = true;

      disclaimerStatus.textContent =
        "Disclaimer previously accepted on " +
        result.disclaimerTimestamp;

    }
    else {

      if (!termsCheckbox.checked) {

        document
          .getElementById("loginError")
          .textContent =
          "You must agree to the Disclaimer before logging in.";

         loginBtn.disabled = false;
         loginBtn.textContent = "Login";
         
        return;

      }

      updateDisclaimerAcceptance(
        result.userId
      );

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

function getField(row, key) {
  return Object.keys(row).find(k => k.trim() === key)?.let
    ? row[Object.keys(row).find(k => k.trim() === key)]
    : "";
}

async function getDealsUrl() {

  const response =
    await fetch(WEB_APP_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },

      body: new URLSearchParams({
        type: "getDealsUrl"
      })

    });

  return await response.json();

}

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

async function loadCSV() {

  try {

    const result =
      await getDealsUrl();

    if (!result.success) {

      console.error(
        "Unable to retrieve Deals URL"
      );

      return;

    }

    const csvUrl =
      result.url +
      "&t=" +
      new Date().getTime();

    Papa.parse(csvUrl, {

      download: true,

      header: true,

      skipEmptyLines: true,

      worker: true,

      complete: function(results) {

        deals = results.data;

        populateCountyFilter();

        renderTable();

        document
          .getElementById(
            "dealsLoading"
          )
          .style.display =
          "none";

      }

    });

  }
  catch(err) {

    console.error(
      "Deals Load Error",
      err
    );

  }

}

/* ============================= */
///********** CompModal ******************///
/* =============================
   COMPS + RENTAL COMPS MODAL
   ============================= */

function openCompModal(e) {
  e.preventDefault();

  const clicked = e.currentTarget;
  const mls =
     clicked.dataset.mls;
   
   const subject =
     deals.find(
       d => d["MLS"] === mls
     );
   
   if (!subject) {
     console.error(
       "Subject not found:",
       mls
     );
     return;
   }

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
       <button class="tabBtn ${defaultTab === "sales" ? "active" : ""}" data-tab="sales">
         Sales Comps
       </button>
   
       <button class="tabBtn ${defaultTab === "rent" ? "active" : ""}" data-tab="rent">
         Rental Comps
       </button>
     </div>
   
     <div class="map-buttons">
       <button id="salesMapBtn" class="mapBtn">
         View Sales Map
       </button>
   
       <button id="rentMapBtn" class="mapBtn">
         View Rental Map
       </button>
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
   
   // MAP BUTTONS
   document
     .getElementById("salesMapBtn")
     .addEventListener("click", () => {
   
       showMap(
         "sales",
         subject,
         salesComps
       );
   
     });
   
   document
     .getElementById("rentMapBtn")
     .addEventListener("click", () => {
   
       showMap(
         "rent",
         subject,
         rentComps
       );
   
     });
   
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
     Rent: ${
       subject["Rent"] && subject["Rent"] !== "No Comps"
         ? formatCurrency(subject["Rent"])
         : subject["Rent"] || "-"
     }
   `;
  }
   
  let html = `
    <h3>Subject Property</h3>
    <p>
      <strong>
        <a href="https://www.saulkloper.com/listing-details?property_id=md257_${subject.MLS}" target="_blank" rel="noopener noreferrer">
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
            <a href="https://www.saulkloper.com/listing-details?property_id=md257_${comp["MLS Number"] || ""}" target="_blank" rel="noopener noreferrer">
              ${comp.Address || ""}
            </a><br>
            ${comp["PR AbvFinSQFT"] || "-"} SqFt ||
            ${comp.Beds || "-"} Beds |
            ${(comp["Bathrooms Full"] || 0)}.${(comp["Bathrooms Half"] || 0)} Baths ||
            Sold: ${formatCurrency(comp["Close Price"])} ||
            Adj: ${formatCurrency(comp["adjustedPrice"])} ||
            DOM ${comp["CDOM"] || "-"} ||
            Distance: ${comp["distance"] ||"-"}
          </p>
          <hr>
        `;
      } else {
        html += `
          <p class="${highlightClass}">
            <a href="https://www.saulkloper.com/listing-details?property_id=md257_${comp["MLS Number"] || ""}" target="_blank" rel="noopener noreferrer">
              ${comp.Address || ""}
            </a><br>
            ${comp["PR AbvFinSQFT"] || "-"} SqFt ||
            ${comp.Beds || "-"} Beds ||
            ${(comp["Bathrooms Full"] || 0)}.${(comp["Bathrooms Half"] || 0)} Baths ||
            Rent: ${formatCurrency(comp.adjustedRent)} ||
            DOM ${comp["CDOM"] || "-"} ||
            Distance: ${comp["distance"] ||"-"}
          </p>
          <hr>
        `;
      }
    });
  }

  container.innerHTML = html;
}
///***********************************///
  function showMap(type, subject, comps) {
      
     const mapModal =
       document.getElementById("mapModal");
   
     const mapBody =
       document.getElementById("mapModalBody");
   
     const subjectLat =
       subject["Latitude"];
   
     const subjectLon =
       subject["Longitude"];
   
     if (
       !subjectLat ||
       !subjectLon
     ) {
   
       mapBody.innerHTML =
         "<p>Subject coordinates unavailable.</p>";
   
       mapModal.style.display =
         "block";
   
       return;
     }
   
     let markers = [];
   
     // Subject Marker (Red)
   
     markers.push(
       `color:red|label:S|${subjectLat},${subjectLon}`
     );
   
     comps.forEach(comp => {
   
       const lat = comp["Latitude"];
       const lon = comp["Longitude"];
   
       if (!lat || !lon) return;
   
       let isAuthoritative = false;
   
       if (
         type === "sales" &&
         comp.usedForARV
       ) {
         isAuthoritative = true;
       }
   
       if (
         type === "rent" &&
         comp.usedForRent
       ) {
         isAuthoritative = true;
       }
   
       if (isAuthoritative) {
   
         markers.push(
           `color:green|${lat},${lon}`
         );
   
       } else {
   
         markers.push(
           `color:blue|${lat},${lon}`
         );
   
       }
   
     });
   
     const markerString =
        markers
          .map(m => "&markers=" + encodeURIComponent(m))
          .join("");
      
      // Center map on subject
      const center =
        `&center=${subjectLat},${subjectLon}`;

      const maxDistance = Math.max(
        ...comps.map(c =>
          Number(c.distance || 0)
        )
      );
      
      let zoom = 15;
      
      if (maxDistance > 4) {
        zoom = 11;
      }
      
      else if (maxDistance > 3) {
        zoom = 12;
      }
      else if (maxDistance > 2) {
        zoom = 13;
      }
      else if (maxDistance > .70) {
        zoom = 14;
      }
      else {
        zoom = 15;
      }
      console.log(
        "Max Distance:",
        maxDistance,
        "Zoom:",
        zoom
      );
      const mapUrl =
        `https://maps.googleapis.com/maps/api/staticmap?` +
        `size=700x500` +
        center +
        `&zoom=${zoom}` +
        markerString +
       `&key=AIzaSyAzmRrPFCK8iN0YigmtI7IIGTATqCHqQH0`;
   
     mapBody.innerHTML = `
       <h3>
         ${type === "sales"
           ? "Sales Comp Map"
           : "Rental Comp Map"}
       </h3>
   
       <button
         id="backToCompsBtn"
         class="mapBtn">
         Back To Comps
       </button>
   
       <p>
         <strong>
           ${subject.Address}
         </strong>
       </p>
   
       <img
         src="${mapUrl}"
         style="
           width:100%;
           max-width:800px;
           border:1px solid #ccc;
         "
       >
   
       <hr>
   
       <p>🔴 Subject Property</p>
       <p>🟢 Used For ${
         type === "sales"
           ? "ARV"
           : "Rent"
       }</p>
       <p>🔵 Display Only</p>
     `;
   
     document
       .getElementById("backToCompsBtn")
       .addEventListener(
         "click",
         () => {
   
           mapModal.style.display =
             "none";
   
         }
       );
   
     mapModal.style.display =
       "block";
   }

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
        <a href="https://www.saulkloper.com/listing-details?property_id=md257_${row.MLS}" target="_blank" rel="noopener noreferrer">
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
     data-mls='${row["MLS"]}'>
     ${salesCompCount}
  </a>
</td>

<td>${formatCurrency(row["Rent"])}</td>

<td>
  <a href="#" class="rentCompLink"
     data-rent-comp='${encodeURIComponent(row["Rent Comp Details"] || "[]")}'
     data-mls='${row["MLS"]}'>
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
        <button class="analyzeRentalBtn"
           data-price="${row["List Price"]}"
           data-rent="${row["Rent"]}"
           data-arv="${row["ARV"]}"
           data-taxes="${row["Tax Annual Amount"]}"
           data-hoa="${row["HOA Fee"]}"
           data-hoafreq="${row["Association Fee Frequency"]}"
           data-condo="${row["Condo/Coop Fee"]}"
           data-condofreq="${row["Condo/Coop Fee Freq"]}"
           data-address="${encodeURIComponent(row["Address"])}">
           Rental
         </button>
      </td>
     
   `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

   document.querySelectorAll(".analyzeFlipBtn")
  .forEach(btn => btn.addEventListener("click", analyzeDealFromButton));

   document.querySelectorAll(".analyzeRentalBtn")
     .forEach(btn => btn.addEventListener("click", analyzeRentalDealFromButton));
   
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

function updateDisclaimerAcceptance(userId) {

  fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      type: "disclaimer",
      userId: userId
    })
  }).catch(err =>
    console.error("Disclaimer update error:", err)
  );

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

  // ✅ Correct logging
         try {
           logActivity({
             action: "Analyze Flip",
             page: "Deals Page",
             address: decodeURIComponent(btn.dataset.address || ""),
             price: btn.dataset.price || "",
             arv: btn.dataset.arv || "",
             rent: btn.dataset.rent || ""
           });
         } catch (err) {
           console.warn("Logging failed:", err);
         }
    

  setTimeout(() => {
  window.location.href = `analyzer.html?${params.toString()}`;
}, 150);
}

function analyzeRentalDealFromButton(e) {

  const btn = e.currentTarget;


  const params = new URLSearchParams({
    price: btn.dataset.price || 0,
    arv: btn.dataset.arv || 0,
    rent: btn.dataset.rent || 0,
    taxes: btn.dataset.taxes || 0,
    hoa: btn.dataset.hoa || 0,
    hoaFreq: normalizeFrequency(btn.dataset.hoafreq),
    condo: btn.dataset.condo || 0,
    condoFreq: normalizeFrequency(btn.dataset.condofreq),
    address: decodeURIComponent(btn.dataset.address || "")
  });
   // ✅ Correct logging
      try {
        logActivity({
          action: "Analyze Rentals",
          page: "Deals Page",
          address: decodeURIComponent(btn.dataset.address || ""),
          price: btn.dataset.price || "",
          arv: btn.dataset.arv || "",
          rent: btn.dataset.rent || ""
        });
      } catch (err) {
        console.warn("Logging failed:", err);
      }
    

  setTimeout(() => {
  window.location.href = `rental-analyzer.html?${params.toString()}`;
}, 150);
}



















