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

  function rangeDiagram(mode) {
    const wet = mode === 'wet', closed = mode !== 'open';
    const top = closed ? '<rect x="50" y="22" width="255" height="215" rx="24" fill="#f8fafc" stroke="#64748b" stroke-width="3"/>' : '<path d="M50 22 V237 H305 V22" fill="none" stroke="#64748b" stroke-width="3"/>';
    const fluid = '<path d="M53 110 H302 V234 H53 Z" fill="#b5e1f8" opacity=".83"/><path d="M53 110 H302" stroke="#3184bf" stroke-width="2" stroke-dasharray="6 4"/>';
    const highLine = '<path d="M50 220 H25 V265 H137" fill="none" stroke="#cb6a24" stroke-width="5" stroke-linejoin="round"/>';
    const lowLine = wet ? '<path d="M305 48 H342 V279 H221" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round"/>' : closed ? '<path d="M305 48 H342 V265 H221" fill="none" stroke="#2074bc" stroke-width="5" stroke-linejoin="round" stroke-dasharray="8 6"/>' : '<path d="M221 265 H279" fill="none" stroke="#2074bc" stroke-width="5" stroke-dasharray="8 6"/>';
    const wetFill = wet ? '<path d="M342 50 V277" stroke="#93d5ed" stroke-width="3"/>' : '';
    const title = wet ? 'Vaso fechado · Perna molhada' : closed ? 'Vaso fechado · Perna seca' : 'Tanque aberto';
    return `<svg viewBox="0 0 400 335" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
       <text x="18" y="16" font-size="14" font-weight="700" fill="#0f2d4f">${title}</text>
       ${top}${fluid}${highLine}${lowLine}${wetFill}
       <rect x="138" y="248" width="82" height="59" rx="12" fill="#e2ebf7" stroke="#213f65" stroke-width="3"/>
       <circle cx="179" cy="277" r="16" fill="#fff" stroke="#213f65" stroke-width="2"/>
       <text x="167" y="282" font-size="13" font-weight="700" fill="#213f65">DP</text>
       <text x="133" y="324" font-size="11" fill="#213f65">HP</text><text x="216" y="324" font-size="11" fill="#213f65">LP</text>
       <text x="65" y="102" font-size="12" fill="#17629a">NÍVEL</text>
       <text x="64" y="230" font-size="11" fill="#0f2d4f">Tomada inferior</text>
       ${wet ? '<text x="274" y="187" font-size="11" fill="#205d8b">Coluna LP</text>' : ''}
       <text x="10" y="294" font-size="10" fill="#a45112">Alta (HP)</text>
       <text x="285" y="294" font-size="10" fill="#2563a1">Baixa (LP)</text>
     </svg>`;
  }
  function paToUnit(pa, unit) {
    return pa / (pressureToBar[unit] * 100000);
  }
  function updateRange() {
    const mode = $('rangeMode').value;
    document.querySelectorAll('.range-wet-only').forEach(el => el.hidden = mode !== 'wet');
    $('rangeDiagram').innerHTML = rangeDiagram(mode);

    const min = valueOrNull('rangeMin'), max = valueOrNull('rangeMax'), rho = valueOrNull('rangeRho'), drop = valueOrNull('rangeDrop');
    const wetHeight = valueOrNull('rangeWetHeight'), wetRho = valueOrNull('rangeWetRho');
    const unit = $('rangeOutputUnit').value;
    if ([min, max, rho, drop].some(v => v === null) || (mode === 'wet' && [wetHeight, wetRho].some(v => v === null))) {
      setHTML('rangeResults', resultCard('Verificação', 'Informe todos os valores necessários.'));
      setHTML('rangeChecks', '');
      $('rangeNotice').textContent = 'Complete os campos para gerar a faixa.';
      return;
    }
    if (min < 0 || max <= min || rho <= 0 || (mode === 'wet' && (wetHeight < 0 || wetRho <= 0))) {
      setHTML('rangeResults', resultCard('Verificação', 'Confira alturas, densidades e ordem dos níveis.'));
      setHTML('rangeChecks', '');
      $('rangeNotice').textContent = 'Nível máximo deve superar o mínimo. Densidades devem ser positivas.';
      return;
    }
    const g = 9.80665;
    const offset = mode === 'wet' ? wetRho * g * wetHeight : 0;
    const lrvPa = (rho * g * (min + drop)) - offset;
    const urvPa = (rho * g * (max + drop)) - offset;
    const spanPa = urvPa - lrvPa;
    const low = paToUnit(lrvPa, unit), high = paToUnit(urvPa, unit), span = paToUnit(spanPa, unit);
    const digit = unit === 'mmh2o' ? 1 : 4;
    setHTML('rangeResults', [
      resultCard('LRV · 0% (4 mA)', `${fmt(low, digit)} ${pressureLabels[unit]}`),
      resultCard('URV · 100% (20 mA)', `${fmt(high, digit)} ${pressureLabels[unit]}`),
      resultCard('Span', `${fmt(span, digit)} ${pressureLabels[unit]}`)
    ].join(''));
    setHTML('rangeChecks', [
      resultCard('Altura útil de medição', `${fmt(max - min, 3)} m`),
      resultCard('Densidade do processo', `${fmt(rho, 1)} kg/m³`),
      resultCard('Tipo de zero', low < -1e-6 ? 'Zero elevado (LRV negativo)' : low > 1e-6 ? 'Zero suprimido (LRV positivo)' : 'Zero normal'),
      resultCard('Orientação diferencial', 'HP − LP')
    ].join(''));
    $('rangeNotice').textContent = 'Valores calculados para o arranjo selecionado; pressão diferencial HP − LP. Verifique a instalação real antes de configurar o instrumento.';
  }

  function updateHLRange() {
    const h100 = valueOrNull('hlH100');
    const l100 = valueOrNull('hlL100');
    const h0 = valueOrNull('hlH0');
    const l0 = valueOrNull('hlL0');
    const density = valueOrNull('hlDensity');
    if ([h100, l100, h0, l0, density].some(v => v === null)) {
      $('hlR100').textContent = '—';
      $('hlR0').textContent = '—';
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
  bindInputs(['rangeMode', 'rangeMin', 'rangeMax', 'rangeRho', 'rangeDrop', 'rangeWetHeight', 'rangeWetRho', 'rangeOutputUnit'], updateRange);
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
