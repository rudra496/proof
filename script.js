// ===== GLOBAL STATE =====
let currentStep = 1;
const totalSteps = 5;
let selectedPlan = null;
let selectedDuration = 1;
let statementAmount = 0;
const uploadedFiles = {};

// ===== SERVER API =====
const API_BASE_URL = '';

// ===== PRICING DATA (Percentage-based) =====
const planPricing = {
  cas: { percent: 1.2, name: 'CAS Only' },
  visa: { percent: 1.2, name: 'Visa Only' },
  both: { percent: 1.7, name: 'CAS + Visa' }
};

// ===== DOM ELEMENTS =====
const formModal = document.getElementById('formModal');
const applicationForm = document.getElementById('applicationForm');
const progressFill = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const priceSummary = document.getElementById('priceSummary');

// ===== MODAL FUNCTIONS =====
function showForm() {
  formModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  currentStep = 1;
  updateStepDisplay();
  
  // Scroll modal to top
  setTimeout(() => {
    document.querySelector('.modal').scrollTop = 0;
  }, 100);
}

function hideForm() {
  formModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
formModal.addEventListener('click', (e) => {
  if (e.target === formModal) {
    hideForm();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && formModal.classList.contains('active')) {
    hideForm();
  }
});

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('active');
}

// ===== STEP NAVIGATION =====
function updateStepDisplay() {
  // Update form steps
  document.querySelectorAll('.form-step').forEach((step, index) => {
    step.classList.toggle('active', index + 1 === currentStep);
  });
  
  // Update progress steps
  document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 < currentStep) {
      step.classList.add('completed');
    } else if (index + 1 === currentStep) {
      step.classList.add('active');
    }
  });
  
  // Update progress bar
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  progressFill.style.width = `${progress}%`;
  
  // Update buttons
  prevBtn.style.display = currentStep > 1 ? 'flex' : 'none';
  nextBtn.style.display = currentStep < totalSteps ? 'flex' : 'none';
  submitBtn.style.display = currentStep === totalSteps ? 'flex' : 'none';
  
  // Update summary on final step
  if (currentStep === totalSteps) {
    updateFinalSummary();
  }
  
  // Scroll modal to top
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.scrollTop = 0;
  }
}

function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < totalSteps) {
      currentStep++;
      updateStepDisplay();
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

// ===== VALIDATION =====
function validateCurrentStep() {
  const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  
  switch (currentStep) {
    case 1:
      if (!selectedPlan) {
        showToast('Please select a service plan', 'error');
        return false;
      }
      if (!statementAmount || statementAmount <= 0) {
        showToast('Please enter a valid statement amount', 'error');
        document.getElementById('statementAmount').focus();
        return false;
      }
      return true;
      
    case 2:
      const applicantFields = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
      for (let field of applicantFields) {
        if (!field.value.trim()) {
          showToast('Please fill in all required fields', 'error');
          field.focus();
          return false;
        }
      }
      
      // Email validation
      const email = currentStepElement.querySelector('input[name="email"]');
      if (email && !isValidEmail(email.value)) {
        showToast('Please enter a valid email address', 'error');
        email.focus();
        return false;
      }
      
      return true;
      
    case 3:
      const nokFields = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
      for (let field of nokFields) {
        if (!field.value.trim()) {
          showToast('Please fill in all required fields', 'error');
          field.focus();
          return false;
        }
      }
      
      // Email validation for next of kin
      const nokEmail = currentStepElement.querySelector('input[name="nokEmail"]');
      if (nokEmail && !isValidEmail(nokEmail.value)) {
        showToast('Please enter a valid email address', 'error');
        nokEmail.focus();
        return false;
      }
      
      return true;
      
    case 4:
      const requiredFiles = ['validId', 'utilityBill', 'passportPhoto', 'signature'];
      for (let field of requiredFiles) {
        if (!uploadedFiles[field]) {
          showToast('Please upload all required documents', 'error');
          return false;
        }
      }
      return true;
      
    case 5:
      if (!uploadedFiles['paymentProof']) {
        showToast('Please upload your payment proof', 'error');
        return false;
      }
      return true;
      
    default:
      return true;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== PLAN SELECTION =====
function selectPlan(plan) {
  selectedPlan = plan;
  
  // Update UI
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector(`.plan-card[data-plan="${plan}"]`).classList.add('selected');
  
  updatePriceSummary();
}

function selectPlanAndShow(plan) {
  selectPlan(plan);
  showForm();
}

// ===== DURATION SELECTION =====
function selectDuration(duration) {
  // Only allow 1 month for now
  if (duration !== 1) {
    showToast('Only 1 month duration is available at this time', 'error');
    return;
  }
  
  selectedDuration = duration;
  
  // Update UI
  document.querySelectorAll('.duration-option').forEach(option => {
    option.classList.remove('selected');
  });
  document.querySelector(`.duration-option[data-duration="${duration}"]`).classList.add('selected');
  
  updatePriceSummary();
}

// ===== STATEMENT AMOUNT =====
function calculateFee() {
  const amountInput = document.getElementById('statementAmount');
  statementAmount = parseFloat(amountInput.value) || 0;
  updatePriceSummary();
}

// ===== PRICE CALCULATION (Percentage-based) =====
function calculateServiceFee() {
  if (!selectedPlan || statementAmount <= 0) return 0;
  return (statementAmount * planPricing[selectedPlan].percent) / 100;
}

function updatePriceSummary() {
  if (selectedPlan && statementAmount > 0) {
    priceSummary.style.display = 'block';
    const serviceFee = calculateServiceFee();
    
    document.getElementById('selectedPlanName').textContent = planPricing[selectedPlan].name;
    document.getElementById('statementAmountDisplay').textContent = formatAmount(statementAmount);
    document.getElementById('serviceFeePercent').textContent = `${planPricing[selectedPlan].percent}%`;
    document.getElementById('totalPrice').textContent = formatAmount(serviceFee);
  } else {
    priceSummary.style.display = 'none';
  }
}

function formatAmount(amount) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateFinalSummary() {
  const serviceFee = calculateServiceFee();
  
  document.getElementById('finalPlan').textContent = selectedPlan ? planPricing[selectedPlan].name : '-';
  document.getElementById('finalAmount').textContent = formatAmount(statementAmount);
  document.getElementById('finalFeePercent').textContent = `${planPricing[selectedPlan]?.percent || 0}% of statement`;
  document.getElementById('finalTotal').textContent = formatAmount(serviceFee);
  
  // Get applicant info
  const form = document.getElementById('applicationForm');
  const title = form.querySelector('select[name="title"]').value;
  const firstName = form.querySelector('input[name="firstName"]').value;
  const surname = form.querySelector('input[name="surname"]').value;
  const email = form.querySelector('input[name="email"]').value;
  const phone = form.querySelector('input[name="phone"]').value;
  const amountNeeded = form.querySelector('input[name="amountNeeded"]').value;
  
  document.getElementById('summaryName').textContent = `${title} ${firstName} ${surname}`.trim();
  document.getElementById('summaryEmail').textContent = email || '-';
  document.getElementById('summaryPhone').textContent = phone || '-';
  document.getElementById('summaryAmount').textContent = amountNeeded ? formatAmount(parseFloat(amountNeeded)) : '-';
}

// ===== FILE UPLOAD =====
document.querySelectorAll('.upload-zone').forEach(zone => {
  const field = zone.dataset.field;
  const input = zone.querySelector('input[type="file"]');
  
  // Click to upload
  zone.addEventListener('click', () => {
    input.click();
  });
  
  // Drag and drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--primary)';
    zone.style.background = 'rgba(13, 148, 136, 0.05)';
  });
  
  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background = '';
  });
  
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background = '';
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(field, file, zone);
    }
  });
  
  // File input change
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(field, file, zone);
    }
  });
});

function handleFileUpload(field, file, zone) {
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be less than 5MB', 'error');
    return;
  }
  
  // Store file
  uploadedFiles[field] = file;
  
  // Update UI
  const content = zone.querySelector('.upload-content');
  const success = zone.querySelector('.upload-success');
  const fileName = zone.querySelector('.file-name');
  
  content.style.display = 'none';
  success.style.display = 'flex';
  fileName.textContent = file.name;
  zone.classList.add('uploaded');
  
  showToast('File uploaded successfully', 'success');
}

// ===== COPY TO CLIPBOARD =====
function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied to clipboard!`, 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// ===== FORM SUBMISSION =====
applicationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateCurrentStep()) return;
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    Submitting...
  `;
  
  // Collect form data
  const formData = new FormData();
  
  // Add plan data
  formData.append('plan', selectedPlan);
  formData.append('duration', selectedDuration);
  formData.append('statementAmount', statementAmount);
  formData.append('serviceFeePercent', planPricing[selectedPlan].percent);
  formData.append('serviceFeeAmount', calculateServiceFee());
  
  // Add applicant data
  const applicantFields = ['nin', 'bvn', 'title', 'surname', 'firstName', 'middleName', 
    'gender', 'maritalStatus', 'dateOfBirth', 'countryOfBirth', 'nationality', 
    'stateOfOrigin', 'lga', 'mothersMaidenName', 'residentialAddress', 
    'nearestBusStop', 'cityTown', 'stateOfResidence', 'occupation', 
    'phone', 'email', 'amountNeeded'];
  
  applicantFields.forEach(field => {
    const input = applicationForm.querySelector(`[name="${field}"]`);
    if (input) {
      formData.append(field, input.value);
    }
  });
  
  // Add next of kin data
  const nokFields = ['nokTitle', 'nokSurname', 'nokFirstName', 'nokMiddleName',
    'nokGender', 'nokRelationship', 'nokPhone', 'nokEmail', 'nokAddress', 
    'nokCityTown', 'nokState'];
  
  nokFields.forEach(field => {
    const input = applicationForm.querySelector(`[name="${field}"]`);
    if (input) {
      formData.append(field, input.value);
    }
  });
  
  // Add files
  Object.keys(uploadedFiles).forEach(field => {
    formData.append(field, uploadedFiles[field]);
  });
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/apply`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload request failed');
    }

    const result = await response.json();
    showToast(`Submitted! Ref: ${result.applicationId}. Files are available in server uploads.`, 'success');
    
    // Reset form and close modal
    setTimeout(() => {
      hideForm();
      resetForm();
    }, 2000);
    
  } catch (error) {
    showToast('Failed to submit application. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <path d="m9 11 3 3L22 4"/>
      </svg>
      Submit Application
    `;
  }
});

function resetForm() {
  // Reset state
  currentStep = 1;
  selectedPlan = null;
  selectedDuration = 1;
  statementAmount = 0;
  
  // Clear uploaded files
  Object.keys(uploadedFiles).forEach(key => delete uploadedFiles[key]);
  
  // Reset form inputs
  applicationForm.reset();
  
  // Reset UI
  document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
  document.querySelectorAll('.duration-option').forEach(option => option.classList.remove('selected'));
  document.querySelector('.duration-option[data-duration="1"]').classList.add('selected');
  
  // Reset file uploads
  document.querySelectorAll('.upload-zone').forEach(zone => {
    zone.classList.remove('uploaded');
    zone.querySelector('.upload-content').style.display = 'block';
    zone.querySelector('.upload-success').style.display = 'none';
  });
  
  // Reset statement amount input
  const statementInput = document.getElementById('statementAmount');
  if (statementInput) statementInput.value = '';
  
  // Hide price summary
  priceSummary.style.display = 'none';
  
  // Reset step display
  updateStepDisplay();
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-message').textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    
    // Close mobile menu if open
    document.getElementById('navLinks').classList.remove('active');
    
    if (targetId === '#') return;
    
    const target = document.querySelector(targetId);
    if (target) {
      const navHeight = 70;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  // Set first duration option as selected
  document.querySelector('.duration-option[data-duration="1"]').classList.add('selected');
  
  // Add loading spinner styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
});

// ===== EXPOSE FUNCTIONS GLOBALLY =====
window.showForm = showForm;
window.hideForm = hideForm;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.selectPlan = selectPlan;
window.selectPlanAndShow = selectPlanAndShow;
window.selectDuration = selectDuration;
window.toggleMobileMenu = toggleMobileMenu;
window.calculateFee = calculateFee;
window.copyToClipboard = copyToClipboard;
