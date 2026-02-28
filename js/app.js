document.addEventListener("DOMContentLoaded", function () {

/* -------- PASSWORD -------- */

const accessCode = "investor2026";   // change this
const entered = prompt("Enter Access Code:");
if (entered !== accessCode) {
  document.body.innerHTML = "<h2 style='text-align:center;margin-top:100px;'>Access Denied</h2>";
  throw new Error("Access denied");
}

/* -------- CONFIG -------- */

const SHEET_ID = "1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY";
const SHEET_NAME = "Sheet1";

let rawData = [];
let filteredData = [];
let currentSort = { column: "diff", direction: "desc" };

const modal = document.getElementById("compModal");
const modalContent = document.getElementById("compContent");
const closeBtn = document.getElementById("modalCloseBtn");

/* -------- FETCH DATA -------- */

async function fetchDeals() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${SHEET_NAME}`;
  const response = await fetch(url);
  const text = await response.text();
  parseCSV(text);
  populateCountyDropdown();
  initFilters();
  enableHeaderSorting();
  sortAndRender(rawData);
}

/* -------- CSV PARSE -------- */

function parseCSV(text) {
  const rows = text.split(/\r?\n/);
  rawData = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i]) continue;

    const cols = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!cols || cols.length < 11) continue;

    const county = clean(cols[2]);
    const zip = extractZip(clean(cols[1]));
    const arvValue = cols[4] === "No Comps" ? null : toNumber(cols[4]);

    rawData.push({
      mls: clean(cols[0]),
      address: clean(cols[1]),
      county: county,
      zip: zip,
      list: toNumber(cols[3]),
      arv: arvValue,
      diff: arvValue === null ? 0 : toNumber(cols[5]),
      percent: arvValue === null ? 0 : toNumber(cols[6]),
      rent: toNumber(cols[7]),
      compCount: parseInt(cols[8]) || 0,
      confidence: clean(cols[9]),
      compDetails: clean(cols.slice(10).join(","))
    });
  }
}

function clean(val) {
  return val ? val.replace(/^"|"$/g, "").replace(/""/g, '"').trim() : "";
}

function toNumber(val) {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
}

function extractZip(address) {
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : "";
}

/* -------- COUNTY DROPDOWN -------- */

function populateCountyDropdown() {
  const countySelect = document.getElementById("countyFilter");
  const counties = [...new Set(rawData.map(d => d.county).filter(Boolean))].sort();

  countySelect.innerHTML = `<option value="">All Counties</option>`;
  counties.forEach(county => {
    const option = document.createElement("option");
    option.value = county;
    option.textContent = county;
    countySelect.appendChild(option);
  });
}

/* -------- TABLE -------- */

function renderTable(data) {
  const tbody = document.querySelector("#dealsTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    const diffClass = row.arv === null ? "gray" :
      row.diff > 30000 ? "green" :
      row.diff > 10000 ? "yellow" : "red";

    tr.innerHTML = `
      <td><a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.mls}" target="_blank">${row.mls}</a></td>
      <td>${row.address}</td>
      <td>${row.county}</td>
      <td>$${row.list.toLocaleString()}</td>
      <td>${row.arv === null ? "No Comps" : "$" + row.arv.toLocaleString()}</td>
      <td class="${diffClass}">
        ${row.arv === null ? "-" : "$" + row.diff.toLocaleString()}
      </td>
      <td>
        ${row.arv === null ? "-" : row.percent.toFixed(1) + "%"}
      </td>
      <td>${row.rent ? "$" + row.rent.toLocaleString() : "-"}</td>
      <td class="comp-link" data-comps="${encodeURIComponent(row.compDetails)}">
        ${row.compCount}
      </td>
      <td>${row.confidence}</td>
    `;

    tbody.appendChild(tr);
  });

  attachCompClicks();
}

/* -------- COMP MODAL -------- */

function attachCompClicks() {
  document.querySelectorAll(".comp-link").forEach(el => {
    el.addEventListener("click", function () {
      let comps = [];
      try {
        comps = JSON.parse(decodeURIComponent(this.dataset.comps));
      } catch {}
      showModal(comps);
    });
  });
}

function showModal(comps) {
  if (!comps || !comps.length) {
    modalContent.innerHTML = "<p>No comp details available.</p>";
  } else {
    modalContent.innerHTML = comps.map(c => `
      <div>
        <strong>${c["Address"] || "-"}</strong><br/>
        ${(c["PR AbvFinSQFT"] || "-")} sqft |
        ${(c["Beds"] || "-")} bd |
        ${(c["Bathrooms Full"] || "0")}/${(c["Bathrooms Half"] || "0")} ba<br/>
        Sold: $${c["Close Price"] ? Number(c["Close Price"]).toLocaleString() : "-"}
        <hr/>
      </div>
    `).join("");
  }

  modal.style.display = "flex";
}

/* CLOSE MODAL */

closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
document.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.style.display = "none";
});

/* -------- FILTERS -------- */

function initFilters() {
  document.querySelectorAll(".filters input, .filters select")
    .forEach(el => el.addEventListener("input", applyFilters));
}

function applyFilters() {
  const zipInput = document.getElementById("zipFilter").value;
  const zips = zipInput.split(",").map(z => z.trim()).filter(Boolean);

  const minPercent = parseFloat(document.getElementById("minPercent").value);
  const minDiff = parseFloat(document.getElementById("minDiff").value);
  const hideNoComps = document.getElementById("hideNoComps").checked;
  const confidence = document.getElementById("confidenceFilter").value;
  const county = document.getElementById("countyFilter").value;

  filteredData = rawData.filter(row => {
    if (hideNoComps && row.arv === null) return false;
    if (county && row.county !== county) return false;
    if (zips.length && !zips.includes(row.zip)) return false;
    if (!isNaN(minPercent) && row.percent < minPercent) return false;
    if (!isNaN(minDiff) && row.diff < minDiff) return false;
    if (confidence && row.confidence !== confidence) return false;
    return true;
  });

  sortAndRender(filteredData);
}

/* -------- SORT -------- */

function enableHeaderSorting() {
  const headers = document.querySelectorAll("#dealsTable thead th");

  headers.forEach((header, index) => {
    header.addEventListener("click", () => {
      let columnKey = null;
      if (index === 3) columnKey = "list";
      if (index === 5) columnKey = "diff";
      if (index === 6) columnKey = "percent";
      if (!columnKey) return;

      if (currentSort.column === columnKey) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort.column = columnKey;
        currentSort.direction = "desc";
      }

      sortAndRender(filteredData.length ? filteredData : rawData);
    });
  });
}

function sortAndRender(data) {
  data.sort((a, b) => {
    const col = currentSort.column;
    const dir = currentSort.direction === "asc" ? 1 : -1;
    return (a[col] - b[col]) * dir;
  });
  renderTable(data);
}

fetchDeals();

});
