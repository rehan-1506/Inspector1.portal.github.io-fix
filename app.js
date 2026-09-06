// app.js — replacement for the Inspector front-end demo
// Provides: demo profile storage, login demo, password toggle, SSO redirect,
// mobile sidebar toggle, account menu, profile form handling, camera capture fallback,
// export/print helpers, toasts, workflow highlight, and ripple effect.
// This script is defensive: it checks DOM elements before using them so pages won't crash.

(function () {
  'use strict';

  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const exists = (el) => !!el;

  // ---------- Profile (localStorage) ----------
  const PROFILE_KEY = 'lmInspectorProfile';
  const DEFAULT_PROFILE = {
    name: 'Inspector Arjun Sharma',
    userId: 'INS-2048',
    role: 'Legal Metrology Inspector',
    email: 'inspector@example.gov.in',
    photo: ''
  };

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_PROFILE, parsed);
    } catch (e) {
      console.warn('Failed to parse profile from storage', e);
      return { ...DEFAULT_PROFILE };
    }
  }

  function saveProfile(p) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      return true;
    } catch (e) {
      console.error('Failed to save profile', e);
      return false;
    }
  }

  window.LM = {
    loadProfile,
    saveProfile
  };

  // ---------- Toast (non-blocking messages) ----------
  function showToast(message, type = 'success', timeout = 4000) {
    try {
      let t = $('#toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
      }
      t.className = `toast ${type}`;
      t.textContent = message;
      t.style.opacity = '1';
      clearTimeout(t._hideTimer);
      t._hideTimer = setTimeout(() => {
        t.style.opacity = '0';
      }, timeout);
    } catch (e) {
      console.error('showToast error', e);
    }
  }
  window.showToast = showToast;

  // ---------- Password toggle ----------
  (function initPasswordToggle() {
    const toggle = $('#togglePassword');
    const pass = $('#password');
    if (!toggle || !pass) return;
    on(toggle, 'click', () => {
      const isHidden = pass.type === 'password';
      pass.type = isHidden ? 'text' : 'password';
      // Toggle icon safely
      toggle.innerHTML = isHidden ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      toggle.setAttribute('aria-pressed', String(isHidden));
    });
  })();

  // ---------- Login demo ----------
  (function initLogin() {
    const form = $('#loginForm');
    if (!form) return;
    on(form, 'submit', (ev) => {
      ev.preventDefault();
      const user = $('#userId') ? $('#userId').value.trim() : '';
      const pwd = $('#password') ? $('#password').value.trim() : '';
      if (!user || !pwd) {
        showToast('Please enter both User ID and Password', 'error');
        return;
      }
      // Demo: save name into profile and redirect to dashboard
      const p = loadProfile();
      p.userId = user;
      saveProfile(p);
      showToast('Login successful (demo). Redirecting...', 'success');
      setTimeout(() => {
        // try to redirect to dashboard or stay on same page if not present
        if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
          location.href = 'dashboard.html';
        } else {
          location.reload();
        }
      }, 600);
    });
  })();

  // ---------- SSO demo buttons ----------
  (function initSSOButtons() {
    const ssoButtons = $$('[data-sso]');
    ssoButtons.forEach(btn => on(btn, 'click', () => {
      // For demo, go to sso.html. In production, replace with real SSO flow.
      location.href = 'sso.html';
    }));
  })();

  // ---------- Mobile sidebar toggle (safe) ----------
  window.toggleMenu = function toggleMenu() {
    const s = $('#sidebar');
    const o = $('#overlay');
    if (!s) return;
    s.classList.toggle('open');
    if (o) o.classList.toggle('show');
  };
  // Close sidebar when navigation link clicked
  (function initSidebarLinks() {
    $$('.sidebar nav a').forEach(a => on(a, 'click', () => {
      $('#sidebar')?.classList.remove('open');
      $('#overlay')?.classList.remove('show');
    }));
  })();

  // ---------- Account dropdown / keyboard-accessible ----------
  (function initAccountMenu() {
    const accountBtn = $('#accountBtn');
    const accountMenu = $('#accountMenu');
    const accountWrap = accountBtn ? accountBtn.closest('.account-wrap') : null;
    if (!accountBtn || !accountMenu) return;

    function setMenu(open) {
      accountMenu.classList.toggle('show', open);
      accountWrap?.classList.toggle('open', open);
      accountBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    }

    on(accountBtn, 'click', (e) => {
      e.stopPropagation();
      setMenu(!accountMenu.classList.contains('show'));
    });

    on(accountBtn, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setMenu(!accountMenu.classList.contains('show'));
      } else if (e.key === 'Escape') {
        setMenu(false);
      }
    });

    on(accountMenu, 'click', (e) => e.stopPropagation());
    on(document, 'click', () => setMenu(false));
    on(document, 'keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  })();

  // ---------- Profile form + picture preview ----------
  (function initProfileForm() {
    const pf = $('#profileForm');
    if (!pf) return;
    const profile = loadProfile();
    ['name', 'userId', 'role', 'email'].forEach(k => {
      const el = $(`#profile_${k}`);
      if (el) el.value = profile[k] || '';
    });
    const preview = $('#profilePreview');
    const photoInput = $('#profilePhoto');

    if (photoInput && preview) {
      on(photoInput, 'change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          showToast('Please choose a valid image', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          preview.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    on(pf, 'submit', (e) => {
      e.preventDefault();
      const next = {
        name: $(`#profile_name`) ? $(`#profile_name`).value.trim() : profile.name,
        userId: $(`#profile_userId`) ? $(`#profile_userId`).value.trim() : profile.userId,
        role: $(`#profile_role`) ? $(`#profile_role`).value.trim() : profile.role,
        email: $(`#profile_email`) ? $(`#profile_email`).value.trim() : profile.email,
        photo: preview && preview.src ? preview.src : profile.photo || ''
      };
      saveProfile(next);
      showToast('Profile saved locally (demo)', 'success');
    });
  })();

  // ---------- History export / print helpers (demo) ----------
  (function initHistoryButtons() {
    const exportBtn = $('#exportHistory');
    if (exportBtn) on(exportBtn, 'click', () => {
      // Create CSV demo content
      const csv = [
        ['Inspection ID', 'Product', 'Date & Time', 'Inspector', 'Applicable Checks', 'Passed', 'Score', 'Result'],
        ['INS-2026-0091', 'Potato Chips 50g', '2026-08-24 10:02', 'INS-2048', '14', '12', '86', 'Pass']
      ].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inspection-history.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('History exported (demo).', 'success');
    });

    const printBtn = $('#printHistory');
    if (printBtn) on(printBtn, 'click', () => window.print());
  })();

  // ---------- Camera scanner with fallback ----------
  (function initCameraScanner() {
    const start = $('#startCamera');
    const capture = $('#captureBtn');
    const video = $('#camera');
    const canvas = $('#canvas');
    const errorBox = $('#cameraError');
    const retry = $('#cameraRetry');
    let stream = null;

    if (!start) return;

    function cameraError(msg) {
      if (errorBox) {
        errorBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><div><b>Camera access required</b><span>${msg}</span></div>`;
      } else {
        showToast(msg, 'error');
      }
    }

    async function requestCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraError('Camera access is not supported by this browser. Use a modern browser or pick an existing image.');
        return;
      }
      try {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
        });
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => { /* ignore autoplay policies */ });
          video.classList.add('visible');
        }
        $('#cameraPlaceholder')?.classList?.add('hidden');
        if (capture) capture.disabled = false;
        start.innerHTML = '<i class="fa-solid fa-camera"></i> Stop Camera';
        start.setAttribute('aria-pressed', 'true');
      } catch (err) {
        console.warn('Camera request failed', err);
        cameraError('Camera access was not granted. Please allow camera permission and try again.');
      }
    }

    async function stopCamera() {
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = null;
      if (video) {
        try { video.pause(); video.srcObject = null; } catch (_) { /* ignore */ }
        video.classList.remove('visible');
      }
      start.innerHTML = '<i class="fa-solid fa-camera"></i> Start Camera';
      start.setAttribute('aria-pressed', 'false');
      $('#cameraPlaceholder')?.classList?.remove('hidden');
      if (capture) capture.disabled = true;
    }

    on(start, 'click', () => {
      if (stream) stopCamera();
      else requestCamera();
    });

    on(retry, 'click', () => requestCamera());

    on(capture, 'click', async () => {
      if (!stream && !video) {
        await requestCamera();
        if (!stream) return;
      }
      if (!canvas || !video) return;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Save captured data to session storage as demo handoff
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        sessionStorage.setItem('capturedPhoto', dataUrl);
        sessionStorage.setItem('productScanned', 'true');
        showToast('Photo captured. Proceeding to processing...', 'success');
        setTimeout(() => location.href = 'processing.html', 400);
      } catch (e) {
        showToast('Capture failed: ' + e.message, 'error');
      }
    });

    // file input fallback
    on($('#fileInput'), 'change', (e) => {
      if (e.target.files?.length) {
        sessionStorage.setItem('productScanned', 'true');
        showToast('Image selected. Proceeding to processing...', 'success');
        setTimeout(() => location.href = 'processing.html', 250);
      }
    });

  })();

  // ---------- Top workflow progress bar highlight ----------
  (function highlightWorkflow() {
    try {
      const file = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
      const map = {
        'scan.html': 'scan',
        'processing.html': 'extraction',
        'extraction.html': 'extraction',
        'verification.html': 'verification',
        'result.html': 'result',
        'report.html': 'report',
        'dashboard.html': 'dashboard'
      };
      const key = map[file] || null;
      if (!key) return;
      $$('.workflow .step').forEach(s => s.classList.remove('active'));
      const el = $(`.workflow .step[data-step="${key}"]`);
      if (el) el.classList.add('active');
    } catch (e) {
      // don't crash if markup missing
    }
  })();

  // ---------- Universal click ripple animation ----------
  (function initRipple() {
    const selector = '.btn, .icon-button, .menu-btn, .logout, .sidebar nav a, .user-chip, .workflow a';
    document.addEventListener('click', function (e) {
      try {
        const el = e.target.closest(selector);
        if (!el || el.disabled) return;
        el.classList.remove('clicked');
        // force reflow
        void el.offsetWidth;
        el.classList.add('clicked');
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 0.75;
        const x = e.clientX ? e.clientX - rect.left - size / 2 : rect.width / 2 - size / 2;
        const y = e.clientY ? e.clientY - rect.top - size / 2 : rect.height / 2 - size / 2;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
        setTimeout(() => el.classList.remove('clicked'), 300);
      } catch (ex) { /* ignore ripple errors */ }
    }, { passive: true });
  })();

  // End of script
})();
