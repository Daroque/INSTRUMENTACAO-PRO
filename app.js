(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmt = (n, dec = 2) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const resultCard = (label, value) => `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`;
  const valueOrNull = (id) => {
    const raw = $(id)?.value?.trim?.() ?? '';
    if (raw === '') return null;
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const tabs = Array.from(document.querySelectorAll('.tab'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const moduleSubtitle = $('module-subtitle');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => {
        p.classList.remove('active');
        p.hidden = true;
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = $(tab.dataset.panel);
      if (panel) {
        panel.classList.add('active');
        panel.hidden = false;
      }
      moduleSubtitle.textContent = tab.dataset.subtitle || '';
    });
  });

  const pressureToBar = {
    bar: 1,
    psi: 0.0689475729,
    kgf: 0.980665,
    kpa: 0.01,
    mpa: 10,
    pa: 0.00001,
    mca: 0.0980665,
    mmhg: 0.00133322368,
    mmh2o: 0.0000980665,
    mbar: 0.001,
    atm: 1.01325,
    inh2o: 0.002490889,
    torr: 0.001333223684
  };
  const pressureLabels = {
    bar: 'bar', psi: 'psi', kgf: 'kgf/cm²', kpa: 'kPa', mpa: 'MPa', pa: 'Pa', mca: 'mca', mmhg: 'mmHg', mmh2o: 'mmH₂O', mbar: 'mbar', atm: 'atm', inh2o: 'inH₂O', torr: 'Torr'
  };

  function updatePressure() {
    const val = valueOrNull('pValue');
    const unit = $('pUnit').value;
    const target = $('pTarget').value;
    if (val === null) {
      setHTML('pressureResults', resultCard('Verifique os dados', 'Informe um valor válido.'));
      return;
    }
    const bar = val * pressureToBar[unit];
    const out = bar / pressureToBar[target];
    const dec = Math.abs(out) >= 100000 ? 0 : (Math.abs(out) < 0.001 && out !== 0 ? 8 : 4);
    setHTML('pressureResults', resultCard(pressureLabels[target], `${fmt(out, dec)} ${pressureLabels[target]}`));
  }

  const metricToM = { mm: 0.001, cm: 0.01, m: 1, km: 1000, pol: 0.0254, ft: 0.3048 };
  const metricLabels = { mm: 'mm', cm: 'cm', m: 'm', km: 'km', pol: 'pol', ft: 'ft' };
  function updateMetric() {
    const val = valueOrNull('metricValue');
    const from = $('metricUnit').value;
    const to = $('metricTarget').value;
    if (val === null) {
      setHTML('metricResults', resultCard('Verifique os dados', 'Informe um valor válido.'));
      return;
    }
    const meters = val * metricToM[from];
    const out = meters / metricToM[to];
    const dec = Math.abs(out) >= 100000 ? 0 : (Math.abs(out) < 0.001 && out !== 0 ? 8 : 4);
    setHTML('metricResults', resultCard(metricLabels[to], `${fmt(out, dec)} ${metricLabels[to]}`));
  }

  const flowToM3s = { m3s: 1, m3h: 1 / 3600, lh: 0.001 / 3600, ls: 0.001, lmin: 0.001 / 60 };
  const flowLabels = { m3s: 'm³/s', m3h: 'm³/h', lh: 'L/h', ls: 'L/s', lmin: 'L/min' };
  function updateFlow() {
    const val = valueOrNull('fValue');
    const unit = $('fUnit').value;
    if (val === null) {
      setHTML('flowResults', resultCard('Verifique os dados', 'Informe uma vazão válida.'));
      return;
    }
    const m3s = val * flowToM3s[unit];
    const html = Object.keys(flowToM3s).map((key) => {
      const out = m3s / flowToM3s[key];
      const dec = key === 'm3s' ? 6 : 3;
      return resultCard(flowLabels[key], `${fmt(out, dec)} ${flowLabels[key]}`);
    }).join('');
    setHTML('flowResults', html);
  }


  function meterInstallDiagram(diameter, upstream, downstream) {
    // Cotagem referenciada ao centro do medidor, conforme solicitado.
    return `<svg viewBox="0 0 1040 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Instalação do medidor: ${fmt(upstream, 1)} mm antes e ${fmt(downstream, 1)} mm depois">
      <defs>
        <marker id="flow-arrow-162" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#1976bd"/></marker>
        <marker id="dim-arrow-162" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse"><path d="M0,0 L9,4.5 L0,9 Z" fill="#163e62"/></marker>
      </defs>
      <text x="520" y="32" text-anchor="middle" fill="#123b60" font-size="25" font-weight="800">Instalação mínima do medidor de vazão</text>
      <text x="520" y="65" text-anchor="middle" fill="#416681" font-size="18">Diâmetro informado: ${fmt(diameter,2)} mm</text>
      <path d="M85 190 H955" fill="none" stroke="#c5d5e3" stroke-width="72" stroke-linecap="round"/>
      <path d="M85 190 H955" fill="none" stroke="#7191ad" stroke-width="48" stroke-linecap="round"/>
      <path d="M85 190 H955" fill="none" stroke="#dcebf5" stroke-width="35" stroke-linecap="round"/>
      <rect x="474" y="144" width="92" height="92" rx="12" fill="#dce9f4" stroke="#1b496e" stroke-width="4"/>
      <rect x="497" y="131" width="46" height="120" rx="6" fill="#8db6d5" stroke="#1b496e" stroke-width="3"/>
      <circle cx="520" cy="127" r="30" fill="#eef6fb" stroke="#1565a3" stroke-width="5"/>
      <circle cx="520" cy="127" r="16" fill="#c6dfef" stroke="#3778aa" stroke-width="3"/>
      <text x="520" y="288" text-anchor="middle" fill="#123b60" font-size="19" font-weight="800">MEDIDOR</text>
      <path d="M297 102 H431" fill="none" stroke="#1976bd" stroke-width="6" marker-end="url(#flow-arrow-162)"/>
      <text x="363" y="90" text-anchor="middle" fill="#155e9a" font-size="20" font-weight="800">Fluxo</text>
      <path d="M90 251 V326 M520 108 V326 M950 251 V326" stroke="#59758b" stroke-width="2.4" stroke-dasharray="7 5"/>
      <path d="M90 314 H520" stroke="#163e62" stroke-width="3.5" marker-start="url(#dim-arrow-162)" marker-end="url(#dim-arrow-162)"/>
      <path d="M520 314 H950" stroke="#163e62" stroke-width="3.5" marker-start="url(#dim-arrow-162)" marker-end="url(#dim-arrow-162)"/>
      <text x="305" y="357" text-anchor="middle" fill="#123b60" font-size="24" font-weight="800">ANTES · 5 × D</text>
      <text x="305" y="392" text-anchor="middle" fill="#0e598f" font-size="29" font-weight="800">${fmt(upstream, 2)} mm</text>
      <text x="735" y="357" text-anchor="middle" fill="#123b60" font-size="24" font-weight="800">DEPOIS · 2 × D</text>
      <text x="735" y="392" text-anchor="middle" fill="#0e598f" font-size="29" font-weight="800">${fmt(downstream, 2)} mm</text>
    </svg>`;
  }

  function updateMeterInstall() {
    const raw = valueOrNull('meterDiameter');
    const d = raw === null ? 0 : raw;
    if (d < 0) {
      const html = [
        resultCard('Diâmetro do tubo', `${fmt(d, 2)} mm`),
        resultCard('Trecho mínimo antes do medidor', `0,00 mm`),
        resultCard('Trecho mínimo depois do medidor', `0,00 mm`),
        resultCard('Aviso', `Informe um diâmetro igual ou maior que zero`)
      ].join('');
      setHTML('meterInstallResults', html);
      setHTML('meterInstallDiagram', meterInstallDiagram(0, 0, 0));
      return;
    }
    const upstream = 5 * d;
    const downstream = 2 * d;
    const summary = d === 0 ? 'Informe um valor maior que zero para uma instalação real' : 'Instalação mínima: 5D antes e 2D depois';
    const html = [
      resultCard('Diâmetro do tubo', `${fmt(d, 2)} mm`),
      resultCard('Trecho mínimo antes do medidor', `${fmt(upstream, 2)} mm`),
      resultCard('Trecho mínimo depois do medidor', `${fmt(downstream, 2)} mm`),
      resultCard('Resumo', summary)
    ].join('');
    setHTML('meterInstallResults', html);
    setHTML('meterInstallDiagram', meterInstallDiagram(d, upstream, downstream));
  }

  function updateOrifice() {
    const Dmm = valueOrNull('oD');
    const dmm = valueOrNull('od');
    const dpkPa = valueOrNull('odp');
    const rho = valueOrNull('orho');
    const cd = valueOrNull('ocd');
    if ([Dmm, dmm, dpkPa, rho, cd].some(v => v === null)) {
      setHTML('orificeResults', resultCard('Verifique os dados', 'Informe os valores do cálculo.'));
      return;
    }
    const D = Dmm / 1000, d = dmm / 1000, dp = dpkPa * 1000;
    if (D <= 0 || d <= 0 || d >= D || dp < 0 || rho <= 0 || cd <= 0) {
      setHTML('orificeResults', resultCard('Aviso', 'Verifique diâmetros, pressão diferencial, densidade e Cd.'));
      return;
    }
    const beta = d / D;
    const area = Math.PI * d * d / 4;
    const q = cd * area * Math.sqrt((2 * dp) / (rho * (1 - Math.pow(beta, 4))));
    const qh = q * 3600;
    const vPipe = q / (Math.PI * D * D / 4);
    const vOrifice = q / area;
    const reynoldsHint = (rho * vPipe * D) / 0.001;
    setHTML('orificeResults', [
      resultCard('Vazão estimada', `${fmt(qh, 3)} m³/h`),
      resultCard('Vazão estimada', `${fmt(q, 6)} m³/s`),
      resultCard('Beta (d/D)', `${fmt(beta, 4)}`),
      resultCard('Velocidade na tubulação', `${fmt(vPipe, 3)} m/s`),
      resultCard('Velocidade no orifício', `${fmt(vOrifice, 3)} m/s`),
      resultCard('Reynolds aproximado', `${fmt(reynoldsHint, 0)}`)
    ].join(''));
  }

  function updateTemp() {
    const value = valueOrNull('tValue');
    const unit = $('tUnit').value;
    if (value === null) {
      setHTML('tempResults', resultCard('Verifique os dados', 'Informe uma temperatura válida.'));
      return;
    }
    let c = value;
    if (unit === 'f') c = (value - 32) * 5 / 9;
    if (unit === 'k') c = value - 273.15;
    const f = (c * 9 / 5) + 32;
    const k = c + 273.15;
    setHTML('tempResults', [
      resultCard('°C', `${fmt(c, 2)} °C`),
      resultCard('°F', `${fmt(f, 2)} °F`),
      resultCard('K', `${fmt(k, 2)} K`)
    ].join(''));
  }

  function pt100ResistanceFromTemp(t) {
    const A = 3.9083e-3, B = -5.775e-7, C = -4.183e-12;
    if (t >= 0) return 100 * (1 + A * t + B * t * t);
    return 100 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t);
  }
  function pt100TempFromResistance(r) {
    let low = -200, high = 850;
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const rm = pt100ResistanceFromTemp(mid);
      if (rm < r) low = mid; else high = mid;
    }
    return (low + high) / 2;
  }
  function updatePt100() {
    const mode = $('rMode').value;
    const value = valueOrNull('rValue');
    const label = $('rValueLabel');
    if (value === null) {
      setHTML('pt100Results', resultCard('Verifique os dados', 'Informe um valor válido.'));
      return;
    }
    if (mode === 'temp') {
      label.textContent = 'Temperatura (°C)';
      const r = pt100ResistanceFromTemp(value);
      setHTML('pt100Results', [
        resultCard('Resistência', `${fmt(r, 4)} Ω`),
        resultCard('Temperatura', `${fmt(value, 2)} °C`)
      ].join(''));
    } else {
      label.textContent = 'Resistência (Ω)';
      const t = pt100TempFromResistance(value);
      setHTML('pt100Results', [
        resultCard('Temperatura estimada', `${fmt(t, 2)} °C`),
        resultCard('Resistência', `${fmt(value, 4)} Ω`)
      ].join(''));
    }
  }

  const tcTables = {
    K: [[0, 0.000], [50, 2.039], [100, 4.095], [150, 6.138], [200, 8.138], [250, 10.153], [300, 12.209], [350, 14.293], [400, 16.397], [450, 18.516], [500, 20.644]],
    J: [[0, 0.000], [50, 2.585], [100, 5.268], [150, 8.010], [200, 10.779], [250, 13.553], [300, 16.327], [350, 19.096], [400, 21.848], [450, 24.572], [500, 27.260]]
  };
  function interpTc(type, temp) {
    const table = tcTables[type];
    if (temp <= table[0][0]) return table[0][1];
    if (temp >= table[table.length - 1][0]) return table[table.length - 1][1];
    for (let i = 0; i < table.length - 1; i++) {
      const [t1, e1] = table[i], [t2, e2] = table[i + 1];
      if (temp >= t1 && temp <= t2) return e1 + ((temp - t1) / (t2 - t1)) * (e2 - e1);
    }
    return 0;
  }
  function updateTc() {
    const type = $('tcType').value;
    const hot = valueOrNull('tcHot');
    const cold = valueOrNull('tcCold');
    if (hot === null || cold === null) {
      setHTML('tcResults', resultCard('Verifique os dados', 'Informe as temperaturas das juntas.'));
      return;
    }
    const emfHot = interpTc(type, hot), emfCold = interpTc(type, cold), emfNet = emfHot - emfCold;
    setHTML('tcResults', [
      resultCard('EMF junta quente', `${fmt(emfHot, 3)} mV`),
      resultCard('EMF junta fria', `${fmt(emfCold, 3)} mV`),
      resultCard('EMF resultante', `${fmt(emfNet, 3)} mV`)
    ].join(''));
  }

  function signalConfig(type) {
    if (type === 'ma') return { min: 4, max: 20, unit: 'mA', label: 'Corrente medida (mA)', help: 'Faixa nominal: 4 a 20 mA' };
    if (type === 'ma0') return { min: 0, max: 20, unit: 'mA', label: 'Corrente medida (mA)', help: 'Faixa nominal: 0 a 20 mA' };
    if (type === 'volt5') return { min: 0, max: 5, unit: 'V', label: 'Tensão medida (V)', help: 'Faixa nominal: 0 a 5 V' };
    return { min: 0, max: 10, unit: 'V', label: 'Tensão medida (V)', help: 'Faixa nominal: 0 a 10 V' };
  }
  function updateSignalLabels() {
    const type = $('sType').value;
    const cfg = signalConfig(type);
    $('sSignalLabel').textContent = cfg.label;
    $('sSignalHelp').textContent = cfg.help;
  }
  function updateSignal() {
    updateSignalLabels();
    const cfg = signalConfig($('sType').value);
    const lrv = valueOrNull('sLrv');
    const urv = valueOrNull('sUrv');
    const signal = valueOrNull('sSignal');
    const processWanted = valueOrNull('sProcess');
    const unit = ($('sUnit').value || 'unidade').trim();
    if ([lrv, urv, signal, processWanted].some(v => v === null)) {
      $('sPv').textContent = '—'; $('sStatus').textContent = 'Informe todos os valores.'; $('sStatus').style.color = 'var(--danger)';
      $('sPercent').textContent = '—'; $('sInputEcho').textContent = '—'; $('sSpan').textContent = '—'; $('sReverse').textContent = '—'; $('sScaleText').textContent = '—'; $('sBar').style.width = '0%';
      return;
    }
    const span = urv - lrv;
    if (!(span > 0)) {
      $('sPv').textContent = '—'; $('sStatus').textContent = 'Verifique a faixa: URV deve superar LRV.'; $('sStatus').style.color = 'var(--danger)';
      $('sPercent').textContent = '—'; $('sInputEcho').textContent = '—'; $('sSpan').textContent = '—'; $('sReverse').textContent = '—'; $('sScaleText').textContent = '—'; $('sBar').style.width = '0%';
      return;
    }
    const percent = ((signal - cfg.min) / (cfg.max - cfg.min)) * 100;
    const pv = lrv + ((signal - cfg.min) / (cfg.max - cfg.min)) * span;
    const reverse = cfg.min + ((processWanted - lrv) / span) * (cfg.max - cfg.min);
    const within = signal >= cfg.min && signal <= cfg.max;
    $('sPv').textContent = fmt(pv, 2);
    $('sPvUnit').textContent = unit;
    $('sStatus').textContent = within ? 'Dentro da faixa nominal' : 'Fora da faixa nominal';
    $('sStatus').style.color = within ? 'var(--green)' : 'var(--danger)';
    $('sPercent').textContent = `${fmt(percent, 2)}%`;
    $('sInputEcho').textContent = `${fmt(signal, 2)} ${cfg.unit}`;
    $('sSpan').textContent = fmt(span, 2);
    $('sReverse').textContent = `${fmt(reverse, 2)} ${cfg.unit}`;
    $('sScaleText').textContent = `${fmt(percent, 2)}%`;
    $('sBar').style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  const powerWatts = { w: 1, kw: 1000, mw: 1e6, gw: 1e9, hp: 745.6998715822702, cv: 735.49875, btuh: 0.2930710701722222, kcalh: 1.163 };
  const powerLabels = { w: 'W', kw: 'kW', mw: 'MW', gw: 'GW', hp: 'hp', cv: 'cv', btuh: 'BTU/h', kcalh: 'kcal/h', kva: 'kVA' };
  function updatePower() {
    const from = $('powerUnit').value;
    const to = $('powerTarget').value;
    const isKva = from === 'kva' || to === 'kva';
    $('powerPfField').hidden = !isKva;
    const value = valueOrNull('powerValue');
    const pf = valueOrNull('powerPf');
    if (value === null || (isKva && (pf === null || pf <= 0 || pf > 1))) {
      setHTML('powerResults', resultCard('Verificação', 'Informe potência e fator de potência válidos.'));
      $('powerNotice').textContent = 'O fator de potência deve estar acima de 0 e até 1.';
      return;
    }
    const watts = from === 'kva' ? value * 1000 * pf : value * powerWatts[from];
    const out = to === 'kva' ? watts / (1000 * pf) : watts / powerWatts[to];
    const digits = Math.abs(out) >= 100000 ? 1 : Math.abs(out) < .001 && out !== 0 ? 8 : 4;
    setHTML('powerResults', resultCard(powerLabels[to], `${fmt(out, digits)} ${powerLabels[to]}`));
    $('powerNotice').textContent = isKva ? `Conversão entre potência ativa e aparente considerando FP ${fmt(pf, 3)}.` : 'Conversão entre unidades de potência ativa.';
  }
  function swapPower() {
    const oldFrom = $('powerUnit').value;
    $('powerUnit').value = $('powerTarget').value;
    $('powerTarget').value = oldFrom;
    updatePower();
  }


  function installationTitle(mode) {
    return mode === 'wet' ? 'Vaso fechado · Perna molhada' : mode === 'dry' ? 'Vaso fechado · Perna seca' : 'Tanque aberto / referência atmosférica';
  }

  // Desenhos de referência: separam o tanque dos resultados para nunca haver sobreposição.
  function tankSvg(mode) {
    const closed = mode !== 'open';
    const wet = mode === 'wet';
    const vessel = closed
      ? '<rect x="78" y="28" width="230" height="180" rx="22" fill="#f8fbff" stroke="#597187" stroke-width="4"/>'
      : '<path d="M78 28 V208 H308 V28" stroke="#597187" stroke-width="4" fill="none"/>';
    const liquid = '<path d="M82 104 H304 V203 H82 Z" fill="#a6d8f2" opacity=".85"/><path d="M82 104 H304" stroke="#287ab3" stroke-width="2" stroke-dasharray="7 5"/>';
    const high = '<path d="M78 185 H50 V248 H153" fill="none" stroke="#dd792b" stroke-width="6" stroke-linejoin="round"/>';
    const low = wet
      ? '<path d="M308 49 H350 V248 H234" fill="none" stroke="#1e78b6" stroke-width="6"/>'
      : closed
      ? '<path d="M308 49 H350 V248 H234" fill="none" stroke="#1e78b6" stroke-width="6" stroke-dasharray="8 6"/>'
      : '<path d="M234 248 H318" fill="none" stroke="#1e78b6" stroke-width="6" stroke-dasharray="8 6"/>';
    return `<svg viewBox="0 0 410 305" role="img" aria-label="${installationTitle(mode)}">
      ${vessel}${liquid}${high}${low}
      <rect x="154" y="224" width="80" height="56" rx="11" fill="#e5eef9" stroke="#163a5e" stroke-width="3"/>
      <circle cx="194" cy="250" r="17" fill="#fff" stroke="#163a5e" stroke-width="2"/>
      <text x="194" y="255" text-anchor="middle" font-size="13" font-weight="700" fill="#163a5e">DP</text>
      <text x="12" y="179" fill="#a85c1b" font-size="15" font-weight="700">HP</text>
      <text x="353" y="179" fill="#1a659d" font-size="15" font-weight="700">LP</text>
      <text x="198" y="94" fill="#144c75" font-size="13" text-anchor="middle" font-weight="700">100% · URV</text>
      <text x="198" y="180" fill="#144c75" font-size="13" text-anchor="middle" font-weight="700">0% · LRV</text>
      <text x="194" y="295" fill="#597187" font-size="12" text-anchor="middle">Transmissor diferencial</text>
      ${wet ? '<text x="308" y="17" font-size="11" fill="#287ab3">LP molhada</text>' : ''}
    </svg>`;
  }

  function diagramFact(label, value, cssClass = '') {
    return `<div class="diagram-fact ${cssClass}"><span class="df-label">${label}</span><strong>${value}</strong></div>`;
  }

  function rangeDiagram(mode, lrv, urv, density) {
    return `<div class="tech-diagram">
      ${tankSvg(mode)}
      <div class="diagram-facts">
        ${diagramFact('100% · URV sem densidade', `${fmt(urv, 3)} mmH₂O`)}
        ${diagramFact('0% · LRV sem densidade', `${fmt(lrv, 3)} mmH₂O`)}
        ${diagramFact('100% · URV com densidade', `${fmt(urv*density, 3)} mmH₂O`, 'muted')}
        ${diagramFact('0% · LRV com densidade', `${fmt(lrv*density, 3)} mmH₂O`, 'muted')}
        <p class="diagram-caption">${installationTitle(mode)}. Esquema conceitual, sem escala.</p>
      </div>
    </div>`;
  }

  function hlDiagram(mode, dp0, dp100, density) {
    return `<div class="tech-diagram">
      ${tankSvg(mode)}
      <div class="diagram-facts">
        ${diagramFact('100% · URV (H − L)', `${fmt(dp100, 3)} mmH₂O`)}
        ${diagramFact('0% · LRV (H − L)', `${fmt(dp0, 3)} mmH₂O`)}
        ${diagramFact('Span sem densidade', `${fmt(dp100-dp0, 3)} mmH₂O`)}
        ${diagramFact('Span com densidade', `${fmt((dp100-dp0)*density, 3)} mmH₂O`, 'muted')}
        <p class="diagram-caption">${installationTitle(mode)}. Valores do critério H e L.</p>
      </div>
    </div>`;
  }

  function updateRange() {
    const mode = $('rangeMode').value;
    const min = valueOrNull('rangeMin');
    const max = valueOrNull('rangeMax');
    const density = valueOrNull('rangeRho');

    if ([min, max, density].some(v => v === null)) {
      $('rangeDiagram').innerHTML = rangeDiagram(mode, 0, 0, 1);
      setHTML('rangeResults', resultCard('Verificação', 'Informe LRV, URV e densidade.'));
      setHTML('rangeChecks', '');
      $('rangeNotice').textContent = 'Complete os campos para gerar a faixa.';
      return;
    }
    if (max <= min || density <= 0) {
      $('rangeDiagram').innerHTML = rangeDiagram(mode, min || 0, max || 0, density || 1);
      setHTML('rangeResults', resultCard('Verificação', 'URV deve ser maior que LRV e a densidade deve ser positiva.'));
      setHTML('rangeChecks', '');
      $('rangeNotice').textContent = 'Confira a ordem da faixa e a densidade aplicada.';
      return;
    }

    const span = max - min;
    const minD = min * density;
    const maxD = max * density;
    const spanD = span * density;

    $('rangeDiagram').innerHTML = rangeDiagram(mode, min, max, density);
    setHTML('rangeResults', [
      resultCard('LRV · 0% (sem densidade)', `${fmt(min, 3)} mmH₂O`),
      resultCard('URV · 100% (sem densidade)', `${fmt(max, 3)} mmH₂O`),
      resultCard('Span (sem densidade)', `${fmt(span, 3)} mmH₂O`),
      resultCard('LRV · 0% (com densidade)', `${fmt(minD, 3)} mmH₂O`),
      resultCard('URV · 100% (com densidade)', `${fmt(maxD, 3)} mmH₂O`),
      resultCard('Span (com densidade)', `${fmt(spanD, 3)} mmH₂O`)
    ].join(''));
    setHTML('rangeChecks', [
      resultCard('Tipo de instalação', installationTitle(mode)),
      resultCard('Densidade aplicada', `${fmt(density, 3)}`),
      resultCard('Tipo de zero', minD < -1e-6 ? 'Zero elevado (LRV negativo)' : minD > 1e-6 ? 'Zero suprimido (LRV positivo)' : 'Zero normal'),
      resultCard('Orientação diferencial', 'HP − LP')
    ].join(''));
    $('rangeNotice').textContent = 'Valores apresentados em mmH₂O, conforme solicitado. O tipo de instalação altera o esquema ilustrativo para facilitar a interpretação do usuário.';
  }

  function updateHLRange() {
    const h100 = valueOrNull('hlH100');
    const l100 = valueOrNull('hlL100');
    const h0 = valueOrNull('hlH0');
    const l0 = valueOrNull('hlL0');
    const density = valueOrNull('hlDensity');
    const mode = $('rangeMode').value;
    if ([h100, l100, h0, l0, density].some(v => v === null)) {
      $('hlR100').textContent = '—';
      $('hlR0').textContent = '—';
      $('hlDiagram').innerHTML = hlDiagram(mode, 0, 0, 1);
      setHTML('hlSummary', resultCard('Verificação', 'Informe H, L e densidade.'));
      return;
    }
    const dp100 = h100 - l100;
    const dp0 = h0 - l0;
    const span = dp100 - dp0;
    const dp100d = dp100 * density;
    const dp0d = dp0 * density;
    const spand = span * density;
    $('hlR100').textContent = fmt(dp100, 3);
    $('hlR0').textContent = fmt(dp0, 3);
    $('hlDiagram').innerHTML = hlDiagram(mode, dp0, dp100, density);
    setHTML('hlSummary', [
      resultCard('URV sem densidade', `${fmt(dp100, 3)} mmH₂O`),
      resultCard('LRV sem densidade', `${fmt(dp0, 3)} mmH₂O`),
      resultCard('Span sem densidade', `${fmt(span, 3)} mmH₂O`),
      resultCard('URV com densidade', `${fmt(dp100d, 3)} mmH₂O`),
      resultCard('LRV com densidade', `${fmt(dp0d, 3)} mmH₂O`),
      resultCard('Span com densidade', `${fmt(spand, 3)} mmH₂O`)
    ].join(''));
  }

  function updateDeviceOutput() {
    const lrv = valueOrNull('deviceLrv');
    const urv = valueOrNull('deviceUrv');
    const unit = $('deviceUnit').value;
    if (lrv === null || urv === null) {
      setHTML('deviceOutputResults', resultCard('Preenchimento necessário', 'Informe os dois limites da faixa.'));
      $('deviceOutputNotice').textContent = 'Preencha LRV e URV para visualizar o span.';
      return;
    }
    const span = urv - lrv;
    setHTML('deviceOutputResults', [
      resultCard('LRV · 0%', `${fmt(lrv, 3)} ${unit}`),
      resultCard('URV · 100%', `${fmt(urv, 3)} ${unit}`),
      resultCard('Span da saída', `${fmt(span, 3)} ${unit}`)
    ].join(''));
    $('deviceOutputNotice').textContent = span > 0
      ? 'Faixa informada em ' + unit + '. Se a unidade não for de pressão, não representa uma conversão do cálculo hidrostático.'
      : 'Verifique a configuração: URV deve ser maior que LRV para uma faixa ascendente.';
  }

  function bindInputs(ids, fn) {
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    });
  }

  bindInputs(['pValue', 'pUnit', 'pTarget'], updatePressure);
  bindInputs(['metricValue', 'metricUnit', 'metricTarget'], updateMetric);
  bindInputs(['fValue', 'fUnit'], updateFlow);
  bindInputs(['meterDiameter'], updateMeterInstall);
  bindInputs(['oD', 'od', 'odp', 'orho', 'ocd'], updateOrifice);
  bindInputs(['tValue', 'tUnit'], updateTemp);
  bindInputs(['rMode', 'rValue'], updatePt100);
  bindInputs(['tcType', 'tcHot', 'tcCold'], updateTc);
  bindInputs(['sLrv', 'sUrv', 'sType', 'sUnit', 'sSignal', 'sProcess'], updateSignal);
  bindInputs(['powerValue', 'powerUnit', 'powerTarget', 'powerPf'], updatePower);
  bindInputs(['rangeMode', 'rangeMin', 'rangeMax', 'rangeRho'], () => { updateRange(); updateHLRange(); });
  bindInputs(['hlH100', 'hlL100', 'hlH0', 'hlL0', 'hlDensity'], updateHLRange);
  bindInputs(['deviceLrv', 'deviceUrv', 'deviceUnit'], updateDeviceOutput);

  $('powerSwap').addEventListener('click', swapPower);
  $('pExampleBtn').addEventListener('click', function () {
    $('pValue').value = '10';
    $('pUnit').value = 'bar';
    $('pTarget').value = 'kgf';
    updatePressure();
  });
  $('sExampleBtn').addEventListener('click', function () {
    $('sLrv').value = '0';
    $('sUrv').value = '100';
    $('sType').value = 'ma';
    $('sUnit').value = 'unidade';
    $('sSignal').value = '12';
    $('sProcess').value = '50';
    updateSignal();
  });
  $('sType').addEventListener('change', () => {
    const type = $('sType').value;
    $('sSignal').value = type === 'volt' ? '5' : type === 'volt5' ? '2.5' : type === 'ma0' ? '10' : '12';
    updateSignal();
  });

  // Relatório independente por módulo: abrir impressão permite salvar como PDF offline.
  function reportEscape(text) {
    return String(text ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function createReport() {
    const tab = document.querySelector('.tab.active');
    if (!tab) return;
    const panelId = tab.dataset.panel;
    const panel = $(panelId);
    const moduleName = tab.textContent.trim();
    const subtitle = tab.dataset.subtitle || moduleName;
    const sections = Array.from(panel.querySelectorAll('article.card'));
    const parts = [];
    sections.forEach((article) => {
      const title = article.querySelector('h2')?.textContent?.trim() || 'Dados do módulo';
      const rows = [];
      article.querySelectorAll('input,select').forEach((field) => {
        if (field.closest('[hidden]') || field.hidden || field.disabled) return;
        let label = article.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || field.id;
        let value = field.tagName === 'SELECT' ? field.selectedOptions[0]?.textContent?.trim() : field.value;
        if (!String(value ?? '').trim()) return;
        rows.push(`<tr><th>${reportEscape(label)}</th><td>${reportEscape(value)}</td></tr>`);
      });
      const outputs = [];
      article.querySelectorAll('.result-card,.mini-card,.highlight-card').forEach((r) => {
        const label = r.querySelector('span,.result-label')?.textContent?.trim();
        const value = r.querySelector('strong,.big-result')?.textContent?.trim();
        if (label && value) outputs.push(`<tr><th>${reportEscape(label)}</th><td>${reportEscape(value)}</td></tr>`);
      });
      if (!rows.length && !outputs.length && !article.querySelector('img')) return;
      let visuals = '';
      if (panelId === 'flow' || panelId === 'range') {
        visuals = Array.from(article.querySelectorAll('.tech-diagram, #meterInstallDiagram svg'))
          .map(node => `<div class="report-diagram">${node.outerHTML}</div>`).join('');
      }
      if (panelId === 'range' && article.querySelector('img')) {
        const img = article.querySelector('img');
        visuals += `<img class="report-image" src="${img.src}" alt="${reportEscape(img.alt)}">`;
      }
      parts.push(`<section class="report-section"><h2>${reportEscape(title)}</h2>
        ${rows.length ? `<h3>Parâmetros informados</h3><table>${rows.join('')}</table>` : ''}
        ${outputs.length ? `<h3>Resultados</h3><table>${outputs.join('')}</table>` : ''}
        ${visuals}</section>`);
    });
    // Módulo 07: incluir curva, tabela e ilustrações no relatório individual.
    if (panelId === 'parshall') {
      const chart = $('parshallCurve')?.outerHTML || '';
      const table = $('parshallTableBody')?.innerHTML || '';
      const fUnit = $('parshallOutputUnit')?.selectedOptions[0]?.textContent || 'm³/h';
      if (chart) parts.push(`<section class="report-section"><h2>Curva de altura × vazão</h2><div class="report-diagram">${chart}</div></section>`);
      if (table) parts.push(`<section class="report-section"><h2>Tabela de altura × vazão</h2><table>
        <thead><tr><th>Altura Hₐ (mm)</th><th>Vazão (${reportEscape(fUnit)})</th></tr></thead><tbody>${table}</tbody></table></section>`);
      const images = [
        ['Funcionamento da calha', 'parshall_funcionamento.webp'],
        ['Geometria e pontos de medição', 'parshall_dimensoes.jpg']
      ];
      const figures = images.map(([name,file])=>`<figure><img class="report-image" src="${new URL(file, document.baseURI).href}" alt="${reportEscape(name)}"><figcaption>${reportEscape(name)}</figcaption></figure>`).join('');
      parts.push(`<section class="report-section"><h2>Referências visuais</h2>${figures}</section>`);
    }
    // Tabela H/L: coleta e resultados da seção independente do artigo.
    if (panelId === 'range') {
      const fields = [['H em 100%', 'hlH100'], ['L em 100%', 'hlL100'], ['H em 0%', 'hlH0'], ['L em 0%', 'hlL0'], ['Densidade aplicada', 'hlDensity']];
      const rows = fields.map(([label,id]) => `<tr><th>${reportEscape(label)}</th><td>${reportEscape($(id).value)} ${id === 'hlDensity' ? '' : 'mmH₂O'}</td></tr>`).join('');
      const summary = Array.from($('hlSummary').querySelectorAll('.result-card')).map(e => `<tr><th>${reportEscape(e.querySelector('span')?.textContent || '')}</th><td>${reportEscape(e.querySelector('strong')?.textContent || '')}</td></tr>`).join('');
      parts.push(`<section class="report-section"><h2>Critério H e L</h2><h3>Dados de entrada</h3><table>${rows}</table>
      <h3>Resultados</h3><table>${summary}</table><div class="report-diagram">${$('hlDiagram').innerHTML}</div></section>`);
    }
    const generatedAt = new Date().toLocaleString('pt-BR');
    const report = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Relatório ${reportEscape(moduleName)} — Instrumentação PRO</title>
      <style>
        * { box-sizing:border-box; }body{font:14px Arial, sans-serif;color:#102b47;margin:0;background:#edf2f7;}
        .toolbar{background:#0f2d4f;color:#fff;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
        .toolbar button{background:#2784ce;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-weight:bold;cursor:pointer;}
        .paper{max-width:850px;margin:20px auto;padding:32px;background:#fff;box-shadow:0 5px 25px #0002;}
        header{padding:0 0 16px;border-bottom:3px solid #1566a1;}
        h1{font-size:26px;margin:5px 0 5px;}h2{font-size:17px;color:#123b60;margin:0 0 12px;}
        h3{font-size:12px;color:#5a7288;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 7px;}
        p{color:#526a81;line-height:1.6}.report-section{margin-top:22px;break-inside:avoid-page;}
        table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
        th,td{border:1px solid #d8e2eb;padding:8px 11px;text-align:left;vertical-align:top;}
        th{width:48%;font-weight:600;background:#f2f6fb;}td{font-weight:700;overflow-wrap:anywhere;}
        .report-diagram{margin:12px auto;max-width:720px;break-inside:avoid-page;}
        .report-diagram svg{width:100%;max-height:310px;display:block;}
        .tech-diagram{display:flex;gap:22px;align-items:center;border:1px solid #d4e0e9;border-radius:12px;padding:14px;}
        .tech-diagram svg{width:49%;flex-shrink:0;}
        .diagram-facts{flex:1;display:flex;flex-direction:column;gap:10px;}
        .diagram-fact{background:#f0f6fb;padding:8px 12px;border-radius:8px;}
        .df-label{font-size:11px;display:block;color:#58738b;margin-bottom:3px;}.diagram-fact strong{font-size:13px;display:block;}
        .diagram-caption{font-size:10px;color:#526a81;}
        .report-image{max-width:90%;max-height:370px;display:block;margin:10px auto;object-fit:contain;}
        footer{border-top:1px solid #d2dee7;padding-top:12px;margin-top:30px;font-size:11px;color:#546b80;}
        @page{size:A4;margin:15mm 13mm;}@media print{body{background:white;print-color-adjust:exact;-webkit-print-color-adjust:exact;}
          .toolbar{display:none}.paper{margin:0;max-width:none;padding:0;box-shadow:none;}.report-section{break-inside:auto;}}
      </style></head><body>
      <div class="toolbar"><span>Relatório em aba separada — feche esta aba para retornar ao aplicativo.</span><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
      <main class="paper"><header><small>INSTRUMENTAÇÃO PRO · RELATÓRIO TÉCNICO</small><h1>${reportEscape(subtitle)}</h1><div>Emitido em ${reportEscape(generatedAt)}</div></header>
      ${parts.join('')}
      <footer>Relatório gerado no dispositivo pelo Instrumentação PRO. Antes de utilizar em campo, confira os dados de processo, limites dos instrumentos e requisitos de instalação. Não contém equações.</footer>
      </main></body></html>`;
    // Um documento Blob possui URL fora do escopo da PWA e é aberto em aba separada.
    // A janela principal jamais é substituída pelo relatório.
    const reportFile = new Blob([report], { type: 'text/html;charset=utf-8' });
    const reportUrl = URL.createObjectURL(reportFile);
    const win = window.open(reportUrl, '_blank');
    if (!win) {
      URL.revokeObjectURL(reportUrl);
      alert('O navegador bloqueou a nova aba. Permita pop-ups para o Instrumentação PRO e tente novamente.');
      return;
    }
    try { win.focus(); } catch (_) {}
    // Evitar revogação imediata: a navegação da nova aba ainda pode estar carregando.
    // Os URLs temporários são descartados ao encerrar a sessão do aplicativo.
  }

  function initializeAppearance() {
    const select = $('themeSelect');
    let theme = 'light';
    try { theme = localStorage.getItem('instrumentacao-pro-theme') || 'light'; } catch (_) {}
    if (theme !== 'dark') theme = 'light';
    document.documentElement.dataset.theme = theme;
    select.value = theme;
    select.addEventListener('change', () => {
      document.documentElement.dataset.theme = select.value;
      try { localStorage.setItem('instrumentacao-pro-theme', select.value); } catch (_) {}
    });
  }
  initializeAppearance();
  $('reportBtn').addEventListener('click', createReport);

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $('installBtn');
    if (btn) btn.hidden = false;
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    $('installBtn').hidden = true;
  });

  function updateConnectionStatus() {
    const el = $('connection-status');
    if (!el) return;
    if (navigator.onLine) {
      el.textContent = 'Online';
      el.style.background = 'rgba(255,255,255,0.12)';
    } else {
      el.textContent = 'Offline';
      el.style.background = 'rgba(180, 111, 0, 0.28)';
    }
  }
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  updatePressure();
  updateMetric();
  updateFlow();
  updateMeterInstall();
  updateOrifice();
  updateTemp();
  updatePt100();
  updateTc();
  updateSignal();
  updatePower();
  updateRange();
  updateHLRange();
  updateDeviceOutput();
})();
