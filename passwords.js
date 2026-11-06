/* Módulo 08 - Cofre local: códigos nunca são incluídos nos recursos públicos da PWA. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const storageKey = 'instrumentacao-pro-senhas-v1';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let records = null;

  const inputFile = byId('passwordsFile');
  const inputMaster = byId('passwordsMaster');
  const brandSelect = byId('passwordsBrand');
  const result = byId('passwordsResult');
  const notice = byId('passwordsNotice');
  const importButton = byId('passwordsImportBtn');
  const unlockButton = byId('passwordsUnlockBtn');
  const lockButton = byId('passwordsLockBtn');
  const clearButton = byId('passwordsClearBtn');
  const importWrap = byId('passwordsImportWrap');
  if (!inputFile || !inputMaster || !brandSelect || !result || !notice) return;

  function getStored() {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
    catch (_) { return null; }
  }
  function setStored(value) { localStorage.setItem(storageKey, JSON.stringify(value)); }
  function toBase64(bytes) {
    let str = '';
    bytes.forEach(b => { str += String.fromCharCode(b); });
    return btoa(str);
  }
  function fromBase64(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  }
  async function makeKey(passphrase, salt) {
    const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      {name:'PBKDF2', salt, iterations:250000, hash:'SHA-256'}, material,
      {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']
    );
  }
  async function encryptList(data, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await makeKey(passphrase,salt);
    const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, encoder.encode(JSON.stringify(data)));
    return {v:1,salt:toBase64(salt),iv:toBase64(iv),cipher:toBase64(new Uint8Array(encrypted))};
  }
  async function decryptList(payload,passphrase) {
    if (!payload || payload.v!==1) throw Error('Formato de dados desconhecido.');
    const key=await makeKey(passphrase,fromBase64(payload.salt));
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(payload.iv)}, key, fromBase64(payload.cipher));
    return JSON.parse(decoder.decode(plaintext));
  }
  function validateImport(data) {
    if (!data || data.format!=='instrumentacao-pro-senhas-privadas' || !Array.isArray(data.fabricantes)) throw Error('O arquivo não é uma lista particular compatível.');
    if (data.fabricantes.length<1 || data.fabricantes.length>100) throw Error('Quantidade de fabricantes inválida.');
    return data.fabricantes.map((item,i)=>{
      if (!item || typeof item.marca !== 'string' || !item.marca.trim() || item.marca.length>120 ||
          !Array.isArray(item.codigos) || !item.codigos.length || item.codigos.length>30 ||
          item.codigos.some(code=>typeof code!=='string' || code.length>300)) {
        throw Error('Dados inconsistentes no fabricante número '+(i+1));
      }
      return {marca:item.marca.trim(), modelo:typeof item.modelo==='string'?item.modelo.slice(0,160):'',codigos:item.codigos};
    });
  }
  function setNotice(message, isError=false) {
    notice.textContent=message;
    notice.style.color=isError?'var(--danger)':'var(--muted)';
  }
  function clearResult(text) {
    result.replaceChildren();
    const p=document.createElement('p');
    p.className='note';p.textContent=text;
    result.append(p);
  }
  function renderBrand() {
    const index = Number(brandSelect.value);
    clearResult('Selecione uma marca.');
    if (!records || brandSelect.value==='' || !Number.isInteger(index) || index<0 || index>=records.length) return;
    const item=records[index];
    result.replaceChildren();
    const h=document.createElement('h3');h.textContent=item.marca;
    result.append(h);
    if(item.modelo){const sub=document.createElement('p');sub.className='code-caption';sub.textContent=item.modelo;result.append(sub);}
    const label=document.createElement('p');label.className='code-label';label.textContent='Senha(s) / sequência(s) informada(s)';result.append(label);
    item.codigos.forEach(code=>{
      const el=document.createElement('div');el.className='code-entry';el.textContent=code;result.append(el);
    });
  }
  function lock() {
    records=null;
    brandSelect.disabled=true;
    brandSelect.replaceChildren(new Option('Desbloqueie a lista para selecionar',''));
    inputMaster.value='';
    lockButton.hidden=true;
    clearResult('Lista bloqueada. Digite sua senha mestra para consultar.');
  }
  function unlocked(items){
    records=items;
    brandSelect.replaceChildren(new Option('Selecione o fabricante',''));
    items.forEach((item,i)=>{
      brandSelect.add(new Option(item.modelo?`${item.marca} — ${item.modelo}`:item.marca,String(i)));
    });
    brandSelect.disabled=false;
    inputMaster.value='';
    lockButton.hidden=false;
    clearResult('Lista desbloqueada. Escolha o fabricante acima.');
  }
  function refreshMode(){
    const installed=!!getStored();
    importWrap.hidden=installed;
    importButton.hidden=installed;
    unlockButton.hidden=!installed;
    clearButton.hidden=!installed;
    if(!installed){lock();setNotice('Para começar, importe uma vez a lista particular no dispositivo e defina sua senha mestra.');}
    else if(!records) setNotice('Lista criptografada armazenada neste dispositivo. Digite a senha mestra para desbloquear.');
  }
  importButton.addEventListener('click', async()=>{
    const file=inputFile.files?.[0];
    const pass=inputMaster.value;
    if(!crypto?.subtle){setNotice('Criptografia indisponível. Abra o aplicativo por HTTPS.',true);return;}
    if(!file){setNotice('Selecione o arquivo JSON particular.',true);return;}
    if(file.size>100000){setNotice('O arquivo excede o limite permitido.',true);return;}
    if(pass.length<8){setNotice('Defina uma senha mestra com pelo menos 8 caracteres.',true);return;}
    importButton.disabled=true;
    try{
      const raw=JSON.parse(await file.text());
      const items=validateImport(raw);
      const payload=await encryptList({format:'instrumentacao-pro-senhas-privadas',fabricantes:items},pass);
      setStored(payload);
      unlocked(items);
      inputFile.value='';
      refreshMode();
      setNotice(`Lista importada e criptografada com ${items.length} fabricantes/modelos. Selecione um fabricante para consulta.`);
    }catch(e){setNotice('Não foi possível importar: '+e.message,true);}
    finally{importButton.disabled=false;}
  });
  unlockButton.addEventListener('click',async()=>{
    if(!inputMaster.value){setNotice('Digite a senha mestra para desbloquear.',true);return;}
    unlockButton.disabled=true;
    try{
      const data=await decryptList(getStored(),inputMaster.value);
      unlocked(validateImport(data));
      setNotice('Lista desbloqueada neste dispositivo. A consulta funciona sem internet.');
    }catch(_){setNotice('Senha mestra incorreta ou dados armazenados inválidos.',true);}
    finally{unlockButton.disabled=false;}
  });
  lockButton.addEventListener('click',()=>{lock();setNotice('Lista bloqueada.');});
  clearButton.addEventListener('click',()=>{
    if (!confirm('Apagar permanentemente a lista criptografada deste dispositivo? Mantenha seu arquivo particular para importar novamente.')) return;
    localStorage.removeItem(storageKey);
    refreshMode();
  });
  brandSelect.addEventListener('change',renderBrand);
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click',()=>{
    if (tab.dataset.panel!=='passwords' && records) {lock();setNotice('Lista bloqueada ao sair do módulo.');}
  }));
  refreshMode();
})();
