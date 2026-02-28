const CSV_URL = "YOUR_DEALS_CSV_URL";

let deals = [];
let sortField = null;
let sortDirection = 1;

async function loadData() {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            deals = results.data.map(row => ({
                mls: row["MLS"],
                address: row["Address"],
                county: row["County"],
                list: parseFloat(row["List Price"]) || 0,
                arv: row["ARV"] === "No Comps" ? "No Comps" : parseFloat(row["ARV"]) || 0,
                diff: parseFloat(row["Diff"]) || 0,
                percent: parseFloat(row["% Below ARV"]) || 0,
                rent: row["Rent"],
                comps: parseInt(row["Comp Count"]) || 0,
                confidence: row["Confidence"],
                compDetails: row["Comp Details"]
            }));

            populateCountyFilter();
            renderTable();
        }
    });
}

function populateCountyFilter() {
    const counties = [...new Set(deals.map(d => d.county))];
    const select = document.getElementById("countyFilter");
    select.innerHTML = '<option value="">All Counties</option>';

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
            <td>${d.arv === "No Comps" ? "No Comps" : "$" + d.arv.toLocaleString()}</td>
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
        try {
            const parsed = JSON.parse(e.target.dataset.comp);
            document.getElementById("compContent").textContent = JSON.stringify(parsed, null, 2);
        } catch {
            document.getElementById("compContent").textContent = "Comp data unavailable";
        }
        document.getElementById("compModal").style.display = "block";
    }
});

document.getElementById("closeModal").onclick = function(){
    document.getElementById("compModal").style.display = "none";
};

loadData();
