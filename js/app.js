const SHEET_ID = "1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY";
const SHEET_NAME = "Sheet1";

let rawData = [];
let filteredData = [];

async function fetchDeals() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    const text = await response.text();

    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    rawData = rows.map(r => ({
      mls: r.c[0]?.v || "",
      address: r.c[1]?.v || "",
      county: r.c[2]?.v || "",
      list: r.c[3]?.v || 0,
      arv: r.c[4]?.v === "No Comps" ? null : r.c[4]?.v,
      diff: r.c[5]?.v || 0,
      percent: r.c[6]?.v || 0,
      rent: r.c[7]?.v || 0,
      compCount: r.c[8]?.v || 0,
      confidence: r.c[9]?.v || "",
      compDetails: r.c[10]?.v || "[]"
    }));

    initFilters();
    sortAndRender(rawData);

  } catch (err) {
    console.error("Sheet Load Error:", err);
  }
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
      <td>$${Number(row.list).toLocaleString()}</td>
      <td>${row.arv ? "$" + Number(row.arv).toLocaleString() : "No Comps"}</td>
      <td class="${diffClass}">
        ${row.arv ? "$" + Number(row.diff).toLocaleString() : "-"}
      </td>
      <td>
        ${row.arv ? Number(row.percent).toFixed(1) + "%" : "-"}
      </td>
      <td>${row.rent ? "$" + Number(row.rent).toLocaleString() : "-"}</td>
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
