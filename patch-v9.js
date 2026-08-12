// v9: classify estimate into contractor / חומר לבן / שונות לבית and make base estimate breakdown clearer.
function estimateCategoryTotals(){
  const white=(state.estimate?.white||[]).reduce((s,x)=>s+(Number(x.estimate)||0),0);
  const misc=(state.estimate?.misc||[]).reduce((s,x)=>s+(Number(x.estimate)||0),0);
  return {white,misc};
}

const previousRenderEstimateV9=renderEstimate;
renderEstimate=function(){
  previousRenderEstimateV9();
  const s=sums();
  const c=estimateCategoryTotals();
  $('estimateKpis').innerHTML=
    kpi('אומדן בסיס כולל',s.baseEstimate,'קבלן '+money(s.contractorBase)+' + חומר לבן '+money(c.white)+' + שונות לבית '+money(c.misc),'estimateBase')+
    kpi('קבלן',s.contractorBase,'חוזה + תוספות','estimateContractor')+
    kpi('חומר לבן',c.white,'לפי גיליון חומר לבן','estimateWhite')+
    kpi('שונות לבית',c.misc,'לפי גיליון שונות לבית','estimateMisc')+
    kpi('אומדן צפוי מעודכן',s.expectedTotal,'אחרי הזמנות ופערים בפועל','expectedTotal')+
    kpi('שולם עד כה',s.totalPaid,'','paid')+
    kpi('נשאר לשלם',s.remainingExpected,'','remainingExpected')+
    kpi('חיסכון',s.savings+s.contractorSaving,'הזמנות + קבלן','estimateSavings')+
    kpi('עלות נוספת',s.orderOverrun+s.contractorExtra,'הזמנות + קבלן','estimateOverrun');

  $('estimateRows').innerHTML=[
    ...(state.estimate.white||[]).map((x,i)=>({x,list:'white',i,category:'חומר לבן'})),
    ...(state.estimate.misc||[]).map((x,i)=>({x,list:'misc',i,category:'שונות לבית'}))
  ].map(o=>'<tr><td><b>'+o.category+'</b></td><td>'+esc(o.x.group||'')+'</td><td>'+esc(o.x.item||'')+'</td><td><input type="number" class="est" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.estimate)||0)+'"></td><td><label><input type="checkbox" class="ord" data-list="'+o.list+'" data-i="'+o.i+'" '+(o.x.ordered?'checked':'')+'> הוזמן</label></td><td><input type="number" class="ordAmount" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.orderedAmount)||0)+'" placeholder="סכום שהוזמן"></td><td>'+varianceText(o.x)+'</td></tr>').join('');
  document.querySelectorAll('.est').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.estimate=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
  document.querySelectorAll('.ord').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.ordered=inp.checked;if(x.ordered&&!(Number(x.orderedAmount)>0))x.orderedAmount=Number(x.estimate)||0;syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
  document.querySelectorAll('.ordAmount').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.orderedAmount=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
};

const previousOpenDetailV9=openDetail;
openDetail=function(kind){
  const c=estimateCategoryTotals();
  const s=sums();
  if(kind==='estimateBase'){
    $('modalTitle').textContent='פירוט אומדן בסיס כולל';
    $('modalBody').innerHTML=
      '<div class="detailRow"><span>חוזה קבלן כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div>'+
      '<div class="detailRow"><span>תוספות קבלן שהוזנו</span><b>'+money(s.adds)+'</b></div>'+
      '<div class="detailRow"><span><b>סה״כ קבלן</b></span><b>'+money(s.contractorBase)+'</b></div>'+
      '<div class="detailRow"><span><b>חומר לבן</b></span><b>'+money(c.white)+'</b></div>'+
      '<div class="detailRow"><span><b>שונות לבית</b></span><b>'+money(c.misc)+'</b></div>'+
      '<div class="detailRow"><span><b>אומדן בסיס כולל</b></span><b>'+money(s.baseEstimate)+'</b></div>';
    $('modal').classList.add('on'); return;
  }
  if(kind==='estimateWhite'||kind==='estimateMisc'){
    const list=kind==='estimateWhite'?(state.estimate.white||[]):(state.estimate.misc||[]);
    $('modalTitle').textContent=kind==='estimateWhite'?'חומר לבן':'שונות לבית';
    const groups={};
    list.forEach(x=>{const g=x.group||'ללא תת־קטגוריה';groups[g]=(groups[g]||0)+(Number(x.estimate)||0)});
    $('modalBody').innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([g,v])=>'<div class="detailRow"><span>'+esc(g)+'</span><b>'+money(v)+'</b></div>').join('')+'<div class="detailRow"><span><b>סה״כ</b></span><b>'+money(kind==='estimateWhite'?c.white:c.misc)+'</b></div>';
    $('modal').classList.add('on'); return;
  }
  if(kind==='estimateContractor'){
    $('modalTitle').textContent='קבלן';
    $('modalBody').innerHTML='<div class="detailRow"><span>חוזה כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div><div class="detailRow"><span>תוספות שהוזנו</span><b>'+money(s.adds)+'</b></div><div class="detailRow"><span><b>סה״כ קבלן בבסיס האומדן</b></span><b>'+money(s.contractorBase)+'</b></div>';
    $('modal').classList.add('on'); return;
  }
  previousOpenDetailV9(kind);
};

renderAll();