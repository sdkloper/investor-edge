const CSV_URL = "https://docs.google.com/spreadsheets/d/1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY/export?format=csv";

let rawData = [];
let filteredData = [];

async function fetchDeals() {
  const response = await fetch(CSV_URL);
  const text = await response.text();
  parseCSV(text);
  initFilters();
  sortAndRender(rawData);
}

function parseCSV(text) {
  const rows = text.trim().split("\n");
  rawData = rows.slice(1).map(row => {
    const cols = parseRow(row);

    return {
      mls: cols[0] || "",
      address: cols[1] || "",
      county: cols[2] || "",
      list: cleanNumber(cols[3]),
      arv: cols[4] === "No Comps" ? null : cleanNumber(cols[4]),
      diff: cleanNumber(cols[5]),
      percent: cleanNumber(cols[6]),
      rent: cleanNumber(cols[7]),
      compCount: parseInt(cols[8]) || 0,
      confidence: cols[9] || "",
      compDetails: cols[10] || "[]"
    };
  });
}

function parseRow(row) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function cleanNumber(value) {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

function renderTable(data) {
  const tbody = document.querySelector("#dealsTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    const diffClass = !row.arv ? "gray" :
      row.diff > 30000 ? "green" :
      row.diff > 10000 ? "yellow" : "red";

    tr.innerHTML = `
      <td><a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.mls}" target="_blank">${row.mls}</a></td>
      <td>${row.address}</td>
      <td>${row.county}</td>
      <td>$${row.list.toLocaleString()}</td>
      <td>${row.arv ? "$" + row.arv.toLocaleString() : "No Comps"}</td>
      <td class="${diffClass}">
        ${row.arv ? "$" + row.diff.toLocaleString() : "-"}
      </td>
      <td>
        ${row.arv ? row.percent.toFixed(1) + "%" : "-"}
      </td>
      <td>${row.rent ? "$" + row.rent.toLocaleString() : "-"}</td>
      <td class="comp-link" data-comps='${escapeQuotes(row.compDetails)}'>
        ${row.compCount}
      </td>
      <td>${row.confidence}</td>
    `;

    tbody.appendChild(tr);
  });

  attachCompClicks();
}

function escapeQuotes(str) {
  return str.replace(/'/g, "&apos;");
}

function attachCompClicks() {
  document.querySelectorAll(".comp-link").forEach(el => {
    el.addEventListener("click", function() {
      let comps = [];

      try {
        comps = JSON.parse(this.dataset.comps);
      } catch (e) {
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
  const minPercent = parseFloat(document.getElementById("minPercent").value) || -999;
  const minDiff = parseFloat(document.getElementById("minDiff").value) || -999;
  const hideNoComps = document.getElementById("hideNoComps").checked;
  const confidence = document.getElementById("confidenceFilter").value;

  filteredData = rawData.filter(row => {
    if (hideNoComps && !row.arv) return false;
    if (row.percent < minPercent) return false;
    if (row.diff < minDiff) return false;
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

let rawData = [];
let filteredData = [];

async function fetchDeals() {
  const response = await fetch(CSV_URL);
  const text = await response.text();
  parseCSV(text);
  initFilters();
  renderTable(rawData);
}

function parseCSV(text) {
  const rows = text.split("\n").slice(1);

  rawData = rows.map(r => {
    const cols = r.split(",");
    return {
      mls: cols[0],
      address: cols[1],
      county: cols[2],
      list: parseFloat(cols[3]),
      arv: cols[4] === "No Comps" ? null : parseFloat(cols[4]),
      diff: parseFloat(cols[5]),
      percent: parseFloat(cols[6]),
      rent: cols[7],
      compCount: parseInt(cols[8]),
      confidence: cols[9],
      compDetails: cols[10]
    };
  });
}

function renderTable(data) {
  const tbody = document.querySelector("#dealsTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    const diffClass = !row.arv ? "gray" :
      row.diff > 30000 ? "green" :
      row.diff > 10000 ? "yellow" : "red";

    tr.innerHTML = `
      <td><a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.mls}" target="_blank">${row.mls}</a></td>
      <td>${row.address}</td>
      <td>${row.county}</td>
      <td>$${row.list?.toLocaleString()}</td>
      <td>${row.arv ? "$" + row.arv.toLocaleString() : "No Comps"}</td>
      <td class="${diffClass}">$${row.diff?.toLocaleString()}</td>
      <td>${row.percent ? row.percent + "%" : "-"}</td>
      <td>${row.rent || "-"}</td>
      <td class="comp-link" data-comps='${row.compDetails}'>${row.compCount}</td>
      <td>${row.confidence}</td>
    `;

    tbody.appendChild(tr);
  });

  attachCompClicks();
}

function attachCompClicks() {
  document.querySelectorAll(".comp-link").forEach(el => {
    el.addEventListener("click", function() {
      const comps = JSON.parse(this.dataset.comps || "[]");
      showModal(comps);
    });
  });
}

function showModal(comps) {
  const modal = document.getElementById("compModal");
  const content = document.getElementById("compContent");

  content.innerHTML = comps.map(c => `
    <div>
      <strong>${c.address}</strong><br/>
      ${c.sqft} sqft | ${c.beds} bd | ${c.baths} ba<br/>
      Sold: $${c.price}<br/>
      Radius: ${c.radius} mi
      <hr/>
    </div>
  `).join("");

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
  const minPercent = parseFloat(document.getElementById("minPercent").value) || -999;
  const minDiff = parseFloat(document.getElementById("minDiff").value) || -999;
  const hideNoComps = document.getElementById("hideNoComps").checked;
  const confidence = document.getElementById("confidenceFilter").value;

  filteredData = rawData.filter(row => {
    if (hideNoComps && !row.arv) return false;
    if (row.percent < minPercent) return false;
    if (row.diff < minDiff) return false;
    if (confidence && row.confidence !== confidence) return false;
    return true;
  });

  sortData();
}

function sortData() {
  const sortBy = document.getElementById("sortBy").value;

  filteredData.sort((a,b) => {
    if (sortBy === "diff") return b.diff - a.diff;
    if (sortBy === "percent") return b.percent - a.percent;
    if (sortBy === "price") return a.list - b.list;
  });

  renderTable(filteredData);
}


fetchDeals();
