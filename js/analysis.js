/* ===============================
   AUTH CHECK
================================ */

if (sessionStorage.getItem("investorAuth") !== "true") {
  window.location.href = "index.html"; // your login page
}

document.addEventListener("DOMContentLoaded", function() {

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      sessionStorage.clear();
      window.location.href = "index.html";
    });
  }

});

document.addEventListener("DOMContentLoaded", function() {

  const params = new URLSearchParams(window.location.search);

  const price = params.get("price");
  const arv = params.get("arv");
  const taxes = params.get("taxes");
  const hoa = params.get("hoa");
  const hoaFreq = params.get("hoaFreq");
  const condo = params.get("condo");
  const condoFreq = params.get("condoFreq");
  const address = params.get("address");

  if (price) document.getElementById("priceInput").value = price;
  if (arv) document.getElementById("arvInput").value = arv;
  if (taxes) document.getElementById("taxes").value = taxes;
  if (hoa) document.getElementById("hoa").value = hoa;
  if (hoaFreq) document.getElementById("hoaFreq").value = hoaFreq;
  if (condo) document.getElementById("condo").value = condo;
  if (condoFreq) document.getElementById("condoFreq").value = condoFreq;
  if (address) document.getElementById("address").value = address;

});

/* ===============================
   CONFIG
================================ */

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzuGtr2AtmQB9-E0vVxRaS-Jtpgz8anqbHO6LGCxJPGPD3Oom8wV9nFRtdU-HPjPI_x/exec";

/* ===============================
   GOOGLE AUTOCOMPLETE
================================ */

let autocomplete;
let geoData = {};

function initAutocomplete() {

  const input = document.getElementById("address");

  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["address"],
    componentRestrictions: { country: "us" }
  });

  autocomplete.addListener("place_changed", function () {

    const place = autocomplete.getPlace();

    if (!place || !place.formatted_address) return;

    document.getElementById("address").value = place.formatted_address;

    geoData.address = place.formatted_address;
    geoData.lat = place.geometry.location.lat();
    geoData.lng = place.geometry.location.lng();

    place.address_components.forEach(function (comp) {

      if (comp.types.includes("postal_code"))
        geoData.zip = comp.long_name;

      if (comp.types.includes("administrative_area_level_2"))
        geoData.county = comp.long_name;

      if (comp.types.includes("neighborhood"))
        geoData.neighborhood = comp.long_name;
    });

  });
}

window.initAutocomplete = initAutocomplete;

/* ===============================
   GARAGE TOGGLE
================================ */

document.getElementById("garage").addEventListener("change", e => {
  const group = document.getElementById("garageSpacesGroup");
  group.classList.toggle("hidden", e.target.value === "0");
});

/* ===============================
   ANALYZE BUTTON
================================ */

document.getElementById("analyzeBtn").addEventListener("click", analyzeProperty);

async function analyzeProperty() {

  const btn = document.getElementById("analyzeBtn");
  const loading = document.getElementById("loading");
  const results = document.getElementById("resultsSection");
  const errorCard = document.getElementById("errorCard");

  btn.disabled = true;
  loading.classList.remove("hidden");
  errorCard.classList.add("hidden");
  results.classList.add("hidden");

  const formData = new URLSearchParams();

  formData.append("address", geoData.address || document.getElementById("address").value);
  formData.append("structure", document.getElementById("structure").value);
  formData.append("beds", document.getElementById("beds").value);
  formData.append("fullBath", document.getElementById("fullBath").value);
  formData.append("halfBath", document.getElementById("halfBath").value);
  formData.append("sqft", document.getElementById("sqft").value);
  formData.append("waterfront", document.getElementById("waterfront").value);
  formData.append("garageSpaces",
    document.getElementById("garage").value === "1"
      ? document.getElementById("garageSpaces").value || 1
      : 0
  );
  formData.append("listPrice", document.getElementById("listPrice").value || 0);

  try {

      console.log("Sending payload:");
      console.log({
        address,
        structure,
        beds,
        fullBath,
        halfBath,
        sqft,
        waterfront,
        garageSpaces,
        listPrice
      });
     
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: formData
    });
   
    const data = await response.json();
   
    if (data.error) {
      showError(data.error);
    } else {
      displayResults(data);
    }

  } catch (err) {
    showError("Network error. Please try again.");
  }

  btn.disabled = false;
  loading.classList.add("hidden");
}
/* ============================= */
/* ANALYZE Flip BUTTONS */
/* ============================= */

function buildAnalyzeURL(type, data) {

  const baseURL =
    type === "rent"
      ? "rent-analyzer.html"
      : "analyzer.html";

  const addressInput = document.getElementById("address");
  const priceInput   = document.getElementById("listPrice");

  const address = addressInput ? addressInput.value : "";
  const price   = priceInput ? priceInput.value : 0;

  const params = new URLSearchParams({
    price: price || 0,
    arv: data.arv || 0,
    rent: data.rent || 0,
    address: address || ""
  });

  return `${baseURL}?${params.toString()}`;
}

function formatCurrencyInput(value) {
  const number = value.replace(/[^0-9]/g, "");
  if (!number) return "";
  return "$" + Number(number).toLocaleString("en-US");
}

/* ===============================
   DISPLAY RESULTS
================================ */

function displayResults(data) {

  const summary = document.getElementById("summaryCard");

  summary.innerHTML = `
    <h2>ARV ${formatCurrency(data.arv)}</h2>

    <div class="summary-metrics">
      <div>Rent: ${formatCurrency(data.rent)}</div>
      <div class="${data.diff >= 0 ? "green" : "red"}">
        Diff: ${formatCurrency(data.diff)}
      </div>
      <div class="${data.diff >= 0 ? "green" : "red"}">
        ARV Discount: ${Number(data.diffPct).toFixed(2)}%
      </div>
    </div>
  `;
   
  populateCompTable(data.comps);       // Sales comps
  populateRentCompTable(data.rentComps); // Rental comps

  document.getElementById("resultsSection")
    .classList.remove("hidden");

   document.getElementById("analyzeButtons")
  .classList.remove("hidden");

   const subject = data.subject || {}; // however you store subject

   document.getElementById("analyzeFlipBtn").onclick = function () {
     const url = buildAnalyzeURL("flip", data);
     window.open(url, "_blank");
   };
   
   document.getElementById("analyzeRentBtn").onclick = function () {
     const url = buildAnalyzeURL("rent", data);
     window.open(url, "_blank");
   };
}

function showError(message) {
  const errorCard = document.getElementById("errorCard");
  errorCard.innerHTML = message;
  errorCard.classList.remove("hidden");
}

/* ===============================
   COMP TABLE
================================ */

function populateCompTable(comps) {
  const tbody = document.querySelector("#compTable tbody");
  tbody.innerHTML = "";

  // sort so flagged comps come first
  const sorted = comps.slice().sort((a, b) => {
    if (a.usedForARV && !b.usedForARV) return -1;
    if (!a.usedForARV && b.usedForARV) return 1;
    return 0;
  });

  sorted.forEach((comp, index) => {
    const tr = document.createElement("tr");

    // highlight top 2
    if (index < 2) tr.classList.add("highlight-comp");

    tr.innerHTML = `
      <td>
        <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"] || ""}"
           target="_blank">
           ${comp["Address"] || ""}
        </a>
      </td>
      <td>${formatCurrency(comp["Close Price"])}</td>
      <td>${comp["PR AbvFinSQFT"] || ""}</td>
      <td>${comp["Beds"] || ""}</td>
      <td>${comp["Bathrooms Full"] || ""}</td>
      <td>${comp["Bathrooms Half"] || ""}</td>
      <td>${comp["Distance"] ? comp["distance"].toFixed(2) + " mi" : ""}</td>
      <td>${formatCurrency(comp["adjustedPrice"] || comp["Adjusted Price"] || 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function populateRentCompTable(rentComps) {
  const tbody = document.querySelector("#rentCompTable tbody");
  tbody.innerHTML = "";

  // sort so flagged rent comps come first
  const sorted = rentComps.slice().sort((a, b) => {
    if (a.usedForRent && !b.usedForRent) return -1;
    if (!a.usedForRent && b.usedForRent) return 1;
    return 0;
  });

  sorted.forEach((comp, index) => {
    const tr = document.createElement("tr");

    // highlight top 2 rents
    if (index < 2) tr.classList.add("highlight-comp");

    tr.innerHTML = `
      <td>
        <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"] || ""}"
           target="_blank">
           ${comp["Address"] || ""}
        </a>
      </td>
      <td>${formatCurrency(comp["Close Price"])}</td>
      <td>${comp["PR AbvFinSQFT"] || ""}</td>
      <td>${comp["Beds"] || ""}</td>
      <td>${comp["Bathrooms Full"] || ""}</td>
      <td>${comp["Bathrooms Half"] || ""}</td>
      <td>${comp["Distance"] ? comp["distance"].toFixed(2) + " mi" : ""}</td>
      <td>${formatCurrency(comp.adjustedRent || 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===============================
   FORMATTERS
================================ */

function formatCurrency(val) {
  return "$" + Number(val).toLocaleString("en-US", {
    maximumFractionDigits: 0
  });
}
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function() {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}
const listPriceInput = document.getElementById("listPrice");

listPriceInput.addEventListener("blur", function () {
  this.value = formatCurrencyInput(this.value);
});
