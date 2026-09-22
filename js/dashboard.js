/* ==========================================================================
   CareerVerse AI — Page 3: Digital Career Twin Dashboard
   ========================================================================== */

window.renderDashboard = function() {
  const p = window.AppState.profile;
  if (!p) return;

  // 1. Render Left Sidebar Profile Info
  const avatarEl = document.getElementById('dash-avatar');
  const nameEl = document.getElementById('dash-name');
  const deptEl = document.getElementById('dash-dept');
  const goalEl = document.getElementById('dash-goal');
  const skillsListEl = document.getElementById('dash-skills-list');

  if (avatarEl) {
    const initials = (p.fullName || 'Alex Rivera')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    avatarEl.innerText = initials;
  }

  if (nameEl) nameEl.innerText = p.fullName || 'Alex Rivera';
  if (deptEl) deptEl.innerText = p.degree || 'Computer Science & AI';
  if (goalEl) goalEl.innerText = p.targetCareer || 'AI Engineer';

  if (skillsListEl) {
    skillsListEl.innerHTML = '';
    const skills = p.skills && p.skills.length > 0 
      ? p.skills 
      : ['Python', 'SQL', 'Data Structures'];
    
    skills.forEach(skill => {
      const badge = document.createElement('span');
      badge.className = 'badge badge-purple';
      badge.innerText = skill;
      skillsListEl.appendChild(badge);
    });
  }

  // 2. Calculate Readiness Score and Gauge
  // Based on current skills compared to typical industry baseline
  const totalTargetSkills = 10;
  const userSkillCount = Math.min((p.skills ? p.skills.length : 4), totalTargetSkills);
  const readinessPercent = Math.min(Math.round((userSkillCount / totalTargetSkills) * 100 + 28), 94);

  const gaugeValueEl = document.getElementById('dash-readiness-val');
  const gaugeProgressEl = document.getElementById('dash-gauge-progress');

  if (gaugeValueEl) gaugeValueEl.innerText = `${readinessPercent}%`;

  if (gaugeProgressEl) {
    // Circumference of stroke-dasharray 440
    const circumference = 440;
    const offset = circumference - (readinessPercent / 100) * circumference;
    setTimeout(() => {
      gaugeProgressEl.style.strokeDashoffset = offset;
    }, 150);
  }

  // 3. Recommended Career Match
  const recCareerTitleEl = document.getElementById('dash-rec-career-title');
  const recMatchValEl = document.getElementById('dash-rec-match-val');
  const recMatchDescEl = document.getElementById('dash-rec-desc');

  if (recCareerTitleEl) recCareerTitleEl.innerText = p.targetCareer || 'AI Engineer';
  if (recMatchValEl) recMatchValEl.innerText = `${readinessPercent + 4}% Match`;
  if (recMatchDescEl) {
    recMatchDescEl.innerText = `Strong foundational alignment based on your degree in ${p.degree || 'Computer Science'} and profile vectors.`;
  }

  // 4. Render Skill Gap Warning Badges
  renderSkillGaps(p);
};

function renderSkillGaps(profile) {
  const gapContainer = document.getElementById('dash-skill-gaps-container');
  if (!gapContainer) return;

  gapContainer.innerHTML = '';

  // Standard recommended skills for target career
  const fullIndustryRequirements = [
    { skill: 'PyTorch / TensorFlow', priority: 'Critical', category: 'Deep Learning' },
    { skill: 'MLOps & Model Deployment', priority: 'High', category: 'DevOps' },
    { skill: 'Vector Databases (Pinecone/Chroma)', priority: 'High', category: 'GenAI' },
    { skill: 'LangChain & LlamaIndex', priority: 'High', category: 'GenAI' },
    { skill: 'Distributed System Tuning', priority: 'Medium', category: 'Engineering' }
  ];

  // Filter out skills user already claims to have
  const userSkillsLower = (profile.skills || []).map(s => s.toLowerCase());
  const missingGaps = fullIndustryRequirements.filter(req => {
    return !userSkillsLower.some(us => us.includes(req.skill.toLowerCase().split(' ')[0]));
  });

  const displayGaps = missingGaps.length > 0 ? missingGaps : fullIndustryRequirements.slice(0, 4);

  displayGaps.forEach(item => {
    const chip = document.createElement('div');
    chip.className = 'gap-chip';
    chip.innerHTML = `
      <i data-lucide="alert-triangle" style="color:#F87171; font-size:1.1rem;"></i>
      <span>${item.skill}</span>
      <span class="gap-priority">${item.priority}</span>
    `;
    gapContainer.appendChild(chip);
  });

  if (window.lucide) lucide.createIcons();
}
