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

  function rangeDiagram(mode, lrv, urv, density) {
    const wet = mode === 'wet', closed = mode !== 'open';
    const top = closed ? '<rect x="65" y="32" width="225" height="190" rx="24" fill="#f8fafc" stroke="#64748b" stroke-width="3"/>' : '<path d="M65 32 V222 H290 V32" fill="none" stroke="#64748b" stroke-width="3"/>';
    const fluid = '<path d="M68 115 H287 V219 H68 Z" fill="#b5e1f8" opacity=".86"/><path d="M68 115 H287" stroke="#3184bf" stroke-width="2" stroke-dasharray="6 4"/>';
    const hp = '<path d="M65 205 H30 V260 H136" fill="none" stroke="#cb6a24" stroke-width="5" stroke-linejoin="round"/>';
    const lp = wet ? '<path d="M290 55 H328 V260 H220" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round"/>' : closed ? '<path d="M290 55 H328 V260 H220" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round" stroke-dasharray="8 6"/>' : '<path d="M220 260 H285" fill="none" stroke="#2074bc" stroke-width="5" stroke-dasharray="8 6"/>';
    const wetFill = wet ? '<path d="M328 56 V258" stroke="#9bdcf4" stroke-width="3"/>' : '';
    const title = installationTitle(mode);
    return `<svg viewBox="0 0 410 335" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
      <text x="18" y="18" font-size="14" font-weight="700" fill="#0f2d4f">${title}</text>
      ${top}${fluid}${hp}${lp}${wetFill}
      <rect x="137" y="244" width="83" height="58" rx="12" fill="#e2ebf7" stroke="#213f65" stroke-width="3"/>
      <circle cx="178.5" cy="273" r="16" fill="#fff" stroke="#213f65" stroke-width="2"/>
      <text x="166.5" y="278" font-size="13" font-weight="700" fill="#213f65">DP</text>
      <text x="108" y="109" font-size="12" font-weight="700" fill="#17629a">FAIXA</text>
      <text x="24" y="197" font-size="11" fill="#a45112">HP</text>
      <text x="332" y="197" font-size="11" fill="#2563a1">LP</text>
      <text x="18" y="96" font-size="11" fill="#0f2d4f">0% / LRV</text>
      <text x="18" y="112" font-size="13" font-weight="700" fill="#0f2d4f">${fmt(lrv, 3)} mmH₂O</text>
      <text x="18" y="132" font-size="10" fill="#64748b">sem densidade</text>
      <text x="18" y="155" font-size="11" fill="#0f2d4f">100% / URV</text>
      <text x="18" y="171" font-size="13" font-weight="700" fill="#0f2d4f">${fmt(urv, 3)} mmH₂O</text>
      <text x="18" y="191" font-size="10" fill="#64748b">sem densidade</text>
      <text x="236" y="95" font-size="11" fill="#0f2d4f">Com densidade</text>
      <text x="236" y="112" font-size="12" font-weight="700" fill="#0f2d4f">0% = ${fmt(lrv * density, 3)} mmH₂O</text>
      <text x="236" y="132" font-size="12" font-weight="700" fill="#0f2d4f">100% = ${fmt(urv * density, 3)} mmH₂O</text>
      ${wet ? '<text x="271" y="178" font-size="11" fill="#2563a1">Coluna molhada</text>' : ''}
      <text x="76" y="233" font-size="10" fill="#0f2d4f">Tomada inferior</text>
    </svg>`;
  }

  function hlDiagram(mode, dp0, dp100, density) {
    const wet = mode === 'wet', closed = mode !== 'open';
    const top = closed ? '<rect x="60" y="30" width="200" height="175" rx="22" fill="#f8fafc" stroke="#64748b" stroke-width="3"/>' : '<path d="M60 30 V205 H260 V30" fill="none" stroke="#64748b" stroke-width="3"/>';
    const fluid = '<path d="M63 112 H257 V202 H63 Z" fill="#b5e1f8" opacity=".86"/><path d="M63 112 H257" stroke="#3184bf" stroke-width="2" stroke-dasharray="6 4"/>';
    const hp = '<path d="M60 188 H26 V243 H128" fill="none" stroke="#cb6a24" stroke-width="5" stroke-linejoin="round"/>';
    const lp = wet ? '<path d="M260 52 H296 V243 H208" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round"/>' : closed ? '<path d="M260 52 H296 V243 H208" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round" stroke-dasharray="8 6"/>' : '<path d="M208 243 H275" fill="none" stroke="#2074bc" stroke-width="5" stroke-dasharray="8 6"/>';
    const title = installationTitle(mode);
    return `<svg viewBox="0 0 405 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Critério H e L - ${title}">
      <text x="16" y="18" font-size="14" font-weight="700" fill="#0f2d4f">Critério H e L · ${title}</text>
      ${top}${fluid}${hp}${lp}
      <rect x="129" y="226" width="79" height="55" rx="12" fill="#e2ebf7" stroke="#213f65" stroke-width="3"/>
      <text x="160" y="259" text-anchor="middle" font-size="13" font-weight="700" fill="#213f65">DP</text>
      <text x="16" y="80" font-size="11" fill="#0f2d4f">0% · LRV</text>
      <text x="16" y="98" font-size="13" font-weight="700" fill="#0f2d4f">${fmt(dp0, 3)} mmH₂O</text>
      <text x="16" y="116" font-size="10" fill="#64748b">com densidade: ${fmt(dp0 * density, 3)} mmH₂O</text>
      <text x="16" y="150" font-size="11" fill="#0f2d4f">100% · URV</text>
      <text x="16" y="168" font-size="13" font-weight="700" fill="#0f2d4f">${fmt(dp100, 3)} mmH₂O</text>
      <text x="16" y="186" font-size="10" fill="#64748b">com densidade: ${fmt(dp100 * density, 3)} mmH₂O</text>
      <text x="250" y="92" font-size="11" fill="#0f2d4f">Span sem densidade</text>
      <text x="250" y="110" font-size="13" font-weight="700" fill="#0f2d4f">${fmt(dp100 - dp0, 3)} mmH₂O</text>
      <text x="250" y="141" font-size="11" fill="#0f2d4f">Span com densidade</text>
      <text x="250" y="159" font-size="13" font-weight="700" fill="#0f2d4f">${fmt((dp100 - dp0) * density, 3)} mmH₂O</text>
      ${wet ? '<text x="272" y="194" font-size="11" fill="#2563a1">Coluna molhada</text>' : ''}
    </svg>`;
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
  bindInputs(['oD', 'od', 'odp', 'orho', 'ocd'], updateOrifice);
  bindInputs(['tValue', 'tUnit'], updateTemp);
  bindInputs(['rMode', 'rValue'], updatePt100);
  bindInputs(['tcType', 'tcHot', 'tcCold'], updateTc);
  bindInputs(['sLrv', 'sUrv', 'sType', 'sUnit', 'sSignal', 'sProcess'], updateSignal);
  bindInputs(['powerValue', 'powerUnit', 'powerTarget', 'powerPf'], updatePower);
  bindInputs(['rangeMode', 'rangeMin', 'rangeMax', 'rangeRho'], () => { updateRange(); updateHLRange(); });
  bindInputs(['hlH100', 'hlL100', 'hlH0', 'hlL0', 'hlDensity'], updateHLRange);

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
  updateOrifice();
  updateTemp();
  updatePt100();
  updateTc();
  updateSignal();
  updatePower();
  updateRange();
  updateHLRange();
})();
