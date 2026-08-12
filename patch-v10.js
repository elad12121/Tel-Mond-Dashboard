// v10: delete controls in expense details and estimate rows.
async function deleteExpenseById(id){
  if(!confirm('למחוק את ההוצאה הזאת?')) return;
  state.expenses=state.expenses.filter(e=>String(e.id)!==String(id));
  await save();
  renderAll();
  if($('modal').classList.contains('on')) $('modal').classList.remove('on');
}

async function deleteEstimateRow(list,index){
  const arr=state.estimate?.[list];
  if(!Array.isArray(arr)||!arr[index]) return;
  const item=arr[index];
  if(!confirm('למחוק את סעיף האומדן "'+(item.item||'')+'"?')) return;
  const deletedKey=list+':'+index;
  state.expenses=state.expenses.filter(e=>!(e.autoEstimate&&e.estimateKey===deletedKey));
  arr.splice(index,1);
  state.expenses.forEach(e=>{
    if(!e.autoEstimate||typeof e.estimateKey!=='string') return;
    const p=e.estimateKey.split(':');
    if(p[0]===list){
      const oldIndex=Number(p[1]);
      if(oldIndex>index) e.estimateKey=list+':'+(oldIndex-1);
    }
  });
  await save();
  renderAll();
}

const previousRenderExpensesV10=renderExpenses;
renderExpenses=function(){
  previousRenderExpensesV10();
  // The main expenses table already has a delete button; make the label explicit.
  document.querySelectorAll('#expenseRows .del').forEach(btn=>btn.textContent='מחק הוצאה');
};

const previousRenderEstimateV10=renderEstimate;
renderEstimate=function(){
  previousRenderEstimateV10();
  // Add a delete column/button to every estimate row after the current renderer finishes.
  const table=$('estimateRows')?.closest('table');
  if(table){
    const head=table.querySelector('thead tr');
    if(head&&!head.querySelector('.deleteEstimateHead')){
      const th=document.createElement('th');
      th.className='deleteEstimateHead';
      th.textContent='מחיקה';
      head.appendChild(th);
    }
  }
  document.querySelectorAll('#estimateRows tr').forEach((tr,rowIndex)=>{
    if(tr.querySelector('.deleteEstimateBtn')) return;
    const marker=tr.querySelector('[data-list][data-i]');
    if(!marker) return;
    const td=document.createElement('td');
    td.innerHTML='<button class="btn red deleteEstimateBtn" type="button">מחק סעיף</button>';
    td.querySelector('button').onclick=()=>deleteEstimateRow(marker.dataset.list,Number(marker.dataset.i));
    tr.appendChild(td);
  });
};

const previousOpenDetailV10=openDetail;
openDetail=function(kind){
  previousOpenDetailV10(kind);
  // Add delete buttons inside expense-detail modals opened from expense KPIs/categories.
  const expenseKinds=['paid','expenseAll','outstanding','additional','included','cash','rear','contractor'];
  if(expenseKinds.includes(kind)||String(kind).startsWith('cat:')){
    const rows=rowsFor(kind).sort((a,b)=>parseDate(b.date)-parseDate(a.date));
    let title={paid:'שולם בפועל',expenseAll:'כל ההוצאות שתועדו',outstanding:'יתרה בהוצאות שתועדו',additional:'מחוץ לאומדן',included:'כלול באומדן',cash:'מזומן',rear:'יחידה אחורית',contractor:'תשלומים לאריק'}[kind]||(String(kind).startsWith('cat:')?String(kind).slice(4):'פירוט');
    $('modalTitle').textContent=title;
    $('modalBody').innerHTML=rows.length?rows.map(e=>
      '<div class="detailRow"><span><b>'+esc(e.description||'')+'</b><br><span class="hint">'+esc(e.date||'')+(kind==='rear'&&e.rearUnitNotes?' · '+esc(e.rearUnitNotes):'')+'</span></span><span style="display:flex;align-items:center;gap:8px"><b>'+money(kind==='cash'?e.cashAmount:kind==='rear'?e.rearUnitAmount:kind==='outstanding'?Math.max(0,(Number(e.amount)||0)-paid(e)):paid(e))+'</b><button class="btn red modalExpenseDelete" data-expense-id="'+esc(e.id)+'" type="button">מחק</button></span></div>'
    ).join(''):'<div class="hint">אין נתונים</div>';
    document.querySelectorAll('.modalExpenseDelete').forEach(btn=>btn.onclick=()=>deleteExpenseById(btn.dataset.expenseId));
    $('modal').classList.add('on');
  }
};

renderAll();