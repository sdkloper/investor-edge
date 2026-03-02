/* =========================================
   INVESTOR EDGE - ENHANCED UI VERSION
   ========================================= */

const CSV_URL = "https://docs.google.com/spreadsheets/d/1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY/export?format=csv&gid=0&t=" + new Date().getTime();

let deals = [];
let currentSort = { column: null, asc: false };

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("diffFilter").value = 0; // hide negative by default

    loadCSV();

    document.getElementById("applyFilters")
        .addEventListener("click", renderTable);

    document.getElementById("closeModal")
        .addEventListener("click", closeModal);
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
        }
    });
}

/* ============================= */

function populateCountyFilter() {
    const counties = [...new Set(deals.map(d => d.County).filter(Boolean))].sort();
    const select = document.getElementById("countyFilter");

    counties.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

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

    filtered.forEach(row => {

        const tr = document.createElement("tr");

        const percentBelow = parseNumber(row["% Below ARV"]);
        const diffValue = parseNumber(row["Diff"]);
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

        const listPrice = formatCurrency(row["List Price"]);
        const arv = formatCurrency(row["ARV"]);
        const diff = formatCurrency(diffValue);
        const rent = formatCurrency(row["Rent"]);
        const percent = percentBelow ? percentBelow.toFixed(0) + "%" : "";
        const grmDisplay = grm ? grm.toFixed(1) : "-";

        /* ===== ICONS ===== */
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
            <td>${listPrice}</td>
            <td>${arv}</td>
            <td>${diff}</td>
            <td>${percent}</td>
           <td>
                ${
                    compCount === 0
                    ? "No Comps"
                    : `<a href="#" class="compLink"
                         data-comp='${encodeURIComponent(row["Comp Details"] || "[]")}'
                         data-row='${encodeURIComponent(JSON.stringify(row))}'>
                         ${compCount}
                       </a>`
                }
            </td>
            <td>${rent}</td>
            <td>${grmDisplay}</td>
        `;

        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);

    attachSortHandlers();
    updateSortArrows();

    document.querySelectorAll(".compLink")
        .forEach(link => link.addEventListener("click", openModal));
}

/* ============================= */

function applyFilters(row) {

    const minDiff = parseFloat(document.getElementById("diffFilter").value);
    if (!isNaN(minDiff) && parseNumber(row.Diff) < minDiff)
        return false;

    return true;
}

/* ============================= */

function attachSortHandlers() {
    document.querySelectorAll(".sortable").forEach(th => {
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
    document.querySelectorAll(".sort-arrow").forEach(el => {
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

function calculateGRM(price, rent) {
    let p = parseNumber(price);
    let r = parseNumber(rent);

    if (!p || !r) return null;

    return p / (r * 12);
}

/* ============================= */

function parseNumber(val) {
    return parseFloat((val || "0").toString().replace(/[$,%]/g,'')) || 0;
}

function formatCurrency(val) {
    let num = parseNumber(val);
    if (!num) return "";
    return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/* ============================= */

function openModal(e) {
    e.preventDefault();
    alert("Comp modal unchanged for now.");
}

function closeModal() {
    document.getElementById("compModal").style.display = "none";
}

