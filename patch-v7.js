// v7: show the non-contractor portion explicitly in the base estimate summary.
const previousRenderEstimateV7 = renderEstimate;
renderEstimate = function(){
  previousRenderEstimateV7();
  const s=sums();
  const cards=$('estimateKpis').querySelectorAll('.kpi');
  if(cards[0]){
    const sub=cards[0].querySelector('.sub');
    if(sub) sub.textContent='קבלן '+money(s.contractorBase)+' + יתר האומדן '+money(s.estimateOriginal);
  }
};

const previousOpenDetailV7 = openDetail;
openDetail = function(kind){
  if(kind==='estimateBase'){
    const s=sums();
    $('modalTitle').textContent='פירוט אומדן בסיס כולל';
    $('modalBody').innerHTML=
      '<div class="detailRow"><span>חוזה קבלן כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div>'+
      '<div class="detailRow"><span>תוספות קבלן שהוזנו</span><b>'+money(s.adds)+'</b></div>'+
      '<div class="detailRow"><span>סה״כ קבלן בבסיס האומדן</span><b>'+money(s.contractorBase)+'</b></div>'+
      '<div class="detailRow"><span>יתר סעיפי האומדן מלבד הקבלן</span><b>'+money(s.estimateOriginal)+'</b></div>'+
      '<div class="detailRow"><span><b>אומדן בסיס כולל</b></span><b>'+money(s.baseEstimate)+'</b></div>';
    $('modal').classList.add('on');
    return;
  }
  previousOpenDetailV7(kind);
};

renderAll();