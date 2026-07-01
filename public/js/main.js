// StayEase - Luxury Resort & Stay Allocation SPA Logic

// Global State
let currentUser = null;
let roomsCache = [];
let occupancyChartInstance = null;
let selectedStayType = 'couple'; // Default

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchAuthBtn = document.getElementById('switch-auth');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleText = document.getElementById('toggle-text');
const logoutBtn = document.getElementById('logout-btn');

const navItems = document.querySelectorAll('.nav-item');
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

const paymentModal = document.getElementById('payment-modal');
const paymentRoomNum = document.getElementById('payment-room-num');
const paymentAmountDisplay = document.getElementById('payment-amount-display');
const paymentAllocationId = document.getElementById('payment-allocation-id');
const paymentCheckoutForm = document.getElementById('payment-checkout-form');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupEventListeners();
  setupStayPlannerInteractions();
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
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'flex');
    wardenDashboard.style.display = 'none';
    studentDashboard.style.display = 'block';
    headerActions.innerHTML = '';
  }

  // Load Dashboard Data
  loadDashboardData();
  
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

  // Navigation
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

    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stayType: selectedStayType, 
          guestsCount, 
          extraBedding: extraBeddingType !== 'none', // legacy compatibility
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
        // Since we also want to store these on the client local session, let's refresh User
        currentUser = data.user;
        // Save the transient selections on currentUser for calculation in request modal
        currentUser.transientBooking = {
          extraBeddingType,
          vacationPackage,
          promoCode,
          nights: Number(prefNights.value) || 1
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

    const nights = currentUser.transientBooking ? currentUser.transientBooking.nights : 1;
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
        alert('Stay booking reservation submitted successfully!');
        closeModal('request-modal');
        loadDashboardData();
      } else {
        alert(data.error || 'Failed to submit booking.');
      }
    } catch (err) {
      alert('Error submitting booking.');
    }
  });

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
  quickAddRoomBtn.addEventListener('click', () => openModal('add-room-modal'));

  // Checkout Payment Form
  paymentCheckoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const allocationId = paymentAllocationId.value;
    const cardNumber = document.getElementById('card-number').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvc = document.getElementById('card-cvc').value;

    const payBtn = document.getElementById('pay-button');
    payBtn.disabled = true;
    payBtn.innerHTML = `Processing Securely...`;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationId, cardNumber, cardExpiry, cardCvc })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment completed successfully! Official PDF invoice generated.');
        closeModal('payment-modal');
        paymentCheckoutForm.reset();
        loadDashboardData();
      } else {
        alert(data.error || 'Payment failed.');
      }
    } catch (err) {
      alert('Payment processing error.');
    } finally {
      payBtn.disabled = false;
      payBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Pay Securely Now`;
    }
  });
}

// Setup Stay Planner Interactions
function setupStayPlannerInteractions() {
  // Stay Type Option clicks
  stayTypeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      stayTypeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedStayType = opt.getAttribute('data-type');
      
      // Auto-set guest defaults based on type
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

  // Change inputs trigger live estimator
  [prefGuests, prefNights, prefBeddingSelect, prefPackage, prefPromo, prefShuttle, prefLateCheckout].forEach(input => {
    input.addEventListener('change', updateLiveEstimator);
    input.addEventListener('input', updateLiveEstimator);
  });
}

// Update Live Price Estimator Panel
function updateLiveEstimator() {
  const guests = Number(prefGuests.value) || 2;
  const nights = Number(prefNights.value) || 1;
  const bedding = prefBeddingSelect.value;
  const pkg = prefPackage.value;
  const promo = prefPromo.value;

  // Average nightly rates for estimation
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
    pkgLabelText = 'Daily Breakfast:';
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

  // Promo Discount calculations
  let discountPercent = 0;
  if (promo === 'SUMMER15') discountPercent = 15;
  else if (promo === 'WINTER10') discountPercent = 10;
  else if (promo === 'MONSOON20') discountPercent = 20;
  else if (promo === 'HONEYMOON' && selectedStayType === 'couple') discountPercent = 5;

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
// DASHBOARD LOADER
// =======================================================
async function loadDashboardData() {
  if (!currentUser) return;

  if (currentUser.role === 'manager') {
    // 1. Fetch Manager Analytics
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

    // 2. Fetch Pending Bookings
    try {
      const res = await fetch('/api/allocations');
      const data = await res.json();

      if (data.success) {
        const pending = data.data.filter(a => a.status === 'pending');
        
        if (pending.length === 0) {
          pendingAllocationsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No pending booking requests.</td></tr>`;
        } else {
          pendingAllocationsTableBody.innerHTML = pending.map(a => {
            const config = `${a.stayType.toUpperCase()} | ${a.guestsCount} Guest(s) | ${a.nights || 1} Night(s)`;
            
            const optionsList = [];
            // Bedding
            if (a.extraBeddingType === 'single_mattress') optionsList.push('+Single Mattress');
            else if (a.extraBeddingType === 'double_mattress') optionsList.push('+Double Mattress');
            else if (a.extraBeddingType === 'rollaway_bed') optionsList.push('+Rollaway Bed');
            
            // Package
            if (a.vacationPackage === 'breakfast') optionsList.push('Breakfast Pkg');
            else if (a.vacationPackage === 'all_inclusive') optionsList.push('All-Inclusive Pkg');

            // Flat services
            if (a.addOns.includes('shuttle')) optionsList.push('Shuttle');
            if (a.addOns.includes('lateCheckout')) optionsList.push('Late Checkout');

            // Promo
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
                    <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:var(--success); box-shadow:none;" onclick="handleAllocationAction('${a._id}', 'approved')">Approve</button>
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

      let activeAlloc = allocData.data ? allocData.data.find(a => ['pending', 'approved'].includes(a.status)) : null;

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
        } else if (currentUser.allocatedRoom) {
          const isPaid = payData.data && payData.data.some(p => p.room._id === currentUser.allocatedRoom._id && p.status === 'completed');
          const approvedAlloc = allocData.data.find(a => a.room._id === currentUser.allocatedRoom._id && a.status === 'approved');

          allocStatusHtml = `
            <div class="stat-card">
              <span class="stat-label">Stay Allocation</span>
              <span class="stat-value" style="color:var(--success);">ALLOCATED</span>
              <span class="stat-desc">Room ${currentUser.allocatedRoom.roomNumber}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Payment Status</span>
              <span class="stat-value" style="color: ${isPaid ? 'var(--success)' : 'var(--danger)'};">${isPaid ? 'PAID' : 'DUE'}</span>
              <span class="stat-desc">${isPaid ? 'All charges settled' : 'Payment required to secure stay'}</span>
            </div>
          `;

          const optionsList = [];
          // Bedding
          if (approvedAlloc.extraBeddingType === 'single_mattress') optionsList.push('Single Mattress Add-on');
          else if (approvedAlloc.extraBeddingType === 'double_mattress') optionsList.push('Double Mattress Add-on');
          else if (approvedAlloc.extraBeddingType === 'rollaway_bed') optionsList.push('Extra Rollaway Bed');
          
          // Package
          if (approvedAlloc.vacationPackage === 'breakfast') optionsList.push('Breakfast Package Included');
          else if (approvedAlloc.vacationPackage === 'all_inclusive') optionsList.push('All-Inclusive Resort Package');

          // Services
          if (approvedAlloc.addOns.includes('shuttle')) optionsList.push('Roundtrip Airport Shuttle');
          if (approvedAlloc.addOns.includes('lateCheckout')) optionsList.push('Late Checkout');

          // Promo
          if (approvedAlloc.promoCode) optionsList.push(`Promo applied: ${approvedAlloc.promoCode} (${approvedAlloc.discountApplied}% discount)`);

          const optionsStr = optionsList.length > 0 ? optionsList.join('<br>• ') : 'None';

          mainContentHtml = `
            <div class="chart-container" style="padding: 2.5rem; display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
              <div>
                <h2 style="color:var(--primary);">Your Stay Details</h2>
                <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; line-height: 1.6;">
                  <p><strong>Room / Suite:</strong> Room ${currentUser.allocatedRoom.roomNumber} (${currentUser.allocatedRoom.type})</p>
                  <p><strong>Resort Wing:</strong> ${currentUser.allocatedRoom.resortWing}</p>
                  <p><strong>Stay Details:</strong> ${approvedAlloc.guestsCount} Guest(s) | ${approvedAlloc.nights} Night(s)</p>
                  <p><strong>Booking Customizations:</strong><br>• ${optionsStr}</p>
                  <p><strong>Amenities:</strong> ${currentUser.allocatedRoom.amenities.join(', ')}</p>
                </div>
              </div>
              <div style="border-left: 1px solid var(--glass-border); padding-left: 2rem; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                ${isPaid ? `
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" style="margin-bottom: 1rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <h3 style="margin-bottom:0.5rem; color: var(--success);">Charges Settled</h3>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">Your stay is fully secured. View or download your invoice receipt below.</p>
                  <button class="btn btn-secondary" onclick="switchView('payments-view')">View Receipt</button>
                ` : `
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <h3 style="margin-bottom:0.5rem; color:var(--danger);">Payment Due</h3>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">Please pay the total charge of $${approvedAlloc.totalPrice.toFixed(2)} to secure your stay.</p>
                  <button class="btn btn-primary" onclick="openPaymentPortal('${approvedAlloc._id}', '${currentUser.allocatedRoom.roomNumber}', ${approvedAlloc.totalPrice})">Pay Securely Now</button>
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
          backgroundColor: '#fbbf24', // Gold
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

    return `
      <div class="room-card" style="${room.matchPercentage >= 85 ? 'border-color: rgba(251, 191, 36, 0.4); box-shadow: 0 4px 15px -5px rgba(251, 191, 36, 0.15);' : ''}">
        <div>
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
            
            <div class="room-amenities">
              ${room.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            </div>

            ${reasonsHtml}
          </div>
        </div>
        <div style="margin-top: 1rem;">
          ${actionButtonHtml}
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

  // Get config from client profile
  const guests = Number(prefGuests.value) || 2;
  const nights = currentUser.transientBooking ? currentUser.transientBooking.nights : 1;
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
  if (promo === 'SUMMER15') discountPercent = 15;
  else if (promo === 'WINTER10') discountPercent = 10;
  else if (promo === 'MONSOON20') discountPercent = 20;
  else if (promo === 'HONEYMOON' && selectedStayType === 'couple') discountPercent = 5;

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
  paymentRoomNum.textContent = roomNum;
  paymentAmountDisplay.textContent = `$${totalPrice.toFixed(2)}`;
  
  document.getElementById('card-preview-number').textContent = '•••• •••• •••• ••••';
  document.getElementById('card-preview-name').textContent = currentUser.name.toUpperCase();
  document.getElementById('card-preview-expiry').textContent = 'MM/YY';
  
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
  
  // Set active option in visual grid
  stayTypeOptions.forEach(opt => {
    if (opt.getAttribute('data-type') === selectedStayType) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  prefGuests.value = prefs.guestsCount || 2;
  prefNights.value = currentUser.transientBooking ? currentUser.transientBooking.nights : 1;
  
  // Setup dropdowns
  prefBeddingSelect.value = currentUser.transientBooking ? currentUser.transientBooking.extraBeddingType : 'none';
  prefPackage.value = currentUser.transientBooking ? currentUser.transientBooking.vacationPackage : 'room_only';
  prefPromo.value = currentUser.transientBooking ? currentUser.transientBooking.promoCode : '';

  // Setup services checkboxes
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
          return `
            <tr>
              <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">${p.transactionId}</td>
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

// Expose switchView to window
window.switchView = switchView;
