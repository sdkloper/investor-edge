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

function toggleLoanFields(){
  const type=document.getElementById("financeType").value;
  const block=document.getElementById("loanFields");

  if(type==="cash"){
    block.style.display="none";
  }else if(type==="conv"){
    block.style.display="block";
    document.getElementById("ltv").parentElement.style.display="none";
    document.getElementById("origination").parentElement.style.display="none";
    document.getElementById("brokerFee").parentElement.style.display="none";
  }else{
    block.style.display="block";
    document.getElementById("ltv").parentElement.style.display="";
    document.getElementById("origination").parentElement.style.display="";
    document.getElementById("brokerFee").parentElement.style.display="";
  }
}

function mortgagePayment(loan,rate){
  const r=rate/12;
  const n=360;
  return loan*(r*(1+r)**n)/((1+r)**n-1);
}

function analyzeRental(){

  const purchase=num("purchase");
  const rehab=num("rehab");
  const rent=num("rent");

  const taxes=num("taxes");
  const insurance=num("insurance");

  const hoa=monthly(num("hoa"),document.getElementById("hoaFreq").value);
  const condo=monthly(num("condo"),document.getElementById("condoFreq").value);

  const type=document.getElementById("financeType").value;
  const downPct=pct("downPct");
  const rate=pct("rate");

  let loan=0;
  let mortgage=0;

  if(type!=="cash"){
    loan=purchase*(1-downPct);
    mortgage=mortgagePayment(loan,rate);
  }

  const monthlyExpenses=
    mortgage +
    (taxes/12) +
    (insurance/12) +
    hoa +
    condo;

  const netMonthly=rent-monthlyExpenses;

  const potentialRent=rent*12;
  const vacancy=potentialRent*0.05;
  const grossIncome=potentialRent-vacancy;

  const operatingExpenses=
    taxes+insurance+(hoa*12)+(condo*12);

  const NOI=grossIncome-operatingExpenses;
  const debtService=mortgage*12;
  const cashflow=NOI-debtService;

  const costBasis=purchase + 0 - (purchase*0.2);
  const depreciation=costBasis/27.5;
  const appreciation=purchase*0.03;

  const monthlyInterest=(loan*rate)/12;
  const paydown=(mortgage-monthlyInterest)*12;

  const totalReturn=cashflow+depreciation+appreciation+paydown;

  const rtv=rent/purchase;
  const coc=cashflow/(purchase*downPct + rehab);
  const grm=purchase/potentialRent;
  const dscr=NOI/debtService;
  const cap=NOI/purchase;

  const f=x=>"$"+Math.round(x).toLocaleString();

  document.getElementById("cashflow").innerText=f(cashflow);
  document.getElementById("depreciation").innerText=f(depreciation);
  document.getElementById("appreciation").innerText=f(appreciation);
  document.getElementById("paydown").innerText=f(paydown);
  document.getElementById("totalReturn").innerText=f(totalReturn);

  document.getElementById("rtv").innerText=(rtv*100).toFixed(2)+"%";
  document.getElementById("coc").innerText=(coc*100).toFixed(2)+"%";
  document.getElementById("grm").innerText=grm.toFixed(2);
  document.getElementById("dscr").innerText=dscr.toFixed(2);
  document.getElementById("cap").innerText=(cap*100).toFixed(2)+"%";
}

function loadFromURL(){
  const p=new URLSearchParams(window.location.search);

  if(p.get("price")) document.getElementById("purchase").value=p.get("price");
  if(p.get("arv")) document.getElementById("arv").value=p.get("arv");
  if(p.get("rent")) document.getElementById("rent").value=p.get("rent");
  if(p.get("taxes")) document.getElementById("taxes").value=p.get("taxes");
  if(p.get("address")) document.getElementById("addressDisplay").innerText="Analyzing: "+p.get("address");

  if(p.get("hoa")){
    document.getElementById("hoa").value=p.get("hoa");
    document.getElementById("hoaFreq").value=p.get("hoaFreq")||"Monthly";
  }

  if(p.get("condo")){
    document.getElementById("condo").value=p.get("condo");
    document.getElementById("condoFreq").value=p.get("condoFreq")||"Monthly";
  }
}

window.addEventListener("DOMContentLoaded", () => {

  loadFromURL();
  
  setTimeout(() => {
    document.querySelectorAll("input").forEach(input => {
      if (input.value.includes("%")) return;
      if (input.value.match(/^\d+$/)) formatCurrencyInput(input);
    });
  }, 100);
  
  toggleLoanFields();

  // ✅ ADD IT RIGHT HERE
  const currencyFields = [
    "purchase",
    "rehab",
    "rent",
    "taxes",
    "insurance",
    "hoa",
    "condo",
    "brokerFee"
  ];

  currencyFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => formatCurrencyInput(input));
    input.addEventListener("focus", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  });

  const percentFields = [
    "rate",
    "downPct",
    "origination"
  ];

  percentFields.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("blur", () => formatPercentInput(input));
    input.addEventListener("focus", () => {
      input.value = input.value.replace(/[^0-9.]/g, "");
    });
  });

  // ✅ KEEP THIS AFTER
  document.getElementById("financeType")
    .addEventListener("change", toggleLoanFields);

});
