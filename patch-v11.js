// v11: make overview expected total explicitly show base estimate + paid outside estimate.
(function(){
  const prevRenderOverviewV11=renderOverview;
  renderOverview=function(){
    const s=sums();
    const outsidePaid=Number(s.explicitAdditional)||0;
    const baseExpected=Math.max(0,(Number(s.expectedTotal)||0)-outsidePaid);
    const totalExpected=baseExpected+outsidePaid;
    $('overviewKpis').innerHTML=
      kpi('אומדן בסיס צפוי',baseExpected,'לפני הוצאות ששולמו מחוץ לאומדן','estimateBase')+
      kpi('שולם מחוץ לאומדן',outsidePaid,'מתווסף לאומדן הצפוי','additional')+
      kpi('סה״כ אומדן צפוי',totalExpected,'אומדן בסיס '+money(baseExpected)+' + מחוץ לאומדן '+money(outsidePaid),'expectedTotal')+
      kpi('שולם עד כה',s.totalPaid,s.paidCount+' מתוך '+s.expenseCount+' הוצאות עם תשלום','paid')+
      kpi('נשאר לשלם',Math.max(0,totalExpected-s.totalPaid),'סה״כ אומדן צפוי פחות שולם','remainingExpected')+
      kpi('חיסכון בהזמנות',(Number(s.savings)||0)+(Number(s.contractorSaving)||0),'כולל פערי קבלן ששולמו סופית','estimateSavings')+
      kpi('חריגה בהזמנות',(Number(s.orderOverrun)||0)+(Number(s.contractorExtra)||0),'כולל פערי קבלן','estimateOverrun')+
      kpi('יחידה אחורית',s.rear,'סכומים שסווגו ליחידה','rear');
    renderCategoryChart();
  };

  const prevOpenDetailV11=openDetail;
  openDetail=function(kind){
    if(kind==='expectedTotal'||kind==='estimateBase'||kind==='remainingExpected'){
      const s=sums();
      const outsidePaid=Number(s.explicitAdditional)||0;
      const baseExpected=Math.max(0,(Number(s.expectedTotal)||0)-outsidePaid);
      const totalExpected=baseExpected+outsidePaid;
      $('modalTitle').textContent=kind==='estimateBase'?'פירוט אומדן בסיס צפוי':kind==='remainingExpected'?'פירוט יתרה מול האומדן':'פירוט סה״כ אומדן צפוי';
      $('modalBody').innerHTML=
        '<div class="detailRow"><span>אומדן בסיס צפוי</span><b>'+money(baseExpected)+'</b></div>'+
        '<div class="detailRow"><span>הוצאות ששולמו מחוץ לאומדן</span><b>+'+money(outsidePaid)+'</b></div>'+
        '<div class="detailRow"><span><b>סה״כ אומדן צפוי</b></span><b>'+money(totalExpected)+'</b></div>'+
        '<div class="detailRow"><span>שולם עד כה מכלל ההוצאות</span><b>'+money(s.totalPaid)+'</b></div>'+
        '<div class="detailRow"><span><b>נשאר לשלם מול הצפי</b></span><b>'+money(Math.max(0,totalExpected-s.totalPaid))+'</b></div>'+
        '<div class="hint" style="margin-top:12px">לחץ על הקובייה „שולם מחוץ לאומדן” כדי לראות אילו הוצאות מרכיבות את הסכום שנוסף לאומדן.</div>';
      $('modal').classList.add('on');
      return;
    }
    prevOpenDetailV11(kind);
  };

  renderAll();
})();