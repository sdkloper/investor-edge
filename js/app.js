/* =========================================
   INVESTOR EDGE - FINAL STABLE VERSION
   ========================================= */

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY/export?format=csv&gid=0&t=" +
  new Date().getTime();

let deals = [];
let currentSort = { column: null, asc: false };

document.addEventListener("DOMContentLoaded", () => {

  // Default: hide negative diff
  document.getElementById("diffFilter").value = 0;

  loadCSV();

  document
    .getElementById("applyFilters")
    .addEventListener("click", renderTable);

  document
    .getElementById("closeModal")
    .addEventListener("click", closeModal);

});

/* ============================= */
/* LOAD CSV */
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
/* COUNTY DROPDOWN */
/* ============================= */

function populateCountyFilter() {
  const counties = [
    ...new Set(deals.map((d) => d.County).filter(Boolean)),
  ].sort();

  const select = document.getElementById("countyFilter");

  counties.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

/* ============================= */
/* RENDER TABLE */
/* ============================= */

function renderTable() {
  const tbody = document.querySelector("#dealsTable tbody");
  tbody.innerHTML = "";

  let filtered = deals.filter(applyFilters);

  if (currentSort.column) {
    filtered.sort((a, b) => {
      let valA = parseNumber(a[currentSort.column]);
      let valB = parseNumber(b[currentSort.column]);
      return currentSort.asc ? valA - valB : valB - valA;
    });
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((row) => {
    const tr = document.createElement("tr");

    const percentBelow = parseNumber(row["% Below ARV"]);
    const compCount = parseInt(row["Comp Count"]) || 0;

    if (compCount === 0) {
      tr.classList.add("nocomps");
    } else if (percentBelow >= 25) {
      tr.classList.add("positive");
    } else if (percentBelow >= 15) {
      tr.classList.add("moderate");
    } else {
      tr.classList.add("negative");
    }

    const grm = calculateGRM(row["List Price"], row["Rent"]);

    let icons = "";
    if ((row["Sale Type"] || "").toLowerCase().includes("auction")) {
      icons += "🔨 ";
    }
    if (row.Waterfront === "TRUE") {
      icons += "🌊 ";
    }

    tr.innerHTML = `
      <td>
        ${icons}
        <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.MLS}" target="_blank">
          ${row.MLS}
        </a>
      </td>

      <td>${row.Address || ""}</td>
      <td>${row.County || ""}</td>
      <td>${formatCurrency(row["List Price"])}</td>
      <td>${row.ARV || ""}</td>
      <td>${formatCurrency(row["Diff"])}</td>
      <td>${formatPercent(row["% Below ARV"])}</td>

      <td>
        <a href="#" class="compLink"
           data-comp='${encodeURIComponent(row["Comp Details"] || "[]")}'
           data-row='${encodeURIComponent(JSON.stringify(row))}'>
           ${compCount}
        </a>
      </td>

      <td>${formatCurrency(row["Rent"])}</td>
      <td>${grm !== null ? grm.toFixed(1) : "-"}</td>
    `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  attachSortHandlers();
  updateSortArrows();

  document
    .querySelectorAll(".compLink")
    .forEach((link) => link.addEventListener("click", openModal));
}

/* ============================= */
/* FILTERS */
/* ============================= */

function applyFilters(row) {

  const maxPrice = parseFloat(document.getElementById("priceFilter").value);
  const minDiff = parseFloat(document.getElementById("diffFilter").value);
  const minPercent = parseFloat(document.getElementById("percentFilter").value);
  const hideNoComps = document.getElementById("hideNoComps").checked;
  const hideAuction = document.getElementById("hideAuction").checked;
  const hideWaterfront = document.getElementById("hideWaterfront").checked;

  if (!isNaN(maxPrice) && parseNumber(row["List Price"]) > maxPrice)
    return false;

  if (!isNaN(minDiff) && parseNumber(row["Diff"]) < minDiff)
    return false;

  if (!isNaN(minPercent) && parseNumber(row["% Below ARV"]) < minPercent)
    return false;

  if (hideNoComps && parseInt(row["Comp Count"]) === 0)
    return false;

  if (hideAuction && (row["Sale Type"] || "").toLowerCase().includes("auction"))
    return false;

  if (hideWaterfront && row.Waterfront === "TRUE")
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
        currentSort.asc = false;
      }

      renderTable();
    };
  });
}

function updateSortArrows() {
  document.querySelectorAll(".sort-arrow").forEach((el) => {
    el.textContent = "";
    el.classList.remove("sort-asc", "sort-desc");
  });

  if (!currentSort.column) return;

  const active = document.querySelector(
    `.sortable[data-sort="${currentSort.column}"] .sort-arrow`
  );

  if (active) {
    active.textContent = currentSort.asc ? "▲" : "▼";
    active.classList.add(currentSort.asc ? "sort-asc" : "sort-desc");
  }
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
/* FULL WORKING MODAL */
/* ============================= */

function openModal(e) {
  e.preventDefault();

  let compRaw = decodeURIComponent(e.target.dataset.comp);
  let subject = JSON.parse(decodeURIComponent(e.target.dataset.row));
  let compData = [];

  try {
    compRaw = compRaw.replace(/\\"/g, '"');
    compData = JSON.parse(compRaw);
  } catch (err) {
    console.error("Comp JSON parse error:", err);
    alert("Unable to load comp details.");
    return;
  }

  const modal = document.getElementById("compModal");
  const body = document.getElementById("modalBody");

  body.innerHTML = `
    <h3>Subject Property</h3>
    <p>
      <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${subject.MLS}" target="_blank">
        ${subject.Address}
      </a>
    </p>
    <p>List Price: ${formatCurrency(subject["List Price"])}</p>
    <p>ARV: ${subject.ARV}</p>
    <hr>
    <h3>Comparable Sales</h3>
  `;

  if (compData.length === 0) {
    body.innerHTML += `<p>No comparable sales available.</p>`;
  } else {
    compData.forEach((comp) => {
      body.innerHTML += `
        <p>
          <strong>
            <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"] || ""}" target="_blank">
              ${comp.Address || ""}
            </a>
          </strong><br>
          ${comp["PR AbvFinSQFT"] || ""} SqFt<br>
          ${comp.Beds || ""} Beds |
          ${(comp["Bathrooms Full"] || 0)}.${(comp["Bathrooms Half"] || 0)} Baths<br>
          Sold: ${formatCurrency(comp["Close Price"])}
        </p>
        <hr>
      `;
    });
  }

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("compModal").style.display = "none";
}
