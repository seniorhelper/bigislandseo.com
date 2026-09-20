/* Big Island SEO — shared contact + form script */
(function () {
  'use strict';

  /* After FormSubmit activation you can paste your private form key here
     (the random-string endpoint FormSubmit emails you). Leave '' to use the default. */
  var FORM_KEY = '';

  var AT = String.fromCharCode(64);
  var DEF = ['aW5mbw==', 'ZXlldG9hZA==', 'LmNvbQ=='];

  function d(s) { try { return window.atob(s || ''); } catch (e) { return ''; } }
  function addr(el) {
    var u = el && el.getAttribute('data-u'), h = el && el.getAttribute('data-h'), t = el && el.getAttribute('data-t');
    if (!u || !h || !t) { u = DEF[0]; h = DEF[1]; t = DEF[2]; }
    return d(u) + AT + d(h) + d(t);
  }
  var MAIN = addr(null);

  /* ---------- Email links ---------- */
  function wireEmails() {
    var links = document.querySelectorAll('.js-eml');
    for (var i = 0; i < links.length; i++) {
      var a = links[i], m = addr(a);
      a.setAttribute('href', 'mailto:' + m);
      var t = a.querySelector('.eml-t');
      if (t && !a.hasAttribute('data-keep-text')) t.textContent = m;
    }
  }

  /* ---------- Forms ---------- */
  var SPAM_WORDS = 'viagra, cialis, casino, porn, escort, crypto investment, bitcoin investment, forex signals, payday loan';

  function endpoint() {
    return 'https://formsubmit.co/ajax/' + (FORM_KEY || MAIN);
  }

  function countLinks(s) {
    var m = (s || '').match(/(https?:\/\/|www\.)/gi);
    return m ? m.length : 0;
  }

  function wireForm(form) {
    var t0 = Date.now();
    var engaged = false;
    var busy = false;
    var btn = form.querySelector('[type="submit"]');
    var btnLabel = btn ? btn.textContent : '';
    var status = form.querySelector('.form-status');

    function mark() { engaged = true; }
    form.addEventListener('keydown', mark, { passive: true });
    form.addEventListener('pointerdown', mark, { passive: true });
    form.addEventListener('touchstart', mark, { passive: true });
    form.addEventListener('input', mark, { passive: true });

    var fields = form.querySelectorAll('input, textarea');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.name === '_honey') continue;
      if (!f.hasAttribute('maxlength')) f.setAttribute('maxlength', f.tagName === 'TEXTAREA' ? '3000' : '160');
    }

    function say(kind, msg) {
      if (!status) return;
      status.className = 'form-status show ' + kind;
      status.textContent = msg;
    }
    function done(label) {
      if (btn) { btn.disabled = true; btn.textContent = label; }
    }
    function reset() {
      busy = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Try again'; }
    }
    function quietOk() {
      form.reset();
      say('ok', 'Thanks. Your request is in.');
      done('Sent');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      var hp = form.querySelector('[name="_honey"]');
      if (hp && hp.value !== '') { quietOk(); return; }
      if (!engaged) { quietOk(); return; }

      if (Date.now() - t0 < 4000) {
        say('warn', 'That went a little too fast. Give it a moment, then send again.');
        return;
      }

      var nameEl = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      var msgEl = form.querySelector('[name="message"]');
      var name = nameEl ? nameEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var msg = msgEl ? msgEl.value.trim() : '';

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        say('warn', 'Add your name and a valid email so we can send your audit back.');
        (name ? emailEl : nameEl).focus();
        return;
      }
      if (countLinks(msg) > 2) {
        say('warn', 'Please keep links to two or fewer, or just tell us your website in the Website field.');
        return;
      }
      try {
        var last = parseInt(window.localStorage.getItem('bis_last_send') || '0', 10);
        if (last && Date.now() - last < 60000) {
          say('warn', 'We just received a request from this browser. If you need to add something, call 1-800-481-8638.');
          return;
        }
      } catch (err) {}

      var payload = {
        _subject: form.getAttribute('data-subject') || 'Big Island SEO - Website Inquiry',
        _template: 'table',
        _captcha: 'false',
        _blacklist: SPAM_WORDS
      };
      var els = form.elements;
      for (var j = 0; j < els.length; j++) {
        var el = els[j];
        if (!el.name || el.name === '_honey' || el.type === 'submit') continue;
        payload[el.name] = String(el.value || '').trim().slice(0, 3000);
      }
      payload.page = window.location.pathname;
      payload.source = form.getAttribute('data-source') || ('bigislandseo.com' + window.location.pathname);

      busy = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      if (status) status.className = 'form-status';

      fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return { success: res.ok ? 'true' : 'false' }; })
          .then(function (data) { return { ok: res.ok, data: data || {} }; });
      }).then(function (r) {
        var success = r.ok && (r.data.success === true || r.data.success === 'true');
        if (success) {
          try { window.localStorage.setItem('bis_last_send', String(Date.now())); } catch (err) {}
          form.reset();
          say('ok', 'Sent. We reply within one business day. If it is urgent, call 1-800-481-8638.');
          done('Request sent');
        } else {
          say('warn', 'We could not confirm that arrived. Please email ' + MAIN + ' or call 1-800-481-8638 so nothing gets lost.');
          reset();
        }
      }).catch(function () {
        say('err', 'That did not send, most likely a connection problem. Please email ' + MAIN + ' or call 1-800-481-8638.');
        reset();
      });
    });
  }

  function init() {
    wireEmails();
    var forms = document.querySelectorAll('form.bis-form');
    for (var i = 0; i < forms.length; i++) wireForm(forms[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
