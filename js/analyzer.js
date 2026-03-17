const countyTaxRates = {
  "Baltimore County": { recordation: 0.0025, county: 0.0075, state: 0.0025 },
  "Anne Arundel County": { recordation: 0.0035, county: 0.0050, state: 0.0025 },
  "Carroll County": { recordation: 0.0050, county: 0.0000, state: 0.0025 },
  "Harford County": { recordation: 0.0033, county: 0.0050, state: 0.0025 },
  "Howard County": { recordation: 0.0025, county: 0.0063, state: 0.0025 },
  "Montgomery County": { recordation: 0.0022, county: 0.0050, state: 0.0025 }
};

function analyzeDeal() {

const purchase = +document.getElementById("purchase").value;
const rehab = +document.getElementById("rehab").value;
const months = +document.getElementById("months").value;

const rate = +document.getElementById("rate").value / 100;
const ltv = +document.getElementById("ltv").value / 100;
const orig = +document.getElementById("origination").value / 100;

const broker = +document.getElementById("brokerFee").value;
const appraisal = +document.getElementById("appraisal").value;

 
const annualTaxes = +document.getElementById("taxes").value;
const taxes = annualTaxes / 12;
const annualInsurance = +document.getElementById("insurance").value;
const insurance = annualInsurance / 12;
const utilities = +document.getElementById("utilities").value;
const lawn = +document.getElementById("lawn").value;
const hoa = +document.getElementById("hoa").value;

const roiTarget = +document.getElementById("roi").value / 100;
const commission = +document.getElementById("commission").value / 100;

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
mortgage + taxes + insurance + utilities + lawn + hoa;

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
    broker +
    appraisal;

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
// SELLER COST FUNCTION
// =====================

function calcSellerCosts(price) {

  const fixed = 1000;

  const taxes =
    price * (rates.state + rates.county + rates.recordation);

  const comm = price * commission;

  return fixed + taxes + comm;
}

// =====================
// ESTIMATED SALE (MATCH YOUR SHEET)
// =====================

// Step 1: rough estimate
let roughSale = baseCosts * (1 + roiTarget);

// Step 2: estimate seller costs from rough
let sellerCosts = calcSellerCosts(roughSale);

// Step 3: apply YOUR formula exactly
let estimatedSale =
(
  purchase +
  rehab +
  buyerClosing +
  totalHolding +
  sellerCosts
) * (1 + roiTarget);

// Step 4: recalc seller costs using final price
sellerCosts = calcSellerCosts(estimatedSale);

estimatedSale =
(baseCosts + sellerCosts) * (1 + roiTarget);

sellerCosts = calcSellerCosts(estimatedSale);

// =====================
// FINAL SALE PRICE
// =====================

const override =
+document.getElementById("saleOverride").value;

const sale = override || estimatedSale;

// =====================
// NET + PROFIT
// =====================

const sellerFinal = calcSellerCosts(sale);

const netSale = sale - sellerFinal;

const totalCosts = baseCosts;

const profit = netSale - totalCosts;

const roi = profit / totalCosts;

// =====================
// CASH ON CASH
// =====================

const down = purchase * (1 - ltv);

const cashInvested =
down + rehab + buyerClosing + totalHolding;

const cashRoi = profit / cashInvested;

// =====================
// OUTPUT
// =====================

document.getElementById("profit").innerText =
"$" + Math.round(profit).toLocaleString();

document.getElementById("roiOut").innerText =
(roi * 100).toFixed(1) + "%";

document.getElementById("cashRoi").innerText =
(cashRoi * 100).toFixed(1) + "%";

document.getElementById("requiredSale").innerText =
"$" + Math.round(estimatedSale).toLocaleString();

document.getElementById("buyerClose").innerText =
"$" + Math.round(buyerClosing).toLocaleString();

document.getElementById("sellerClose").innerText =
"$" + Math.round(sellerFinal).toLocaleString();

}
