const App = {
  tasks: JSON.parse(localStorage.getItem('taskflow_tasks')) || [],
  currentFilter: 'all',
  selectedPriority: 'low',

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadTheme();
    this.moveSlider(document.querySelector('.filter-tab.active'));
    this.render();
    this.animateCounters();
    this.observeElements();
  },

  cacheDOM() {
    this.input = document.getElementById('taskInput');
    this.addBtn = document.getElementById('addBtn');
    this.taskList = document.getElementById('taskList');
    this.emptyState = document.getElementById('emptyState');
    this.taskCount = document.getElementById('taskCount');
    this.activeCount = document.getElementById('activeCount');
    this.doneCount = document.getElementById('doneCount');
    this.filterAll = document.getElementById('filterAll');
    this.filterActive = document.getElementById('filterActive');
    this.filterDone = document.getElementById('filterDone');
    this.clearBtn = document.getElementById('clearCompleted');
    this.themeToggle = document.getElementById('themeToggle');
    this.floatingTheme = document.getElementById('floatingTheme');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    this.filterSlider = document.getElementById('filterSlider');
    this.priorityBtns = document.querySelectorAll('.priority-btn');
    this.appFooter = document.getElementById('appFooter');
  },

  bindEvents() {
    this.addBtn.addEventListener('click', () => this.addTask());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    this.clearBtn.addEventListener('click', () => this.clearCompleted());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.floatingTheme.addEventListener('click', () => this.toggleTheme());

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentFilter = tab.dataset.filter;
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.moveSlider(tab);
        this.render();
      });
    });

    this.priorityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedPriority = btn.dataset.priority;
        this.priorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  moveSlider(tab) {
    const idx = [...this.filterTabs].indexOf(tab);
    this.filterSlider.style.transform = `translateX(${idx * 100}%)`;
  },

  addTask() {
    const text = this.input.value.trim();
    if (!text) {
      this.input.focus();
      this.input.parentElement.style.animation = 'shake 0.4s ease';
      setTimeout(() => this.input.parentElement.style.animation = '', 400);
      return;
    }

    this.tasks.unshift({
      id: Date.now(),
      text,
      priority: this.selectedPriority,
      completed: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    this.render();
    this.input.value = '';
    this.input.focus();
  },

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      this.render();
    }
  },

  deleteTask(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.classList.add('removing');
      setTimeout(() => {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.render();
      }, 300);
    }
  },

  editTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    const el = document.querySelector(`[data-id="${id}"]`);
    el.classList.add('editing');

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'task-edit';
    inp.value = task.text;
    el.querySelector('.task-body').appendChild(inp);
    inp.focus();
    inp.select();

    const save = () => {
      const v = inp.value.trim();
      if (v) { task.text = v; this.save(); }
      this.render();
    };
    inp.addEventListener('blur', save);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') this.render();
    });
  },

  clearCompleted() {
    this.tasks = this.tasks.filter(t => !t.completed);
    this.save();
    this.render();
  },

  getFiltered() {
    switch (this.currentFilter) {
      case 'active': return this.tasks.filter(t => !t.completed);
      case 'completed': return this.tasks.filter(t => t.completed);
      default: return this.tasks;
    }
  },

  timeAgo(iso) {
    const d = new Date(iso);
    const now = new Date();
    const ms = now - d;
    const m = Math.floor(ms / 60000);
    const h = Math.floor(ms / 3600000);
    const dy = Math.floor(ms / 86400000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (dy < 7) return `${dy}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  renderTask(t) {
    return `
      <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <label class="task-check">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="App.toggleTask(${t.id})">
          <div class="check-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </label>
        <div class="task-body">
          <div class="task-name">${this.esc(t.text)}</div>
          <div class="task-details">
            <span class="task-badge ${t.priority}">${t.priority}</span>
            <span class="task-time">${this.timeAgo(t.createdAt)}</span>
          </div>
        </div>
        <div class="task-btns">
          <button class="task-btn edit" onclick="App.editTask(${t.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="task-btn del" onclick="App.deleteTask(${t.id})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  },

  render() {
    const filtered = this.getFiltered();
    const active = this.tasks.filter(t => !t.completed);
    const done = this.tasks.filter(t => t.completed);

    this.taskCount.textContent = this.tasks.length;
    this.activeCount.textContent = active.length;
    this.doneCount.textContent = done.length;
    this.filterAll.textContent = this.tasks.length;
    this.filterActive.textContent = active.length;
    this.filterDone.textContent = done.length;
    document.getElementById('footerActive').textContent = active.length;

    if (this.tasks.length === 0) {
      this.emptyState.style.display = 'flex';
      this.appFooter.style.display = 'none';
    } else {
      this.emptyState.style.display = 'none';
      this.appFooter.style.display = 'flex';
    }

    if (filtered.length === 0 && this.tasks.length > 0) {
      this.taskList.innerHTML = `
        <div class="empty-state">
          <div class="empty-artwork">
            <div class="empty-circle ec-1"></div>
            <div class="empty-circle ec-2"></div>
            <div class="empty-circle ec-3"></div>
            <svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <h4>No ${this.currentFilter} tasks</h4>
          <p>Try a different filter or add new tasks above</p>
        </div>`;
    } else {
      this.taskList.innerHTML = filtered.map(t => this.renderTask(t)).join('');
    }
  },

  animateCounters() {
    const nums = document.querySelectorAll('.stat-num[data-target]');
    nums.forEach(el => {
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = target === 0 ? 1 : Math.max(1, Math.floor(target / 30));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current;
      }, 40);
    });
  },

  observeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .app-wrapper').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(el);
    });
  },

  save() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('taskflow_theme', next);
  },

  loadTheme() {
    const saved = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
