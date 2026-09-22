/* ==========================================================================
   CareerVerse AI — Page 5: Personalized Roadmap Logic
   ========================================================================== */

const ROADMAP_STEPS = [
  {
    id: 1,
    title: "1. Advanced Python",
    duration: "4 weeks",
    difficulty: "Beginner",
    badgeClass: "badge-green",
    description: "Master OOP principles, async programming, data structures, and scientific computing packages (NumPy, Pandas).",
    modules: [
      "Object-Oriented Programming & Design Patterns",
      "Memory Management & Generators",
      "NumPy Vectorization & Pandas Data Manipulation",
      "Asynchronous I/O & API Integration"
    ]
  },
  {
    id: 2,
    title: "2. SQL & Databases",
    duration: "3 weeks",
    difficulty: "Beginner",
    badgeClass: "badge-green",
    description: "Relational database modeling, complex joins, window functions, indexing, and vector database fundamentals.",
    modules: [
      "Relational Schema Design & Normalization",
      "Advanced SQL Joins & Subqueries",
      "Indexing & Query Performance Optimization",
      "Introduction to NoSQL & Vector Embeddings"
    ]
  },
  {
    id: 3,
    title: "3. Machine Learning",
    duration: "6 weeks",
    difficulty: "Intermediate",
    badgeClass: "badge-blue",
    description: "Supervised and unsupervised algorithms, feature engineering, cross-validation, and Scikit-Learn pipelines.",
    modules: [
      "Regression, Decision Trees & Random Forests",
      "Gradient Boosting (XGBoost, LightGBM)",
      "Unsupervised Clustering (K-Means, PCA)",
      "Hyperparameter Tuning & Model Evaluation"
    ]
  },
  {
    id: 4,
    title: "4. Deep Learning & Neural Networks",
    duration: "6 weeks",
    difficulty: "Intermediate",
    badgeClass: "badge-blue",
    description: "Neural network architectures, Backpropagation, CNNs, RNNs, Transformers, and PyTorch framework mastery.",
    modules: [
      "Perceptrons & Multi-Layer Neural Networks",
      "PyTorch Tensor Operations & Autograd",
      "Convolutional Networks for Computer Vision",
      "Attention Mechanism & Transformer Architectures"
    ]
  },
  {
    id: 5,
    title: "5. Gen AI & LLM Projects",
    duration: "5 weeks",
    difficulty: "Advanced",
    badgeClass: "badge-purple",
    description: "Build production RAG pipelines, fine-tune open-weight LLMs, prompt engineering, and deploy FastAPI endpoints.",
    modules: [
      "Retrieval-Augmented Generation (RAG) Architecture",
      "LangChain & LlamaIndex Framework Integration",
      "PEFT / LoRA Fine-Tuning on Custom Datasets",
      "Deploying AI Services with Docker & FastAPI"
    ]
  },
  {
    id: 6,
    title: "6. Internship & Placement Preparation",
    duration: "4 weeks",
    difficulty: "Advanced",
    badgeClass: "badge-purple",
    description: "System design interviews, portfolio showcasing, mock technical interviews, and ATS resume optimization.",
    modules: [
      "Machine Learning System Design Case Studies",
      "GitHub & Hugging Face Portfolio Structuring",
      "LeetCode Algorithm Deep Dive",
      "Mock AI Engineering Interviews & Behavioral Prep"
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  window.renderRoadmap();
});

window.renderRoadmap = function() {
  const profile = window.AppState.profile || {};
  const roadmapTitleEl = document.getElementById('roadmap-dynamic-title');
  const container = document.getElementById('roadmap-steps-list');
  if (!container) return;

  if (roadmapTitleEl) {
    const target = profile.targetCareer || 'AI Engineer';
    roadmapTitleEl.innerText = `Your ${target} Roadmap`;
  }

  container.innerHTML = '';
  const completedIds = window.AppState.roadmapCompletion || [];

  ROADMAP_STEPS.forEach(step => {
    const isCompleted = completedIds.includes(step.id);

    const stepCard = document.createElement('div');
    stepCard.className = 'glass-card roadmap-step-card';
    stepCard.innerHTML = `
      <div class="step-card-content">
        <div class="step-left">
          <div class="step-number-badge">${step.id}</div>
          <div class="step-info">
            <h4>${step.title.replace(/^\d+\.\s*/, '')}</h4>
            <div class="step-meta">
              <span><i data-lucide="clock" style="width:14px; height:14px;"></i> ${step.duration}</span>
              <span class="badge ${step.badgeClass}">${step.difficulty}</span>
            </div>
            <p style="font-size:0.88rem; color:var(--text-muted); margin-top:6px;">${step.description}</p>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" onclick="openModuleModal(${step.id})">
            <i data-lucide="book-open"></i> Start Learning
          </button>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; color:var(--text-muted);">
            <input type="checkbox" class="checkbox-custom" ${isCompleted ? 'checked' : ''} onchange="toggleStepCompletion(${step.id}, this.checked)">
            Done
          </label>
        </div>
      </div>
    `;

    container.appendChild(stepCard);
  });

  if (window.lucide) lucide.createIcons();
  updateRoadmapProgress();
};

window.toggleStepCompletion = function(stepId, checked) {
  let completed = window.AppState.roadmapCompletion || [];
  if (checked) {
    if (!completed.includes(stepId)) completed.push(stepId);
    window.showToast(`Marked Step ${stepId} as completed!`, 'check-circle-2');
  } else {
    completed = completed.filter(id => id !== stepId);
    window.showToast(`Step ${stepId} unchecked`, 'info');
  }

  window.AppState.roadmapCompletion = completed;
  updateRoadmapProgress();
};

function updateRoadmapProgress() {
  const completedCount = (window.AppState.roadmapCompletion || []).length;
  const totalSteps = ROADMAP_STEPS.length;
  const percent = Math.round((completedCount / totalSteps) * 100);

  const fillEl = document.getElementById('roadmap-progress-fill');
  const labelEl = document.getElementById('roadmap-progress-label');

  if (fillEl) fillEl.style.width = `${percent}%`;
  if (labelEl) labelEl.innerText = `${percent}% Completed (${completedCount}/${totalSteps} Steps)`;
}

window.openModuleModal = function(stepId) {
  const step = ROADMAP_STEPS.find(s => s.id === stepId);
  if (!step) return;

  const contentHtml = `
    <p style="color:var(--text-muted); margin-bottom:1rem;">${step.description}</p>
    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem;">
      <h5 style="margin-bottom:0.75rem; color:var(--accent-cyan); font-family:var(--font-heading);">Key Modules & Syllabus:</h5>
      <ul style="list-style:none; display:flex; flex-direction:column; gap:8px;">
        ${step.modules.map(m => `
          <li style="display:flex; align-items:center; gap:8px; font-size:0.9rem;">
            <i data-lucide="check" style="color:var(--accent-purple-light); width:16px;"></i> ${m}
          </li>
        `).join('')}
      </ul>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button class="btn btn-secondary" onclick="window.closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.toggleStepCompletion(${step.id}, true); window.renderRoadmap(); window.closeModal();">
        <i data-lucide="check"></i> Mark Step Complete
      </button>
    </div>
  `;

  window.openModal(step.title, contentHtml);
};
