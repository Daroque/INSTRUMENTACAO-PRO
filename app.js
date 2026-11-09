(function () {
  'use strict';

  // Identificador central da versão exibida na interface.
  const APP_VERSION = '1.8.9';
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

  // Exibe a versão atual ao lado do estado Online/Offline e no rodapé.
  if ($('app-version')) $('app-version').textContent = 'v' + APP_VERSION;
  if ($('footer-version')) $('footer-version').textContent = APP_VERSION;

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
    if (!Number.isFinite(out)) {
      setHTML('pressureResults', resultCard('Valor fora do limite', 'Reduza a magnitude do valor informado.'));
      return;
    }
    const shown = out !== 0 && (Math.abs(out) < 0.000001 || Math.abs(out) >= 1e12)
      ? out.toExponential(6).replace('.', ',')
      : fmt(out, Math.abs(out)>=100000 ? 0 : Math.abs(out)<0.01 && out!==0 ? 8 : 4);
    setHTML('pressureResults', resultCard(pressureLabels[target], `${shown} ${pressureLabels[target]}`));
  }

  // Comprimento e distância: todos os fatores estão expressos em metros.
  // Pés, polegadas, jardas e milhas: definição internacional, não "survey foot".
  const metricToM = {
    pm: 1e-12, nm: 1e-9, um: 1e-6, mm: 1e-3, cm: 1e-2,
    dm: 0.1, m: 1, dam: 10, hm: 100, km: 1000,
    uin: 0.0000000254, mil: 0.0000254, pol: 0.0254,
    ft: 0.3048, yd: 0.9144, rod: 5.0292, chain: 20.1168,
    furlong: 201.168, mi: 1609.344,
    nmi: 1852, fathom: 1.8288,
    angstrom: 1e-10, au: 149597870700,
    ly: 9.4607304725808e15, pc: 3.085677581491367e16
  };
  const metricLabels = {
    pm: 'pm', nm: 'nm', um: 'µm', mm: 'mm', cm: 'cm', dm: 'dm',
    m: 'm', dam: 'dam', hm: 'hm', km: 'km',
    uin: 'µin', mil: 'mil', pol: 'pol', ft: 'ft', yd: 'yd',
    rod: 'rod', chain: 'chain', furlong: 'fur', mi: 'mi',
    nmi: 'nmi', fathom: 'fathom', angstrom: 'Å',
    au: 'au', ly: 'ly', pc: 'pc'
  };
  function formatMetric(value) {
    if (value !== 0 && (Math.abs(value) < 0.000001 || Math.abs(value) >= 1e12)) {
      return value.toExponential(6).replace('.', ',');
    }
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10
    });
  }
  function updateMetric() {
    const val = valueOrNull('metricValue');
    const from = $('metricUnit').value;
    const to = $('metricTarget').value;
    if (val === null || !Number.isFinite(val) || !metricToM[from] || !metricToM[to]) {
      setHTML('metricResults', resultCard('Verifique os dados', 'Informe um valor e unidades válidos.'));
      return;
    }
    const out = val * (metricToM[from] / metricToM[to]);
    if (!Number.isFinite(out)) {
      setHTML('metricResults', resultCard('Valor fora do limite', 'Reduza a magnitude do valor informado.'));
      return;
    }
    setHTML('metricResults', resultCard('Resultado · ' + metricLabels[to],
      `${formatMetric(out)} ${metricLabels[to]}`));
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
    if (!Number.isFinite(m3s) || Object.values(flowToM3s).some(factor => !Number.isFinite(m3s/factor))) {
      setHTML('flowResults', resultCard('Valor fora do limite', 'Reduza a magnitude da vazão.'));
      return;
    }
    const html = Object.keys(flowToM3s).map((key) => {
      const out = m3s / flowToM3s[key];
      const shown = out!==0 && Math.abs(out)<0.000001 ? out.toExponential(6).replace('.', ',') : fmt(out, key === 'm3s' ? 6 : 3);
      return resultCard(flowLabels[key], `${shown} ${flowLabels[key]}`);
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

  // Tabela de correspondências fornecida pelo usuário: bitola em polegadas -> diâmetro nominal em mm.
  // Não é conversão geométrica de polegadas para mm nem uma tabela de diâmetro interno real.
  const METER_NOMINAL_MM = new Map([
    [1/12, 2], [1/8, 3], [1/4, 6], [3/8, 10], [1/2, 15],
    [1, 25], [1.5, 40], [2, 50], [2.5, 65], [3, 80], [4, 100],
    [5, 125], [6, 150], [8, 200], [10, 250], [12, 300],
    [14, 350], [16, 400], [18, 450], [20, 500], [24, 600],
    [28, 700], [30, 750], [32, 800], [36, 900], [40, 1000],
    [44, 1100], [48, 1200], [54, 1400], [60, 1500],
    [66, 1600], [72, 1800], [78, 2000]
  ]);

  function parseNominalInches(input) {
    const raw = String(input || '').trim().replace(/[″”"]/g, '').replace(/,/g, '.').replace(/\s+/g,' ');
    if (!raw) return null;
    // Frações puras: "1/2"; frações mistas: "1 1/2" ou "1-1/2".
    const mixed = raw.match(/^(\d+)\s*[- ]\s*(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const den = Number(mixed[3]);
      return den > 0 ? Number(mixed[1]) + Number(mixed[2]) / den : NaN;
    }
    const fraction = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fraction) {
      const den = Number(fraction[2]);
      return den > 0 ? Number(fraction[1]) / den : NaN;
    }
    return /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
  }

  function updateMeterInstall() {
    const raw = $('meterDiameter').value.trim();
    const inches = parseNominalInches(raw);
    const size = inches === null ? 0 : inches;
    const nominalMm = METER_NOMINAL_MM.get(size);
    const valid = size === 0 || (Number.isFinite(size) && size > 0 && nominalMm !== undefined);
    // Mantém a ilustração visível mesmo sem preenchimento, com zero ou com valor não tabelado.
    const d = valid ? (nominalMm || 0) : 0;
    const upstream = d * 5;
    const downstream = d * 2;
    const summary = !valid
      ? 'Bitola não cadastrada na tabela. Confira a medida em polegadas.'
      : size === 0
        ? 'Selecione uma bitola nominal maior que zero para dimensionar.'
        : 'Instalação de referência: 5D antes e 2D depois';
    setHTML('meterInstallResults', [
      resultCard('Diâmetro do tubo', valid ? `${fmt(d, 2)} mm` : '—'),
      resultCard('Trecho mínimo antes do medidor', valid ? `${fmt(upstream, 2)} mm` : '—'),
      resultCard('Trecho mínimo depois do medidor', valid ? `${fmt(downstream, 2)} mm` : '—'),
      resultCard(valid ? 'Resumo' : 'Bitola não identificada', summary)
    ].join(''));
    setHTML('meterInstallDiagram', meterInstallDiagram(d, upstream, downstream));
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
    if (k < 0) {
      setHTML('tempResults', resultCard('Temperatura impossível', 'A temperatura não pode ser inferior ao zero absoluto (0 K).'));
      return;
    }
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
      if (value < -200 || value > 850) {
        setHTML('pt100Results', resultCard('Fora da faixa IEC 60751', 'Informe uma temperatura entre −200 e 850 °C.'));
        return;
      }
      const r = pt100ResistanceFromTemp(value);
      setHTML('pt100Results', [
        resultCard('Resistência', `${fmt(r, 4)} Ω`),
        resultCard('Temperatura', `${fmt(value, 2)} °C`)
      ].join(''));
    } else {
      label.textContent = 'Resistência (Ω)';
      const rMin = pt100ResistanceFromTemp(-200);
      const rMax = pt100ResistanceFromTemp(850);
      if (value < rMin || value > rMax) {
        setHTML('pt100Results', resultCard('Fora da faixa IEC 60751', `Informe uma resistência entre ${fmt(rMin, 3)} Ω e ${fmt(rMax, 3)} Ω.`));
        return;
      }
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
    if (hot < 0 || hot > 500 || cold < 0 || cold > 500) {
      setHTML('tcResults', resultCard('Fora da tabela disponível', 'A interpolação aproximada deste módulo é válida apenas entre 0 e 500 °C para ambas as juntas.'));
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
      $('sPv').textContent = '—'; $('sPvUnit').textContent = unit; $('sStatus').textContent = 'Informe todos os valores.'; $('sStatus').style.color = 'var(--danger)';
      $('sPercent').textContent = '—'; $('sInputEcho').textContent = '—'; $('sSpan').textContent = '—'; $('sReverse').textContent = '—'; $('sScaleText').textContent = '—'; $('sBar').style.width = '0%';
      return;
    }
    const span = urv - lrv;
    if (!(span > 0)) {
      $('sPv').textContent = '—'; $('sPvUnit').textContent = unit; $('sStatus').textContent = 'Verifique a faixa: URV deve superar LRV.'; $('sStatus').style.color = 'var(--danger)';
      $('sPercent').textContent = '—'; $('sInputEcho').textContent = '—'; $('sSpan').textContent = '—'; $('sReverse').textContent = '—'; $('sScaleText').textContent = '—'; $('sBar').style.width = '0%';
      return;
    }
    const percent = ((signal - cfg.min) / (cfg.max - cfg.min)) * 100;
    const pv = lrv + ((signal - cfg.min) / (cfg.max - cfg.min)) * span;
    const reverse = cfg.min + ((processWanted - lrv) / span) * (cfg.max - cfg.min);
    if (![percent,pv,reverse].every(Number.isFinite)) {
      $('sPv').textContent = '—'; $('sStatus').textContent = 'Resultado fora do limite numérico.';
      $('sPercent').textContent = '—'; $('sReverse').textContent = '—'; $('sSpan').textContent = '—'; $('sBar').style.width='0%';
      return;
    }
    const within = signal >= cfg.min && signal <= cfg.max;
    $('sPv').textContent = fmt(pv, 2);
    $('sPvUnit').textContent = unit;
    $('sStatus').textContent = within ? 'Dentro da faixa nominal' : 'Fora da faixa nominal';
    $('sStatus').style.color = within ? 'var(--green)' : 'var(--danger)';
    $('sPercent').textContent = `${fmt(percent, 2)}%`;
    $('sInputEcho').textContent = `${fmt(signal, 2)} ${cfg.unit}`;
    $('sSpan').textContent = fmt(span, 2);
    $('sReverse').textContent = `${fmt(reverse, 2)} ${cfg.unit}${processWanted < lrv || processWanted > urv ? ' (fora da faixa)' : ''}`;
    $('sScaleText').textContent = `${fmt(percent, 2)}%`;
    $('sBar').style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  // Fatores de potência ativa em W (não são unidades de energia).
  // Btu IT: 1055.05585262 J. kcal termoquímica: 4184 J.
  const powerWatts = {
    pw: 1e-12, nw: 1e-9, uw: 1e-6, mwatt: 1e-3, w: 1, kw: 1e3, mw: 1e6, gw: 1e9, tw: 1e12,
    hp: 745.6998715822702, cv: 735.49875, hpe: 746, hpb: 9809.5,
    ftlbfs: 1.3558179483314004, ftlbfmin: 1.3558179483314004/60, kgfms: 9.80665,
    btuh: 1055.05585262/3600, btumin: 1055.05585262/60, btus: 1055.05585262,
    kcalh: 4184/3600, kcals: 4184, cals: 4.184,
    kjh: 1000/3600, kjs: 1000, mjh: 1e6/3600,
    tr: 12000*1055.05585262/3600, ergs: 1e-7
  };
  const apparentVA = { va: 1, kva: 1000, mva: 1e6, gva: 1e9 };
  const powerLabels = {
    pw:'pW', nw:'nW', uw:'µW', mwatt:'mW', w:'W', kw:'kW', mw:'MW', gw:'GW', tw:'TW',
    hp:'hp mecânico', cv:'cv', hpe:'hp elétrico', hpb:'hp de caldeira',
    ftlbfs:'ft·lbf/s', ftlbfmin:'ft·lbf/min', kgfms:'kgf·m/s',
    btuh:'BTU/h', btumin:'BTU/min', btus:'BTU/s', kcalh:'kcal/h', kcals:'kcal/s', cals:'cal/s',
    kjh:'kJ/h', kjs:'kJ/s', mjh:'MJ/h', tr:'TR', ergs:'erg/s',
    va:'VA', kva:'kVA', mva:'MVA', gva:'GVA'
  };
  function fmtPower(n) {
    if (!Number.isFinite(n)) return '—';
    const abs=Math.abs(n);
    if (abs !== 0 && (abs >= 1e13 || abs < 1e-6)) return n.toExponential(6).replace('.', ',');
    return n.toLocaleString('pt-BR', {maximumFractionDigits:abs < 1 ? 9 : 6});
  }
  function updatePower() {
    const from = $('powerUnit').value;
    const to = $('powerTarget').value;
    const fromApparent = Object.hasOwn(apparentVA,from);
    const toApparent = Object.hasOwn(apparentVA,to);
    const requiresPf = fromApparent !== toApparent;
    $('powerPfField').hidden = !requiresPf;
    const value = valueOrNull('powerValue');
    const pf = valueOrNull('powerPf');
    if (value === null || (requiresPf && (pf === null || pf <= 0 || pf > 1))) {
      setHTML('powerResults', resultCard('Verificação', 'Informe potência válida e FP maior que 0 e até 1, quando necessário.'));
      $('powerNotice').textContent = requiresPf ? 'Informe o fator de potência entre 0 (exclusivo) e 1.' : 'Informe uma potência válida.';
      return;
    }
    let out;
    if (fromApparent && toApparent) {
      out = value * apparentVA[from] / apparentVA[to];
    } else if (fromApparent) {
      out = value * apparentVA[from] * pf / powerWatts[to];
    } else if (toApparent) {
      out = value * powerWatts[from] / (pf * apparentVA[to]);
    } else {
      out = value * powerWatts[from] / powerWatts[to];
    }
    if (!Number.isFinite(out)) {
      setHTML('powerResults', resultCard('Valor fora do limite', 'Reduza a magnitude da potência ou revise o fator de potência.'));
      $('powerNotice').textContent = 'Não foi possível calcular um resultado finito.';
      return;
    }
    setHTML('powerResults', resultCard(powerLabels[to], `${fmtPower(out)} ${powerLabels[to]}`));
    $('powerNotice').textContent = requiresPf ? `Conversão entre potência ativa e aparente com FP ${fmt(pf, 3)}.` : fromApparent ? 'Conversão entre unidades de potência aparente.' : 'Conversão entre unidades de potência ativa.';
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

  // O esquema do tanque deve permanecer visível mesmo quando os dados H/L
  // estiverem vazios ou inválidos. Não exibir números simulados nesses casos.
  function hlDiagramInvalid(mode, message) {
    return `<div class="tech-diagram">
      ${tankSvg(mode)}
      <div class="diagram-facts">
        <div class="diagram-fact"><span class="df-label">Critério H e L</span><strong>Faixa não calculada</strong></div>
        <p class="diagram-caption">${message}</p>
      </div>
    </div>`;
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
      $('hlDiagram').innerHTML = hlDiagramInvalid(mode, 'Informe os valores H, L e a densidade para visualizar a faixa.');
      setHTML('hlSummary', resultCard('Verificação', 'Informe H, L e densidade.'));
      return;
    }
    if (density <= 0) {
      $('hlR100').textContent = '—';
      $('hlR0').textContent = '—';
      $('hlDiagram').innerHTML = hlDiagramInvalid(mode, 'Densidade inválida. O tanque continua ilustrado, sem valores calculados.');
      setHTML('hlSummary', resultCard('Densidade inválida', 'Informe uma densidade relativa positiva.'));
      return;
    }
    const dp100 = h100 - l100;
    const dp0 = h0 - l0;
    const span = dp100 - dp0;
    const dp100d = dp100 * density;
    const dp0d = dp0 * density;
    const spand = span * density;
    if (![dp100,dp0,span,dp100d,dp0d,spand].every(Number.isFinite) || !(span>0)) {
      $('hlR100').textContent='—'; $('hlR0').textContent='—';
      $('hlDiagram').innerHTML = hlDiagramInvalid(mode, 'Faixa H/L inválida. Confira 0%, 100% e os valores digitados.');
      setHTML('hlSummary', resultCard('Faixa H/L inválida', span<=0 ? 'O valor de 100% deve resultar em diferencial maior que o de 0% para faixa ascendente.' : 'Valores fora do limite de cálculo.'));
      return;
    }
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
    if (!Number.isFinite(span) || !(span > 0)) {
      setHTML('deviceOutputResults', resultCard('Faixa de saída inválida', 'O URV deve superar o LRV. Revise os valores antes de usar esta configuração.'));
      $('deviceOutputNotice').textContent = 'Nenhum span válido foi calculado.';
      return;
    }
    setHTML('deviceOutputResults', [
      resultCard('LRV · 0%', `${fmt(lrv, 3)} ${unit}`),
      resultCard('URV · 100%', `${fmt(urv, 3)} ${unit}`),
      resultCard('Span da saída', `${fmt(span, 3)} ${unit}`)
    ].join(''));
    $('deviceOutputNotice').textContent = span > 0
      ? 'Faixa informada em ' + unit + '. Se a unidade não for de pressão, não representa uma conversão do cálculo hidrostático.'
      : 'Verifique a configuração: URV deve ser maior que LRV para uma faixa ascendente.';
  }


  // Módulo 09 — relações numéricas definidas pelo usuário.
  function updateGearRotation() {
    const teeth = valueOrNull('calcTeeth');
    const rpm = valueOrNull('calcGearRpm');
    const hz = valueOrNull('calcGearHz');
    if ([teeth,rpm,hz].some(v => v === null)) {
      setHTML('calcGearResult', resultCard('Dados incompletos', 'Preencha todos os campos.'));
      return;
    }
    if (!Number.isInteger(teeth) || teeth <= 0 || rpm < 0 || hz <= 0) {
      setHTML('calcGearResult', resultCard('Dados inválidos', 'Dentes: inteiro positivo; RPM: não negativo; frequência: maior que zero.'));
      return;
    }
    const result = (teeth * rpm) / hz;
    setHTML('calcGearResult', Number.isFinite(result)
      ? resultCard('Resultado calculado', fmt(result, 0) + ' RPM')
      : resultCard('Cálculo inválido', 'Valores fora do intervalo numérico permitido.'));
  }

  function updateRpmPerHz() {
    const rpm = valueOrNull('calcRpm');
    const hz = valueOrNull('calcHz');
    if (rpm === null || hz === null) {
      setHTML('calcHzResult', resultCard('Dados incompletos', 'Preencha ambos os campos.'));
      return;
    }
    if (rpm < 0 || hz <= 0) {
      setHTML('calcHzResult', resultCard('Dados inválidos', 'RPM não pode ser negativo e frequência deve ser maior que zero.'));
      return;
    }
    const result = rpm / hz;
    setHTML('calcHzResult', Number.isFinite(result)
      ? resultCard('Relação calculada (RPM/Hz)', fmt(result, 0) + ' RPM/Hz')
      : resultCard('Cálculo inválido', 'Valores fora do intervalo numérico permitido.'));
  }

  function updateBaumeBrix() {
    const baume = valueOrNull('calcBaume');
    if (baume === null) {
      setHTML('calcBaumeResult', resultCard('Dados incompletos', 'Informe o grau Baumé.'));
      return;
    }
    const brix = baume * 1.905 - 1.65;
    if (!Number.isFinite(brix)) {
      setHTML('calcBaumeResult', resultCard('Dados inválidos', 'Valor fora do intervalo numérico permitido.'));
      return;
    }
    if (brix < 0) {
      setHTML('calcBaumeResult', resultCard('Fora da faixa aplicável', 'Valor calculado negativo; confira a medição e a aplicabilidade da conversão.'));
      return;
    }
    setHTML('calcBaumeResult', resultCard('Brix estimado', `${fmt(brix, 2)} °Brix`));
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
  bindInputs(['tValue', 'tUnit'], updateTemp);
  bindInputs(['rMode', 'rValue'], updatePt100);
  bindInputs(['tcType', 'tcHot', 'tcCold'], updateTc);
  bindInputs(['sLrv', 'sUrv', 'sType', 'sUnit', 'sSignal', 'sProcess'], updateSignal);
  bindInputs(['powerValue', 'powerUnit', 'powerTarget', 'powerPf'], updatePower);
  bindInputs(['rangeMode', 'rangeMin', 'rangeMax', 'rangeRho'], () => { updateRange(); updateHLRange(); });
  bindInputs(['hlH100', 'hlL100', 'hlH0', 'hlL0', 'hlDensity'], updateHLRange);
  bindInputs(['deviceLrv', 'deviceUrv', 'deviceUnit'], updateDeviceOutput);
  bindInputs(['calcTeeth', 'calcGearRpm', 'calcGearHz'], updateGearRotation);
  bindInputs(['calcRpm', 'calcHz'], updateRpmPerHz);
  bindInputs(['calcBaume'], updateBaumeBrix);

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

  // Relatório independente. A fonte é a UI visível, não cálculos paralelos ou cartões ocultos.
  function reportEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function isReportVisible(element, panel) {
    // [hidden] e display:none em qualquer ancestral invalidam o conteúdo para relatório.
    for (let n=element; n && n !== panel; n=n.parentElement) {
      if (n.hidden || n.hasAttribute('hidden')) return false;
      if (window.getComputedStyle(n).display === 'none') return false;
    }
    return true;
  }
  function reportTable(rows, heading) {
    return rows.length ? `<h3>${reportEscape(heading)}</h3><table><tbody>${rows.map(([label,value])=>
      `<tr><th>${reportEscape(label)}</th><td>${reportEscape(value)}</td></tr>`).join('')}</tbody></table>` : '';
  }
  function reportSection(title, inputs=[], results=[], visuals='') {
    if (!inputs.length && !results.length && !visuals) return '';
    return `<section class="report-section"><h2>${reportEscape(title)}</h2>${reportTable(inputs,'Parâmetros informados')}
      ${reportTable(results,'Resultados exibidos no aplicativo')}${visuals}</section>`;
  }
  function reportInputs(root, panel) {
    return Array.from(root.querySelectorAll('input,select,textarea')).filter(field => {
      return field.id && !field.disabled && isReportVisible(field,panel);
    }).map(field => {
      const label=root.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() ||
        panel.querySelector(`label[for="${field.id}"]`)?.textContent?.trim() || field.id;
      const value = field.tagName==='SELECT' ? field.selectedOptions[0]?.textContent?.trim() : field.value?.trim();
      return [label,value];
    }).filter(([,v])=>String(v??'').trim()!=='');
  }
  function reportResults(root,panel) {
    const out=[];
    root.querySelectorAll('.result-card,.mini-card,.highlight-card').forEach(card => {
      if (!isReportVisible(card,panel)) return;
      let label = '',value='';
      if (card.classList.contains('result-card')) {
        label=card.querySelector('span')?.textContent?.trim() || '';
        value=card.querySelector('strong')?.textContent?.trim() || '';
      } else if (card.classList.contains('mini-card')) {
        label=card.querySelector('span')?.textContent?.trim() || '';
        value=card.querySelector('strong')?.textContent?.trim() || '';
      } else {
        label=card.querySelector('.result-label')?.textContent?.trim() || 'Valor calculado';
        value=card.querySelector('.big-result')?.textContent?.trim() || '';
      }
      if (label && value) out.push([label,value.replace(/\s+/g,' ')]);
    });
    return out;
  }
  function reportImages(root,panel) {
    return Array.from(root.querySelectorAll('img')).filter(img => isReportVisible(img,panel))
      .map(img => `<figure class="report-figure"><img class="report-image" src="${reportEscape(img.src)}" alt="${reportEscape(img.alt)}"></figure>`).join('');
  }
  function reportSvgs(root,panel) {
    return Array.from(root.querySelectorAll('.tech-diagram, #meterInstallDiagram svg'))
      .filter(svg=>isReportVisible(svg,panel))
      .map(svg=>`<div class="report-diagram">${svg.outerHTML}</div>`).join('');
  }
  const REPORT_MODULES = new Set(['flow','range','parshall']);
  const REPORT_IDENTIFICATION_MODULES = new Set(['range','parshall']);
  function createReport() {
    const tab=document.querySelector('.tab.active');
    if (!tab) return;
    const panelId=tab.dataset.panel;
    if (!REPORT_MODULES.has(panelId)) return;
    const panel=$(panelId);
    if (!panel) return;

    // Atualiza instantaneamente o módulo solicitado antes de capturar a tela.
    const refresh={
      pressure:()=>{updatePressure();updateMetric();},
      flow:()=>{updateFlow();updateMeterInstall();},
      temperature:()=>{updateTemp();updatePt100();updateTc();},
      signal:updateSignal,
      power:updatePower,
      range:()=>{updateHLRange();updateDeviceOutput();}
    };
    if (refresh[panelId]) refresh[panelId]();
    // O módulo Parshall mantém seus próprios listeners síncronos.
    if (panelId==='parshall') $('parshallHead')?.dispatchEvent(new Event('input',{bubbles:true}));

    const moduleName=tab.textContent.trim();
    const parts=[];
    if(panelId==='range') {
      // O range hidrostático legado existe como container oculto para compatibilidade.
      // NÃO é a origem do critério H/L e nunca deve ser exportado.
      const overview=panel.querySelector('article.input-card');
      if(overview) parts.push(reportSection('Identificação e instalação',reportInputs(overview,panel)));

      const device=$('instrumentOutputSection');
      if(device) parts.push(reportSection('Range de saída do equipamento',reportInputs(device,panel),reportResults(device,panel)));

      const hlFields=[['H em 100%','hlH100'],['L em 100%','hlL100'],['H em 0%','hlH0'],['L em 0%','hlL0'],['Densidade relativa aplicada','hlDensity']];
      const hlInputs=hlFields.map(([label,id])=>[label,`${$(id)?.value ?? ''}${id==='hlDensity'?'':' mmH₂O'}`]);
      const hlResults=reportResults($('hlSummary'),panel);
      const diagram=$('hlDiagram')?.innerHTML ? `<div class="report-diagram">${$('hlDiagram').innerHTML}</div>` : '';
      parts.push(reportSection('Critério H e L (HP − LP)',hlInputs,hlResults,diagram));
      const transmitterImage=panel.querySelector('.image-panel img');
      if (transmitterImage) parts.push(reportSection('Indicação da célula do transmissor',[],[],
        `<figure class="report-figure"><img class="report-image" src="${reportEscape(transmitterImage.src)}" alt="Indicação da célula do transmissor"></figure>`));
    } else {
      // Não confundir resultados de cartões ocultos, etapas diferentes ou módulos vizinhos.
      panel.querySelectorAll('article.card').forEach(article => {
        if(!isReportVisible(article,panel)) return;
        if(panelId==='parshall' && (article.classList.contains('parshall-table-card') || article.classList.contains('parshall-figures-card'))) return;
        const title=article.querySelector('h2')?.textContent?.trim() || 'Dados do módulo';
        const fields=reportInputs(article,panel);
        const results=reportResults(article,panel);
        const figures=(panelId==='flow'?reportSvgs(article,panel):'') + (panelId==='temperature'?reportImages(article,panel):'');
        const section=reportSection(title,fields,results,figures);
        if(section) parts.push(section);
      });
      if(panelId==='parshall') {
        const condition=$('parshallValidation')?.textContent?.trim() || 'Condição de aplicação não informada.';
        parts.push(reportSection('Validação da condição hidráulica',[],[['Situação da medição', condition]]));
        const chart=$('parshallCurve')?.outerHTML || '';
        const body=$('parshallTableBody');
        const unit=$('parshallOutputUnit')?.selectedOptions?.[0]?.textContent || 'm³/h';
        if(chart) parts.push(`<section class="report-section"><h2>Curva de altura × vazão</h2><div class="report-diagram">${chart}</div></section>`);
        if(body) {
          const trs=Array.from(body.querySelectorAll('tr')).map(tr=>Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim()));
          parts.push(`<section class="report-section"><h2>Tabela de altura × vazão</h2>
            <table><thead><tr><th>Altura Hₐ (mm)</th><th>Vazão (${reportEscape(unit)})</th></tr></thead><tbody>${trs.map(cols=>
            `<tr>${cols.map(v=>`<td>${reportEscape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`);
        }
        const figureCard=panel.querySelector('.parshall-figures-card');
        if(figureCard) parts.push(reportSection('Referências visuais',[],[],reportImages(figureCard,panel)));
      }
      if(panelId==='flow') parts.push(reportSection('Limitações de aplicação',[],[[
        'Critério 5D/2D', 'Valores geométricos calculados sobre diâmetro nominal conforme tabela fornecida. Confirme diâmetro interno e instruções do fabricante antes da instalação.'
      ]]));
    }

    const generatedAt=new Date().toLocaleString('pt-BR');
    const authorName=REPORT_IDENTIFICATION_MODULES.has(panelId)?($('reportAuthorName')?.value?.trim() || ''):'';
    const authorRole=REPORT_IDENTIFICATION_MODULES.has(panelId)?($('reportAuthorRole')?.value?.trim() || ''):'';
    const report=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Relatório ${reportEscape(moduleName)} — Instrumentação PRO</title>
      <style>
        *{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#102b47;margin:0;background:#edf2f7}
        .toolbar{background:#0f2d4f;color:#fff;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .toolbar button{background:#2784ce;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-weight:bold;cursor:pointer}
        .paper{max-width:850px;margin:20px auto;padding:32px;background:#fff;box-shadow:0 5px 25px #0002}
        header{padding:0 0 16px;border-bottom:3px solid #1566a1}
        h1{font-size:26px;margin:5px 0}h2{font-size:17px;color:#123b60;margin:0 0 12px}
        h3{font-size:12px;color:#5a7288;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 7px}
        .report-section{margin-top:22px;break-inside:avoid-page}
        table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px}
        th,td{border:1px solid #d8e2eb;padding:8px 11px;text-align:left;vertical-align:top}
        th{width:48%;font-weight:600;background:#f2f6fb}td{font-weight:700;overflow-wrap:anywhere}
        .report-diagram{margin:12px auto;max-width:720px;break-inside:avoid-page}
        .report-diagram svg{width:100%;max-height:310px;display:block}
        .tech-diagram{display:flex;gap:22px;align-items:center;border:1px solid #d4e0e9;border-radius:12px;padding:14px}
        .tech-diagram svg{width:49%;flex-shrink:0}
        .diagram-facts{flex:1;display:flex;flex-direction:column;gap:10px}
        .diagram-fact{background:#f0f6fb;padding:8px 12px;border-radius:8px}
        .df-label{font-size:11px;display:block;color:#58738b;margin-bottom:3px}.diagram-fact strong{font-size:13px;display:block}
        .diagram-caption{font-size:10px;color:#526a81}
        .report-image{max-width:90%;max-height:370px;display:block;margin:10px auto;object-fit:contain}
        .report-identification{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:20px 0 12px}
        .report-person{font-size:12px;min-width:0}.report-person-label{display:block;font-weight:700;color:#526a81;margin-bottom:7px}
        .report-person-value{border-bottom:1px solid #8ea4b7;min-height:26px;padding:2px 4px 5px;overflow-wrap:anywhere}
        footer{border-top:1px solid #d2dee7;padding-top:12px;margin-top:30px;font-size:11px;color:#546b80}
        @page{size:A4;margin:15mm 13mm}@media print{body{background:white;print-color-adjust:exact;-webkit-print-color-adjust:exact}
          .toolbar{display:none}.paper{margin:0;max-width:none;padding:0;box-shadow:none}.report-section{break-inside:auto}}
      </style></head><body>
      <div class="toolbar"><span>Relatório em aba separada — feche esta aba para retornar ao aplicativo.</span><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
      <main class="paper"><header><small>INSTRUMENTAÇÃO PRO · RELATÓRIO TÉCNICO</small><h1>${reportEscape(moduleName)}</h1><div>Emitido em ${reportEscape(generatedAt)}</div></header>
      ${REPORT_IDENTIFICATION_MODULES.has(panelId)?`<div class="report-identification">
        <div class="report-person"><span class="report-person-label">Nome</span><div class="report-person-value">${reportEscape(authorName)}</div></div>
        <div class="report-person"><span class="report-person-label">Função</span><div class="report-person-value">${reportEscape(authorRole)}</div></div></div>`:''}
      ${parts.join('')}
      <footer>Relatório gerado com os resultados exibidos no módulo no momento da emissão. Revise as condições de aplicação e os dados de processo antes do uso em campo. As equações não são apresentadas.</footer>
      </main></body></html>`;
    const reportUrl=URL.createObjectURL(new Blob([report],{type:'text/html;charset=utf-8'}));
    const win=window.open(reportUrl,'_blank');
    if(!win){URL.revokeObjectURL(reportUrl);alert('O navegador bloqueou a nova aba. Permita pop-ups para o Instrumentação PRO.');return;}
    try{win.focus();}catch(_){}
    // Libera o documento temporário após a nova aba carregá-lo.
    setTimeout(()=>URL.revokeObjectURL(reportUrl), 60000);
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
  function syncReportIdentity() {
    const active = document.querySelector('.tab.active');
    const id = active?.dataset.panel || '';
    const identity = $('reportIdentity');
    if (identity) identity.hidden = !REPORT_IDENTIFICATION_MODULES.has(id);
    const reportButton = $('reportBtn');
    if (reportButton) reportButton.hidden = !REPORT_MODULES.has(id);
  }
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', syncReportIdentity));
  syncReportIdentity();
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
  updateTemp();
  updatePt100();
  updateTc();
  updateSignal();
  updatePower();
  updateRange();
  updateHLRange();
  updateDeviceOutput();
  updateGearRotation();
  updateRpmPerHz();
  updateBaumeBrix();
})();
