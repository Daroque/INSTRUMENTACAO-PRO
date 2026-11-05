/* Instrumentação PRO — Módulo 07 — Calha Parshall.
 * Curvas para escoamento livre baseadas na tabela 2 ASTM D1941-21
 * e no USBR Water Measurement Manual, capítulo 8, seção 10.
 * C em ft³/s, H_a em ft. A interface apresenta unidades métricas.
 * Valores de garganta não padronizados NÃO recebem coeficientes interpolados.
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  if (!$('parshallSize')) return;
  const FT_TO_MM = 304.8;
  const CFS_TO_M3H = 101.9406477312;
  const fmt = (number, digits=2) => Number(number).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const num = (value) => {
    if (String(value).trim() === '') return null;
    const n=Number(String(value).replace(',','.'));
    return Number.isFinite(n) ? n : null;
  };
  // Throat width W (inches), discharge coefficient C, exponent n,
  // empirical minimum/maximum discharge in ft³/s, as standardized.
  const sizes = [
    // Coeficientes: USBR Water Measurement Manual, tabela 8-6.
    // Vazões máximas: curvas padrão de capacidade de escoamento livre.
    {inch:1,c:.338,n:1.55,min:.03,max:.2},
    {inch:2,c:.676,n:1.55,min:.05,max:.5},
    {inch:3,c:.992,n:1.55,min:.08,max:1.1},
    {inch:6,c:2.06,n:1.58,min:.05,max:3.9},
    {inch:9,c:3.07,n:1.53,min:.09,max:8.9},
    {inch:12,c:3.95,n:1.55,min:.11,max:16.1},
    {inch:24,c:8.00,n:1.55,min:.42,max:33.1},
    {inch:36,c:12.00,n:1.57,min:.61,max:50.4},
    {inch:48,c:16.00,n:1.58,min:1.3,max:67.9},
    {inch:60,c:20.00,n:1.59,min:1.6,max:85.6},
    {inch:72,c:24.00,n:1.59,min:2.6,max:103.5},
    {inch:84,c:28.00,n:1.60,min:3.0,max:121.4},
    {inch:96,c:32.00,n:1.61,min:3.5,max:139.5},
    {inch:120,c:39.38,n:1.60,min:6,max:200},
    {inch:144,c:46.75,n:1.60,min:8,max:350},
    {inch:180,c:57.81,n:1.60,min:8,max:600},
    {inch:240,c:76.25,n:1.60,min:10,max:1000},
    {inch:300,c:94.69,n:1.60,min:15,max:1200},
    {inch:360,c:113.13,n:1.60,min:15,max:1500},
    {inch:480,c:150,n:1.60,min:20,max:2000},
    {inch:600,c:186.88,n:1.60,min:25,max:3000}
  ].map(r => Object.freeze({...r, widthMm:r.inch*25.4,
    label: r.inch < 12 ? `${r.inch} pol` : `${fmt(r.inch/12, r.inch%12 ? 1 : 0)} pés`,
    // USBR recommends H_a >= 0.2 ft for the small flumes (through 1 ft).
    minHaMm: Math.max(Math.pow(r.min/r.c,1/r.n)*FT_TO_MM, r.inch<=12?0.2*FT_TO_MM:0),
    maxHaMm: Math.pow(r.max/r.c,1/r.n)*FT_TO_MM,
    subLimit: r.inch<=3?.50:r.inch<=9?.60:r.inch<=96?.70:.80
  }));
  const sizeEl=$('parshallSize');
  sizes.forEach((item, i)=>{
    const option=document.createElement('option');
    option.value=String(i);
    option.textContent=`${item.label} — ${fmt(item.widthMm,1)} mm`;
    sizeEl.appendChild(option);
  });
  sizeEl.value='3';

  const convertFlow=(q,unit)=>unit==='m3h'?q*CFS_TO_M3H:
    unit==='m3s'?q*0.028316846592:
    unit==='ls'?q*28.316846592:q*1699.01079552;
  const labelUnit=(unit)=>({m3h:'m³/h',m3s:'m³/s',ls:'L/s',lmin:'L/min'}[unit]);
  const flow=(r,hMm)=>r.c*Math.pow(hMm/FT_TO_MM,r.n);
  const warn=(status,text)=>{
    $('parshallValidation').className=`parshall-alert ${status}`;
    $('parshallValidation').textContent=text;
    $('parshallFlowStatus').textContent=status==='error'?'Verifique o preenchimento.':status==='warning'?'Fora da faixa válida.':'Dentro da faixa de referência.';
    $('parshallFlowStatus').style.color=status==='ok'?'var(--green)':'var(--warn)';
  };
  const clear=()=>{
    $('parshallFlow').textContent='—';
    $('parshallTableBody').innerHTML='<tr><td colspan="2">Insira uma garganta padronizada.</td></tr>';
    $('parshallCurve').innerHTML='';
    $('parshallTableNote').textContent='Sem curva disponível para os dados informados.';
  };
  const findWidth=(width)=>sizes.find(r=>Math.abs(width-r.widthMm)<=Math.min(1,Math.max(.25,r.widthMm*.001)));
  function chart(r, currentHead, unit, maxHead) {
    const svg=$('parshallCurve');
    const lower=r.minHaMm, upper=r.maxHaMm;
    const left=78,right=600,top=24,bottom=284;
    const qMax=convertFlow(flow(r,upper),unit);
    const plotX=(h)=>left+(h-lower)/(upper-lower)*(right-left);
    const plotY=(q)=>bottom-(q/qMax)*(bottom-top);
    const ticks=[];
    for(let k=0;k<=5;k++){
      const y=bottom-(bottom-top)*k/5;
      ticks.push(`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#c7d5e2" stroke-dasharray="4 5" />`);
      ticks.push(`<text x="${left-8}" y="${y+5}" text-anchor="end" font-size="12" fill="#6b7d91">${fmt(qMax*k/5,1)}</text>`);
      const h=lower+(upper-lower)*k/5;
      ticks.push(`<text x="${plotX(h)}" y="${bottom+25}" text-anchor="middle" font-size="12" fill="#6b7d91">${fmt(h,0)}</text>`);
    }
    const points=[];
    for(let i=0;i<=100;i++){
      const h=lower+(upper-lower)*i/100;
      const q=convertFlow(flow(r,h),unit);
      points.push(`${i===0?'M':'L'}${plotX(h).toFixed(2)} ${plotY(q).toFixed(2)}`);
    }
    const active=currentHead>=lower&&currentHead<=upper;
    const dot=active?`<circle cx="${plotX(currentHead)}" cy="${plotY(convertFlow(flow(r,currentHead),unit))}" r="7" fill="#0b75c9" stroke="white" stroke-width="3" />`:'';
    svg.innerHTML=`<rect width="620" height="340" rx="15" fill="#fff" />${ticks.join('')}
      <path d="M${left},${top}V${bottom}H${right}" stroke="#728ca5" stroke-width="2" fill="none" />
      <path d="${points.join(' ')}" fill="none" stroke="#1485d1" stroke-width="4" stroke-linecap="round"/>
      ${dot}<text x="${(left+right)/2}" y="332" text-anchor="middle" fill="#344c65" font-size="14">Altura Hₐ (mm)</text>
      <text x="21" y="${(top+bottom)/2}" text-anchor="middle" transform="rotate(-90 21 ${(top+bottom)/2})" fill="#344c65" font-size="13">Vazão (${labelUnit(unit)})</text>`;
  }
  function update(){
    const width=num($('parshallWidth').value), head=num($('parshallHead').value);
    const unit=$('parshallOutputUnit').value;
    const step=Number($('parshallStep').value);
    $('parshallFlowUnit').textContent=labelUnit(unit);
    $('parshallTableHeaderFlow').textContent=`Vazão (${labelUnit(unit)})`;
    const r=width!==null&&width>0?findWidth(width):null;
    $('parshallWidthDisplay').textContent=r?`${r.label} (${fmt(r.widthMm,1)} mm)`:'—';
    $('parshallHeadDisplay').textContent=head!==null?`${fmt(head,1)} mm`:'—';
    $('parshallRangeDisplay').textContent=r?`${fmt(r.minHaMm,0)} a ${fmt(r.maxHaMm,0)} mm`:'—';
    $('parshallSubLimit').textContent=r?`${fmt(r.subLimit*100,0)}% (Hᵦ/Hₐ)`:'—';
    if (width===null||head===null||width<=0||head<0){warn('error','Informe uma largura W positiva e uma altura Hₐ maior ou igual a zero.');clear();return;}
    if(!r){
      const nearest=[...sizes].sort((a,b)=>Math.abs(width-a.widthMm)-Math.abs(width-b.widthMm))[0];
      warn('error',`A garganta ${fmt(width,2)} mm não corresponde a um padrão calibrado. Mais próxima: ${nearest.label} (${fmt(nearest.widthMm,1)} mm). Não será feita interpolação.`);clear();return;
    }
    if (head<r.minHaMm-0.00001||head>r.maxHaMm+0.00001){
      warn('warning',`Hₐ fora da faixa de referência para ${r.label} (${fmt(r.minHaMm,1)} a ${fmt(r.maxHaMm,1)} mm). Não é apresentada vazão extrapolada.`);
      $('parshallFlow').textContent='—';
    } else {
      warn('ok',`Calha padronizada ${r.label}. Relação válida somente com escoamento livre e medição correta da altura Hₐ.`);
      const q=convertFlow(flow(r,head),unit);
      $('parshallFlow').textContent=fmt(q,q<1?4:2);
    }
    chart(r,head,unit,r.maxHaMm);
    // Table in the verified calibration interval. Includes the upper bound even
    // when step does not divide the range. Never generate extrapolated values.
    const heights=[r.minHaMm];
    let limit=false;
    let h=Math.ceil(r.minHaMm/step)*step;
    for(;h<r.maxHaMm-0.001;h+=step){
      if(h>r.minHaMm+0.01)heights.push(h);
      if(heights.length>=150){limit=true;break;}
    }
    if(!limit) heights.push(r.maxHaMm);
    if(!limit&&head>=r.minHaMm&&head<=r.maxHaMm&&!heights.some(v=>Math.abs(v-head)<.05))heights.push(head);
    heights.sort((a,b)=>a-b);
    $('parshallTableBody').innerHTML=heights.map(h0=>{
      const q=convertFlow(flow(r,h0),unit);
      const current=Math.abs(h0-head)<.05?' class="parshall-current"':'';
      return `<tr${current}><td>${fmt(h0,1)}</td><td>${fmt(q,q<1?4:2)}</td></tr>`;
    }).join('');
    $('parshallTableNote').textContent=`Tabela para garganta W = ${fmt(r.widthMm,1)} mm, de ${fmt(r.minHaMm,1)} a ${fmt(r.maxHaMm,1)} mm de altura Hₐ. ${limit?'Exibição limitada a 150 linhas; aumente o intervalo para visualizar toda a faixa.':'A altura informada é destacada quando está na faixa.'}`;
  }
  sizeEl.addEventListener('change',()=>{
    $('parshallWidth').value=String(sizes[Number(sizeEl.value)].widthMm);
    update();
  });
  $('parshallWidth').addEventListener('input',()=>{
    const r=findWidth(num($('parshallWidth').value) || 0);
    if(r)sizeEl.value=String(sizes.indexOf(r));
    else sizeEl.selectedIndex=-1;
    update();
  });
  ['parshallHead','parshallOutputUnit','parshallStep'].forEach(id=>{
    $(id).addEventListener('input',update);
    $(id).addEventListener('change',update);
  });
  update();
})();
