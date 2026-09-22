/* ==========================================================================
   CareerVerse AI — Page 4: AI Career Analysis Simulator
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAnalysisPage();
});

function initAnalysisPage() {
  const analyzeBtn = document.getElementById('btn-start-analysis');
  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', () => {
    runCareerAnalysis();
  });
}

function runCareerAnalysis() {
  const heroBox = document.getElementById('analysis-hero-state');
  const loaderBox = document.getElementById('analysis-loader-state');
  const resultsContainer = document.getElementById('analysis-results-grid');
  const statusText = document.getElementById('loader-status-msg');

  if (!heroBox || !loaderBox || !resultsContainer) return;

  // 1. Hide Hero & Show Animated Spinner Loader
  heroBox.style.display = 'none';
  loaderBox.style.display = 'block';
  resultsContainer.style.display = 'none';

  // 2. Sequential Analysis Simulation Messages
  const stages = [
    "AI is analyzing your profile parameters...",
    "Scanning 10,000+ real-time industry job descriptions...",
    "Evaluating skill affinity matrix & experience vectors...",
    "Synthesizing optimal career roadmap & skill gaps..."
  ];

  let currentStage = 0;
  statusText.innerText = stages[0];

  const interval = setInterval(() => {
    currentStage++;
    if (currentStage < stages.length) {
      statusText.innerText = stages[currentStage];
    } else {
      clearInterval(interval);
      revealAnalysisResults();
    }
  }, 900);
}

function revealAnalysisResults() {
  const loaderBox = document.getElementById('analysis-loader-state');
  const resultsContainer = document.getElementById('analysis-results-grid');
  const profile = window.AppState.profile || {};

  loaderBox.style.display = 'none';
  resultsContainer.style.display = 'grid';

  // Populate Card 1: Suitable Career
  const suitableTitle = document.getElementById('res-suitable-title');
  const suitableDesc = document.getElementById('res-suitable-desc');
  if (suitableTitle) suitableTitle.innerText = profile.targetCareer || 'AI Engineer';
  if (suitableDesc) {
    suitableDesc.innerText = `Based on your ${profile.degree || 'Computer Science'} background and high skill affinity in Python & Data Structures, your profile matches with high confidence.`;
  }

  // Populate Card 2: Skill Gaps Chips
  const gapChipsContainer = document.getElementById('res-skill-gaps-chips');
  if (gapChipsContainer) {
    gapChipsContainer.innerHTML = '';
    const gaps = ['PyTorch Framework', 'MLOps Pipeline', 'Vector Databases', 'LangChain Framework', 'Model Evaluation'];
    gaps.forEach(g => {
      const chip = document.createElement('span');
      chip.className = 'badge badge-red';
      chip.style.fontSize = '0.88rem';
      chip.style.padding = '8px 14px';
      chip.innerHTML = `<i data-lucide="x-circle"></i> ${g}`;
      gapChipsContainer.appendChild(chip);
    });
  }

  // Populate Card 3: Industry-Required Skills Checklist
  const checklistContainer = document.getElementById('res-industry-checklist');
  if (checklistContainer) {
    checklistContainer.innerHTML = '';
    const items = [
      { text: 'Advanced Python & Data Structures', check: true },
      { text: 'PyTorch / TensorFlow Model Development', check: false },
      { text: 'SQL & Distributed Data Engines', check: true },
      { text: 'REST APIs & FastAPI Deployment', check: true },
      { text: 'LLM Fine-tuning & Prompt Engineering', check: false }
    ];

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'checklist-item';
      row.innerHTML = `
        <i data-lucide="${item.check ? 'check-circle-2' : 'circle'}" style="color: ${item.check ? '#34D399' : '#6B7280'};"></i>
        <span style="${item.check ? '' : 'color: #9CA3AF;'}">${item.text}</span>
      `;
      checklistContainer.appendChild(row);
    });
  }

  // Populate Card 4: Ranked Career Suggestions
  const suggestionsList = document.getElementById('res-suggestions-list');
  if (suggestionsList) {
    suggestionsList.innerHTML = '';
    const suggestions = [
      { rank: '#1', role: profile.targetCareer || 'AI Engineer', match: '92% Match', desc: 'Design, fine-tune, and deploy AI models & LLM pipelines.' },
      { rank: '#2', role: 'Machine Learning Engineer', match: '85% Match', desc: 'Focus on scalable ML system architecture & feature engineering.' },
      { rank: '#3', role: 'Data Scientist', match: '79% Match', desc: 'Derive predictive insights through statistical modeling & analytics.' }
    ];

    suggestions.forEach(s => {
      const row = document.createElement('div');
      row.className = 'suggestion-row';
      row.innerHTML = `
        <div style="display:flex; align-items:center;">
          <span class="suggestion-rank">${s.rank}</span>
          <div>
            <div style="font-weight:600; font-size:1rem;">${s.role}</div>
            <div style="font-size:0.82rem; color:var(--text-muted);">${s.desc}</div>
          </div>
        </div>
        <span class="badge badge-blue">${s.match}</span>
      `;
      suggestionsList.appendChild(row);
    });
  }

  // Trigger Lucide icons & Card Flip/Fade-in Animation
  if (window.lucide) lucide.createIcons();

  const cards = resultsContainer.querySelectorAll('.result-card');
  cards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.add('revealed');
    }, idx * 180);
  });

  window.showToast('AI Career Analysis Complete!', 'sparkles');
}

// Reset button handler to re-run analysis
window.resetAnalysis = function() {
  const heroBox = document.getElementById('analysis-hero-state');
  const loaderBox = document.getElementById('analysis-loader-state');
  const resultsContainer = document.getElementById('analysis-results-grid');

  if (heroBox && loaderBox && resultsContainer) {
    heroBox.style.display = 'block';
    loaderBox.style.display = 'none';
    resultsContainer.style.display = 'none';

    const cards = resultsContainer.querySelectorAll('.result-card');
    cards.forEach(card => card.classList.remove('revealed'));
  }
};
