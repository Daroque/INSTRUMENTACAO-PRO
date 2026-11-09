(function () {
  'use strict';
  const sel = document.getElementById('networkType');
  if (!sel) return;
  const views = {dp:document.getElementById('networkDp'),pa:document.getElementById('networkPa'),asi:document.getElementById('networkAsi')};
  const update = () => {
    Object.entries(views).forEach(([name, view]) => { if (view) view.hidden = name !== sel.value; });
  };
  sel.addEventListener('change', update);
  update();
  document.querySelectorAll('#networks .network-quicknav a').forEach(link => {
    link.addEventListener('click', () => {
      const dest = document.getElementById(link.getAttribute('href').slice(1));
      if (dest && dest.tagName === 'DETAILS') dest.open = true;
    });
  });
})();
