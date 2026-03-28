// ════════════════════════════════════════════════════════════
// DEFAULT TAGS — référentiel de base (peut être étendu)
// Les IDs existants sont préservés pour ne pas casser les données
// ════════════════════════════════════════════════════════════
const DEFAULT_TAGS = [
  {
    id:'design-system', label:'Design System', e:'🧱', color:'#5B21B6',
    desc:'Ressources traitant de la bibliothèque de composants, de la documentation centrale et de la "source unique de vérité" (Source of Truth).',
  },
  {
    id:'accessibilite', label:'Accessibilité', e:'♿', color:'#237A38',
    desc:'Focus technique sur la conformité aux normes (WCAG 2.2/3.0, RGAA). Inclut la navigation clavier, les lecteurs d\'écran et les contrastes.',
  },
  {
    id:'inclusivite', label:'Inclusivité', e:'🤝', color:'#0891B2',
    desc:'Dimension humaine et éthique du design. Couvre la diversité, l\'équité, la réduction des biais cognitifs et le design pour tous les genres/cultures.',
  },
  {
    id:'audit-conformite', label:'Audit & conformité', e:'📋', color:'#B45309',
    desc:'Aspects légaux et réglementaires (ex: European Accessibility Act 2025/2026), sécurité des données, et processus de contrôle qualité (QA).',
  },
  {
    id:'experience-machine', label:'Expérience-Machine (MX)', e:'🤖', color:'#6D28D9',
    desc:'Optimisation du design pour les agents IA. Concerne la structure des données (JSON, metadata) que l\'IA doit lire pour comprendre une interface.',
  },
  {
    id:'spatial-ui', label:'Spatial UI', e:'🥽', color:'#0F766E',
    desc:'Interfaces immersives et 3D (AR/VR/XR). Gestion de la profondeur, du regard (eye-tracking), et des environnements spatiaux (type Vision Pro).',
  },
  {
    id:'design-to-code', label:'Design-to-Code', e:'⚡', color:'#1A5FA8',
    desc:'Flux de travail liés au handover. Automatisation de la traduction du design en code (CSS-in-JS, composants React/Vue, export auto).',
  },
  {
    id:'gouvernance', label:'Gouvernance', e:'🏛️', color:'#D93D0A',
    desc:'Processus de décision, rôles des contributeurs, cycle de vie des composants, versioning et stratégies d\'adoption au sein de l\'entreprise.',
  },
  {
    id:'ia-generation', label:'IA & Génération', e:'✨', color:'#A85309',
    desc:'Utilisation de l\'IA générative pour créer des interfaces (Generative UI), des prompts système ou automatiser des tâches créatives répétitives.',
  },
  {
    id:'tokens', label:'Tokens', e:'🎨', color:'#276749',
    desc:'Gestion des design tokens (variables sémantiques). Architecture des styles pour le multi-mode (Light/Dark) et le multi-plateforme.',
  },
  {
    id:'figma', label:'Figma & Plugins', e:'✏️', color:'#9D174D',
    desc:'Tout ce qui concerne l\'outil de design principal, l\'utilisation des variables Figma, l\'organisation des fichiers et les extensions de workflow.',
  },
  {
    id:'storybook', label:'Storybook', e:'📖', color:'#C05621',
    desc:'Documentation technique des composants isolés, tests visuels en environnement sandbox et pont entre designers et développeurs Front-end.',
  },
  {
    id:'cursor', label:'Cursor & AI IDE', e:'💻', color:'#0369A1',
    desc:'Développement assisté par IA. Ressources sur l\'utilisation d\'éditeurs de code intelligents pour accélérer l\'intégration du design.',
  },
  {
    id:'veille', label:'Veille', e:'📡', color:'#65635C',
    desc:'Tendances prospectives, études de cas inspirantes, benchmarks concurrentiels et nouveaux usages émergents dans l\'industrie.',
  },
  {
    id:'e-commerce', label:'E-commerce', e:'🛒', color:'#BE185D',
    desc:'Problématiques spécifiques à la vente en ligne : parcours d\'achat, optimisation de la conversion, interfaces transactionnelles et checkouts.',
  },
];

const DATA_PATH = 'data/resources.json';

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let resources    = [];
let customTags   = [];   // tags custom persistés dans le JSON
let activeFilter = 'all';
let activeTags   = [];   // tags sélectionnés dans l'add panel
let activeId     = null;

// Config — localStorage uniquement
let cfg = {
  repo:         localStorage.getItem('gh-repo')        || '',
  token:        localStorage.getItem('gh-token')       || '',
  branch:       localStorage.getItem('gh-branch')      || 'main',
  anthropicKey: localStorage.getItem('anthropic-key')  || '',
};

// ════════════════════════════════════════════════════════════
// TAGS — liste complète (défauts + custom)
// ════════════════════════════════════════════════════════════
function allTags() {
  return [...DEFAULT_TAGS, ...customTags];
}

function tagById(id) {
  return allTags().find(t => t.id === id);
}

// CSS inline pour un tag dynamique
function tagStyle(tag) {
  const hex  = tag.color || '#6366F1';
  const bg   = hex + '18';
  const border = hex + '55';
  return `background:${bg};color:${hex};border-color:${border};`;
}

function pillHTML(tid, editable = false) {
  const t = tagById(tid);
  if (!t) return '';
  const style = tagStyle(t);
  const rm = editable
    ? `<button class="pill-remove" onclick="removeTagFromResource('${tid}')" title="Retirer ce tag">×</button>`
    : '';
  return `<span class="pill" style="${style}">${t.e} ${t.label}${rm}</span>`;
}

// ════════════════════════════════════════════════════════════
// GITHUB API
// ════════════════════════════════════════════════════════════
function ghHeaders() {
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghRead() {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${DATA_PATH}?ref=${cfg.branch}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  const data = await r.json();
  return {
    json: JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))),
    sha: data.sha
  };
}

async function ghWrite(json, sha) {
  const url  = `https://api.github.com/repos/${cfg.repo}/contents/${DATA_PATH}`;
  const body = {
    message: `chore: update knowledge base [${new Date().toISOString().slice(0,10)}]`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2)))),
    sha, branch: cfg.branch,
  };
  const r = await fetch(url, { method:'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.status); }
}

// ════════════════════════════════════════════════════════════
// LOAD / PUSH
// ════════════════════════════════════════════════════════════
async function loadFromGitHub() {
  if (!cfg.repo || !cfg.token) { setConnBadge('gh','none'); return; }
  setConnBadge('gh','busy','chargement…');
  try {
    const { json } = await ghRead();
    // Le JSON contient { resources, customTags } ou simplement []
    if (Array.isArray(json)) {
      resources  = json;
      customTags = [];
    } else {
      resources  = json.resources  || [];
      customTags = json.customTags || [];
    }
    setConnBadge('gh','ok','synced');
    setConnError('gh', null);
    updateUI();
  } catch(e) {
    setConnBadge('gh','error','erreur');
    setConnError('gh', parseGhError(e));
  }
}

async function pushToGitHub() {
  if (!cfg.repo || !cfg.token) return;
  setConnBadge('gh','busy','sauvegarde…');
  try {
    const { sha } = await ghRead();
    await ghWrite({ resources, customTags }, sha);
    setConnBadge('gh','ok','synced');
  } catch(e) {
    setConnBadge('gh','error','erreur');
    setConnError('gh', parseGhError(e));
    throw e;
  }
}

function updateUI() {
  render();
  renderTagFilters();
  renderTagSelector();
  updateAddPanelMode();
}

// ════════════════════════════════════════════════════════════
// NO-API MODE
// ════════════════════════════════════════════════════════════
function isApiConfigured() {
  return !!cfg.anthropicKey;
}

function updateAddPanelMode() {
  const banner  = document.getElementById('no-api-banner');
  const btnUrl  = document.getElementById('btn-url');
  const btnText = document.getElementById('btn-text');
  const tabs    = document.getElementById('add-tabs');

  if (isApiConfigured()) {
    banner.classList.remove('visible');
    if (btnUrl)  { btnUrl.textContent  = '✨ Analyser'; btnUrl.onclick = handleAddUrl; }
    if (btnText) { btnText.textContent = '✨ Analyser le texte'; btnText.onclick = addFromText; }
    if (tabs)    tabs.style.display = '';
  } else {
    banner.classList.add('visible');
    if (btnUrl)  { btnUrl.textContent  = '+ Ajouter'; btnUrl.onclick = openManualModal; }
    if (btnText) tabs.style.display = 'none'; // le mode texte n'a pas de sens sans IA
  }
}

// ════════════════════════════════════════════════════════════
// CONNECTION BADGES & ERRORS
// ════════════════════════════════════════════════════════════
function setConnBadge(which, state, label) {
  const dot = document.getElementById(`${which}-dot`);
  const lbl = document.getElementById(`${which}-label`);
  if (!dot || !lbl) return;
  dot.className = 'conn-dot';
  if (state==='ok')    { dot.classList.add('ok');    lbl.textContent = label || 'connecté'; }
  if (state==='error') { dot.classList.add('error'); lbl.textContent = label || 'erreur'; }
  if (state==='busy')  { dot.classList.add('busy');  lbl.textContent = label || '…'; }
  if (state==='none')  { lbl.textContent = label || '—'; }
}

function setConnError(which, msg) {
  const el = document.getElementById(`${which}-error`);
  if (!el) return;
  if (msg) { el.textContent = msg; el.classList.add('visible'); }
  else     { el.textContent = '';  el.classList.remove('visible'); }
}

// ════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════
function toast(msg, type='ok') {
  const c  = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = (type==='ok' ? '✓ ' : '✕ ') + msg;
  c.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, 3000);
}

// ════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════
function loadConfig() {
  document.getElementById('cfg-repo').value      = cfg.repo;
  document.getElementById('cfg-token').value     = cfg.token;
  document.getElementById('cfg-branch').value    = cfg.branch;
  document.getElementById('cfg-anthropic').value = cfg.anthropicKey;
}

async function saveGitHub() {
  cfg.repo   = document.getElementById('cfg-repo').value.trim();
  cfg.token  = document.getElementById('cfg-token').value.trim();
  cfg.branch = document.getElementById('cfg-branch').value.trim() || 'main';
  localStorage.setItem('gh-repo',   cfg.repo);
  localStorage.setItem('gh-token',  cfg.token);
  localStorage.setItem('gh-branch', cfg.branch);
  setConnError('gh', null);
  if (!cfg.repo || !cfg.token) {
    setConnBadge('gh','none'); setConnError('gh','Remplis le repo et le token.'); return;
  }
  const btn = document.getElementById('gh-save-btn');
  btn.disabled = true; btn.textContent = 'Connexion…';
  setConnBadge('gh','busy');
  try {
    const { json } = await ghRead();
    if (Array.isArray(json)) { resources = json; customTags = []; }
    else { resources = json.resources||[]; customTags = json.customTags||[]; }
    setConnBadge('gh','ok','synced');
    toast(`GitHub connecté — ${resources.length} ressource${resources.length>1?'s':''} chargée${resources.length>1?'s':''}`);
    updateUI();
  } catch(e) {
    const m = parseGhError(e); setConnBadge('gh','error','erreur'); setConnError('gh',m); toast(m,'err');
  }
  btn.disabled = false; btn.textContent = 'Tester la connexion';
}

async function saveClaude() {
  cfg.anthropicKey = document.getElementById('cfg-anthropic').value.trim();
  localStorage.setItem('anthropic-key', cfg.anthropicKey);
  setConnError('claude', null);
  if (!cfg.anthropicKey) { setConnBadge('claude','none'); setConnError('claude','Renseigne ta clé API.'); return; }
  const btn = document.getElementById('claude-save-btn');
  btn.disabled = true; btn.textContent = 'Test…';
  setConnBadge('claude','busy');
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': cfg.anthropicKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true',
      },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:1, messages:[{role:'user',content:'ok'}] }),
    });
    if (!r.ok) { const e=await r.json(); throw new Error(e.error?.message||String(r.status)); }
    setConnBadge('claude','ok','validée');
    toast('Clé Claude validée ✓');
    updateAddPanelMode();
  } catch(e) {
    const m = parseClaudeError(e); setConnBadge('claude','error','erreur'); setConnError('claude',m); toast(m,'err');
  }
  btn.disabled = false; btn.textContent = 'Tester la clé';
}

function parseGhError(e) {
  const m = e.message||'';
  if (m.includes('404'))  return 'Repo introuvable. Format attendu : "username/repo-name".';
  if (m.includes('401'))  return 'Token invalide ou expiré.';
  if (m.includes('403'))  return 'Accès refusé. Vérifie les permissions du token (Contents: Read & Write).';
  return `Erreur réseau : ${m.slice(0,60)}`;
}
function parseClaudeError(e) {
  const m = (e.message||'').toLowerCase();
  if (m.includes('401')||m.includes('invalid x-api-key')||m.includes('authentication')) return 'Clé API invalide.';
  if (m.includes('403')) return 'Accès refusé. Vérifie que la clé est active.';
  if (m.includes('429')) return 'Quota dépassé ou rate limit.';
  return `Erreur : ${(e.message||'').slice(0,60)}`;
}

// ════════════════════════════════════════════════════════════
// BURGER
// ════════════════════════════════════════════════════════════
function toggleSidebar() {
  const a = document.querySelector('aside');
  const o = document.getElementById('sidebar-overlay');
  const open = a.classList.toggle('open');
  o.classList.toggle('open', open);
}
function closeSidebar() {
  document.querySelector('aside').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pane-'+id).classList.add('active');
}

// ════════════════════════════════════════════════════════════
// TAG SELECTOR (add panel)
// ════════════════════════════════════════════════════════════
function renderTagSelector(containerId = 'tag-selector') {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  allTags().forEach(t => {
    const b = document.createElement('button');
    b.className = 'tag-toggle' + (activeTags.includes(t.id) ? ' on' : '');
    b.textContent = `${t.e} ${t.label}`;
    if (activeTags.includes(t.id)) b.style.cssText = tagStyle(t).replace('border-color','border-color');
    b.onclick = () => {
      activeTags.includes(t.id)
        ? activeTags.splice(activeTags.indexOf(t.id),1)
        : activeTags.push(t.id);
      renderTagSelector(containerId);
    };
    c.appendChild(b);
  });
}

// ════════════════════════════════════════════════════════════
// TAG FILTERS (sidebar)
// ════════════════════════════════════════════════════════════
function renderTagFilters() {
  const c = document.getElementById('tag-filters');
  c.innerHTML = '';
  document.getElementById('ct-all').textContent = resources.length;
  allTags().forEach(t => {
    const n = resources.filter(r=>r.tags?.includes(t.id)).length;
    if (!n) return;
    const b = document.createElement('button');
    b.className = 'filter-btn' + (activeFilter===t.id ? ' active' : '');
    b.innerHTML = `${t.e} ${t.label} <span class="fc">${n}</span>`;
    b.onclick = () => { setFilter(t.id,b); closeSidebar(); };
    c.appendChild(b);
  });
}

function setFilter(id, btn) {
  activeFilter = id;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ════════════════════════════════════════════════════════════
// RENDER CARDS
// ════════════════════════════════════════════════════════════
function render() {
  const q    = document.getElementById('search').value.toLowerCase();
  const sort = document.querySelector('.sort-sel').value;
  const grid = document.getElementById('grid');

  let list = resources.filter(r => {
    const fOk = activeFilter==='all' || r.tags?.includes(activeFilter);
    const sOk = !q || [r.title,r.summary,r.tldr].some(s=>s?.toLowerCase().includes(q));
    return fOk && sOk;
  });
  if (sort==='new') list.sort((a,b)=>b.createdAt-a.createdAt);
  if (sort==='old') list.sort((a,b)=>a.createdAt-b.createdAt);
  if (sort==='az')  list.sort((a,b)=>a.title.localeCompare(b.title));

  document.getElementById('list-label').textContent =
    list.length===resources.length ? 'Toutes les ressources' : `${list.length} résultat${list.length>1?'s':''}`;
  document.getElementById('total-badge').textContent =
    `${resources.length} ressource${resources.length>1?'s':''}`;

  if (!list.length) {
    grid.innerHTML = resources.length===0
      ? `<div class="empty"><div class="empty-ico">🗂️</div><h3>Base vide</h3><p>Ajoutez votre première ressource ci-dessus.</p></div>`
      : `<div class="empty"><div class="empty-ico">🔍</div><h3>Aucun résultat</h3><p>Essayez d'autres termes ou changez le filtre.</p></div>`;
    return;
  }

  grid.innerHTML = '';
  list.forEach(r => {
    const domain = (()=>{try{return new URL(r.url).hostname.replace('www.','');}catch{return '';}})();
    const fav    = domain
      ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.parentElement.textContent='📄'"/>`
      : '📄';
    const tagPills = (r.tags||[]).map(tid=>pillHTML(tid)).join('');
    const date = new Date(r.createdAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});

    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = e => { if (!e.target.closest('.icon-btn')) openDetail(r.id); };
    card.innerHTML = `
      <div class="card-top">
        <div class="favicon">${fav}</div>
        <div class="card-meta">
          <div class="card-title">${r.title}</div>
          <div class="card-domain">${domain||'texte collé'}</div>
        </div>
        <div class="card-actions">
          ${r.url?`<button class="icon-btn" onclick="window.open('${r.url}','_blank')">🔗</button>`:''}
          <button class="icon-btn del" onclick="deleteRes('${r.id}')">🗑️</button>
        </div>
      </div>
      <div class="card-summary">${r.summary}</div>
      <div class="pills">${tagPills}</div>
      <div class="card-foot">
        <span class="card-date">${date}</span>
        <button class="more-btn" onclick="openDetail('${r.id}')">Voir les insights →</button>
      </div>`;
    grid.appendChild(card);
  });
}

// ════════════════════════════════════════════════════════════
// ADD — URL handler (mode IA ou mode manuel)
// ════════════════════════════════════════════════════════════
function handleAddUrl() {
  if (isApiConfigured()) addFromUrl();
  else openManualModal();
}

// ════════════════════════════════════════════════════════════
// ADD — IA mode
// ════════════════════════════════════════════════════════════
async function addFromUrl() {
  const url = document.getElementById('url-input').value.trim();
  if (!url) { showStatus('Collez une URL.','err'); return; }
  setLoading('btn-url',true);
  showStatus('Analyse avec Claude…','loading');
  try {
    const data = await callClaude(buildPrompt(url,null));
    await createResource({...data, url});
    document.getElementById('url-input').value='';
    showStatus('Ressource ajoutée ✓','ok');
    toast('Ressource ajoutée et sauvegardée sur GitHub');
  } catch(e) {
    showStatus('Erreur : '+e.message,'err');
    toast(e.message,'err');
  }
  setLoading('btn-url',false);
}

async function addFromText() {
  const text = document.getElementById('text-input').value.trim();
  if (!text) { showStatus('Collez du texte.','err'); return; }
  setLoading('btn-text',true);
  showStatus('Analyse avec Claude…','loading');
  try {
    const data = await callClaude(buildPrompt(null,text));
    await createResource({...data, url:''});
    document.getElementById('text-input').value='';
    showStatus('Ressource ajoutée ✓','ok');
    toast('Ressource ajoutée et sauvegardée');
  } catch(e) {
    showStatus('Erreur : '+e.message,'err');
    toast(e.message,'err');
  }
  setLoading('btn-text',false);
}

// ════════════════════════════════════════════════════════════
// ADD — Manuel mode
// ════════════════════════════════════════════════════════════
function openManualModal() {
  const url = document.getElementById('url-input').value.trim();
  document.getElementById('man-url').value     = url;
  document.getElementById('man-title').value   = '';
  document.getElementById('man-summary').value = '';
  document.getElementById('man-insights').value= '';
  document.getElementById('man-error').classList.remove('visible');
  document.getElementById('man-error').textContent = '';
  activeTags = [];
  renderTagSelector('man-tag-selector');
  document.getElementById('manual-overlay').classList.add('open');
  if (url) fetchManualMeta();
}

function onManualUrlChange() {
  // reset titre si l'URL change après un fetch
  const fetchBtn = document.getElementById('man-fetch-btn');
  fetchBtn.textContent = 'Récupérer le titre';
  fetchBtn.classList.remove('loading');
}

async function fetchManualMeta() {
  const url = document.getElementById('man-url').value.trim();
  if (!url) return;
  const btn = document.getElementById('man-fetch-btn');
  btn.classList.add('loading');
  btn.textContent = 'Chargement…';
  try {
    // Microlink API — gratuit, pas de CORS, extrait title + description
    const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const d = await r.json();
    if (d.status==='success' && d.data) {
      if (d.data.title   && !document.getElementById('man-title').value)
        document.getElementById('man-title').value = d.data.title;
      if (d.data.description && !document.getElementById('man-summary').value)
        document.getElementById('man-summary').value = d.data.description;
    }
    btn.textContent = '✓ Récupéré';
  } catch {
    btn.textContent = 'Récupérer le titre';
  }
  btn.classList.remove('loading');
}

async function submitManual() {
  const url      = document.getElementById('man-url').value.trim();
  const title    = document.getElementById('man-title').value.trim();
  const summary  = document.getElementById('man-summary').value.trim();
  const rawIns   = document.getElementById('man-insights').value.trim();
  const errEl    = document.getElementById('man-error');

  errEl.classList.remove('visible');

  if (!title)              { errEl.textContent='Le titre est obligatoire.';         errEl.classList.add('visible'); return; }
  if (!summary)            { errEl.textContent='La description est obligatoire.';   errEl.classList.add('visible'); return; }
  if (!activeTags.length)  { errEl.textContent='Sélectionne au moins un tag.';      errEl.classList.add('visible'); return; }

  const insights = rawIns ? rawIns.split('\n').map(s=>s.trim()).filter(Boolean) : [];

  try {
    await createResource({ url, title, summary, tldr: summary, insights, suggestedTags: [] });
    closeOverlay('manual-overlay');
    toast('Ressource ajoutée ✓');
    document.getElementById('url-input').value = '';
  } catch(e) {
    errEl.textContent = 'Erreur de sauvegarde : ' + e.message;
    errEl.classList.add('visible');
  }
}

// ════════════════════════════════════════════════════════════
// CREATE RESOURCE (commun IA + manuel)
// ════════════════════════════════════════════════════════════
async function createResource(data) {
  const resource = {
    id:        Date.now().toString(),
    url:       data.url || '',
    title:     data.title || 'Ressource importée',
    summary:   data.summary || '',
    tldr:      data.tldr || data.summary || '',
    insights:  data.insights || [],
    tags:      mergeTags(data.suggestedTags||[], activeTags),
    notes:     '',
    createdAt: Date.now(),
  };
  resources.unshift(resource);
  await pushToGitHub();
  activeTags = [];
  updateUI();
  return resource;
}

// ════════════════════════════════════════════════════════════
// CLAUDE API
// ════════════════════════════════════════════════════════════
function buildPrompt(url, text) {
  const tagList = allTags().map(t=>`${t.id} (${t.label})`).join(', ');
  const source  = url ? `URL : ${url}` : `Contenu texte :\n\n${text.slice(0,4000)}`;
  return `Tu es un assistant DesignOps expert. Analyse cette ressource et produis une fiche de documentation.

${source}

Contexte mission : DesignOps chez Cdiscount. Sujets : design system, design-to-code, RGAA/accessibilité, gouvernance, plugins Figma, génération IA, tokens, Storybook, Cursor, MCP.

Réponds UNIQUEMENT en JSON valide, sans backticks :
{
  "title": "Titre court (max 80 chars)",
  "summary": "1-2 phrases (max 200 chars)",
  "tldr": "TL;DR approfondi, pertinence DesignOps (150-250 mots)",
  "insights": ["insight 1","insight 2","insight 3","insight 4","insight 5"],
  "suggestedTags": ["tag-id-1","tag-id-2"]
}

Tags disponibles (1 à 3 max) : ${tagList}`;
}

async function callClaude(prompt) {
  if (!cfg.anthropicKey) throw new Error('Clé API Claude manquante — configure-la dans la sidebar.');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key': cfg.anthropicKey,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true',
    },
    body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:prompt}] }),
  });
  if (!r.ok) { const e=await r.json(); throw new Error(e.error?.message||`${r.status}`); }
  const d   = await r.json();
  const raw = d.content?.map(b=>b.text||'').join('')||'';
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch { return { title:'Ressource importée', summary:raw.slice(0,200), tldr:raw, insights:[], suggestedTags:[] }; }
}

function mergeTags(suggested, manual) {
  return [...new Set([...suggested,...manual])].filter(id=>tagById(id));
}

// ════════════════════════════════════════════════════════════
// MARKDOWN RENDERER (inline, léger)
// **gras** _italique_ __souligné__ ==surligné== `code`
// ════════════════════════════════════════════════════════════
function renderMd(text) {
  if (!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/==(.+?)==/g,'<mark>$1</mark>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/__(.+?)__/g,'<u>$1</u>')
    .replace(/_(.+?)_/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="background:var(--surface2);border-radius:3px;padding:1px 4px;font-family:var(--mono);font-size:.9em;">$1</code>');
}

// ════════════════════════════════════════════════════════════
// DETAIL MODAL — ouverture
// ════════════════════════════════════════════════════════════
function openDetail(id) {
  const r = resources.find(x=>x.id===id);
  if (!r) return;
  activeId = id;

  // Toujours démarrer en mode lecture
  exitEditMode(false);

  const domain = (()=>{try{return new URL(r.url).hostname.replace('www.','');}catch{return '';}})();
  document.getElementById('m-fav').innerHTML = domain
    ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.textContent='📄'"/>`
    : '📄';
  document.getElementById('m-title').textContent  = r.title;
  document.getElementById('m-domain').textContent = r.url || 'Texte collé';
  document.getElementById('m-tldr').textContent   = r.tldr || r.summary;
  document.getElementById('m-notes').value        = r.notes || '';

  const linkBtn = document.getElementById('m-link-btn');
  if (r.url) { linkBtn.style.display=''; linkBtn.onclick=()=>window.open(r.url,'_blank'); }
  else linkBtn.style.display='none';

  renderDetailInsights(r);
  renderDetailTags(r);

  // Fermer le quick-tag-add si ouvert
  document.getElementById('quick-tag-add').style.display = 'none';

  document.getElementById('detail-overlay').classList.add('open');
}

function renderDetailInsights(r) {
  document.getElementById('m-insights').innerHTML =
    (r.insights||[]).map((ins,i)=>
      `<div class="insight"><div class="insight-n">${i+1}</div><div>${renderMd(ins)}</div></div>`
    ).join('') || `<div class="insight"><span style="color:var(--text3)">Aucun insight.</span></div>`;
}

function renderDetailTags(r) {
  const el = document.getElementById('m-tags');
  el.innerHTML = (r.tags||[]).map(tid=>pillHTML(tid, true)).join('')
    || `<span style="color:var(--text3);font-size:12px">Aucun tag</span>`;
}

// ════════════════════════════════════════════════════════════
// MODE ÉDITION
// ════════════════════════════════════════════════════════════
function enterEditMode() {
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;

  // Titre
  document.getElementById('m-title').style.display       = 'none';
  document.getElementById('m-title-input').style.display = '';
  document.getElementById('m-title-input').value         = r.title;

  // TL;DR
  document.getElementById('tldr-read').style.display      = 'none';
  document.getElementById('m-tldr-edit').style.display    = '';
  document.getElementById('m-tldr-edit').value            = r.tldr || r.summary || '';

  // Insights
  document.getElementById('insights-read-block').style.display = 'none';
  document.getElementById('insights-edit-block').style.display = '';
  document.getElementById('m-insights-edit').value = (r.insights||[]).join('\n');

  // Footer
  document.getElementById('foot-read').style.display = 'none';
  document.getElementById('foot-edit').style.display = '';

  // Bouton modifier
  document.getElementById('m-edit-btn').style.display = 'none';

  setTimeout(()=>document.getElementById('m-title-input').focus(), 50);
}

function exitEditMode(render = true) {
  document.getElementById('m-title').style.display       = '';
  document.getElementById('m-title-input').style.display = 'none';

  document.getElementById('tldr-read').style.display   = '';
  document.getElementById('m-tldr-edit').style.display = 'none';

  document.getElementById('insights-read-block').style.display = '';
  document.getElementById('insights-edit-block').style.display = 'none';

  document.getElementById('foot-read').style.display = '';
  document.getElementById('foot-edit').style.display = 'none';

  document.getElementById('m-edit-btn').style.display = '';

  switchEditorTab('edit');

  if (render && activeId) {
    const r = resources.find(x=>x.id===activeId);
    if (r) { renderDetailInsights(r); renderDetailTags(r); }
  }
}

async function saveEdit() {
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;

  const newTitle    = document.getElementById('m-title-input').value.trim();
  const newTldr     = document.getElementById('m-tldr-edit').value.trim();
  const rawInsights = document.getElementById('m-insights-edit').value;

  if (!newTitle) { toast('Le titre ne peut pas être vide.','err'); return; }

  r.title    = newTitle;
  r.tldr     = newTldr;
  r.insights = rawInsights.split('\n').map(s=>s.trim()).filter(Boolean);

  // Mettre à jour l'affichage en mode lecture
  document.getElementById('m-title').textContent = r.title;
  document.getElementById('m-tldr').textContent  = r.tldr;
  exitEditMode(false);
  renderDetailInsights(r);

  try {
    await pushToGitHub();
    render();
    toast('Modifications enregistrées ✓');
  } catch(e) {
    toast('Erreur de sauvegarde','err');
  }
}

// ════════════════════════════════════════════════════════════
// TOGGLE ÉDITER / APERÇU
// ════════════════════════════════════════════════════════════
function switchEditorTab(tab) {
  const editPane    = document.getElementById('editor-pane-edit');
  const previewPane = document.getElementById('editor-pane-preview');
  const tabEdit     = document.getElementById('tab-edit');
  const tabPreview  = document.getElementById('tab-preview');
  if (!editPane) return; // éléments pas encore dans le DOM

  if (tab === 'preview') {
    // Générer l'aperçu depuis le contenu actuel du textarea
    const raw     = document.getElementById('m-insights-edit').value;
    const lines   = raw.split('\n').map(s=>s.trim()).filter(Boolean);
    const preview = document.getElementById('editor-preview-content');

    preview.innerHTML = lines.length
      ? lines.map((ins,i) =>
          `<div class="insight"><div class="insight-n">${i+1}</div><div>${renderMd(ins)}</div></div>`
        ).join('')
      : `<div class="insight"><span style="color:var(--text3)">Aucun insight à prévisualiser.</span></div>`;

    editPane.style.display    = 'none';
    previewPane.style.display = '';
    tabEdit.classList.remove('active');
    tabPreview.classList.add('active');
  } else {
    editPane.style.display    = '';
    previewPane.style.display = 'none';
    tabEdit.classList.add('active');
    tabPreview.classList.remove('active');
    document.getElementById('m-insights-edit').focus();
  }
}

// ════════════════════════════════════════════════════════════
// TOOLBAR MARKDOWN
// ════════════════════════════════════════════════════════════
function mdWrap(before, after) {
  const ta  = document.getElementById('m-insights-edit');
  const s   = ta.selectionStart;
  const e   = ta.selectionEnd;
  const sel = ta.value.slice(s, e) || 'texte';
  ta.value  = ta.value.slice(0,s) + before + sel + after + ta.value.slice(e);
  ta.selectionStart = s + before.length;
  ta.selectionEnd   = s + before.length + sel.length;
  ta.focus();
}

// ════════════════════════════════════════════════════════════
// QUICK TAG ADD
// ════════════════════════════════════════════════════════════
let quickTagSelection = [];

function toggleQuickTagAdd() {
  const panel = document.getElementById('quick-tag-add');
  const open  = panel.style.display === 'none';
  panel.style.display = open ? '' : 'none';

  if (open) {
    const r = resources.find(x=>x.id===activeId);
    const existing = r?.tags || [];
    quickTagSelection = [];
    renderQuickTagSelector(existing);
  }
}

function renderQuickTagSelector(existingTags) {
  const c = document.getElementById('m-tag-selector');
  c.innerHTML = '';
  allTags()
    .filter(t => !existingTags.includes(t.id)) // seulement les tags non déjà présents
    .forEach(t => {
      const b = document.createElement('button');
      const on = quickTagSelection.includes(t.id);
      b.className = 'tag-toggle' + (on ? ' on' : '');
      b.textContent = `${t.e} ${t.label}`;
      if (on) { const s=tagStyle(t); b.style.cssText=s; }
      b.onclick = () => {
        on ? quickTagSelection.splice(quickTagSelection.indexOf(t.id),1) : quickTagSelection.push(t.id);
        renderQuickTagSelector(existingTags);
      };
      c.appendChild(b);
    });

  if (c.children.length === 0)
    c.innerHTML = '<span style="font-size:12px;color:var(--text3);">Tous les tags sont déjà appliqués.</span>';
}

async function applyQuickTags() {
  if (!quickTagSelection.length) { toggleQuickTagAdd(); return; }
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;
  r.tags = [...new Set([...(r.tags||[]), ...quickTagSelection])];
  renderDetailTags(r);
  toggleQuickTagAdd();
  render();
  try { await pushToGitHub(); toast(`${quickTagSelection.length} tag${quickTagSelection.length>1?'s':''} ajouté${quickTagSelection.length>1?'s':''} ✓`); }
  catch(e) { toast('Erreur de sauvegarde','err'); }
  quickTagSelection = [];
}

function renderDetailTags(r) {
  const el = document.getElementById('m-tags');
  el.innerHTML = (r.tags||[]).map(tid=>pillHTML(tid, true)).join('')
    || `<span style="color:var(--text3);font-size:12px">Aucun tag</span>`;
}

async function removeTagFromResource(tid) {
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;
  r.tags = (r.tags||[]).filter(t=>t!==tid);
  renderDetailTags(r);
  render();
  try { await pushToGitHub(); toast('Tag retiré ✓'); }
  catch(e) { toast('Erreur de sauvegarde','err'); }
}

async function saveNotes() {
  if (!activeId) return;
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;
  r.notes = document.getElementById('m-notes').value;
  showStatus('Sauvegarde…','loading');
  try {
    await pushToGitHub();
    showStatus('Notes sauvegardées ✓','ok');
    toast('Notes sauvegardées');
  } catch(e) { showStatus('Erreur','err'); toast('Erreur de sauvegarde','err'); }
}

async function deleteActive() {
  if (!activeId||!confirm('Supprimer cette ressource ?')) return;
  await deleteRes(activeId);
  closeOverlay('detail-overlay');
}

async function deleteRes(id) {
  if (!activeId && !confirm('Supprimer cette ressource ?')) return;
  resources = resources.filter(r=>r.id!==id);
  try { await pushToGitHub(); updateUI(); }
  catch(e) { toast('Erreur de suppression','err'); }
}

// ════════════════════════════════════════════════════════════
// TAG MANAGER
// ════════════════════════════════════════════════════════════
let showDescriptions = false;

function openTagManager() {
  showDescriptions = false;
  const btn = document.getElementById('toggle-desc-btn');
  if (btn) btn.textContent = '👁 Afficher les descriptions';
  renderTagManagerList();
  document.getElementById('tagmgr-overlay').classList.add('open');
}

function toggleDescriptions() {
  showDescriptions = !showDescriptions;
  const btn = document.getElementById('toggle-desc-btn');
  if (btn) btn.textContent = showDescriptions ? '🙈 Masquer les descriptions' : '👁 Afficher les descriptions';
  renderTagManagerList();
}

function renderTagManagerList() {
  const c = document.getElementById('tagmgr-list');
  const tags = allTags();
  if (!tags.length) { c.innerHTML='<p style="color:var(--text3);font-size:13px;">Aucun thème.</p>'; return; }

  c.innerHTML = '';
  tags.forEach(t => {
    const usageCount = resources.filter(r=>r.tags?.includes(t.id)).length;
    const isDefault  = DEFAULT_TAGS.some(d=>d.id===t.id);
    const canDelete  = !isDefault && usageCount===0;
    const style      = tagStyle(t);
    const safeDesc   = (t.desc||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;');

    // Ligne principale
    const item = document.createElement('div');
    item.className = 'tagmgr-item';
    item.dataset.id = t.id;
    item.innerHTML = `
      <span class="tagmgr-preview" style="${style}">${t.e} ${t.label}</span>
      <span class="tagmgr-usage">${usageCount > 0 ? `${usageCount} ressource${usageCount>1?'s':''}` : isDefault ? 'défaut' : ''}</span>
      <div class="tagmgr-actions">
        <button class="btn sm" onclick="toggleTagEdit('${t.id}')">✏️ Modifier</button>
        ${canDelete
          ? `<button class="btn sm danger" style="margin-left:0;" onclick="deleteTag('${t.id}')">🗑️</button>`
          : `<button class="btn sm" disabled title="${usageCount>0?'Retirez-le des ressources d\'abord':'Tag système'}" style="opacity:.3;cursor:not-allowed;margin-left:0;">🗑️</button>`
        }
      </div>`;

    // Description (masquée par défaut, révélée par toggle)
    const descRow = document.createElement('div');
    descRow.className = 'tagmgr-desc-row' + (showDescriptions && t.desc ? ' visible' : '');
    descRow.id = `desc-${t.id}`;
    descRow.innerHTML = t.desc
      ? `<p class="tagmgr-desc-text">${t.desc}</p>`
      : `<p class="tagmgr-desc-empty">Aucune description.</p>`;

    // Zone d'édition inline
    const editRow = document.createElement('div');
    editRow.className = 'tagmgr-edit-row';
    editRow.id = `edit-${t.id}`;
    editRow.innerHTML = `
      <div class="tagmgr-edit-fields">
        <input type="text" id="edit-emoji-${t.id}" value="${t.e}" maxlength="2"
          style="width:44px;text-align:center;font-size:18px;padding:5px 4px;border:1px solid var(--border);border-radius:var(--r);background:var(--bg);outline:none;flex-shrink:0;"/>
        <input type="text" id="edit-name-${t.id}" value="${t.label}"
          style="flex:1;min-width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r);background:var(--bg);font-size:13px;outline:none;"/>
        <input type="color" id="edit-color-${t.id}" value="${t.color||'#6366F1'}"
          style="width:40px;height:32px;border:1px solid var(--border);border-radius:var(--r);cursor:pointer;padding:2px;background:var(--bg);flex-shrink:0;"/>
      </div>
      <div style="margin-top:6px;">
        <label style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px;">Description <span style="font-weight:400;">(optionnelle)</span></label>
        <textarea id="edit-desc-${t.id}" rows="2"
          placeholder="À quoi sert ce thème ? Quels types de ressources y classer ?"
          style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--bg);font-size:11px;font-family:inherit;resize:vertical;line-height:1.5;outline:none;">${t.desc||''}</textarea>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button class="btn primary sm" onclick="saveTagEdit('${t.id}')">Valider</button>
        <button class="btn sm" onclick="toggleTagEdit('${t.id}')">Annuler</button>
      </div>`;

    c.appendChild(item);
    c.appendChild(descRow);
    c.appendChild(editRow);
  });
}

function toggleTagEdit(id) {
  // Fermer les autres zones d'édition ouvertes
  document.querySelectorAll('.tagmgr-edit-row.open').forEach(r => {
    if (r.id !== `edit-${id}`) r.classList.remove('open');
  });
  const row = document.getElementById(`edit-${id}`);
  row.classList.toggle('open');
  if (row.classList.contains('open')) {
    setTimeout(() => row.querySelector(`#edit-name-${id}`)?.focus(), 50);
  }
}

async function saveTagEdit(id) {
  const emoji = document.getElementById(`edit-emoji-${id}`).value.trim() || '🏷️';
  const name  = document.getElementById(`edit-name-${id}`).value.trim();
  const color = document.getElementById(`edit-color-${id}`).value;
  const desc  = document.getElementById(`edit-desc-${id}`).value.trim();

  if (!name) { toast('Le nom est obligatoire','err'); return; }

  // Mise à jour dans DEFAULT_TAGS ou customTags
  const defIdx = DEFAULT_TAGS.findIndex(t=>t.id===id);
  if (defIdx >= 0) {
    DEFAULT_TAGS[defIdx] = { ...DEFAULT_TAGS[defIdx], e:emoji, label:name, color, desc };
  } else {
    const cIdx = customTags.findIndex(t=>t.id===id);
    if (cIdx >= 0) customTags[cIdx] = { ...customTags[cIdx], e:emoji, label:name, color, desc };
  }

  try {
    await pushToGitHub();
    toast(`Thème "${name}" mis à jour`);
    renderTagManagerList();
    updateUI();
  } catch(e) { toast('Erreur de sauvegarde','err'); }
}

async function deleteTag(id) {
  if (!confirm('Supprimer ce thème définitivement ?')) return;
  customTags = customTags.filter(t=>t.id!==id);
  try {
    await pushToGitHub();
    toast('Thème supprimé');
    renderTagManagerList();
    if (activeFilter===id) {
      activeFilter='all';
      document.querySelectorAll('.filter-btn')[0]?.classList.add('active');
    }
    updateUI();
  } catch(e) { toast('Erreur de sauvegarde','err'); }
}

async function addCustomTag() {
  const emoji = document.getElementById('new-tag-emoji').value.trim() || '🏷️';
  const name  = document.getElementById('new-tag-name').value.trim();
  const color = document.getElementById('new-tag-color').value;
  const desc  = document.getElementById('new-tag-desc').value.trim();
  const errEl = document.getElementById('new-tag-error');
  errEl.classList.remove('visible');

  if (!name) { errEl.textContent='Le nom est obligatoire.'; errEl.classList.add('visible'); return; }
  if (allTags().some(t=>t.label.toLowerCase()===name.toLowerCase())) {
    errEl.textContent='Un thème avec ce nom existe déjà.'; errEl.classList.add('visible'); return;
  }

  const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').slice(0,30)
    + '-' + Date.now().toString(36);

  customTags.push({ id, label:name, e:emoji, color, desc });

  try {
    await pushToGitHub();
    toast(`Thème "${name}" créé`);
    document.getElementById('new-tag-emoji').value = '';
    document.getElementById('new-tag-name').value  = '';
    document.getElementById('new-tag-color').value = '#6366F1';
    document.getElementById('new-tag-desc').value  = '';
    renderTagManagerList();
    updateUI();
  } catch(e) {
    customTags.pop();
    errEl.textContent='Erreur de sauvegarde.';
    errEl.classList.add('visible');
  }
}

// ════════════════════════════════════════════════════════════
// MARKDOWN EXPORT
// ════════════════════════════════════════════════════════════
function toMd(r) {
  const tags = (r.tags||[]).map(id=>{const t=tagById(id);return t?`#${id}`:''}).filter(Boolean).join(' ');
  const date = new Date(r.createdAt).toLocaleDateString('fr-FR');
  const ins  = (r.insights||[]).map((s,i)=>`${i+1}. ${s}`).join('\n');
  return `## ${r.title}\n\n**URL :** ${r.url||'N/A'}\n**Date :** ${date}\n**Tags :** ${tags||'aucun'}\n\n### TL;DR\n${r.tldr||r.summary}\n\n### Insights clés\n${ins||'N/A'}\n${r.notes?`\n### Notes\n${r.notes}\n`:''}\n---`;
}

function copyMd() {
  const r = resources.find(x=>x.id===activeId);
  if (!r) return;
  navigator.clipboard.writeText(toMd(r));
  toast('Markdown copié');
}

function openExport() {
  const md = `# DesignOps Knowledge Base — Cdiscount\n*${new Date().toLocaleDateString('fr-FR')} · ${resources.length} ressource(s)*\n\n`
    + resources.map(toMd).join('\n\n');
  document.getElementById('export-box').textContent = md;
  document.getElementById('export-overlay').classList.add('open');
}

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('export-box').textContent);
  toast('Export copié');
}

// ════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  if (id==='detail-overlay') activeId=null;
}

function showStatus(msg, type) {
  const el   = document.getElementById('status');
  const spin = document.getElementById('spin');
  el.className = 'status show '+type;
  document.getElementById('status-msg').textContent = msg;
  spin.style.display = type==='loading' ? 'block' : 'none';
  if (type!=='loading') setTimeout(()=>{ el.className='status'; }, 3500);
}

function setLoading(btnId, on) {
  document.getElementById(btnId).disabled = on;
}

document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
    closeSidebar();
    activeId = null;
  }
});

// ════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════
loadConfig();
renderTagSelector();
renderTagFilters();
render();
updateAddPanelMode();

if (cfg.anthropicKey) setConnBadge('claude','ok','validée');
else setConnBadge('claude','none','—');

loadFromGitHub();