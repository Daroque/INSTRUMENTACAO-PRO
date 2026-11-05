(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmt = (n, dec = 2) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const safeNum = (value) => {
    const n = parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  const resultCard = (label, value) => `<div class="result-card"><span>${label}</span><strong>${value}</strong></div>`;

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
    const raw = $('pValue').value.trim();
    const unit = $('pUnit').value;
    const target = $('pTarget').value;
    if (!raw || !Number.isFinite(Number(raw))) {
      setHTML('pressureResults', resultCard('Verifique os dados', 'Informe um valor válido.'));
      return;
    }
    const bar = Number(raw) * pressureToBar[unit];
    const out = bar / pressureToBar[target];
    const dec = Math.abs(out) >= 100000 ? 0 : Math.abs(out) < 0.001 && out !== 0 ? 8 : 4;
    setHTML('pressureResults', resultCard(pressureLabels[target], `${fmt(out, dec)} ${pressureLabels[target]}`));
  }

  const flowToM3s = {
    m3s: 1,
    m3h: 1 / 3600,
    lh: 0.001 / 3600,
    ls: 0.001,
    lmin: 0.001 / 60
  };
  const flowLabels = { m3s: 'm³/s', m3h: 'm³/h', lh: 'L/h', ls: 'L/s', lmin: 'L/min' };

  function updateFlow() {
    const value = safeNum($('fValue').value);
    const unit = $('fUnit').value;
    const m3s = value * flowToM3s[unit];
    const results = Object.keys(flowToM3s).map((key) => {
      const out = m3s / flowToM3s[key];
      const dec = key === 'm3s' ? 6 : 3;
      return resultCard(flowLabels[key], `${fmt(out, dec)} ${flowLabels[key]}`);
    }).join('');
    setHTML('flowResults', results);
  }

  function updateOrifice() {
    const D = safeNum($('oD').value) / 1000;
    const d = safeNum($('od').value) / 1000;
    const dp = safeNum($('odp').value) * 1000;
    const rho = safeNum($('orho').value);
    const cd = safeNum($('ocd').value);
    if (D <= 0 || d <= 0 || d >= D || dp < 0 || rho <= 0 || cd <= 0) {
      setHTML('orificeResults', resultCard('Aviso', 'Verifique os dados informados'));
      return;
    }
    const beta = d / D;
    const area = Math.PI * d * d / 4;
    const q = cd * area * Math.sqrt((2 * dp) / (rho * (1 - Math.pow(beta, 4))));
    const qh = q * 3600;
    const vPipe = q / (Math.PI * D * D / 4);
    const vOrifice = q / area;
    const reynoldsHint = (rho * vPipe * D) / 0.001;
    const html = [
      resultCard('Vazão estimada', `${fmt(qh, 3)} m³/h`),
      resultCard('Vazão estimada', `${fmt(q, 6)} m³/s`),
      resultCard('Beta (d/D)', `${fmt(beta, 4)}`),
      resultCard('Velocidade na tubulação', `${fmt(vPipe, 3)} m/s`),
      resultCard('Velocidade no orifício', `${fmt(vOrifice, 3)} m/s`),
      resultCard('Reynolds aproximado*', `${fmt(reynoldsHint, 0)}`)
    ].join('');
    setHTML('orificeResults', html);
  }

  function updateTemp() {
    const value = safeNum($('tValue').value);
    const unit = $('tUnit').value;
    let c = value;
    if (unit === 'f') c = (value - 32) * 5 / 9;
    if (unit === 'k') c = value - 273.15;
    const f = (c * 9 / 5) + 32;
    const k = c + 273.15;
    const html = [
      resultCard('°C', `${fmt(c, 2)} °C`),
      resultCard('°F', `${fmt(f, 2)} °F`),
      resultCard('K', `${fmt(k, 2)} K`)
    ].join('');
    setHTML('tempResults', html);
  }

  function pt100ResistanceFromTemp(t) {
    const A = 3.9083e-3;
    const B = -5.775e-7;
    const C = -4.183e-12;
    if (t >= 0) return 100 * (1 + A * t + B * t * t);
    return 100 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t);
  }
  function pt100TempFromResistance(r) {
    let low = -200;
    let high = 850;
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const rm = pt100ResistanceFromTemp(mid);
      if (rm < r) low = mid; else high = mid;
    }
    return (low + high) / 2;
  }

  function updatePt100() {
    const mode = $('rMode').value;
    const value = safeNum($('rValue').value);
    const label = $('rValueLabel');
    if (mode === 'temp') {
      label.textContent = 'Temperatura (°C)';
      const r = pt100ResistanceFromTemp(value);
      const html = [
        resultCard('Resistência', `${fmt(r, 4)} Ω`),
        resultCard('Temperatura', `${fmt(value, 2)} °C`)
      ].join('');
      setHTML('pt100Results', html);
    } else {
      label.textContent = 'Resistência (Ω)';
      const t = pt100TempFromResistance(value);
      const html = [
        resultCard('Temperatura estimada', `${fmt(t, 2)} °C`),
        resultCard('Resistência', `${fmt(value, 4)} Ω`)
      ].join('');
      setHTML('pt100Results', html);
    }
  }

  const tcTables = {
    K: [
      [0, 0.000], [50, 2.039], [100, 4.095], [150, 6.138], [200, 8.138], [250, 10.153], [300, 12.209], [350, 14.293], [400, 16.397], [450, 18.516], [500, 20.644]
    ],
    J: [
      [0, 0.000], [50, 2.585], [100, 5.268], [150, 8.010], [200, 10.779], [250, 13.553], [300, 16.327], [350, 19.096], [400, 21.848], [450, 24.572], [500, 27.260]
    ]
  };

  function interpTc(type, temp) {
    const table = tcTables[type];
    if (temp <= table[0][0]) return table[0][1];
    if (temp >= table[table.length - 1][0]) return table[table.length - 1][1];
    for (let i = 0; i < table.length - 1; i++) {
      const [t1, e1] = table[i];
      const [t2, e2] = table[i + 1];
      if (temp >= t1 && temp <= t2) {
        const frac = (temp - t1) / (t2 - t1);
        return e1 + frac * (e2 - e1);
      }
    }
    return 0;
  }

  function updateTc() {
    const type = $('tcType').value;
    const hot = safeNum($('tcHot').value);
    const cold = safeNum($('tcCold').value);
    const emfHot = interpTc(type, hot);
    const emfCold = interpTc(type, cold);
    const emfNet = emfHot - emfCold;
    const html = [
      resultCard('EMF junta quente', `${fmt(emfHot, 3)} mV`),
      resultCard('EMF junta fria', `${fmt(emfCold, 3)} mV`),
      resultCard('EMF resultante', `${fmt(emfNet, 3)} mV`)
    ].join('');
    setHTML('tcResults', html);
  }

  function updateSignalLabels() {
    const type = $('sType').value;
    const signalLabel = $('sSignalLabel');
    const signalHelp = $('sSignalHelp');
    if (type === 'ma' || type === 'ma0') {
      signalLabel.textContent = 'Corrente medida (mA)';
      signalHelp.textContent = type === 'ma' ? 'Faixa nominal: 4 a 20 mA' : 'Faixa nominal: 0 a 20 mA';
    } else {
      signalLabel.textContent = 'Tensão medida (V)';
      signalHelp.textContent = 'Faixa nominal: 0 a 10 V';
    }
  }

  function updateSignal() {
    updateSignalLabels();
    const type = $('sType').value;
    const lrv = safeNum($('sLrv').value);
    const urv = safeNum($('sUrv').value);
    const signal = safeNum($('sSignal').value);
    const processWanted = safeNum($('sProcess').value);
    const unit = ($('sUnit').value || 'unidade').trim();
    const min = type === 'ma' ? 4 : 0;
    const max = (type === 'ma' || type === 'ma0') ? 20 : 10;
    const span = urv - lrv;
    if (span <= 0 || !Number.isFinite(span) || !Number.isFinite(signal) || !Number.isFinite(processWanted)) {
      $('sPv').textContent = '—'; $('sPercent').textContent = '—';
      $('sSpan').textContent = '—'; $('sReverse').textContent = '—';
      $('sStatus').textContent = 'Verifique a faixa: URV deve superar LRV.';
      $('sBar').style.width = '0%'; return;
    }
    let percent = ((signal - min) / (max - min)) * 100;
    let pv = lrv + ((signal - min) / (max - min)) * span;
    let reverse = min + ((processWanted - lrv) / (span || 1)) * (max - min);
    const within = signal >= min && signal <= max;
    $('sPv').textContent = fmt(pv, 2);
    $('sPvUnit').textContent = unit;
    $('sStatus').textContent = within ? 'Dentro da faixa nominal' : 'Fora da faixa nominal';
    $('sStatus').style.color = within ? 'var(--green)' : 'var(--danger)';
    $('sPercent').textContent = `${fmt(percent, 2)}%`;
    $('sInputEcho').textContent = `${fmt(signal, 2)} ${type === 'volt' ? 'V' : 'mA'}`;
    $('sSpan').textContent = fmt(span, 2);
    $('sReverse').textContent = `${fmt(reverse, 2)} ${type === 'volt' ? 'V' : 'mA'}`;
    $('sScaleText').textContent = `${fmt(percent, 2)}%`;
    const barPct = Math.max(0, Math.min(100, percent));
    $('sBar').style.width = `${barPct}%`;
  }


  const powerWatts = {
    w: 1, kw: 1000, mw: 1e6, gw: 1e9, hp: 745.6998715822702,
    cv: 735.49875, btuh: 0.2930710701722222, kcalh: 1.163
  };
  const powerLabels = {
    w: 'W', kw: 'kW', mw: 'MW', gw: 'GW', hp: 'hp', cv: 'cv',
    btuh: 'BTU/h', kcalh: 'kcal/h', kva: 'kVA'
  };
  function updatePower() {
    const from = $('powerUnit').value;
    const to = $('powerTarget').value;
    const isKva = from === 'kva' || to === 'kva';
    $('powerPfField').hidden = !isKva;
    const raw = $('powerValue').value.trim();
    const pfRaw = $('powerPf').value.trim();
    const pf = Number(pfRaw);
    if (!raw || !Number.isFinite(Number(raw)) ||
        (isKva && (!pfRaw || !Number.isFinite(pf) || pf <= 0 || pf > 1))) {
      setHTML('powerResults', resultCard('Verificação', 'Informe potência e fator de potência válidos.'));
      $('powerNotice').textContent = 'O fator de potência deve estar acima de 0 e até 1.';
      return;
    }
    const v = Number(raw);
    const watts = from === 'kva' ? v * 1000 * pf : v * powerWatts[from];
    const out = to === 'kva' ? watts / (1000 * pf) : watts / powerWatts[to];
    const digits = Math.abs(out) >= 100000 ? 1 : Math.abs(out) < .001 && out !== 0 ? 8 : 4;
    setHTML('powerResults', resultCard(powerLabels[to], `${fmt(out,digits)} ${powerLabels[to]}`));
    $('powerNotice').textContent = isKva ? `Conversão entre potência ativa e aparente considerando FP ${fmt(pf,3)}.` : 'Conversão entre unidades de potência ativa.';
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
  function updateRange() {
    const mode = $('rangeMode').value;
    document.querySelectorAll('.range-wet-only').forEach(el => el.hidden = mode !== 'wet');
    $('rangeDiagram').innerHTML = rangeDiagram(mode);
    const required = ['rangeMin','rangeMax','rangeRho','rangeDrop',...(mode === 'wet' ? ['rangeWetHeight','rangeWetRho'] : [])];
    const vals = required.map(id => $(id).value.trim());
    const nums = vals.map(Number);
    const min = Number($('rangeMin').value), max = Number($('rangeMax').value);
    const rho = Number($('rangeRho').value), drop = Number($('rangeDrop').value);
    const wetHeight = Number($('rangeWetHeight').value), wetRho = Number($('rangeWetRho').value);
    const unit = $('rangeOutputUnit').value;
    if (vals.some(x=>x==='') || nums.some(x=>!Number.isFinite(x)) || min<0 || max<=min || rho<=0 ||
      (mode==='wet' && (wetHeight<0 || wetRho<=0))) {
      setHTML('rangeResults', resultCard('Verificação', 'Confira alturas, densidades e ordem dos níveis.'));
      setHTML('rangeChecks', '');
      $('rangeNotice').textContent = 'Nível máximo deve superar o mínimo. Densidades devem ser positivas.';
      return;
    }
    const g=9.80665;
    const offset = mode === 'wet' ? wetRho*g*wetHeight : 0;
    const lrvPa = (rho*g*(min+drop)) - offset;
    const urvPa = (rho*g*(max+drop)) - offset;
    const spanPa=urvPa-lrvPa;
    const conv = (p) => p/(pressureToBar[unit]*100000);
    const digit = unit==='mmh2o' ? 1 : 4;
    const low=conv(lrvPa), high=conv(urvPa), span=conv(spanPa);
    setHTML('rangeResults', [
      resultCard('LRV · 0% (4 mA)', `${fmt(low,digit)} ${pressureLabels[unit]}`),
      resultCard('URV · 100% (20 mA)', `${fmt(high,digit)} ${pressureLabels[unit]}`),
      resultCard('Span', `${fmt(span,digit)} ${pressureLabels[unit]}`)
    ].join(''));
    setHTML('rangeChecks', [
      resultCard('Altura útil de medição',`${fmt(max-min,3)} m`),
      resultCard('Densidade do processo',`${fmt(rho,1)} kg/m³`),
      resultCard('Tipo de zero', low < -1e-6 ? 'Zero elevado (LRV negativo)' : low > 1e-6 ? 'Zero suprimido (LRV positivo)' : 'Zero normal'),
      resultCard('Orientação diferencial', 'HP − LP')
    ].join(''));
    $('rangeNotice').textContent = 'Valores calculados para o arranjo selecionado; pressão diferencial HP − LP. Verifique a instalação real antes de configurar o instrumento.';
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
  bindInputs(['powerValue', 'powerUnit', 'powerTarget', 'powerPf'], updatePower);
  $('powerSwap').addEventListener('click', () => {
    const oldFrom = $('powerUnit').value;
    $('powerUnit').value = $('powerTarget').value;
    $('powerTarget').value = oldFrom;
    updatePower();
  });
  bindInputs(['rangeMode', 'rangeMin', 'rangeMax', 'rangeRho', 'rangeDrop', 'rangeWetHeight', 'rangeWetRho', 'rangeOutputUnit'], updateRange);
  bindInputs(['fValue', 'fUnit'], updateFlow);
  bindInputs(['oD', 'od', 'odp', 'orho', 'ocd'], updateOrifice);
  bindInputs(['tValue', 'tUnit'], updateTemp);
  bindInputs(['rMode', 'rValue'], updatePt100);
  bindInputs(['tcType', 'tcHot', 'tcCold'], updateTc);
  bindInputs(['sLrv', 'sUrv', 'sUnit', 'sSignal', 'sProcess'], updateSignal);
  $('sType').addEventListener('change', () => {
    $('sSignal').value = $('sType').value === 'volt' ? '5' : ($('sType').value === 'ma0' ? '10' : '12');
    updateSignal();
  });

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

  // PWA install
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

  // Online/offline status
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
  updatePower();
  updateRange();
  updateFlow();
  updateOrifice();
  updateTemp();
  updatePt100();
  updateTc();
  updateSignal();
})();
