// v13: keep overview base estimate aligned with Estimate tab and make expense chart refresh reliably.
(function(){
  // "אומדן בסיס" must mean the same thing everywhere: contractor base + white + misc,
  // before actual-order savings/overruns and before expenses outside the estimate.
  renderOverview=function(){
    const s=sums();
    const base=Number(s.baseEstimate)||0;
    const outsidePaid=Number(s.explicitAdditional)||0;
    const updatedExpected=Number(s.expectedTotal)||0;
    $('overviewKpis').innerHTML=
      kpi('אומדן בסיס כולל',base,'זהה לאומדן הבסיס בטאב אומדן','estimateBase')+
      kpi('אומדן צפוי מעודכן',updatedExpected,'לאחר הזמנות, פערי קבלן והוצאות מחוץ לאומדן','expectedTotal')+
      kpi('שולם מחוץ לאומדן',outsidePaid,'כלול באומדן הצפוי המעודכן','additional')+
      kpi('שולם עד כה',s.totalPaid,s.paidCount+' מתוך '+s.expenseCount+' הוצאות עם תשלום','paid')+
      kpi('נשאר לשלם',s.remainingExpected,'מול האומדן הצפוי המעודכן','remainingExpected')+
      kpi('חיסכון בהזמנות',(Number(s.savings)||0)+(Number(s.contractorSaving)||0),'כולל פערי קבלן ששולמו סופית','estimateSavings')+
      kpi('חריגה בהזמנות',(Number(s.orderOverrun)||0)+(Number(s.contractorExtra)||0),'כולל פערי קבלן','estimateOverrun')+
      kpi('יחידה אחורית',s.rear,'סכומים שסווגו ליחידה','rear');
    renderCategoryChart();
  };

  // Rebuild the chart from current state on every render. Use documented expense amount
  // (not only paid amount), so newly-added/edited expenses are represented immediately.
  categoryGroups=function(){
    const g={};
    (state.expenses||[]).forEach(e=>{
      const c=(e.category||'לא מסווג').trim()||'לא מסווג';
      if(!g[c]) g[c]={total:0,rows:[]};
      const amount=Number(e.amount)||0;
      g[c].total+=amount;
      if(amount!==0) g[c].rows.push(e);
    });
    return Object.entries(g).sort((a,b)=>b[1].total-a[1].total);
  };

  renderCategoryChart=function(){
    const arr=categoryGroups();
    const max=Math.max(1,...arr.map(x=>x[1].total));
    $('catChart').innerHTML=arr.map(([cat,d])=>
      '<div class="barRow" data-cat="'+esc(cat)+'">'+
      '<div class="barLabel">'+esc(cat)+'</div>'+
      '<div class="barTrack"><div class="barFill" style="width:'+Math.max(1,d.total/max*100)+'%"></div></div>'+
      '<div class="barValue">'+money(d.total)+'</div></div>'
    ).join('')||'<div class="hint">אין נתונים</div>';
    document.querySelectorAll('.barRow').forEach(row=>{
      row.onclick=()=>openDetail('cat:'+row.dataset.cat);
      row.onmouseenter=e=>showCatTip(e,row.dataset.cat);
      row.onmousemove=moveTip;
      row.onmouseleave=hideTip;
    });
  };

  showCatTip=function(e,cat){
    const found=categoryGroups().find(x=>x[0]===cat);
    const d=found?found[1]:{total:0,rows:[]};
    const top=[...d.rows].sort((a,b)=>(Number(b.amount)||0)-(Number(a.amount)||0)).slice(0,8);
    $('tooltip').innerHTML='<div class="tipTitle">'+esc(cat)+' · '+money(d.total)+'</div>'+
      top.map(r=>'<div class="tipLine"><span>'+esc(r.description||'')+'</span><b>'+money(Number(r.amount)||0)+'</b></div>').join('');
    $('tooltip').classList.add('on'); moveTip(e);
  };

  const prevOpenDetailV13=openDetail;
  openDetail=function(kind){
    if(kind==='estimateBase'){
      const s=sums(), c=estimateCategoryTotals();
      $('modalTitle').textContent='פירוט אומדן בסיס כולל';
      $('modalBody').innerHTML=
        '<div class="detailRow"><span>חוזה קבלן כולל מע״מ</span><b>'+money(state.contractorContractGross)+'</b></div>'+
        '<div class="detailRow"><span>תוספות קבלן</span><b>'+money(s.adds)+'</b></div>'+
        '<div class="detailRow"><span><b>סה״כ קבלן</b></span><b>'+money(s.contractorBase)+'</b></div>'+
        '<div class="detailRow"><span>חומר לבן</span><b>'+money(c.white)+'</b></div>'+
        '<div class="detailRow"><span>שונות לבית</span><b>'+money(c.misc)+'</b></div>'+
        '<div class="detailRow"><span><b>אומדן בסיס כולל</b></span><b>'+money(s.baseEstimate)+'</b></div>';
      $('modal').classList.add('on'); return;
    }
    prevOpenDetailV13(kind);
  };

  renderAll();
})();