  const CSV_URL = "https://docs.google.com/spreadsheets/d/1s1h2TRyKsFkqpr-yW6yps-yh-AUTDW8ZkWwh8mYDfiY/export?format=csv";

let deals = [];
let sortField = null;
let sortDirection = 1;

async function loadData() {
    const response = await fetch(CSV_URL);
    const text = await response.text();

    const rows = text.split("\n").slice(1);

    deals = rows.map(row => {
        const cols = row.split(",");

        return {
            mls: cols[0],
            address: cols[1],
            county: cols[2],
            list: parseFloat(cols[3]) || 0,
            arv: cols[4],
            diff: parseFloat(cols[5]) || 0,
            percent: parseFloat(cols[6]) || 0,
            rent: cols[7],
            comps: parseInt(cols[8]) || 0,
            confidence: cols[9],
            compDetails: cols.slice(10).join(",")
        };
    });

    populateCountyFilter();
    renderTable();
}

function populateCountyFilter() {
    const counties = [...new Set(deals.map(d => d.county))];
    const select = document.getElementById("countyFilter");

    counties.forEach(c => {
        const option = document.createElement("option");
        option.value = c;
        option.textContent = c;
        select.appendChild(option);
    });
}

function renderTable() {
    const tbody = document.querySelector("#dealsTable tbody");
    tbody.innerHTML = "";

    let filtered = deals.filter(applyFilters);

    if (sortField) {
        filtered.sort((a,b) => (a[sortField] - b[sortField]) * sortDirection);
    }

    filtered.forEach(d => {
        const tr = document.createElement("tr");

        if (d.arv === "No Comps") tr.classList.add("nocomps");
        else if (d.diff > 20000) tr.classList.add("positive");
        else if (d.diff > 0) tr.classList.add("moderate");
        else tr.classList.add("negative");

        tr.innerHTML = `
            <td><a href="https://www.saulkloper.com/idx/listing/MD-BRIGHT/${d.mls}" target="_blank">${d.mls}</a></td>
            <td>${d.address}</td>
            <td>${d.county}</td>
            <td>$${d.list.toLocaleString()}</td>
            <td>${d.arv === "No Comps" ? "No Comps" : "$"+parseInt(d.arv).toLocaleString()}</td>
            <td>$${d.diff.toLocaleString()}</td>
            <td>${d.percent}%</td>
            <td>${d.rent}</td>
            <td class="comp-click" data-comp='${d.compDetails}'>${d.comps}</td>
            <td>${d.confidence}</td>
        `;

        tbody.appendChild(tr);
    });
}

function applyFilters(d) {
    const zipInput = document.getElementById("zipFilter").value;
    const county = document.getElementById("countyFilter").value;
    const minPercent = parseFloat(document.getElementById("minPercent").value) || 0;
    const minDiff = parseFloat(document.getElementById("minDiff").value) || 0;
    const confidence = document.getElementById("confidenceFilter").value;
    const hideNoComps = document.getElementById("hideNoComps").checked;

    if (county && d.county !== county) return false;
    if (d.percent < minPercent) return false;
    if (d.diff < minDiff) return false;
    if (confidence && d.confidence !== confidence) return false;
    if (hideNoComps && d.arv === "No Comps") return false;

    if (zipInput) {
        const zips = zipInput.split(",").map(z => z.trim());
        if (!zips.some(z => d.address.includes(z))) return false;
    }

    return true;
}

document.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", () => {
        const field = th.dataset.sort;
        sortField = field;
        sortDirection *= -1;
        renderTable();
    });
});

document.addEventListener("input", renderTable);

document.addEventListener("click", function(e){
    if (e.target.classList.contains("comp-click")) {
        const details = e.target.dataset.comp;
        document.getElementById("compContent").textContent = details;
        document.getElementById("compModal").style.display = "block";
    }
});

document.getElementById("closeModal").onclick = function(){
    document.getElementById("compModal").style.display = "none";
};

loadData();
