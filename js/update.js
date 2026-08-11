(function(){
  'use strict';

  if(!('serviceWorker' in navigator))return;

  const VERSION_KEY='rooted-deployed-version';
  const RELOAD_KEY='rooted-update-reload';
  let hadController=!!navigator.serviceWorker.controller;

  function showVersion(version){
    const label=document.getElementById('appVersion');
    if(label&&version)label.textContent='Version '+version;
  }

  if(sessionStorage.getItem(RELOAD_KEY)){
    setTimeout(function(){sessionStorage.removeItem(RELOAD_KEY);},5000);
  }

  function reloadOnce(){
    if(sessionStorage.getItem(RELOAD_KEY))return;
    sessionStorage.setItem(RELOAD_KEY,'1');
    location.reload();
  }

  navigator.serviceWorker.addEventListener('controllerchange',function(){
    if(hadController)reloadOnce();
    hadController=true;
  });

  async function checkDeployment(registration){
    try{
      const response=await fetch('version.json?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const deployed=(await response.json()).version;
      if(!deployed)return;
      showVersion(deployed);

      const known=localStorage.getItem(VERSION_KEY);
      if(!known){
        localStorage.setItem(VERSION_KEY,deployed);
        return;
      }
      if(known===deployed)return;

      const worker=registration.waiting||registration.active||navigator.serviceWorker.controller;
      if(!worker)return;

      const channel=new MessageChannel();
      const completed=new Promise(function(resolve,reject){
        const timer=setTimeout(function(){reject(new Error('update timeout'));},10000);
        channel.port1.onmessage=function(event){
          clearTimeout(timer);
          event.data&&event.data.ok?resolve():reject(new Error('update failed'));
        };
      });
      worker.postMessage({type:'REFRESH_CACHE',version:deployed},[channel.port2]);
      await completed;
      localStorage.setItem(VERSION_KEY,deployed);
      reloadOnce();
    }catch(_error){
      // Offline or failed checks keep the currently working cache untouched.
    }
  }

  window.addEventListener('load',async function(){
    try{
      const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      await checkDeployment(registration);
    }catch(_error){
      // The site remains fully usable when registration or updating is unavailable.
    }
  });
})();
