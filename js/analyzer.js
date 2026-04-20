/* ===============================
   AUTH CHECK
================================ */

document.addEventListener("DOMContentLoaded", function() {

  // 🔐 Authentication Guard
  if (
    sessionStorage.getItem("investorAuth") !== "true" ||
    !sessionStorage.getItem("userID")
  ) {
    window.location.href = "index.html";
    return;
  }

  // 🔓 Logout handler
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function() {
      sessionStorage.clear();
      window.location.href = "index.html";
    });
  }

});

});

function openModal(type) {

  const modal = document.getElementById("metricModal");
  const title = document.getElementById("modalTitle");
  const formula = document.getElementById("modalFormula");
  const desc = document.getElementById("modalDescription");

if (type === "roiOut") {
  title.innerText = "Return On Investment (ROI)";
  formula.innerText = "Formula: ROI = Net Profit / Total Investment Cost";

  desc.innerHTML = `
  Net Profit: Final Sale Price - Total Investment Cost<br><br>
  Total Investment Cost: Purchase price + closing costs + renovation costs + holding costs (taxes, insurance, utilities)<br><br>
  It tells you how much money you made for every dollar invested.
  `;
}


  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("metricModal").style.display = "none";
}

window.onclick = function(e) {
  const modal = document.getElementById("metricModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
}

function toggleFinancingFields() {
  const financeType = document.getElementById("financeType").value;
  const financingFields = document.getElementById("financingFields");

  if (!financingFields) return; // safety

  if (financeType === "cash") {
    financingFields.style.display = "none";
  } else {
    financingFields.style.display = "block";
  }
}

function convertToMonthly(amount, frequency) {

  if (!amount) return 0;

  switch ((frequency || "").toLowerCase()) {
    case "monthly":
      return amount;

    case "quarterly":
      return Math.round(amount / 3);

    case "semi-annually":
    case "semiannual":
      return Math.round(amount / 6);

    case "annually":
    case "annual":
      return Math.round(amount / 12);

    default:
      return amount;
  }
}
function parseNumber(val) {
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function getNumericValue(id) {
  const el = document.getElementById(id);
  if (!el) return 0;

  return parseFloat(
    el.value.replace(/[^0-9]/g, "")
  ) || 0;
}

function getPercentValue(id) {
  return parseFloat(
    document.getElementById(id).value.replace(/[^0-9.]/g, "")
  ) || 0;
}

function formatCurrencyInput(input) {

  let raw = input.value;

  // remove everything except digits
  let cleaned = raw.replace(/\D/g, "");

  // if empty, just leave it blank (DON'T erase user input mid-typing)
  if (cleaned === "") {
    input.value = "";
    return;
  }

  let number = parseInt(cleaned, 10);

  // always set formatted value
  input.value = "$" + number.toLocaleString();
}

function formatPercentInput(input) {

  let raw = input.value;

  let cleaned = raw.replace(/[^0-9.]/g, "");

  if (cleaned === "") {
    input.value = "";
    return;
  }

  input.value = cleaned + "%";
}

const countyTaxRates = {
  "Baltimore County": { recordation: 0.0025, county: 0.0075, state: 0.0025 },
  "Anne Arundel County": { recordation: 0.0035, county: 0.0050, state: 0.0025 },
  "Carroll County": { recordation: 0.0050, county: 0.0000, state: 0.0025 },
  "Harford County": { recordation: 0.0033, county: 0.0050, state: 0.0025 },
  "Howard County": { recordation: 0.0025, county: 0.0063, state: 0.0025 },
  "Montgomery County": { recordation: 0.0022, county: 0.0050, state: 0.0025 }
};

function analyzeDeal() {

const purchase = getNumericValue("purchase");
const rehab = getNumericValue("rehab");
const broker = getNumericValue("brokerFee");
const utilities = getNumericValue("utilities");
const lawn = getNumericValue("lawn");
const hoa = getNumericValue("hoa");
const condo = getNumericValue("condo");

const annualTaxes = getNumericValue("taxes");
const taxes = annualTaxes / 12;
const annualInsurance = getNumericValue("insurance");
const insurance = annualInsurance / 12;
  
const months = +document.getElementById("months").value;

const rate = getPercentValue("rate") / 100;
const ltv = getPercentValue("ltv") / 100;
const orig = getPercentValue("origination") / 100;
const commission = getPercentValue("commission") / 100;
const roiTarget = getPercentValue("roi") / 100;

const county = document.getElementById("county").value;
const financeType = document.getElementById("financeType").value;

const rates = countyTaxRates[county];

// =====================
// LOAN + MORTGAGE
// =====================

let loan = 0;
let mortgage = 0;

if (financeType === "hard") {

  loan = (purchase + rehab) * ltv;

  mortgage = loan * rate / 12;

} else {
  loan = 0;
  mortgage = 0;
}

document.getElementById("mortgage").value =
"$" + Math.round(mortgage);

// =====================
// HOLDING
// =====================

const monthlyHolding =
mortgage + taxes + insurance + utilities + lawn + hoa + condo;

const totalHolding = monthlyHolding * months;

// =====================
// BUYER CLOSING (CORRECTED)
// =====================

const buyerFixed =
495 + 275 + 200 + 250 + 95 + 50 + 40 + 60 + 60 + 55;

// Title insurance
const titleInsurance = purchase * 0.0065;

// Transfer taxes
const transferTaxes =
purchase * (rates.state + rates.county + rates.recordation);

// Lender costs
let lenderFees = 0;

if (financeType === "hard") {

  lenderFees =
    (loan * orig) +   // origination
    broker;

}

const buyerClosing =
buyerFixed +
titleInsurance +
transferTaxes +
lenderFees;

// =====================
// PRE-COSTS
// =====================

const baseCosts =
purchase + rehab + buyerClosing + totalHolding;

// =====================
// SELLER COST FUNCTIONS
// =====================

function calcSellerCosts(price) {

  const fixed = 1000;

  const taxes =
    price * (rates.state + rates.county + rates.recordation);

  return fixed + taxes;
}

function calcCommission(price) {
  return price * commission;
}

// =====================
// ESTIMATED SALE (EXACT PARITY)
// =====================

// Step 1: base (no seller costs)
let estimatedSale =
(
  purchase +
  rehab +
  buyerClosing +
  totalHolding
) * (1 + roiTarget);

// Step 2: first pass seller + commission
let sellerCosts = calcSellerCosts(estimatedSale);
let commissionCost = calcCommission(estimatedSale);

// Step 3: apply your formula
estimatedSale =
(
  purchase +
  rehab +
  buyerClosing +
  totalHolding +
  sellerCosts +
  commissionCost
) * (1 + roiTarget);

// ✅ Step 4: FINAL correction (THIS WAS MISSING)
sellerCosts = calcSellerCosts(estimatedSale);
commissionCost = calcCommission(estimatedSale);


// =====================
// FINAL SALE PRICE
// =====================

const override = getNumericValue("saleOverride");

const arv = getNumericValue("arv");
   
const sale = override || arv;

const spread = arv - estimatedSale;

// =====================
// NET + PROFIT
// =====================

const sellerFinal =
  calcSellerCosts(sale) +
  calcCommission(sale);

const netSale = sale - sellerFinal;

const totalCosts = baseCosts;

const profit = netSale - totalCosts;

const roi = profit / totalCosts;

const roiEl = document.getElementById("roiOut");

roiEl.innerText = (roi * 100).toFixed(1) + "%";

if (roi >= roiTarget) {
  roiEl.classList.add("roi-good");
  roiEl.classList.remove("roi-bad");
} else {
  roiEl.classList.add("roi-bad");
  roiEl.classList.remove("roi-good");
}

// =====================
// CASH ON CASH
// =====================

const down = purchase * (1 - ltv);

// =====================
// CASH INVESTED (UPDATED)
// =====================

let cashInvested;

if (financeType === "cash") {
  cashInvested =
    purchase + rehab + buyerClosing + totalHolding;
} else {
  cashInvested =
    down + rehab + buyerClosing + totalHolding;
}

// =====================
// CASH TO CLOSE (UPDATED)
// =====================

let cashToClose;

if (financeType === "cash") {
  cashToClose = purchase + buyerClosing;
} else {
  cashToClose = down + buyerClosing;
}

document.getElementById("cashToClose").innerText =
"$" + Math.round(cashToClose).toLocaleString();

const cashRoi = profit / cashInvested;

// =====================
// OUTPUT
// =====================

document.getElementById("profit").innerText =
"$" + Math.round(profit).toLocaleString();

document.getElementById("roiOut").innerText =
(roi * 100).toFixed(1) + "%";

//document.getElementById("cashRoi").innerText =
//(cashRoi * 100).toFixed(1) + "%";

document.getElementById("requiredSale").innerText =
"$" + Math.round(estimatedSale).toLocaleString();

document.getElementById("buyerClose").innerText =
"$" + Math.round(buyerClosing).toLocaleString();

document.getElementById("sellerClose").innerText =
"$" + Math.round(sellerFinal).toLocaleString();

const spreadEl = document.getElementById("spread");

if (spreadEl) {
  spreadEl.innerText =
    "$" + Math.round(spread).toLocaleString();

  spreadEl.style.color =
    spread > 20000 ? "#16a34a" :
    spread > 10000 ? "#f59e0b" :
    "#dc2626";
}

}


function loadFromURL() {

  const params = new URLSearchParams(window.location.search);

  const price = params.get("price");
  const arv = params.get("arv");
  const taxes = params.get("taxes");

  const hoa = params.get("hoa");
  const hoaFreq = params.get("hoaFreq");

  const condo = params.get("condo");
  const condoFreq = params.get("condoFreq");

  const address = params.get("address");

  if (price) {
    document.getElementById("purchase").value = price;
    formatCurrencyInput(document.getElementById("purchase"));
  }

  if (arv) {
    document.getElementById("arv").value = arv;
    formatCurrencyInput(document.getElementById("arv"));
  }

  if (taxes) {
    document.getElementById("taxes").value = taxes;
    formatCurrencyInput(document.getElementById("taxes"));
  }

  if (hoa) {
    const monthlyHoa = convertToMonthly(parseNumber(hoa), hoaFreq);
    document.getElementById("hoa").value = monthlyHoa;
    formatCurrencyInput(document.getElementById("hoa"));
  }

  if (condo) {
    const monthlyCondo = convertToMonthly(parseNumber(condo), condoFreq);
    document.getElementById("condo").value = monthlyCondo;
    formatCurrencyInput(document.getElementById("condo"));
  }

  if (address) {
    document.getElementById("addressDisplay").innerText =
      "Analyzing: " + address;
  }
   logActivity(
     "Open Flip Analyzer",
     document.getElementById("address")?.value || "",
     getNumericValue("arv"),
     0,
     "Flip Analyzer"
   );
}
//listener
window.addEventListener("DOMContentLoaded", () => {

  loadFromURL();

  const currencyFields = [
    "purchase",
    "rehab",
    "brokerFee",
    "utilities",
    "lawn",
    "hoa",
    "taxes",
    "insurance",
    "saleOverride"
  ];

  currencyFields.forEach(id => {
    const input = document.getElementById(id);

    if (!input) return;

    input.addEventListener("blur", function () {
      formatCurrencyInput(input);
    });

    input.addEventListener("focus", function () {
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  });

  const percentFields = [
    "rate",
    "ltv",
    "origination",
    "commission",
    "roi"
  ];

  percentFields.forEach(id => {
    const input = document.getElementById(id);

    if (!input) return;

    input.addEventListener("blur", function () {
      formatPercentInput(input);
    });

    input.addEventListener("focus", function () {
      input.value = input.value.replace(/[^0-9.]/g, "");
    });
  });

  // ✅ FINANCING TOGGLE (NOW WORKS)
  toggleFinancingFields();

  const financeDropdown = document.getElementById("financeType");
  if (financeDropdown) {
    financeDropdown.addEventListener("change", toggleFinancingFields);
  }

});
