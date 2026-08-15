
(()=>{
const hymns=window.ROOTED_HYMNS||[];
const ENABLE_TEXT_SEARCH=true;
const el={search:document.getElementById('searchInput'),indexBtn:document.getElementById('indexBtn'),allBtn:document.getElementById('showAllBtn'),settingsBtn:document.getElementById('settingsBtn'),drawer:document.getElementById('settingsDrawer'),slider:document.getElementById('fontSizeSlider'),display:document.getElementById('fontSizeDisplay'),minus:document.getElementById('fontDecreaseBtn'),plus:document.getElementById('fontIncreaseBtn'),index:document.getElementById('index'),hymns:document.getElementById('hymns')};
let current=null,mode='idle',expandedIndex=null,suppressNextChange=false,searchMode='number';
let searchModeBtn=null,searchResults=null;
let numberSearchEdited=false,numberSearchSubmitted=false,cancelNumberBlurSearch=false;
const STANDALONE_SCROLL_BUFFER=40;
const ALL_HYMNS_TOP_THRESHOLD=420;
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeRegex(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function createAllHymnsTopButton(){
 const style=document.createElement('style');
 style.textContent=`#allHymnsTopBtn{position:fixed;right:max(4px,calc(env(safe-area-inset-right) - 8px));bottom:calc(6px + env(safe-area-inset-bottom));z-index:30;width:60px;height:60px;border:0;background:transparent;color:#fff;font:700 24px/1 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .16s ease,transform .16s ease,visibility .16s ease;-webkit-tap-highlight-color:transparent;isolation:isolate}#allHymnsTopBtn::before{content:"";position:absolute;inset:8px;border:1px solid rgba(96,104,95,.42);border-radius:50%;background:rgba(96,104,95,.92);box-shadow:0 4px 14px rgba(35,40,34,.22);z-index:-1;transition:transform .12s ease}#allHymnsTopBtn.visible{opacity:.94;visibility:visible;transform:translateY(0)}#allHymnsTopBtn:active::before{transform:scale(.96)}@media(min-width:701px){#allHymnsTopBtn{right:max(10px,calc(env(safe-area-inset-right) - 8px));bottom:calc(10px + env(safe-area-inset-bottom))}}@media(prefers-reduced-motion:reduce){#allHymnsTopBtn{transition:none}#allHymnsTopBtn::before{transition:none}}`;
 document.head.appendChild(style);
 const button=document.createElement('button');button.id='allHymnsTopBtn';button.type='button';button.setAttribute('aria-label','Back to top');button.setAttribute('aria-hidden','true');button.textContent='↑';button.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));document.body.appendChild(button);return button;
}
const allHymnsTopBtn=createAllHymnsTopButton();
function updateAllHymnsTopButton(){const visible=(mode==='all'||mode==='index')&&window.scrollY>ALL_HYMNS_TOP_THRESHOLD;allHymnsTopBtn.classList.toggle('visible',visible);allHymnsTopBtn.setAttribute('aria-hidden',String(!visible));allHymnsTopBtn.tabIndex=visible?0:-1}
function cancelNumberBlurOnce(){cancelNumberBlurSearch=true;setTimeout(()=>{cancelNumberBlurSearch=false},180)}
[el.indexBtn,el.allBtn,el.settingsBtn].forEach(button=>button?.addEventListener('pointerdown',cancelNumberBlurOnce,{passive:true}));
function injectTextSearchStyles(){
 const style=document.createElement('style');
 style.textContent=`.search-input-shell{position:relative;width:100%}.search-input-shell #searchInput{padding-right:72px}.search-mode-btn{position:absolute;right:9px;top:50%;transform:translateY(-50%);min-width:48px;height:34px;padding:0 9px;border:1px solid rgba(96,104,95,.45);border-radius:9px;background:linear-gradient(180deg,var(--accent),var(--accent-2));color:#fff;font-size:12px;font-weight:800;letter-spacing:.01em;cursor:pointer;z-index:2}.search-mode-btn:active{transform:translateY(-50%) scale(.97)}.search-mode-btn.words{min-width:50px}.search-results{display:none}.search-results.show{display:block}.search-results-summary{padding:3px 8px 10px;color:#747a72;font-size:13px}.search-results-empty{padding:24px 10px;text-align:center;color:var(--muted);font-size:14px}.search-result{display:block;width:100%;margin:0 0 8px;padding:12px 38px 12px 12px;position:relative;border:1px solid #d9ddd6;border-radius:10px;background:#fff;color:var(--text);text-align:left;cursor:pointer;box-shadow:0 2px 7px rgba(25,30,24,.035)}.search-result:hover{background:#fafbf9}.search-result:active{background:#f4f6f2}.search-result::after{content:'›';position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:25px;font-weight:400;color:#7d857a}.search-result-title{display:block;font-size:15px;font-weight:750;line-height:1.25;color:#4e584c}.search-result-snippet{display:-webkit-box;margin-top:5px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-size:13px;line-height:1.35;color:#62685f}.search-result-title-match{display:block;margin-top:5px;font-size:12px;font-style:italic;color:#7b8178}.search-result mark{padding:0;background:rgba(116,125,114,.18);color:inherit;font-weight:750}@media(max-width:700px){.search-result{padding-top:11px;padding-bottom:11px}.search-results-summary{padding-left:6px}}`;
 document.head.appendChild(style);
}
function initTextSearch(){
 if(!ENABLE_TEXT_SEARCH)return;
 injectTextSearchStyles();
 const shell=document.createElement('div');shell.className='search-input-shell';el.search.parentNode.insertBefore(shell,el.search);shell.appendChild(el.search);
 searchModeBtn=document.createElement('button');searchModeBtn.type='button';searchModeBtn.className='search-mode-btn';shell.appendChild(searchModeBtn);searchModeBtn.addEventListener('pointerdown',cancelNumberBlurOnce,{passive:true});
 searchResults=document.createElement('div');searchResults.className='search-results';searchResults.setAttribute('aria-live','polite');el.index.parentNode.insertBefore(searchResults,el.index);
 searchModeBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSearchMode(searchMode==='number'?'text':'number',{focus:true,reset:true})});
 searchResults.addEventListener('click',e=>{const result=e.target.closest('.search-result[data-num]');if(!result)return;const n=+result.dataset.num;searchMode='number';applySearchModeUI();el.search.value=String(n);el.search.blur();showHymn(n)});
 applySearchModeUI();
}
function applySearchModeUI(){
 if(!ENABLE_TEXT_SEARCH||!searchModeBtn)return;
 const words=searchMode==='text';
 searchModeBtn.textContent=words?'ABC':'#';searchModeBtn.classList.toggle('words',words);searchModeBtn.setAttribute('aria-label',words?'Switch to hymn number search':'Switch to word search');searchModeBtn.title=words?'Switch to hymn number search':'Switch to word search';
 el.search.placeholder=words?'Search words or number…':'Go to hymn…';el.search.setAttribute('inputmode',words?'text':'numeric');el.search.setAttribute('enterkeyhint',words?'search':'done');el.search.setAttribute('aria-label',words?'Search hymn titles, lyrics, or hymn number':'Go to hymn');el.search.autocomplete='off';el.search.spellcheck=false;
 if(words){el.search.removeAttribute('pattern');el.search.setAttribute('autocapitalize','none')}else{el.search.setAttribute('pattern','[0-9]*');el.search.removeAttribute('autocapitalize')}
}
function setSearchMode(next,{focus=false,reset=true}={}){
 if(!ENABLE_TEXT_SEARCH)return;
 const refocus=focus;el.search.blur();searchMode=next;
 if(reset){el.search.value='';showIdle()}
 applySearchModeUI();
 if(refocus)setTimeout(()=>el.search.focus(),30);
}
function normalizeSearchText(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘`']/g,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase()}
function highlightMatch(text,tokens){
 if(!tokens.length)return esc(text);
 const pattern=tokens.slice().sort((a,b)=>b.length-a.length).map(escapeRegex).join('|');if(!pattern)return esc(text);
 const re=new RegExp(`(${pattern})`,'ig');return String(text).split(re).map((part,i)=>i%2?`<mark>${esc(part)}</mark>`:esc(part)).join('');
}
function findTextMatches(query){
 const q=normalizeSearchText(query);if(q.length<2)return[];const tokens=[...new Set(q.split(' ').filter(Boolean))];
 return hymns.map(h=>{
  const titleNorm=normalizeSearchText(h.title);const titleExact=titleNorm.includes(q);const titleAll=tokens.every(t=>titleNorm.includes(t));let bestLine=null,bestScore=0;
  h.stanzas.forEach(s=>s.lines.forEach(line=>{const norm=normalizeSearchText(line);const exact=norm.includes(q);const all=tokens.every(t=>norm.includes(t));const score=exact?3:(all?2:0);if(score>bestScore){bestScore=score;bestLine=line}}));
  if(!titleExact&&!titleAll&&!bestLine)return null;
  const titleScore=titleExact?5:(titleAll?4:0);return{h,titleMatch:titleScore>=bestScore,line:titleScore>=bestScore?null:bestLine,score:Math.max(titleScore,bestScore),tokens};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.h.number-b.h.number);
}
function clearSearchResults(){if(searchResults){searchResults.classList.remove('show');searchResults.innerHTML=''}}
function renderTextSearchResults(query){
 if(!ENABLE_TEXT_SEARCH||searchMode!=='text')return;const raw=query.trim();const q=normalizeSearchText(query);
 if(!raw){showIdle();return}
 if(/^\d+$/.test(raw)){
  const n=Number(raw);const hymn=hymns.find(h=>h.number===n);clearModes();mode='search';current=null;
  const summary=hymn?`1 result for “${esc(raw)}”`:`No exact hymn for “${esc(raw)}”`;
  searchResults.innerHTML=`<div class="search-results-summary">${summary}</div>`+(hymn?`<button type="button" class="search-result" data-num="${hymn.number}" aria-label="Open hymn ${hymn.number}, ${esc(hymn.title)}"><span class="search-result-title"><mark>${hymn.number}</mark>. ${esc(hymn.title)}</span><span class="search-result-title-match">Hymn number match</span></button>`:`<div class="search-results-empty">No hymn found with that number.</div>`);
  searchResults.classList.add('show');updateAllHymnsTopButton();return;
 }
 if(q.length<2){showIdle();return}
 const matches=findTextMatches(query);clearModes();mode='search';current=null;
 const summary=`${matches.length} result${matches.length===1?'':'s'} for “${esc(query.trim())}”`;
 searchResults.innerHTML=`<div class="search-results-summary">${summary}</div>`+(matches.length?matches.map(r=>`<button type="button" class="search-result" data-num="${r.h.number}" aria-label="Open hymn ${r.h.number}, ${esc(r.h.title)}"><span class="search-result-title">${r.h.number}. ${highlightMatch(r.h.title,r.tokens)}</span>${r.titleMatch?'<span class="search-result-title-match">Title match</span>':`<span class="search-result-snippet">${highlightMatch(r.line,r.tokens)}</span>`}</button>`).join(''):`<div class="search-results-empty">No hymns found.</div>`);
 searchResults.classList.add('show');updateAllHymnsTopButton();
}
function clearStandaloneScrollTails(){document.querySelectorAll('#hymns > .hymn').forEach(h=>h.style.removeProperty('--standalone-scroll-tail'))}
function updateStandaloneScrollTail(hymn){if(!hymn||mode!=='hymn'||!hymn.classList.contains('show'))return;hymn.style.setProperty('--standalone-scroll-tail','0px');const title=hymn.querySelector('h2');if(!title)return;const viewportHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,window.visualViewport?.height||0);const titleTop=title.getBoundingClientRect().top+window.scrollY;const documentHeight=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);const extra=Math.max(0,Math.ceil(titleTop+viewportHeight-8-documentHeight+STANDALONE_SCROLL_BUFFER));hymn.style.setProperty('--standalone-scroll-tail',`${extra}px`)}
function refreshStandaloneScrollTail(){if(mode==='hymn'&&current!==null)updateStandaloneScrollTail(document.getElementById(`hymn-${current}`))}
function hymnBody(h){let vn=0;return h.stanzas.map(s=>{if(!s.chorus&&!s.unnumbered)vn++;return `<div class="stanza${s.chorus?' chorus':''}${s.bridge?' bridge':''}${s.medley?' medley-section':''}">`+s.lines.map((line,i)=>`<p class="line">${(!s.chorus&&!s.unnumbered&&i===0)?`<span class="verse-number">${vn}.</span>`:'<span class="verse-number"></span>'}<span class="line-text">${esc(line)}</span></p>`).join('')+'</div>'}).join('')}
function render(){
 el.index.innerHTML=hymns.map(h=>`<a href="#hymn-${h.number}" data-num="${h.number}" aria-expanded="false"><strong>${h.number}.</strong> ${esc(h.title)}</a><div class="index-hymn" data-num="${h.number}" role="region" aria-label="${h.number}. ${esc(h.title)}"><article class="hymn">${hymnBody(h)}</article></div>`).join('');
 el.hymns.innerHTML=hymns.map(h=>`<article class="hymn" id="hymn-${h.number}" data-num="${h.number}"><h2>${h.number}. ${esc(h.title)}</h2>${hymnBody(h)}</article>`).join('');
 el.index.addEventListener('click',e=>{const a=e.target.closest('a[data-num]');if(!a)return;e.preventDefault();const n=+a.dataset.num;const drawer=el.index.querySelector(`.index-hymn[data-num="${n}"]`);if(expandedIndex!==null){const oldLink=el.index.querySelector(`a[data-num="${expandedIndex}"]`);const oldDrawer=el.index.querySelector(`.index-hymn[data-num="${expandedIndex}"]`);oldLink.classList.remove('index-expanded');oldLink.setAttribute('aria-expanded','false');oldDrawer.classList.remove('open')}if(expandedIndex===n){expandedIndex=null;return}drawer.classList.add('open');a.classList.add('index-expanded');a.setAttribute('aria-expanded','true');expandedIndex=n;requestAnimationFrame(()=>{const rowTop=a.getBoundingClientRect().top;if(rowTop<8)window.scrollBy({top:rowTop-8,behavior:'smooth'})})})
}
function clearModes(){document.body.classList.remove('show-all-mode');el.index.classList.remove('show');document.querySelectorAll('.hymn.show').forEach(x=>x.classList.remove('show'));clearStandaloneScrollTails();document.querySelectorAll('.index-hymn.open').forEach(x=>x.classList.remove('open'));document.querySelectorAll('#index a.index-expanded').forEach(x=>{x.classList.remove('index-expanded');x.setAttribute('aria-expanded','false')});expandedIndex=null;el.indexBtn.classList.remove('active');el.allBtn.classList.remove('active');clearSearchResults();updateAllHymnsTopButton()}
function showIdle(){clearModes();mode='idle';current=null;updateAllHymnsTopButton()}
function showIndex(){clearModes();mode='index';current=null;el.index.classList.add('show');el.indexBtn.classList.add('active');updateAllHymnsTopButton();window.scrollTo({top:0,behavior:'smooth'})}
function showAll(){clearModes();mode='all';current=null;document.body.classList.add('show-all-mode');el.allBtn.classList.add('active');updateAllHymnsTopButton();window.scrollTo({top:0,behavior:'smooth'})}
function showHymn(n,scrollBehavior='smooth'){if(!Number.isInteger(n)||n<1||n>hymns.length)return;clearModes();mode='hymn';current=n;const a=document.getElementById(`hymn-${n}`);a.classList.add('show');updateStandaloneScrollTail(a);updateAllHymnsTopButton();history.replaceState(null,'',`#hymn-${n}`);const scrollToTitle=()=>{const title=a.querySelector('h2');const y=title.getBoundingClientRect().top+window.pageYOffset-8;window.scrollTo({top:y,behavior:scrollBehavior})};scrollBehavior==='auto'?scrollToTitle():setTimeout(scrollToTitle,30)}
window.ROOTED_SHOW_HYMN=showHymn;
function doSearch(){const n=parseInt(el.search.value,10);if(n>=1&&n<=hymns.length){showHymn(n);el.search.blur()}else if(el.search.value.trim()){el.search.select()}}
el.search.addEventListener('focus',()=>{if(searchMode==='number'){numberSearchEdited=false;numberSearchSubmitted=false}});
el.search.addEventListener('input',()=>{if(ENABLE_TEXT_SEARCH&&searchMode==='text'){renderTextSearchResults(el.search.value);return}numberSearchEdited=true;if(!el.search.value.trim()&&mode==='hymn')showIdle()});
el.search.addEventListener('keydown',e=>{if(ENABLE_TEXT_SEARCH&&searchMode==='text'){if(e.key==='Enter')e.preventDefault();return}if(e.key==='Enter'){e.preventDefault();numberSearchSubmitted=true;suppressNextChange=true;doSearch();setTimeout(()=>{suppressNextChange=false},0)}});
el.search.addEventListener('change',()=>{if(ENABLE_TEXT_SEARCH&&searchMode==='text')return;if(suppressNextChange){suppressNextChange=false;return}numberSearchSubmitted=true;doSearch()});
el.search.addEventListener('blur',()=>{if(searchMode!=='number')return;setTimeout(()=>{if(cancelNumberBlurSearch){numberSearchEdited=false;numberSearchSubmitted=false;return}if(numberSearchEdited&&!numberSearchSubmitted&&el.search.value.trim()&&(mode==='idle'||mode==='hymn')){numberSearchSubmitted=true;doSearch()}numberSearchEdited=false;numberSearchSubmitted=false},0)});
el.indexBtn.addEventListener('click',()=>{el.search.value='';mode==='index'?showIdle():showIndex()});el.allBtn.addEventListener('click',()=>{el.search.value='';mode==='all'?showIdle():showAll()});el.settingsBtn.addEventListener('click',()=>{const open=el.drawer.classList.toggle('open');el.settingsBtn.classList.toggle('active',open);el.drawer.setAttribute('aria-hidden',String(!open))});
function setZoom(v){v=Math.max(60,Math.min(100,Math.round(v/5)*5));el.slider.value=v;el.display.textContent=v+'%';document.documentElement.style.setProperty('--hymn-scale',v/100);localStorage.setItem('rooted-hymn-size',String(v));requestAnimationFrame(refreshStandaloneScrollTail)}el.slider.addEventListener('input',()=>setZoom(+el.slider.value));el.minus.addEventListener('click',()=>setZoom(+el.slider.value-5));el.plus.addEventListener('click',()=>setZoom(+el.slider.value+5));
window.addEventListener('scroll',updateAllHymnsTopButton,{passive:true});window.addEventListener('resize',()=>requestAnimationFrame(()=>{refreshStandaloneScrollTail();updateAllHymnsTopButton()}));window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(()=>{refreshStandaloneScrollTail();updateAllHymnsTopButton()}));
render();initTextSearch();setZoom(+(localStorage.getItem('rooted-hymn-size')||75));updateAllHymnsTopButton();const m=location.hash.match(/^#hymn-(\d+)$/);if(m)showHymn(+m[1]);
})();
