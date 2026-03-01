    // ============================================================
    // DATA LAYER
    // ============================================================
    const DB = {
      get(key) { try { return JSON.parse(localStorage.getItem('ghpm_' + key) || 'null'); } catch (e) { return null; } },
      set(key, val) { localStorage.setItem('ghpm_' + key, JSON.stringify(val)); },
      repos() { return this.get('repos') || []; },
      issues() { return this.get('issues') || []; },
      comments() { return this.get('comments') || []; },
      milestones() { return this.get('milestones') || []; },
      labels() { return this.get('labels') || []; },
      boards() { return this.get('boards') || []; },
      activity() { return this.get('activity') || []; },
      user() { return this.get('user') || { name: 'Developer', email: 'dev@local.host', bio: '', avatar_color: '#2f81f7' }; },
      saveUser(u) { this.set('user', u); },

      // REPOS
      saveRepo(repo) {
        const repos = this.repos();
        const idx = repos.findIndex(r => r.id === repo.id);
        if (idx >= 0) repos[idx] = repo; else repos.push(repo);
        this.set('repos', repos);
      },

      exportRepo() {
        let repos = {};
        const keys = Object.keys(localStorage); // Get all keys as an array

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          // Retrieve the value for each key using getItem()
          repos[key] = localStorage.getItem(key);
        }

        const data = JSON.stringify(repos);
        const blob = new Blob([data], { type: "application/json" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "repositories.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      },

      importRepo() {

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json'; // optional but recommended

        input.addEventListener("change", function (event) {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();

          reader.onload = function () {
            const json = JSON.parse(reader.result);

            clearAllData();

            let keys = Object.keys(json);

            keys.forEach((k) => {
              localStorage.setItem(k, json[k]);
            });

            toast('All data imported successfully');
            
            render();
          };

          reader.readAsText(file);
        });

        input.click();
      },

      deleteRepo(id) {
        this.set('repos', this.repos().filter(r => r.id !== id));
        this.set('issues', this.issues().filter(i => i.repo_id !== id));
        this.set('comments', this.comments().filter(c => {
          const issue = this.issues().find(i => i.id === c.issue_id);
          return issue && issue.repo_id !== id;
        }));
        this.set('milestones', this.milestones().filter(m => m.repo_id !== id));
        this.set('labels', this.labels().filter(l => l.repo_id !== id));
        this.set('boards', this.boards().filter(b => b.repo_id !== id));
      },

      // ISSUES/PRs
      saveIssue(issue) {
        const issues = this.issues();
        const idx = issues.findIndex(i => i.id === issue.id);
        if (idx >= 0) issues[idx] = issue; else issues.push(issue);
        this.set('issues', issues);
      },
      deleteIssue(id) { this.set('issues', this.issues().filter(i => i.id !== id)); },
      getIssuesByRepo(repo_id, type = null) {
        return this.issues().filter(i => i.repo_id === repo_id && (!type || i.type === type));
      },
      nextIssueNumber(repo_id) {
        const issues = this.getIssuesByRepo(repo_id);
        return issues.length ? Math.max(...issues.map(i => i.number)) + 1 : 1;
      },

      // COMMENTS
      saveComment(c) {
        const comments = this.comments();
        const idx = comments.findIndex(x => x.id === c.id);
        if (idx >= 0) comments[idx] = c; else comments.push(c);
        this.set('comments', comments);
      },
      deleteComment(id) { this.set('comments', this.comments().filter(c => c.id !== id)); },
      getCommentsByIssue(issue_id) { return this.comments().filter(c => c.issue_id === issue_id); },

      // MILESTONES
      saveMilestone(m) {
        const ms = this.milestones();
        const idx = ms.findIndex(x => x.id === m.id);
        if (idx >= 0) ms[idx] = m; else ms.push(m);
        this.set('milestones', ms);
      },
      deleteMilestone(id) { this.set('milestones', this.milestones().filter(m => m.id !== id)); },

      // LABELS
      saveLabel(l) {
        const labels = this.labels();
        const idx = labels.findIndex(x => x.id === l.id);
        if (idx >= 0) labels[idx] = l; else labels.push(l);
        this.set('labels', labels);
      },
      deleteLabel(id) { this.set('labels', this.labels().filter(l => l.id !== id)); },

      // BOARDS
      saveBoard(b) {
        const boards = this.boards();
        const idx = boards.findIndex(x => x.id === b.id);
        if (idx >= 0) boards[idx] = b; else boards.push(b);
        this.set('boards', boards);
      },
      deleteBoard(id) { this.set('boards', this.boards().filter(b => b.id !== id)); },

      // ACTIVITY LOG
      logActivity(entry) {
        const act = this.activity();
        act.unshift({ ...entry, id: uid(), ts: Date.now() });
        if (act.length > 200) act.pop();
        this.set('activity', act);
      }
    };
    window.DB = DB;

    // ============================================================
    // UTILITIES
    // ============================================================
    function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
    function fmt(ts) {
      if (!ts) return '';
      const d = new Date(ts), now = new Date();
      const diff = (now - d) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
      return d.toLocaleDateString();
    }
    window.fmt = fmt;
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function md(text) {
      // Very basic markdown
      return esc(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }
    function textColor(hex) {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000' : '#fff';
    }
    function toast(msg, type = 'success') {
      const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
      const colors = { success: '#3fb950', error: '#f85149', info: '#2f81f7' };
      const el = document.createElement('div');
      el.className = `toast-item toast-${type}`;
      el.innerHTML = `<i class="bi ${icons[type]}" style="color:${colors[type]}"></i><span>${esc(msg)}</span>`;
      const c = document.getElementById('toastContainer');
      c.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }

    const LABEL_COLORS = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#10b981', '#f43f5e', '#a855f7'];
    window.LABEL_COLORS = LABEL_COLORS;
    const DEFAULT_LABELS = [
      { name: 'bug', color: '#e11d48', description: 'Something isn\'t working' },
      { name: 'feature', color: '#3b82f6', description: 'New feature or request' },
      { name: 'enhancement', color: '#8b5cf6', description: 'Improvement to existing feature' },
      { name: 'documentation', color: '#06b6d4', description: 'Improvements to docs' },
      { name: 'help wanted', color: '#eab308', description: 'Extra attention is needed' },
      { name: 'good first issue', color: '#22c55e', description: 'Good for newcomers' },
      { name: 'duplicate', color: '#64748b', description: 'This issue already exists' },
      { name: 'wontfix', color: '#64748b', description: 'Will not be fixed' },
      { name: 'priority:high', color: '#f43f5e', description: 'High priority' },
      { name: 'priority:low', color: '#10b981', description: 'Low priority' },
    ];

    // ============================================================
    // STATE
    // ============================================================
    let state = { view: 'dashboard', repo_id: null, repo_tab: 'issues', issue_id: null };
    window.getAppState = () => state;

    function navigate(view, opts = {}) {
      state = { view, repo_id: opts.repo_id || state.repo_id, repo_tab: opts.repo_tab || 'issues', issue_id: opts.issue_id || null };
      render();
    }
    function navigateRepoTab(tab) { state.repo_tab = tab; state.issue_id = null; render(); }
    function renderContent(content) {
      const container = document.getElementById('app-content');
      if (typeof content === 'string') {
        container.innerHTML = content;
        return;
      }
      container.replaceChildren(content);
    }

    // Sidebar active state
    function updateSidebar() {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      if (state.view === 'dashboard') document.getElementById('nav-dashboard')?.classList.add('active');
      if (state.view === 'repos') document.getElementById('nav-repos')?.classList.add('active');
      if (state.view === 'myissues') document.getElementById('nav-issues')?.classList.add('active');

      const repoSec = document.getElementById('repoNavSection');
      if (state.repo_id && (state.view === 'repo' || state.view === 'issue')) {
        repoSec.style.display = '';
        const repo = DB.repos().find(r => r.id === state.repo_id);
        if (repo) document.getElementById('repoNavLabel').textContent = repo.name;
        const issues = DB.getIssuesByRepo(state.repo_id, 'issue').filter(i => i.state === 'open');
        document.getElementById('nav-count-issues').textContent = issues.length;
        if (state.view === 'repo') {
          const tabMap = { issues: 'nav-repo-issues', boards: 'nav-repo-boards', milestones: 'nav-repo-milestones', labels: 'nav-repo-labels', settings: 'nav-repo-settings' };
          document.getElementById(tabMap[state.repo_tab])?.classList.add('active');
        }
      } else { repoSec.style.display = 'none'; }
    }

    // ============================================================
    // MAIN RENDER ROUTER
    // ============================================================
    function render() {
      updateSidebar();
      updateNavAvatar();
      switch (state.view) {
        case 'dashboard': renderDashboard(); break;
        case 'repos': renderRepos(); break;
        case 'repo': renderRepo(); break;
        case 'issue': renderIssueDetail(); break;
        case 'myissues': renderMyIssues(); break;
        case 'profile': renderProfile(); break;
        case 'search': renderSearch(); break;
        default: renderDashboard();
      }
    }

    function updateNavAvatar() {
      const u = DB.user();
      const el = document.getElementById('navAvatar');
      el.textContent = (u.name || 'U').charAt(0).toUpperCase();
      el.style.background = u.avatar_color || '#2f81f7';
      el.title = u.name;
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    function renderDashboard() {
      renderContent(document.createElement('gpm-dashboard-view'));
    }

    // ============================================================
    // REPOSITORIES
    // ============================================================
    function renderRepos() {
      renderContent(document.createElement('gpm-repos-view'));
    }

    // ============================================================
    // REPO VIEW
    // ============================================================
    function renderRepo() {
      const repo = DB.repos().find(r => r.id === state.repo_id);
      if (!repo) { navigate('repos'); return; }

      const tabs = [
        { id: 'issues', icon: 'bi-exclamation-diamond', label: 'Issues', count: DB.getIssuesByRepo(repo.id, 'issue').filter(i => i.state === 'open').length },
        { id: 'boards', icon: 'bi-kanban', label: 'Boards' },
        { id: 'labels', icon: 'bi-tags', label: 'Labels' },
        { id: 'settings', icon: 'bi-gear', label: 'Settings' },
      ];

      let tabContent = '';
      switch (state.repo_tab) {
        case 'issues': tabContent = renderIssueList(repo, 'issue'); break;
        case 'boards': tabContent = renderBoards(repo); break;
        case 'milestones': tabContent = renderMilestones(repo); break;
        case 'labels': tabContent = renderLabels(repo); break;
        case 'settings': tabContent = renderRepoSettings(repo); break;
      }

      renderContent(`
    <!-- Repo Header -->
    <div style="display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem;">
      <a onclick="navigate('repos')" style="color:var(--text-muted); cursor:pointer; font-size:13px;"><i class="bi bi-folder2"></i> Projects</a>
      <span style="color:var(--text-muted);">/</span>
      <span style="font-weight:600; font-size:15px;">${esc(repo.name)}</span>
      <span class="repo-visibility">${repo.visibility}</span>
    </div>
    <!-- Tabs -->
    <div class="repo-tabs">
      ${tabs.map(t => `<div class="repo-tab ${state.repo_tab === t.id ? 'active' : ''}" onclick="navigateRepoTab('${t.id}')">
        <i class="bi ${t.icon}"></i> ${t.label}
        ${t.count != null ? `<span class="count">${t.count}</span>` : ''}
      </div>`).join('')}
    </div>
    ${tabContent}
  `);
    }

    // ============================================================
    // ISSUE LIST
    // ============================================================
    function renderIssueList(repo, type) {
      const isIssue = type === 'issue';
      const icon = isIssue ? 'bi-exclamation-diamond' : 'bi-git';
      const noun = isIssue ? 'issue' : 'pull request';

      // Read filter state from DOM or defaults
      const filterState = window._issueFilter || 'open';
      const filterLabel = window._labelFilter || '';
      const filterMilestone = window._milestoneFilter || '';
      const sortBy = window._issueSort || 'newest';
      const searchQ = window._issueSearch || '';

      let items = DB.getIssuesByRepo(repo.id, type);

      // Apply filters
      items = items.filter(i => i.state === filterState);
      if (filterLabel) items = items.filter(i => i.labels && i.labels.includes(filterLabel));
      if (filterMilestone) items = items.filter(i => i.milestone_id === filterMilestone);
      if (searchQ) items = items.filter(i => i.title.toLowerCase().includes(searchQ.toLowerCase()) || (i.body || '').toLowerCase().includes(searchQ.toLowerCase()));

      // Sort
      if (sortBy === 'newest') items.sort((a, b) => b.created_at - a.created_at);
      else if (sortBy === 'oldest') items.sort((a, b) => a.created_at - b.created_at);
      else if (sortBy === 'updated') items.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at));
      else if (sortBy === 'comments') items.sort((a, b) => (DB.getCommentsByIssue(b.id).length) - (DB.getCommentsByIssue(a.id).length));

      const labels = DB.labels().filter(l => l.repo_id === repo.id);
      const milestones = DB.milestones().filter(m => m.repo_id === repo.id && m.state === 'open');

      const allItems = DB.getIssuesByRepo(repo.id, type);
      const openCount = allItems.filter(i => i.state === 'open').length;
      const closedCount = allItems.filter(i => i.state === 'closed').length;

      return `
    <div>
      <!-- Search + New -->
      <div style="display:flex; gap:.75rem; margin-bottom:1rem; align-items:center;">
        <input type="text" class="form-control-custom" placeholder="Search ${noun}s..." value="${esc(searchQ)}"
          oninput="window._issueSearch=this.value; reRenderTab()" style="flex:1; max-width:320px;">

        <!-- Label Filter -->
        <div class="dropdown">
          <button class="filter-btn ${filterLabel ? 'active' : ''}" data-bs-toggle="dropdown">
            <i class="bi bi-tag"></i> Label ${filterLabel ? `<span class="badge badge-count">${esc(filterLabel)}</span>` : ''}
          </button>
          <ul class="dropdown-menu dropdown-menu-dark" style="min-width:200px; background:var(--bg-overlay); border-color:var(--border-default);">
            <li><a class="dropdown-item" style="font-size:13px; color:var(--text-secondary);" onclick="window._labelFilter=''; reRenderTab()">All labels</a></li>
            ${labels.map(l => `<li><a class="dropdown-item" style="font-size:13px;" onclick="window._labelFilter='${esc(l.name)}'; reRenderTab()">
              <span class="label-badge" style="background:${l.color}20; color:${l.color}; margin-right:.5rem;">${esc(l.name)}</span></a></li>`).join('')}
          </ul>
        </div>

        <!-- Milestone Filter -->
        <div class="dropdown">
          <button class="filter-btn ${filterMilestone ? 'active' : ''}" data-bs-toggle="dropdown">
            <i class="bi bi-signpost-2"></i> Milestone
          </button>
          <ul class="dropdown-menu dropdown-menu-dark" style="min-width:200px; background:var(--bg-overlay); border-color:var(--border-default);">
            <li><a class="dropdown-item" style="font-size:13px; color:var(--text-secondary);" onclick="window._milestoneFilter=''; reRenderTab()">All milestones</a></li>
            ${milestones.map(m => `<li><a class="dropdown-item" style="font-size:13px;" onclick="window._milestoneFilter='${m.id}'; reRenderTab()">${esc(m.title)}</a></li>`).join('')}
          </ul>
        </div>

        <!-- Sort -->
        <div class="dropdown">
          <button class="filter-btn" data-bs-toggle="dropdown"><i class="bi bi-sort-down"></i> Sort</button>
          <ul class="dropdown-menu dropdown-menu-dark" style="background:var(--bg-overlay); border-color:var(--border-default);">
            ${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['updated', 'Recently updated'], ['comments', 'Most commented']].map(([v, l]) =>
        `<li><a class="dropdown-item ${sortBy === v ? 'active' : ''}" style="font-size:13px;" onclick="window._issueSort='${v}'; reRenderTab()">${l}</a></li>`).join('')}
          </ul>
        </div>

        <button class="btn-primary-custom" onclick="${isIssue ? `showNewIssueModal('${repo.id}','issue')` : `showNewIssueModal('${repo.id}','pr')`}">
          <i class="bi bi-plus-lg"></i> New ${isIssue ? 'Issue' : 'Pull Request'}
        </button>
      </div>

      <!-- Issue List Card -->
      <div class="card-custom">
        <!-- Open/Closed toggle -->
        <div style="display:flex; align-items:center; padding:.75rem 1rem; gap:1rem; border-bottom:1px solid var(--border-default);">
          <button class="filter-btn ${filterState === 'open' ? 'active' : ''}" onclick="window._issueFilter='open'; reRenderTab()">
            <i class="bi ${icon}" style="color:var(--accent-green)"></i> ${openCount} Open
          </button>
          <button class="filter-btn ${filterState === 'closed' ? 'active' : ''}" onclick="window._issueFilter='closed'; reRenderTab()">
            <i class="bi bi-check-circle" style="color:var(--text-muted)"></i> ${closedCount} Closed
          </button>
          ${filterLabel || filterMilestone || searchQ ? `
            <button class="filter-btn" style="margin-left:auto; font-size:12px;" onclick="window._labelFilter=''; window._milestoneFilter=''; window._issueSearch=''; reRenderTab()">
              <i class="bi bi-x"></i> Clear filters
            </button>` : ''}
        </div>

        ${items.length === 0 ? `
          <div class="empty-state">
            <i class="bi ${icon}"></i>
            <h4>No ${filterState} ${noun}s found</h4>
            <p style="margin-bottom:1rem;">${searchQ || filterLabel ? 'Try clearing filters' : `Create a new ${noun} to get started`}</p>
          </div>` :
          items.map(issue => renderIssueRow(issue, repo.id)).join('')}
      </div>
    </div>`;
    }

    function renderIssueRow(issue, repo_id) {
      const labels = DB.labels().filter(l => l.repo_id === repo_id && issue.labels && issue.labels.includes(l.id));
      const milestone = issue.milestone_id ? DB.milestones().find(m => m.id === issue.milestone_id) : null;
      const commentCount = DB.getCommentsByIssue(issue.id).length;
      const isOpen = issue.state === 'open';
      const isPR = issue.type === 'pr';

      let stateIcon, stateColor;
      if (isPR) {
        if (issue.merged) { stateIcon = 'bi-git'; stateColor = 'var(--accent-purple)'; }
        else if (isOpen) { stateIcon = 'bi-git'; stateColor = 'var(--accent-green)'; }
        else { stateIcon = 'bi-git'; stateColor = 'var(--accent-red)'; }
      } else {
        stateIcon = isOpen ? 'bi-exclamation-diamond' : 'bi-check-circle-fill';
        stateColor = isOpen ? 'var(--accent-green)' : 'var(--text-muted)';
      }

      return `<div class="issue-item" onclick="navigate('issue',{repo_id:'${repo_id}',issue_id:'${issue.id}'})">
    <i class="bi ${stateIcon} issue-icon" style="color:${stateColor}; font-size:1rem;"></i>
    <div style="flex:1; min-width:0;">
      <div class="issue-title">
        ${esc(issue.title)}
        ${labels.map(l => `<span class="label-badge" style="background:${l.color}20; color:${l.color}; margin-left:.3rem;">${esc(l.name)}</span>`).join('')}
      </div>
      <div class="issue-meta">
        #${issue.number} ${issue.state === 'open' ? 'opened' : 'closed'} ${fmt(issue.created_at)} by ${esc(issue.author || 'unknown')}
        ${milestone ? `· <i class="bi bi-signpost-2"></i> ${esc(milestone.title)}` : ''}
        ${isPR && issue.head_branch ? `· <code style="font-size:11px;">${esc(issue.head_branch)} → ${esc(issue.base_branch || 'main')}</code>` : ''}
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:1rem; flex-shrink:0;">
      ${commentCount > 0 ? `<span style="color:var(--text-muted); font-size:12px;"><i class="bi bi-chat"></i> ${commentCount}</span>` : ''}
    </div>
  </div>`;
    }

    function reRenderTab() { renderRepo(); }

    // ============================================================
    // ISSUE DETAIL
    // ============================================================
    function renderIssueDetail() {
      const issue = DB.issues().find(i => i.id === state.issue_id);
      if (!issue) { navigate('repo'); return; }
      const repo = DB.repos().find(r => r.id === issue.repo_id);
      const isPR = issue.type === 'pr';
      const comments = DB.getCommentsByIssue(issue.id);
      const repoLabels = DB.labels().filter(l => l.repo_id === issue.repo_id);
      const issueLabels = repoLabels.filter(l => issue.labels && issue.labels.includes(l.id));
      const milestone = issue.milestone_id ? DB.milestones().find(m => m.id === issue.milestone_id) : null;
      const milestones = DB.milestones().filter(m => m.repo_id === issue.repo_id && m.state === 'open');
      const user = DB.user();

      let stateBadge = '';
      if (isPR) {
        if (issue.merged) stateBadge = `<span class="issue-state-badge state-merged"><i class="bi bi-git"></i> Merged</span>`;
        else if (issue.state === 'open') stateBadge = `<span class="issue-state-badge state-open"><i class="bi bi-git"></i> Open</span>`;
        else stateBadge = `<span class="issue-state-badge state-closed"><i class="bi bi-git"></i> Closed</span>`;
      } else {
        if (issue.state === 'open') stateBadge = `<span class="issue-state-badge state-open"><i class="bi bi-exclamation-diamond"></i> Open</span>`;
        else stateBadge = `<span class="issue-state-badge state-closed"><i class="bi bi-check-circle-fill"></i> Closed</span>`;
      }

      renderContent(`
    <!-- Breadcrumb -->
    <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:1.5rem; flex-wrap:wrap;">
      <a onclick="navigate('repos')" style="color:var(--text-muted); cursor:pointer; font-size:13px;">${esc(repo?.name || '')}</a>
      <span style="color:var(--text-muted);">/</span>
      <a onclick="navigate('repo',{repo_id:'${repo?.id}', repo_tab:'issues'})" style="color:var(--text-muted); cursor:pointer; font-size:13px;">${isPR ? 'Pull Requests' : 'Issues'}</a>
      <span style="color:var(--text-muted);">/</span>
      <span style="font-size:13px;">#${issue.number}</span>
    </div>

    <!-- Title -->
    <div class="issue-detail-header">
      <div style="display:flex; align-items:flex-start; gap:1rem; margin-bottom:.75rem;">
        <h1 id="issueTitle" style="font-size:1.4rem; font-weight:700; margin:0; flex:1;">${esc(issue.title)}</h1>
        <button class="btn-outline-custom btn-sm-custom" onclick="editIssueTitle('${issue.id}')"><i class="bi bi-pencil"></i> Edit</button>
      </div>
      <div style="display:flex; align-items:center; gap:.75rem; flex-wrap:wrap;">
        ${stateBadge}
        <span style="color:var(--text-muted); font-size:13px;">
          <strong style="color:var(--text-primary);">${esc(issue.author || user.name)}</strong> 
          ${issue.state === 'open' ? 'opened' : 'closed'} this ${isPR ? 'pull request' : 'issue'} ${fmt(issue.created_at)} · ${comments.length} comment${comments.length !== 1 ? 's' : ''}
        </span>
        ${isPR && issue.head_branch ? `<code style="font-size:12px; background:var(--bg-overlay); padding:.2rem .5rem; border-radius:4px;">${esc(issue.head_branch)} → ${esc(issue.base_branch || 'main')}</code>` : ''}
      </div>
    </div>

    <div style="display:flex; gap:2rem; align-items:flex-start;">
      <!-- Main Content -->
      <div style="flex:1; min-width:0;">

        <!-- PR merge status -->
        ${isPR && issue.state === 'open' ? `
          <div style="background:var(--bg-overlay); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.25rem; margin-bottom:1rem; display:flex; align-items:center; gap:1rem;">
            <i class="bi bi-git" style="font-size:1.5rem; color:var(--accent-green);"></i>
            <div style="flex:1;">
              <div style="font-weight:600; font-size:14px;">This branch has no conflicts with the base branch</div>
              <div style="font-size:12px; color:var(--text-muted);">Merging can be performed automatically.</div>
            </div>
            <button class="btn-primary-custom" onclick="mergePR('${issue.id}')"><i class="bi bi-git"></i> Merge pull request</button>
          </div>` : ''}

        <!-- Issue Body -->
        <div class="comment-box">
          <div class="comment-header">
            <div>
              <span class="comment-author">${esc(issue.author || user.name)}</span>
              <span class="comment-time" style="margin-left:.5rem;">${fmt(issue.created_at)}</span>
            </div>
            <button class="btn-outline-custom btn-sm-custom" onclick="editIssueBody('${issue.id}')"><i class="bi bi-pencil"></i></button>
          </div>
          <div class="comment-body" id="issuebody-${issue.id}">
            ${issue.body ? `<p style="margin:0; line-height:1.7;">${md(issue.body)}</p>` : `<em style="color:var(--text-muted);">No description provided.</em>`}
          </div>
        </div>

        <!-- Comments -->
        ${comments.map(c => `
          <div class="comment-box" id="comment-${c.id}">
            <div class="comment-header">
              <div>
                <span class="comment-author">${esc(c.author || user.name)}</span>
                <span class="comment-time" style="margin-left:.5rem;">${fmt(c.created_at)}</span>
              </div>
              <button class="btn-danger-custom btn-sm-custom" onclick="deleteComment('${c.id}','${issue.id}')"><i class="bi bi-trash"></i></button>
            </div>
            <div class="comment-body"><p style="margin:0; line-height:1.7;">${md(c.body)}</p></div>
          </div>`).join('')}

        <!-- New Comment -->
        <div class="card-custom" style="padding:1rem;">
          <div style="font-size:13px; font-weight:500; margin-bottom:.75rem; color:var(--text-secondary);">
            <i class="bi bi-chat"></i> Leave a comment
          </div>
          <textarea id="newCommentBody" class="form-control-custom" placeholder="Write a comment... (supports **bold**, *italic*, \`code\`)" style="min-height:100px; margin-bottom:.75rem;"></textarea>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:.5rem;">
              ${issue.state === 'open' ?
          `<button class="btn-danger-custom" onclick="closeIssue('${issue.id}')"><i class="bi bi-${isPR ? 'x-circle' : 'dash-circle'}"></i> ${isPR ? 'Close PR' : 'Close issue'}</button>` :
          `<button class="btn-outline-custom" onclick="reopenIssue('${issue.id}')"><i class="bi bi-arrow-counterclockwise"></i> Reopen</button>`}
            </div>
            <button class="btn-primary-custom" onclick="addComment('${issue.id}')"><i class="bi bi-send"></i> Comment</button>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="detail-sidebar">
        <!-- Labels -->
        <div class="detail-sidebar-section">
          <div class="detail-sidebar-label">
            Labels
            <button class="btn-outline-custom btn-sm-custom" onclick="showLabelPicker('${issue.id}')"><i class="bi bi-pencil"></i></button>
          </div>
          ${issueLabels.length ? issueLabels.map(l => `<span class="label-badge d-block mb-1" style="background:${l.color}20; color:${l.color};">${esc(l.name)}</span>`).join('') : `<span style="color:var(--text-muted); font-size:12px;">None yet</span>`}
        </div>

        <!-- Milestone -->
        <div class="detail-sidebar-section">
          <div class="detail-sidebar-label">
            Milestone
            <div class="dropdown d-inline">
              <button class="btn-outline-custom btn-sm-custom" data-bs-toggle="dropdown"><i class="bi bi-pencil"></i></button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" style="background:var(--bg-overlay); border-color:var(--border-default); font-size:13px;">
                <li><a class="dropdown-item" onclick="setMilestone('${issue.id}', '')">No milestone</a></li>
                ${milestones.map(m => `<li><a class="dropdown-item" onclick="setMilestone('${issue.id}','${m.id}')">${esc(m.title)}</a></li>`).join('')}
              </ul>
            </div>
          </div>
          ${milestone ? `
            <div style="font-size:13px; color:var(--accent-blue);">${esc(milestone.title)}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:.2rem;">${milestone.due_date ? `Due ${new Date(milestone.due_date).toLocaleDateString()}` : 'No due date'}</div>
          ` : `<span style="color:var(--text-muted); font-size:12px;">No milestone</span>`}
        </div>

        <!-- Actions -->
        <div class="detail-sidebar-section">
          <div class="detail-sidebar-label">Actions</div>
          <button class="btn-danger-custom" style="width:100%;" onclick="deleteIssue('${issue.id}')"><i class="bi bi-trash"></i> Delete ${isPR ? 'PR' : 'Issue'}</button>
        </div>
      </div>
    </div>
  `);
    }

    // ============================================================
    // COMMENT ACTIONS
    // ============================================================
    function addComment(issue_id) {
      const body = document.getElementById('newCommentBody').value.trim();
      if (!body) { toast('Comment cannot be empty', 'error'); return; }
      const user = DB.user();
      const c = { id: uid(), issue_id, body, author: user.name, created_at: Date.now() };
      DB.saveComment(c);
      // Update issue
      const issue = DB.issues().find(i => i.id === issue_id);
      if (issue) { issue.updated_at = Date.now(); DB.saveIssue(issue); }
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> commented on <strong>#${issue?.number}</strong>`, icon: 'bi-chat', color: 'var(--accent-blue)' });
      toast('Comment added');
      render();
    }
    function deleteComment(comment_id, issue_id) {
      DB.deleteComment(comment_id);
      toast('Comment deleted');
      render();
    }

    // ============================================================
    // ISSUE ACTIONS
    // ============================================================
    function closeIssue(id) {
      const issue = DB.issues().find(i => i.id === id);
      if (!issue) return;
      const body = document.getElementById('newCommentBody')?.value.trim();
      if (body) { DB.saveComment({ id: uid(), issue_id: id, body, author: DB.user().name, created_at: Date.now() }); }
      issue.state = 'closed'; issue.closed_at = Date.now(); issue.updated_at = Date.now();
      DB.saveIssue(issue);
      DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> closed <strong>#${issue.number}</strong> ${esc(issue.title)}`, icon: 'bi-dash-circle', color: 'var(--accent-red)' });
      toast(`${issue.type === 'pr' ? 'PR' : 'Issue'} closed`);
      render();
    }
    function reopenIssue(id) {
      const issue = DB.issues().find(i => i.id === id);
      if (!issue) return;
      issue.state = 'open'; issue.closed_at = null; issue.updated_at = Date.now();
      DB.saveIssue(issue);
      DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> reopened <strong>#${issue.number}</strong> ${esc(issue.title)}`, icon: 'bi-exclamation-diamond', color: 'var(--accent-green)' });
      toast('Reopened');
      render();
    }
    function mergePR(id) {
      const issue = DB.issues().find(i => i.id === id);
      if (!issue) return;
      issue.state = 'closed'; issue.merged = true; issue.merged_at = Date.now(); issue.updated_at = Date.now();
      DB.saveIssue(issue);
      DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> merged PR <strong>#${issue.number}</strong> ${esc(issue.title)}`, icon: 'bi-git', color: 'var(--accent-purple)' });
      toast('Pull request merged!');
      render();
    }
    function deleteIssue(id) {
      const issue = DB.issues().find(i => i.id === id);
      if (!issue) return;
      if (!confirm(`Delete this ${issue.type === 'pr' ? 'pull request' : 'issue'}? This cannot be undone.`)) return;
      DB.deleteIssue(id);
      toast('Deleted');
      navigate('repo', { repo_id: issue.repo_id, repo_tab: 'issues' });
    }
    function setMilestone(issue_id, milestone_id) {
      const issue = DB.issues().find(i => i.id === issue_id);
      if (!issue) return;
      issue.milestone_id = milestone_id || null; issue.updated_at = Date.now();
      DB.saveIssue(issue);
      toast('Milestone updated');
      render();
    }
    function editIssueTitle(id) {
      const issue = DB.issues().find(i => i.id === id);
      const newTitle = prompt('Edit title:', issue.title);
      if (newTitle && newTitle.trim()) {
        issue.title = newTitle.trim(); issue.updated_at = Date.now();
        DB.saveIssue(issue);
        toast('Title updated');
        render();
      }
    }
    function editIssueBody(id) {
      const issue = DB.issues().find(i => i.id === id);
      showModal('Edit Description', `
    <textarea id="editBodyText" class="form-control-custom" style="min-height:200px;">${esc(issue.body || '')}</textarea>
  `, () => {
        issue.body = document.getElementById('editBodyText').value;
        issue.updated_at = Date.now();
        DB.saveIssue(issue);
        toast('Description updated');
        closeModal(); render();
      }, 'Save Changes');
    }

    // ============================================================
    // LABEL PICKER
    // ============================================================
    function showLabelPicker(issue_id) {
      const issue = DB.issues().find(i => i.id === issue_id);
      const labels = DB.labels().filter(l => l.repo_id === issue.repo_id);
      const selected = new Set(issue.labels || []);

      showModal('Apply Labels', `
    <div id="labelPickerList">
      ${labels.length === 0 ? '<p style="color:var(--text-muted);">No labels in this project. Create some in the Labels tab.</p>' :
          labels.map(l => `
          <label class="checkbox-label">
            <input type="checkbox" id="lbl_${l.id}" ${selected.has(l.id) ? 'checked' : ''}>
            <span class="label-badge" style="background:${l.color}20; color:${l.color}; flex:1;">${esc(l.name)}</span>
            ${l.description ? `<span style="color:var(--text-muted); font-size:11px;">${esc(l.description)}</span>` : ''}
          </label>`).join('')}
    </div>
  `, () => {
        issue.labels = labels.filter(l => document.getElementById('lbl_' + l.id)?.checked).map(l => l.id);
        issue.updated_at = Date.now();
        DB.saveIssue(issue);
        toast('Labels updated');
        closeModal(); render();
      }, 'Apply Labels');
    }

    // ============================================================
    // MILESTONES
    // ============================================================
    function renderMilestones(repo) {
      const milestones = DB.milestones().filter(m => m.repo_id === repo.id);
      const filterState = window._msFilter || 'open';
      const filtered = milestones.filter(m => m.state === filterState);

      return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div style="display:flex; gap:.5rem;">
          <button class="filter-btn ${filterState === 'open' ? 'active' : ''}" onclick="window._msFilter='open'; reRenderTab()">
            <i class="bi bi-signpost-2"></i> ${milestones.filter(m => m.state === 'open').length} Open
          </button>
          <button class="filter-btn ${filterState === 'closed' ? 'active' : ''}" onclick="window._msFilter='closed'; reRenderTab()">
            <i class="bi bi-check-circle"></i> ${milestones.filter(m => m.state === 'closed').length} Closed
          </button>
        </div>
        <button class="btn-primary-custom" onclick="showNewMilestoneModal('${repo.id}')"><i class="bi bi-plus-lg"></i> New Milestone</button>
      </div>

      ${filtered.length === 0 ? `<div class="empty-state"><i class="bi bi-signpost-2"></i><h4>No ${filterState} milestones</h4></div>` :
          filtered.map(m => {
            const mIssues = DB.getIssuesByRepo(repo.id).filter(i => i.milestone_id === m.id);
            const closed = mIssues.filter(i => i.state === 'closed').length;
            const pct = mIssues.length ? Math.round(closed / mIssues.length * 100) : 0;
            const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.state === 'open';
            return `<div class="milestone-card">
            <div style="display:flex; align-items:flex-start; justify-content:space-between;">
              <div>
                <span style="font-weight:600; font-size:15px;">${esc(m.title)}</span>
                ${m.due_date ? `<span style="font-size:12px; margin-left:.75rem; color:${isOverdue ? 'var(--accent-red)' : 'var(--text-muted)'};">
                  <i class="bi bi-calendar3"></i> ${isOverdue ? 'Overdue · ' : ''}Due ${new Date(m.due_date).toLocaleDateString()}</span>` : ''}
              </div>
              <div style="display:flex; gap:.5rem;">
                <button class="btn-outline-custom btn-sm-custom" onclick="showEditMilestoneModal('${m.id}')"><i class="bi bi-pencil"></i></button>
                ${m.state === 'open' ? `<button class="btn-outline-custom btn-sm-custom" onclick="closeMilestone('${m.id}')"><i class="bi bi-check-circle"></i> Close</button>` :
                `<button class="btn-outline-custom btn-sm-custom" onclick="openMilestone('${m.id}')"><i class="bi bi-arrow-counterclockwise"></i> Reopen</button>`}
                <button class="btn-danger-custom btn-sm-custom" onclick="deleteMilestone('${m.id}')"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            ${m.description ? `<p style="color:var(--text-secondary); font-size:13px; margin-top:.5rem; margin-bottom:0;">${esc(m.description)}</p>` : ''}
            <div class="milestone-progress"><div class="milestone-progress-bar" style="width:${pct}%"></div></div>
            <div style="font-size:12px; color:var(--text-muted);">${pct}% complete · ${mIssues.length - closed} open · ${closed} closed</div>
          </div>`;
          }).join('')}
    </div>`;
    }

    function showNewMilestoneModal(repo_id) {
      showModal('New Milestone', `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Title *</label><input type="text" id="ms_title" class="form-control-custom" placeholder="e.g., v1.0.0 Release"></div>
      <div><label class="form-label-custom">Description</label><textarea id="ms_desc" class="form-control-custom" placeholder="Optional description"></textarea></div>
      <div><label class="form-label-custom">Due Date</label><input type="date" id="ms_due" class="form-control-custom"></div>
    </div>
  `, () => {
        const title = document.getElementById('ms_title').value.trim();
        if (!title) { toast('Title is required', 'error'); return; }
        const m = { id: uid(), repo_id, title, description: document.getElementById('ms_desc').value, due_date: document.getElementById('ms_due').value || null, state: 'open', created_at: Date.now() };
        DB.saveMilestone(m);
        DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> created milestone <strong>${esc(title)}</strong>`, icon: 'bi-signpost-2', color: 'var(--accent-blue)' });
        toast('Milestone created');
        closeModal(); reRenderTab();
      }, 'Create Milestone');
    }

    function showEditMilestoneModal(id) {
      const m = DB.milestones().find(x => x.id === id);
      showModal('Edit Milestone', `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Title *</label><input type="text" id="ms_title" class="form-control-custom" value="${esc(m.title)}"></div>
      <div><label class="form-label-custom">Description</label><textarea id="ms_desc" class="form-control-custom">${esc(m.description || '')}</textarea></div>
      <div><label class="form-label-custom">Due Date</label><input type="date" id="ms_due" class="form-control-custom" value="${m.due_date || ''}"></div>
    </div>
  `, () => {
        const title = document.getElementById('ms_title').value.trim();
        if (!title) { toast('Title is required', 'error'); return; }
        m.title = title; m.description = document.getElementById('ms_desc').value; m.due_date = document.getElementById('ms_due').value || null;
        DB.saveMilestone(m);
        toast('Milestone updated');
        closeModal(); reRenderTab();
      }, 'Save Changes');
    }

    function closeMilestone(id) { const m = DB.milestones().find(x => x.id === id); m.state = 'closed'; DB.saveMilestone(m); toast('Milestone closed'); reRenderTab(); }
    function openMilestone(id) { const m = DB.milestones().find(x => x.id === id); m.state = 'open'; DB.saveMilestone(m); toast('Milestone reopened'); reRenderTab(); }
    function deleteMilestone(id) {
      if (!confirm('Delete this milestone?')) return;
      DB.deleteMilestone(id); toast('Milestone deleted'); reRenderTab();
    }

    // ============================================================
    // LABELS
    // ============================================================
    function renderLabels(repo) {
      const labels = DB.labels().filter(l => l.repo_id === repo.id);
      return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <span style="color:var(--text-secondary); font-size:13px;">${labels.length} label${labels.length !== 1 ? 's' : ''}</span>
        <div style="display:flex; gap:.5rem;">
          <button class="btn-outline-custom btn-sm-custom" onclick="seedDefaultLabels('${repo.id}')"><i class="bi bi-stars"></i> Add defaults</button>
          <button class="btn-primary-custom" onclick="showNewLabelModal('${repo.id}')"><i class="bi bi-plus-lg"></i> New Label</button>
        </div>
      </div>
      ${labels.length === 0 ? `<div class="empty-state"><i class="bi bi-tags"></i><h4>No labels yet</h4><p>Create labels to organize your issues.</p></div>` :
          `<div class="card-custom">
          ${labels.map((l, i) => `
            <div style="display:flex; align-items:center; gap:1rem; padding:.875rem 1.25rem; ${i > 0 ? 'border-top:1px solid var(--border-default)' : ''}">
              <span class="label-badge" style="background:${l.color}; color:${textColor(l.color)}; min-width:100px; justify-content:center;">${esc(l.name)}</span>
              <span style="color:var(--text-muted); font-size:13px; flex:1;">${esc(l.description || '')}</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted);">${l.color}</span>
              <div style="display:flex; gap:.5rem;">
                <button class="btn-outline-custom btn-sm-custom" onclick="showEditLabelModal('${l.id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn-danger-custom btn-sm-custom" onclick="deleteLabel('${l.id}')"><i class="bi bi-trash"></i></button>
              </div>
            </div>`).join('')}
        </div>`}
    </div>`;
    }

    function labelForm(label = {}) {
      const color = label.color || LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
      return `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Label Name *</label><input type="text" id="lbl_name" class="form-control-custom" value="${esc(label.name || '')}" placeholder="e.g., bug, feature, enhancement"></div>
      <div><label class="form-label-custom">Description</label><input type="text" id="lbl_desc" class="form-control-custom" value="${esc(label.description || '')}" placeholder="Optional description"></div>
      <div>
        <label class="form-label-custom">Color</label>
        <div style="display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem;">
          <input type="text" id="lbl_color" class="form-control-custom" value="${color}" style="font-family:var(--font-mono); flex:1;" oninput="updateColorPreview(this.value)">
          <div id="colorPreview" style="width:36px; height:36px; border-radius:6px; background:${color}; border:2px solid var(--border-default);"></div>
        </div>
        <div class="color-swatches">
          ${LABEL_COLORS.map(c => `<div class="color-swatch ${c === color ? 'selected' : ''}" style="background:${c}" onclick="selectLabelColor('${c}')"></div>`).join('')}
        </div>
      </div>
    </div>`;
    }
    function updateColorPreview(val) {
      const prev = document.getElementById('colorPreview');
      if (prev && /^#[0-9a-fA-F]{6}$/.test(val)) prev.style.background = val;
    }
    function selectLabelColor(c) {
      document.getElementById('lbl_color').value = c;
      updateColorPreview(c);
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      event.target.classList.add('selected');
    }

    function showNewLabelModal(repo_id) {
      showModal('New Label', labelForm(), () => {
        const name = document.getElementById('lbl_name').value.trim();
        const color = document.getElementById('lbl_color').value;
        if (!name) { toast('Name is required', 'error'); return; }
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) { toast('Invalid color format', 'error'); return; }
        DB.saveLabel({ id: uid(), repo_id, name, description: document.getElementById('lbl_desc').value, color });
        toast('Label created');
        closeModal(); reRenderTab();
      }, 'Create Label');
    }
    function showEditLabelModal(id) {
      const l = DB.labels().find(x => x.id === id);
      showModal('Edit Label', labelForm(l), () => {
        const name = document.getElementById('lbl_name').value.trim();
        const color = document.getElementById('lbl_color').value;
        if (!name) { toast('Name is required', 'error'); return; }
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) { toast('Invalid color format', 'error'); return; }
        l.name = name; l.description = document.getElementById('lbl_desc').value; l.color = color;
        DB.saveLabel(l);
        toast('Label updated');
        closeModal(); reRenderTab();
      }, 'Save Changes');
    }
    function deleteLabel(id) {
      if (!confirm('Delete this label?')) return;
      DB.deleteLabel(id); toast('Label deleted'); reRenderTab();
    }
    function seedDefaultLabels(repo_id) {
      const existing = DB.labels().filter(l => l.repo_id === repo_id).map(l => l.name);
      let added = 0;
      DEFAULT_LABELS.forEach(l => {
        if (!existing.includes(l.name)) { DB.saveLabel({ id: uid(), repo_id, ...l }); added++; }
      });
      toast(`Added ${added} default labels`);
      reRenderTab();
    }

    // ============================================================
    // PROJECT BOARDS (KANBAN)
    // ============================================================
    function renderBoards(repo) {
      const boards = DB.boards().filter(b => b.repo_id === repo.id);
      return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1rem; font-weight:600; margin:0;">Project Boards</h2>
        <button class="btn-primary-custom" onclick="showNewBoardModal('${repo.id}')"><i class="bi bi-plus-lg"></i> New Board</button>
      </div>
      ${boards.length === 0 ? `<div class="empty-state"><i class="bi bi-kanban"></i><h4>No board boards yet</h4><p>Create a board to track work with a Kanban workflow.</p></div>` :
          boards.map(b => `
          <div class="card-custom" style="margin-bottom:1rem; padding:1.25rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem;">
              <div>
                <span style="font-weight:600; font-size:15px;">${esc(b.name)}</span>
                <span style="color:var(--text-muted); font-size:12px; margin-left:.75rem;">${b.columns.reduce((s, c) => s + c.issue_ids.length, 0)} cards</span>
              </div>
              <div style="display:flex; gap:.5rem;">
                <button class="btn-primary-custom btn-sm-custom" onclick="openBoard('${b.id}')"><i class="bi bi-kanban"></i> Open Board</button>
                <button class="btn-danger-custom btn-sm-custom" onclick="deleteBoard('${b.id}')"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <div style="display:flex; gap:.75rem;">
              ${b.columns.map(c => `<span style="background:var(--bg-overlay); border:1px solid var(--border-default); border-radius:4px; padding:.3rem .7rem; font-size:12px; color:var(--text-secondary);">${esc(c.name)} <strong style="color:var(--text-primary);">${c.issue_ids.length}</strong></span>`).join('')}
            </div>
          </div>`).join('')}
    </div>`;
    }

    function showNewBoardModal(repo_id) {
      showModal('New Project Board', `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Board Name *</label><input type="text" id="board_name" class="form-control-custom" placeholder="e.g., Sprint 1, Roadmap"></div>
      <div>
        <label class="form-label-custom">Columns (comma-separated)</label>
        <input type="text" id="board_cols" class="form-control-custom" value="To Do, In Progress, In Review, Done" placeholder="Column names">
      </div>
    </div>
  `, () => {
        const name = document.getElementById('board_name').value.trim();
        if (!name) { toast('Name is required', 'error'); return; }
        const cols = document.getElementById('board_cols').value.split(',').map(c => c.trim()).filter(Boolean);
        if (cols.length < 2) { toast('At least 2 columns required', 'error'); return; }
        const board = { id: uid(), repo_id, name, created_at: Date.now(), columns: cols.map(c => ({ id: uid(), name: c, issue_ids: [] })) };
        DB.saveBoard(board);
        DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> created board <strong>${esc(name)}</strong>`, icon: 'bi-kanban', color: 'var(--accent-orange)' });
        toast('Board created');
        closeModal(); openBoard(board.id);
      }, 'Create Board');
    }

    function openBoard(board_id) {
      // Render full Kanban
      const board = DB.boards().find(b => b.id === board_id);
      if (!board) return;
      const repo = DB.repos().find(r => r.id === board.repo_id);
      const repoIssues = DB.getIssuesByRepo(board.repo_id);

      renderContent(`
    <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:1.5rem;">
      <a onclick="navigate('repo',{repo_id:'${board.repo_id}',repo_tab:'boards'})" style="color:var(--text-muted); cursor:pointer; font-size:13px;">${esc(repo?.name || '')} / Boards</a>
      <span style="color:var(--text-muted);">/</span>
      <span style="font-weight:600;">${esc(board.name)}</span>
      <button class="btn-outline-custom btn-sm-custom" style="margin-left:auto;" onclick="showAddColumnModal('${board.id}')"><i class="bi bi-plus-lg"></i> Add Column</button>
    </div>

    <div class="kanban-board" id="kanbanBoard" ondragover="event.preventDefault()">
      ${board.columns.map(col => `
        <div class="kanban-col" id="col_${col.id}" ondragover="event.preventDefault(); this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="dropCard(event,'${board.id}','${col.id}')">
          <div class="kanban-col-header">
            <span>${esc(col.name)}</span>
            <div style="display:flex; align-items:center; gap:.5rem;">
              <span class="badge-count">${col.issue_ids.length}</span>
              <div class="dropdown">
                <button class="btn-outline-custom btn-sm-custom" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i></button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" style="background:var(--bg-overlay); border-color:var(--border-default); font-size:13px;">
                  <li><a class="dropdown-item" onclick="showAddCardToColumn('${board.id}','${col.id}')"><i class="bi bi-plus"></i> Add card</a></li>
                  <li><a class="dropdown-item" onclick="renameColumn('${board.id}','${col.id}')"><i class="bi bi-pencil"></i> Rename</a></li>
                  <li><hr class="dropdown-divider" style="border-color:var(--border-default)"></li>
                  <li><a class="dropdown-item text-danger" onclick="deleteColumn('${board.id}','${col.id}')"><i class="bi bi-trash"></i> Delete</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div style="padding:.5rem; min-height:100px;">
            ${col.issue_ids.map(iid => {
        const issue = repoIssues.find(i => i.id === iid);
        if (!issue) return '';
        const isPR = issue.type === 'pr';
        const color = issue.state === 'closed' ? 'var(--text-muted)' : isPR ? 'var(--accent-purple)' : 'var(--accent-green)';
        return `<div class="kanban-card" draggable="true" id="card_${issue.id}" 
                ondragstart="dragCard(event,'${issue.id}')"
                onclick="navigate('issue',{repo_id:'${board.repo_id}',issue_id:'${issue.id}'})">
                <div class="kanban-card-title">${esc(issue.title)}</div>
                <div class="kanban-card-meta">
                  <i class="bi ${isPR ? 'bi-git' : 'bi-exclamation-diamond'}" style="color:${color}"></i>
                  #${issue.number}
                  ${issue.labels?.length ? `<i class="bi bi-tag" style="margin-left:.3rem;"></i>` : ''}
                </div>
              </div>`;
      }).join('')}
            <button class="btn-outline-custom btn-sm-custom" style="width:100%; margin-top:.5rem; justify-content:center;" onclick="showAddCardToColumn('${board.id}','${col.id}')">
              <i class="bi bi-plus"></i> Add card
            </button>
          </div>
        </div>`).join('')}
    </div>
  `);
      state.view = 'board';
      state.board_id = board_id;
    }

    let _dragCardId = null;
    function dragCard(ev, card_id) { _dragCardId = card_id; ev.dataTransfer.effectAllowed = 'move'; }
    function dropCard(ev, board_id, col_id) {
      ev.preventDefault();
      document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
      if (!_dragCardId) return;
      const board = DB.boards().find(b => b.id === board_id);
      if (!board) return;
      // Remove from all cols
      board.columns.forEach(c => { c.issue_ids = c.issue_ids.filter(id => id !== _dragCardId); });
      // Add to target col
      const col = board.columns.find(c => c.id === col_id);
      if (col && !col.issue_ids.includes(_dragCardId)) col.issue_ids.push(_dragCardId);
      DB.saveBoard(board);
      _dragCardId = null;
      openBoard(board_id);
    }

    function showAddCardToColumn(board_id, col_id) {
      const board = DB.boards().find(b => b.id === board_id);
      const allIssues = DB.getIssuesByRepo(board.repo_id);
      const usedIds = board.columns.flatMap(c => c.issue_ids);
      const available = allIssues.filter(i => !usedIds.includes(i.id));

      showModal('Add Card', `
    <div>
      <label class="form-label-custom">Select Issue or PR</label>
      <select id="addCardSelect" class="form-control-custom" size="8" style="height:auto;">
        ${available.length === 0 ? '<option disabled>All issues are already on this board</option>' :
          available.map(i => `<option value="${i.id}">#${i.number} — ${esc(i.title)} [${i.type}]</option>`).join('')}
      </select>
      <div class="divider"></div>
      <label class="form-label-custom">Or create a new issue first</label>
      <button class="btn-outline-custom" onclick="closeModal(); showNewIssueModal('${board.repo_id}','issue')"><i class="bi bi-plus"></i> New Issue</button>
    </div>
  `, () => {
        const sel = document.getElementById('addCardSelect').value;
        if (!sel) { toast('Select an issue', 'error'); return; }
        const col = board.columns.find(c => c.id === col_id);
        if (col && !col.issue_ids.includes(sel)) col.issue_ids.push(sel);
        DB.saveBoard(board);
        toast('Card added');
        closeModal(); openBoard(board_id);
      }, 'Add to Board');
    }

    function renameColumn(board_id, col_id) {
      const board = DB.boards().find(b => b.id === board_id);
      const col = board.columns.find(c => c.id === col_id);
      const name = prompt('Rename column:', col.name);
      if (name && name.trim()) { col.name = name.trim(); DB.saveBoard(board); openBoard(board_id); }
    }
    function deleteColumn(board_id, col_id) {
      if (!confirm('Delete this column and all its cards from the board?')) return;
      const board = DB.boards().find(b => b.id === board_id);
      board.columns = board.columns.filter(c => c.id !== col_id);
      DB.saveBoard(board); openBoard(board_id);
    }
    function showAddColumnModal(board_id) {
      showModal('Add Column', `
    <div><label class="form-label-custom">Column Name *</label><input type="text" id="newColName" class="form-control-custom" placeholder="e.g., Blocked, Testing"></div>
  `, () => {
        const name = document.getElementById('newColName').value.trim();
        if (!name) { toast('Name required', 'error'); return; }
        const board = DB.boards().find(b => b.id === board_id);
        board.columns.push({ id: uid(), name, issue_ids: [] });
        DB.saveBoard(board);
        toast('Column added');
        closeModal(); openBoard(board_id);
      }, 'Add Column');
    }
    function deleteBoard(id) {
      if (!confirm('Delete this board?')) return;
      DB.deleteBoard(id); toast('Board deleted'); reRenderTab();
    }

    // ============================================================
    // REPO SETTINGS
    // ============================================================
    function renderRepoSettings(repo) {
      return `
    <div style="max-width:600px;">
      <div class="card-custom" style="padding:1.5rem; margin-bottom:1.5rem;">
        <h3 style="font-size:1rem; font-weight:600; margin-bottom:1.25rem;">General Settings</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div><label class="form-label-custom">Project Name</label>
            <input type="text" id="settingName" class="form-control-custom" value="${esc(repo.name)}"></div>
          <div><label class="form-label-custom">Description</label>
            <input type="text" id="settingDesc" class="form-control-custom" value="${esc(repo.description || '')}"></div>
          <div><label class="form-label-custom">Default Branch</label>
            <input type="text" id="settingBranch" class="form-control-custom" value="${esc(repo.default_branch || 'main')}"></div>
          <div><label class="form-label-custom">Visibility</label>
            <select id="settingVis" class="form-control-custom">
              <option value="public" ${repo.visibility === 'public' ? 'selected' : ''}>Public</option>
              <option value="private" ${repo.visibility === 'private' ? 'selected' : ''}>Private</option>
            </select></div>
          <button class="btn-primary-custom" onclick="saveRepoSettings('${repo.id}')"><i class="bi bi-check-lg"></i> Save Settings</button>
        </div>
      </div>
      <div class="card-custom" style="padding:1.5rem; border-color:rgba(248,81,73,.3);">
        <h3 style="font-size:1rem; font-weight:600; margin-bottom:.5rem; color:var(--accent-red);">Danger Zone</h3>
        <p style="color:var(--text-secondary); font-size:13px; margin-bottom:1rem;">Once you delete a project, there is no going back. This will delete all issues, PRs, boards, milestones, and labels.</p>
        <button class="btn-danger-custom" onclick="confirmDeleteRepo('${repo.id}')"><i class="bi bi-trash"></i> Delete Project</button>
      </div>
    </div>`;
    }

    function saveRepoSettings(id) {
      const repo = DB.repos().find(r => r.id === id);
      const name = document.getElementById('settingName').value.trim();
      if (!name) { toast('Name is required', 'error'); return; }
      repo.name = name;
      repo.description = document.getElementById('settingDesc').value;
      repo.default_branch = document.getElementById('settingBranch').value.trim() || 'main';
      repo.visibility = document.getElementById('settingVis').value;
      DB.saveRepo(repo);
      toast('Settings saved');
      render();
    }


    function showImportModal() {
      DB.importRepo();
    }
    // ============================================================
    // Export
    // ============================================================
    function showExportModal() {
      DB.exportRepo();
    }

    // ============================================================
    // REPOS MODAL
    // ============================================================
    function showNewRepoModal() {
      showModal('New Project', `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Project Name *</label>
        <input type="text" id="repo_name" class="form-control-custom" placeholder="my-awesome-board" autofocus></div>
      <div><label class="form-label-custom">Description</label>
        <input type="text" id="repo_desc" class="form-control-custom" placeholder="Short description (optional)"></div>
      <div><label class="form-label-custom">Default Branch</label>
        <input type="text" id="repo_branch" class="form-control-custom" value="main" placeholder="main"></div>
      <div><label class="form-label-custom">Visibility</label>
        <select id="repo_vis" class="form-control-custom">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select></div>
      <label class="checkbox-label">
        <input type="checkbox" id="repo_seed_labels" checked>
        Add default labels automatically
      </label>
    </div>
  `, () => {
        const name = document.getElementById('repo_name').value.trim();
        if (!name) { toast('Name is required', 'error'); return; }
        if (DB.repos().find(r => r.name === name)) { toast('A project with this name already exists', 'error'); return; }
        const repo = { id: uid(), name, description: document.getElementById('repo_desc').value, default_branch: document.getElementById('repo_branch').value.trim() || 'main', visibility: document.getElementById('repo_vis').value, created_at: Date.now() };
        DB.saveRepo(repo);
        if (document.getElementById('repo_seed_labels').checked) {
          DEFAULT_LABELS.forEach(l => DB.saveLabel({ id: uid(), repo_id: repo.id, ...l }));
        }
        DB.logActivity({ html: `<strong>${esc(DB.user().name)}</strong> created project <strong>${esc(name)}</strong>`, icon: 'bi-folder-plus', color: 'var(--accent-blue)' });
        toast('Project created!');
        closeModal();
        navigate('repo', { repo_id: repo.id });
      }, 'Create Project', true);
    }

    function showEditRepoModal(id) {
      const r = DB.repos().find(x => x.id === id);
      showModal('Edit Project', `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Name *</label><input type="text" id="edit_repo_name" class="form-control-custom" value="${esc(r.name)}"></div>
      <div><label class="form-label-custom">Description</label><input type="text" id="edit_repo_desc" class="form-control-custom" value="${esc(r.description || '')}"></div>
      <div><label class="form-label-custom">Visibility</label>
        <select id="edit_repo_vis" class="form-control-custom">
          <option value="public" ${r.visibility === 'public' ? 'selected' : ''}>Public</option>
          <option value="private" ${r.visibility === 'private' ? 'selected' : ''}>Private</option>
        </select></div>
    </div>
  `, () => {
        const name = document.getElementById('edit_repo_name').value.trim();
        if (!name) { toast('Name required', 'error'); return; }
        r.name = name; r.description = document.getElementById('edit_repo_desc').value; r.visibility = document.getElementById('edit_repo_vis').value;
        DB.saveRepo(r); toast('Project updated'); closeModal(); render();
      }, 'Save Changes');
    }

    function confirmDeleteRepo(id) {
      const r = DB.repos().find(x => x.id === id);
      if (!confirm(`Delete "${r.name}"?\n\nThis will permanently delete all issues, PRs, boards, milestones, and labels. This cannot be undone.`)) return;
      DB.deleteRepo(id);
      toast(`Project "${r.name}" deleted`);
      navigate('repos');
    }

    // ============================================================
    // NEW ISSUE/PR MODAL
    // ============================================================
    function showNewIssueModal(repo_id, type = 'issue') {
      const isIssue = type === 'issue';
      const labels = DB.labels().filter(l => l.repo_id === repo_id);
      const milestones = DB.milestones().filter(m => m.repo_id === repo_id && m.state === 'open');
      const repo = DB.repos().find(r => r.id === repo_id);

      showModal(`New ${isIssue ? 'Issue' : 'Pull Request'}`, `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div><label class="form-label-custom">Title *</label>
        <input type="text" id="ni_title" class="form-control-custom" placeholder="${isIssue ? 'What\'s the issue?' : 'Describe this PR'}" autofocus></div>
      <div><label class="form-label-custom">Description</label>
        <textarea id="ni_body" class="form-control-custom" placeholder="Supports **bold**, *italic*, \`code\`..." style="min-height:120px;"></textarea></div>
      ${!isIssue ? `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem;">
          <div><label class="form-label-custom">Head Branch</label>
            <input type="text" id="ni_head" class="form-control-custom" placeholder="feature/my-feature"></div>
          <div><label class="form-label-custom">Base Branch</label>
            <input type="text" id="ni_base" class="form-control-custom" value="${esc(repo?.default_branch || 'main')}"></div>
        </div>` : ''}
      ${labels.length > 0 ? `
        <div>
          <label class="form-label-custom">Labels</label>
          <div style="display:flex; flex-wrap:wrap; gap:.4rem;">
            ${labels.map(l => `<label style="cursor:pointer; display:inline-flex; align-items:center; gap:.3rem;">
              <input type="checkbox" class="ni_label" value="${l.id}" style="accent-color:${l.color};">
              <span class="label-badge" style="background:${l.color}20; color:${l.color};">${esc(l.name)}</span>
            </label>`).join('')}
          </div>
        </div>` : ''}
      ${milestones.length > 0 ? `
        <div><label class="form-label-custom">Milestone</label>
          <select id="ni_milestone" class="form-control-custom">
            <option value="">— No milestone —</option>
            ${milestones.map(m => `<option value="${m.id}">${esc(m.title)}</option>`).join('')}
          </select></div>` : ''}
    </div>
  `, () => {
        const title = document.getElementById('ni_title').value.trim();
        if (!title) { toast('Title is required', 'error'); return; }
        const user = DB.user();
        const selLabels = [...document.querySelectorAll('.ni_label:checked')].map(c => c.value);
        const ms = document.getElementById('ni_milestone')?.value || '';
        const issue = {
          id: uid(), repo_id, type, number: DB.nextIssueNumber(repo_id),
          title, body: document.getElementById('ni_body').value,
          state: 'open', author: user.name, labels: selLabels,
          milestone_id: ms || null, created_at: Date.now(), updated_at: Date.now(),
          ...(type === 'pr' ? { head_branch: document.getElementById('ni_head')?.value.trim() || '', base_branch: document.getElementById('ni_base')?.value.trim() || 'main', merged: false } : {})
        };
        DB.saveIssue(issue);
        DB.logActivity({ html: `<strong>${esc(user.name)}</strong> opened ${type} <strong>#${issue.number} ${esc(title)}</strong>`, icon: type === 'pr' ? 'bi-git' : 'bi-exclamation-diamond', color: 'var(--accent-green)' });
        toast(`${isIssue ? 'Issue' : 'Pull request'} created!`);
        closeModal();
        navigate('issue', { repo_id, issue_id: issue.id });
      }, `Submit ${isIssue ? 'Issue' : 'Pull Request'}`, true);
    }

    // ============================================================
    // MY ISSUES / MY PRs
    // ============================================================
    function renderMyIssues() {
      renderContent(document.createElement('gpm-my-issues-view'));
    }

    // ============================================================
    // PROFILE
    // ============================================================
    function renderProfile() {
      renderContent(document.createElement('gpm-profile-view'));
    }

    function selectProfileColor(c, targetEl = null) {
      document.getElementById('prof_color').value = c;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      const chosen = targetEl || event?.target;
      if (chosen) chosen.classList.add('selected');
    }
    function saveProfile() {
      const u = { name: document.getElementById('prof_name').value.trim() || 'Developer', email: document.getElementById('prof_email').value.trim(), bio: document.getElementById('prof_bio').value, avatar_color: document.getElementById('prof_color').value || '#2f81f7' };
      DB.saveUser(u); toast('Profile saved'); render();
    }
    function clearAllData() {
      if (!confirm('Clear ALL data? This will delete all projects, issues, and settings.')) return;
      ['repos', 'issues', 'comments', 'milestones', 'labels', 'boards', 'activity', 'user'].forEach(k => localStorage.removeItem('ghpm_' + k));
      toast('All data cleared'); render();
    }

    // ============================================================
    // GLOBAL SEARCH
    // ============================================================
    let _searchTimeout;
    function handleGlobalSearch(q) {
      clearTimeout(_searchTimeout);
      if (q.trim().length < 2) return;
      _searchTimeout = setTimeout(() => { state.view = 'search'; state.searchQuery = q; render(); }, 300);
    }

    function renderSearch() {
      renderContent(document.createElement('gpm-search-view'));
    }

    // ============================================================
    // MODAL UTILITY
    // ============================================================
    function showModal(title, body, onConfirm, confirmText = 'Confirm', wide = false) {
      closeModal();
      const m = document.createElement('div');
      m.className = 'modal-custom show';
      m.id = 'activeModal';
      m.innerHTML = `
    <div class="modal-dialog-custom ${wide ? 'modal-wide' : ''}">
      <div class="modal-header-custom">
        <span class="modal-title-custom">${esc(title)}</span>
        <button class="modal-close" onclick="closeModal()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="modal-body-custom">${body}</div>
      <div class="modal-footer-custom">
        <button class="btn-outline-custom" onclick="closeModal()">Cancel</button>
        <button class="btn-primary-custom" id="modalConfirmBtn" onclick="window._modalConfirm && window._modalConfirm()">${esc(confirmText)}</button>
      </div>
    </div>`;
      document.getElementById('modalsContainer').appendChild(m);
      window._modalConfirm = onConfirm;
      // Close on backdrop click
      m.addEventListener('click', e => { if (e.target === m) closeModal(); });
      // Focus first input
      setTimeout(() => { const inp = m.querySelector('input[autofocus], input:not([type=checkbox]):not([type=hidden])'); inp?.focus(); }, 50);
      // Enter key to confirm
      m.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); onConfirm && onConfirm(); } });
    }

    function closeModal() {
      document.querySelectorAll('.modal-custom').forEach(m => m.remove());
      window._modalConfirm = null;
    }

    // ============================================================
    // SEED DEMO DATA
    // ============================================================
    function seedDemoData() {
      if (DB.repos().length > 0) return; // Don't seed if data exists

      const user = DB.user();
      const now = Date.now();

      // Create 2 demo repos
      const repo1 = { id: uid(), name: 'web-app', description: 'Main web application', visibility: 'public', default_branch: 'main', created_at: now - 86400000 * 7 };
      const repo2 = { id: uid(), name: 'api-server', description: 'Backend REST API service', visibility: 'private', default_branch: 'main', created_at: now - 86400000 * 3 };
      DB.saveRepo(repo1); DB.saveRepo(repo2);

      // Seed labels
      DEFAULT_LABELS.forEach(l => { DB.saveLabel({ id: uid(), repo_id: repo1.id, ...l }); DB.saveLabel({ id: uid(), repo_id: repo2.id, ...l }); });

      const labels1 = DB.labels().filter(l => l.repo_id === repo1.id);
      const bugLbl = labels1.find(l => l.name === 'bug')?.id;
      const featLbl = labels1.find(l => l.name === 'feature')?.id;
      const highLbl = labels1.find(l => l.name === 'priority:high')?.id;

      // Seed milestones
      const ms1 = { id: uid(), repo_id: repo1.id, title: 'v1.0.0 Release', description: 'First stable release', due_date: new Date(now + 30 * 86400000).toISOString().slice(0, 10), state: 'open', created_at: now - 86400000 * 5 };
      DB.saveMilestone(ms1);

      // Seed issues
      const issues = [
        { id: uid(), repo_id: repo1.id, type: 'issue', number: 1, title: 'Login page does not redirect after auth', body: 'After successful login, the user stays on the login page instead of being redirected to the dashboard.\n\n**Steps to reproduce:**\n1. Go to /login\n2. Enter valid credentials\n3. Observe: stays on login page', state: 'open', author: user.name, labels: [bugLbl, highLbl].filter(Boolean), milestone_id: ms1.id, created_at: now - 86400000 * 6, updated_at: now - 86400000 * 6 },
        { id: uid(), repo_id: repo1.id, type: 'issue', number: 2, title: 'Add dark mode support', body: 'Users have been requesting a dark mode. We should implement it using CSS variables for easy theming.', state: 'open', author: user.name, labels: [featLbl].filter(Boolean), created_at: now - 86400000 * 5, updated_at: now - 86400000 * 5 },
        { id: uid(), repo_id: repo1.id, type: 'issue', number: 3, title: 'Navbar dropdown closes immediately on mobile', body: 'On mobile devices, the navbar dropdown menu closes as soon as it opens.', state: 'closed', author: user.name, labels: [bugLbl].filter(Boolean), created_at: now - 86400000 * 10, updated_at: now - 86400000 * 4 },
        { id: uid(), repo_id: repo1.id, type: 'pr', number: 4, title: 'Fix: redirect after login', body: 'This PR fixes the login redirect issue.\n\n**Changes:**\n- Added redirect logic in `AuthController`\n- Added test for redirect behavior', state: 'open', author: user.name, labels: [bugLbl].filter(Boolean), head_branch: 'fix/login-redirect', base_branch: 'main', merged: false, created_at: now - 86400000 * 2, updated_at: now - 86400000 * 2 },
        { id: uid(), repo_id: repo1.id, type: 'pr', number: 5, title: 'Feature: add dark mode', body: 'Implements dark mode using CSS variables and a toggle in settings.', state: 'closed', merged: true, author: user.name, head_branch: 'feature/dark-mode', base_branch: 'main', created_at: now - 86400000 * 8, updated_at: now - 86400000 * 3 },
      ];
      issues.forEach(i => DB.saveIssue(i));

      // Add some comments
      DB.saveComment({ id: uid(), issue_id: issues[0].id, body: 'I can reproduce this on Chrome and Firefox. Looks like the redirect logic is missing.', author: user.name, created_at: now - 86400000 * 5 });
      DB.saveComment({ id: uid(), issue_id: issues[0].id, body: 'Assigned to myself, will fix in the current sprint.', author: user.name, created_at: now - 86400000 * 4 });

      // Create a board
      const board = {
        id: uid(), repo_id: repo1.id, name: 'Sprint 1', created_at: now - 86400000 * 3, columns: [
          { id: uid(), name: 'To Do', issue_ids: [issues[1].id] },
          { id: uid(), name: 'In Progress', issue_ids: [issues[0].id, issues[3].id] },
          { id: uid(), name: 'In Review', issue_ids: [] },
          { id: uid(), name: 'Done', issue_ids: [issues[2].id, issues[4].id] },
        ]
      };
      DB.saveBoard(board);

      // Activity
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> merged PR <strong>#5</strong>`, icon: 'bi-git', color: 'var(--accent-purple)' });
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> opened PR <strong>#4 Fix: redirect after login</strong>`, icon: 'bi-git', color: 'var(--accent-green)' });
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> created board <strong>Sprint 1</strong>`, icon: 'bi-kanban', color: 'var(--accent-orange)' });
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> created project <strong>api-server</strong>`, icon: 'bi-folder-plus', color: 'var(--accent-blue)' });
      DB.logActivity({ html: `<strong>${esc(user.name)}</strong> created project <strong>web-app</strong>`, icon: 'bi-folder-plus', color: 'var(--accent-blue)' });
    }

    // ============================================================
    // INIT
    // ============================================================
    render();
