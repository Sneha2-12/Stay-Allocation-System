// StayEase - Luxury Resort & Stay Allocation SPA Logic

// Global State
let currentUser = null;
let roomsCache = [];
let occupancyChartInstance = null;
let selectedStayType = 'couple'; // Default
let promoValidationWarning = '';
let resortMapInstance = null;

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchAuthBtn = document.getElementById('switch-auth');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleText = document.getElementById('toggle-text');
const logoutBtn = document.getElementById('logout-btn');

const navItems = document.querySelectorAll('.nav-link-item');
const viewPanels = document.querySelectorAll('.view-panel');
const viewTitle = document.getElementById('view-title');
const headerActions = document.getElementById('header-actions');

// Profile DOM
const currentUserName = document.getElementById('current-user-name');
const currentUserRole = document.getElementById('current-user-role');

// Manager Dashboard DOM
const wardenDashboard = document.getElementById('warden-dashboard');
const statOccupancy = document.getElementById('stat-occupancy');
const statOccupancyPercent = document.getElementById('stat-occupancy-percent');
const statRevenue = document.getElementById('stat-revenue');
const statPending = document.getElementById('stat-pending');
const pendingAllocationsTableBody = document.getElementById('pending-allocations-table-body');
const quickAddRoomBtn = document.getElementById('quick-add-room-btn');

// Guest Dashboard DOM
const studentDashboard = document.getElementById('student-dashboard');
const studentStatusGrid = document.getElementById('student-status-grid');
const studentMainAction = document.getElementById('student-main-action');
const studentActiveAllocation = document.getElementById('student-active-allocation');
const conciergeNotificationsList = document.getElementById('concierge-notifications-list');

// Rooms DOM
const roomsListGrid = document.getElementById('rooms-list-grid');
const filterHostel = document.getElementById('filter-hostel');
const filterType = document.getElementById('filter-type');
const filterAvailability = document.getElementById('filter-availability');
const recommendationNotice = document.getElementById('recommendation-notice');

// Stay Planner DOM
const preferencesForm = document.getElementById('preferences-form');
const stayTypeOptions = document.querySelectorAll('.stay-type-option');
const prefGuests = document.getElementById('pref-guests');
const prefNights = document.getElementById('pref-nights');
const prefCheckin = document.getElementById('pref-checkin');
const prefCheckout = document.getElementById('pref-checkout');
const prefBeddingSelect = document.getElementById('pref-bedding-select');
const prefPackage = document.getElementById('pref-package');
const prefPromo = document.getElementById('pref-promo');
const prefShuttle = document.getElementById('pref-shuttle');
const prefLateCheckout = document.getElementById('pref-late-checkout');

// Estimator DOM
const estBasePrice = document.getElementById('est-base-price');
const estBeddingRow = document.getElementById('est-bedding-row');
const estBeddingPrice = document.getElementById('est-bedding-price');
const estBreakfastRow = document.getElementById('est-breakfast-row');
const estBreakfastPrice = document.getElementById('est-breakfast-price');
const estShuttleRow = document.getElementById('est-shuttle-row');
const estShuttlePrice = document.getElementById('est-shuttle-price');
const estCheckoutRow = document.getElementById('est-checkout-row');
const estCheckoutPrice = document.getElementById('est-checkout-price');
const estSubtotalRow = document.getElementById('est-subtotal-row');
const estSubtotalPrice = document.getElementById('est-subtotal-price');
const estDiscountRow = document.getElementById('est-discount-row');
const estDiscountLabel = document.getElementById('est-discount-label');
const estDiscountPrice = document.getElementById('est-discount-price');
const estTotalPrice = document.getElementById('est-total-price');
const promoValidityAlert = document.getElementById('promo-validity-alert');

// Payments DOM
const paymentsTableBody = document.getElementById('payments-table-body');

// Modals DOM
const requestModal = document.getElementById('request-modal');
const requestModalRoomDesc = document.getElementById('request-modal-room-desc');
const requestRoomId = document.getElementById('request-room-id');
const requestAllocationForm = document.getElementById('request-allocation-form');
const requestNotes = document.getElementById('request-notes');
const bookingModalBreakdown = document.getElementById('booking-modal-breakdown');

const addRoomModal = document.getElementById('add-room-modal');
const addRoomForm = document.getElementById('add-room-form');

// Multi-pane Payment Gateway Modals DOM
const paymentModal = document.getElementById('payment-modal');
const paymentAmountDisplay = document.getElementById('payment-amount-display');
const paymentRoomSummary = document.getElementById('payment-room-summary');
const paymentAllocationId = document.getElementById('payment-allocation-id');
const paymentModalStepLabel = document.getElementById('payment-modal-step-label');

const paymentGatewaySelectPane = document.getElementById('payment-gateway-select-pane');
const paymentSitePane = document.getElementById('payment-site-pane');

// Thank You Overlay DOM
const thankYouOverlay = document.getElementById('thank-you-overlay');
const thankYouIcon = document.getElementById('thank-you-icon');
const thankYouTitle = document.getElementById('thank-you-title');
const thankYouMsg = document.getElementById('thank-you-msg');
const thankYouCountdown = document.getElementById('thank-you-countdown');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupEventListeners();
  setupStayPlannerInteractions();
  setupPromoCardClicks();
  setupSeasonalCalendarClicks();
  setupStarRatingSystem();
  setupCreditCardFormatting();
  seedReviewsWall();
});

// Check Authentication Status
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (data.success && data.user) {
      loginUserSession(data.user);
    } else {
      showAuthScreen();
    }
  } catch (err) {
    showAuthScreen();
  }
}

// Show Authentication Screen
function showAuthScreen() {
  authView.style.display = 'block';
  appView.style.display = 'none';
}

// Login Session Setup
function loginUserSession(user) {
  currentUser = user;
  authView.style.display = 'none';
  appView.style.display = 'grid';

  // Update Profile Sidebar
  currentUserName.textContent = user.name;
  currentUserRole.textContent = user.role === 'manager' ? 'Resort Manager' : 'Guest';

  // Toggle Role-Specific Navigation
  if (user.role === 'manager') {
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'none');
    wardenDashboard.style.display = 'block';
    studentDashboard.style.display = 'none';
    headerActions.innerHTML = `<button class="btn btn-primary" onclick="openModal('add-room-modal')">Add Stay/Suite</button>`;
  } else {
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'inline-block');
    wardenDashboard.style.display = 'none';
    studentDashboard.style.display = 'block';
    headerActions.innerHTML = '';
  }

  // Load Dashboard Data
  loadDashboardData();
  
  // Set Default Stay Planner Calendar Dates (Today and Tomorrow)
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);

  prefCheckin.value = today.toISOString().split('T')[0];
  prefCheckout.value = tomorrow.toISOString().split('T')[0];
  prefNights.value = 2;

  // Load notifications from localStorage
  renderConciergeNotifications();

  // Reset Navigation to Dashboard
  switchView('dashboard-view');
}

// Switch view panels
function switchView(viewId) {
  viewPanels.forEach(panel => {
    if (panel.id === viewId) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Header Title
  const titles = {
    'dashboard-view': 'Resort Dashboard',
    'rooms-view': 'Browse Stays & Suites',
    'matching-view': 'Stay Planner & Configurator',
    'bonus-view': 'Bonus Points & Loyalty Rewards',
    'dine-view': 'Fine Dining & Menus',
    'location-view': 'Estate Location & Map',
    'about-view': 'Resort Profile',
    'contact-view': 'Contact Concierge & Guest Reviews',
    'payments-view': 'Resort Billing Ledger'
  };
  viewTitle.textContent = titles[viewId] || 'Dashboard';

  // Trigger view specific loads
  if (viewId === 'rooms-view') {
    loadRooms();
  } else if (viewId === 'matching-view') {
    loadPreferencesAndPlanner();
  } else if (viewId === 'payments-view') {
    loadPayments();
  } else if (viewId === 'dashboard-view') {
    loadDashboardData();
  } else if (viewId === 'bonus-view') {
    updatePointsUI();
  } else if (viewId === 'contact-view') {
    renderReviewsWall();
  } else if (viewId === 'location-view') {
    initResortMap();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Auth Form Toggling
  switchAuthBtn.addEventListener('click', () => {
    if (loginForm.style.display !== 'none') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      authSubtitle.textContent = 'Join StayEase Resorts and book your stay.';
      toggleText.innerHTML = 'Already have an account? <span id="switch-auth">Sign in</span>';
    } else {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      authSubtitle.textContent = 'Experience luxury. Please enter your credentials.';
      toggleText.innerHTML = 'New to StayEase? <span id="switch-auth">Create an account</span>';
    }
    document.getElementById('switch-auth').addEventListener('click', () => switchAuthBtn.click());
  });

  // Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        loginUserSession(data.user);
      } else {
        alert(data.error || 'Login failed. Check credentials.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    }
  });

  // Register Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        loginUserSession(data.user);
      } else {
        alert(data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering user.');
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout');
      currentUser = null;
      showAuthScreen();
    } catch (err) {
      showAuthScreen();
    }
  });

  // Navigation Links
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.getAttribute('data-view'));
    });
  });

  // Room Filters
  filterHostel.addEventListener('change', filterRooms);
  filterType.addEventListener('change', filterRooms);
  filterAvailability.addEventListener('change', filterRooms);

  // Update Preferences / Planner Form
  preferencesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const guestsCount = prefGuests.value;
    const extraBeddingType = prefBeddingSelect.value;
    const vacationPackage = prefPackage.value;
    const promoCode = prefPromo.value;
    
    const addOns = [];
    if (prefShuttle.checked) addOns.push('shuttle');
    if (prefLateCheckout.checked) addOns.push('lateCheckout');

    if (promoValidationWarning) {
      alert('Cannot apply promo code: ' + promoValidationWarning);
      return;
    }

    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stayType: selectedStayType, 
          guestsCount, 
          extraBedding: extraBeddingType !== 'none',
          addOns,
          preferences: {
            stayType: selectedStayType,
            guestsCount: Number(guestsCount),
            extraBedding: extraBeddingType !== 'none',
            addOns
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        currentUser = data.user;
        currentUser.transientBooking = {
          extraBeddingType,
          vacationPackage,
          promoCode,
          nights: Number(prefNights.value) || 2
        };
        switchView('rooms-view');
      }
    } catch (err) {
      alert('Error saving stay configuration.');
    }
  });

  // Request Booking Form Submission
  requestAllocationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomId = requestRoomId.value;
    const notes = requestNotes.value;

    const nights = currentUser.transientBooking ? currentUser.transientBooking.nights : 2;
    const extraBeddingType = currentUser.transientBooking ? currentUser.transientBooking.extraBeddingType : 'none';
    const vacationPackage = currentUser.transientBooking ? currentUser.transientBooking.vacationPackage : 'room_only';
    const promoCode = currentUser.transientBooking ? currentUser.transientBooking.promoCode : '';

    const addOns = [];
    if (prefShuttle.checked) addOns.push('shuttle');
    if (prefLateCheckout.checked) addOns.push('lateCheckout');

    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          stayType: selectedStayType, 
          guestsCount: prefGuests.value, 
          extraBeddingType, 
          vacationPackage, 
          promoCode, 
          addOns, 
          nights, 
          notes 
        })
      });
      const data = await res.json();
      if (data.success) {
        const booking = data.data;
        alert('Stay booking reservation submitted successfully!');
        
        addConciergeNotification(
          '📧 Booking Reservation Issued',
          `Stay request submitted for Room ${booking.room ? booking.room.roomNumber : ''}. Reservation copy dispatched to ${currentUser.email}.`
        );

        closeModal('request-modal');
        loadDashboardData();
      } else {
        alert(data.error || 'Failed to submit booking.');
      }
    } catch (err) {
      alert('Error submitting booking.');
    }
  });

  // Contact Concierge Form Submit (Inquiry Query)
  const contactForm = document.getElementById('contact-concierge-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = document.getElementById('contact-subject').value;
      
      addConciergeNotification(
        '💬 Concierge Desk Messaging',
        `Hospitality message regarding "${subject}" successfully delivered. Concierge will reply via email.`
      );

      // Trigger Fullscreen thank you overlay countdown (4 seconds)
      showThankYouOverlay(
        '✉️',
        'Inquiry Message Received',
        `Your query regarding "${subject}" is currently being processed. Our resort concierge team will review your message and let you know at their earliest convenience.`,
        contactForm
      );
    });
  }

  // Manager Add Room Form
  addRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomNumber = document.getElementById('room-num').value;
    const resortWing = document.getElementById('room-hostel').value;
    const type = document.getElementById('room-type').value;
    const capacity = document.getElementById('room-capacity').value;
    const price = document.getElementById('room-price').value;
    const floor = document.getElementById('room-floor').value;
    const amenities = document.getElementById('room-amenities').value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber, resortWing, type, capacity, price, floor, amenities })
      });
      const data = await res.json();
      if (data.success) {
        alert('New stay unit added successfully!');
        closeModal('add-room-modal');
        addRoomForm.reset();
        loadRooms();
      } else {
        alert(data.error || 'Failed to add stay unit.');
      }
    } catch (err) {
      alert('Error creating stay unit.');
    }
  });

  // Quick Manager Add Room Button
  if (quickAddRoomBtn) {
    quickAddRoomBtn.addEventListener('click', () => openModal('add-room-modal'));
  }

}

// Finalize successful payment transitions
function finalizePaymentSuccess() {
  addConciergeNotification(
    '📧 Payment Invoice Confirmed',
    `Stay billing finalized. Paid copy of invoice and electronic room keys sent to ${currentUser.email}.`
  );
  addConciergeNotification(
    '🎁 Loyalty Reward points Credited',
    `500 Gold Club bonus points successfully added to your loyalty balance.`
  );

  closeModal('payment-modal');
  loadDashboardData();
}

// Action: Submit Pay on Site Temporary reservation
window.submitPayOnSiteBooking = async function() {
  const allocationId = paymentAllocationId.value;
  const payBtn = document.getElementById('site-pay-button');
  
  payBtn.disabled = true;
  payBtn.innerHTML = `Processing Site Reservation...`;

  try {
    const res = await fetch('/api/payments/pay-on-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocationId })
    });
    const data = await res.json();
    
    if (data.success) {
      alert('Room reservation successfully confirmed! Settle billing charges upon arrival at resort.');
      
      addConciergeNotification(
        '🏨 Room Secured (Pay on Site)',
        `Stay allocation confirmed. Total due: ${paymentAmountDisplay.textContent} payable at front desk.`
      );
      addConciergeNotification(
        '🎁 Loyalty Bonus points Credited',
        `500 Gold Club bonus points successfully added to your loyalty balance.`
      );

      closeModal('payment-modal');
      loadDashboardData();
    } else {
      alert(data.error || 'Failed to lock hold reservation.');
    }
  } catch (err) {
    alert('Error connecting to stay ledger.');
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = `Confirm Hold Reservation`;
  }
};

// Toggle Payment Gateway Panes
window.switchPaymentPane = function(paneId) {
  paymentGatewaySelectPane.style.display = 'none';
  paymentSitePane.style.display = 'none';

  if (paneId === 'gateway') {
    paymentGatewaySelectPane.style.display = 'block';
    paymentModalStepLabel.textContent = '➔ Payment Gateway';
  } else if (paneId === 'site') {
    paymentSitePane.style.display = 'block';
    paymentModalStepLabel.textContent = '➔ Reserve Room';
  }
};

// Razorpay Checkout Integration
window.initiateRazorpayCheckout = async function() {
  const allocationId = paymentAllocationId.value;
  const loadingDiv = document.getElementById('razorpay-loading');
  const gatewayGrid = document.querySelector('.gateway-grid');
  
  if (loadingDiv) loadingDiv.style.display = 'block';
  if (gatewayGrid) gatewayGrid.style.display = 'none';

  try {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocationId })
    });
    const data = await res.json();
    
    if (!data.success) {
      alert(data.error || 'Failed to initialize payment.');
      if (loadingDiv) loadingDiv.style.display = 'none';
      if (gatewayGrid) gatewayGrid.style.display = 'grid';
      return;
    }

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'StayEase Luxury Resort',
      description: `Room Booking Payment for Suite ${data.booking.roomNumber}`,
      order_id: data.order.id,
      prefill: {
        name: data.booking.guestName,
        email: data.booking.guestEmail
      },
      theme: {
        color: '#50c878' // Emerald Green
      },
      handler: async function (response) {
        if (loadingDiv) {
          loadingDiv.querySelector('p').textContent = 'Verifying payment status...';
        }
        
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              allocationId: data.booking.id
            })
          });
          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
            alert('Payment completed and verified successfully! Official PDF invoice generated. You earned 500 Loyalty Bonus Points!');
            finalizePaymentSuccess();
          } else {
            alert(verifyData.error || 'Payment verification failed.');
          }
        } catch (err) {
          alert('Error verifying payment.');
        } finally {
          if (loadingDiv) loadingDiv.style.display = 'none';
          if (gatewayGrid) gatewayGrid.style.display = 'grid';
        }
      },
      modal: {
        ondismiss: function() {
          if (loadingDiv) loadingDiv.style.display = 'none';
          if (gatewayGrid) gatewayGrid.style.display = 'grid';
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    alert('Error connecting to payment gateway.');
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (gatewayGrid) gatewayGrid.style.display = 'grid';
  }
};

// Fullscreen Thank You Countdown Helper
function showThankYouOverlay(icon, title, message, formToReset) {
  thankYouIcon.textContent = icon;
  thankYouTitle.textContent = title;
  thankYouMsg.textContent = message;
  
  // Set Display to flex
  thankYouOverlay.style.display = 'flex';
  
  let countdown = 4;
  thankYouCountdown.textContent = `Returning to Feedback in ${countdown} seconds...`;
  
  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      thankYouCountdown.textContent = `Returning to Feedback in ${countdown} seconds...`;
    } else {
      clearInterval(timer);
      thankYouOverlay.style.display = 'none';
      if (formToReset) {
        formToReset.reset();
      }
    }
  }, 1000);
}

// Setup Stay Planner Interactions
function setupStayPlannerInteractions() {
  stayTypeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      stayTypeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedStayType = opt.getAttribute('data-type');
      
      if (selectedStayType === 'solo') {
        prefGuests.value = '1';
      } else if (selectedStayType === 'couple') {
        prefGuests.value = '2';
      } else if (selectedStayType === 'family') {
        prefGuests.value = '4';
      }
      
      updateLiveEstimator();
    });
  });

  prefCheckin.addEventListener('change', calculateNightsFromDates);
  prefCheckout.addEventListener('change', calculateNightsFromDates);

  [prefGuests, prefBeddingSelect, prefPackage, prefPromo, prefShuttle, prefLateCheckout].forEach(input => {
    input.addEventListener('change', () => {
      validatePromoCodeValidity();
      updateLiveEstimator();
    });
  });
}

// Clickable seasonal promo cards Setup
function setupPromoCardClicks() {
  const offerCards = document.querySelectorAll('.clickable-offer');
  offerCards.forEach(card => {
    card.addEventListener('click', () => {
      const promo = card.getAttribute('data-promo');
      applySeasonalConfigurations(promo);
    });
  });
}

// Setup Seasonal Calendar Clicks
function setupSeasonalCalendarClicks() {
  const seasonCards = document.querySelectorAll('.clickable-season');
  seasonCards.forEach(card => {
    card.addEventListener('click', () => {
      const season = card.getAttribute('data-season');
      let promo = '';
      if (season === 'summer') promo = 'SUMMER15';
      else if (season === 'winter') promo = 'WINTER10';
      else if (season === 'monsoon') promo = 'MONSOON20';
      
      applySeasonalConfigurations(promo);
    });
  });
}

function applySeasonalConfigurations(promo) {
  switchView('matching-view');
  prefPromo.value = promo;
  
  const today = new Date();
  let year = today.getFullYear();
  
  let checkinDateStr = '';
  let checkoutDateStr = '';
  
  if (promo === 'SUMMER15') {
    checkinDateStr = `${year}-07-15`;
    checkoutDateStr = `${year}-07-18`;
  } else if (promo === 'WINTER10') {
    checkinDateStr = `${year}-12-15`;
    checkoutDateStr = `${year}-12-18`;
  } else if (promo === 'MONSOON20') {
    checkinDateStr = `${year}-08-15`;
    checkoutDateStr = `${year}-08-18`;
  } else {
    checkinDateStr = today.toISOString().split('T')[0];
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);
    checkoutDateStr = nextDay.toISOString().split('T')[0];
  }

  prefCheckin.value = checkinDateStr;
  prefCheckout.value = checkoutDateStr;
  
  calculateNightsFromDates();
  
  alert(`Holiday configurations applied! Promo "${promo || 'Standard Stay'}" selected and stay dates adjusted.`);
  
  addConciergeNotification(
    '🛎️ Promo Offer Preconfigured',
    `Holiday season preselection loaded. Promo code ${promo || 'none'} applied for check-in on ${checkinDateStr}.`
  );
}

// Calculate Nights Duration from Date Range
function calculateNightsFromDates() {
  const checkinVal = prefCheckin.value;
  const checkoutVal = prefCheckout.value;
  
  if (checkinVal && checkoutVal) {
    const d1 = new Date(checkinVal);
    const d2 = new Date(checkoutVal);
    
    let diff = d2 - d1;
    let nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (nights < 1) {
      nights = 1;
      const nextDay = new Date(d1);
      nextDay.setDate(nextDay.getDate() + 1);
      prefCheckout.value = nextDay.toISOString().split('T')[0];
    }
    
    prefNights.value = nights;
    
    validatePromoCodeValidity();
    updateLiveEstimator();
  }
}

// Validate Promo Code Validity against Stay Calendar Dates
function validatePromoCodeValidity() {
  const promo = prefPromo.value;
  const checkinVal = prefCheckin.value;
  
  if (!promo || !checkinVal) {
    promoValidationWarning = '';
    promoValidityAlert.style.display = 'none';
    return;
  }
  
  const checkinMonth = new Date(checkinVal).getMonth();
  
  let isValid = true;
  let errorMsg = '';
  
  if (promo === 'SUMMER15') {
    if (checkinMonth < 5 || checkinMonth > 7) {
      isValid = false;
      errorMsg = '⚠️ SUMMER15 is only valid for summer stays starting in June, July, or August.';
    }
  } else if (promo === 'WINTER10') {
    if (checkinMonth !== 11 && checkinMonth !== 0 && checkinMonth !== 1) {
      isValid = false;
      errorMsg = '⚠️ WINTER10 is only valid for winter stays starting in December, January, or February.';
    }
  } else if (promo === 'MONSOON20') {
    if (checkinMonth < 6 || checkinMonth > 8) {
      isValid = false;
      errorMsg = '⚠️ MONSOON20 is only valid for monsoon stays starting in July, August, or September.';
    }
  }
  
  if (!isValid) {
    promoValidationWarning = errorMsg;
    promoValidityAlert.innerHTML = errorMsg;
    promoValidityAlert.style.display = 'block';
  } else {
    promoValidationWarning = '';
    promoValidityAlert.style.display = 'none';
  }
}

// Update Live Price Estimator Panel
function updateLiveEstimator() {
  const guests = Number(prefGuests.value) || 2;
  const nights = Number(prefNights.value) || 2;
  const bedding = prefBeddingSelect.value;
  const pkg = prefPackage.value;
  const promo = prefPromo.value;

  const rates = { solo: 180, couple: 350, family: 550, business: 220 };
  const estRate = rates[selectedStayType] || 300;
  
  const baseCost = estRate * nights;
  estBasePrice.textContent = `$${baseCost.toFixed(2)}`;

  let subtotal = baseCost;

  // Extra Bedding/Mattress pricing
  let beddingCost = 0;
  if (bedding === 'single_mattress') beddingCost = 20 * nights;
  else if (bedding === 'double_mattress') beddingCost = 35 * nights;
  else if (bedding === 'rollaway_bed') beddingCost = 50 * nights;

  if (beddingCost > 0) {
    estBeddingPrice.textContent = `$${beddingCost.toFixed(2)}`;
    estBeddingRow.style.display = 'flex';
    subtotal += beddingCost;
  } else {
    estBeddingRow.style.display = 'none';
  }

  // Vacation Package pricing
  let pkgCost = 0;
  let pkgLabelText = 'Vacation Package:';
  if (pkg === 'breakfast') {
    pkgCost = 20 * guests * nights;
    pkgLabelText = 'Breakfast Buffet:';
  } else if (pkg === 'all_inclusive') {
    pkgCost = 80 * guests * nights;
    pkgLabelText = 'All-Inclusive Pass:';
  }

  if (pkgCost > 0) {
    document.querySelector('#est-breakfast-row span:first-child').textContent = pkgLabelText;
    estBreakfastPrice.textContent = `$${pkgCost.toFixed(2)}`;
    estBreakfastRow.style.display = 'flex';
    subtotal += pkgCost;
  } else {
    estBreakfastRow.style.display = 'none';
  }

  // Shuttle
  if (prefShuttle.checked) {
    estShuttlePrice.textContent = `$40.00`;
    estShuttleRow.style.display = 'flex';
    subtotal += 40;
  } else {
    estShuttleRow.style.display = 'none';
  }

  // Late Checkout
  if (prefLateCheckout.checked) {
    estCheckoutPrice.textContent = `$30.00`;
    estCheckoutRow.style.display = 'flex';
    subtotal += 30;
  } else {
    estCheckoutRow.style.display = 'none';
  }

  // Apply discount only if promo validation passed
  let discountPercent = 0;
  if (!promoValidationWarning) {
    if (promo === 'SUMMER15') discountPercent = 15;
    else if (promo === 'WINTER10') discountPercent = 10;
    else if (promo === 'MONSOON20') discountPercent = 20;
    else if (promo === 'HONEYMOON' && selectedStayType === 'couple') discountPercent = 5;
  }

  let totalCost = subtotal;

  if (discountPercent > 0) {
    const discountAmt = subtotal * (discountPercent / 100);
    totalCost = subtotal - discountAmt;

    estSubtotalPrice.textContent = `$${subtotal.toFixed(2)}`;
    estSubtotalRow.style.display = 'flex';

    estDiscountLabel.textContent = `Promo Discount (${discountPercent}%):`;
    estDiscountPrice.textContent = `-$${discountAmt.toFixed(2)}`;
    estDiscountRow.style.display = 'flex';
  } else {
    estSubtotalRow.style.display = 'none';
    estDiscountRow.style.display = 'none';
  }

  estTotalPrice.textContent = `$${totalCost.toFixed(2)}`;
}

// =======================================================
// CONCIERGE NOTIFICATIONS DESK LOGIC
// =======================================================
function addConciergeNotification(title, text) {
  const newNotif = {
    title,
    text,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
  
  const logs = JSON.parse(localStorage.getItem('concierge_logs') || '[]');
  logs.unshift(newNotif);
  
  if (logs.length > 15) logs.pop();
  
  localStorage.setItem('concierge_logs', JSON.stringify(logs));
  renderConciergeNotifications();
}

function renderConciergeNotifications() {
  if (!conciergeNotificationsList) return;
  
  const logs = JSON.parse(localStorage.getItem('concierge_logs') || '[]');
  
  if (logs.length === 0) {
    conciergeNotificationsList.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:2rem 0;">No concierge notifications.</div>`;
    return;
  }
  
  conciergeNotificationsList.innerHTML = logs.map(l => {
    return `
      <div style="background:rgba(255,255,255,0.01); border-left:3px solid var(--primary); padding:0.6rem 0.75rem; border-radius:var(--radius-sm); margin-bottom:0.5rem; border-top:1px solid rgba(255,255,255,0.02); border-right:1px solid rgba(255,255,255,0.02);">
        <div style="font-weight:700; color:var(--primary); margin-bottom:0.15rem; font-size:0.8rem;">${l.title}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.3;">${l.text}</div>
        <div style="font-size:0.65rem; color:var(--text-muted); margin-top:0.25rem; text-align:right;">${l.time}</div>
      </div>
    `;
  }).join('');
}

// =======================================================
// GUEST FEEDBACK & STAR RATING SYSTEM
// =======================================================
function setupStarRatingSystem() {
  const stars = document.querySelectorAll('.review-star');
  const ratingInput = document.getElementById('review-stars-val');
  const reviewForm = document.getElementById('submit-review-form');
  
  if (!reviewForm) return;

  stars.forEach((star, idx) => {
    // Hover effects
    star.addEventListener('mouseover', () => {
      stars.forEach((s, i) => {
        if (i <= idx) s.classList.add('hovered');
        else s.classList.remove('hovered');
      });
    });

    star.addEventListener('mouseout', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });

    // Click selection
    star.addEventListener('click', () => {
      const selectedVal = idx + 1;
      ratingInput.value = selectedVal;
      stars.forEach((s, i) => {
        if (i < selectedVal) s.classList.add('active');
        else s.classList.remove('active');
      });
    });
  });

  // Handle Review Submit
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const comment = document.getElementById('review-text').value;
    const starsCount = Number(ratingInput.value) || 5;

    const newReview = {
      author: currentUser.name,
      stars: starsCount,
      text: comment,
      date: new Date().toLocaleDateString()
    };

    // Save to reviews local list
    const reviews = JSON.parse(localStorage.getItem('guest_reviews') || '[]');
    reviews.unshift(newReview);
    localStorage.setItem('guest_reviews', JSON.stringify(reviews));

    // Award 100 loyalty points via API
    try {
      const pointsRes = await fetch('/api/auth/add-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: 100 })
      });
      const pointsData = await pointsRes.json();
      if (pointsData.success) {
        currentUser.loyaltyPoints = pointsData.loyaltyPoints;
      }
    } catch (err) {
      console.error('Error awarding points for review:', err);
    }
    
    addConciergeNotification(
      '🌟 Star Review Published',
      `Guest review submitted (${starsCount} Stars). 100 Gold Club Loyalty Points credited to user balance.`
    );

    // Trigger Fullscreen thank you overlay countdown (4 seconds)
    showThankYouOverlay(
      '🌟',
      'Thank You for Your Feedback!',
      'We highly appreciate your review details. 100 Loyalty Reward points have been credited directly to your Club Membership card.',
      reviewForm
    );

    // Reset stars layout
    stars.forEach(s => s.classList.remove('active'));
    stars.forEach((s, i) => {
      if (i < 5) s.classList.add('active');
    });
    ratingInput.value = '5';

    // Wait slightly to render review wall updates so overlay transitions smoothly
    setTimeout(renderReviewsWall, 100);
  });
}

function seedReviewsWall() {
  const existing = localStorage.getItem('guest_reviews');
  if (!existing) {
    const mockReviews = [
      {
        author: 'Alice Vance',
        stars: 5,
        text: 'Unbelievable resort experience! The pool villas are breathtaking, and downloading the PDF receipt was incredibly smooth after checkout payment.',
        date: '2026-06-29'
      },
      {
        author: 'Bob Smith',
        stars: 5,
        text: 'StayEase Concierge was so helpful. They approved my family suite request instantly, and table booking at L\'Ambroisie fine dining was fantastic.',
        date: '2026-06-30'
      },
      {
        author: 'Charlie Brown',
        stars: 4,
        text: 'Loved the quiet atmosphere of the Penthouse Cabin. The mountain views and custom fireplace was cozy. Perfect check-in date matching discounts.',
        date: '2026-07-01'
      }
    ];
    localStorage.setItem('guest_reviews', JSON.stringify(mockReviews));
  }
}

function renderReviewsWall() {
  const listContainer = document.getElementById('reviews-wall-list');
  if (!listContainer) return;

  const reviews = JSON.parse(localStorage.getItem('guest_reviews') || '[]');

  listContainer.innerHTML = reviews.map(r => {
    const starString = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    return `
      <div style="background:rgba(255,255,255,0.01); border:1px solid var(--glass-border); padding:1.25rem; border-radius:var(--radius-md); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-weight:700; color:var(--primary); font-size:1rem;">${r.author}</span>
          <span style="font-size:0.8rem; color:var(--text-muted);">${r.date}</span>
        </div>
        <div style="color:var(--primary); font-size:1.15rem; letter-spacing:1px; margin-bottom:0.5rem;">${starString}</div>
        <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.4;">${r.text}</p>
      </div>
    `;
  }).join('');
}

// =======================================================
// SECURE STRIPE CHECKOUT FORMATTING & PREVIEW SYNC
// =======================================================
function setupCreditCardFormatting() {
  const cardInput = document.getElementById('card-number');
  const expiryInput = document.getElementById('card-expiry');
  const cvcInput = document.getElementById('card-cvc');
  const nameInput = document.getElementById('card-name');
  
  const previewNum = document.getElementById('card-preview-number');
  const previewExpiry = document.getElementById('card-preview-expiry');
  const previewName = document.getElementById('card-preview-name');
  const previewBrand = document.getElementById('card-preview-brand');

  if (!cardInput) return;

  cardInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += val[i];
    }
    
    e.target.value = formatted;
    previewNum.textContent = formatted || '•••• •••• •••• ••••';
    
    if (formatted.startsWith('4')) {
      previewBrand.textContent = 'VISA';
    } else if (formatted.startsWith('5')) {
      previewBrand.textContent = 'MASTERCARD';
    } else {
      previewBrand.textContent = 'VISA';
    }
  });

  expiryInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    
    if (val.length > 2) {
      formatted = val.substring(0, 2) + '/' + val.substring(2, 4);
    } else {
      formatted = val;
    }
    
    e.target.value = formatted;
    previewExpiry.textContent = formatted || 'MM/YY';
  });

  nameInput.addEventListener('input', (e) => {
    previewName.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  });

  cvcInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
}

// =======================================================
// LOYALTY POINTS / REDEEM LOGIC
// =======================================================
function updatePointsUI() {
  const pointsVal = document.getElementById('bonus-points-val');
  if (pointsVal && currentUser) {
    pointsVal.textContent = currentUser.loyaltyPoints.toLocaleString();
  }
}

window.redeemBonusReward = async function(cost, rewardName) {
  if (!currentUser) return;
  
  if (currentUser.loyaltyPoints < cost) {
    alert(`Insufficient loyalty points! You need ${cost} points but currently have ${currentUser.loyaltyPoints}.`);
    return;
  }
  
  if (!confirm(`Are you sure you want to redeem "${rewardName}" for ${cost} loyalty points?`)) return;
  
  try {
    const res = await fetch('/api/auth/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsCost: cost, rewardName })
    });
    const data = await res.json();
    
    if (data.success) {
      currentUser.loyaltyPoints = data.loyaltyPoints;
      updatePointsUI();
      
      const voucherCode = 'SE_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      alert(`Successfully redeemed! Voucher Code: ${voucherCode}. Confirmation email dispatched.`);
      
      addConciergeNotification(
        '🎁 Loyalty Reward Redeemed',
        `Deducted ${cost} points. Reward: "${rewardName}". Voucher code issued: ${voucherCode}. sent to ${currentUser.email}.`
      );
    } else {
      alert(data.error || 'Failed to redeem reward.');
    }
  } catch (err) {
    alert('Error redeeming points.');
  }
};

// =======================================================
// DINING TABLE RESERVATIONS
// =======================================================
window.reserveDineTable = function(restaurantName) {
  const time = prompt(`Enter reservation date and time for ${restaurantName} (e.g., Today at 8:00 PM):`);
  if (!time) return;
  
  alert(`Dining table confirmed at ${restaurantName} for ${time}! Reservation confirmation email dispatched.`);
  
  addConciergeNotification(
    '🍽️ Dining Reservation Confirmed',
    `Table booked at "${restaurantName}" for ${time}. Details sent to ${currentUser.email}.`
  );
};

// Modal Managers
window.openModal = function(modalId) {
  document.getElementById(modalId).classList.add('active');
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
};

// =======================================================
// DASHBOARD DATA LOADER
// =======================================================
async function loadDashboardData() {
  if (!currentUser) return;

  if (currentUser.role === 'manager') {
    // Manager Analytics
    try {
      const res = await fetch('/api/payments/analytics');
      const data = await res.json();

      if (data.success) {
        const stats = data.data;
        statOccupancy.textContent = `${stats.totalOccupied} / ${stats.totalCapacity}`;
        const percent = stats.totalCapacity > 0 ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100) : 0;
        statOccupancyPercent.textContent = `${percent}% capacity filled`;
        statRevenue.textContent = `$${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        statPending.textContent = stats.pendingAllocations;

        renderOccupancyChart(stats.wingBreakdown);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }

    // Fetch Pending Bookings
    try {
      const res = await fetch('/api/allocations');
      const data = await res.json();

      if (data.success) {
        const pending = data.data.filter(a => a.status === 'pending');
        
        if (pending.length === 0) {
          pendingAllocationsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No pending booking requests.</td></tr>`;
        } else {
          pendingAllocationsTableBody.innerHTML = pending.map(a => {
            const config = `${a.stayType.toUpperCase()} | ${a.guestsCount} Guest(s) | ${a.nights || 2} Night(s)`;
            
            const optionsList = [];
            if (a.extraBeddingType === 'single_mattress') optionsList.push('+Single Mattress');
            else if (a.extraBeddingType === 'double_mattress') optionsList.push('+Double Mattress');
            else if (a.extraBeddingType === 'rollaway_bed') optionsList.push('+Rollaway Bed');
            
            if (a.vacationPackage === 'breakfast') optionsList.push('Breakfast Pkg');
            else if (a.vacationPackage === 'all_inclusive') optionsList.push('All-Inclusive Pkg');

            if (a.addOns.includes('shuttle')) optionsList.push('Shuttle');
            if (a.addOns.includes('lateCheckout')) optionsList.push('Late Checkout');

            if (a.promoCode) optionsList.push(`Promo: ${a.promoCode}`);

            const optionsStr = optionsList.length > 0 ? optionsList.join(', ') : 'Room Only';

            return `
              <tr>
                <td>
                  <div style="font-weight:600;">${a.student.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${a.student.email}</div>
                </td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${config}</td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${optionsStr}</td>
                <td style="font-weight:700; color:var(--primary);">$${a.totalPrice.toFixed(2)}</td>
                <td>
                  <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:var(--success); box-shadow:none; color:#000;" onclick="handleAllocationAction('${a._id}', 'approved')">Approve</button>
                    <button class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="handleAllocationAction('${a._id}', 'rejected')">Reject</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.error('Error fetching allocations:', err);
    }
  } else {
    // Load Guest Dashboard
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.success) {
        currentUser = userData.user;
      }

      const allocRes = await fetch('/api/allocations');
      const allocData = await allocRes.json();

      const payRes = await fetch('/api/payments');
      const payData = await payRes.json();

      let activeAlloc = allocData.data ? allocData.data.find(a => ['pending', 'approved', 'confirmed'].includes(a.status)) : null;

      if (!activeAlloc && !currentUser.allocatedRoom) {
        studentStatusGrid.innerHTML = `
          <div class="stat-card">
            <span class="stat-label">Stay Allocation</span>
            <span class="stat-value" style="font-size:1.5rem; color:var(--text-muted);">No Active Stay</span>
            <span class="stat-desc">Plan your stay to book suites</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Dues Outstanding</span>
            <span class="stat-value" style="font-size:1.5rem; color:var(--text-muted);">$0.00</span>
            <span class="stat-desc">No dues pending</span>
          </div>
        `;
        studentMainAction.style.display = 'block';
        studentActiveAllocation.style.display = 'none';
      } else {
        studentMainAction.style.display = 'none';
        studentActiveAllocation.style.display = 'block';

        let allocStatusHtml = '';
        let mainContentHtml = '';

        if (activeAlloc && activeAlloc.status === 'pending') {
          allocStatusHtml = `
            <div class="stat-card">
              <span class="stat-label">Reservation Status</span>
              <span class="stat-value" style="color:var(--warning);">PENDING APPROVAL</span>
              <span class="stat-desc">Requested Room ${activeAlloc.room.roomNumber}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Dues Outstanding</span>
              <span class="stat-value" style="color:var(--warning);">$${activeAlloc.totalPrice.toFixed(2)}</span>
              <span class="stat-desc">Payable upon approval</span>
            </div>
          `;

          mainContentHtml = `
            <div class="chart-container" style="padding: 2.5rem;">
              <h3 style="margin-bottom: 0.5rem; color: var(--primary);">Booking Reservation Pending</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                Your reservation for <strong>Room ${activeAlloc.room.roomNumber} (${activeAlloc.room.type})</strong> in the <strong>${activeAlloc.room.resortWing}</strong> is currently being reviewed by the resort concierge.
              </p>
              <button class="btn btn-danger" style="width:auto;" onclick="cancelRequest('${activeAlloc._id}')">Cancel Reservation</button>
            </div>
          `;
        } else if (activeAlloc && (activeAlloc.status === 'approved' || activeAlloc.status === 'confirmed' || currentUser.allocatedRoom)) {
          const isPaid = activeAlloc.status === 'confirmed' || (payData.data && payData.data.some(p => p.allocation && (p.allocation._id === activeAlloc._id || p.allocation === activeAlloc._id)));
          const isPayOnSite = payData.data && payData.data.some(p => p.allocation && (p.allocation._id === activeAlloc._id || p.allocation === activeAlloc._id) && p.paymentMethod === 'pay_on_site');

          allocStatusHtml = `
            <div class="stat-card">
              <span class="stat-label">Stay Allocation</span>
              <span class="stat-value" style="color:var(--success);">${isPaid ? 'ALLOCATED' : 'APPROVED'}</span>
              <span class="stat-desc">Room ${activeAlloc.room.roomNumber}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Payment Status</span>
              <span class="stat-value" style="color: ${isPaid ? 'var(--success)' : 'var(--danger)'};">${isPaid ? (isPayOnSite ? 'PAY ON SITE' : 'PAID') : 'DUE'}</span>
              <span class="stat-desc">${isPaid ? (isPayOnSite ? 'Pay at Front Desk' : 'All charges settled') : 'Payment required to secure stay'}</span>
            </div>
          `;

          const optionsList = [];
          if (activeAlloc.extraBeddingType === 'single_mattress') optionsList.push('Single Mattress Add-on');
          else if (activeAlloc.extraBeddingType === 'double_mattress') optionsList.push('Double Mattress Add-on');
          else if (activeAlloc.extraBeddingType === 'rollaway_bed') optionsList.push('Extra Rollaway Bed');
          
          if (activeAlloc.vacationPackage === 'breakfast') optionsList.push('Breakfast Package Included');
          else if (activeAlloc.vacationPackage === 'all_inclusive') optionsList.push('All-Inclusive Resort Package');

          if (activeAlloc.addOns && activeAlloc.addOns.includes('shuttle')) optionsList.push('Roundtrip Airport Shuttle');
          if (activeAlloc.addOns && activeAlloc.addOns.includes('lateCheckout')) optionsList.push('Late Checkout');

          if (activeAlloc.promoCode) optionsList.push(`Promo applied: ${activeAlloc.promoCode} (${activeAlloc.discountApplied}% discount)`);

          const optionsStr = optionsList.length > 0 ? optionsList.join('<br>• ') : 'None';

          mainContentHtml = `
            <div class="chart-container" style="padding: 2.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
              <div>
                <h2 style="color:var(--primary);">Your Stay Details</h2>
                <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; line-height: 1.6;">
                  <p><strong>Room / Suite:</strong> Room ${activeAlloc.room.roomNumber} (${activeAlloc.room.type})</p>
                  <p><strong>Resort Wing:</strong> ${activeAlloc.room.resortWing}</p>
                  <p><strong>Stay Details:</strong> ${activeAlloc.guestsCount} Guest(s) | ${activeAlloc.nights || 1} Night(s)</p>
                  <p><strong>Booking Customizations:</strong><br>• ${optionsStr}</p>
                  <p><strong>Amenities:</strong> ${activeAlloc.room.amenities.join(', ')}</p>
                </div>
              </div>
              <div style="border-left: 1px solid var(--glass-border); padding-left: 2rem; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                ${isPaid ? `
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin-bottom: 1rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <h3 style="margin-bottom:0.5rem; color: var(--success);">${isPayOnSite ? 'Booking Secured' : 'Charges Settled'}</h3>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">
                    ${isPayOnSite ? 'Your room is reserved. Settle billing charges upon check-in.' : 'Your stay is fully secured. View or download your invoice receipt below.'}
                  </p>
                  <button class="btn btn-secondary" onclick="switchView('payments-view')">View Receipt</button>
                ` : `
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <h3 style="margin-bottom:0.5rem; color:var(--danger);">Payment Due</h3>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">Please select a gateway to settle the total charge of $${activeAlloc.totalPrice.toFixed(2)}.</p>
                  <button class="btn btn-primary" onclick="openPaymentPortal('${activeAlloc._id}', '${activeAlloc.room.roomNumber}', ${activeAlloc.totalPrice})">Select Payment Method</button>
                `}
              </div>
            </div>
          `;
        }

        studentStatusGrid.innerHTML = allocStatusHtml;
        studentActiveAllocation.innerHTML = mainContentHtml;
      }


    } catch (err) {
      console.error(err);
    }
  }
}

// Action: Warden/Manager approve/reject request
window.handleAllocationAction = async function(id, status) {
  const notes = prompt(`Enter comments/notes for this action:`) || '';
  try {
    const res = await fetch(`/api/allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Stay booking request successfully ${status}!`);
      loadDashboardData();
    } else {
      alert(data.error || 'Failed to update booking status.');
    }
  } catch (err) {
    alert('Error updating booking.');
  }
};

// Action: Student/Guest cancel request
window.cancelRequest = async function(id) {
  if (!confirm('Are you sure you want to cancel this booking reservation?')) return;
  try {
    const res = await fetch(`/api/allocations/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      alert('Stay reservation cancelled.');
      
      addConciergeNotification(
        '🛎️ Booking Reservation Cancelled',
        'Your stay reservation request has been cancelled by your account.'
      );

      loadDashboardData();
    } else {
      alert(data.error || 'Failed to cancel reservation.');
    }
  } catch (err) {
    alert('Error cancelling reservation.');
  }
};

// Render Occupancy Chart
function renderOccupancyChart(breakdown) {
  const ctx = document.getElementById('occupancyChart');
  if (!ctx) return;

  const labels = Object.keys(breakdown);
  const totalBeds = labels.map(l => breakdown[l].total);
  const occupiedBeds = labels.map(l => breakdown[l].occupied);

  if (occupancyChartInstance) {
    occupancyChartInstance.destroy();
  }

  occupancyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Occupied Suites/Villas',
          data: occupiedBeds,
          backgroundColor: '#fbbf24',
          borderRadius: 6
        },
        {
          label: 'Total Capacity',
          data: totalBeds,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f9fafb' } }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

// =======================================================
// STAYS / SUITES LOADER
// =======================================================
async function loadRooms() {
  try {
    const isGuest = currentUser.role === 'guest';
    const endpoint = isGuest ? '/api/match/roommates' : '/api/rooms';
    const res = await fetch(endpoint);
    const data = await res.json();

    if (data.success) {
      if (isGuest) {
        recommendationNotice.style.display = 'block';
        roomsCache = data.data.map(rec => ({
          ...rec.room,
          matchPercentage: rec.matchPercentage,
          reasons: rec.reasons
        }));
      } else {
        recommendationNotice.style.display = 'none';
        roomsCache = data.data;
      }
      
      const wings = [...new Set(roomsCache.map(r => r.resortWing))];
      filterHostel.innerHTML = `<option value="">All Resort Wings</option>` + 
        wings.map(w => `<option value="${w}">${w}</option>`).join('');

      renderRoomsGrid(roomsCache);
    }
  } catch (err) {
    console.error('Error loading rooms:', err);
  }
}

function renderRoomsGrid(rooms) {
  if (rooms.length === 0) {
    roomsListGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">No suites found matching the criteria.</div>`;
    return;
  }

  roomsListGrid.innerHTML = rooms.map(room => {
    const isManager = currentUser.role === 'manager';
    const isFull = room.occupied >= room.capacity;
    
    let actionButtonHtml = '';
    if (isManager) {
      actionButtonHtml = `
        <div style="display:flex; gap:0.5rem; width:100%;">
          <button class="btn btn-secondary" style="flex:1;" onclick="deleteRoom('${room._id}')">Delete</button>
        </div>
      `;
    } else {
      if (currentUser.allocatedRoom && currentUser.allocatedRoom._id === room._id) {
        actionButtonHtml = `<button class="btn btn-secondary" style="width:100%;" disabled>My Reserved Stay</button>`;
      } else if (isFull) {
        actionButtonHtml = `<button class="btn btn-secondary" style="width:100%;" disabled>Fully Booked</button>`;
      } else if (currentUser.allocatedRoom) {
        actionButtonHtml = `<button class="btn btn-secondary" style="width:100%;" disabled>Stay Already Allocated</button>`;
      } else {
        actionButtonHtml = `<button class="btn btn-primary" style="width:100%;" onclick="openRequestModal('${room._id}', '${room.roomNumber}', '${room.price}', '${room.type}')">Book This Stay</button>`;
      }
    }

    const reasonsHtml = room.reasons && room.reasons.length > 0
      ? `<div style="margin-top: 0.5rem; font-size: 0.8rem; color:var(--primary); font-weight: 500;">
          ${room.reasons.map(r => `✓ ${r}`).join('<br>')}
         </div>`
      : '';

    const matchBadgeHtml = room.matchPercentage !== undefined
      ? `<span class="badge badge-approved" style="background:rgba(251, 191, 36, 0.15); color:var(--primary); border-color:rgba(251, 191, 36, 0.3); font-weight: 700;">${room.matchPercentage}% Match</span>`
      : '';

    let photoUrl = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80';
    if (room.type === 'Deluxe Suite') {
      photoUrl = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
    } else if (room.type === 'Family Villa') {
      photoUrl = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80';
    } else if (room.type === 'Penthouse Cabin') {
      photoUrl = 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=600&q=80';
    }

    return `
      <div class="room-card" style="padding:0; overflow:hidden; ${room.matchPercentage >= 85 ? 'border-color: rgba(251, 191, 36, 0.4); box-shadow: 0 4px 15px -5px rgba(251, 191, 36, 0.15);' : ''}">
        <img src="${photoUrl}" alt="${room.type}" style="width:100%; height:160px; object-fit:cover;">
        
        <div style="padding: 1.25rem;">
          <div class="room-header">
            <span class="room-number">${room.roomNumber}</span>
            <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem;">
              <span class="room-price">$${room.price}/night</span>
              ${matchBadgeHtml}
            </div>
          </div>
          <div style="color: var(--text-secondary); font-size:0.85rem; margin-bottom: 0.75rem;">${room.resortWing}</div>
          
          <div class="room-details">
            <span class="room-info-item"><strong>Wing Level:</strong> Floor ${room.floor}</span>
            <span class="room-info-item"><strong>Type:</strong> ${room.type}</span>
            <span class="room-info-item"><strong>Max Capacity:</strong> Up to ${room.capacity} guest(s)</span>
            
            <div class="room-amenities" style="margin-bottom:0.5rem;">
              ${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            </div>

            ${reasonsHtml}
          </div>
          
          <div style="margin-top: 1.25rem;">
            ${actionButtonHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterRooms() {
  const wing = filterHostel.value;
  const type = filterType.value;
  const avail = filterAvailability.value;

  let filtered = roomsCache;

  if (wing) {
    filtered = filtered.filter(r => r.resortWing === wing);
  }
  if (type) {
    filtered = filtered.filter(r => r.type === type);
  }
  if (avail === 'available') {
    filtered = filtered.filter(r => r.occupied < r.capacity);
  }

  renderRoomsGrid(filtered);
}

// Action: Open Booking Request Modal
window.openRequestModal = function(roomId, roomNum, price, type) {
  requestRoomId.value = roomId;
  requestModalRoomDesc.innerHTML = `Confirming stay booking in <strong>Room ${roomNum} (${type})</strong>.`;
  requestNotes.value = '';

  const guests = Number(prefGuests.value) || 2;
  const nights = currentUser.transientBooking ? currentUser.transientBooking.nights : 2;
  const bedding = currentUser.transientBooking ? currentUser.transientBooking.extraBeddingType : 'none';
  const pkg = currentUser.transientBooking ? currentUser.transientBooking.vacationPackage : 'room_only';
  const promo = currentUser.transientBooking ? currentUser.transientBooking.promoCode : '';
  const roomPrice = Number(price);

  let subtotal = roomPrice * nights;
  let breakdownStr = `<strong>Base Price:</strong> $${roomPrice} x ${nights} night(s) = $${(roomPrice * nights).toFixed(2)}<br>`;

  // Bedding
  let beddingCost = 0;
  if (bedding === 'single_mattress') {
    beddingCost = 20 * nights;
    breakdownStr += `<strong>Single Mattress:</strong> $20 x ${nights} night(s) = $${beddingCost.toFixed(2)}<br>`;
  } else if (bedding === 'double_mattress') {
    beddingCost = 35 * nights;
    breakdownStr += `<strong>Double Mattress:</strong> $35 x ${nights} night(s) = $${beddingCost.toFixed(2)}<br>`;
  } else if (bedding === 'rollaway_bed') {
    beddingCost = 50 * nights;
    breakdownStr += `<strong>Extra Rollaway Bed:</strong> $50 x ${nights} night(s) = $${beddingCost.toFixed(2)}<br>`;
  }
  subtotal += beddingCost;

  // Package
  let pkgCost = 0;
  if (pkg === 'breakfast') {
    pkgCost = 20 * guests * nights;
    breakdownStr += `<strong>Daily Breakfast Package:</strong> $20 x ${guests} guest(s) x ${nights} = $${pkgCost.toFixed(2)}<br>`;
  } else if (pkg === 'all_inclusive') {
    pkgCost = 80 * guests * nights;
    breakdownStr += `<strong>All-Inclusive Resort Pass:</strong> $80 x ${guests} guest(s) x ${nights} = $${pkgCost.toFixed(2)}<br>`;
  }
  subtotal += pkgCost;

  // Shuttle & Checkout flat add-ons
  if (prefShuttle.checked) {
    subtotal += 40;
    breakdownStr += `<strong>Roundtrip Shuttle:</strong> $40.00 flat fee<br>`;
  }
  if (prefLateCheckout.checked) {
    subtotal += 30;
    breakdownStr += `<strong>Late Checkout:</strong> $30.00 flat fee<br>`;
  }

  // Promo Discount
  let discountPercent = 0;
  if (!promoValidationWarning) {
    if (promo === 'SUMMER15') discountPercent = 15;
    else if (promo === 'WINTER10') discountPercent = 10;
    else if (promo === 'MONSOON20') discountPercent = 20;
    else if (promo === 'HONEYMOON' && selectedStayType === 'couple') discountPercent = 5;
  }

  let total = subtotal;
  if (discountPercent > 0) {
    const discountAmt = subtotal * (discountPercent / 100);
    total = subtotal - discountAmt;
    breakdownStr += `<span style="color:var(--primary);"><strong>Discount (${promo} - ${discountPercent}%):</strong> -$${discountAmt.toFixed(2)}</span><br>`;
  }

  breakdownStr += `<hr style="margin: 0.5rem 0; border:0; border-top:1px solid var(--glass-border);">`;
  breakdownStr += `<strong>Grand Total:</strong> <span style="color:var(--primary); font-weight:700;">$${total.toFixed(2)}</span>`;

  bookingModalBreakdown.innerHTML = breakdownStr;

  openModal('request-modal');
};

// Action: Open Payment Portal Modal
window.openPaymentPortal = function(allocationId, roomNum, totalPrice) {
  paymentAllocationId.value = allocationId;
  paymentRoomSummary.textContent = `Room Suite-${roomNum}`;
  paymentAmountDisplay.textContent = `$${totalPrice.toFixed(2)}`;
  
  // reset loadings
  const loadingDiv = document.getElementById('razorpay-loading');
  const gatewayGrid = document.querySelector('.gateway-grid');
  if (loadingDiv) loadingDiv.style.display = 'none';
  if (gatewayGrid) gatewayGrid.style.display = 'grid';

  // Settle Pay on site text
  const siteValLabel = document.getElementById('payment-site-total-val');
  if (siteValLabel) {
    siteValLabel.textContent = `$${totalPrice.toFixed(2)}`;
  }
  
  // Open with Step 1 Gateway selector
  switchPaymentPane('gateway');
  openModal('payment-modal');
};

// Action: Manager Delete Room
window.deleteRoom = async function(id) {
  if (!confirm('Are you sure you want to delete this stay unit? This action is irreversible.')) return;
  try {
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('Stay unit deleted successfully.');
      loadRooms();
    } else {
      alert(data.error || 'Failed to delete stay unit.');
    }
  } catch (err) {
    alert('Error deleting stay unit.');
  }
};

// Load preferences in Stay Planner view
async function loadPreferencesAndPlanner() {
  if (currentUser.role !== 'guest') return;

  const prefs = currentUser.preferences || {};
  selectedStayType = prefs.stayType || 'couple';
  
  stayTypeOptions.forEach(opt => {
    if (opt.getAttribute('data-type') === selectedStayType) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  prefGuests.value = prefs.guestsCount || 2;
  
  if (!prefCheckin.value) {
    const today = new Date();
    prefCheckin.value = today.toISOString().split('T')[0];
  }
  if (!prefCheckout.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    prefCheckout.value = tomorrow.toISOString().split('T')[0];
  }

  calculateNightsFromDates();

  prefBeddingSelect.value = currentUser.transientBooking ? currentUser.transientBooking.extraBeddingType : 'none';
  prefPackage.value = currentUser.transientBooking ? currentUser.transientBooking.vacationPackage : 'room_only';
  prefPromo.value = currentUser.transientBooking ? currentUser.transientBooking.promoCode : '';

  const addOns = prefs.addOns || [];
  prefShuttle.checked = addOns.includes('shuttle');
  prefLateCheckout.checked = addOns.includes('lateCheckout');

  updateLiveEstimator();
}

// =======================================================
// PAYMENTS LOADER
// =======================================================
async function loadPayments() {
  try {
    const res = await fetch('/api/payments');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        paymentsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transaction records found.</td></tr>`;
      } else {
        paymentsTableBody.innerHTML = data.data.map(p => {
          let badgeText = 'CARD';
          if (p.transactionId.startsWith('site_')) badgeText = 'PAY ON SITE';
          else if (p.transactionId.startsWith('upi_')) badgeText = 'UPI PAY';
          else if (p.transactionId.startsWith('nb_')) badgeText = 'NET BANK';

          return `
            <tr>
              <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">
                ${p.transactionId}
                <div style="font-size:0.7rem; color:var(--primary); font-weight:700; margin-top:0.2rem;">${badgeText}</div>
              </td>
              <td>
                <div style="font-weight:600;">${p.student.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${p.student.email}</div>
              </td>
              <td>
                <div style="font-weight:600;">Room ${p.room.roomNumber}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${p.room.resortWing}</div>
              </td>
              <td style="font-weight:700; color:var(--primary);">$${p.amount.toFixed(2)}</td>
              <td style="font-size:0.85rem; color:var(--text-secondary);">${new Date(p.paidAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; width:auto; display:inline-flex; align-items:center; gap:0.25rem;" onclick="downloadReceipt('${p._id}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF Receipt
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error fetching payments:', err);
  }
}

window.downloadReceipt = function(paymentId) {
  window.open(`/api/payments/${paymentId}/receipt`, '_blank');
};

// =======================================================
// REAL-TIME LEAFLET MAP INTEGRATION
// =======================================================
function initResortMap() {
  if (resortMapInstance) {
    // Force size invalidation so it draws correctly when display block becomes active
    setTimeout(() => {
      resortMapInstance.invalidateSize();
    }, 100);
    return;
  }

  // Verify Leaflet object is loaded
  if (typeof L === 'undefined') {
    console.warn('Leaflet is not loaded yet.');
    return;
  }

  setTimeout(() => {
    try {
      resortMapInstance = L.map('resort-leaflet-map', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([33.9788, -118.4488], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(resortMapInstance);

      // Add popup marker
      L.marker([33.9788, -118.4488]).addTo(resortMapInstance)
        .bindPopup('<b style="color:#020617; font-size:0.9rem; font-family:\'Outfit\';">StayEase Luxury Resorts & Spa</b><br><span style="color:#475569; font-size:0.75rem;">77 Coastal Boulevard, Ocean Bay Marina, CA 90210</span>')
        .openPopup();
        
      resortMapInstance.invalidateSize();
    } catch (err) {
      console.error('Error initializing Leaflet:', err);
    }
  }, 150);
}

// Expose switchView to window
window.switchView = switchView;
