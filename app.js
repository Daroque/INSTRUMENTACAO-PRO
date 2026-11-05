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
    mmhg: 0.00133322368
  };
  const pressureLabels = {
    bar: 'bar', psi: 'psi', kgf: 'kgf/cm²', kpa: 'kPa', mpa: 'MPa', pa: 'Pa', mca: 'mca', mmhg: 'mmHg'
  };

  function updatePressure() {
    const value = safeNum($('pValue').value);
    const unit = $('pUnit').value;
    const bar = value * pressureToBar[unit];
    const results = Object.keys(pressureToBar).map((key) => {
      const out = bar / pressureToBar[key];
      const dec = key === 'pa' ? 0 : key === 'mmhg' ? 1 : 4;
      return resultCard(pressureLabels[key], `${fmt(out, dec)} ${pressureLabels[key]}`);
    }).join('');
    setHTML('pressureResults', results);
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
    if (type === 'ma') {
      signalLabel.textContent = 'Corrente medida (mA)';
      signalHelp.textContent = 'Faixa nominal: 4 a 20 mA';
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
    const max = type === 'ma' ? 20 : 10;
    const span = urv - lrv;
    let percent = span === 0 ? 0 : ((signal - min) / (max - min)) * 100;
    let pv = lrv + ((signal - min) / (max - min)) * span;
    let reverse = min + ((processWanted - lrv) / (span || 1)) * (max - min);
    const within = signal >= min && signal <= max;
    $('sPv').textContent = fmt(pv, 2);
    $('sPvUnit').textContent = unit;
    $('sStatus').textContent = within ? 'Dentro da faixa nominal' : 'Fora da faixa nominal';
    $('sStatus').style.color = within ? 'var(--green)' : 'var(--danger)';
    $('sPercent').textContent = `${fmt(percent, 2)}%`;
    $('sInputEcho').textContent = `${fmt(signal, 2)} ${type === 'ma' ? 'mA' : 'V'}`;
    $('sSpan').textContent = fmt(span, 2);
    $('sReverse').textContent = `${fmt(reverse, 2)} ${type === 'ma' ? 'mA' : 'V'}`;
    $('sScaleText').textContent = `${fmt(percent, 2)}%`;
    const barPct = Math.max(0, Math.min(100, percent));
    $('sBar').style.width = `${barPct}%`;
  }

  function bindInputs(ids, fn) {
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', fn);
      el.addEventListener('change', fn);
    });
  }

  bindInputs(['pValue', 'pUnit'], updatePressure);
  bindInputs(['fValue', 'fUnit'], updateFlow);
  bindInputs(['oD', 'od', 'odp', 'orho', 'ocd'], updateOrifice);
  bindInputs(['tValue', 'tUnit'], updateTemp);
  bindInputs(['rMode', 'rValue'], updatePt100);
  bindInputs(['tcType', 'tcHot', 'tcCold'], updateTc);
  bindInputs(['sLrv', 'sUrv', 'sType', 'sUnit', 'sSignal', 'sProcess'], updateSignal);

  $('pExampleBtn').addEventListener('click', function () {
    $('pValue').value = '10';
    $('pUnit').value = 'bar';
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
  updateFlow();
  updateOrifice();
  updateTemp();
  updatePt100();
  updateTc();
  updateSignal();
})();
