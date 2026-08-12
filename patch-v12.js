// v12: make all estimate text fields editable, including primary category, subcategory, and item.
(function(){
  function moveEstimateItem(currentList,currentIndex,targetList){
    if(currentList===targetList) return {list:currentList,index:currentIndex};
    const src=state.estimate?.[currentList];
    const dst=state.estimate?.[targetList];
    if(!Array.isArray(src)||!Array.isArray(dst)||!src[currentIndex]) return {list:currentList,index:currentIndex};
    const [item]=src.splice(currentIndex,1);
    dst.push(item);
    return {list:targetList,index:dst.length-1};
  }

  renderEstimate=function(){
    let s=sums();
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

    const rows=[
      ...(state.estimate.white||[]).map((x,i)=>({x,list:'white',i,category:'חומר לבן'})),
      ...(state.estimate.misc||[]).map((x,i)=>({x,list:'misc',i,category:'שונות לבית'}))
    ];

    $('estimateRows').innerHTML=rows.map(o=>
      '<tr>'+ 
      '<td><select class="primaryCat" data-list="'+o.list+'" data-i="'+o.i+'">'+
        '<option value="white"'+(o.list==='white'?' selected':'')+'>חומר לבן</option>'+ 
        '<option value="misc"'+(o.list==='misc'?' selected':'')+'>שונות לבית</option>'+ 
      '</select></td>'+ 
      '<td><input class="subcatEdit txt" data-list="'+o.list+'" data-i="'+o.i+'" value="'+esc(o.x.group||'')+'"></td>'+ 
      '<td><input class="itemEdit txt" data-list="'+o.list+'" data-i="'+o.i+'" value="'+esc(o.x.item||'')+'"></td>'+ 
      '<td><input type="number" class="est" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.estimate)||0)+'"></td>'+ 
      '<td><label><input type="checkbox" class="ord" data-list="'+o.list+'" data-i="'+o.i+'" '+(o.x.ordered?'checked':'')+'> הוזמן</label></td>'+ 
      '<td><input type="number" class="ordAmount" data-list="'+o.list+'" data-i="'+o.i+'" value="'+(Number(o.x.orderedAmount)||0)+'" placeholder="סכום שהוזמן"></td>'+ 
      '<td>'+varianceText(o.x)+'</td>'+ 
      '<td><button class="btn red deleteEstimateBtn" data-list="'+o.list+'" data-i="'+o.i+'" type="button">מחק סעיף</button></td>'+ 
      '</tr>'
    ).join('');

    document.querySelectorAll('.primaryCat').forEach(inp=>inp.onchange=async()=>{
      const oldList=inp.dataset.list, oldIndex=Number(inp.dataset.i), newList=inp.value;
      const moved=moveEstimateItem(oldList,oldIndex,newList);
      // Rebuild auto-estimate linkage safely: remove the old auto row and recreate if ordered.
      state.expenses=state.expenses.filter(e=>!(e.autoEstimate&&e.estimateKey===oldList+':'+oldIndex));
      const x=state.estimate[moved.list][moved.index];
      if(x?.ordered) syncOrdered(x,moved.list,moved.index);
      await save();renderAll();
    });
    document.querySelectorAll('.subcatEdit').forEach(inp=>inp.onchange=async()=>{
      const x=state.estimate[inp.dataset.list][Number(inp.dataset.i)];
      x.group=inp.value;
      if(x.ordered) syncOrdered(x,inp.dataset.list,Number(inp.dataset.i));
      await save();renderAll();
    });
    document.querySelectorAll('.itemEdit').forEach(inp=>inp.onchange=async()=>{
      const x=state.estimate[inp.dataset.list][Number(inp.dataset.i)];
      x.item=inp.value;
      if(x.ordered) syncOrdered(x,inp.dataset.list,Number(inp.dataset.i));
      await save();renderAll();
    });
    document.querySelectorAll('.est').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.estimate=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
    document.querySelectorAll('.ord').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.ordered=inp.checked;if(x.ordered&&!(Number(x.orderedAmount)>0))x.orderedAmount=Number(x.estimate)||0;syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
    document.querySelectorAll('.ordAmount').forEach(inp=>inp.onchange=async()=>{let x=state.estimate[inp.dataset.list][+inp.dataset.i];x.orderedAmount=Number(inp.value)||0;if(x.ordered)syncOrdered(x,inp.dataset.list,+inp.dataset.i);await save();renderAll()});
    document.querySelectorAll('.deleteEstimateBtn').forEach(btn=>btn.onclick=()=>deleteEstimateRow(btn.dataset.list,Number(btn.dataset.i)));
  };

  renderAll();
})();