// ملف مساعدات EduBridge المشترك: التنقل، الإشعارات، الأيقونات، والتفاعلات.
(function () {
  "use strict";

  // ========= تحميل مكتبة Lucide Icons من CDN
  function loadLucide(cb) {
    if (window.lucide) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@1.50.0/dist/umd/lucide.min.js';
    s.onload = function () { try { cb(); } catch (e) {} };
    s.onerror = function () { setTimeout(function () { loadLucide(cb); }, 800); };
    document.head.appendChild(s);
  }

  function refreshIcons() {
    try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); }
    catch (e) {}
  }

  // النص الإنجليزي الأصلي للزر (يحفظه i18n.js قبل الترجمة)
  function enText(el) { return (el.getAttribute('data-en') || el.textContent).trim(); }

  // ========= إشعارات Toast عالمية
  var _toastTimer = null;
  window.eduToast = function eduToast(message) {
    var t = document.getElementById('eduToast');
    if (!t) { t = document.createElement('div'); t.id = 'eduToast'; t.className = 'edu-toast'; document.body.appendChild(t); }
    t.textContent = message || '';
    t.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2300);
  };

  // ========= تبديل قائمة الروابط العامة
  function publicNavInit() {
    var menu = document.querySelector('.nav-menu');
    var links = document.querySelector('.public-links');
    if (menu && links) {
      menu.addEventListener('click', function () { links.classList.toggle('open'); });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); });
      });
    }
  }

  // ========= الشريط الجانبي للبوابات (فتح / إغلاق
  function portalSidebarInit() {
    var sidebar = document.querySelector('.portal-sidebar');
    var mobileMenu = document.querySelector('.mobile-menu');
    var sidebarClose = document.querySelector('.sidebar-close');
    var menuOverlay = document.querySelector('.menu-overlay');
    function open() { if (sidebar) sidebar.classList.add('open'); if (menuOverlay) menuOverlay.style.display = 'block'; }
    function close() { if (sidebar) sidebar.classList.remove('open'); if (menuOverlay) menuOverlay.style.display = 'none'; }
    if (mobileMenu) mobileMenu.addEventListener('click', open);
    if (sidebarClose) sidebarClose.addEventListener('click', close);
    if (menuOverlay) menuOverlay.addEventListener('click', close);
  }

  // ========= تحديد الرابط النشط في الشريط الجانبي
  function setActiveSidebarLink() {
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.portal-sidebar .side-link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();
      if (!href) return;
      var hrefFile = href.split('/').pop() || '';
      link.classList.remove('active');
      if (hrefFile === path) link.classList.add('active');
    });
  }

  // ========= نظام المصادقة الجديد: صفحة auth.html مستقلة عن index.html =========
  function authTabsInit() {
    var homeView = document.getElementById('home-view');
    var authPage = document.getElementById('signin-view');
    var currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var onAuthPage = (currentFile === 'auth.html') && !!authPage;

    // ---------- CASE 1: نحن في صفحة index.html (لا يوجد auth-page هنا) ----------
    // كل أزرار [data-auth-open] → الانتقال إلى صفحة auth.html مع ?view=...
    if (!authPage) {
      document.querySelectorAll('[data-auth-open]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
          if (ev.preventDefault) ev.preventDefault();
          var view = btn.getAttribute('data-auth-open') || 'signin';
          location.href = 'auth.html?view=' + encodeURIComponent(view);
          return false;
        });
      });
      return;
    }

    // ---------- CASE 2: نحن في صفحة auth.html المستقلة ----------
    // صفحة auth-page هنا دائماً ظاهرة (display:grid) — لا حاجة للتبديل مع home-view
    authPage.style.display = 'grid';
    // (إزالة أي inline style تمنع العرض مثل style="display:none;")
    authPage.removeAttribute('style');

    var views = {
      signin: document.getElementById('auth-signin'),
      register: document.getElementById('auth-register'),
      forgot: document.getElementById('auth-forgot')
    };
    var tabBars = document.querySelectorAll('.auth-tab-bar');
    var ssoGoogle = document.getElementById('sso-google-modal');
    var ssoApple = document.getElementById('sso-apple-modal');

    // ------- قراءة ?view= من الـ URL لفتح العرض المطلوب مباشرة -------
    function getInitialView() {
      try {
        var q = new URLSearchParams(location.search);
        var v = (q.get('view') || q.get('tab') || 'signin').toLowerCase();
        if (v === 'signup' || v === 'create' || v === 'register') return 'register';
        if (v === 'forgot' || v === 'reset') return 'forgot';
        return 'signin';
      } catch (e) { return 'signin'; }
    }

    // ------- إغلاق صفحة المصادقة (X / Back to home) → العودة إلى index.html -------
    function closeAuth() {
      closeAllSso();
      // إعادة تعيين سكرول جميع الحاويات قبل المغادرة
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      var am = authPage.querySelector('.auth-main'); if (am) am.scrollTop = 0;
      var fw = document.querySelector('.register-form-wrap'); if (fw) fw.scrollTop = 0;
      var sw = document.querySelector('.register-stepper-wrap'); if (sw) sw.scrollTop = 0;
      var avc = document.querySelectorAll('.auth-view-content');
      avc.forEach(function (el) { el.scrollTop = 0; });
      // التوجيه للصفحة الرئيسية
      location.href = 'index.html';
    }

    // ------- فتح وإغلاق نوافذ SSO المنبثقة -------
    function openSsoPopup(name) {
      var m = name === 'google' ? ssoGoogle : ssoApple;
      if (m) m.classList.add('sso-show');
    }
    function closeSsoPopup(name) {
      var m = name === 'google' ? ssoGoogle : (name === 'apple' ? ssoApple : null);
      if (m) m.classList.remove('sso-show');
    }
    function closeAllSso() {
      if (ssoGoogle) ssoGoogle.classList.remove('sso-show');
      if (ssoApple) ssoApple.classList.remove('sso-show');
    }
    function anySsoOpen() {
      return (ssoGoogle && ssoGoogle.classList.contains('sso-show')) ||
             (ssoApple && ssoApple.classList.contains('sso-show'));
    }

    // ------- تبديل الـ views الرئيسية (Sign In / Register / Forgot) -------
    function switchView(viewName) {
      Object.keys(views).forEach(function (k) {
        if (views[k]) views[k].classList.toggle('hidden-view', k !== viewName);
      });
      tabBars.forEach(function (bar) {
        bar.querySelectorAll('button').forEach(function (btn) {
          btn.classList.toggle('active', btn.getAttribute('data-auth-view') === viewName);
        });
      });
      if (viewName === 'register') setRegStep(1);
      if (viewName === 'forgot') setForgotStep(1);
      var main = authPage.querySelector('.auth-main');
      if (main) main.scrollTop = 0;
      // تحديث ?view= في الـ URL (بدون إعادة تحميل الصفحة)
      try {
        var q2 = new URLSearchParams(location.search);
        q2.set('view', viewName);
        history.replaceState(null, '', 'auth.html?' + q2.toString());
      } catch (e) {}
    }

    // ------- Register — تنقل الـ Stepper الأفقي (5 خطوات) -------
    function setRegStep(n) {
      var steps = document.querySelectorAll('#reg-stepper .reg-step');
      var panels = {
        1: document.getElementById('reg-step-1'),
        2: document.getElementById('reg-step-2'),
        3: document.getElementById('reg-step-3'),
        4: document.getElementById('reg-step-4'),
        5: document.getElementById('reg-step-5')
      };
      steps.forEach(function (s) {
        var idx = parseInt(s.getAttribute('data-reg-step'), 10);
        s.classList.remove('active', 'done');
        if (idx < n) { s.classList.add('done');
          var bub = s.querySelector('.reg-step-bubble');
          if (bub && !bub.querySelector('svg')) bub.innerHTML = '<i data-lucide="Check"></i>';
        }
        if (idx === n) s.classList.add('active');
      });
      Object.keys(panels).forEach(function (k) {
        if (panels[k]) panels[k].classList.toggle('hidden-view', parseInt(k, 10) !== n);
      });
      if (window.refreshIcons) window.refreshIcons();
      // السكرول: (1) النموذج للأعلى دائمًا، (2) سكرول أفقي للـ stepper ليظهر الخطوة النشطة في المنتصف
      var main = authPage.querySelector('.auth-main');
      if (main) main.scrollTop = 0;
      var formWrap = document.querySelector('.register-form-wrap');
      if (formWrap) formWrap.scrollTop = 0;
      var stepperWrap = document.querySelector('.register-stepper-wrap');
      var activeStep = document.querySelector('#reg-stepper .reg-step[data-reg-step="' + n + '"]');
      if (stepperWrap && activeStep) {
        var wrapRect = stepperWrap.getBoundingClientRect();
        var stepRect = activeStep.getBoundingClientRect();
        var deltaX = (stepRect.left + stepRect.width / 2) - (wrapRect.left + wrapRect.width / 2);
        if (Math.abs(deltaX) > 8) {
          try {
            stepperWrap.scrollBy({ left: deltaX, behavior: 'smooth' });
          } catch (e) {
            stepperWrap.scrollLeft += deltaX;
          }
        }
      }
    }

    // ------- Register — مقياس قوة كلمة المرور -------
    var pass = document.getElementById('reg-pass1');
    var passStrength = document.getElementById('passStrength');
    var passStrengthText = document.getElementById('passStrengthText');
    function computeStrength(v) {
      var s = 0;
      if (!v) return 0;
      if (v.length >= 8) s++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      return Math.min(4, s);
    }
    function updateStrengthUI() {
      if (!pass || !passStrength) return;
      var lv = computeStrength(pass.value);
      passStrength.setAttribute('data-strength', lv);
      if (passStrengthText) {
        var msgs = ['Use 8+ chars with a mix of letters, numbers & symbols.',
                    'Weak — add variety (letters + numbers).',
                    'Fair — try adding symbols or uppercase.',
                    'Good — almost there!',
                    'Strong password 👏'];
        passStrengthText.textContent = msgs[lv];
      }
    }
    if (pass) pass.addEventListener('input', updateStrengthUI);

    // ------- Forgot Password — 4 مراحل (email / code / new-pass / success) -------
    function setForgotStep(n) {
      var idMap = { 1: 'forgot-1', 2: 'forgot-2', 3: 'forgot-3', success: 'forgot-success' };
      Object.keys(idMap).forEach(function (k) {
        var el = document.getElementById(idMap[k]);
        if (el) el.classList.toggle('hidden-view', String(k) !== String(n));
      });
      if (String(n) === '2') startResendCountdown();
      if (String(n) === '2') {
        var emailInput = document.getElementById('forgotEmail');
        var sentTo = document.getElementById('sentToEmail');
        if (sentTo && emailInput && emailInput.value) sentTo.textContent = emailInput.value;
      }
      if (window.refreshIcons) window.refreshIcons();
      var main = authPage.querySelector('.auth-main');
      if (main) main.scrollTop = 0;
      var formWrap = document.querySelector('.register-form-wrap');
      if (formWrap) formWrap.scrollTop = 0;
      var stepperWrap = document.querySelector('.register-stepper-wrap');
      if (stepperWrap) stepperWrap.scrollTop = 0;
    }
    var resendTimer = null;
    function startResendCountdown() {
      var time = 45;
      var label = document.getElementById('resendIn');
      var btn = document.getElementById('resendBtn');
      if (btn) btn.disabled = true;
      function tick() {
        if (label) label.textContent = Math.floor(time / 60) + ':' + (time % 60 < 10 ? '0' : '') + time % 60;
        time--;
        if (time < 0) { if (resendTimer) clearInterval(resendTimer); if (btn) btn.disabled = false; if (label) label.textContent = '0:00'; }
      }
      if (resendTimer) clearInterval(resendTimer);
      tick();
      resendTimer = setInterval(tick, 1000);
    }
    var codeInputs = document.querySelectorAll('.code-inputs input');
    codeInputs.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
        if (inp.value && codeInputs[i + 1]) codeInputs[i + 1].focus();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && codeInputs[i - 1]) codeInputs[i - 1].focus();
      });
    });

    // ------- تعريف جميع معالجات الأزرار -------
    function bindHandlers() {
      // (1) أزرار فتح صفحة المصادقة من أي مكان في الصفحة (باقية للتوافق)
      document.querySelectorAll('[data-auth-open]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
          if (ev.preventDefault) ev.preventDefault();
          var v = btn.getAttribute('data-auth-open') || 'signin';
          location.href = 'auth.html?view=' + encodeURIComponent(v);
          return false;
        });
      });
      // (2) أزرار الإغلاق (X / Back to home)
      document.querySelectorAll('[data-auth-close]').forEach(function (c) {
        c.addEventListener('click', function (ev) { if (ev.preventDefault) ev.preventDefault(); closeAuth(); return false; });
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') {
          if (anySsoOpen()) closeAllSso();
        }
      });

      // (3) علامات التبويب + data-auth-view
      authPage.querySelectorAll('[data-auth-view]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          switchView(btn.getAttribute('data-auth-view'));
        });
      });

      // (4) Register — أزرار التالي / السابق
      authPage.querySelectorAll('[data-reg-next]').forEach(function (b) {
        b.addEventListener('click', function () { setRegStep(parseInt(b.getAttribute('data-reg-next'), 10)); });
      });
      authPage.querySelectorAll('[data-reg-prev]').forEach(function (b) {
        b.addEventListener('click', function () { setRegStep(parseInt(b.getAttribute('data-reg-prev'), 10)); });
      });
      authPage.querySelectorAll('[data-reg-finish]').forEach(function (b) {
        b.addEventListener('click', function () {
          window.eduToast('Account created! Welcome to EduBridge — preparing your dashboard…');
          setTimeout(function () { location.href = 'student/dashboard.html'; }, 900);
        });
      });

      // (5) Sign In — submit button
      authPage.querySelectorAll('[data-signin-submit]').forEach(function (b) {
        b.addEventListener('click', function () {
          window.eduToast('Signing in… Welcome back!');
          setTimeout(function () { location.href = 'student/dashboard.html'; }, 900);
        });
      });

      // (6) أزرار Google / Apple → تفتح نافذة SSO المنبثقة
      authPage.querySelectorAll('[data-social]').forEach(function (b) {
        b.addEventListener('click', function () {
          var s = b.getAttribute('data-social');
          openSsoPopup(s);
        });
      });

      // (7) إغلاق نوافذ SSO (X / backdrop)
      [ssoGoogle, ssoApple].forEach(function (overlay) {
        if (!overlay) return;
        overlay.querySelectorAll('[data-sso-close]').forEach(function (c) {
          c.addEventListener('click', function () {
            var n = overlay.getAttribute('data-sso-overlay');
            closeSsoPopup(n);
          });
        });
        overlay.addEventListener('click', function (ev) {
          if (ev.target === overlay) {
            var n = overlay.getAttribute('data-sso-overlay');
            closeSsoPopup(n);
          }
        });
      });

      // (8) اختيار حساب داخل نافذة SSO → إغلاق + إشعار + إعادة توجيه
      document.querySelectorAll('[data-sso-pick]').forEach(function (b) {
        b.addEventListener('click', function () {
          var pick = b.getAttribute('data-sso-pick') || 'SSO';
          closeAllSso();
          window.eduToast('Continuing with ' + pick + '…');
          setTimeout(function () { location.href = 'student/dashboard.html'; }, 900);
        });
      });

      // (9) Forgot Password — navigation
      authPage.querySelectorAll('[data-forgot-next]').forEach(function (b) {
        b.addEventListener('click', function () { setForgotStep(b.getAttribute('data-forgot-next')); });
      });
      authPage.querySelectorAll('[data-forgot-back]').forEach(function (b) {
        b.addEventListener('click', function () { setForgotStep(b.getAttribute('data-forgot-back')); });
      });
      authPage.querySelectorAll('[data-forgot-finish]').forEach(function (b) {
        b.addEventListener('click', function () {
          window.eduToast('Signed in with your new password — heading to dashboard…');
          setTimeout(function () { location.href = 'student/dashboard.html'; }, 900);
        });
      });
      authPage.querySelectorAll('[data-resend]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.disabled) return;
          window.eduToast('A new reset code was sent to your email.');
          startResendCountdown();
        });
      });

      // (10) Demo portals (Employee / Admin)
      authPage.querySelectorAll('.auth-demo button').forEach(function (b) {
        b.addEventListener('click', function () {
          var txt = enText(b);
          if (txt.indexOf('Employee') !== -1) location.href = 'employee/dashboard.html';
          else if (txt.indexOf('Admin') !== -1) location.href = 'admin/dashboard.html';
        });
      });
    }

    bindHandlers();
    updateStrengthUI();
    // عند تحميل صفحة auth.html → فتح العرض المطلوب من الـ URL
    switchView(getInitialView());
  }

  // ========= اختيار خدمة في صفحة طلب الخدمة
  function serviceChoiceInit() {
    document.querySelectorAll('.service-choice-grid button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.service-choice-grid button').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        var title = btn.querySelector('strong') ? btn.querySelector('strong').textContent : 'Service';
        window.eduToast('Selected: ' + title);
      });
    });
  }

  // ========= فلاتر المنح الدراسية (عرض توضيحي
  function scholarshipFilterInit() {
    var apply = document.querySelector('.filter-row .edu-btn.gold');
    if (apply) apply.addEventListener('click', function () { window.eduToast('Filters applied to your scholarship list.'); });
    var sortSelect = document.querySelector('.results-head select');
    if (sortSelect) sortSelect.addEventListener('change', function () { window.eduToast('Sorted by: ' + sortSelect.value); });
  }

  // ========= مرسل الرسائل في مساحة التطبيق
  function messageComposerInit() {
    var input = document.querySelector('.message-composer input');
    var sendBtn = document.querySelector('.message-composer .edu-btn');
    var messages = document.querySelector('.messages');
    function appendMine(text) {
      if (!messages) return;
      var wrap = document.createElement('div');
      wrap.className = 'message mine';
      wrap.innerHTML = '<span class="message-avatar">S</span><div><p></p><small>Just now</small></div>';
      wrap.querySelector('p').textContent = text;
      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
    }
    if (input) {
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && input.value.trim()) {
        appendMine(input.value.trim());
        input.value = '';
        }
      });
    }
    if (sendBtn) sendBtn.addEventListener('click', function () {
      if (input && input.value.trim()) {
        appendMine(input.value.trim());
        input.value = '';
      }
    });
  }

  // ========= ملاحظات رفع الملفات
  function fileUploadInit() {
    document.querySelectorAll('input[type="file"]').forEach(function (inp) {
      inp.addEventListener('change', function (ev) {
        var files = Array.from(ev.target.files || []);
        if (!files.length) return;
        var names = files.map(function (f) { return f.name; }).join(', ');
        window.eduToast(names + ' ready for review.');
        var confirm = document.querySelector('.upload-confirm');
        if (confirm) confirm.style.display = 'block';
      });
    });
    var attach = document.querySelector('.message-composer > button');
    if (attach) attach.addEventListener('click', function () { window.eduToast('Attachment picker would open here.'); });
  }

  // ========= علامات تبويب الموظفين والطلاب
  function tabsInit(selector) {
    document.querySelectorAll(selector).forEach(function (row) {
      row.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          row.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });
    });
  }

  // ========= زر حفظ الملف الشخصي + إشعار
  function profileSaveInit() {
    var save = document.querySelector('.portal-title-row .edu-btn.gold');
    if (save) save.addEventListener('click', function () { window.eduToast('Your profile changes have been saved locally in this frontend demo.'); });
  }

  // ========= زرار إضافة مستخدم + أزرار ذكية عامة
  function miscButtonsInit() {
    document.querySelectorAll('.title-buttons .edu-btn.gold').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var txt = enText(btn);
        if (txt.indexOf('Add User') !== -1) window.eduToast('A demo invitation was added to the user list.');
        else if (txt.indexOf('Publish') !== -1) window.eduToast('Scholarship published for eligible students.');
        else if (txt.indexOf('Add Scholarship') !== -1) window.eduToast('A new scholarship editor is open in this frontend demo.');
      });
    });
    document.querySelectorAll('.title-buttons .edu-btn.outline, .users-filter .edu-btn.outline').forEach(function (btn) {
      btn.addEventListener('click', function () { window.eduToast('Export prepared in this frontend demonstration.'); });
    });
  }

  // ========= عند اكتمال تحميل DOM
  document.addEventListener('DOMContentLoaded', function () {
    loadLucide(function () { refreshIcons(); });
    publicNavInit();
    portalSidebarInit();
    setActiveSidebarLink();
    authTabsInit();
    serviceChoiceInit();
    scholarshipFilterInit();
    messageComposerInit();
    fileUploadInit();
    tabsInit('.tab-row');
    tabsInit('.summary-menu');
    profileSaveInit();
    miscButtonsInit();
  });
})();
