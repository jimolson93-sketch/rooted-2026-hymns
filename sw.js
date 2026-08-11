'use strict';

const CACHE_PREFIX='rooted-hymns-';
const CACHE_VERSION='2026.08.11.3';
const APP_FILES=[
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css?v=20260811-2',
  './data/hymns.js?v=20260811-3',
  './js/app.js?v=20260811-2',
  './js/reading-enhancements.js?v=20260810-3',
  './js/update.js?v=20260811',
  './version.json'
];

function cacheName(version){return CACHE_PREFIX+version;}

async function populate(version){
  const name=cacheName(version);
  const cache=await caches.open(name);
  await cache.addAll(APP_FILES.map(function(url){return new Request(url,{cache:'reload'});}));
  return name;
}

async function removeOldCaches(keep){
  const names=await caches.keys();
  await Promise.all(names.filter(function(name){
    return name.startsWith(CACHE_PREFIX)&&name!==keep;
  }).map(function(name){return caches.delete(name);}));
}

self.addEventListener('install',function(event){
  event.waitUntil(populate(CACHE_VERSION).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate',function(event){
  event.waitUntil(removeOldCaches(cacheName(CACHE_VERSION)).then(function(){return self.clients.claim();}));
});

self.addEventListener('message',function(event){
  if(event.data&&event.data.type==='SKIP_WAITING'){
    self.skipWaiting();
    return;
  }
  if(!event.data||event.data.type!=='REFRESH_CACHE')return;
  const version=event.data.version;
  event.waitUntil(populate(version).then(async function(){
    const keep=cacheName(version);
    await removeOldCaches(keep);
    if(event.ports[0])event.ports[0].postMessage({ok:true});
  }).catch(function(){
    if(event.ports[0])event.ports[0].postMessage({ok:false});
  }));
});

self.addEventListener('fetch',function(event){
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(function(response){
      const copy=response.clone();
      caches.open(cacheName(CACHE_VERSION)).then(function(cache){cache.put('./index.html',copy);});
      return response;
    }).catch(function(){
      return caches.match('./index.html').then(function(response){return response||caches.match('./');});
    }));
    return;
  }

  event.respondWith(caches.match(event.request).then(function(cached){
    return cached||fetch(event.request);
  }));
});
