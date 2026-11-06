/* Módulo 08 — Consulta direta offline. Dados incorporados conforme solicitação do usuário. */
(() => {
  'use strict';
  const DATA = [
  {
    "marca": "EMERSON ROSEMOUNT",
    "codigos": [
      "(↑) pressionada por 3 segundos"
    ]
  },
  {
    "marca": "E+H",
    "codigos": [
      "4685"
    ]
  },
  {
    "marca": "INCONTROL",
    "codigos": [
      "4444",
      "5555"
    ]
  },
  {
    "marca": "ABB",
    "codigos": [
      "1000",
      "4000",
      "6000",
      "8523"
    ]
  },
  {
    "marca": "YOKOGAWA",
    "codigos": [
      "497761",
      "0000",
      "7777"
    ]
  },
  {
    "marca": "SIEMENS",
    "codigos": [
      "1000"
    ]
  },
  {
    "marca": "DANFOSS",
    "codigos": [
      "1000"
    ]
  },
  {
    "marca": "CONTECH",
    "codigos": [
      "19818",
      "2207",
      "2208",
      "2607",
      "2608",
      "9111",
      "1507"
    ]
  },
  {
    "marca": "YINUO",
    "codigos": [
      "19818",
      "2207",
      "2208",
      "2607",
      "2608",
      "9111",
      "1507"
    ]
  },
  {
    "marca": "MAGNETROL",
    "codigos": [
      "200",
      "2200"
    ]
  },
  {
    "marca": "THERMATE",
    "codigos": [
      "200",
      "2200"
    ]
  },
  {
    "marca": "ENGISTREL",
    "codigos": [
      "0",
      "1111"
    ]
  },
  {
    "marca": "TRICOMEX",
    "codigos": [
      "0",
      "2222"
    ]
  },
  {
    "marca": "METROVAL",
    "codigos": [
      "3x(−), 2x(+), 1x(Enter)",
      "937",
      "807",
      "3x(Enter), 2x(+), 1x(−)"
    ]
  },
  {
    "marca": "CONAUT KROHNE",
    "modelo": "IFC090 / IFC010",
    "codigos": [
      "3x(→), 3x(Enter), 3x(↑)",
      "RESET, 1x(↑), 1x(→)"
    ]
  },
  {
    "marca": "CONAUT KROHNE",
    "modelo": "IFC100 / IFC300",
    "codigos": [
      "7378"
    ]
  },
  {
    "marca": "SIERRA",
    "codigos": [
      "6363",
      "0000"
    ]
  },
  {
    "marca": "DWYLER",
    "codigos": [
      "4321"
    ]
  },
  {
    "marca": "SPIRAX SARCO",
    "codigos": [
      "7452",
      "8888"
    ]
  }
];
  const brand = document.getElementById('passwordsBrand');
  const model = document.getElementById('passwordsModel');
  const modelWrap = document.getElementById('passwordsModelWrap');
  const output = document.getElementById('passwordsResult');
  if (!brand || !model || !modelWrap || !output) return;

  const brands = [...new Set(DATA.map(entry => entry.marca))].sort((a,b) => a.localeCompare(b,'pt-BR'));
  for (const name of brands) brand.add(new Option(name, name));

  const notice = message => {
    output.replaceChildren();
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = message;
    output.appendChild(p);
  };
  const show = entry => {
    output.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = entry.marca;
    output.appendChild(h);
    if (entry.modelo) {
      const sub = document.createElement('p');
      sub.className = 'code-caption';
      sub.textContent = entry.modelo;
      output.appendChild(sub);
    }
    const title = document.createElement('p');
    title.className = 'code-label';
    title.textContent = 'Senha(s) / sequência(s) informada(s)';
    output.appendChild(title);
    for (const code of entry.codigos) {
      const el = document.createElement('div');
      el.className = 'code-entry';
      el.textContent = code;
      output.appendChild(el);
    }
  };
  const render = () => {
    const items = DATA.filter(entry => entry.marca === brand.value);
    modelWrap.hidden = items.length <= 1;
    model.replaceChildren(new Option('Selecione o modelo',''));
    if (!items.length) { notice('Selecione um fabricante para consultar.'); return; }
    if (items.length === 1) { show(items[0]); return; }
    items.forEach((entry,i) => model.add(new Option(entry.modelo || 'Modelo '+(i+1), String(i))));
    notice('Selecione o modelo do equipamento.');
  };
  brand.addEventListener('change',render);
  model.addEventListener('change',() => {
    const items=DATA.filter(entry => entry.marca===brand.value);
    if (model.value==='') { notice('Selecione o modelo do equipamento.');return; }
    const index=Number(model.value);
    if(Number.isInteger(index)&&index>=0&&index<items.length) show(items[index]);
  });
  render();
})();
