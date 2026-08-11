
(()=>{
const hymns=window.ROOTED_HYMNS||[];
const el={search:document.getElementById('searchInput'),indexBtn:document.getElementById('indexBtn'),allBtn:document.getElementById('showAllBtn'),settingsBtn:document.getElementById('settingsBtn'),drawer:document.getElementById('settingsDrawer'),slider:document.getElementById('fontSizeSlider'),display:document.getElementById('fontSizeDisplay'),minus:document.getElementById('fontDecreaseBtn'),plus:document.getElementById('fontIncreaseBtn'),index:document.getElementById('index'),hymns:document.getElementById('hymns')};
let current=null, mode='index';
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function render(){
 el.index.innerHTML=hymns.map(h=>`<a href="#hymn-${h.number}" data-num="${h.number}"><strong>${h.number}.</strong> ${esc(h.title)}</a>`).join('');
 el.hymns.innerHTML=hymns.map(h=>{let vn=0; const sts=h.stanzas.map(s=>{if(!s.chorus)vn++; return `<div class="stanza${s.chorus?' chorus':''}">`+s.lines.map((line,i)=>`<p class="line">${(!s.chorus&&i===0)?`<span class="verse-number">${vn}.</span>`:'<span class="verse-number"></span>'}<span class="line-text">${esc(line)}</span></p>`).join('')+'</div>'}).join(''); return `<article class="hymn" id="hymn-${h.number}" data-num="${h.number}"><h2>${h.number}. ${esc(h.title)}</h2>${sts}</article>`}).join('');
 el.index.addEventListener('click',e=>{const a=e.target.closest('a[data-num]');if(a){e.preventDefault();showHymn(+a.dataset.num)}})
}
function clearModes(){document.body.classList.remove('show-all-mode');el.index.classList.remove('show');document.querySelectorAll('.hymn.show').forEach(x=>x.classList.remove('show'));el.indexBtn.classList.remove('active');el.allBtn.classList.remove('active')}
function showIndex(){clearModes();mode='index';current=null;el.index.classList.add('show');el.indexBtn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function showAll(){clearModes();mode='all';current=null;document.body.classList.add('show-all-mode');el.allBtn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function showHymn(n){if(!Number.isInteger(n)||n<1||n>hymns.length)return;clearModes();mode='hymn';current=n;const a=document.getElementById(`hymn-${n}`);a.classList.add('show');history.replaceState(null,'',`#hymn-${n}`);setTimeout(()=>a.scrollIntoView({block:'start'}),0)}
function doSearch(){const n=parseInt(el.search.value,10);if(n>=1&&n<=hymns.length){showHymn(n);el.search.blur()}else if(el.search.value.trim()){el.search.select()}}
el.search.addEventListener('input',()=>{if(/^\d+$/.test(el.search.value)){const n=+el.search.value;if(n>=1&&n<=hymns.length)showHymn(n)}});el.search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doSearch()}});el.search.addEventListener('change',doSearch);
el.indexBtn.addEventListener('click',()=>{el.search.value='';showIndex()});el.allBtn.addEventListener('click',()=>{el.search.value='';showAll()});el.settingsBtn.addEventListener('click',()=>{const open=el.drawer.classList.toggle('open');el.settingsBtn.classList.toggle('active',open);el.drawer.setAttribute('aria-hidden',String(!open))});
function setZoom(v){v=Math.max(60,Math.min(100,Math.round(v/5)*5));el.slider.value=v;el.display.textContent=v+'%';document.documentElement.style.setProperty('--hymn-scale',v/100);localStorage.setItem('rooted-hymn-size',String(v))}el.slider.addEventListener('input',()=>setZoom(+el.slider.value));el.minus.addEventListener('click',()=>setZoom(+el.slider.value-5));el.plus.addEventListener('click',()=>setZoom(+el.slider.value+5));
let sx=0,sy=0;document.addEventListener('touchstart',e=>{if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});document.addEventListener('touchend',e=>{if(mode!=='hymn'||!current)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25){if(dx<0&&current<hymns.length)showHymn(current+1);if(dx>0&&current>1)showHymn(current-1)}},{passive:true});
render();setZoom(+(localStorage.getItem('rooted-hymn-size')||100));const m=location.hash.match(/^#hymn-(\d+)$/);m?showHymn(+m[1]):showIndex();
})();
