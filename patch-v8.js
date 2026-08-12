// v8: stages 1 and 2 are separate final payments; summaries show gross savings, extras and net gap clearly.
contractorActual = function(){let total=0;for(let i=1;i<=29;i++)total+=Number(state.contractorStagePaid[String(i)])||0;return total};
contractorSpecPaid = function(){let total=0;for(let i=1;i<=29;i++)if((Number(state.contractorStagePaid[String(i)])||0)>0)total+=Number(state.contractorStagePlan[String(i)])||0;return total};
findArikExpense = function(stage){return state.expenses.find(e=>Number(e.contractorStage)===Number(stage) || String(e.description||'').trim()==='אריק קבלן שלב '+stage)};

const previousSumsV8=sums;
sums=function(){
 const base=previousSumsV8();
 let contractorSaving=0,contractorExtra=0,contractorPaid=0,contractorSpecSettled=0;
 for(let i=1;i<=29;i++){
   const plan=Number(state.contractorStagePlan[String(i)])||0;
   const actual=Number(state.contractorStagePaid[String(i)])||0;
   if(actual>0){contractorPaid+=actual;contractorSpecSettled+=plan;if(actual<plan)contractorSaving+=plan-actual;if(actual>plan)contractorExtra+=actual-plan;}
 }
 const adds=(state.contractorAdditions||[]).reduce((s,x)=>s+(Number(x.amount)||0),0);
 const contractorBase=state.contractorContractGross+adds;
 const contractorNetGap=contractorSaving-contractorExtra;
 const contractorExpected=contractorBase-contractorNetGap;
 const items=estimateItems();
 const estimateOriginal=items.reduce((s,o)=>s+(Number(o.x.estimate)||0),0);
 let adjustedOther=0,savings=0,orderOverrun=0,orderedEstimate=0;
 items.forEach(o=>{let est=Number(o.x.estimate)||0,ord=Number(o.x.orderedAmount)||0;if(o.x.ordered){orderedEstimate+=est;let actual=ord>0?ord:est;adjustedOther+=actual;if(actual<est)savings+=est-actual;if(actual>est)orderOverrun+=actual-est}else adjustedOther+=est});
 const baseEstimate=contractorBase+estimateOriginal;
 const adjustedEstimate=contractorExpected+adjustedOther;
 const expectedTotal=adjustedEstimate+base.explicitAdditional;
 return {...base,adds,contractorBase,contractorPaid,contractorSpecSettled,contractorSaving,contractorExtra,contractorNetGap,contractorExpected,contractorRemain:Math.max(0,contractorExpected-contractorPaid),estimateOriginal,baseEstimate,adjustedEstimate,expectedTotal,remainingExpected:Math.max(0,expectedTotal-base.totalPaid),savings,orderOverrun,orderedEstimate,unorderedEstimate:Math.max(0,estimateOriginal-orderedEstimate)};
};

renderContractor=function(){
 const s=sums();
 const netLabel=s.contractorNetGap>0?'חיסכון נטו':s.contractorNetGap<0?'עלות נוספת נטו':'פער נטו';
 const netValue=Math.abs(s.contractorNetGap);
 $('contractorKpis').innerHTML=
   kpi('בסיס קבלן',s.contractorBase,'חוזה כולל מע״מ + תוספות','contractorBase')+
   kpi('שולם בפועל',s.contractorPaid,'שלבים ששולמו סופית','contractor')+
   kpi('חיסכון מצטבר',s.contractorSaving,'למשל שלב 3: 9,000 ₪','contractorSaving')+
   kpi('עלות נוספת מצטברת',s.contractorExtra,'למשל שלב 2: 2,124 ₪','contractorExtra')+
   kpi(netLabel,netValue,'חיסכון פחות עלויות נוספות','contractorNet')+
   kpi('צפי קבלן מעודכן',s.contractorExpected,'בסיס קבלן ± הפערים בפועל','contractorExpected');
 $('contractorCalc').innerHTML=
   '<div class="detailRow"><span>חוזה ללא מע״מ</span><b>'+money(state.contractorContractNet)+'</b></div>'+
   '<div class="detailRow"><span>חוזה כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div>'+
   '<div class="detailRow"><span>תוספות שהוזנו</span><b>'+money(s.adds)+'</b></div>'+
   '<div class="detailRow"><span><b>בסיס קבלן</b></span><b>'+money(s.contractorBase)+'</b></div>'+
   '<div class="detailRow"><span>מפרט עבור שלבים ששולמו</span><b>'+money(s.contractorSpecSettled)+'</b></div>'+
   '<div class="detailRow"><span>שולם בפועל באותם שלבים</span><b>'+money(s.contractorPaid)+'</b></div>'+
   '<div class="detailRow"><span>חיסכון מצטבר</span><b class="good">'+money(s.contractorSaving)+'</b></div>'+
   '<div class="detailRow"><span>עלות נוספת מצטברת</span><b class="over">'+money(s.contractorExtra)+'</b></div>'+
   '<div class="detailRow"><span><b>'+netLabel+'</b></span><b>'+money(netValue)+'</b></div>';
 $('contractorAdds').innerHTML=(state.contractorAdditions||[]).map((a,i)=>'<div class="detailRow"><input class="txt addn" data-i="'+i+'" value="'+esc(a.name||'')+'"><input class="adda" data-i="'+i+'" type="number" value="'+(Number(a.amount)||0)+'"><button class="btn red adddel" data-i="'+i+'">מחק</button></div>').join('')||'<div class="hint">אין תוספות</div>';
 document.querySelectorAll('.addn,.adda').forEach(x=>x.onchange=async()=>{let a=state.contractorAdditions[+x.dataset.i];if(x.classList.contains('addn'))a.name=x.value;else a.amount=Number(x.value)||0;await save();renderAll()});
 document.querySelectorAll('.adddel').forEach(x=>x.onclick=async()=>{state.contractorAdditions.splice(+x.dataset.i,1);await save();renderAll()});
 let html='';
 for(let i=1;i<=29;i++){
   const plan=Number(state.contractorStagePlan[String(i)])||0,sp=Number(state.contractorStagePaid[String(i)])||0,cash=Number(state.contractorStageCash[String(i)])||0;
   html+='<tr><td>שלב '+i+'</td><td>'+esc(milestoneNames[i-1]||'')+'</td><td>'+money(plan)+'</td><td><input class="stagePaid smallnum" data-stage="'+i+'" type="number" value="'+sp+'"></td><td><input class="stageCash smallnum" data-stage="'+i+'" type="number" value="'+cash+'"></td><td>'+(sp>0?'<span class="good">שולם סופי</span>':'—')+'</td><td>'+stageVariance(plan,sp)+'</td><td></td></tr>';
 }
 $('milestones').innerHTML=html;
 document.querySelectorAll('.stagePaid').forEach(inp=>inp.onchange=async()=>{let st=inp.dataset.stage;state.contractorStagePaid[st]=Number(inp.value)||0;syncArikExpense(st,state.contractorStagePaid[st],Number(state.contractorStageCash[st])||0);await save();renderAll()});
 document.querySelectorAll('.stageCash').forEach(inp=>inp.onchange=async()=>{let st=inp.dataset.stage;state.contractorStageCash[st]=Number(inp.value)||0;syncArikExpense(st,Number(state.contractorStagePaid[st])||0,state.contractorStageCash[st]);await save();renderAll()});
};

const previousOpenDetailV8=openDetail;
openDetail=function(kind){
 if(['contractorSaving','contractorExtra','contractorNet','contractorBase','contractorExpected'].includes(kind)){
   const s=sums();
   $('modalTitle').textContent=kind==='contractorSaving'?'פירוט חיסכון מול המפרט':kind==='contractorExtra'?'פירוט עלויות נוספות מול המפרט':kind==='contractorNet'?'פער נטו מול המפרט':kind==='contractorBase'?'פירוט בסיס קבלן':'פירוט צפי קבלן';
   let body='';
   if(kind==='contractorSaving'||kind==='contractorExtra'){
     for(let i=1;i<=29;i++){const plan=Number(state.contractorStagePlan[String(i)])||0,actual=Number(state.contractorStagePaid[String(i)])||0,d=actual-plan;if(actual>0&&((kind==='contractorSaving'&&d<0)||(kind==='contractorExtra'&&d>0)))body+='<div class="detailRow"><span>שלב '+i+' – '+esc(milestoneNames[i-1]||'')+'</span><b>'+money(Math.abs(d))+'</b></div>';}
     if(!body)body='<div class="hint">אין נתונים</div>';
   }else{
     body='<div class="detailRow"><span>חוזה כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div><div class="detailRow"><span>תוספות</span><b>'+money(s.adds)+'</b></div><div class="detailRow"><span>בסיס קבלן</span><b>'+money(s.contractorBase)+'</b></div><div class="detailRow"><span>חיסכון מצטבר</span><b>'+money(s.contractorSaving)+'</b></div><div class="detailRow"><span>עלות נוספת מצטברת</span><b>'+money(s.contractorExtra)+'</b></div><div class="detailRow"><span>צפי קבלן מעודכן</span><b>'+money(s.contractorExpected)+'</b></div>';
   }
   $('modalBody').innerHTML=body;$('modal').classList.add('on');return;
 }
 previousOpenDetailV8(kind);
};
renderAll();