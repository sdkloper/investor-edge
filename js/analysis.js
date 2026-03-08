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

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    geoData.lat = place.geometry.location.lat();
    geoData.lng = place.geometry.location.lng();

    place.address_components.forEach(comp => {
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

  const payload = {
    address: document.getElementById("address").value,
    structure: document.getElementById("structure").value,
    beds: Number(document.getElementById("beds").value),
    fullBath: Number(document.getElementById("fullBath").value),
    halfBath: Number(document.getElementById("halfBath").value),
    sqft: Number(document.getElementById("sqft").value),
    waterfront: document.getElementById("waterfront").value,
    garageSpaces: Number(document.getElementById("garage").value === "1"
      ? document.getElementById("garageSpaces").value || 1
      : 0),
    listPrice: Number(document.getElementById("listPrice").value || 0)
  };

  try {

    await fetch(BACKEND_URL, {
     method: "POST",
     mode: "no-cors",
     body: JSON.stringify(payload)
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

/* ===============================
   DISPLAY RESULTS
================================ */

function displayResults(data) {

  const summary = document.getElementById("summaryCard");

  summary.innerHTML = `
    <h2>${formatCurrency(data.arv)}</h2>
    <div class="summary-metrics">
      <div class="metric">Rent: ${formatCurrency(data.rent)}</div>
      <div class="metric ${data.diff >= 0 ? "green" : "red"}">
        Diff: ${formatCurrency(data.diff)}
      </div>
      <div class="metric ${data.diff >= 0 ? "green" : "red"}">
        ${data.diffPct}%
      </div>
    </div>
  `;

  populateCompTable(data.comps);

  document.getElementById("resultsSection")
    .classList.remove("hidden");
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

  comps.forEach(comp => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${comp.address || ""}</td>
      <td>${formatCurrency(comp.closePrice)}</td>
      <td>${comp.sqft || ""}</td>
      <td>${comp.beds || ""}</td>
      <td>${comp.fullBath || ""}</td>
      <td>${comp.halfBath || ""}</td>
      <td>${comp.distance || ""}</td>
      <td>${formatCurrency(comp.adjustedPrice)}</td>
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
