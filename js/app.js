// ════════════════════════════════════════════════════════════
// DATA — Tags référentiel
// ════════════════════════════════════════════════════════════
const TAGS = [
  { id: 'design-system',  label: 'Design System',   e: '🧱' },
  { id: 'accessibilite',  label: 'Accessibilité',   e: '♿' },
  { id: 'design-to-code', label: 'Design-to-Code',  e: '⚡' },
  { id: 'gouvernance',    label: 'Gouvernance',      e: '🏛️' },
  { id: 'ia-generation',  label: 'IA & Génération', e: '🤖' },
  { id: 'tokens',         label: 'Tokens',           e: '🎨' },
  { id: 'figma',          label: 'Figma & Plugins',  e: '✏️' },
  { id: 'storybook',      label: 'Storybook',        e: '📖' },
  { id: 'cursor',         label: 'Cursor & AI IDE',  e: '💻' },
  { id: 'veille',         label: 'Veille',           e: '📡' },
];

const DATA_PATH = 'data/resources.json';

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let resources    = [];
let activeFilter = 'all';
let activeTags   = [];
let activeId     = null;

// Config — stockée en localStorage uniquement, jamais dans le repo
let cfg = {
  repo:         localStorage.getItem('gh-repo')        || '',
  token:        localStorage.getItem('gh-token')       || '',
  branch:       localStorage.getItem('gh-branch')      || 'main',
  anthropicKey: localStorage.getItem('anthropic-key')  || '',
};

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
  if (!r.ok) throw new Error(`GitHub read error: ${r.status}`);
  const data = await r.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { json: JSON.parse(content), sha: data.sha };
}

async function ghWrite(json, sha) {
  const url     = `https://api.github.com/repos/${cfg.repo}/contents/${DATA_PATH}`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(json, null, 2))));
  const body    = {
    message: `chore: update knowledge base [${new Date().toISOString().slice(0, 10)}]`,
    content,
    sha,
    branch: cfg.branch,
  };
  const r = await fetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.message || `GitHub write error: ${r.status}`);
  }
}

async function loadFromGitHub() {
  if (!cfg.repo || !cfg.token) { setSyncState('none'); return; }
  setSyncState('busy', 'Chargement…');
  try {
    const { json } = await ghRead();
    resources = json;
    setSyncState('ok', `synced · ${resources.length} ressources`);
    render();
    renderTagFilters();
  } catch (e) {
    setSyncState('error', 'Erreur de connexion');
    console.error(e);
  }
}

async function pushToGitHub() {
  if (!cfg.repo || !cfg.token) return;
  setSyncState('busy', 'Sauvegarde…');
  try {
    const { sha } = await ghRead();
    await ghWrite(resources, sha);
    setSyncState('ok', `synced · ${resources.length} ressources`);
  } catch (e) {
    setSyncState('error', 'Erreur de sauvegarde');
    console.error(e);
    throw e;
  }
}

// ════════════════════════════════════════════════════════════
// SYNC INDICATOR
// ════════════════════════════════════════════════════════════
function setSyncState(state, label) {
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-label');
  dot.className = 'sync-dot';
  if (state === 'ok')    { dot.classList.add('ok');    lbl.textContent = label || 'synchronisé'; }
  if (state === 'error') { dot.classList.add('error'); lbl.textContent = label || 'erreur'; }
  if (state === 'busy')  { dot.classList.add('busy');  lbl.textContent = label || '…'; }
  if (state === 'none')  { lbl.textContent = 'non configuré'; }
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

async function saveConfig() {
  cfg.repo         = document.getElementById('cfg-repo').value.trim();
  cfg.token        = document.getElementById('cfg-token').value.trim();
  cfg.branch       = document.getElementById('cfg-branch').value.trim() || 'main';
  cfg.anthropicKey = document.getElementById('cfg-anthropic').value.trim();
  localStorage.setItem('gh-repo',       cfg.repo);
  localStorage.setItem('gh-token',      cfg.token);
  localStorage.setItem('gh-branch',     cfg.branch);
  localStorage.setItem('anthropic-key', cfg.anthropicKey);
  await loadFromGitHub();
}

// ════════════════════════════════════════════════════════════
// BURGER MENU
// ════════════════════════════════════════════════════════════
function toggleSidebar() {
  const aside   = document.querySelector('aside');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen  = aside.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
}

function closeSidebar() {
  document.querySelector('aside').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pane-' + id).classList.add('active');
}

// ════════════════════════════════════════════════════════════
// TAG SELECTOR (add panel)
// ════════════════════════════════════════════════════════════
function renderTagSelector() {
  const c = document.getElementById('tag-selector');
  c.innerHTML = '';
  TAGS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tag-toggle' + (activeTags.includes(t.id) ? ' on' : '');
    b.textContent = `${t.e} ${t.label}`;
    b.onclick = () => {
      activeTags.includes(t.id)
        ? activeTags.splice(activeTags.indexOf(t.id), 1)
        : activeTags.push(t.id);
      renderTagSelector();
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

  TAGS.forEach(t => {
    const n = resources.filter(r => r.tags?.includes(t.id)).length;
    if (!n) return;
    const b = document.createElement('button');
    b.className = 'filter-btn' + (activeFilter === t.id ? ' active' : '');
    b.innerHTML = `${t.e} ${t.label} <span class="fc">${n}</span>`;
    b.onclick = () => { setFilter(t.id, b); closeSidebar(); };
    c.appendChild(b);
  });
}

function setFilter(id, btn) {
  activeFilter = id;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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
    const filterOk = activeFilter === 'all' || r.tags?.includes(activeFilter);
    const searchOk = !q || [r.title, r.summary, r.tldr].some(s => s?.toLowerCase().includes(q));
    return filterOk && searchOk;
  });

  if (sort === 'new') list.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'old') list.sort((a, b) => a.createdAt - b.createdAt);
  if (sort === 'az')  list.sort((a, b) => a.title.localeCompare(b.title));

  document.getElementById('list-label').textContent =
    list.length === resources.length
      ? 'Toutes les ressources'
      : `${list.length} résultat${list.length > 1 ? 's' : ''}`;

  document.getElementById('total-badge').textContent =
    `${resources.length} ressource${resources.length > 1 ? 's' : ''}`;

  if (!list.length) {
    grid.innerHTML = resources.length === 0
      ? `<div class="empty"><div class="empty-ico">🗂️</div><h3>Base vide</h3><p>Configurez GitHub dans la sidebar puis ajoutez votre première ressource.</p></div>`
      : `<div class="empty"><div class="empty-ico">🔍</div><h3>Aucun résultat</h3><p>Essayez d'autres termes ou changez le filtre.</p></div>`;
    return;
  }

  grid.innerHTML = '';
  list.forEach(r => {
    const domain  = (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return ''; } })();
    const fav     = domain
      ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.parentElement.textContent='📄'" />`
      : '📄';
    const tagPills = (r.tags || []).map(tid => {
      const t = TAGS.find(x => x.id === tid);
      return t ? `<span class="pill p-${tid}">${t.e} ${t.label}</span>` : '';
    }).join('');
    const date = new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = e => { if (!e.target.closest('.icon-btn')) openDetail(r.id); };
    card.innerHTML = `
      <div class="card-top">
        <div class="favicon">${fav}</div>
        <div class="card-meta">
          <div class="card-title">${r.title}</div>
          <div class="card-domain">${domain || 'texte collé'}</div>
        </div>
        <div class="card-actions">
          ${r.url ? `<button class="icon-btn" title="Ouvrir" onclick="window.open('${r.url}','_blank')">🔗</button>` : ''}
          <button class="icon-btn del" title="Supprimer" onclick="deleteRes('${r.id}')">🗑️</button>
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
// ADD RESOURCES
// ════════════════════════════════════════════════════════════
async function addFromUrl() {
  const url = document.getElementById('url-input').value.trim();
  if (!url) { showStatus('Collez une URL.', 'err'); return; }
  setLoading('btn-url', true);
  showStatus('Analyse avec Claude…', 'loading');
  try {
    const data = await callClaude(buildPrompt(url, null));
    await createResource({ ...data, url });
    document.getElementById('url-input').value = '';
    showStatus('Ressource ajoutée et sauvegardée sur GitHub ✓', 'ok');
  } catch (e) {
    showStatus('Erreur : ' + e.message, 'err');
  }
  setLoading('btn-url', false);
}

async function addFromText() {
  const text = document.getElementById('text-input').value.trim();
  if (!text) { showStatus('Collez du texte.', 'err'); return; }
  setLoading('btn-text', true);
  showStatus('Analyse avec Claude…', 'loading');
  try {
    const data = await callClaude(buildPrompt(null, text));
    await createResource({ ...data, url: '' });
    document.getElementById('text-input').value = '';
    showStatus('Ressource ajoutée et sauvegardée sur GitHub ✓', 'ok');
  } catch (e) {
    showStatus('Erreur : ' + e.message, 'err');
  }
  setLoading('btn-text', false);
}

async function createResource(data) {
  const resource = {
    id:        Date.now().toString(),
    url:       data.url || '',
    title:     data.title || 'Ressource importée',
    summary:   data.summary || '',
    tldr:      data.tldr || '',
    insights:  data.insights || [],
    tags:      mergeTags(data.suggestedTags || [], activeTags),
    notes:     '',
    createdAt: Date.now(),
  };
  resources.unshift(resource);
  await pushToGitHub();
  render();
  renderTagFilters();
  activeTags = [];
  renderTagSelector();
}

// ════════════════════════════════════════════════════════════
// CLAUDE API
// ════════════════════════════════════════════════════════════
function buildPrompt(url, text) {
  const tagList = TAGS.map(t => `${t.id} (${t.label})`).join(', ');
  const source  = url
    ? `URL : ${url}`
    : `Contenu texte :\n\n${text.slice(0, 4000)}`;

  return `Tu es un assistant DesignOps expert. Analyse cette ressource et produis une fiche de documentation.

${source}

Contexte mission : DesignOps chez Cdiscount. Sujets d'intérêt : design system, design-to-code, RGAA/accessibilité, gouvernance, plugins Figma, génération IA, tokens, Storybook, Cursor, MCP.

Réponds UNIQUEMENT en JSON valide, sans backticks ni texte autour :
{
  "title": "Titre court et précis (max 80 chars)",
  "summary": "Ce dont il s'agit en 1-2 phrases (max 200 chars)",
  "tldr": "TL;DR approfondi : apport de la ressource, points forts, pertinence DesignOps (150-250 mots)",
  "insights": ["insight actionnable 1","insight 2","insight 3","insight 4 si pertinent","insight 5 si pertinent"],
  "suggestedTags": ["tag-id-1","tag-id-2"]
}

Tags disponibles (utilise 1 à 3 max) : ${tagList}`;
}

async function callClaude(prompt) {
  if (!cfg.anthropicKey) throw new Error('Clé API Claude manquante — configure-la dans la sidebar.');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error?.message || `Erreur API Claude : ${r.status}`);
  }
  const d   = await r.json();
  const raw = d.content?.map(b => b.text || '').join('') || '';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { title: 'Ressource importée', summary: raw.slice(0, 200), tldr: raw, insights: [], suggestedTags: [] };
  }
}

function mergeTags(suggested, manual) {
  return [...new Set([...suggested, ...manual])].filter(id => TAGS.find(t => t.id === id));
}

// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════
function openDetail(id) {
  const r = resources.find(x => x.id === id);
  if (!r) return;
  activeId = id;

  const domain = (() => { try { return new URL(r.url).hostname.replace('www.', ''); } catch { return ''; } })();
  document.getElementById('m-fav').innerHTML = domain
    ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" onerror="this.textContent='📄'" />`
    : '📄';
  document.getElementById('m-title').textContent  = r.title;
  document.getElementById('m-domain').textContent = r.url || 'Texte collé';
  document.getElementById('m-tldr').textContent   = r.tldr || r.summary;
  document.getElementById('m-notes').value        = r.notes || '';

  const linkBtn = document.getElementById('m-link-btn');
  if (r.url) { linkBtn.style.display = ''; linkBtn.onclick = () => window.open(r.url, '_blank'); }
  else linkBtn.style.display = 'none';

  document.getElementById('m-insights').innerHTML =
    (r.insights || []).map((ins, i) =>
      `<div class="insight"><div class="insight-n">${i + 1}</div><div>${ins}</div></div>`
    ).join('') || `<div class="insight"><span style="color:var(--text3)">Aucun insight extrait.</span></div>`;

  document.getElementById('m-tags').innerHTML =
    (r.tags || []).map(tid => {
      const t = TAGS.find(x => x.id === tid);
      return t ? `<span class="pill p-${tid}">${t.e} ${t.label}</span>` : '';
    }).join('') || `<span style="color:var(--text3);font-size:12px">Aucun tag</span>`;

  document.getElementById('detail-overlay').classList.add('open');
}

async function saveNotes() {
  if (!activeId) return;
  const r = resources.find(x => x.id === activeId);
  if (!r) return;
  r.notes = document.getElementById('m-notes').value;
  showStatus('Sauvegarde…', 'loading');
  try {
    await pushToGitHub();
    showStatus('Notes sauvegardées ✓', 'ok');
  } catch (e) {
    showStatus('Erreur de sauvegarde', 'err');
  }
}

async function deleteActive() {
  if (!activeId || !confirm('Supprimer cette ressource ?')) return;
  await deleteRes(activeId);
  closeOverlay('detail-overlay');
}

async function deleteRes(id) {
  if (!activeId && !confirm('Supprimer cette ressource ?')) return;
  resources = resources.filter(r => r.id !== id);
  try {
    await pushToGitHub();
    render();
    renderTagFilters();
  } catch (e) {
    showStatus('Erreur de suppression', 'err');
  }
}

// ════════════════════════════════════════════════════════════
// MARKDOWN EXPORT
// ════════════════════════════════════════════════════════════
function toMd(r) {
  const tags = (r.tags || []).map(id => {
    const t = TAGS.find(x => x.id === id);
    return t ? `#${id}` : '';
  }).filter(Boolean).join(' ');
  const date = new Date(r.createdAt).toLocaleDateString('fr-FR');
  const ins  = (r.insights || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `## ${r.title}\n\n**URL :** ${r.url || 'N/A'}\n**Date :** ${date}\n**Tags :** ${tags || 'aucun'}\n\n### TL;DR\n${r.tldr || r.summary}\n\n### Insights clés\n${ins || 'N/A'}\n${r.notes ? `\n### Notes\n${r.notes}\n` : ''}\n---`;
}

function copyMd() {
  const r = resources.find(x => x.id === activeId);
  if (!r) return;
  navigator.clipboard.writeText(toMd(r));
  showStatus('Markdown copié ✓', 'ok');
}

function openExport() {
  const md = `# DesignOps Knowledge Base — Cdiscount\n*${new Date().toLocaleDateString('fr-FR')} · ${resources.length} ressource(s)*\n\n`
    + resources.map(toMd).join('\n\n');
  document.getElementById('export-box').textContent = md;
  document.getElementById('export-overlay').classList.add('open');
}

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('export-box').textContent);
  showStatus('Export copié ✓', 'ok');
}

// ════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'detail-overlay') activeId = null;
}

function showStatus(msg, type) {
  const el   = document.getElementById('status');
  const spin = document.getElementById('spin');
  el.className = 'status show ' + type;
  document.getElementById('status-msg').textContent = msg;
  spin.style.display = type === 'loading' ? 'block' : 'none';
  if (type !== 'loading') setTimeout(() => { el.className = 'status'; }, 3500);
}

function setLoading(btnId, on) {
  document.getElementById(btnId).disabled = on;
}

// ════════════════════════════════════════════════════════════
// KEYBOARD
// ════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
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
loadFromGitHub();
