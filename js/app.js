document.addEventListener("DOMContentLoaded", function () {

const SHEET_ID = "1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY";
const SHEET_NAME = "Sheet1";

let rawData = [];
let filteredData = [];

async function fetchDeals() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    const text = await response.text();

    parseCSV(text);
    populateCountyDropdown();
    initFilters();
    sortAndRender(rawData);

  } catch (err) {
    console.error("Sheet Load Error:", err);
  }
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  rawData = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = parseCSVRow(rows[i]);
    if (cols.length < 10) continue;

    const countyClean = (cols[2] || "").trim();

    const arvValue = cols[4] === "No Comps" ? null : toNumber(cols[4]);

    rawData.push({
      mls: cols[0] || "",
      address: cols[1] || "",
      county: countyClean,
      list: toNumber(cols[3]),
      arv: arvValue,
      diff: arvValue === null ? 0 : toNumber(cols[5]),
      percent: arvValue === null ? 0 : toNumber(cols[6]),
      rent: toNumber(cols[7]),
      compCount: parseInt(cols[8]) || 0,
      confidence: cols[9] || "",
      compDetails: cols.slice(10).join(",") || "[]"
    });
  }
}

function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function toNumber(val) {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
}

function populateCountyDropdown() {
  const countySelect = document.getElementById("countyFilter");
  if (!countySelect) return;

  const counties = [...new Set(
    rawData
      .map(d => d.county)
      .filter(c => c && c.length > 0)
  )].sort();

  countySelect.innerHTML = `<option value="">All Counties</option>`;

  counties.forEach(county => {
    const option = document.createElement("option");
    option.value = county;
    option.textContent = county;
    countySelect.appendChild(option);
  });
}

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
      <td class="comp-link" data-comps='${encodeURIComponent(row.compDetails)}'>
        ${row.compCount}
      </td>
      <td>${row.confidence}</td>
    `;

    tbody.appendChild(tr);
  });

  attachCompClicks();
}

function attachCompClicks() {
  document.querySelectorAll(".comp-link").forEach(el => {
    el.addEventListener("click", function() {
      let comps = [];
      try {
        comps = JSON.parse(decodeURIComponent(this.dataset.comps));
      } catch {
        comps = [];
      }
      showModal(comps);
    });
  });
}

function showModal(comps) {
  const modal = document.getElementById("compModal");
  const content = document.getElementById("compContent");

  if (!comps.length) {
    content.innerHTML = "<p>No comp details available.</p>";
  } else {
    content.innerHTML = comps.map(c => `
      <div>
        <strong>${c.address}</strong><br/>
        ${c.sqft} sqft | ${c.beds} bd | ${c.baths} ba<br/>
        Sold: $${Number(c.price).toLocaleString()}<br/>
        Radius: ${c.radius} mi
        <hr/>
      </div>
    `).join("");
  }

  modal.style.display = "flex";
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("compModal").style.display = "none";
};

function initFilters() {
  document.querySelectorAll(".filters input, .filters select")
    .forEach(el => el.addEventListener("input", applyFilters));
}

function applyFilters() {
  const minPercent = parseFloat(document.getElementById("minPercent").value);
  const minDiff = parseFloat(document.getElementById("minDiff").value);
  const hideNoComps = document.getElementById("hideNoComps").checked;
  const confidence = document.getElementById("confidenceFilter").value;
  const county = document.getElementById("countyFilter").value;

  filteredData = rawData.filter(row => {
    if (hideNoComps && row.arv === null) return false;
    if (county && row.county !== county) return false;
    if (!isNaN(minPercent) && row.percent < minPercent) return false;
    if (!isNaN(minDiff) && row.diff < minDiff) return false;
    if (confidence && row.confidence !== confidence) return false;
    return true;
  });

  sortAndRender(filteredData);
}

function sortAndRender(data) {
  const sortBy = document.getElementById("sortBy")?.value || "diff";

  data.sort((a, b) => {
    if (sortBy === "diff") return b.diff - a.diff;
    if (sortBy === "percent") return b.percent - a.percent;
    if (sortBy === "price") return a.list - b.list;
  });

  renderTable(data);
}

fetchDeals();

});
