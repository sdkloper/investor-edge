const countyTaxRates = {
  "Baltimore County": { recordation: 0.0025, county: 0.0075, state: 0.0025 },
  "Anne Arundel County": { recordation: 0.0035, county: 0.0050, state: 0.0025 },
  "Carroll County": { recordation: 0.0050, county: 0.0000, state: 0.0025 },
  "Harford County": { recordation: 0.0033, county: 0.0050, state: 0.0025 },
  "Howard County": { recordation: 0.0025, county: 0.0063, state: 0.0025 },
  "Montgomery County": { recordation: 0.0022, county: 0.0050, state: 0.0025 }
};

function openModal(type) {

  const modal = document.getElementById("metricModal");
  const title = document.getElementById("modalTitle");
  const formula = document.getElementById("modalFormula");
  const desc = document.getElementById("modalDescription");

  if (type === "rtv") {
    title.innerText = "Rent To Value 1% Rule (RTV)";
    formula.innerText = "Formula: Monthly Rent / Purchase Price";
    desc.innerText = "This ratio indicates the gross rental income as a percentage of the total property cost, often called the "1% rule" gauge";
  }

    if (type === "coc") {
    title.innerText = "Cash On Cash Return (COC)";
    formula.innerText = "Annual Cash Flow / Total Cash Invested";
    desc.innerText = "Shows The return on the actual cash invested (down payment, closing costs, renovations), not the total property value.";
  }
  
  if (type === "grm") {
    title.innerText = "Gross Rent Multiplier (GRM)";
    formula.innerText = "Formula: Property Value / Gross Annual Rental Income";
    desc.innerText = "Shows how many years it takes for rent to pay off the property. Lower is better.";
  }

  if (type === "dscr") {
    title.innerText = "Debt Service Coverage Ratio (DSCR)";
    formula.innerText = "Formula: Net Operating Income / Annual Debt Service";
    desc.innerText = "Measures if the property generates enough income to cover its mortgage.";
  }

  if (type === "cap") {
    title.innerText = "Cap Rate";
    formula.innerText = "Formula: Net Operating Income / Purchase Price";
    desc.innerText = "Represents the return if the property was purchased in cash.";
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

function formatCurrencyInput(input) {
  let val = input.value.replace(/[^0-9]/g, "");
  if (!val) return;
  input.value = "$" + Number(val).toLocaleString("en-US");
}

function formatPercentInput(input) {
  let val = input.value.replace(/[^0-9.]/g, "");
  if (!val) return;
  input.value = val + "%";
}

function num(id){
  return parseFloat((document.getElementById(id).value || "").replace(/[^0-9.]/g,''))||0;
}

function pct(id){
  return num(id)/100;
}

function monthly(val,freq){
  if(freq==="Quarterly") return val/3;
  if(freq==="Annually") return val/12;
  return val;
}

function toggleLoanFields() {
  const type = document.getElementById("financeType").value;
  const block = document.getElementById("loanFields");

  if (!block) return;

  if (type === "cash") {
    block.style.display = "none";
  } else if (type === "conv") {
    block.style.display = "block";
    document.getElementById("ltv").parentElement.style.display = "none";
    document.getElementById("origination").parentElement.style.display = "none";
    document.getElementById("brokerFee").parentElement.style.display = "none";
  } else {
    block.style.display = "block";
    document.getElementById("ltv").parentElement.style.display = "";
    document.getElementById("origination").parentElement.style.display = "";
    document.getElementById("brokerFee").parentElement.style.display = "";
  }
}

function mortgagePayment(loan,rate){
  const r=rate/12;
  const n=360;
  return loan*(r*(1+r)**n)/((1+r)**n-1);
}

function analyzeRental(){

  // =====================
  // INPUTS FIRST (CRITICAL)
  // =====================

  const purchase = num("purchase");
  const rehab = num("rehab");
  const rent = num("rent");

  const taxes = num("taxes");
  const insurance = num("insurance");

  const hoa = monthly(num("hoa"), document.getElementById("hoaFreq").value);
  const condo = monthly(num("condo"), document.getElementById("condoFreq").value);

  const type = document.getElementById("financeType").value;
  const downPct = pct("downPct");
  const rate = pct("rate");

  // =====================
  // LOAN + MORTGAGE
  // =====================

  let loan = 0;
  let mortgage = 0;

  if (type === "hard") {

    loan = (purchase + rehab) * pct("ltv");

    mortgage = loan * rate / 12;

  } else if (type === "conv") {

    loan = purchase * (1 - downPct);

    mortgage = mortgagePayment(loan, rate);

  }

  // =====================
  // COUNTY TAXES
  // =====================

  const county = document.getElementById("county")?.value;

  const rates = countyTaxRates[county] || {
    recordation: 0.0025,
    county: 0.0075,
    state: 0.0025
  };

  const transferTaxes =
    purchase * (rates.state + rates.county + rates.recordation);

  // =====================
  // BUYER CLOSING
  // =====================

  const buyerFixed =
    495 + 275 + 200 + 250 + 95 + 50 + 40 + 60 + 60 + 55;

  const titleInsurance = purchase * 0.0065;

  let lenderFees = 0;

  if (type === "hard") {
    lenderFees =
      (loan * pct("origination")) +
      num("brokerFee");
  }

  const buyerClosing =
    buyerFixed +
    titleInsurance +
    transferTaxes +
    lenderFees;

  // =====================
  // MONTHLY / NOI
  // =====================

  const monthlyExpenses =
    mortgage +
    (taxes / 12) +
    (insurance / 12) +
    hoa +
    condo;

  const netMonthly = rent - monthlyExpenses;

  const potentialRent = rent * 12;
  const vacancy = potentialRent * 0.05;
  const grossIncome = potentialRent - vacancy;

  const operatingExpenses =
    taxes + insurance + (hoa * 12) + (condo * 12);

  const NOI = grossIncome - operatingExpenses;
  const debtService = mortgage * 12;
  const cashflow = NOI - debtService;

  // =====================
  // RETURNS
  // =====================

  const costBasis = purchase - (purchase * 0.2);
  const depreciation = costBasis / 27.5;
  const appreciation = purchase * 0.03;

  let paydown = 0;

  if (type === "conv") {
    const monthlyInterest = (loan * rate) / 12;
    paydown = (mortgage - monthlyInterest) * 12;
  }

  const totalReturn =
    cashflow + depreciation + appreciation + paydown;

  // =====================
  // CASH INVESTED
  // =====================

  let cashInvested;

  if (type === "hard") {

    cashInvested =
      //(purchase + rehab) * (1 - pct("ltv"))) 
      loan +  buyerClosing;

  } else if (type === "conv") {

    cashInvested =
      (purchase * downPct) +
      rehab +
      buyerClosing;

  } else {

    cashInvested =
      purchase +
      rehab +
      buyerClosing;

  }

  // =====================
  // FINAL METRICS
  // =====================
  const rtv=rent/purchase;
  const coc = cashflow / cashInvested;
  const grm = purchase / potentialRent;
  const dscr = debtService > 0 ? NOI / debtService : 0;
  const cap = NOI / purchase;

  //const f=x=>"$"+Math.round(x).toLocaleString();
  const f = x => "$" + Math.round(x).toLocaleString();
  document.getElementById("cashflow").innerText=f(cashflow);
  document.getElementById("depreciation").innerText=f(depreciation);
  document.getElementById("appreciation").innerText=f(appreciation);
  document.getElementById("paydown").innerText=f(paydown);
  document.getElementById("totalReturn").innerText=f(totalReturn);

  document.getElementById("rtv").innerText=(rtv*100).toFixed(2)+"%";
  const rtvEl = document.getElementById("rtv");
    rtvEl.style.color = rtv >= .01 ? "#16a34a" : "#dc2626";
  document.getElementById("coc").innerText=(coc*100).toFixed(2)+"%";
  const cocEl = document.getElementById("coc");
    cocEl.style.color = coc >= 0.10 ? "#16a34a" : "#dc2626";
  document.getElementById("grm").innerText=grm.toFixed(2);
  const grmEl = document.getElementById("grm");
    grmEl.style.color = grm >= 4 ? "#16a34a" : "#dc2626";
  let dscrDisplay = "N/A";

  if (debtService > 0) {
    dscrDisplay = dscr.toFixed(2);
  }
  
  document.getElementById("dscr").innerText = dscrDisplay;
  const dscrEl = document.getElementById("dscr");
    dscrEl.style.color = dscr >= 1.25 ? "#16a34a" : "#dc2626";
  document.getElementById("cap").innerText=(cap*100).toFixed(2)+"%";
  const capEl = document.getElementById("cap");
    capEl.style.color = cap >= 0.08 ? "#16a34a" : "#dc2626";
  

  // Monthly values
  document.getElementById("mRent").innerText = f(rent);
  document.getElementById("mMortgage").innerText = f(mortgage);
  document.getElementById("mTaxes").innerText = f(taxes / 12);
  document.getElementById("mInsurance").innerText = f(insurance / 12);
  document.getElementById("mHoa").innerText = f(hoa);
  document.getElementById("mCondo").innerText = f(condo);
  document.getElementById("mNet").innerText = f(netMonthly);

  // =====================
// WORKSHEET DISPLAY
// =====================

// reuse existing formatter
// const f = x => "$" + Math.round(x).toLocaleString();

document.getElementById("wPotentialRent").innerText = f(potentialRent);
document.getElementById("wVacancy").innerText = f(vacancy);
document.getElementById("wGrossIncome").innerText = f(grossIncome);

document.getElementById("wTaxes").innerText = f(taxes);
document.getElementById("wInsurance").innerText = f(insurance);
document.getElementById("wHoaCondo").innerText = f((hoa * 12) + (condo * 12));
document.getElementById("wTotalExpenses").innerText = f(operatingExpenses);

document.getElementById("wNOI").innerText = f(NOI);
document.getElementById("wDebtService").innerText = f(debtService);
document.getElementById("wCashflow").innerText = f(cashflow);
}

function loadFromURL(){
  const p=new URLSearchParams(window.location.search);

  if(p.get("price")) document.getElementById("purchase").value=p.get("price");
  if(p.get("arv")) document.getElementById("arv").value=p.get("arv");
  if(p.get("rent")) document.getElementById("rent").value=p.get("rent");
  if(p.get("taxes")) document.getElementById("taxes").value=p.get("taxes");
  if (p.get("address")) {
    document.getElementById("addressDisplay").innerText =
      "Analyzing: " + decodeURIComponent(p.get("address"));
  }

  if(p.get("hoa")){
    document.getElementById("hoa").value=p.get("hoa");
    function normalizeFreq(val) {
      if (!val) return "Monthly";
    
      val = val.toLowerCase();
    
      if (val.includes("month")) return "Monthly";
      if (val.includes("quarter")) return "Quarterly";
      if (val.includes("annual")) return "Annually";
    
      return "Monthly";
    }
    if (p.get("hoa")) {
      document.getElementById("hoa").value = p.get("hoa");
      document.getElementById("hoaFreq").value = normalizeFreq(p.get("hoaFreq"));
    }
    
    if (p.get("condo")) {
      document.getElementById("condo").value = p.get("condo");
      document.getElementById("condoFreq").value = normalizeFreq(p.get("condoFreq"));
    }
  }

}

window.addEventListener("DOMContentLoaded", () => {

  loadFromURL();

  toggleLoanFields();

  // ✅ DEFINE ONCE
  const currencyFields = [
    "purchase",
    "arv",
    "rehab",
    "rent",
    "taxes",
    "insurance",
    "hoa",
    "condo",
    "brokerFee"
  ];

  const percentFields = [
    "rate",
    "downPct",
    "origination"
  ];

  // ✅ FORMAT AFTER URL LOAD
  setTimeout(() => {

    currencyFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value) {
        formatCurrencyInput(el);
      }
    });

    percentFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value) {
        formatPercentInput(el);
      }
    });

  }, 100);

  // ✅ ADD EVENT LISTENERS (NO DUPLICATION)
  currencyFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => formatCurrencyInput(input));
    input.addEventListener("focus", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  });

  percentFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => formatPercentInput(input));
    input.addEventListener("focus", () => {
      input.value = input.value.replace(/[^0-9.]/g, "");
    });
  });

  // ✅ DROPDOWN LISTENER
  document.getElementById("financeType")
    .addEventListener("change", toggleLoanFields);

});
