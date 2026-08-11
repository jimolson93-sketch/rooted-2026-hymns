
(()=>{
const hymns=window.ROOTED_HYMNS||[];
const el={search:document.getElementById('searchInput'),indexBtn:document.getElementById('indexBtn'),allBtn:document.getElementById('showAllBtn'),settingsBtn:document.getElementById('settingsBtn'),drawer:document.getElementById('settingsDrawer'),slider:document.getElementById('fontSizeSlider'),display:document.getElementById('fontSizeDisplay'),minus:document.getElementById('fontDecreaseBtn'),plus:document.getElementById('fontIncreaseBtn'),index:document.getElementById('index'),hymns:document.getElementById('hymns')};
let current=null, mode='idle', expandedIndex=null, suppressNextChange=false;
const STANDALONE_SCROLL_BUFFER=40;
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clearStandaloneScrollTails(){document.querySelectorAll('#hymns > .hymn').forEach(h=>h.style.removeProperty('--standalone-scroll-tail'))}
function updateStandaloneScrollTail(hymn){
 if(!hymn||mode!=='hymn'||!hymn.classList.contains('show'))return;
 hymn.style.setProperty('--standalone-scroll-tail','0px');
 const title=hymn.querySelector('h2');
 if(!title)return;
 const viewportHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,window.visualViewport?.height||0);
 const titleTop=title.getBoundingClientRect().top+window.scrollY;
 const documentHeight=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);
 const extra=Math.max(0,Math.ceil(titleTop+viewportHeight-8-documentHeight+STANDALONE_SCROLL_BUFFER));
 hymn.style.setProperty('--standalone-scroll-tail',`${extra}px`);
}
function refreshStandaloneScrollTail(){if(mode==='hymn'&&current!==null)updateStandaloneScrollTail(document.getElementById(`hymn-${current}`))}
function hymnBody(h){let vn=0;return h.stanzas.map(s=>{if(!s.chorus&&!s.unnumbered)vn++;return `<div class="stanza${s.chorus?' chorus':''}${s.medley?' medley-section':''}">`+s.lines.map((line,i)=>`<p class="line">${(!s.chorus&&!s.unnumbered&&i===0)?`<span class="verse-number">${vn}.</span>`:'<span class="verse-number"></span>'}<span class="line-text">${esc(line)}</span></p>`).join('')+'</div>'}).join('')}
function render(){
 el.index.innerHTML=hymns.map(h=>`<a href="#hymn-${h.number}" data-num="${h.number}" aria-expanded="false"><strong>${h.number}.</strong> ${esc(h.title)}</a><div class="index-hymn" data-num="${h.number}" role="region" aria-label="${h.number}. ${esc(h.title)}"><article class="hymn">${hymnBody(h)}</article></div>`).join('');
 el.hymns.innerHTML=hymns.map(h=>`<article class="hymn" id="hymn-${h.number}" data-num="${h.number}"><h2>${h.number}. ${esc(h.title)}</h2>${hymnBody(h)}</article>`).join('');
 el.index.addEventListener('click',e=>{const a=e.target.closest('a[data-num]');if(!a)return;e.preventDefault();const n=+a.dataset.num;const drawer=el.index.querySelector(`.index-hymn[data-num="${n}"]`);if(expandedIndex!==null){const oldLink=el.index.querySelector(`a[data-num="${expandedIndex}"]`);const oldDrawer=el.index.querySelector(`.index-hymn[data-num="${expandedIndex}"]`);oldLink.classList.remove('index-expanded');oldLink.setAttribute('aria-expanded','false');oldDrawer.classList.remove('open')}if(expandedIndex===n){expandedIndex=null;return}drawer.classList.add('open');a.classList.add('index-expanded');a.setAttribute('aria-expanded','true');expandedIndex=n;requestAnimationFrame(()=>{const rowTop=a.getBoundingClientRect().top;if(rowTop<8)window.scrollBy({top:rowTop-8,behavior:'smooth'})})})
}
function clearModes(){document.body.classList.remove('show-all-mode');el.index.classList.remove('show');document.querySelectorAll('.hymn.show').forEach(x=>x.classList.remove('show'));clearStandaloneScrollTails();document.querySelectorAll('.index-hymn.open').forEach(x=>x.classList.remove('open'));document.querySelectorAll('#index a.index-expanded').forEach(x=>{x.classList.remove('index-expanded');x.setAttribute('aria-expanded','false')});expandedIndex=null;el.indexBtn.classList.remove('active');el.allBtn.classList.remove('active')}
function showIdle(){clearModes();mode='idle';current=null}
function showIndex(){clearModes();mode='index';current=null;el.index.classList.add('show');el.indexBtn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function showAll(){clearModes();mode='all';current=null;document.body.classList.add('show-all-mode');el.allBtn.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function showHymn(n,scrollBehavior='smooth'){if(!Number.isInteger(n)||n<1||n>hymns.length)return;clearModes();mode='hymn';current=n;const a=document.getElementById(`hymn-${n}`);a.classList.add('show');updateStandaloneScrollTail(a);history.replaceState(null,'',`#hymn-${n}`);const scrollToTitle=()=>{const title=a.querySelector('h2');const y=title.getBoundingClientRect().top+window.pageYOffset-8;window.scrollTo({top:y,behavior:scrollBehavior})};scrollBehavior==='auto'?scrollToTitle():setTimeout(scrollToTitle,30)}
window.ROOTED_SHOW_HYMN=showHymn;
function doSearch(){const n=parseInt(el.search.value,10);if(n>=1&&n<=hymns.length){showHymn(n);el.search.blur()}else if(el.search.value.trim()){el.search.select()}}
el.search.addEventListener('input',()=>{if(!el.search.value.trim()&&mode==='hymn')showIdle()});el.search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();suppressNextChange=true;doSearch();setTimeout(()=>{suppressNextChange=false},0)}});el.search.addEventListener('change',()=>{if(suppressNextChange){suppressNextChange=false;return}doSearch()});
el.indexBtn.addEventListener('click',()=>{el.search.value='';mode==='index'?showIdle():showIndex()});el.allBtn.addEventListener('click',()=>{el.search.value='';mode==='all'?showIdle():showAll()});el.settingsBtn.addEventListener('click',()=>{const open=el.drawer.classList.toggle('open');el.settingsBtn.classList.toggle('active',open);el.drawer.setAttribute('aria-hidden',String(!open))});
function setZoom(v){v=Math.max(60,Math.min(100,Math.round(v/5)*5));el.slider.value=v;el.display.textContent=v+'%';document.documentElement.style.setProperty('--hymn-scale',v/100);localStorage.setItem('rooted-hymn-size',String(v));requestAnimationFrame(refreshStandaloneScrollTail)}el.slider.addEventListener('input',()=>setZoom(+el.slider.value));el.minus.addEventListener('click',()=>setZoom(+el.slider.value-5));el.plus.addEventListener('click',()=>setZoom(+el.slider.value+5));
window.addEventListener('resize',()=>requestAnimationFrame(refreshStandaloneScrollTail));
window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(refreshStandaloneScrollTail));
render();setZoom(+(localStorage.getItem('rooted-hymn-size')||75));const m=location.hash.match(/^#hymn-(\d+)$/);if(m)showHymn(+m[1]);
})();
