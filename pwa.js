'use strict';
var pwaRegistration=null,pwaInstallPrompt=null,pwaReady=false,pwaFailed=false,pwaReloadRequested=false;
function renderPWA(){
 const installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const button=document.getElementById('install-app');
 button.textContent=t(installed?'installed':'installApp');button.disabled=installed||!pwaInstallPrompt;
 document.getElementById('pwa-status').textContent=t(pwaReady?'offlineReady':pwaFailed?'offlineUnavailable':'offlinePreparing')+' · '+t(navigator.onLine?'online':'offline');
 const waiting=Boolean(pwaRegistration&&pwaRegistration.waiting);
 document.getElementById('update-app').hidden=!waiting;document.getElementById('update-note').hidden=!waiting;
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pwaInstallPrompt=event;renderPWA();});
window.addEventListener('appinstalled',()=>{pwaInstallPrompt=null;renderPWA();});
window.addEventListener('online',renderPWA);window.addEventListener('offline',renderPWA);
document.getElementById('install-app').onclick=async()=>{if(!pwaInstallPrompt)return;const prompt=pwaInstallPrompt;await prompt.prompt();await prompt.userChoice;pwaInstallPrompt=null;renderPWA();};
document.getElementById('update-app').onclick=()=>{if(state.busy){toast(t('updateBusy'));return;}if(pwaRegistration&&pwaRegistration.waiting){pwaReloadRequested=true;pwaRegistration.waiting.postMessage('SKIP_WAITING');}};
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(pwaReloadRequested){pwaReloadRequested=false;window.location.reload();}});
 navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  pwaRegistration=reg;renderPWA();reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')renderPWA();});});
  return navigator.serviceWorker.ready;
 }).then(()=>{pwaReady=true;renderPWA();}).catch(error=>{pwaFailed=true;renderPWA();console.warn('PWA registration failed:',error);});
}else{pwaFailed=true;}
renderPWA();
