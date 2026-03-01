function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function makeEl(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.className) el.className = opts.className;
  if (opts.id) el.id = opts.id;
  if (opts.text != null) el.textContent = opts.text;
  if (opts.title) el.title = opts.title;
  if (opts.type) el.type = opts.type;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  if (opts.value != null) el.value = opts.value;
  if (opts.href) el.href = opts.href;
  if (opts.style) el.style.cssText = opts.style;
  if (opts.attrs) {
    Object.keys(opts.attrs).forEach((k) => el.setAttribute(k, opts.attrs[k]));
  }
  return el;
}

function makeIcon(name, style) {
  const i = makeEl('i', { className: 'bi ' + name });
  if (style) i.style.cssText = style;
  return i;
}

function append(parent, children) {
  children.forEach((c) => {
    if (c == null) return;
    parent.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
}

class GpmAppShell extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  render() {
    clearNode(this);

    const nav = makeEl('nav', { className: 'app-nav' });
    const brand = makeEl('a', { href: '#', className: 'brand' });
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      window.navigate('dashboard');
    });
    append(brand, [makeIcon('bi-git'), 'GPM']);
    const brandSpan = makeEl('span', { text: 'Local' });
    brand.appendChild(brandSpan);

    const searchWrap = makeEl('div', { className: 'nav-search' });
    const searchInput = makeEl('input', {
      type: 'text',
      id: 'globalSearch',
      placeholder: 'Search issues, repos...'
    });
    searchInput.addEventListener('keyup', (e) => window.handleGlobalSearch(e.target.value));
    searchWrap.appendChild(searchInput);

    const actions = makeEl('div', { style: 'margin-left:auto; display:flex; align-items:center; gap:.75rem;' });

    const newBtn = makeEl('button', { className: 'btn-outline-custom btn-sm-custom' });
    newBtn.addEventListener('click', () => window.showNewRepoModal());
    append(newBtn, [makeIcon('bi-plus-lg'), ' New']);

    const exportBtn = makeEl('button', { className: 'btn-outline-custom btn-sm-custom' });
    exportBtn.addEventListener('click', () => window.showExportModal());
    append(exportBtn, [makeIcon('bi-file-arrow-up'), ' Export']);

    const importBtn = makeEl('button', { className: 'btn-outline-custom btn-sm-custom' });
    importBtn.addEventListener('click', () => window.showImportModal());
    append(importBtn, [makeIcon('bi-file-arrow-down'), ' Import']);

    const avatar = makeEl('div', { id: 'navAvatar', className: 'nav-avatar', title: 'Profile' });
    avatar.addEventListener('click', () => window.navigate('profile'));

    append(actions, [newBtn, exportBtn, importBtn, avatar]);
    append(nav, [brand, searchWrap, actions]);

    const layout = makeEl('div', { className: 'app-layout' });
    const sidebar = makeEl('aside', { className: 'sidebar', id: 'appSidebar' });

    const navSection = makeEl('div', { className: 'sidebar-section' });
    navSection.appendChild(makeEl('div', { className: 'sidebar-label', text: 'Navigation' }));

    const mkSideLink = (id, icon, label, cb) => {
      const a = makeEl('a', { className: 'sidebar-link', id: id });
      a.addEventListener('click', cb);
      append(a, [makeIcon(icon), ' ' + label]);
      return a;
    };

    navSection.appendChild(mkSideLink('nav-dashboard', 'bi-grid-1x2', 'Dashboard', () => window.navigate('dashboard')));
    navSection.appendChild(mkSideLink('nav-repos', 'bi-folder2', 'Projects', () => window.navigate('repos')));
    navSection.appendChild(mkSideLink('nav-issues', 'bi-exclamation-diamond', 'My Issues', () => window.navigate('myissues')));

    const repoSection = makeEl('div', { className: 'sidebar-section', id: 'repoNavSection', style: 'display:none;' });
    repoSection.appendChild(makeEl('div', { className: 'sidebar-label', id: 'repoNavLabel', text: 'Project' }));

    const issuesLink = mkSideLink('nav-repo-issues', 'bi-exclamation-diamond', 'Issues ', () => window.navigateRepoTab('issues'));
    const issuesBadge = makeEl('span', { className: 'badge badge-count', id: 'nav-count-issues', text: '0' });
    issuesLink.appendChild(issuesBadge);

    repoSection.appendChild(issuesLink);
    repoSection.appendChild(mkSideLink('nav-repo-boards', 'bi-kanban', 'Project Boards', () => window.navigateRepoTab('boards')));
    repoSection.appendChild(mkSideLink('nav-repo-labels', 'bi-tags', 'Labels', () => window.navigateRepoTab('labels')));
    repoSection.appendChild(mkSideLink('nav-repo-settings', 'bi-gear', 'Settings', () => window.navigateRepoTab('settings')));

    append(sidebar, [navSection, repoSection]);

    const main = makeEl('main', { className: 'main-content', id: 'app-content' });
    layout.appendChild(sidebar);
    layout.appendChild(main);

    const toastContainer = makeEl('div', { className: 'toast-container', id: 'toastContainer' });
    const modals = makeEl('div', { id: 'modalsContainer' });

    append(this, [nav, layout, toastContainer, modals]);
  }
}

class GpmStatCard extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  static get observedAttributes() {
    return ['value', 'label', 'icon', 'color', 'view'];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    clearNode(this);

    const value = this.getAttribute('value') || '0';
    const label = this.getAttribute('label') || '';
    const icon = this.getAttribute('icon') || 'bi-dot';
    const color = this.getAttribute('color') || 'var(--text-primary)';
    const view = this.getAttribute('view');

    const card = makeEl('div', { className: 'stat-card' + (view ? ' clickable' : '') });
    if (view) card.addEventListener('click', () => window.navigate(view));

    const valueEl = makeEl('div', { className: 'stat-value', text: String(value) });
    valueEl.style.color = color;
    const labelEl = makeEl('div', { className: 'stat-label' });
    append(labelEl, [makeIcon(icon), ' ' + label]);

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    this.appendChild(card);
  }
}

class GpmDashboardView extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  render() {
    clearNode(this);

    const repos = window.DB.repos();
    const issues = window.DB.issues();
    const openIssues = issues.filter((i) => i.type === 'issue' && i.state === 'open').length;
    const closedIssues = issues.filter((i) => i.type === 'issue' && i.state === 'closed').length;
    const activity = window.DB.activity().slice(0, 15);

    const root = makeEl('div', { style: 'max-width:900px;' });

    const head = makeEl('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;' });
    head.appendChild(makeEl('h1', { text: 'Dashboard', style: 'font-size:1.4rem; font-weight:700; margin:0;' }));
    const newProjectBtn = makeEl('button', { className: 'btn-primary-custom' });
    newProjectBtn.addEventListener('click', () => window.showNewRepoModal());
    append(newProjectBtn, [makeIcon('bi-plus-lg'), ' New Project']);
    head.appendChild(newProjectBtn);

    const stats = makeEl('div', { style: 'display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem;' });
    const s1 = makeEl('gpm-stat-card', { attrs: { value: String(repos.length), label: 'Projects', icon: 'bi-folder2', color: 'var(--accent-blue)', view: 'repos' } });
    const s2 = makeEl('gpm-stat-card', { attrs: { value: String(openIssues), label: 'Open Issues', icon: 'bi-exclamation-diamond', color: 'var(--accent-green)', view: 'myissues' } });
    const s3 = makeEl('gpm-stat-card', { attrs: { value: String(closedIssues), label: 'Closed Issues', icon: 'bi-check-circle', color: 'var(--accent-red)' } });
    append(stats, [s1, s2, s3]);

    const cols = makeEl('div', { style: 'display:grid; grid-template-columns:1fr 340px; gap:1.5rem;' });

    const left = makeEl('div');
    const leftHead = makeEl('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;' });
    leftHead.appendChild(makeEl('h2', { text: 'Recent Projects', style: 'font-size:1rem; font-weight:600; margin:0;' }));
    const viewAll = makeEl('a', { text: 'View all →', style: 'color:var(--accent-blue); font-size:13px; cursor:pointer;' });
    viewAll.addEventListener('click', () => window.navigate('repos'));
    leftHead.appendChild(viewAll);
    left.appendChild(leftHead);

    if (repos.length === 0) {
      const empty = makeEl('div', { className: 'empty-state' });
      empty.appendChild(makeIcon('bi-folder-plus'));
      empty.appendChild(makeEl('h4', { text: 'No projects yet' }));
      empty.appendChild(makeEl('p', { text: 'Create your first project to get started', style: 'margin-bottom:1rem;' }));
      const btn = makeEl('button', { className: 'btn-primary-custom' });
      btn.addEventListener('click', () => window.showNewRepoModal());
      append(btn, [makeIcon('bi-plus-lg'), ' New Project']);
      empty.appendChild(btn);
      left.appendChild(empty);
    } else {
      repos.slice(0, 5).forEach((r) => {
        const openRepoIssues = window.DB.getIssuesByRepo(r.id, 'issue').filter((i) => i.state === 'open').length;
        const openRepoPrs = window.DB.getIssuesByRepo(r.id, 'pr').filter((i) => i.state === 'open').length;

        const card = makeEl('div', { className: 'repo-card' });
        card.addEventListener('click', () => window.navigate('repo', { repo_id: r.id }));

        const top = makeEl('div', { style: 'display:flex; align-items:center; gap:.5rem;' });
        top.appendChild(makeEl('span', { className: 'repo-name', text: r.name }));
        top.appendChild(makeEl('span', { className: 'repo-visibility', text: r.visibility }));
        card.appendChild(top);

        if (r.description) card.appendChild(makeEl('div', { className: 'repo-desc', text: r.description }));

        const meta = makeEl('div', { className: 'repo-meta' });
        const m1 = makeEl('span'); append(m1, [makeIcon('bi-exclamation-diamond'), ' ' + openRepoIssues + ' issues']);
        const m2 = makeEl('span'); append(m2, [makeIcon('bi-git'), ' ' + openRepoPrs + ' PRs']);
        const m3 = makeEl('span'); append(m3, [makeIcon('bi-clock'), ' ' + window.fmt(r.created_at)]);
        append(meta, [m1, m2, m3]);

        card.appendChild(meta);
        left.appendChild(card);
      });
    }

    const right = makeEl('div');
    right.appendChild(makeEl('h2', { text: 'Recent Activity', style: 'font-size:1rem; font-weight:600; margin-bottom:1rem;' }));
    const activityCard = makeEl('div', { className: 'card-custom', style: 'padding:1rem;' });

    if (activity.length === 0) {
      const emptyActivity = makeEl('div', { style: 'text-align:center; color:var(--text-muted); font-size:13px; padding:2rem 0;' });
      emptyActivity.appendChild(makeIcon('bi-activity', 'font-size:2rem; display:block; margin-bottom:.5rem; opacity:.3;'));
      emptyActivity.appendChild(document.createTextNode('No activity yet'));
      activityCard.appendChild(emptyActivity);
    } else {
      activity.forEach((a) => {
        const row = makeEl('div', { className: 'activity-item' });
        const iconWrap = makeEl('div', {
          className: 'activity-icon',
          style: 'background:' + (a.color || 'var(--bg-overlay)') + '20; color:' + (a.color || 'var(--text-muted)')
        });
        iconWrap.appendChild(makeIcon(a.icon || 'bi-dot'));

        const body = makeEl('div');
        const text = makeEl('div', { className: 'activity-text' });
        text.innerHTML = a.html;
        const time = makeEl('div', { className: 'activity-time', text: window.fmt(a.ts) });

        body.appendChild(text);
        body.appendChild(time);
        row.appendChild(iconWrap);
        row.appendChild(body);
        activityCard.appendChild(row);
      });
    }

    right.appendChild(activityCard);

    cols.appendChild(left);
    cols.appendChild(right);

    append(root, [head, stats, cols]);
    this.appendChild(root);
  }
}

class GpmReposView extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.filterValue = this.filterValue || '';
    this.render();
  }

  render() {
    clearNode(this);

    const repos = window.DB.repos();
    const q = (this.filterValue || '').toLowerCase();
    const filtered = q
      ? repos.filter((r) => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
      : repos;

    const root = makeEl('div', { style: 'max-width:860px;' });
    const top = makeEl('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;' });
    top.appendChild(makeEl('h1', { text: 'Projects', style: 'font-size:1.4rem; font-weight:700; margin:0;' }));
    const newBtn = makeEl('button', { className: 'btn-primary-custom' });
    newBtn.addEventListener('click', () => window.showNewRepoModal());
    append(newBtn, [makeIcon('bi-plus-lg'), ' New Project']);
    top.appendChild(newBtn);
    root.appendChild(top);

    const input = makeEl('input', {
      type: 'text',
      id: 'repoFilter',
      className: 'form-control-custom',
      placeholder: 'Find a project...',
      style: 'margin-bottom:1.5rem;',
      value: this.filterValue || ''
    });
    input.addEventListener('input', (e) => {
      this.filterValue = e.target.value;
      this.render();
    });
    root.appendChild(input);

    if (filtered.length === 0) {
      const empty = makeEl('div', { className: 'empty-state' });
      empty.appendChild(makeIcon('bi-folder2-open'));
      empty.appendChild(makeEl('h4', { text: repos.length ? 'No projects match' : 'No projects yet' }));
      root.appendChild(empty);
      this.appendChild(root);
      return;
    }

    filtered.forEach((r) => {
      const openIssues = window.DB.getIssuesByRepo(r.id, 'issue').filter((i) => i.state === 'open').length;
      const openPRs = window.DB.getIssuesByRepo(r.id, 'pr').filter((i) => i.state === 'open').length;
      const boards = window.DB.boards().filter((b) => b.repo_id === r.id).length;

      const card = makeEl('div', { className: 'repo-card' });
      card.addEventListener('click', () => window.navigate('repo', { repo_id: r.id }));

      const row = makeEl('div', { style: 'display:flex; align-items:center; justify-content:space-between;' });
      const left = makeEl('div', { style: 'display:flex; align-items:center; gap:.5rem;' });
      left.appendChild(makeEl('span', { className: 'repo-name', text: r.name }));
      left.appendChild(makeEl('span', { className: 'repo-visibility', text: r.visibility }));

      const actions = makeEl('div', { style: 'display:flex; gap:.5rem;' });
      actions.addEventListener('click', (e) => e.stopPropagation());
      const editBtn = makeEl('button', { className: 'btn-outline-custom btn-sm-custom' });
      editBtn.addEventListener('click', () => window.showEditRepoModal(r.id));
      editBtn.appendChild(makeIcon('bi-pencil'));
      const delBtn = makeEl('button', { className: 'btn-danger-custom btn-sm-custom' });
      delBtn.addEventListener('click', () => window.confirmDeleteRepo(r.id));
      delBtn.appendChild(makeIcon('bi-trash'));
      append(actions, [editBtn, delBtn]);

      append(row, [left, actions]);
      card.appendChild(row);

      if (r.description) card.appendChild(makeEl('div', { className: 'repo-desc', text: r.description }));

      const meta = makeEl('div', { className: 'repo-meta' });
      const s1 = makeEl('span'); append(s1, [makeIcon('bi-exclamation-diamond'), ' ' + openIssues + ' open issues']);
      const s2 = makeEl('span'); append(s2, [makeIcon('bi-git'), ' ' + openPRs + ' open PRs']);
      const s3 = makeEl('span'); append(s3, [makeIcon('bi-kanban'), ' ' + boards + ' boards']);
      const s4 = makeEl('span', { style: 'margin-left:auto;' });
      append(s4, [makeIcon('bi-calendar3'), ' ' + new Date(r.created_at).toLocaleDateString()]);
      append(meta, [s1, s2, s3, s4]);
      card.appendChild(meta);

      root.appendChild(card);
    });

    this.appendChild(root);
  }
}

function appendHighlightedText(parent, text, query) {
  const source = String(text || '');
  const q = String(query || '').trim();
  if (!q) {
    parent.appendChild(document.createTextNode(source));
    return;
  }

  const lower = source.toLowerCase();
  const needle = q.toLowerCase();
  let cursor = 0;

  while (cursor < source.length) {
    const idx = lower.indexOf(needle, cursor);
    if (idx === -1) {
      parent.appendChild(document.createTextNode(source.slice(cursor)));
      break;
    }
    if (idx > cursor) parent.appendChild(document.createTextNode(source.slice(cursor, idx)));
    const mark = makeEl('mark', { text: source.slice(idx, idx + needle.length) });
    parent.appendChild(mark);
    cursor = idx + needle.length;
  }
}

class GpmMyIssuesView extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  render() {
    clearNode(this);
    const allIssues = window.DB.issues().filter((i) => i.type === 'issue');
    const repos = window.DB.repos();
    const filterState = window._myFilter || 'open';
    const filtered = allIssues.filter((i) => i.state === filterState);

    const root = makeEl('div', { style: 'max-width:860px;' });
    root.appendChild(makeEl('h1', { text: 'My Issues', style: 'font-size:1.4rem; font-weight:700; margin-bottom:1.5rem;' }));

    const filters = makeEl('div', { style: 'display:flex; gap:.5rem; margin-bottom:1rem;' });
    const openBtn = makeEl('button', { className: 'filter-btn' + (filterState === 'open' ? ' active' : '') });
    openBtn.addEventListener('click', () => { window._myFilter = 'open'; window.render(); });
    append(openBtn, [makeIcon('bi-exclamation-diamond', 'color:var(--accent-green)'), ' ' + allIssues.filter((i) => i.state === 'open').length + ' Open']);

    const closedBtn = makeEl('button', { className: 'filter-btn' + (filterState === 'closed' ? ' active' : '') });
    closedBtn.addEventListener('click', () => { window._myFilter = 'closed'; window.render(); });
    append(closedBtn, [makeIcon('bi-check-circle'), ' ' + allIssues.filter((i) => i.state === 'closed').length + ' Closed']);
    append(filters, [openBtn, closedBtn]);

    const card = makeEl('div', { className: 'card-custom' });
    if (filtered.length === 0) {
      const empty = makeEl('div', { className: 'empty-state' });
      empty.appendChild(makeIcon('bi-exclamation-diamond'));
      empty.appendChild(makeEl('h4', { text: 'No ' + filterState + ' issues' }));
      card.appendChild(empty);
    } else {
      filtered.forEach((issue) => {
        const repo = repos.find((r) => r.id === issue.repo_id);
        const item = makeEl('div', { className: 'issue-item' });
        item.addEventListener('click', () => window.navigate('issue', { repo_id: issue.repo_id, issue_id: issue.id }));

        const icon = makeIcon('bi-exclamation-diamond issue-icon');
        icon.style.color = issue.state === 'open' ? 'var(--accent-green)' : 'var(--text-muted)';
        const body = makeEl('div', { style: 'flex:1;' });
        const title = makeEl('div', { className: 'issue-title' });
        const repoPrefix = makeEl('span', { text: (repo?.name || '') + ' / ', style: 'color:var(--text-muted); font-size:12px;' });
        title.appendChild(repoPrefix);
        title.appendChild(document.createTextNode(issue.title));
        const meta = makeEl('div', { className: 'issue-meta', text: '#' + issue.number + ' · ' + window.fmt(issue.created_at) });
        append(body, [title, meta]);
        append(item, [icon, body]);
        card.appendChild(item);
      });
    }

    append(root, [filters, card]);
    this.appendChild(root);
  }
}

class GpmProfileView extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  render() {
    clearNode(this);
    const u = window.DB.user();
    const totalIssues = window.DB.issues().length;
    const totalRepos = window.DB.repos().length;

    const root = makeEl('div', { style: 'max-width:500px;' });
    root.appendChild(makeEl('h1', { text: 'Profile', style: 'font-size:1.4rem; font-weight:700; margin-bottom:1.5rem;' }));

    const card = makeEl('div', { className: 'card-custom', style: 'padding:1.5rem; margin-bottom:1.5rem;' });
    const head = makeEl('div', { style: 'display:flex; align-items:center; gap:1.5rem; margin-bottom:1.5rem;' });
    const avatar = makeEl('div', {
      text: (u.name || 'U').charAt(0).toUpperCase(),
      style: 'width:72px; height:72px; border-radius:50%; background:' + (u.avatar_color || '#2f81f7') + '; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:700;'
    });
    const userInfo = makeEl('div');
    userInfo.appendChild(makeEl('div', { text: u.name || 'Developer', style: 'font-weight:700; font-size:1.2rem;' }));
    userInfo.appendChild(makeEl('div', { text: u.email || '', style: 'color:var(--text-muted); font-size:13px;' }));
    append(head, [avatar, userInfo]);

    const stats = makeEl('div', { style: 'display:flex; gap:1.5rem; margin-bottom:1.5rem;' });
    const s1 = makeEl('span', { style: 'font-size:13px; color:var(--text-secondary);' });
    const s1Strong = makeEl('strong', { text: String(totalRepos), style: 'color:var(--text-primary);' });
    append(s1, [s1Strong, ' projects']);
    const s2 = makeEl('span', { style: 'font-size:13px; color:var(--text-secondary);' });
    const s2Strong = makeEl('strong', { text: String(totalIssues), style: 'color:var(--text-primary);' });
    append(s2, [s2Strong, ' issues & PRs']);
    append(stats, [s1, s2]);

    const form = makeEl('div', { style: 'display:flex; flex-direction:column; gap:1rem;' });
    const f1 = makeEl('div');
    f1.appendChild(makeEl('label', { className: 'form-label-custom', text: 'Display Name' }));
    f1.appendChild(makeEl('input', { type: 'text', id: 'prof_name', className: 'form-control-custom', value: u.name || '' }));
    const f2 = makeEl('div');
    f2.appendChild(makeEl('label', { className: 'form-label-custom', text: 'Email' }));
    f2.appendChild(makeEl('input', { type: 'email', id: 'prof_email', className: 'form-control-custom', value: u.email || '' }));
    const f3 = makeEl('div');
    f3.appendChild(makeEl('label', { className: 'form-label-custom', text: 'Bio' }));
    const bio = makeEl('textarea', { id: 'prof_bio', className: 'form-control-custom' });
    bio.value = u.bio || '';
    f3.appendChild(bio);

    const colorSection = makeEl('div');
    colorSection.appendChild(makeEl('label', { className: 'form-label-custom', text: 'Avatar Color' }));
    const swatches = makeEl('div', { className: 'color-swatches' });
    (window.LABEL_COLORS || []).forEach((c) => {
      const sw = makeEl('div', { className: 'color-swatch' + (c === u.avatar_color ? ' selected' : ''), style: 'background:' + c });
      sw.addEventListener('click', () => window.selectProfileColor(c, sw));
      swatches.appendChild(sw);
    });
    const colorInput = makeEl('input', { type: 'hidden', id: 'prof_color', value: u.avatar_color || '#2f81f7' });
    append(colorSection, [swatches, colorInput]);

    const saveBtn = makeEl('button', { className: 'btn-primary-custom' });
    saveBtn.addEventListener('click', () => window.saveProfile());
    append(saveBtn, [makeIcon('bi-check-lg'), ' Save Profile']);

    append(form, [f1, f2, f3, colorSection, saveBtn]);
    append(card, [head, stats, form]);

    const danger = makeEl('div', { className: 'card-custom', style: 'padding:1.5rem;' });
    danger.appendChild(makeEl('h3', { text: 'Danger Zone', style: 'font-size:1rem; font-weight:600; margin-bottom:1rem; color:var(--accent-red);' }));
    danger.appendChild(makeEl('p', {
      text: 'Clear all data from this application. This cannot be undone.',
      style: 'color:var(--text-secondary); font-size:13px; margin-bottom:1rem;'
    }));
    const clearBtn = makeEl('button', { className: 'btn-danger-custom' });
    clearBtn.addEventListener('click', () => window.clearAllData());
    append(clearBtn, [makeIcon('bi-trash'), ' Clear All Data']);
    danger.appendChild(clearBtn);

    append(root, [card, danger]);
    this.appendChild(root);
  }
}

class GpmSearchView extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block';
    this.render();
  }

  render() {
    clearNode(this);
    const q = (window.getAppState()?.searchQuery || '').trim();
    const qLower = q.toLowerCase();
    const repos = window.DB.repos().filter((r) => r.name.toLowerCase().includes(qLower) || (r.description || '').toLowerCase().includes(qLower));
    const issues = window.DB.issues().filter((i) => i.title.toLowerCase().includes(qLower) || (i.body || '').toLowerCase().includes(qLower));

    const root = makeEl('div', { style: 'max-width:800px;' });
    const title = makeEl('h1', { style: 'font-size:1.3rem; font-weight:700; margin-bottom:1.5rem;' });
    append(title, ['Search results for "', makeEl('span', { text: q, style: 'color:var(--accent-blue);' }), '"']);
    root.appendChild(title);

    if (repos.length > 0) {
      root.appendChild(makeEl('h2', {
        text: 'Projects (' + repos.length + ')',
        style: 'font-size:.9rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:.75rem;'
      }));

      repos.forEach((r) => {
        const card = makeEl('div', { className: 'repo-card' });
        card.addEventListener('click', () => window.navigate('repo', { repo_id: r.id }));
        const name = makeEl('div', { className: 'repo-name' });
        appendHighlightedText(name, r.name, q);
        card.appendChild(name);
        if (r.description) {
          const desc = makeEl('div', { className: 'repo-desc' });
          appendHighlightedText(desc, r.description, q);
          card.appendChild(desc);
        }
        root.appendChild(card);
      });
    }

    if (issues.length > 0) {
      root.appendChild(makeEl('h2', {
        text: 'Issues & PRs (' + issues.length + ')',
        style: 'font-size:.9rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-top:1.5rem; margin-bottom:.75rem;'
      }));
      const card = makeEl('div', { className: 'card-custom' });
      issues.forEach((i) => {
        const repo = window.DB.repos().find((x) => x.id === i.repo_id);
        const item = makeEl('div', { className: 'issue-item' });
        item.addEventListener('click', () => window.navigate('issue', { repo_id: i.repo_id, issue_id: i.id }));
        const icon = makeIcon((i.type === 'pr' ? 'bi-git' : 'bi-exclamation-diamond') + ' issue-icon');
        icon.style.color = i.state === 'open' ? 'var(--accent-green)' : 'var(--text-muted)';
        const body = makeEl('div');
        const issueTitle = makeEl('div', { className: 'issue-title' });
        if (repo) issueTitle.appendChild(makeEl('span', { text: repo.name + ' / ', style: 'color:var(--text-muted); font-size:12px;' }));
        appendHighlightedText(issueTitle, i.title, q);
        const meta = makeEl('div', { className: 'issue-meta', text: '#' + i.number + ' · ' + i.state + ' · ' + window.fmt(i.created_at) });
        append(body, [issueTitle, meta]);
        append(item, [icon, body]);
        card.appendChild(item);
      });
      root.appendChild(card);
    }

    if (repos.length === 0 && issues.length === 0) {
      const empty = makeEl('div', { className: 'empty-state' });
      empty.appendChild(makeIcon('bi-search'));
      empty.appendChild(makeEl('h4', { text: 'No results found' }));
      empty.appendChild(makeEl('p', { text: 'Try a different search term.' }));
      root.appendChild(empty);
    }

    this.appendChild(root);
  }
}

customElements.define('gpm-app-shell', GpmAppShell);
customElements.define('gpm-stat-card', GpmStatCard);
customElements.define('gpm-dashboard-view', GpmDashboardView);
customElements.define('gpm-repos-view', GpmReposView);
customElements.define('gpm-my-issues-view', GpmMyIssuesView);
customElements.define('gpm-profile-view', GpmProfileView);
customElements.define('gpm-search-view', GpmSearchView);
