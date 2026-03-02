/* =========================================
   INVESTOR EDGE - FRONTEND ENGINE
   ========================================= */

const CSV_URL = "https://docs.google.com/spreadsheets/d/1ABCxyz123456789/export?format=csv&gid=0&t=" + new Date().getTime();

let deals = [];
let currentSort = { column: null, asc: false };

document.addEventListener("DOMContentLoaded", () => {
    loadCSV();

    document.getElementById("applyFilters")
        .addEventListener("click", renderTable);

    document.getElementById("closeModal")
        .addEventListener("click", closeModal);

    // Close modal if clicking outside content
    document.getElementById("compModal")
        .addEventListener("click", (e) => {
            if (e.target.id === "compModal") {
                closeModal();
            }
        });
});

/* =========================================
   LOAD CSV
   ========================================= */

function loadCSV() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        worker: true, // performance for large datasets
        complete: function (results) {
            deals = results.data;
            populateCountyFilter();
            renderTable();
        },
        error: function (err) {
            console.error("CSV Load Error:", err);
        }
    });
}

/* =========================================
   COUNTY DROPDOWN
   ========================================= */

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

/* =========================================
   RENDER TABLE
   ========================================= */

function renderTable() {
    const tbody = document.querySelector("#dealsTable tbody");
    tbody.innerHTML = "";

    let filtered = deals.filter(applyFilters);

    /* ---------- SORTING ---------- */
    if (currentSort.column) {
        filtered.sort((a, b) => {
            let valA = parseFloat(
                (a[currentSort.column] || "0")
                    .toString()
                    .replace(/[$,%]/g, '')
            ) || 0;

            let valB = parseFloat(
                (b[currentSort.column] || "0")
                    .toString()
                    .replace(/[$,%]/g, '')
            ) || 0;

            return currentSort.asc ? valA - valB : valB - valA;
        });
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(row => {

        const tr = document.createElement("tr");

        /* ---------- ROW COLOR LOGIC ---------- */
        const percentBelow = parseFloat(
            (row["% Below ARV"] || "0").toString().replace('%','')
        ) || 0;

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

        /* ---------- GRM ---------- */
        const grm = calculateGRM(row["List Price"], row["Rent"]);

        tr.innerHTML = `
            <td>
                <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${row.MLS}" target="_blank">
                    ${row.MLS}
                </a>
            </td>
            <td>${row.County || ""}</td>
            <td>${row["List Price"] || ""}</td>
            <td>${row.ARV || ""}</td>
            <td>${row.Diff || ""}</td>
            <td>${row["% Below ARV"] || ""}</td>
            <td>
                <a href="#" 
                   class="compLink"
                   data-comp='${encodeURIComponent(row["Comp Details"] || "[]")}'
                   data-row='${encodeURIComponent(JSON.stringify(row))}'>
                   ${row["Comp Count"] || 0}
                </a>
            </td>
            <td>${row.Rent || ""}</td>
            <td>${grm}</td>
        `;

        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);

    attachSortHandlers();

    document.querySelectorAll(".compLink")
        .forEach(link => link.addEventListener("click", openModal));
}

/* =========================================
   FILTERING
   ========================================= */

function applyFilters(row) {

    const zipInput = document.getElementById("zipFilter").value.trim();
    const county = document.getElementById("countyFilter").value;
    const maxPrice = parseFloat(document.getElementById("priceFilter").value);
    const minDiff = parseFloat(document.getElementById("diffFilter").value);
    const minPercent = parseFloat(document.getElementById("percentFilter").value);
    const hideNoComps = document.getElementById("hideNoComps").checked;
    const hideAuction = document.getElementById("hideAuction").checked;
    const hideWaterfront = document.getElementById("hideWaterfront").checked;

    if (county && row.County !== county) return false;

    if (maxPrice && parseFloat((row["List Price"] || "0").replace(/[$,]/g,'')) > maxPrice)
        return false;

    if (minDiff && parseFloat((row.Diff || "0").replace(/[$,]/g,'')) < minDiff)
        return false;

    if (minPercent && parseFloat((row["% Below ARV"] || "0").replace('%','')) < minPercent)
        return false;

    if (hideNoComps && parseInt(row["Comp Count"]) === 0)
        return false;

    if (hideAuction && (row["Sale Type"] || "").toLowerCase().includes("auction"))
        return false;

    if (hideWaterfront && row.Waterfront === "TRUE")
        return false;

    /* ---------- ZIP FILTER ---------- */
    if (zipInput) {
        const zipArray = zipInput.split(",").map(z => z.trim());
        const rowZip = (row.Address || "").match(/\b\d{5}\b/);
        if (!rowZip || !zipArray.includes(rowZip[0])) {
            return false;
        }
    }

    return true;
}

/* =========================================
   SORT HANDLERS
   ========================================= */

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

/* =========================================
   GRM CALCULATION
   ========================================= */

function calculateGRM(price, rent) {
    let p = parseFloat((price || "0").toString().replace(/[$,]/g,'')) || 0;
    let r = parseFloat((rent || "0").toString().replace(/[$,]/g,'')) || 0;

    if (!p || !r) return "-";

    return (p / (r * 12)).toFixed(2);
}

/* =========================================
   MODAL
   ========================================= */

function openModal(e) {
    e.preventDefault();

    let compRaw = decodeURIComponent(e.target.dataset.comp);
    let subject = JSON.parse(decodeURIComponent(e.target.dataset.row));

    let compData = [];

    try {
        compRaw = compRaw.replace(/\\"/g, '"'); // Excel escape fix
        compData = JSON.parse(compRaw);
    } catch (err) {
        console.error("Comp JSON parse error:", err);
        alert("Unable to load comp details.");
        return;
    }

    const modal = document.getElementById("compModal");
    const body = document.getElementById("modalBody");

    body.innerHTML = "";

    /* ---------- SUBJECT ---------- */
    body.innerHTML += `
        <h3>Subject Property</h3>
        <p>
            <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${subject.MLS}" target="_blank">
                ${subject.Address}
            </a>
        </p>
        <p>List Price: ${subject["List Price"] || ""}</p>
        <p>ARV: ${subject.ARV || ""}</p>
        <hr>
        <h3>Comparable Sales</h3>
    `;

    /* ---------- COMPS ---------- */
    compData.forEach(comp => {
        body.innerHTML += `
            <p>
                <strong>
                    <a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${comp["MLS Number"]}" target="_blank">
                        ${comp.Address}
                    </a>
                </strong><br>
                ${comp["PR AbvFinSQFT"] || ""} SqFt<br>
                ${comp.Beds || ""} Beds |
                ${(comp["Bathrooms Full"] || 0)}.${(comp["Bathrooms Half"] || 0)} Baths<br>
                Sold: ${comp["Close Price"] || ""}
            </p>
        `;
    });

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("compModal").style.display = "none";
}


