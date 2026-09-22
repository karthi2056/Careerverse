/* ==========================================================================
   CareerVerse AI — Page 2: Student Profile Form Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initProfileForm();
});

// Skills and Interests Tag state arrays
let currentSkills = [];
let currentInterests = [];

function initProfileForm() {
  const profileForm = document.getElementById('student-profile-form');
  if (!profileForm) return;

  // Render initial profile state into form
  window.renderProfileForm();

  // Skill Tag Input Handlers
  setupTagInput(
    'skill-tag-input',
    'skills-tags-container',
    currentSkills,
    ['Python', 'PyTorch', 'TensorFlow', 'Docker', 'Kubernetes', 'FastAPI', 'MLOps', 'PostgreSQL', 'React']
  );

  // Interest Tag Input Handlers
  setupTagInput(
    'interest-tag-input',
    'interests-tags-container',
    currentInterests,
    ['Machine Learning', 'Generative AI', 'Deep Learning', 'Data Engineering', 'LLM Alignment', 'Robotics']
  );

  // Form Submit Listener
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('profile-fullname').value.trim();
    const degree = document.getElementById('profile-degree').value;
    const projects = document.getElementById('profile-projects').value.trim();
    const certifications = document.getElementById('profile-certifications').value.trim();
    const targetCareer = document.getElementById('profile-target-career').value.trim() || 'AI Engineer';

    if (!fullName) {
      window.showToast('Please enter your full name', 'alert-circle');
      return;
    }

    // Save updated profile to global state
    window.AppState.profile = {
      fullName,
      degree,
      skills: [...currentSkills],
      projects,
      certifications,
      interests: [...currentInterests],
      targetCareer
    };

    window.saveState();
    window.showToast('Profile updated! Building Digital Twin...', 'sparkles');

    // Navigate to Digital Career Twin Dashboard (Page 3)
    setTimeout(() => {
      window.navigateTo('#dashboard');
    }, 600);
  });
}

window.renderProfileForm = function() {
  const p = window.AppState.profile;
  if (!p) return;

  const nameEl = document.getElementById('profile-fullname');
  const degreeEl = document.getElementById('profile-degree');
  const projectsEl = document.getElementById('profile-projects');
  const certsEl = document.getElementById('profile-certifications');
  const targetEl = document.getElementById('profile-target-career');

  if (nameEl) nameEl.value = p.fullName || '';
  if (degreeEl) degreeEl.value = p.degree || 'Computer Science & Eng';
  if (projectsEl) projectsEl.value = p.projects || '';
  if (certsEl) certsEl.value = p.certifications || '';
  if (targetEl) targetEl.value = p.targetCareer || 'AI Engineer';

  // Initialize tags
  currentSkills = [...(p.skills || [])];
  currentInterests = [...(p.interests || [])];

  renderTags('skills-tags-container', currentSkills, 'skill-tag-input');
  renderTags('interests-tags-container', currentInterests, 'interest-tag-input');
};

function setupTagInput(inputId, containerId, tagArray, quickSuggestions) {
  const inputEl = document.getElementById(inputId);
  const containerEl = document.getElementById(containerId);
  if (!inputEl || !containerEl) return;

  // Render quick suggestion chips below tag box
  renderQuickSuggestions(inputId, containerId, tagArray, quickSuggestions);

  // Keypress event inside tag input field
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputEl.value.trim().replace(',', '');
      if (val && !tagArray.includes(val)) {
        tagArray.push(val);
        inputEl.value = '';
        renderTags(containerId, tagArray, inputId);
      }
    } else if (e.key === 'Backspace' && inputEl.value === '' && tagArray.length > 0) {
      tagArray.pop();
      renderTags(containerId, tagArray, inputId);
    }
  });
}

function renderTags(containerId, tagArray, inputId) {
  const container = document.getElementById(containerId);
  const inputEl = document.getElementById(inputId);
  if (!container || !inputEl) return;

  // Clear existing pills except the input element
  const existingPills = container.querySelectorAll('.tag-pill');
  existingPills.forEach(pill => pill.remove());

  tagArray.forEach((tag, idx) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `
      ${tag}
      <i class="tag-remove" data-index="${idx}">×</i>
    `;

    pill.querySelector('.tag-remove').addEventListener('click', () => {
      tagArray.splice(idx, 1);
      renderTags(containerId, tagArray, inputId);
    });

    container.insertBefore(pill, inputEl);
  });
}

function renderQuickSuggestions(inputId, containerId, tagArray, quickSuggestions) {
  const inputGroup = document.getElementById(inputId).closest('.form-group');
  if (!inputGroup) return;

  let quickContainer = inputGroup.querySelector('.quick-tags-container');
  if (!quickContainer) {
    quickContainer = document.createElement('div');
    quickContainer.className = 'quick-tags-container';
    inputGroup.appendChild(quickContainer);
  }

  quickContainer.innerHTML = `<span class="quick-tag-label">Suggested:</span>`;
  quickSuggestions.forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'quick-tag-chip';
    chip.innerText = `+ ${item}`;
    chip.addEventListener('click', () => {
      if (!tagArray.includes(item)) {
        tagArray.push(item);
        renderTags(containerId, tagArray, inputId);
      }
    });
    quickContainer.appendChild(chip);
  });
}

// Preset Quick Career Goal selection badges helper
window.selectTargetCareer = function(careerTitle) {
  const targetEl = document.getElementById('profile-target-career');
  if (targetEl) {
    targetEl.value = careerTitle;
    window.showToast(`Selected goal: ${careerTitle}`, 'target');
  }
};
