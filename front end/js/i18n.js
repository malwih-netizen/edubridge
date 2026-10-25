// نظام الترجمة EduBridge: تبديل العربية / الإنجليزية + اتجاه RTL.
// يُحمَّل في <head> بعد i18n-ar.js حتى يُضبط الاتجاه قبل رسم الصفحة.
// القاموس مفاتيحه النص الإنجليزي الأصلي، فلا حاجة لتعديل نصوص الـ HTML.
(function () {
  "use strict";

  var STORAGE_KEY = 'edu-lang';
  var DICT = window.EDU_I18N_AR || {};
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, svg: 1, SVG: 1 };

  // ========= تحديد اللغة: ?lang= ثم التخزين المحلي ثم الإنجليزية
  function readLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'ar' || q === 'en') { saveLang(q); return q; }
    } catch (e) {}
    try { var s = localStorage.getItem(STORAGE_KEY); if (s === 'ar' || s === 'en') return s; } catch (e) {}
    return 'en';
  }
  function saveLang(l) { try { localStorage.setItem(STORAGE_KEY, l); } catch (e) {} }

  var lang = readLang();
  var isAr = lang === 'ar';
  var root = document.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('dir', isAr ? 'rtl' : 'ltr');

  // إخفاء مؤقت لمنع ظهور النص الإنجليزي قبل الترجمة
  if (isAr) {
    root.classList.add('i18n-pending');
    setTimeout(function () { root.classList.remove('i18n-pending'); }, 1500);
  }

  // ========= أنماط للنصوص الديناميكية (رسائل فيها متغيرات)
  var PATTERNS = [
    [/^(\d+) opportunities found$/, function (m) { return 'تم العثور على ' + m[1] + ' فرصة'; }],
    [/^(.+) is ready for review\.$/, function (m) { return m[1] + ' جاهز للمراجعة.'; }],
    [/^(.+) ready for review\.$/, function (m) { return m[1] + ' جاهزة للمراجعة.'; }],
    [/^Selected: (.+)$/, function (m) { return 'تم اختيار: ' + tr(m[1]); }],
    [/^Sorted by: (.+)$/, function (m) { return 'الترتيب حسب: ' + tr(m[1]); }],
    [/^Continuing with (.+)…$/, function (m) { return 'جارٍ المتابعة باستخدام ' + tr(m[1]) + '…'; }]
  ];

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  // ترجمة نص واحد؛ يعيد النص كما هو إن لم يوجد له مقابل
  function tr(text) {
    if (!isAr || !text) return text;
    var key = norm(text);
    if (!key) return text;
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = key.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1](m);
    }
    return text;
  }
  window.eduT = tr;

  // ========= ترجمة عقدة نصية مع الحفاظ على المسافات المحيطة
  function translateText(node) {
    var v = node.nodeValue;
    if (!v || !/[A-Za-z]/.test(v)) return;
    var out = tr(v);
    if (out === v) return;
    var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    node.nodeValue = lead + out + trail;
  }

  function translateEl(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a && /[A-Za-z]/.test(a)) { var t = tr(a); if (t !== a) el.setAttribute(ATTRS[i], t); }
    }
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && el.value) el.value = tr(el.value);
    // نحفظ النص الإنجليزي للأزرار لأن app.js يميّزها بنصها
    if (el.tagName === 'BUTTON' && !el.hasAttribute('data-en')) el.setAttribute('data-en', norm(el.textContent));
    // الخيارات بدون value: نثبّت القيمة الإنجليزية حتى لا تتعطل الفلاتر
    if (el.tagName === 'OPTION' && !el.hasAttribute('value')) el.setAttribute('value', norm(el.textContent));
  }

  function walk(rootNode) {
    if (!rootNode) return;
    if (rootNode.nodeType === 3) { if (!skipped(rootNode.parentNode)) translateText(rootNode); return; }
    if (rootNode.nodeType !== 1 || skipped(rootNode)) return;
    translateEl(rootNode);
    var tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) return SKIP_TAGS[n.tagName] || n.hasAttribute('data-no-i18n') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) translateText(n); else translateEl(n);
    }
  }

  function skipped(el) {
    for (var p = el; p && p.nodeType === 1; p = p.parentNode) {
      if (SKIP_TAGS[p.tagName] || p.hasAttribute('data-no-i18n')) return true;
    }
    return false;
  }

  // ========= زر تبديل اللغة
  function injectToggle() {
    if (document.querySelector('.lang-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.setAttribute('data-no-i18n', '');
    btn.setAttribute('aria-label', isAr ? 'Switch to English' : 'التبديل إلى العربية');
    btn.innerHTML = '<span class="lang-toggle-globe" aria-hidden="true">🌐</span><span>' + (isAr ? 'English' : 'العربية') + '</span>';
    btn.addEventListener('click', function () {
      saveLang(isAr ? 'en' : 'ar');
      try {
        var u = new URL(location.href);
        u.searchParams.delete('lang');
        location.replace(u.toString());
      } catch (e) { location.reload(); }
    });

    var host = document.querySelector('.public-nav-actions') ||
               document.querySelector('.portal-header .header-actions');
    if (host) {
      var bell = host.querySelector('.notification-btn');
      host.insertBefore(btn, bell || host.firstChild);
    } else {
      btn.classList.add('lang-toggle-floating');
      document.body.appendChild(btn);
    }
  }

  // ========= التشغيل
  function run() {
    injectToggle();
    if (isAr) {
      document.title = tr(document.title);
      walk(document.body);
      // ترجمة أي محتوى يُضاف لاحقاً (رسائل Toast، رسائل المحادثة، خطوات النماذج…)
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          if (m.type === 'characterData') { if (!skipped(m.target.parentNode)) translateText(m.target); }
          else if (m.type === 'attributes') translateEl(m.target);
          else m.addedNodes.forEach(walk);
        });
      }).observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
    }
    root.classList.remove('i18n-pending');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
