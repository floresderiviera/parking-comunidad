let scanner=null,done=false,starting=false;
const status=document.getElementById('status');
const fallback=document.getElementById('fallback');
const back=document.getElementById('back');
const returnUrl=new URLSearchParams(location.search).get('return')||'';
function renderScannerLanguage(){
  document.title=t('scanner.title');
  document.getElementById('scanner-title').textContent=t('scanner.title');
  document.getElementById('scanner-intro').textContent=t('scanner.intro');
  fallback.textContent=t('scanner.openCamera');
  back.textContent=t('scanner.back');
  bindLanguageSelectors(document);
}
function show(msg,bad=false){status.textContent=msg;status.className='message'+(bad?' bad':'')}
function parkingToken(text){
  try{const u=new URL(text);return u.protocol==='https:'?(u.searchParams.get('q')||''):''}catch(e){return ''}
}
function validParkingUrl(text){return !!parkingToken(text)}
function scanTarget(text){
  const token=parkingToken(text);if(!token)return '';
  if(!returnUrl)return text;
  try{const target=new URL(returnUrl,location.href);target.searchParams.set('q',token);return target.href}catch(e){return returnUrl+(returnUrl.includes('?')?'&':'?')+'q='+encodeURIComponent(token)}
}
async function stop(){if(scanner){try{await scanner.stop()}catch(e){}try{scanner.clear()}catch(e){}scanner=null}}
async function start(){
  if(done||starting)return;
  starting=true;fallback.style.display='none';show(t('scanner.requesting'));
  try{
    if(typeof Html5Qrcode==='undefined')throw new Error(t('scanner.libraryError'));
    scanner=new Html5Qrcode('reader');
    await scanner.start({facingMode:'environment'},{fps:12,qrbox:(w,h)=>{const s=Math.floor(Math.min(w,h)*.72);return{width:s,height:s}},aspectRatio:1.333},async text=>{
      if(done)return;
      if(!validParkingUrl(text)){show(t('scanner.invalidQr'),true);return}
      done=true;navigator.vibrate?.(100);show(t('scanner.detected'));await stop();window.location.href=scanTarget(text);
    },()=>{});
    show(t('scanner.aiming'));
  }catch(e){
    await stop();
    show(t('scanner.cameraError'),true);
    fallback.style.display='block';
  }finally{starting=false}
}
fallback.addEventListener('click',start);
back.addEventListener('click',async()=>{done=true;await stop();if(returnUrl){window.location.href=returnUrl}else if(history.length>1){history.back()}else{window.location.href=new URL('../',location.href).href}});
window.addEventListener('pagehide',()=>{stop()});
async function publicState(){
  try{
    const cfg=window.SUPABASE_CONFIG;if(!cfg?.url||!cfg?.publishableKey)return null;
    const response=await fetch(`${cfg.url}/rest/v1/rpc/parking_public_state`,{method:'POST',headers:{apikey:cfg.publishableKey,authorization:`Bearer ${cfg.publishableKey}`,'content-type':'application/json'},body:'{}',cache:'no-store'});
    if(!response.ok)return null;return await response.json();
  }catch(_e){return null}
}
async function bootScanner(){
  renderScannerLanguage();
  const state=await publicState();
  const settings=state?.settings||{},logo=String(settings.LogoUrl||'').trim();
  if(settings.NombreOficial)document.title=`${t('scanner.title')} · ${settings.NombreOficial}`;
  if(logo){let icon=document.querySelector('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}icon.href=logo}
  if(state?.maintenance?.enabled){
    done=true;show(state.maintenance.message||t('scanner.maintenance'),true);
    document.getElementById('reader').style.display='none';fallback.style.display='none';
    return;
  }
  setTimeout(start,150);
}
window.addEventListener('parking:languagechange',()=>{
  renderScannerLanguage();
  if(!done)show(t('scanner.aiming'));
});
window.addEventListener('load',bootScanner);
