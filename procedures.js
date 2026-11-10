(function () {
  'use strict';
  const selector = document.getElementById('procedureType');
  const view = document.getElementById('procedureFy303');
  const placeholder = document.getElementById('procedurePlaceholder');
  if (!selector || !view || !placeholder) return;
  function sync() {
    const active = selector.value === 'fy303';
    view.hidden = !active;
    placeholder.hidden = active;
  }
  selector.addEventListener('change', sync);
  document.querySelectorAll('#procedures .network-quicknav a').forEach(a => {
    a.addEventListener('click', () => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target && target.tagName === 'DETAILS') target.open = true;
    });
  });
  sync();
})();
