/* ==========================================================================
   CareerVerse AI — Page 6: Resume Analyzer Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initResumeAnalyzer();
});

function initResumeAnalyzer() {
  const dropzone = document.getElementById('resume-dropzone');
  const fileInput = document.getElementById('resume-file-input');

  if (!dropzone || !fileInput) return;

  // Dropzone Click
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag & Drop Events
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
    if (files.length > 0) {
      handleResumeFile(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleResumeFile(fileInput.files[0]);
    }
  });

}

function handleResumeFile(file) {
  const dropzone = document.getElementById('resume-dropzone');
  const laserLine = document.getElementById('resume-laser-scan');
  const fileNameDisplay = document.getElementById('upload-file-name');
  const resultsBox = document.getElementById('resume-results-section');

  if (!dropzone || !laserLine || !resultsBox) return;

  // Update Dropzone visual to scanning state
  if (fileNameDisplay) {
    fileNameDisplay.innerHTML = `<i data-lucide="file-text"></i> Selected File: <strong>${file.name}</strong>`;
  }
  laserLine.style.display = 'block';

  window.showToast('Scanning Resume with ATS AI Engine...', 'scan');

  // Laser Scan Animation for 2.2 seconds
  setTimeout(() => {
    laserLine.style.display = 'none';
    resultsBox.style.display = 'block';

    // Render Scores & Feedback
    renderResumeAnalysisResults();
    
    // Smooth scroll to results
    resultsBox.scrollIntoView({ behavior: 'smooth' });
    window.showToast('Resume ATS Analysis Complete!', 'check-circle');
  }, 2200);
}

function renderResumeAnalysisResults() {
  const scoreVal = window.AppState.resumeScore || 78;
  const scoreNumEl = document.getElementById('resume-score-num');
  const scoreProgressEl = document.getElementById('resume-score-gauge');

  if (scoreNumEl) scoreNumEl.innerHTML = `${scoreVal}<span>/100</span>`;
  if (scoreProgressEl) {
    const circumference = 320;
    const offset = circumference - (scoreVal / 100) * circumference;
    scoreProgressEl.style.strokeDashoffset = offset;
  }

  // Render Missing Skills Red Chips
  const missingChipsEl = document.getElementById('resume-missing-chips');
  if (missingChipsEl) {
    missingChipsEl.innerHTML = '';
    const missing = ['PyTorch', 'MLOps / Model Deployment', 'Vector Databases (Pinecone)', 'Docker / Containerization', 'Kubernetes'];
    missing.forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'badge badge-red';
      chip.style.fontSize = '0.88rem';
      chip.style.padding = '6px 12px';
      chip.innerHTML = `<i data-lucide="alert-circle" style="width:14px;"></i> ${skill}`;
      missingChipsEl.appendChild(chip);
    });
  }

  // Render Numbered Improvement Suggestions with Green Checkmarks
  const suggestionsListEl = document.getElementById('resume-suggestions-list');
  if (suggestionsListEl) {
    suggestionsListEl.innerHTML = '';
    const suggestions = [
      "Quantify project achievements with metrics (e.g. 'Increased model inference speed by 35% using TensorRT').",
      "Add explicit keywords for MLOps frameworks like Docker, MLflow, and FastAPI in your skills section.",
      "Expand project details to highlight fine-tuning open-source LLMs (Llama 3 / Mistral) and vector databases.",
      "Include certification credential URLs (AWS Cloud Practitioner & IBM Data Science) for instant verification.",
      "Optimize header section spacing for improved parser OCR readability."
    ];

    suggestions.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.innerHTML = `
        <i data-lucide="check-circle-2"></i>
        <div>
          <strong style="color:var(--text-main);">${index + 1}.</strong> ${item}
        </div>
      `;
      suggestionsListEl.appendChild(li);
    });
  }

  if (window.lucide) lucide.createIcons();
}

// Download Report Trigger
window.downloadResumeReport = function() {
  const profile = window.AppState.profile || {};
  const reportHtml = `
    <div style="font-family:sans-serif; color:#111; padding:20px;">
      <h2 style="color:#7C3AED; margin-bottom:5px;">CareerVerse AI — ATS Resume Analysis Report</h2>
      <p><strong>Candidate:</strong> ${profile.fullName || 'Alex Rivera'}</p>
      <p><strong>Target Role:</strong> ${profile.targetCareer || 'AI Engineer'}</p>
      <hr style="margin:15px 0; border:0; border-top:1px solid #ddd;" />
      <h3>ATS Compatibility Score: 78 / 100</h3>
      <h4 style="color:#EF4444; margin-top:15px;">Critical Missing Skills:</h4>
      <ul>
        <li>PyTorch / TensorFlow Model Tuning</li>
        <li>MLOps & Pipeline Deployment</li>
        <li>Vector Databases (Pinecone / ChromaDB)</li>
        <li>Containerization (Docker / Kubernetes)</li>
      </ul>
      <h4 style="color:#10B981; margin-top:15px;">Actionable Recommendations:</h4>
      <ol>
        <li>Add quantitative impact metrics (latency, accuracy %) to project bullets.</li>
        <li>Include Docker & FastAPI under technical infrastructure.</li>
        <li>Highlight fine-tuning experience with LLMs.</li>
      </ol>
    </div>
  `;

  const printWin = window.open('', '', 'width=700,height=800');
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
