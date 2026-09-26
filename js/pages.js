/* ==========================================================================
   CareerVerse AI — Page Controllers & Dynamic Renderers
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAuthPages();
  initProfileSetupForm();
  initResumePage();
  initAIMentorPage();
  initSimulationPage();
});

// Central page renderer hook triggered on SPA route switch
window.renderCurrentPage = function(pageHash) {
  switch (pageHash) {
    case '#dashboard':
    case '#digital-twin':
    case '#career-twin-dashboard':
      renderDashboard();
      renderDigitalTwin();
      renderCareerAnalysis();
      renderCareerRecommendations();
      renderSkillGapAnalysis();
      break;
    case '#profile-setup':
      renderProfileSetupPage();
      break;
    case '#career-analysis':
      renderCareerAnalysis();
      break;
    case '#career-recommendation':
      renderCareerRecommendations();
      break;
    case '#skill-gap':
      renderSkillGapAnalysis();
      break;
    case '#skill-assessment':
      renderSkillAssessmentPage();
      break;
    case '#career-development':
    case '#learning-roadmap':
      renderLearningRoadmap();
      renderCareerSimulation();
      renderProgressTracking();
      break;
    case '#career-simulation':
      renderCareerSimulation();
      break;
    case '#progress-tracking':
      renderProgressTracking();
      break;
    case '#career-preparation':
    case '#resume-analyzer':
      renderResumePageEnhanced();
      renderMockInterviewPage();
      renderPlacementReadiness();
      break;
    case '#mock-interview':
      renderMockInterviewPage();
      break;
    case '#placement-readiness':
      renderPlacementReadiness();
      break;
    case '#career-mentor-report':
    case '#ai-mentor':
      initAIMentorPage();
      renderCareerReport();
      break;
    case '#career-report':
      renderCareerReport();
      break;
    case '#settings':
      renderSettings();
      break;
  }
  if (window.lucide) lucide.createIcons();
};

/* ==========================================================================
   PAGES 2 & 3: AUTHENTICATION (REGISTER & LOGIN)
   ========================================================================== */

function initAuthPages() {
  const registerForm = document.getElementById('form-register');
  const loginForm = document.getElementById('form-login');
  const demoLoginBtn = document.getElementById('btn-quick-demo-login');

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const dept = document.getElementById('reg-dept').value;
      const year = document.getElementById('reg-year').value;

      const errorEl = document.getElementById('reg-error');
      if (errorEl) errorEl.style.display = 'none';

      if (!fullName || !email || !password) {
        showFormError(errorEl, 'Please fill in all required fields');
        return;
      }

      if (password !== confirmPassword) {
        showFormError(errorEl, 'Passwords do not match');
        return;
      }

      const users = window.AppState.users || [];
      const existingUser = users.find(u => u.email && u.email.toLowerCase() === email);
      if (existingUser) {
        showFormError(errorEl, `An account with ${email} already exists. Please login instead.`);
        return;
      }

      const newUser = {
        fullName,
        email,
        password,
        department: dept,
        yearOfStudy: year
      };

      window.AppState.user = newUser;
      window.AppState.profile = null;
      window.saveState();

      const loginEmailInput = document.getElementById('login-email');
      if (loginEmailInput) loginEmailInput.value = email;

      window.showToast('Account created successfully! Logging you in...', 'user-check');
      setTimeout(() => {
        window.navigateTo('#profile-setup');
      }, 500);
    });
  }

  if (loginForm) {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');

    [emailInput, passwordInput].forEach(input => {
      input?.addEventListener('input', () => {
        if (errorEl) errorEl.style.display = 'none';
      });
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (errorEl) errorEl.style.display = 'none';

      if (!email || !password) {
        showFormError(errorEl, 'Please enter your email and password');
        return;
      }

      let users = window.AppState.users || [];
      if (window.AppState.user && !users.some(u => u.email && u.email.toLowerCase() === window.AppState.user.email.toLowerCase())) {
        users.push(window.AppState.user);
      }

      const matchedUser = users.find(u => u.email && u.email.trim().toLowerCase() === email);

      if (!matchedUser) {
        if (users.length === 0) {
          showFormError(errorEl, 'No registered account found. Please click "Register new account" below or use Quick Demo Login.');
        } else {
          showFormError(errorEl, `No registered account matches "${email}". Please check your email or Register.`);
        }
        return;
      }

      if (matchedUser.password !== password) {
        showFormError(errorEl, 'Incorrect password. Please check your password and try again.');
        return;
      }

      window.AppState.user = matchedUser;
      window.AppState.profile = window.AppState.profiles[email] || null;
      window.saveState();
      window.showToast(`Welcome back, ${matchedUser.fullName}!`, 'sparkles');

      window.navigateTo(window.AppState.profile ? '#career-twin-dashboard' : '#profile-setup');
    });
  }

  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', () => {
      if (!window.AppState.user) {
        window.AppState.user = {
          fullName: 'Alex Rivera',
          email: 'alex@university.edu',
          password: 'demo',
          department: 'Computer Science & AI',
          yearOfStudy: '3rd Year'
        };
        const emailKey = window.AppState.user.email.toLowerCase();
        window.AppState.profile = window.AppState.profiles[emailKey] || null;
        window.saveState();
      }
      window.showToast(`Logged in as ${window.AppState.user.fullName}!`, 'sparkles');
      window.navigateTo(window.AppState.profile ? '#career-twin-dashboard' : '#profile-setup');
    });
  }
}

function showFormError(el, message) {
  if (el) {
    el.innerText = message;
    el.style.display = 'block';
  }
}

/* ==========================================================================
   PAGE 4: STUDENT PROFILE SETUP FORM
   ========================================================================== */

let setupTechSkills = [];
let setupSoftSkills = [];
let setupInterests = [];
let projectCount = 0;
let certCount = 0;
let expCount = 0;
let isSubmittingProfile = false;

function initProfileSetupForm() {
  const form = document.getElementById('form-profile-setup');
  if (!form) return;

  setupTagField('setup-tech-input', 'setup-tech-container', setupTechSkills);
  setupTagField('setup-soft-input', 'setup-soft-container', setupSoftSkills);
  setupTagField('setup-interests-input', 'setup-interests-container', setupInterests);

  document.getElementById('btn-add-project')?.addEventListener('click', () => addProjectRow());
  document.getElementById('btn-add-cert')?.addEventListener('click', () => addCertRow());
  document.getElementById('btn-add-exp')?.addEventListener('click', () => addExpRow());

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (isSubmittingProfile) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    const college = document.getElementById('setup-college')?.value?.trim() || '';
    const degree = document.getElementById('setup-degree')?.value?.trim() || '';
    const department = document.getElementById('setup-dept')?.value?.trim() || '';
    const year = document.getElementById('setup-year')?.value?.trim() || '';
    const cgpa = document.getElementById('setup-cgpa')?.value?.trim() || '';

    const industry = document.getElementById('setup-pref-industry')?.value || 'Artificial Intelligence & Tech';
    const workType = document.getElementById('setup-pref-worktype')?.value || 'Hybrid';
    const targetCareer = document.getElementById('setup-target-career')?.value?.trim() || '';

    if (!targetCareer) {
      window.showToast('Please enter your Target Career Goal', 'alert-circle');
      return;
    }

    try {
      isSubmittingProfile = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Processing & Generating Vector...`;
        if (window.lucide) lucide.createIcons();
      }

      const projects = [];
      document.querySelectorAll('#setup-projects-list .project-item-row').forEach(row => {
        const pName = row.querySelector('.proj-name')?.value?.trim();
        const pDesc = row.querySelector('.proj-desc')?.value?.trim();
        const pTech = row.querySelector('.proj-tech')?.value?.trim();
        if (pName) {
          projects.push({ name: pName, description: pDesc, techStack: pTech });
        }
      });

      const certifications = [];
      document.querySelectorAll('#setup-certs-list .cert-item-row').forEach(row => {
        const cName = row.querySelector('.cert-name')?.value?.trim();
        const cIss = row.querySelector('.cert-issuer')?.value?.trim();
        if (cName) {
          certifications.push({ name: cName, issuer: cIss });
        }
      });

      const experience = [];
      document.querySelectorAll('#setup-exp-list .exp-item-row').forEach(row => {
        const eComp = row.querySelector('.exp-company')?.value?.trim();
        const eRole = row.querySelector('.exp-role')?.value?.trim();
        const eDur = row.querySelector('.exp-dur')?.value?.trim();
        if (eComp || eRole) {
          experience.push({ company: eComp, role: eRole, duration: eDur });
        }
      });

      // Include skills typed in the fields without requiring Enter first.
      const pendingTechSkill = document.getElementById('setup-tech-input')?.value?.trim().replace(',', '');
      const pendingSoftSkill = document.getElementById('setup-soft-input')?.value?.trim().replace(',', '');
      if (pendingTechSkill && !setupTechSkills.includes(pendingTechSkill)) {
        setupTechSkills.push(pendingTechSkill);
      }
      if (pendingSoftSkill && !setupSoftSkills.includes(pendingSoftSkill)) {
        setupSoftSkills.push(pendingSoftSkill);
      }

      // Preserve existing skillAssessments if any
      const currentAssessments = window.AppState.profile?.skillAssessments || {};
      const currentAssessmentHistory = window.AppState.profile?.skillAssessmentHistory || [];

      window.AppState.profile = {
        academic: { college, degree, department, year, cgpa },
        technicalSkills: [...setupTechSkills],
        softSkills: [...setupSoftSkills],
        projects,
        certifications,
        interests: [...setupInterests],
        preferences: { industry, workType },
        targetCareer,
        experience,
        skillAssessments: currentAssessments,
        skillAssessmentHistory: currentAssessmentHistory
      };

      window.saveState();

      if (window.AnalyticsEngine) {
        window.AnalyticsEngine.analyzeCareerVector(window.AppState.profile);
      }

      setTimeout(() => {
        isSubmittingProfile = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          if (window.lucide) lucide.createIcons();
        }

        window.showToast('Profile saved successfully! Digital Twin updated.', 'sparkles');
        window.navigateTo('#career-twin-dashboard');
      }, 600);

    } catch (err) {
      console.error('Error saving profile:', err);
      isSubmittingProfile = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (window.lucide) lucide.createIcons();
      }
      window.showToast(`Error saving profile: ${err.message}`, 'alert-circle');
    }
  });
}

function renderProfileSetupPage() {
  const p = window.AppState.profile;
  if (!p) {
    document.getElementById('form-profile-setup')?.reset();
    setupTechSkills = [];
    setupSoftSkills = [];
    setupInterests = [];
    projectCount = 0;
    certCount = 0;
    expCount = 0;
    renderTagPills('setup-tech-container', setupTechSkills, 'setup-tech-input');
    renderTagPills('setup-soft-container', setupSoftSkills, 'setup-soft-input');
    renderTagPills('setup-interests-container', setupInterests, 'setup-interests-input');
    document.getElementById('setup-projects-list')?.replaceChildren();
    document.getElementById('setup-certs-list')?.replaceChildren();
    document.getElementById('setup-exp-list')?.replaceChildren();
    return;
  }

  const colEl = document.getElementById('setup-college');
  const degEl = document.getElementById('setup-degree');
  const depEl = document.getElementById('setup-dept');
  const yrEl = document.getElementById('setup-year');
  const cgpEl = document.getElementById('setup-cgpa');
  const tgtEl = document.getElementById('setup-target-career');
  const indEl = document.getElementById('setup-pref-industry');
  const wrkEl = document.getElementById('setup-pref-worktype');

  if (colEl && p.academic) colEl.value = p.academic.college || '';
  if (degEl && p.academic) degEl.value = p.academic.degree || '';
  if (depEl && p.academic) depEl.value = p.academic.department || '';
  if (yrEl && p.academic) yrEl.value = p.academic.year || '';
  if (cgpEl && p.academic) cgpEl.value = p.academic.cgpa || '';
  if (tgtEl) tgtEl.value = p.targetCareer || '';
  if (indEl && p.preferences) indEl.value = p.preferences.industry || 'Artificial Intelligence & Tech';
  if (wrkEl && p.preferences) wrkEl.value = p.preferences.workType || 'Hybrid';

  setupTechSkills = [...(p.technicalSkills || [])];
  setupSoftSkills = [...(p.softSkills || [])];
  setupInterests = [...(p.interests || [])];

  renderTagPills('setup-tech-container', setupTechSkills, 'setup-tech-input');
  renderTagPills('setup-soft-container', setupSoftSkills, 'setup-soft-input');
  renderTagPills('setup-interests-container', setupInterests, 'setup-interests-input');

  const projContainer = document.getElementById('setup-projects-list');
  if (projContainer) {
    projContainer.innerHTML = '';
    projectCount = 0;
    (p.projects || []).forEach(proj => addProjectRow(proj));
  }

  const certContainer = document.getElementById('setup-certs-list');
  if (certContainer) {
    certContainer.innerHTML = '';
    certCount = 0;
    (p.certifications || []).forEach(cert => addCertRow(cert));
  }

  const expContainer = document.getElementById('setup-exp-list');
  if (expContainer) {
    expContainer.innerHTML = '';
    expCount = 0;
    (p.experience || []).forEach(exp => addExpRow(exp));
  }
}

function setupTagField(inputId, containerId, arr) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  if (!input || !container) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(',', '');
      const currentArr = inputId === 'setup-tech-input'
        ? setupTechSkills
        : inputId === 'setup-soft-input'
          ? setupSoftSkills
          : setupInterests;
      if (val && !currentArr.includes(val)) {
        currentArr.push(val);
        input.value = '';
        renderTagPills(containerId, currentArr, inputId);
        persistProfileSkills();
      }
    }
  });
}

function persistProfileSkills() {
  if (!window.AppState?.user) return;

  const profile = window.AppState.profile || {};
  profile.technicalSkills = [...setupTechSkills];
  profile.softSkills = [...setupSoftSkills];
  window.AppState.profile = profile;
  window.saveState();
}

function renderTagPills(containerId, arr, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  if (!container || !input) return;

  container.querySelectorAll('.tag-pill').forEach(el => el.remove());

  arr.forEach((tag, idx) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `${tag} <i class="tag-remove">×</i>`;
    pill.querySelector('.tag-remove').addEventListener('click', () => {
      arr.splice(idx, 1);
      renderTagPills(containerId, arr, inputId);
    });
    container.insertBefore(pill, input);
  });
}

function addProjectRow(data = {}) {
  const container = document.getElementById('setup-projects-list');
  if (!container) return;
  projectCount++;
  const row = document.createElement('div');
  row.className = 'glass-card project-item-row';
  row.style.padding = '1rem';
  row.style.marginBottom = '1rem';
  row.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h5 style="font-size:0.9rem;">Project #${projectCount}</h5>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.project-item-row').remove()">&times; Remove</button>
    </div>
    <input type="text" class="form-control proj-name" placeholder="Project Title" value="${data.name || ''}" style="margin-bottom:8px;">
    <textarea class="form-control proj-desc" placeholder="Brief Description" style="min-height:60px; margin-bottom:8px;">${data.description || ''}</textarea>
    <input type="text" class="form-control proj-tech" placeholder="Tech Stack (e.g. Python, React, PostgreSQL)" value="${data.techStack || ''}">
  `;
  container.appendChild(row);
}

function addCertRow(data = {}) {
  const container = document.getElementById('setup-certs-list');
  if (!container) return;
  certCount++;
  const row = document.createElement('div');
  row.className = 'glass-card cert-item-row';
  row.style.padding = '1rem';
  row.style.marginBottom = '1rem';
  row.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h5 style="font-size:0.9rem;">Certification #${certCount}</h5>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.cert-item-row').remove()">&times; Remove</button>
    </div>
    <input type="text" class="form-control cert-name" placeholder="Certification Name (e.g. AWS Certified Developer)" value="${data.name || ''}" style="margin-bottom:8px;">
    <input type="text" class="form-control cert-issuer" placeholder="Issuing Body (e.g. Amazon Web Services / Coursera)" value="${data.issuer || ''}">
  `;
  container.appendChild(row);
}

function addExpRow(data = {}) {
  const container = document.getElementById('setup-exp-list');
  if (!container) return;
  expCount++;
  const row = document.createElement('div');
  row.className = 'glass-card exp-item-row';
  row.style.padding = '1rem';
  row.style.marginBottom = '1rem';
  row.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <h5 style="font-size:0.9rem;">Experience / Internship #${expCount}</h5>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.exp-item-row').remove()">&times; Remove</button>
    </div>
    <input type="text" class="form-control exp-company" placeholder="Company / Organization Name" value="${data.company || ''}" style="margin-bottom:8px;">
    <input type="text" class="form-control exp-role" placeholder="Role (e.g. AI Research Intern)" value="${data.role || ''}" style="margin-bottom:8px;">
    <input type="text" class="form-control exp-dur" placeholder="Duration (e.g. 3 Months / Summer 2025)" value="${data.duration || ''}">
  `;
  container.appendChild(row);
}

/* ==========================================================================
   MODULE 3: CAREER TWIN DASHBOARD & DIGITAL TWIN VIEW
   ========================================================================== */

function renderDashboard() {
  const p = window.AppState.profile;
  const user = window.AppState.user;
  if (!user) return;

  const dashNameEl = document.getElementById('dash-user-name');
  if (dashNameEl) dashNameEl.innerText = user.fullName || 'Student';

  const metricsContainer = document.getElementById('dash-metrics-cards');
  if (!metricsContainer) return;

  if (!p) {
    metricsContainer.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1;">
        <i data-lucide="user-plus" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No Student Profile Found</h3>
        <p class="empty-state-desc">Set up your profile to generate your Digital Twin, career suitability scores, and personalized learning roadmaps.</p>
        <a href="#profile-setup" class="btn btn-primary"><i data-lucide="edit"></i> Complete Profile Setup</a>
      </div>
    `;
    return;
  }

  const completeness = window.AnalyticsEngine.calculateProfileCompleteness(p);
  const analysis = window.AnalyticsEngine.analyzeCareerVector(p);
  const placement = window.AnalyticsEngine.calculatePlacementReadiness(p);
  const authenticity = window.AnalyticsEngine.calculateSkillAuthenticity(p);

  metricsContainer.innerHTML = `
    <div class="glass-card">
      <div style="color:var(--text-muted); font-size:0.82rem; text-transform:uppercase;">Career Twin Completeness</div>
      <div class="gradient-text" style="font-size:2.2rem; font-weight:800; margin:4px 0;">${completeness}%</div>
      <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden;">
        <div style="width:${completeness}%; height:100%; background:var(--gradient-primary);"></div>
      </div>
    </div>

    <div class="glass-card">
      <div style="color:var(--text-muted); font-size:0.82rem; text-transform:uppercase;">Skill Authenticity Score</div>
      <div style="font-size:2.2rem; font-weight:800; color:var(--accent-green); margin:4px 0;">${authenticity}%</div>
      <p style="font-size:0.8rem; color:var(--text-muted);">AI-Validated Skills vs Claimed</p>
    </div>

    <div class="glass-card">
      <div style="color:var(--text-muted); font-size:0.82rem; text-transform:uppercase;">Career Compatibility</div>
      <div class="gradient-text-alt" style="font-size:2.2rem; font-weight:800; margin:4px 0;">${analysis ? analysis.suitabilityScore : 0}%</div>
      <p style="font-size:0.8rem; color:var(--text-muted);">Target: ${p.targetCareer}</p>
    </div>

    <div class="glass-card">
      <div style="color:var(--text-muted); font-size:0.82rem; text-transform:uppercase;">Placement Readiness</div>
      <div style="font-size:2.2rem; font-weight:800; color:var(--accent-cyan); margin:4px 0;">${placement.overallScore}/100</div>
      <p style="font-size:0.8rem; color:var(--text-muted);">Across 5 Readiness Components</p>
    </div>
  `;
}

function renderDigitalTwin() {
  const p = window.AppState.profile;
  const container = document.getElementById('digital-twin-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i data-lucide="cpu" class="empty-state-icon"></i>
        <h3 class="empty-state-title">Digital Twin Not Initialized</h3>
        <p class="empty-state-desc">Fill out your Academic, Skill, and Project data to view your structured twin model.</p>
        <a href="#profile-setup" class="btn btn-primary"><i data-lucide="plus-circle"></i> Create Profile</a>
      </div>
    `;
    return;
  }

  const completeness = window.AnalyticsEngine.calculateProfileCompleteness(p);
  const authenticity = window.AnalyticsEngine.calculateSkillAuthenticity(p);
  const validatedMap = p.skillAssessments || {};
  const assessmentHistory = Array.isArray(p.skillAssessmentHistory) && p.skillAssessmentHistory.length > 0
    ? [...p.skillAssessmentHistory].reverse()
    : Object.keys(validatedMap).map(skill => ({ ...validatedMap[skill], skillName: skill })).reverse();

  const initials = (window.AppState.user ? window.AppState.user.fullName || 'User' : 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  container.innerHTML = `
    <!-- Top Bar: Completeness & Skill Authenticity -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem; margin-bottom:1.5rem;">
      <div class="glass-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-weight:600;"><i data-lucide="cpu"></i> Profile Completeness Vector</span>
          <span style="font-weight:700; color:var(--accent-cyan);">${completeness}% Complete</span>
        </div>
        <div style="background:rgba(255,255,255,0.08); height:10px; border-radius:10px; overflow:hidden;">
          <div style="width:${completeness}%; height:100%; background:var(--gradient-primary);"></div>
        </div>
      </div>

      <div class="glass-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-weight:600;"><i data-lucide="shield-check" style="color:var(--accent-green);"></i> Skill Authenticity Score</span>
          <span style="font-weight:700; color:var(--accent-green);">${authenticity}% Validated</span>
        </div>
        <div style="background:rgba(255,255,255,0.08); height:10px; border-radius:10px; overflow:hidden;">
          <div style="width:${authenticity}%; height:100%; background:var(--gradient-secondary);"></div>
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 300px 1fr; gap:1.5rem;">
      <!-- Profile Twin Summary Card -->
      <div class="glass-card" style="text-align:center;">
        <div style="width:70px; height:70px; border-radius:50%; background:var(--gradient-primary); font-size:1.6rem; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto; box-shadow:var(--glow-purple);">
          ${initials}
        </div>
        <h3 style="font-size:1.3rem;">${window.AppState.user ? window.AppState.user.fullName : 'Student'}</h3>
        <p style="color:var(--text-muted); font-size:0.88rem;">${p.academic.degree || 'Student'}</p>
        <p style="color:var(--accent-cyan); font-size:0.85rem; margin-bottom:1rem;">CGPA: ${p.academic.cgpa || 'N/A'}</p>

        <div style="background:rgba(124,58,237,0.15); border:1px solid rgba(124,58,237,0.3); border-radius:var(--radius-md); padding:10px; color:var(--accent-purple-light); font-weight:600; font-size:0.9rem; margin-bottom:1rem;">
          Target: ${p.targetCareer}
        </div>

        <div style="font-size:0.82rem; color:var(--text-muted); text-align:left;">
          <div><strong>Industry:</strong> ${p.preferences ? p.preferences.industry : 'N/A'}</div>
          <div><strong>Work Type:</strong> ${p.preferences ? p.preferences.workType : 'N/A'}</div>
        </div>

        <div style="margin-top:1.25rem; display:flex; flex-direction:column; gap:8px;">
          <a href="#profile-setup" class="btn btn-secondary btn-block" style="font-size:0.88rem;">
            <i data-lucide="edit-3"></i> Edit Profile
          </a>
          <a href="#skill-assessment" class="btn btn-primary btn-block" style="font-size:0.88rem;">
            <i data-lucide="check-square"></i> Take Skill Assessment
          </a>
        </div>
      </div>

      <!-- Skills Verification & Vector Breakdown -->
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        
        <!-- Technical Skills Verification Status (Gray Claimed vs Green AI-Validated) -->
        <div class="glass-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <h4 style="font-size:1rem; margin:0;"><i data-lucide="code"></i> Technical Skills Vector</h4>
            <span style="font-size:0.8rem; color:var(--text-muted);">Gray = Self-Reported | Green Check = AI-Validated</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${((p.technicalSkills && p.technicalSkills.length > 0) ? p.technicalSkills : (p.skills || [])).map(skill => {
              const assessment = validatedMap[skill] || validatedMap[Object.keys(validatedMap).find(k => k.toLowerCase() === skill.toLowerCase())];
              const isValidated = assessment && typeof assessment.scorePct === 'number';
              if (isValidated) {
                return `<span class="badge-validated"><i data-lucide="check-circle"></i> ${skill} (${assessment.assessedLevel})</span>`;
              } else {
                return `<span class="badge-claimed"><i data-lucide="help-circle"></i> ${skill} (Self-Reported)</span>`;
              }
            }).join('')}
            ${(!((p.technicalSkills && p.technicalSkills.length > 0) || (p.skills && p.skills.length > 0))) ? '<span style="color:var(--text-muted); font-size:0.85rem;">No technical skills added</span>' : ''}
          </div>
        </div>

        <!-- Soft Skills -->
        <div class="glass-card">
          <h4 style="font-size:1rem; margin-bottom:0.75rem;">Soft Skills</h4>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${(p.softSkills || []).map(s => `<span class="badge-claimed"><i data-lucide="help-circle"></i> ${s} (Self-Reported)</span>`).join('')}
          </div>
        </div>

        <!-- Projects -->
        <div class="glass-card">
          <h4 style="font-size:1rem; margin-bottom:0.75rem;">Projects (${(p.projects || []).length})</h4>
          ${(p.projects || []).map(proj => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:12px; margin-bottom:8px;">
              <strong style="color:#fff;">${proj.name}</strong>
              <p style="font-size:0.85rem; color:var(--text-muted);">${proj.description}</p>
              <span class="badge badge-green" style="margin-top:4px;">${proj.techStack}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCareerAnalysis() {
  const p = window.AppState.profile;
  const container = document.getElementById('career-analysis-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><i data-lucide="cpu" class="empty-state-icon"></i><h3>No Profile Entered</h3><p>Fill out your profile to run AI analysis.</p><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    return;
  }

  const analysis = window.AnalyticsEngine.analyzeCareerVector(p);

  container.innerHTML = `
    <div style="text-align:center; margin-bottom:1.5rem;">
      <button class="btn btn-primary btn-lg" onclick="triggerAnalysisAnim()">
        <i data-lucide="sparkles"></i> Re-Calculate Career Suitability
      </button>
    </div>

    <div id="analysis-output-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1.5rem;">
      <div class="glass-card">
        <h4 style="font-size:1rem; color:var(--accent-cyan); margin-bottom:0.5rem;">Career Suitability Score</h4>
        <div class="gradient-text" style="font-size:3rem; font-weight:800;">${analysis.suitabilityScore}%</div>
        <p style="font-size:0.85rem; color:var(--text-muted);">Match vector for ${analysis.targetRole}</p>
      </div>

      <div class="glass-card">
        <h4 style="font-size:1rem; color:var(--accent-green); margin-bottom:0.5rem;">Matching Strengths (${analysis.strengths.length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${analysis.strengths.map(s => `<span class="badge badge-green"><i data-lucide="check"></i> ${s}</span>`).join('')}
        </div>
      </div>

      <div class="glass-card">
        <h4 style="font-size:1rem; color:var(--accent-red); margin-bottom:0.5rem;">Weak Areas & Skill Gaps (${analysis.missingGaps.length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${analysis.missingGaps.map(g => `<span class="badge badge-red"><i data-lucide="alert-triangle"></i> ${g.skill} (${g.priority})</span>`).join('')}
        </div>
      </div>

      <div class="glass-card">
        <h4 style="font-size:1rem; margin-bottom:0.5rem;">Industry Baseline Requirements</h4>
        <ul style="list-style:none; display:flex; flex-direction:column; gap:6px; font-size:0.88rem;">
          ${analysis.requiredSkills.map(r => `<li><i data-lucide="check-square" style="color:var(--accent-purple-light);"></i> ${r}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

window.triggerAnalysisAnim = function() {
  window.showToast('Recalculating suitability score against market data...', 'sparkles');
};

function renderCareerRecommendations() {
  const p = window.AppState.profile;
  const container = document.getElementById('career-rec-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><h3>No Profile Found</h3><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    return;
  }

  const recs = window.AnalyticsEngine.generateRecommendations(p);

  container.innerHTML = `
    <h3 style="margin-bottom:1rem; color:var(--accent-purple-light);">Top Ranked Matching Careers</h3>
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1.25rem; margin-bottom:2rem;">
      ${recs.topRecommendations.map(r => `
        <div class="glass-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:1.1rem;">${r.title}</h4>
            <span class="badge badge-purple">${r.matchPct}% Match</span>
          </div>
          <p style="font-size:0.85rem; color:var(--accent-cyan);">${r.growth}</p>
          <p style="font-size:0.85rem; color:var(--accent-green); font-weight:600;">${r.salary}</p>
          <div style="margin-top:10px;">
            <span style="font-size:0.78rem; color:var(--text-muted);">Required Skills:</span>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
              ${r.required.map(req => `<span class="badge badge-blue">${req}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSkillGapAnalysis() {
  const p = window.AppState.profile;
  const container = document.getElementById('skill-gap-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><h3>No Profile Found</h3><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    return;
  }

  const analysis = window.AnalyticsEngine.analyzeCareerVector(p);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
      <div class="glass-card">
        <h4 style="color:var(--accent-green); margin-bottom:1rem;">Acquired & Validated Skills (${analysis.strengths.length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${analysis.strengths.map(s => `<span class="badge badge-green"><i data-lucide="check"></i> ${s}</span>`).join('')}
        </div>
      </div>

      <div class="glass-card">
        <h4 style="color:var(--accent-red); margin-bottom:1rem;">Missing Target Skill Gaps (${analysis.missingGaps.length})</h4>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${analysis.missingGaps.map(g => `
            <div style="display:flex; justify-content:space-between; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:8px;">
              <span>${g.skill}</span>
              <span class="badge badge-red">${g.priority} Priority</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   MODULE 4: AI SKILL ASSESSMENT MODULE (Interactive Runner & Authenticity)
   ========================================================================== */

let activeAssessmentState = null;

function renderSkillAssessmentPage() {
  const p = window.AppState.profile;
  const container = document.getElementById('skill-assessment-main-container');
  if (!container) return;

  const claimedSkills = p
    ? ((p.technicalSkills && p.technicalSkills.length > 0) ? p.technicalSkills : (p.skills || []))
    : [];

  if (!p || claimedSkills.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i data-lucide="check-square" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No Claimed Skills Found</h3>
        <p class="empty-state-desc">Add technical skills to your Student Profile setup to take AI skill verification tests.</p>
        <a href="#profile-setup" class="btn btn-primary"><i data-lucide="user-cog"></i> Add Skills to Profile</a>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const authenticity = window.AnalyticsEngine.calculateSkillAuthenticity(p);
  const validatedMap = p.skillAssessments || {};
  const assessmentHistory = Array.isArray(p.skillAssessmentHistory) && p.skillAssessmentHistory.length > 0
    ? [...p.skillAssessmentHistory].reverse()
    : Object.keys(validatedMap).map(skill => ({ ...validatedMap[skill], skillName: skill })).reverse();

  // If a test runner is active, render the active question runner view
  if (activeAssessmentState) {
    renderQuizRunner(container);
    return;
  }

  // Render Skill Selection Cards & Assessment History
  container.innerHTML = `
    <!-- Authenticity Banner Card -->
    <div class="glass-card" style="margin-bottom:1.5rem;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="font-size:1.2rem; margin-bottom:4px;"><i data-lucide="shield-check" style="color:var(--accent-green);"></i> Skill Authenticity Score: <span style="color:var(--accent-green); font-weight:800;">${authenticity}%</span></h3>
          <p style="font-size:0.88rem; color:var(--text-muted);">Verify your claimed skills through AI tests to convert gray badges to green checkmark badges on your Digital Career Twin.</p>
        </div>
        <div style="width:75px; height:75px; border-radius:50%; background:rgba(34,197,94,0.15); border:2px solid var(--accent-green); display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:800; color:var(--accent-green);">
          ${authenticity}%
        </div>
      </div>
    </div>

    <!-- Claimed Skill Cards Grid -->
    <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--accent-purple-light);">Select a Skill to Assess (10 Questions: Easy, Medium, Hard)</h3>
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1.25rem; margin-bottom:2rem;">
      ${claimedSkills.map(skill => {
        const assessment = validatedMap[skill] || validatedMap[Object.keys(validatedMap).find(k => k.toLowerCase() === skill.toLowerCase())];
        const isValidated = assessment && typeof assessment.scorePct === 'number';
        return `
          <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="font-size:1.1rem; margin:0;">${skill}</h4>
                ${isValidated 
                  ? `<span class="badge-validated"><i data-lucide="check-circle"></i> AI-Validated</span>`
                  : `<span class="badge-claimed">Self-Reported</span>`}
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted);">
                ${assessment ? `Last Score: <strong style="color:#fff;">${assessment.scorePct}%</strong> (${assessment.assessedLevel})` : 'Not assessed yet'}
              </p>
            </div>
            <div style="margin-top:1.25rem;">
              <button class="btn ${isValidated ? 'btn-secondary' : 'btn-primary'} btn-block" onclick="startAssessmentForSkill('${skill}')">
                <i data-lucide="play-circle"></i> ${assessment ? 'Retake Test' : 'Start Assessment'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Assessment History View -->
    <div class="glass-card">
      <h4 style="font-size:1rem; margin-bottom:1rem;"><i data-lucide="history"></i> Assessment History</h4>
      ${assessmentHistory.length > 0 ? `
        <table style="width:100%; border-collapse:collapse; font-size:0.88rem; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-light); color:var(--text-muted);">
              <th style="padding:8px;">Skill</th>
              <th style="padding:8px;">Score</th>
              <th style="padding:8px;">Assessed Level</th>
              <th style="padding:8px;">Date</th>
              <th style="padding:8px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${assessmentHistory.map(res => {
              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px; font-weight:600;">${res.skillName}</td>
                  <td style="padding:10px; color:${res.scorePct >= 60 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:700;">${res.scorePct}%</td>
                  <td style="padding:10px;"><span class="badge badge-purple">${res.assessedLevel}</span></td>
                  <td style="padding:10px; color:var(--text-muted);">${res.date || 'Recent'}</td>
                  <td style="padding:10px;"><button class="btn btn-secondary btn-sm" onclick="startAssessmentForSkill('${res.skillName}')">Retake</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : `<p style="color:var(--text-muted); font-size:0.88rem;">No completed assessments recorded yet.</p>`}
    </div>
  `;
}

window.startAssessmentForSkill = function(skillName) {
  activeAssessmentState = {
    skillName: skillName,
    questions: [],
    currentIndex: 0,
    userAnswers: [],
    result: null,
    loading: true,
    error: null
  };
  renderSkillAssessmentPage();

  setTimeout(() => {
    try {
      const questions = window.AnalyticsEngine.generateSkillQuestions(skillName);
      if (!Array.isArray(questions) || questions.length < 10) {
        throw new Error('At least 10 assessment questions are required.');
      }
      activeAssessmentState.questions = questions;
      activeAssessmentState.userAnswers = new Array(questions.length).fill(null);
      activeAssessmentState.loading = false;
      renderSkillAssessmentPage();
    } catch (error) {
      activeAssessmentState.loading = false;
      activeAssessmentState.error = error.message || 'Unable to generate questions.';
      renderSkillAssessmentPage();
    }
  }, 0);
};

function renderQuizRunner(container) {
  const st = activeAssessmentState;

  if (st.loading) {
    container.innerHTML = `
      <div class="glass-card" style="max-width:760px; margin:0 auto; text-align:center;">
        <i data-lucide="loader-circle" class="spin" style="font-size:2.5rem; color:var(--accent-purple-light);"></i>
        <h3 style="margin-top:1rem;">Generating your assessment...</h3>
        <p style="color:var(--text-muted);">Preparing Easy, Medium, and Hard questions for ${st.skillName}.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (st.error) {
    container.innerHTML = `
      <div class="glass-card" style="max-width:760px; margin:0 auto; text-align:center;">
        <i data-lucide="alert-triangle" style="font-size:2.5rem; color:var(--accent-red);"></i>
        <h3 style="margin-top:1rem;">Assessment unavailable</h3>
        <p style="color:var(--text-muted);">${st.error}</p>
        <button class="btn btn-secondary" onclick="activeAssessmentState = null; renderSkillAssessmentPage();">Return to Skills</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const q = st.questions[st.currentIndex];
  const progressPct = Math.round(((st.currentIndex + 1) / st.questions.length) * 100);

  if (st.result) {
    // Render Results Screen
    const res = st.result;
    container.innerHTML = `
      <div class="glass-card" style="max-width:700px; margin:0 auto; text-align:center;">
        <i data-lucide="award" style="font-size:3.5rem; color:var(--accent-purple-light); margin-bottom:1rem;"></i>
        <h2 class="page-title">Assessment Complete: ${res.skillName}</h2>
        <div class="gradient-text" style="font-size:4rem; font-weight:800; margin:0.5rem 0;">${res.scorePct}%</div>
        <p style="font-size:1.1rem; margin-bottom:1.5rem;">Assessed Skill Level: <span class="badge badge-green" style="font-size:1rem;">${res.assessedLevel}</span></p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; text-align:left; margin-bottom:1.5rem;">
          <div style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-green); display:block; margin-bottom:4px;">Strong Areas:</strong>
            <ul style="padding-left:18px; font-size:0.85rem;">
              ${res.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-red); display:block; margin-bottom:4px;">Areas to Improve:</strong>
            <ul style="padding-left:18px; font-size:0.85rem;">
              ${res.weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:1rem;">
          <button class="btn btn-primary" onclick="activeAssessmentState = null; renderSkillAssessmentPage();"><i data-lucide="check"></i> Return to Skills List</button>
          <button class="btn btn-secondary" onclick="activeAssessmentState = null; window.navigateTo('#career-twin-dashboard');"><i data-lucide="cpu"></i> View Updated Digital Twin</button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Render Current Question View
  container.innerHTML = `
    <div class="glass-card" style="max-width:760px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <span style="font-weight:700; color:var(--accent-purple-light); font-size:1.1rem;">${st.skillName} Skill Assessment</span>
          <span style="color:var(--text-muted); font-size:0.85rem; margin-left:10px;">Question ${st.currentIndex + 1} of ${st.questions.length}</span>
        </div>
        <span class="badge ${q.difficulty === 'Easy' ? 'badge-green' : (q.difficulty === 'Medium' ? 'badge-blue' : 'badge-red')}">${q.difficulty} (${q.type})</span>
      </div>

      <!-- Progress Bar -->
      <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden; margin-bottom:1.5rem;">
        <div style="width:${progressPct}%; height:100%; background:var(--gradient-primary); transition:width 0.3s ease;"></div>
      </div>

      <!-- Question Text -->
      <h3 style="font-size:1.15rem; margin-bottom:1.25rem; line-height:1.4;">${q.text}</h3>

      <!-- Option Cards -->
      <div style="margin-bottom:1.5rem;">
        ${q.options.map((opt, idx) => `
          <div class="quiz-option-card ${st.userAnswers[st.currentIndex] === idx ? 'selected' : ''}" onclick="selectQuizOption(${idx})">
            <div style="width:24px; height:24px; border-radius:50%; border:2px solid var(--border-glow); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.8rem; background:${st.userAnswers[st.currentIndex] === idx ? 'var(--accent-purple)' : 'transparent'}; color:#fff;">
              ${String.fromCharCode(65 + idx)}
            </div>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>

      <!-- Control Buttons -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-secondary" onclick="activeAssessmentState = null; renderSkillAssessmentPage();">Cancel Assessment</button>
        <button class="btn btn-primary" onclick="nextQuizQuestion()" id="btn-quiz-next" ${st.userAnswers[st.currentIndex] === null ? 'disabled' : ''}>
          ${st.currentIndex === st.questions.length - 1 ? 'Submit & Finish' : 'Next Question →'}
        </button>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

window.selectQuizOption = function(optionIndex) {
  if (!activeAssessmentState) return;
  activeAssessmentState.userAnswers[activeAssessmentState.currentIndex] = optionIndex;
  renderSkillAssessmentPage();
};

window.nextQuizQuestion = function() {
  const st = activeAssessmentState;
  if (!st) return;

  if (st.currentIndex < st.questions.length - 1) {
    st.currentIndex++;
    renderSkillAssessmentPage();
  } else {
    st.loading = true;
    renderSkillAssessmentPage();

    setTimeout(() => {
      try {
        const evalRes = window.AnalyticsEngine.evaluateSkillAssessment(st.skillName, st.userAnswers, st.questions);
        st.result = evalRes;

        if (!window.AppState.profile.skillAssessments) {
          window.AppState.profile.skillAssessments = {};
        }
        if (!Array.isArray(window.AppState.profile.skillAssessmentHistory)) {
          window.AppState.profile.skillAssessmentHistory = [];
        }
        window.AppState.profile.skillAssessments[st.skillName] = evalRes;
        window.AppState.profile.skillAssessmentHistory.push(evalRes);
        window.saveState();

        st.loading = false;
        window.showToast(`Assessment submitted! Score: ${evalRes.scorePct}% (${evalRes.assessedLevel})`, 'award');
        renderSkillAssessmentPage();
      } catch (error) {
        st.loading = false;
        st.error = error.message || 'Unable to evaluate this assessment.';
        renderSkillAssessmentPage();
      }
    }, 0);
  }
};

/* ==========================================================================
   MODULE 5: CAREER DEVELOPMENT (Roadmap, Simulation, Progress)
   ========================================================================== */

function renderLearningRoadmap() {
  const p = window.AppState.profile;
  const container = document.getElementById('roadmap-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><h3>No Profile Found</h3><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    return;
  }

  const steps = window.AnalyticsEngine.generateRoadmap(p);
  const completed = window.AppState.progress.completedRoadmapSteps || [];
  const pct = Math.round((completed.length / Math.max(steps.length, 1)) * 100);

  container.innerHTML = `
    <div class="glass-card" style="margin-bottom:1.5rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="font-weight:600;">Roadmap Progress</span>
        <span style="color:var(--accent-cyan); font-weight:700;">${pct}% Done (${completed.length}/${steps.length})</span>
      </div>
      <div style="background:rgba(255,255,255,0.08); height:8px; border-radius:8px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:var(--gradient-primary);"></div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:1.2rem;">
      ${steps.map((step, idx) => `
        <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span class="badge badge-purple">Step #${idx + 1}</span>
            <h4 style="font-size:1.1rem; margin:4px 0;">Learn ${step.skill}</h4>
            <p style="font-size:0.85rem; color:var(--text-muted);">${step.resource} | Duration: ${step.duration}</p>
          </div>
          <button class="btn ${completed.includes(idx) ? 'btn-secondary' : 'btn-primary'}" onclick="toggleRoadmapDone(${idx})">
            ${completed.includes(idx) ? '✓ Completed' : 'Mark as Done'}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

window.toggleRoadmapDone = function(idx) {
  let list = window.AppState.progress.completedRoadmapSteps || [];
  if (list.includes(idx)) {
    list = list.filter(i => i !== idx);
  } else {
    list.push(idx);
  }
  window.AppState.progress.completedRoadmapSteps = list;
  window.saveState();
  renderLearningRoadmap();
};

window.addWhatIfSkill = function addWhatIfSkill() {
  const input = document.getElementById('whatif-skill-input');
  const val = input ? input.value.trim() : '';
  if (!val) return;

  if (!window.AppState.whatIfSkills) {
    window.AppState.whatIfSkills = [];
  }

  const exists = window.AppState.whatIfSkills.some(s => s.toLowerCase() === val.toLowerCase());
  if (exists) {
    if (window.showToast) window.showToast(`Skill "${val}" is already in the simulation list`, 'info');
    if (input) input.value = '';
    return;
  }

  window.AppState.whatIfSkills.push(val);
  if (input) input.value = '';
  renderCareerSimulation();
  if (window.showToast) window.showToast(`Hypothetical skill added: ${val}`, 'sparkles');
};

window.removeWhatIfSkill = function removeWhatIfSkill(skillName) {
  if (!window.AppState.whatIfSkills) return;
  window.AppState.whatIfSkills = window.AppState.whatIfSkills.filter(s => s.toLowerCase() !== skillName.toLowerCase());
  renderCareerSimulation();
  if (window.showToast) window.showToast(`Removed skill: ${skillName}`, 'info');
};

// Global Delegated Event Listeners for Add Skill Button & Input (Single Execution)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#btn-add-whatif');
  if (btn) {
    e.preventDefault();
    window.addWhatIfSkill();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target && e.target.id === 'whatif-skill-input' && e.key === 'Enter') {
    e.preventDefault();
    window.addWhatIfSkill();
  }
});

function initSimulationPage() {
  // Handlers registered globally via delegation and window functions
}

function renderCareerSimulation() {
  const p = window.AppState.profile;
  const container = document.getElementById('simulation-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><h3>No Profile Found</h3><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (!window.AppState.whatIfSkills) {
    window.AppState.whatIfSkills = [];
  }

  const analysisNormal = window.AnalyticsEngine.analyzeCareerVector(p, []);
  const analysisWhatIf = window.AnalyticsEngine.analyzeCareerVector(p, window.AppState.whatIfSkills);
  const diff = analysisWhatIf.suitabilityScore - analysisNormal.suitabilityScore;

  container.innerHTML = `
    <div class="glass-card" style="margin-bottom:1.5rem;">
      <h4 style="margin-bottom:8px;">What-If Scenario Simulator</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">Add hypothetical skills to test how your career compatibility score improves!</p>
      <div style="display:flex; gap:10px;">
        <input type="text" id="whatif-skill-input" class="form-control" placeholder="Type hypothetical skill (e.g. PyTorch, Docker, Kubernetes)..." style="flex:1;">
        <button type="button" class="btn btn-primary" id="btn-add-whatif"><i data-lucide="plus"></i> Add Skill</button>
      </div>
      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        ${window.AppState.whatIfSkills.map(s => `
          <span class="badge badge-cyan" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:0.85rem;">
            ${s}
            <i data-lucide="x" style="width:14px; height:14px; cursor:pointer;" onclick="window.removeWhatIfSkill('${s.replace(/'/g, "\\'")}')"></i>
          </span>
        `).join('')}
        ${window.AppState.whatIfSkills.length === 0 ? '<span style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">No hypothetical skills added yet.</span>' : ''}
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
      <div class="glass-card">
        <h4 style="color:var(--text-muted);">Current Profile Compatibility</h4>
        <div class="gradient-text" style="font-size:2.5rem; font-weight:800;">${analysisNormal.suitabilityScore}%</div>
      </div>

      <div class="glass-card">
        <h4 style="color:var(--accent-cyan);">Simulated What-If Compatibility</h4>
        <div class="gradient-text-alt" style="font-size:2.5rem; font-weight:800;">${analysisWhatIf.suitabilityScore}%</div>
        <span style="font-size:0.85rem; color:${diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:600;">${diff >= 0 ? '+' : ''}${diff}% Improvement</span>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function renderProgressTracking() {
  const container = document.getElementById('progress-container');
  if (container) {
    container.innerHTML = `
      <div class="glass-card">
        <h3><i data-lucide="trending-up"></i> Skill & Roadmap Timeline</h3>
        <p style="color:var(--text-muted); margin-bottom:1rem;">Visual progress tracking across active learning milestones.</p>
        <div style="border-left:2px solid var(--accent-purple); padding-left:1rem; margin-top:1rem;">
          <div style="margin-bottom:12px;">
            <strong style="color:var(--accent-purple-light);">Digital Career Twin Active</strong>
            <p style="font-size:0.85rem; color:var(--text-muted);">Profile vector synchronized with target: ${window.AppState.profile?.targetCareer || 'N/A'}</p>
          </div>
        </div>
      </div>
    `;
  }
}

/* ==========================================================================
   MODULE 6: CAREER PREPARATION (Enhanced Resume, AI Mock Interview, Placement)
   ========================================================================== */

function initResumePage() {
  const dropzone = document.getElementById('resume-dropzone');
  const fileInput = document.getElementById('resume-file-input');

  if (!dropzone || !fileInput) return;

  if (dropzone.dataset.initialized === 'true') return;
  dropzone.dataset.initialized = 'true';

  // Drag & drop visual listeners
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileRead(fileInput.files[0]);
    }
  });

  function handleFileRead(file) {
    const fileName = (file && file.name ? file.name : '').toLowerCase();
    const isPdf = file && (file.type === 'application/pdf' || fileName.endsWith('.pdf'));
    const isDocx = file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx'));

    if (isPdf && window.pdfjsLib) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const arrayBuffer = e.target.result;
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          let extractedText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent({ normalizeWhitespace: true });
            const lines = [];
            text.items.filter(item => item.str && item.str.trim()).forEach(item => {
              const y = item.transform ? Math.round(item.transform[5]) : 0;
              let line = lines.find(existing => Math.abs(existing.y - y) <= 3);
              if (!line) {
                line = { y, text: '' };
                lines.push(line);
              }
              line.text += `${line.text ? ' ' : ''}${item.str.trim()}`;
            });
            const pageText = lines
              .sort((first, second) => second.y - first.y)
              .map(line => line.text)
              .join('\n');
            extractedText += pageText + '\n';
          }
          if (extractedText.trim()) {
            processResumeEnhanced(file.name, extractedText);
            return;
          }

          if (!window.Tesseract) {
            throw new Error('The uploaded PDF has no readable text layer.');
          }

          let ocrText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            const result = await window.Tesseract.recognize(canvas, 'eng');
            ocrText += `${result.data.text}\n`;
          }
          processResumeEnhanced(file.name, ocrText);
        } catch (error) {
          console.error('PDF parse failed:', error);
          window.showToast('Unable to read the uploaded PDF. Please upload a clearer resume file.', 'alert-circle');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (isDocx && window.mammoth) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await window.mammoth.extractRawText({ arrayBuffer: e.target.result });
          processResumeEnhanced(file.name, result.value || '');
        } catch (error) {
          console.error('DOCX parse failed:', error);
          window.showToast('Unable to read the uploaded DOCX resume.', 'alert-circle');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const textContent = e.target.result || '';
      processResumeEnhanced(file.name, textContent);
    };
    reader.readAsText(file);
  }
}

function renderResumePageEnhanced() {
  initResumePage();
}

function processResumeEnhanced(filename, fileText) {
  const resultsBox = document.getElementById('resume-results-box');
  const laserLine = document.getElementById('resume-laser');

  if (laserLine) laserLine.style.display = 'block';
  window.showToast('Running 3-Way Resume & Digital Twin Analysis...', 'scan');

  setTimeout(() => {
    if (laserLine) laserLine.style.display = 'none';
    if (resultsBox) {
      resultsBox.style.display = 'block';

      const p = window.AppState.profile;
      const res = window.AnalyticsEngine.analyzeResumeEnhanced(fileText, p, filename);
      const parsed = res.parsedDetails;
      
      // Persist resume analyzer result to student profile
      window.AppState.profile.resumeResults = res;
      window.saveState();

      // Twin vs Resume missing skill alert message
      const missingTwinAlert = res.missingTwinSkillsFromResume.length > 0
        ? `<div class="twin-resume-alert">
             <i data-lucide="alert-triangle" style="font-size:1.4rem; color:#fbbf24;"></i>
             <div>
               <strong>Career Twin vs Resume Alert:</strong>
               <p style="margin-top:2px; font-size:0.88rem;">
                 Skill <strong>${res.missingTwinSkillsFromResume[0]}</strong> is verified in your Digital Career Twin but missing from your uploaded resume text.
                 <button class="btn btn-secondary btn-sm" onclick="syncResumeSkillsToProfile()" style="margin-left:8px; padding:2px 8px; font-size:0.75rem;">Sync Skills</button>
               </p>
             </div>
           </div>`
        : '';

      resultsBox.innerHTML = `
        ${missingTwinAlert}

        <!-- Top Score Bar & Sub-scores Banner -->
        <div class="glass-card" style="margin-bottom:1.5rem; border-left: 4px solid var(--accent-purple);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.5rem;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="badge badge-purple" style="font-weight:600;"><i data-lucide="file-check-2" style="width:14px;"></i> ATS Scanned Resume</span>
                <span class="badge badge-blue">${parsed.filename}</span>
              </div>
              <h3 style="font-size:1.4rem; font-weight:700; margin:4px 0; color:var(--text-main);">${parsed.candidateName}</h3>
              <p style="color:var(--text-muted); font-size:0.88rem; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <span><i data-lucide="briefcase" style="width:14px; color:var(--accent-purple-light);"></i> Role: <strong>${parsed.targetRole}</strong></span>
                <span><i data-lucide="mail" style="width:14px; color:var(--accent-blue);"></i> ${parsed.email}</span>
                <span><i data-lucide="phone" style="width:14px; color:var(--accent-cyan);"></i> ${parsed.phone}</span>
                <span><i data-lucide="map-pin" style="width:14px; color:var(--accent-pink);"></i> ${parsed.location}</span>
              </p>
            </div>
            
            <div class="circular-score-wrapper">
              <svg class="circular-score-svg">
                <circle class="circular-score-bg" cx="70" cy="70" r="60"></circle>
                <circle class="circular-score-bar" cx="70" cy="70" r="60" style="stroke-dashoffset:${377 - (377 * res.overallScore / 100)};"></circle>
              </svg>
              <div class="circular-score-text">
                <div class="circular-score-val">${res.overallScore}</div>
                <div class="circular-score-lbl">ATS Score</div>
              </div>
            </div>
          </div>

          <hr style="margin:1.2rem 0; border:0; border-top:1px solid var(--border-light);" />

          <h4 style="font-size:0.92rem; margin-bottom:10px; color:var(--text-muted);">Sub-Score Breakdown & Audit Factors:</h4>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; text-align:center;">
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border:1px solid var(--border-light);">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Skills Score</span>
              <strong style="color:var(--accent-purple-light); font-size:1.15rem;">${res.subScores.skills}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border:1px solid var(--border-light);">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Project Impact</span>
              <strong style="color:var(--accent-blue); font-size:1.15rem;">${res.subScores.projects}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border:1px solid var(--border-light);">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Education Score</span>
              <strong style="color:var(--accent-cyan); font-size:1.15rem;">${res.subScores.education}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border:1px solid var(--border-light);">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Role Alignment</span>
              <strong style="color:var(--accent-pink); font-size:1.15rem;">${res.subScores.careerAlignment}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border:1px solid var(--border-light);">
              <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Content Quality</span>
              <strong style="color:var(--accent-green); font-size:1.15rem;">${res.subScores.contentQuality}%</strong>
            </div>
          </div>
        </div>

        <!-- SECTION 1: EXTRACTED CANDIDATE SUMMARY & OVERVIEW CARD -->
        <div class="glass-card" style="margin-bottom:1.5rem;">
          <h4 style="font-size:1.1rem; color:var(--accent-purple-light); display:flex; align-items:center; gap:8px; margin-bottom:0.75rem;">
            <i data-lucide="user-check"></i> Extracted Professional Profile
          </h4>
          <p style="font-size:0.92rem; color:var(--text-main); background:rgba(255,255,255,0.02); padding:14px; border-radius:8px; border-left:3px solid var(--accent-purple-light); margin-bottom:1rem;">
            "${parsed.summary || 'No professional summary detected in the uploaded resume.'}"
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:1.5rem; font-size:0.88rem; color:var(--text-muted);">
            <div><strong style="color:var(--text-main);">LinkedIn:</strong> <a href="${parsed.linkedinUrl}" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${parsed.linkedinUrl}</a></div>
            <div><strong style="color:var(--text-main);">GitHub:</strong> <a href="${parsed.githubUrl}" target="_blank" style="color:var(--accent-blue); text-decoration:none;">${parsed.githubUrl}</a></div>
          </div>
        </div>

        <!-- SECTION 2: EXTRACTED RESUME SKILLS & ATS MATCH COMPARISON -->
        <div class="glass-card" style="margin-bottom:1.5rem;">
          <h4 style="font-size:1.1rem; color:var(--accent-cyan); display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
            <i data-lucide="cpu"></i> Extracted Resume Skills & Target Competencies
          </h4>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem;">
            <!-- Extracted Skills in Resume -->
            <div style="background:rgba(0,0,0,0.25); padding:1rem; border-radius:10px; border:1px solid var(--border-light);">
              <h5 style="font-size:0.9rem; color:var(--text-main); margin-bottom:10px; display:flex; align-items:center; justify-content:space-between;">
                <span><i data-lucide="check-circle-2" style="color:var(--accent-green); width:16px;"></i> Extracted Resume Skills</span>
                <span class="badge badge-purple">${parsed.extractedSkills.length} Detected</span>
              </h5>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                ${parsed.extractedSkills.length > 0 ? parsed.extractedSkills.map(s => `<span class="badge badge-purple" style="font-size:0.82rem; padding:4px 10px;">${s}</span>`).join('') : '<span style="font-size:0.8rem; color:var(--text-muted);">No resume skills detected.</span>'}
              </div>
            </div>

            <!-- Matched & Missing Target Competencies -->
            <div style="background:rgba(0,0,0,0.25); padding:1rem; border-radius:10px; border:1px solid var(--border-light);">
              <h5 style="font-size:0.9rem; color:var(--text-main); margin-bottom:10px;">
                <i data-lucide="target" style="color:var(--accent-blue); width:16px;"></i> Target Role Competencies (${parsed.targetRole})
              </h5>
              <div style="margin-bottom:10px;">
                <span style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:4px;">Matched Target Skills:</span>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                  ${res.matchedSkills.length > 0 
                    ? res.matchedSkills.map(s => `<span class="badge badge-green" style="font-size:0.8rem;"><i data-lucide="check" style="width:12px;"></i> ${s}</span>`).join('') 
                    : '<span style="font-size:0.8rem; color:var(--text-muted);">None matched yet</span>'}
                </div>
              </div>
              <div>
                <span style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:4px;">Missing Target Competencies:</span>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                  ${res.missingSkills.length > 0 
                    ? res.missingSkills.map(s => `<span class="badge badge-red" style="font-size:0.8rem;"><i data-lucide="alert-circle" style="width:12px;"></i> ${s}</span>`).join('') 
                    : '<span class="badge badge-green">100% Target Skills Matched!</span>'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: EXTRACTED EDUCATION & CERTIFICATIONS CARDS -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">
          <!-- Education Card -->
          <div class="glass-card">
            <h4 style="font-size:1.05rem; color:var(--accent-blue); display:flex; align-items:center; gap:8px; margin-bottom:0.75rem;">
              <i data-lucide="graduation-cap"></i> Extracted Education
            </h4>
            <div style="background:rgba(255,255,255,0.02); padding:12px; border-radius:8px;">
              <strong style="font-size:1rem; color:var(--text-main);">${parsed.education.degree || 'Education details not detected'}</strong>
              <p style="color:var(--text-muted); font-size:0.88rem; margin-top:2px;">${parsed.education.college || 'Institution not detected'}</p>
              <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.82rem; color:var(--accent-cyan);">
                <span>Academic Score: <strong>${parsed.education.cgpa || 'Not detected'}</strong></span>
                <span class="badge badge-green">OCR Verified</span>
              </div>
            </div>
          </div>

          <!-- Certifications Card -->
          <div class="glass-card">
            <h4 style="font-size:1.05rem; color:var(--accent-pink); display:flex; align-items:center; gap:8px; margin-bottom:0.75rem;">
              <i data-lucide="award"></i> Extracted Certifications
            </h4>
            <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
              ${parsed.certifications.length > 0 ? parsed.certifications.map(c => `
                <li style="background:rgba(255,255,255,0.02); padding:8px 12px; border-radius:6px; font-size:0.88rem; display:flex; align-items:center; gap:8px;">
                  <i data-lucide="shield-check" style="color:var(--accent-green); width:16px;"></i> ${c}
                </li>
              `).join('') : '<li style="color:var(--text-muted); font-size:0.88rem;">No certifications detected.</li>'}
            </ul>
          </div>
        </div>

        <!-- SECTION 4: EXTRACTED PROJECTS & WORK EXPERIENCE -->
        <div class="glass-card" style="margin-bottom:1.5rem;">
          <h4 style="font-size:1.05rem; color:var(--accent-green); display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
            <i data-lucide="folder-git-2"></i> Extracted Projects & Work Experience
          </h4>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${[...(parsed.projects || []), ...(parsed.experience || []).map(item => `Experience: ${item}`)].map((proj, idx) => `
              <div style="background:rgba(255,255,255,0.02); padding:12px 16px; border-radius:8px; border-left:3px solid var(--accent-blue);">
                <strong style="font-size:0.95rem; color:var(--text-main); display:block;">Item #${idx + 1}: ${proj}</strong>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
                  Parsed technical achievements and project details extracted directly from resume file structure.
                </p>
              </div>
            `).join('') || '<p style="color:var(--text-muted); font-size:0.88rem;">No project or work experience details detected.</p>'}
          </div>
        </div>

        <!-- SECTION 5: ATS DIAGNOSTICS & AUDIT CHECKLIST -->
        <div class="glass-card" style="margin-bottom:1.5rem;">
          <h4 style="font-size:1.05rem; color:var(--text-main); display:flex; align-items:center; gap:8px; margin-bottom:1rem;">
            <i data-lucide="check-square" style="color:var(--accent-purple-light);"></i> ATS Formatting & Document Diagnostics
          </h4>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
            <div style="background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:10px;">
              <i data-lucide="${parsed.audit.hasEmail && parsed.audit.hasPhone ? 'check-circle' : 'alert-circle'}" style="color:${parsed.audit.hasEmail && parsed.audit.hasPhone ? 'var(--accent-green)' : 'var(--accent-red)'}"></i>
              <div>
                <strong style="font-size:0.85rem; display:block;">Contact Info Audit</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${parsed.audit.hasEmail && parsed.audit.hasPhone ? 'Email & Phone Identified' : 'Missing Contact Info'}</span>
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:10px;">
              <i data-lucide="${parsed.audit.actionVerbCount >= 8 ? 'check-circle' : 'alert-circle'}" style="color:${parsed.audit.actionVerbCount >= 8 ? 'var(--accent-green)' : '#fbbf24'}"></i>
              <div>
                <strong style="font-size:0.85rem; display:block;">Action Verbs Density</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${parsed.audit.actionVerbCount} Action Verbs Found</span>
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:10px;">
              <i data-lucide="${parsed.audit.metricsCount >= 3 ? 'check-circle' : 'alert-circle'}" style="color:${parsed.audit.metricsCount >= 3 ? 'var(--accent-green)' : '#fbbf24'}"></i>
              <div>
                <strong style="font-size:0.85rem; display:block;">Metric Quantification</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${parsed.audit.metricsCount} Metrics/Numbers Found</span>
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); padding:10px 14px; border-radius:8px; display:flex; align-items:center; gap:10px;">
              <i data-lucide="check-circle" style="color:var(--accent-green);"></i>
              <div>
                <strong style="font-size:0.85rem; display:block;">Document Length</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${parsed.audit.wordCount} Words (${parsed.audit.lineCount} Lines)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 6: AI OPTIMIZATION ACTION PLAN -->
        <div class="glass-card" style="margin-bottom:1.5rem;">
          <h4 style="font-size:1.05rem; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="sparkles" style="color:var(--accent-purple-light);"></i> AI Optimization Action Plan
          </h4>
          <ol style="padding-left:20px; font-size:0.88rem; display:flex; flex-direction:column; gap:10px;">
            ${res.suggestions.map(s => `<li style="color:var(--text-main);">${s}</li>`).join('')}
          </ol>
        </div>

        <!-- Raw Extracted Text Viewer -->
        <details class="glass-card" style="margin-bottom:1.5rem; cursor:pointer;">
          <summary style="font-weight:600; font-size:0.95rem; color:var(--accent-purple-light); display:flex; align-items:center; gap:8px;">
            <i data-lucide="file-text"></i> View Raw Extracted Resume Text Stream
          </summary>
          <div style="margin-top:1rem; background:rgba(0,0,0,0.4); padding:1rem; border-radius:8px; font-family:monospace; font-size:0.82rem; color:var(--text-muted); max-height:250px; overflow-y:auto; white-space:pre-wrap; border:1px solid var(--border-light);">
            ${escapeResumeText(parsed.rawTextStream || 'No raw text stream extracted.')}
          </div>
        </details>

        <!-- Bottom Actions Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <button class="btn btn-secondary" onclick="syncResumeSkillsToProfile()"><i data-lucide="refresh-cw"></i> Sync Extracted Skills to Career Twin</button>
          <div style="display:flex; gap:0.75rem;">
            <button class="btn btn-primary" onclick="downloadResumeReport()"><i data-lucide="download"></i> Download Full ATS Report</button>
          </div>
        </div>
      `;
      
      if (window.lucide) lucide.createIcons();
      resultsBox.scrollIntoView({ behavior: 'smooth' });
    }
  }, 1200);
}

function escapeResumeText(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

window.syncResumeSkillsToProfile = function() {
  const profile = window.AppState.profile || {};
  const resumeRes = profile.resumeResults;
  if (!resumeRes || !resumeRes.parsedDetails || !resumeRes.parsedDetails.extractedSkills) {
    window.showToast('Please upload and analyze a resume first!', 'alert-circle');
    return;
  }
  const extracted = resumeRes.parsedDetails.extractedSkills;
  const currentSkills = profile.technicalSkills || [];
  let addedCount = 0;
  extracted.forEach(s => {
    if (!currentSkills.some(cs => cs.toLowerCase() === s.toLowerCase())) {
      currentSkills.push(s);
      addedCount++;
    }
  });
  profile.technicalSkills = currentSkills;
  window.AppState.profile = profile;
  window.saveState();
  
  window.showToast(`Successfully synced ${addedCount} new skill(s) to Digital Career Twin profile!`, 'check-circle');
};

window.downloadResumeReport = function() {
  const profile = window.AppState.profile || {};
  const res = profile.resumeResults;
  const parsed = res?.parsedDetails || {};

  const reportHtml = `
    <div style="font-family:'Poppins', sans-serif; color:#111; padding:30px; max-width:800px; margin:0 auto;">
      <h2 style="color:#7C3AED; margin-bottom:5px;">CareerVerse AI — ATS Resume Analysis Report</h2>
      <p style="color:#666; font-size:0.9rem;">Generated on ${new Date().toLocaleDateString()}</p>
      <hr style="margin:15px 0; border:0; border-top:2px solid #7C3AED;" />
      
      <h3>Candidate: ${parsed.candidateName || profile.fullName || 'Alex Rivera'}</h3>
      <p><strong>Target Role:</strong> ${parsed.targetRole || profile.targetCareer || 'AI Engineer'}</p>
      <p><strong>Contact:</strong> ${parsed.email || 'N/A'} | ${parsed.phone || 'N/A'}</p>
      <p><strong>Education:</strong> ${parsed.education?.degree || 'N/A'} - ${parsed.education?.college || 'N/A'}</p>
      
      <div style="background:#f3f0ff; padding:15px; border-radius:8px; margin:20px 0;">
        <h3 style="color:#7C3AED; margin:0;">Overall ATS Score: ${res?.overallScore || 85} / 100</h3>
        <p style="margin:5px 0 0 0; color:#555;">Skills Match: ${res?.subScores?.skills || 85}% | Projects: ${res?.subScores?.projects || 88}% | Education: ${res?.subScores?.education || 85}%</p>
      </div>

      <h4 style="color:#10B981;">Extracted Technical Skills (${(parsed.extractedSkills || []).length}):</h4>
      <p>${(parsed.extractedSkills || []).join(', ')}</p>

      <h4 style="color:#3B82F6;">Matched Role Competencies:</h4>
      <p>${(res?.matchedSkills || []).join(', ')}</p>

      <h4 style="color:#EF4444;">Missing Target Competencies:</h4>
      <p>${(res?.missingSkills || []).join(', ') || 'None'}</p>

      <h4 style="color:#7C3AED;">AI Recommendations:</h4>
      <ul>
        ${(res?.suggestions || []).map(s => `<li>${s.replace(/\*\*/g, '')}</li>`).join('')}
      </ul>
    </div>
  `;

  const printWin = window.open('', '', 'width=800,height=900');
  printWin.document.write(`
    <html>
      <head><title>CareerVerse AI - Resume Report</title></head>
      <body>${reportHtml}</body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 500);

  window.showToast('Generating Downloadable ATS Report...', 'file-text');
};

/* AI MOCK INTERVIEW CONTROLLER */

let mockInterviewState = null;
let mockInterviewAttentionTracking = null;
let mockInterviewCameraMonitor = null;
let mockInterviewReadyCamera = null;
let mockInterviewCameraRequestPending = false;
let mockInterviewCameraError = null;
let mockInterviewTimer = null;
const MOCK_INTERVIEW_DURATION_MS = 30 * 60 * 1000;

function stopMockInterviewVoice() {
  if (mockInterviewState?.voiceRecognition) {
    mockInterviewState.voiceRecognition.onend = null;
    mockInterviewState.voiceRecognition.stop();
    mockInterviewState.voiceRecognition = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function stopMockInterviewTimer() {
  if (mockInterviewTimer) clearInterval(mockInterviewTimer);
  mockInterviewTimer = null;
}

function formatMockInterviewTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateMockInterviewTimer() {
  const state = mockInterviewState;
  if (!state) {
    stopMockInterviewTimer();
    return;
  }
  if (state.report || state.terminated) {
    stopMockInterviewTimer();
    return;
  }

  state.timeRemainingMs = Math.max(0, state.deadlineAt - Date.now());
  const timer = document.getElementById('mock-interview-timer');
  if (timer) timer.textContent = formatMockInterviewTime(state.timeRemainingMs);
  if (state.timeRemainingMs <= 0) endMockInterviewByTimeout();
}

function startMockInterviewTimer() {
  stopMockInterviewTimer();
  updateMockInterviewTimer();
  mockInterviewTimer = setInterval(updateMockInterviewTimer, 1000);
}

function endMockInterviewByTimeout() {
  const state = mockInterviewState;
  if (!state || state.report || state.terminated) return;

  state.terminated = true;
  state.timeoutReached = true;
  state.paused = false;
  state.pauseReason = null;
  stopMockInterviewTimer();
  stopMockInterviewAttentionTracking();
  stopMockInterviewVoice();
  stopMockInterviewCamera();
  exitMockInterviewFullscreen();
  renderMockInterviewPage();
}

function updateRound3VoicePanel() {
  const state = mockInterviewState;
  if (!state) return;
  const status = document.getElementById('mock-voice-status');
  const transcript = document.getElementById('mock-voice-transcript');
  const startButton = document.getElementById('mock-voice-start');
  const finishButton = document.getElementById('mock-voice-finish');
  if (status) status.textContent = state.voiceError || state.voiceStatus || 'Ready';
  if (transcript) transcript.textContent = state.voiceTranscript || 'Your spoken answer will appear here.';
  if (startButton) startButton.disabled = state.voiceListening || state.voiceSpeaking;
  if (finishButton) finishButton.disabled = !state.voiceTranscript || !state.voiceListening;
  const submitButton = document.getElementById('mock-submit-answer');
  if (submitButton) submitButton.disabled = state.voiceListening || !state.voiceTranscript;
}

function startRound3VoiceAnswer() {
  const state = mockInterviewState;
  if (!state || state.sequence[state.currentIndex]?.round !== 3 || state.paused || state.voiceSpeaking) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    state.voiceError = 'Speech recognition is not supported by this browser.';
    updateRound3VoicePanel();
    return;
  }

  if (state.voiceRecognition) state.voiceRecognition.stop();
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  state.voiceRecognition = recognition;
  state.voiceStatus = 'Listening for your answer...';
  state.voiceError = null;
  state.voiceListening = true;
  updateRound3VoicePanel();

  recognition.onresult = event => {
    let transcript = '';
    for (let index = 0; index < event.results.length; index++) transcript += `${event.results[index][0].transcript} `;
    state.voiceTranscript = transcript.trim();
    updateRound3VoicePanel();
  };
  recognition.onerror = event => {
    state.voiceListening = false;
    state.voiceStatus = 'Microphone stopped';
    state.voiceError = event.error === 'not-allowed' ? 'Microphone access is required to answer Round 3.' : 'Unable to understand the microphone input. Please try again.';
    updateRound3VoicePanel();
  };
  recognition.onend = () => {
    state.voiceListening = false;
    state.voiceStatus = state.voiceTranscript ? 'Answer captured. Review the transcript, then submit.' : 'No answer captured. Start the microphone and answer aloud.';
    updateRound3VoicePanel();
  };

  try {
    recognition.start();
  } catch (error) {
    state.voiceListening = false;
    state.voiceError = 'Microphone could not be started. Please try again.';
    updateRound3VoicePanel();
  }
}

window.startRound3VoiceAnswer = startRound3VoiceAnswer;

window.finishRound3VoiceAnswer = function() {
  if (!mockInterviewState?.voiceRecognition) return;
  mockInterviewState.voiceRecognition.stop();
};

function startRound3VoiceInteraction() {
  const state = mockInterviewState;
  const question = state?.sequence[state.currentIndex];
  if (!state || question?.round !== 3 || state.voiceQuestionId === question.id || state.paused) return;

  stopMockInterviewVoice();
  state.voiceQuestionId = question.id;
  state.voiceTranscript = '';
  state.voiceListening = false;
  state.voiceSpeaking = true;
  state.voiceStatus = 'AI HR interviewer is asking the question...';
  state.voiceError = null;
  updateRound3VoicePanel();

  if (!window.speechSynthesis) {
    state.voiceSpeaking = false;
    state.voiceError = 'Voice output is not supported by this browser.';
    updateRound3VoicePanel();
    return;
  }

  const prompt = new SpeechSynthesisUtterance(`This is a strict HR interview. ${question.question} Please answer verbally and provide a specific example where relevant.`);
  prompt.rate = 0.95;
  prompt.pitch = 1;
  prompt.onend = () => {
    state.voiceSpeaking = false;
    if (mockInterviewState === state && !state.paused) startRound3VoiceAnswer();
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(prompt);
}

window.repeatMockInterviewQuestion = function() {
  const state = mockInterviewState;
  const question = state?.sequence[state.currentIndex];
  if (!state || question?.round !== 3 || state.paused || state.report || state.terminated) return;
  if (!window.speechSynthesis) {
    window.showToast('Voice output is not supported by this browser.', 'alert-circle');
    return;
  }

  stopMockInterviewVoice();
  state.voiceQuestionId = question.id;
  state.voiceTranscript = '';
  state.voiceListening = false;
  state.voiceSpeaking = true;
  state.voiceStatus = 'Repeating the current question...';
  state.voiceError = null;
  updateRound3VoicePanel();

  const prompt = new SpeechSynthesisUtterance(question.question);
  prompt.rate = 0.95;
  prompt.pitch = 1;
  prompt.onend = () => {
    state.voiceSpeaking = false;
    if (mockInterviewState === state && !state.paused) startRound3VoiceAnswer();
  };
  window.speechSynthesis.speak(prompt);
};

function stopMockInterviewAttentionTracking() {
  if (!mockInterviewAttentionTracking) return;

  document.removeEventListener('visibilitychange', mockInterviewAttentionTracking.handleVisibilityChange);
  document.removeEventListener('fullscreenchange', mockInterviewAttentionTracking.handleFullscreenChange);
  window.removeEventListener('blur', mockInterviewAttentionTracking.handleWindowBlur);
  window.removeEventListener('focus', mockInterviewAttentionTracking.handleWindowFocus);
  mockInterviewAttentionTracking = null;
}

function stopMockInterviewCamera() {
  if (mockInterviewCameraMonitor?.timer) clearTimeout(mockInterviewCameraMonitor.timer);
  if (mockInterviewState?.cameraStream) {
    mockInterviewState.cameraStream.getTracks().forEach(track => track.stop());
    mockInterviewState.cameraStream = null;
  }
  if (mockInterviewReadyCamera) {
    mockInterviewReadyCamera.getTracks().forEach(track => track.stop());
    mockInterviewReadyCamera = null;
  }
  mockInterviewCameraMonitor = null;
}

function handleMockInterviewCameraLost() {
  const state = mockInterviewState;
  if (!state) {
    mockInterviewReadyCamera = null;
    mockInterviewCameraError = 'Camera is disabled. Enable the camera before starting the interview.';
    renderMockInterviewPage();
    return;
  }
  if (state.report || state.terminated || state.cameraError) return;

  state.cameraStream = null;
  state.cameraError = 'Camera is disabled. Enable the camera to resume the interview.';
  state.paused = true;
  state.pauseReason = 'camera';
  stopMockInterviewVoice();
  renderMockInterviewPage();
  window.showToast('Interview paused because the camera was disabled.', 'camera-off');
}

function attachMockInterviewCameraListeners(stream) {
  stream.getVideoTracks().forEach(track => {
    track.addEventListener('ended', handleMockInterviewCameraLost, { once: true });
    track.addEventListener('mute', handleMockInterviewCameraLost, { once: true });
  });
}

function requestMockInterviewCamera() {
  if (mockInterviewCameraRequestPending) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    mockInterviewCameraError = 'Camera access is not supported by this browser.';
    renderMockInterviewPage();
    return;
  }

  mockInterviewCameraRequestPending = true;
  mockInterviewCameraError = null;
  renderMockInterviewPage();

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      if (mockInterviewState?.report || mockInterviewState?.terminated) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      if (mockInterviewReadyCamera) mockInterviewReadyCamera.getTracks().forEach(track => track.stop());
      mockInterviewReadyCamera = stream;
      attachMockInterviewCameraListeners(stream);
      mockInterviewCameraRequestPending = false;
      mockInterviewCameraError = null;
      if (mockInterviewState) {
        mockInterviewState.cameraStream = stream;
        mockInterviewState.cameraError = null;
        mockInterviewState.paused = false;
        mockInterviewState.pauseReason = null;
      }
      renderMockInterviewPage();
    })
    .catch(() => {
      mockInterviewCameraRequestPending = false;
      mockInterviewCameraError = 'Camera access is required. Enable the camera before starting the interview.';
      if (mockInterviewState) {
        mockInterviewState.cameraError = mockInterviewCameraError;
        mockInterviewState.paused = true;
        mockInterviewState.pauseReason = 'camera';
      }
      renderMockInterviewPage();
    });
}

window.enableMockInterviewCamera = requestMockInterviewCamera;

function recordRound3CameraViolation(reason = 'Prolonged face movement or attention away from the camera/screen') {
  const state = mockInterviewState;
  if (!state || state.report || state.terminated) return;

  const now = Date.now();
  if (mockInterviewCameraMonitor && now - mockInterviewCameraMonitor.lastViolationAt < 5000) return;
  if (mockInterviewCameraMonitor) mockInterviewCameraMonitor.lastViolationAt = now;
  state.round3Violations++;
  state.cameraViolationEvents.push({ count: state.round3Violations, timestamp: new Date(now).toISOString(), reason: reason });

  if (state.round3Violations > 3) {
    state.terminated = true;
    stopMockInterviewAttentionTracking();
    stopMockInterviewVoice();
    stopMockInterviewCamera();
    exitMockInterviewFullscreen();
    renderMockInterviewPage();
    window.showToast('Interview terminated after the final camera warning.', 'alert-circle');
    return;
  }

  window.showToast(`Warning ${state.round3Violations}: ${reason}. Please return your attention to the camera or interview screen.`, 'alert-triangle');
}

function startMockInterviewFaceMonitor() {
  const state = mockInterviewState;
  const video = document.getElementById('mock-interview-camera');
  if (!state?.cameraStream || !video || !window.FaceDetector) return;

  const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
  mockInterviewCameraMonitor = { detector: detector, timer: null, awaySince: null, lastViolationAt: 0, previousFace: null, movementSince: null };

  const inspectFrame = async function() {
    if (!mockInterviewState || mockInterviewState.report || mockInterviewState.terminated) return;
    if (document.hidden || !document.hasFocus() || !document.fullscreenElement) {
      mockInterviewCameraMonitor.awaySince = null;
      mockInterviewCameraMonitor.timer = setTimeout(inspectFrame, 1000);
      return;
    }

    const videoTrack = mockInterviewState.cameraStream?.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') {
      recordRound3CameraViolation('Camera turned off or became unavailable');
      mockInterviewCameraMonitor.timer = setTimeout(inspectFrame, 1000);
      return;
    }

    try {
      const faces = await detector.detect(video);
      const bounds = faces[0]?.boundingBox;
      const faceCenterX = bounds ? bounds.x + (bounds.width / 2) : 0;
      const faceCenterY = bounds ? bounds.y + (bounds.height / 2) : 0;
      const inView = Boolean(bounds) && faceCenterX >= video.videoWidth * 0.2 && faceCenterX <= video.videoWidth * 0.8 && faceCenterY >= video.videoHeight * 0.15 && faceCenterY <= video.videoHeight * 0.85;
      const previousFace = mockInterviewCameraMonitor.previousFace;
      const faceMovement = previousFace && bounds ? Math.hypot(faceCenterX - previousFace.x, faceCenterY - previousFace.y) / Math.max(video.videoWidth, video.videoHeight) : 0;
      mockInterviewCameraMonitor.previousFace = bounds ? { x: faceCenterX, y: faceCenterY } : null;

      if (inView && faceMovement < 0.12) {
        mockInterviewCameraMonitor.awaySince = null;
        mockInterviewCameraMonitor.movementSince = null;
      } else if (!inView) {
        mockInterviewCameraMonitor.movementSince = null;
        if (!mockInterviewCameraMonitor.awaySince) mockInterviewCameraMonitor.awaySince = Date.now();
        if (Date.now() - mockInterviewCameraMonitor.awaySince >= 5000) {
          mockInterviewCameraMonitor.awaySince = null;
          recordRound3CameraViolation('Repeated or prolonged attention away from the camera/screen');
        }
      } else {
        mockInterviewCameraMonitor.awaySince = null;
        if (!mockInterviewCameraMonitor.movementSince) mockInterviewCameraMonitor.movementSince = Date.now();
        if (Date.now() - mockInterviewCameraMonitor.movementSince >= 5000) {
          mockInterviewCameraMonitor.movementSince = null;
          recordRound3CameraViolation('Repeated or prolonged distracting head/body movement');
        }
      }
    } catch (error) {
      // Face detection support varies by browser; camera access remains active.
    }

    if (mockInterviewCameraMonitor) mockInterviewCameraMonitor.timer = setTimeout(inspectFrame, 1000);
  };

  inspectFrame();
}

window.resumeMockInterview = function() {
  if (!mockInterviewState || mockInterviewState.report || mockInterviewState.terminated) return;
  requestMockInterviewCamera();
};

function restartRound3MockInterview() {
  const state = mockInterviewState;
  if (!state) return;

  stopMockInterviewVoice();
  stopMockInterviewCamera();
  const round3Start = state.sequence.findIndex(question => question.round === 3);
  const round3Questions = window.AnalyticsEngine.generateMockInterviewQuestions(window.AppState.profile).round3_hr;
  Object.keys(state.answersMap).filter(id => id.startsWith('r3_')).forEach(id => delete state.answersMap[id]);
  state.sequence = state.sequence.slice(0, round3Start).concat(round3Questions);
  state.currentIndex = round3Start;
  state.round3Violations = 0;
  state.cameraViolationEvents = [];
  state.cameraRequestPending = false;
  state.cameraError = null;
  state.paused = false;
  state.pauseReason = null;
  startMockInterviewAttentionTracking();
  renderMockInterviewPage();
}

function requestMockInterviewFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  try {
    const fullscreenRequest = document.documentElement.requestFullscreen();
    if (fullscreenRequest && typeof fullscreenRequest.catch === 'function') {
      fullscreenRequest.catch(() => {
        window.showToast('Full-screen mode could not be enabled. Please remain on the interview screen.', 'alert-circle');
      });
    }
  } catch (error) {
    window.showToast('Full-screen mode could not be enabled. Please remain on the interview screen.', 'alert-circle');
  }
}

function exitMockInterviewFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function startMockInterviewAttentionTracking() {
  stopMockInterviewAttentionTracking();

  const tracking = {
    lastViolationAt: 0,
    pauseInterview: function() {
      if (!mockInterviewState || mockInterviewState.report) return;
      mockInterviewState.paused = true;
      mockInterviewState.pauseReason = 'attention';
      renderMockInterviewPage();
    },
    resumeInterviewIfReady: function() {
      if (!mockInterviewState || mockInterviewState.report || !mockInterviewState.paused) return;
      if (document.hidden || !document.hasFocus() || !document.fullscreenElement) return;

      mockInterviewState.paused = false;
      window.showToast('Interview resumed. Please remain on this screen.', 'check');
      renderMockInterviewPage();
    },
    handleViolation: function() {
      if (!mockInterviewState || mockInterviewState.report) return;

      const now = Date.now();
      if (now - tracking.lastViolationAt < 500) return;
      tracking.lastViolationAt = now;
      mockInterviewState.violations++;

      if (mockInterviewState.violations > 3) {
        const cameraStream = mockInterviewState.cameraStream;
        stopMockInterviewAttentionTracking();
        stopMockInterviewVoice();
        mockInterviewState.cameraStream = null;
        mockInterviewReadyCamera = cameraStream;
        window.showToast('Interview restarted after more than 3 tab switches.', 'alert-circle');
        window.startMockInterview();
        return;
      }

      tracking.pauseInterview();
      window.showToast(`Warning: Please stay on the interview screen. Further tab switching may terminate the interview. Tab switch ${mockInterviewState.violations} of 3.`, 'alert-triangle');
    },
    handleVisibilityChange: function() {
      if (document.hidden) tracking.handleViolation();
      else tracking.resumeInterviewIfReady();
    },
    handleWindowBlur: function() {
      tracking.handleViolation();
    },
    handleWindowFocus: function() {
      tracking.resumeInterviewIfReady();
    },
    handleFullscreenChange: function() {
      if (!document.fullscreenElement) {
        tracking.handleViolation();
        if (mockInterviewState && !mockInterviewState.report) requestMockInterviewFullscreen();
      } else tracking.resumeInterviewIfReady();
    }
  };

  mockInterviewAttentionTracking = tracking;
  document.addEventListener('visibilitychange', tracking.handleVisibilityChange);
  document.addEventListener('fullscreenchange', tracking.handleFullscreenChange);
  window.addEventListener('blur', tracking.handleWindowBlur);
  window.addEventListener('focus', tracking.handleWindowFocus);
}

window.cancelMockInterview = function() {
  stopMockInterviewTimer();
  stopMockInterviewAttentionTracking();
  stopMockInterviewVoice();
  stopMockInterviewCamera();
  exitMockInterviewFullscreen();
  mockInterviewState = null;
  mockInterviewCameraRequestPending = false;
  mockInterviewCameraError = null;
  renderMockInterviewPage();
};

window.quitMockInterview = function() {
  const confirmed = window.confirm('Are you sure you want to quit the interview? Your current progress may be lost.');
  if (confirmed) window.cancelMockInterview();
};

function renderMockInterviewPage() {
  const p = window.AppState.profile;
  const container = document.getElementById('mock-interview-main-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i data-lucide="messages-square" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No Profile Found</h3>
        <p class="empty-state-desc">Set up your profile to enable personalized 3-round AI Mock Interviews.</p>
        <a href="#profile-setup" class="btn btn-primary"><i data-lucide="user-cog"></i> Setup Profile</a>
      </div>
    `;
    return;
  }

  if (!mockInterviewState) {
    const previous = p.mockInterviewResults;
    container.innerHTML = `
      <div class="glass-card" style="margin-bottom:1.5rem; text-align:center;">
        <i data-lucide="bot" style="font-size:3.5rem; color:var(--accent-purple-light); margin-bottom:1rem;"></i>
        <h3 style="font-size:1.4rem;">Personalized 3-Round AI Mock Interview</h3>
        <p style="color:var(--text-muted); max-width:600px; margin:0.5rem auto 1.5rem auto;">
          Conduct an interactive interview tailored to your Digital Career Twin for target role: <strong style="color:var(--accent-cyan);">${p.targetCareer}</strong>.
        </p>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; text-align:left; margin-bottom:1.5rem;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glow); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-purple-light);">Round 1: Technical</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">5 Questions on AI-validated skills & career core.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glow); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-blue);">Round 2: Project</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">3 Questions targeting your entered projects.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glow); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-pink);">Round 3: HR & Behavioral</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">4 Questions on communication & career goals.</p>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-secondary btn-lg" onclick="window.enableMockInterviewCamera();"${mockInterviewReadyCamera || mockInterviewCameraRequestPending ? ' disabled' : ''}><i data-lucide="camera"></i> ${mockInterviewCameraRequestPending ? 'Requesting Camera...' : 'Enable Camera'}</button>
          <button class="btn btn-primary btn-lg" onclick="startMockInterview();"${mockInterviewReadyCamera ? '' : ' disabled'}><i data-lucide="play"></i> Start 3-Round Mock Interview</button>
        </div>
        ${mockInterviewCameraError ? `<p style="color:var(--accent-red); margin-top:0.75rem;">${mockInterviewCameraError}</p>` : ''}
      </div>

      ${previous ? `
        <div class="glass-card">
          <h4><i data-lucide="history"></i> Last Completed Interview Report (${previous.date})</h4>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
            <div>Overall Score: <strong style="font-size:1.8rem; color:var(--accent-green);">${previous.overallScore}/100</strong></div>
            <div>Technical: ${previous.subScores.technical}% | Project: ${previous.subScores.project}% | HR: ${previous.subScores.hrCommunication}%</div>
          </div>
        </div>
      ` : ''}
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Active Mock Interview Flow Runner
  renderMockInterviewFlow(container);
}

window.startMockInterview = function() {
  const p = window.AppState.profile;
  if (!mockInterviewReadyCamera || mockInterviewReadyCamera.getVideoTracks()[0]?.readyState !== 'live') {
    mockInterviewCameraError = 'Enable the camera before starting the interview.';
    renderMockInterviewPage();
    return;
  }
  const questionsObj = window.AnalyticsEngine.generateMockInterviewQuestions(p);
  
  // Flatten rounds into sequence
  const sequence = [
    ...questionsObj.round1_technical,
    ...questionsObj.round2_project,
    ...questionsObj.round3_hr
  ];

  mockInterviewState = {
    sequence: sequence,
    currentIndex: 0,
    answersMap: {},
    currentAnswerInput: '',
    report: null,
    violations: 0,
    round3Violations: 0,
    cameraViolationEvents: [],
    terminated: false,
    cameraStream: mockInterviewReadyCamera,
    cameraRequestPending: false,
    cameraError: null,
    paused: false,
    pauseReason: null,
    answerEvaluations: {},
    voiceQuestionId: null,
    voiceTranscript: '',
    voiceListening: false,
    voiceSpeaking: false,
    voiceStatus: '',
    voiceError: null,
    voiceRecognition: null,
    startedAt: Date.now(),
    deadlineAt: Date.now() + MOCK_INTERVIEW_DURATION_MS,
    timeRemainingMs: MOCK_INTERVIEW_DURATION_MS,
    timeoutReached: false
  };

  mockInterviewReadyCamera = null;

  startMockInterviewAttentionTracking();
  requestMockInterviewFullscreen();
  renderMockInterviewPage();
  startMockInterviewTimer();
};

function renderMockInterviewFlow(container) {
  const st = mockInterviewState;

  if (st.terminated) {
    container.innerHTML = `
      <div class="glass-card" style="max-width:760px; margin:0 auto; text-align:center;">
        <i data-lucide="${st.timeoutReached ? 'timer-off' : 'shield-alert'}" style="font-size:3.5rem; color:var(--accent-red); margin-bottom:1rem;"></i>
        <h2>${st.timeoutReached ? 'Interview Time Complete' : 'Interview Terminated'}</h2>
        <p style="color:var(--text-muted);">${st.timeoutReached ? 'The 30-minute mock interview duration has ended. No further answers can be submitted.' : 'The interview ended after four camera-monitoring violations.'}</p>
        ${st.timeoutReached ? '' : `<p style="font-size:0.85rem; color:var(--text-muted);">${st.cameraViolationEvents.length} monitoring events were recorded for the interview report.</p>
        <div style="text-align:left; font-size:0.78rem; margin:1rem 0;">${st.cameraViolationEvents.map(event => `<div style="padding:6px 0; border-bottom:1px solid var(--border-light);">Warning ${event.count} - ${new Date(event.timestamp).toLocaleString()}: ${event.reason}</div>`).join('')}</div>`}
        <button class="btn btn-primary" onclick="window.cancelMockInterview();">Start a New Interview</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (st.paused) {
    container.innerHTML = `
      <div class="glass-card" style="max-width:760px; margin:0 auto; text-align:center;">
        <i data-lucide="${st.pauseReason === 'camera' ? 'camera-off' : 'pause-circle'}" style="font-size:3.5rem; color:var(--accent-pink); margin-bottom:1rem;"></i>
        <h2>Interview Paused</h2>
        <p style="color:var(--text-muted);">${st.pauseReason === 'camera' ? 'Camera access is required to continue. Enable your camera to resume.' : 'Return to this interview page and restore full-screen mode to continue.'}</p>
        ${st.pauseReason === 'camera' ? `<button class="btn btn-primary" onclick="window.resumeMockInterview();"${mockInterviewCameraRequestPending ? ' disabled' : ''}><i data-lucide="camera"></i> ${mockInterviewCameraRequestPending ? 'Requesting Camera...' : 'Enable Camera'}</button>` : ''}
        <button class="btn btn-secondary" onclick="window.quitMockInterview();">Quit Interview</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (st.report) {
    stopMockInterviewAttentionTracking();
    stopMockInterviewVoice();
    stopMockInterviewCamera();
    exitMockInterviewFullscreen();
    // Render Detailed Interview Report
    const rep = st.report;
    const monitoring = rep.monitoring || { violationCount: 0, violationEvents: [] };
    const answerEvaluationRows = (rep.answerEvaluations || []).map(evaluation => {
      const question = st.sequence.find(item => item.id === evaluation.questionId);
      const coveredPoints = evaluation.keyPointsCovered.length > 0
        ? evaluation.keyPointsCovered.map(point => `<span class="badge badge-green" style="font-size:0.75rem;">${point}</span>`).join(' ')
        : '<span style="color:var(--accent-red);">No expected key points detected</span>';
      return `
        <div style="padding:10px 0; border-bottom:1px solid var(--border-light);">
          <div style="display:flex; justify-content:space-between; gap:12px; font-size:0.84rem;">
            <strong>${question ? question.topic : evaluation.questionId}</strong>
            <strong style="color:${evaluation.score >= 60 ? 'var(--accent-green)' : 'var(--accent-red)'};">${evaluation.score}%</strong>
          </div>
          <div style="font-size:0.74rem; color:var(--text-muted); margin-top:4px;">Relevance ${evaluation.relevance}% | Correctness ${evaluation.correctness}% | Completeness ${evaluation.completeness}% | Communication ${evaluation.communication || 0}% | Behavioural qualities ${evaluation.behavioralQuality || 0}%</div>
          <div style="font-size:0.78rem; margin-top:5px;">${evaluation.feedback || 'No additional feedback available.'}</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:6px;">${coveredPoints}</div>
        </div>`;
    }).join('');
    container.innerHTML = `
      <div class="glass-card" style="max-width:760px; margin:0 auto; text-align:center;">
        <i data-lucide="award" style="font-size:3.5rem; color:var(--accent-purple-light); margin-bottom:1rem;"></i>
        <h2>AI Mock Interview Report Card</h2>
        <p style="color:var(--text-muted);">Evaluation completed across Technical, Project, and HR rounds.</p>

        <!-- Large Circular Progress Indicator -->
        <div class="circular-score-wrapper" style="margin:1.5rem auto;">
          <svg class="circular-score-svg">
            <circle class="circular-score-bg" cx="70" cy="70" r="60"></circle>
            <circle class="circular-score-bar" cx="70" cy="70" r="60" style="stroke-dashoffset:${377 - (377 * rep.overallScore / 100)};"></circle>
          </svg>
          <div class="circular-score-text">
            <div class="circular-score-val">${rep.overallScore}</div>
            <div class="circular-score-lbl">Overall Score</div>
          </div>
        </div>

        <!-- Sub-scores Progress Bars -->
        <div style="text-align:left; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:10px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.88rem;">
              <span>Technical Score</span>
              <strong>${rep.subScores.technical}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden; margin-top:4px;">
              <div style="width:${rep.subScores.technical}%; height:100%; background:var(--accent-purple-light);"></div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.88rem;">
              <span>Project Knowledge Score</span>
              <strong>${rep.subScores.project}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden; margin-top:4px;">
              <div style="width:${rep.subScores.project}%; height:100%; background:var(--accent-blue);"></div>
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.88rem;">
              <span>HR & Communication Score</span>
              <strong>${rep.subScores.hrCommunication}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden; margin-top:4px;">
              <div style="width:${rep.subScores.hrCommunication}%; height:100%; background:var(--accent-pink);"></div>
            </div>
          </div>
        </div>

        <div style="text-align:left; margin-bottom:1.5rem;">
          <h4 style="font-size:1rem; margin-bottom:6px;">Key-Point Evaluation</h4>
          <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:6px;">Scores reflect correctness, relevance, completeness, and expected concepts covered.</p>
          ${answerEvaluationRows}
        </div>

        <!-- Strengths, Improvements, and Topics -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; text-align:left; margin-bottom:1.5rem;">
          <div style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-green);">Strengths:</strong>
            <ul style="padding-left:18px; font-size:0.85rem; margin-top:4px;">
              ${rep.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:12px; border-radius:8px;">
            <strong style="color:var(--accent-red);">Areas for Improvement:</strong>
            <ul style="padding-left:18px; font-size:0.85rem; margin-top:4px;">
              ${rep.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.3); padding:12px; border-radius:8px; text-align:left; margin-bottom:1.5rem;">
          <strong style="color:var(--accent-purple-light);">Recommended Topics to Practice:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
            ${rep.recommendedTopics.map(t => `<span class="badge badge-purple">${t}</span>`).join('')}
          </div>
        </div>

        <div style="background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.25); padding:12px; border-radius:8px; text-align:left; margin-bottom:1.5rem;">
          <strong style="color:var(--accent-cyan);">AI Camera Monitoring</strong>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-top:5px;">${monitoring.violationCount} violation warning event(s) recorded. Natural blinking, small movements, gestures, and posture adjustments were ignored.</p>
          ${monitoring.violationEvents.length ? `<ul style="padding-left:18px; font-size:0.78rem; margin-top:6px;">${monitoring.violationEvents.map(event => `<li>Warning ${event.count} - ${new Date(event.timestamp).toLocaleString()}: ${event.reason}</li>`).join('')}</ul>` : '<p style="font-size:0.78rem; color:var(--accent-green); margin-top:5px;">No camera-monitoring violations recorded.</p>'}
        </div>

        <div style="display:flex; justify-content:center; gap:1rem;">
          <button class="btn btn-primary" onclick="window.cancelMockInterview();"><i data-lucide="rotate-ccw"></i> Retake Interview</button>
          <button class="btn btn-secondary" onclick="window.navigateTo('#placement-readiness');"><i data-lucide="target"></i> View Updated Placement Readiness</button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const currQ = st.sequence[st.currentIndex];

  // Stepper Header
  const step1Class = currQ.round === 1 ? 'active-step' : (currQ.round > 1 ? 'completed-step' : '');
  const step2Class = currQ.round === 2 ? 'active-step' : (currQ.round > 2 ? 'completed-step' : '');
  const step3Class = currQ.round === 3 ? 'active-step' : '';

  container.innerHTML = `
    <div style="max-width:760px; margin:0 auto;">
      <!-- Stepper Header -->
      <div class="interview-stepper">
        <div class="step-item ${step1Class}">
          <span>Round 1</span> <strong>Technical</strong>
        </div>
        <div class="step-item ${step2Class}">
          <span>Round 2</span> <strong>Project</strong>
        </div>
        <div class="step-item ${step3Class}">
          <span>Round 3</span> <strong>HR & Behavioral</strong>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:0.75rem 0 1rem;">
        <span style="font-size:0.85rem; color:var(--text-muted);">Time remaining <span style="margin-left:1rem;">Tab switches: ${st.violations}</span></span>
        <strong id="mock-interview-timer" style="font-variant-numeric:tabular-nums; color:var(--accent-cyan);">${formatMockInterviewTime(st.timeRemainingMs)}</strong>
      </div>

        ${st.cameraStream ? `
        <div class="glass-card" style="margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem;">
          ${st.cameraStream ? '<video id="mock-interview-camera" autoplay muted playsinline style="width:150px; height:100px; object-fit:cover; border-radius:8px; border:2px solid var(--accent-green); transform:scaleX(-1);"></video>' : '<i data-lucide="camera" style="font-size:2rem; color:var(--accent-pink);"></i>'}
          <div>
            <strong>Camera Monitoring: Active</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">AI monitors face visibility, attention direction, and sustained movement. Natural blinking, gestures, and posture changes are allowed.</p>
          </div>
        </div>
      ` : (st.cameraRequestPending ? '<div class="glass-card" style="margin-bottom:1.5rem;">Requesting camera access...</div>' : '')}

      <!-- Question View Card -->
      <div class="glass-card" style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span class="badge badge-purple">Round ${currQ.round} • ${currQ.topic}</span>
          <span style="font-size:0.85rem; color:var(--text-muted);">Question ${st.currentIndex + 1} of ${st.sequence.length}</span>
        </div>
        
        <h3 style="font-size:1.15rem; margin-bottom:1.25rem; line-height:1.4;">
          <i data-lucide="bot" style="color:var(--accent-purple-light);"></i> ${currQ.question}
        </h3>
        ${currQ.round === 3 ? '<button type="button" class="btn btn-secondary btn-sm" onclick="window.repeatMockInterviewQuestion();"><i data-lucide="repeat-2"></i> Repeat Question</button>' : ''}

        ${currQ.round === 3 ? `
          <div class="form-group" style="text-align:left;">
            <label class="form-label">AI HR Interview Voice Response</label>
            <p id="mock-voice-status" style="color:var(--accent-cyan); font-size:0.84rem;">${st.voiceStatus || 'Preparing the AI interviewer...'}</p>
            <div id="mock-voice-transcript" style="min-height:72px; padding:12px; border:1px solid var(--border-light); border-radius:8px; color:var(--text-muted);">${st.voiceTranscript || 'Your spoken answer will appear here.'}</div>
            <div style="display:flex; gap:0.75rem; margin-top:10px;">
              <button id="mock-voice-start" type="button" class="btn btn-secondary" onclick="window.startRound3VoiceAnswer();">Start Microphone</button>
              <button id="mock-voice-finish" type="button" class="btn btn-primary" onclick="window.finishRound3VoiceAnswer();" disabled>Finish Spoken Answer</button>
            </div>
          </div>
        ` : `
          <div class="form-group">
            <label class="form-label">Your Response (Type your response in detail):</label>
            <textarea id="mock-answer-input" class="form-control" style="min-height:120px;" placeholder="Type your answer here...">${st.answersMap[currQ.id] || ''}</textarea>
          </div>
        `}

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="btn btn-secondary" onclick="window.quitMockInterview();">Quit Interview</button>
          <button id="mock-submit-answer" class="btn btn-primary" onclick="submitMockAnswer()"${currQ.round === 3 ? ' disabled' : ''}>${st.currentIndex === st.sequence.length - 1 ? 'Submit & Generate Report' : 'Submit Answer & Next Question →'}</button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
  if (currQ.round === 3) startRound3VoiceInteraction();
  if (st.cameraStream) {
    const video = document.getElementById('mock-interview-camera');
    if (video) {
      video.srcObject = st.cameraStream;
      video.play().catch(() => {});
    }
    if (mockInterviewCameraMonitor?.timer) clearTimeout(mockInterviewCameraMonitor.timer);
    mockInterviewCameraMonitor = null;
    startMockInterviewFaceMonitor();
  }
}

window.submitMockAnswer = function() {
  const st = mockInterviewState;
  if (!st) return;
  if (st.terminated || st.timeoutReached || Date.now() >= st.deadlineAt) {
    endMockInterviewByTimeout();
    return;
  }
  const currQ = st.sequence[st.currentIndex];
  if (!st.cameraStream || st.cameraError) {
    window.showToast('Camera access is required to continue the interview.', 'camera');
    return;
  }
  if (currQ.round === 3 && st.voiceListening) {
    window.showToast('Please finish the spoken answer before submitting.', 'mic');
    return;
  }
  if (st.paused || document.hidden || !document.hasFocus() || !document.fullscreenElement) {
    if (!st.paused && mockInterviewAttentionTracking) mockInterviewAttentionTracking.handleViolation();
    return;
  }

  const textEl = document.getElementById('mock-answer-input');
  const ansText = currQ.round === 3 ? (st.voiceTranscript || '').trim() : (textEl ? textEl.value.trim() : '');

  if (!ansText) {
    window.showToast(currQ.round === 3 ? 'Please answer aloud before proceeding.' : 'Please type a response before proceeding', 'alert-circle');
    return;
  }

  if (currQ.round === 3) stopMockInterviewVoice();
  st.answersMap[currQ.id] = ansText;
  if (currQ.round === 3) {
    const evaluation = window.AnalyticsEngine.evaluateMockInterviewAnswer(ansText, currQ);
    st.answerEvaluations[currQ.id] = evaluation;
    window.showToast(`HR response evaluated: ${evaluation.score}/100`, evaluation.score >= 60 ? 'check' : 'alert-circle');

    if (!currQ.followUp && evaluation.keyPointsCovered.length < evaluation.keyPointsExpected.length) {
      const missingPoints = (currQ.expectedPoints || []).filter(point => !evaluation.keyPointsCovered.includes(point.label));
      const followUpQuestion = {
        id: `r3_followup_${currQ.id}`,
        round: 3,
        topic: 'HR Follow-up',
        followUp: true,
        question: `Follow-up: Please give a specific example that further addresses ${missingPoints.map(point => point.label).join(', ')}.`,
        expectedPoints: missingPoints
      };
      st.sequence.splice(st.currentIndex + 1, 0, followUpQuestion);
    }
  }

  if (st.currentIndex < st.sequence.length - 1) {
    st.currentIndex++;
    window.showToast('Answer recorded. Next question loaded.', 'check');
    renderMockInterviewPage();
  } else {
    // Generate Report after all 3 rounds complete
    stopMockInterviewAttentionTracking();
    const reportRes = window.AnalyticsEngine.evaluateMockInterviewReport(st.answersMap, window.AppState.profile, st.sequence, {
      violationCount: st.round3Violations,
      violationEvents: st.cameraViolationEvents,
      terminated: st.terminated
    });
    st.report = reportRes;

    window.AppState.profile.mockInterviewResults = reportRes;
    window.saveState();

    window.showToast('Mock Interview complete! Generating report...', 'award');
    renderMockInterviewPage();
  }
};

function renderPlacementReadiness() {
  const p = window.AppState.profile;
  const container = document.getElementById('placement-readiness-container');
  if (!container) return;

  if (!p) {
    container.innerHTML = `<div class="empty-state-box"><h3>No Profile Found</h3><a href="#profile-setup" class="btn btn-primary">Setup Profile</a></div>`;
    return;
  }

  const res = window.AnalyticsEngine.calculatePlacementReadiness(p);

  container.innerHTML = `
    <div class="glass-card" style="text-align:center; margin-bottom:1.5rem;">
      <h3 style="color:var(--text-muted);">Overall Placement Readiness Score</h3>
      <div class="gradient-text" style="font-size:3.5rem; font-weight:800;">${res.overallScore} / 100</div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-bottom:1.5rem;">
      <div class="glass-card"><h4>Technical Skills</h4><div style="font-size:1.8rem; font-weight:700; color:var(--accent-purple-light);">${res.components.technical}%</div></div>
      <div class="glass-card"><h4>Resume Score</h4><div style="font-size:1.8rem; font-weight:700; color:var(--accent-blue);">${res.components.resume}%</div></div>
      <div class="glass-card"><h4>Project Readiness</h4><div style="font-size:1.8rem; font-weight:700; color:var(--accent-cyan);">${res.components.projects}%</div></div>
      <div class="glass-card"><h4>Certifications</h4><div style="font-size:1.8rem; font-weight:700; color:var(--accent-green);">${res.components.certifications}%</div></div>
      <div class="glass-card"><h4>Interview Prep</h4><div style="font-size:1.8rem; font-weight:700; color:var(--accent-pink);">${res.components.interview}%</div></div>
    </div>

    <!-- Suggested Improvements -->
    <div class="glass-card">
      <h4 style="margin-bottom:8px;"><i data-lucide="target" style="color:var(--accent-purple-light);"></i> Action Items to Reach 100% Placement Readiness</h4>
      <ul style="padding-left:20px; font-size:0.88rem; display:flex; flex-direction:column; gap:6px;">
        ${res.improvements.map(imp => `<li>${imp}</li>`).join('')}
        ${res.improvements.length === 0 ? '<li>Your placement vector is fully optimized!</li>' : ''}
      </ul>
    </div>
  `;
}

/* ==========================================================================
   MODULE 7: AI MENTOR & CAREER REPORT
   ========================================================================== */

function initAIMentorPage() {
  const chatForm = document.getElementById('form-chat-input');
  if (!chatForm) return;

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-text-input');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;

    appendChatMessage('user', msg);
    if (input) input.value = '';

    setTimeout(() => {
      const reply = window.AnalyticsEngine.generateAIMentorReply(window.AppState.profile, msg);
      appendChatMessage('bot', reply);
    }, 600);
  });
}

function appendChatMessage(sender, text) {
  const container = document.getElementById('chat-messages-list');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`;
  bubble.innerHTML = text;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function renderCareerReport() {
  const p = window.AppState.profile;
  const container = document.getElementById('report-container');
  if (!container || !p) return;

  const analysis = window.AnalyticsEngine.analyzeCareerVector(p);
  const placement = window.AnalyticsEngine.calculatePlacementReadiness(p);
  const authenticity = window.AnalyticsEngine.calculateSkillAuthenticity(p);

  container.innerHTML = `
    <div class="glass-card">
      <h2 style="color:var(--accent-purple-light);">Consolidated Career Vector Report</h2>
      <p><strong>Candidate:</strong> ${window.AppState.user ? window.AppState.user.fullName : 'Student'}</p>
      <p><strong>Target Role:</strong> ${p.targetCareer}</p>
      <hr style="margin:1rem 0; border:0; border-top:1px solid var(--border-light);" />
      <h4>Career Compatibility: <span class="gradient-text">${analysis.suitabilityScore}%</span></h4>
      <h4>Skill Authenticity: <span style="color:var(--accent-green);">${authenticity}%</span></h4>
      <h4>Placement Readiness: <span style="color:var(--accent-cyan);">${placement.overallScore}/100</span></h4>
      <div style="margin-top:1.5rem; display:flex; gap:10px;">
        <button class="btn btn-primary" onclick="window.print()"><i data-lucide="download"></i> Download PDF Report</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   MODULE 8: SETTINGS & ACCOUNT
   ========================================================================== */

function renderSettings() {
  const p = window.AppState.profile;
  const container = document.getElementById('settings-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-card" style="max-width:600px;">
      <h3 style="margin-bottom:1rem;">Account & Profile Settings</h3>
      <div class="form-group">
        <label class="form-label">Target Career Goal</label>
        <input type="text" id="setting-target" class="form-control" value="${p ? p.targetCareer : ''}">
      </div>
      <button class="btn btn-primary" onclick="saveSettings()"><i data-lucide="save"></i> Save Edits</button>
      <hr style="margin:1.5rem 0; border:0; border-top:1px solid var(--border-light);" />
      <button class="btn btn-danger" onclick="window.handleLogout()"><i data-lucide="log-out"></i> Logout</button>
    </div>
  `;
}

window.saveSettings = function() {
  const target = document.getElementById('setting-target')?.value?.trim();
  if (target && window.AppState.profile) {
    window.AppState.profile.targetCareer = target;
    window.saveState();
    window.showToast('Settings saved!', 'check-circle');
  }
};
