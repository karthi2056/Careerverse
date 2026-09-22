/* ==========================================================================
   CareerVerse AI — Core Application & SPA Router
   ========================================================================== */

// Initialize Global State
window.AppState = {
  user: JSON.parse(localStorage.getItem('cv_user')) || null,
  users: JSON.parse(localStorage.getItem('cv_users')) || [],
  profile: JSON.parse(localStorage.getItem('cv_profile')) || null,
  progress: JSON.parse(localStorage.getItem('cv_progress')) || {
    completedRoadmapSteps: [],
    acquiredSkills: [],
    completedCourses: [],
    completedProjects: [],
    timeline: []
  },
  whatIfSkills: [] // For Career Simulation
};

// Ensure active user is included in users list
if (window.AppState.user) {
  const exists = (window.AppState.users || []).some(u => u.email && u.email.toLowerCase() === window.AppState.user.email.toLowerCase());
  if (!exists) {
    window.AppState.users.push(window.AppState.user);
    localStorage.setItem('cv_users', JSON.stringify(window.AppState.users));
  }
}

// Helper: Save state to localStorage
window.saveState = function() {
  if (window.AppState.user) {
    localStorage.setItem('cv_user', JSON.stringify(window.AppState.user));
    let users = window.AppState.users || [];
    const idx = users.findIndex(u => u.email && u.email.toLowerCase() === window.AppState.user.email.toLowerCase());
    if (idx >= 0) {
      users[idx] = window.AppState.user;
    } else {
      users.push(window.AppState.user);
    }
    window.AppState.users = users;
    localStorage.setItem('cv_users', JSON.stringify(users));
  } else {
    localStorage.removeItem('cv_user');
  }

  if (window.AppState.profile) {
    localStorage.setItem('cv_profile', JSON.stringify(window.AppState.profile));
  } else {
    localStorage.removeItem('cv_profile');
  }

  localStorage.setItem('cv_progress', JSON.stringify(window.AppState.progress));
};
window.saveAppState = window.saveState;

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initParticleCanvas();
  initToastSystem();
  loadInitialRoute();
});

/* ==========================================================================
   SPA Navigation & Module Routing
   ========================================================================== */

const PUBLIC_PAGES = ['#home', '#register', '#login'];

const ROUTE_MAP = {
  '#dashboard': { parent: '#career-twin-dashboard', tab: 'tab-digital-twin' },
  '#digital-twin': { parent: '#career-twin-dashboard', tab: 'tab-digital-twin' },
  '#career-analysis': { parent: '#career-twin-dashboard', tab: 'tab-career-analysis' },
  '#career-recommendation': { parent: '#career-twin-dashboard', tab: 'tab-career-recommendation' },
  '#skill-gap': { parent: '#career-twin-dashboard', tab: 'tab-skill-gap' },
  '#career-twin-dashboard': { parent: '#career-twin-dashboard', tab: 'tab-digital-twin' },

  '#skill-assessment': { parent: '#skill-assessment' },

  '#career-development': { parent: '#career-development', tab: 'tab-learning-roadmap' },
  '#learning-roadmap': { parent: '#career-development', tab: 'tab-learning-roadmap' },
  '#career-simulation': { parent: '#career-development', tab: 'tab-career-simulation' },
  '#progress-tracking': { parent: '#career-development', tab: 'tab-progress-tracking' },

  '#career-preparation': { parent: '#career-preparation', tab: 'tab-resume-analyzer' },
  '#resume-analyzer': { parent: '#career-preparation', tab: 'tab-resume-analyzer' },
  '#mock-interview': { parent: '#career-preparation', tab: 'tab-mock-interview' },
  '#placement-readiness': { parent: '#career-preparation', tab: 'tab-placement-readiness' },

  '#career-mentor-report': { parent: '#career-mentor-report', tab: 'tab-ai-mentor' },
  '#ai-mentor': { parent: '#career-mentor-report', tab: 'tab-ai-mentor' },
  '#career-report': { parent: '#career-mentor-report', tab: 'tab-career-report' },

  '#home': { parent: '#home' },
  '#register': { parent: '#register' },
  '#login': { parent: '#login' },
  '#profile-setup': { parent: '#profile-setup' },
  '#settings': { parent: '#settings' }
};

function initNavigation() {
  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash || '#home';
    switchPage(currentHash);
  });

  // Delegated click listener for internal module tab buttons
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.module-tab-btn');
    if (tabBtn) {
      const targetTabId = tabBtn.getAttribute('data-tab');
      const parentSection = tabBtn.closest('.page-view');
      if (parentSection && targetTabId) {
        window.switchModuleTab('#' + parentSection.id, targetTabId);
      }
    }
  });
}

window.switchModuleTab = function(parentSelector, targetTabId) {
  const parentEl = document.querySelector(parentSelector);
  if (!parentEl) return;

  const tabBtns = parentEl.querySelectorAll('.module-tab-btn');
  const tabPanes = parentEl.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === targetTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  tabPanes.forEach(pane => {
    if (pane.id === targetTabId) {
      pane.classList.add('active-tab');
    } else {
      pane.classList.remove('active-tab');
    }
  });

  // Re-trigger dynamic renderers on sub-tab switch
  if (targetTabId === 'tab-career-simulation' && typeof renderCareerSimulation === 'function') {
    renderCareerSimulation();
  } else if (targetTabId === 'tab-digital-twin' && typeof renderDigitalTwin === 'function') {
    renderDigitalTwin();
  } else if (targetTabId === 'tab-career-analysis' && typeof renderCareerAnalysis === 'function') {
    renderCareerAnalysis();
  } else if (targetTabId === 'tab-career-recommendation' && typeof renderCareerRecommendations === 'function') {
    renderCareerRecommendations();
  } else if (targetTabId === 'tab-skill-gap' && typeof renderSkillGapAnalysis === 'function') {
    renderSkillGapAnalysis();
  } else if (targetTabId === 'tab-learning-roadmap' && typeof renderLearningRoadmap === 'function') {
    renderLearningRoadmap();
  } else if (targetTabId === 'tab-progress-tracking' && typeof renderProgressTracking === 'function') {
    renderProgressTracking();
  }

  if (window.lucide) lucide.createIcons();
};

function loadInitialRoute() {
  const currentHash = window.location.hash || '#home';
  navigateTo(currentHash);
}

window.navigateTo = function(targetHash) {
  if (!targetHash.startsWith('#')) targetHash = '#' + targetHash;
  window.location.hash = targetHash;
  switchPage(targetHash);
};

function switchPage(pageHash) {
  const isAuth = !!window.AppState.user;
  const isPublicPage = PUBLIC_PAGES.includes(pageHash);

  // Auth Guard
  if (!isAuth && !isPublicPage) {
    window.location.hash = '#login';
    pageHash = '#login';
  }

  if (isAuth && (pageHash === '#login' || pageHash === '#register')) {
    window.location.hash = '#career-twin-dashboard';
    pageHash = '#career-twin-dashboard';
  }

  const views = document.querySelectorAll('.page-view');
  const sidebarNav = document.getElementById('sidebar-nav');
  const mainArea = document.getElementById('main-content-area');
  const publicNavLinks = document.getElementById('public-nav-links');
  const userHeaderBadge = document.getElementById('user-header-badge');

  // Resolve parent section and tab pane
  const routeConfig = ROUTE_MAP[pageHash] || { parent: '#home' };
  const parentSelector = routeConfig.parent;
  const targetTab = routeConfig.tab;

  let activeView = document.querySelector(parentSelector);
  if (!activeView) {
    activeView = document.getElementById('home');
  }

  // Toggle Header Elements based on Auth status
  if (isAuth) {
    if (publicNavLinks) publicNavLinks.style.display = 'none';
    if (userHeaderBadge) {
      userHeaderBadge.style.display = 'flex';
      const initials = (window.AppState.user.fullName || 'User')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      document.getElementById('user-avatar-initials').innerText = initials;
      document.getElementById('user-header-name').innerText = window.AppState.user.fullName || 'Student';
    }
  } else {
    if (publicNavLinks) publicNavLinks.style.display = 'flex';
    if (userHeaderBadge) userHeaderBadge.style.display = 'none';
  }

  // Toggle Sidebar visibility
  if (isAuth && !PUBLIC_PAGES.includes(pageHash)) {
    if (sidebarNav) sidebarNav.style.display = 'flex';
    if (mainArea) mainArea.classList.remove('public-content-area');
  } else {
    if (sidebarNav) sidebarNav.style.display = 'none';
    if (mainArea) mainArea.classList.add('public-content-area');
  }

  // Hide all view pages
  views.forEach(v => v.classList.remove('active-page'));

  // Update active states in Sidebar links
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === parentSelector) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Activate target parent page and target sub-tab
  setTimeout(() => {
    activeView.classList.add('active-page');
    if (targetTab) {
      window.switchModuleTab(parentSelector, targetTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger dynamic page renderers
    if (typeof window.renderCurrentPage === 'function') {
      window.renderCurrentPage(pageHash);
    }
  }, 40);
}

/* ==========================================================================
   Canvas Particle Engine
   ========================================================================== */

function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, particles = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.random() * 2 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.4 + 0.2;
      this.color = Math.random() > 0.5 ? '#7C3AED' : '#3B82F6';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const count = Math.min(Math.floor(window.innerWidth / 22), 65);
  for (let i = 0; i < count; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#7C3AED';
          ctx.globalAlpha = (1 - dist / 110) * 0.12;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* ==========================================================================
   Toast Notification & Modal System
   ========================================================================== */

function initToastSystem() {
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = 'toast-notification';
  document.body.appendChild(toast);
}

window.showToast = function(message, icon = 'check-circle') {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
  if (window.lucide) lucide.createIcons();

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
};

window.openModal = function(title, contentHtml) {
  const modalBackdrop = document.getElementById('app-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  if (modalBackdrop && modalTitle && modalBody) {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHtml;
    modalBackdrop.classList.add('show');
    if (window.lucide) lucide.createIcons();
  }
};

window.closeModal = function() {
  const modalBackdrop = document.getElementById('app-modal');
  if (modalBackdrop) modalBackdrop.classList.remove('show');
};

// Global Logout Handler
window.handleLogout = function() {
  window.AppState.user = null;
  window.saveState();
  window.showToast('Logged out successfully', 'log-out');
  window.navigateTo('#login');
};
