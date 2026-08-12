// v6: contractor baseline is contract + additions; no higher contractor estimate.
const originalSums = sums;
sums = function(){
  const items=estimateItems();
  const expenseAmount=state.expenses.reduce((s,e)=>s+(Number(e.amount)||0),0);
  const totalPaid=state.expenses.reduce((s,e)=>s+paid(e),0);
  const paidCount=state.expenses.filter(e=>paid(e)>0).length;
  const included=state.expenses.filter(e=>e.estimateRelation==='כלולה באומדן').reduce((s,e)=>s+paid(e),0);
  const explicitAdditional=state.expenses.filter(e=>e.estimateRelation!=='כלולה באומדן').reduce((s,e)=>s+paid(e),0);
  const cash=state.expenses.reduce((s,e)=>s+(Number(e.cashAmount)||0),0);
  const rear=state.expenses.reduce((s,e)=>s+(Number(e.rearUnitAmount)||0),0);
  const adds=(state.contractorAdditions||[]).reduce((s,x)=>s+(Number(x.amount)||0),0);
  const contractorPaid=contractorActual();
  const contractorSpecSettled=contractorSpecPaid();
  const contractorSaving=Math.max(0,contractorSpecSettled-contractorPaid);
  const contractorExtra=Math.max(0,contractorPaid-contractorSpecSettled);
  const contractorBase=state.contractorContractGross+adds;
  const contractorExpected=contractorBase-contractorSaving+contractorExtra;
  const estimateOriginal=items.reduce((s,o)=>s+(Number(o.x.estimate)||0),0);
  let adjustedOther=0,savings=0,orderOverrun=0,orderedEstimate=0;
  items.forEach(o=>{let est=Number(o.x.estimate)||0,ord=Number(o.x.orderedAmount)||0;if(o.x.ordered){orderedEstimate+=est;let actual=ord>0?ord:est;adjustedOther+=actual;if(actual<est)savings+=est-actual;if(actual>est)orderOverrun+=actual-est}else adjustedOther+=est});
  const baseEstimate=contractorBase+estimateOriginal;
  const adjustedEstimate=contractorExpected+adjustedOther;
  const expectedTotal=adjustedEstimate+explicitAdditional;
  return {expenseAmount,totalPaid,paidCount,expenseCount:state.expenses.length,outstandingRecorded:Math.max(0,expenseAmount-totalPaid),included,explicitAdditional,cash,rear,adds,contractorBase,contractorPaid,contractorSpecSettled,contractorSaving,contractorExtra,contractorExpected,contractorRemain:Math.max(0,contractorExpected-contractorPaid),estimateOriginal,baseEstimate,adjustedEstimate,expectedTotal,remainingExpected:Math.max(0,expectedTotal-totalPaid),savings,orderOverrun,orderedEstimate,unorderedEstimate:Math.max(0,estimateOriginal-orderedEstimate)};
};

renderEstimate = function(){
  let s=sums();
  $('estimateKpis').innerHTML=
    kpi('אומדן בסיס כולל',s.baseEstimate,'חוזה קבלן + תוספות + יתר האומדן','estimateBase')+
    kpi('אומדן צפוי מעודכן',s.expectedTotal,'אחרי הזמנות ופערים בפועל','expectedTotal')+
    kpi('שולם עד כה',s.totalPaid,'','paid')+
    kpi('נשאר לשלם',s.remainingExpected,'','remainingExpected')+
    kpi('חיסכון',s.savings+s.contractorSaving,'הזמנות + קבלן','estimateSavings')+
    kpi('עלות נוספת',s.orderOverrun+s.contractorExtra,'הזמנות + קבלן','estimateOverrun');
  $('contractorEstimateCard').innerHTML=
    '<div class="sectionTitle">עלות עיקרית – קבלן (בנייה + פיתוח)</div>'+
    '<div class="contractGrid">'+
      '<div class="metric">חוזה ללא מע״מ<b>'+money(state.contractorContractNet)+'</b></div>'+
      '<div class="metric">חוזה כולל מע״מ<b>'+money(state.contractorContractGross)+'</b></div>'+
      '<div class="metric">תוספות שהוזנו<b>'+money(s.adds)+'</b></div>'+
      '<div class="metric">בסיס קבלן נוכחי<b>'+money(s.contractorBase)+'</b></div>'+
    '</div><div class="hint">אין יותר אומדן קבלן גבוה. בסיס הקבלן הוא החוזה כולל מע״מ + התוספות שהוזנו, וממנו מעדכנים חיסכון או עלות נוספת לפי התשלומים הסופיים בפועל.</div>';
  $('estimateRows').innerHTML=estimateItems().map(o=>'<tr><td>'+esc(o.x.group||'')+'</td><td>'+esc(o.x.item||'')+'</td><td><input type="number" class="est" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.estimate)||0)+'"></td><td><label><input type="checkbox" class="ord" data-list="'+o.list+'" data-i="'+o.i+'" '+(o.x.ordered?'checked':'')+'> הוזמן</label></td><td><input type="number" class="ordAmount" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.orderedAmount)||0)+'" placeholder="סכום שהוזמן"></td><td>'+varianceText(o.x)+'</td></tr>').join('');
  document.querySelectorAll('.est').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.estimate=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
  document.querySelectorAll('.ord').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.ordered=inp.checked;if(x.ordered&&!(Number(x.orderedAmount)>0))x.orderedAmount=Number(x.estimate)||0;syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
  document.querySelectorAll('.ordAmount').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.orderedAmount=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
};

renderContractor = function(){
  let s=sums();
  $('contractorKpis').innerHTML=
    kpi('חוזה כולל מע״מ',state.contractorContractGross,'חוזה 1.95 מ׳ + מע״מ','contractorContract')+
    kpi('תוספות שהוזנו',s.adds,'','contractorAdds')+
    kpi('שולם בפועל לאריק',s.contractorPaid,'תשלומים סופיים שהוזנו','contractor')+
    kpi('חיסכון מול המפרט',s.contractorSaving,'בשלבים ששולמו','contractorSaving')+
    kpi('עלות נוספת מול המפרט',s.contractorExtra,'בשלבים ששולמו','contractorExtra')+
    kpi('צפי קבלן מעודכן',s.contractorExpected,'חוזה + תוספות ± פערי תשלום','contractorExpected');
  $('contractorCalc').innerHTML=
    '<div class="detailRow"><span>חוזה ללא מע״מ</span><b>'+money(state.contractorContractNet)+'</b></div>'+
    '<div class="detailRow"><span>חוזה כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div>'+
    '<div class="detailRow"><span>תוספות שהוזנו</span><b>'+money(s.adds)+'</b></div>'+
    '<div class="detailRow"><span>בסיס קבלן נוכחי</span><b>'+money(s.contractorBase)+'</b></div>'+
    '<div class="detailRow"><span>מפרט בשלבים שכבר שולמו</span><b>'+money(s.contractorSpecSettled)+'</b></div>'+
    '<div class="detailRow"><span>שולם בפועל בשלבים אלה</span><b>'+money(s.contractorPaid)+'</b></div>'+
    '<div class="detailRow"><span>פער מצטבר מול המפרט</span><b>'+(s.contractorSaving?'-'+money(s.contractorSaving):s.contractorExtra?'+'+money(s.contractorExtra):money(0))+'</b></div>'+
    '<div class="detailRow"><span>תשלום משותף שלבים 1+2</span><span><input id="combined12Paid" class="smallnum" type="number" value="'+state.contractorCombined12Paid+'" title="שולם בפועל"> <input id="combined12Cash" class="smallnum" type="number" value="'+state.contractorCombined12Cash+'" title="מתוכו מזומן"></span></div>';
  $('contractorAdds').innerHTML=(state.contractorAdditions||[]).map((a,i)=>'<div class="detailRow"><input class="txt addn" data-i="'+i+'" value="'+esc(a.name||'')+'"><input class="adda" data-i="'+i+'" type="number" value="'+(Number(a.amount)||0)+'"><button class="btn red adddel" data-i="'+i+'">מחק</button></div>').join('')||'<div class="hint">אין תוספות</div>';
  document.querySelectorAll('.addn,.adda').forEach(x=>x.onchange=async()=>{let a=state.contractorAdditions[+x.dataset.i];if(x.classList.contains('addn'))a.name=x.value;else a.amount=Number(x.value)||0;await save();renderAll()});
  document.querySelectorAll('.adddel').forEach(x=>x.onclick=async()=>{state.contractorAdditions.splice(+x.dataset.i,1);await save();renderAll()});
  $('combined12Paid').onchange=async e=>{state.contractorCombined12Paid=Number(e.target.value)||0;syncArikExpense('12',state.contractorCombined12Paid,state.contractorCombined12Cash);await save();renderAll()};
  $('combined12Cash').onchange=async e=>{state.contractorCombined12Cash=Number(e.target.value)||0;syncArikExpense('12',state.contractorCombined12Paid,state.contractorCombined12Cash);await save();renderAll()};
  let html='';
  for(let i=1;i<=29;i++){
    let plan=Number(state.contractorStagePlan[String(i)])||0,sp=Number(state.contractorStagePaid[String(i)])||0,cash=Number(state.contractorStageCash[String(i)])||0,note=(i===1||i===2)&&state.contractorCombined12Paid?'<span class="shared">תשלום 1+2 משותף: '+money(state.contractorCombined12Paid)+'</span>':'';
    html+='<tr><td>שלב '+i+'</td><td>'+esc(milestoneNames[i-1]||'')+'</td><td>'+money(plan)+'</td><td><input class="stagePaid smallnum" data-stage="'+i+'" type="number" value="'+sp+'"></td><td><input class="stageCash smallnum" data-stage="'+i+'" type="number" value="'+cash+'"></td><td>'+(sp>0?'<span class="good">שולם סופי</span>':'—')+'</td><td>'+stageVariance(plan,sp)+'</td><td>'+note+'</td></tr>';
  }
  $('milestones').innerHTML=html;
  document.querySelectorAll('.stagePaid').forEach(inp=>inp.onchange=async()=>{let st=inp.dataset.stage;state.contractorStagePaid[st]=Number(inp.value)||0;if(st!=='1'&&st!=='2')syncArikExpense(st,state.contractorStagePaid[st],Number(state.contractorStageCash[st])||0);await save();renderAll()});
  document.querySelectorAll('.stageCash').forEach(inp=>inp.onchange=async()=>{let st=inp.dataset.stage;state.contractorStageCash[st]=Number(inp.value)||0;if(st!=='1'&&st!=='2')syncArikExpense(st,Number(state.contractorStagePaid[st])||0,state.contractorStageCash[st]);await save();renderAll()});
};

renderAll();