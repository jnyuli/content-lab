/* Club Stylist Content Lab — edition renderer.
   Expects window.EDITION (injected by build.py). Member state (picked ideas, checklist ticks)
   lives in their own browser's localStorage. Original-post previews use the platforms' official
   embed scripts and load only when a member asks for them. */
(function () {
  var E = window.EDITION; if (!E) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var key = 'lab:' + E.slug;
  var store = { get: function () { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; } }, set: function (v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } } };
  var state = store.get(); state.picked = state.picked || []; state.ticks = state.ticks || {};

  var AUD = { clients: 'For clients', stylists: 'For stylists', both: 'Clients + stylists' };
  var CAM = { 'no-face': 'No face', 'hands': 'Hands only', 'voiceover': 'Voiceover', 'on-camera': 'On camera' };
  var EFF = { low: 'Low effort', medium: 'Medium effort', high: 'Bigger project' };

  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1400); }
  function copy(text, btn) {
    var done = function () { toast('Copied'); if (btn) { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1200); } };
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select and copy manually'); } document.body.removeChild(ta); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else { fallback(); }
  }
  function kindLabel(k) { return { verified: 'Verified', observed: 'Observed pattern', hypothesis: 'Informed hypothesis', experiment: 'Creative experiment' }[k] || ''; }
  function list(items, ol) { if (!items || !items.length) return ''; return '<' + (ol ? 'ol' : 'ul') + '>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</' + (ol ? 'ol' : 'ul') + '>'; }
  function linkList(links) { if (!links || !links.length) return ''; return '<div class="links">' + links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>'; }).join('') + '</div>'; }

  /* header */
  $('#week').textContent = E.week_label; $('#title').textContent = E.title; $('#lede').textContent = E.lede || '';
  if (E.spotlight) { $('#spot').innerHTML = 'Spotlight: <span>' + esc(E.spotlight) + '</span>'; } else { $('#spot').hidden = true; }

  /* radar: three concise insights, the rest and the detail behind a toggle */
  var radar = E.radar || [];
  $('#radar').innerHTML = radar.map(function (r, i) {
    return '<article' + (i >= 3 ? ' class="extra" hidden' : '') + '><h4>' + esc(r.headline) + (r.kind ? '<span class="kind">' + kindLabel(r.kind) + '</span>' : '') + '</h4>' +
      '<p class="short">' + esc(r.short || r.detail) + '</p>' +
      '<div class="more" hidden><p>' + esc(r.detail) + '</p>' + linkList(r.links) + '</div>' +
      '<button class="linkbtn radar-more" aria-expanded="false">Evidence</button></article>';
  }).join('');
  if (radar.length > 3) { var mb = $('#radar-toggle'); mb.hidden = false; mb.textContent = 'Show ' + (radar.length - 3) + ' more'; mb.addEventListener('click', function () { var open = mb.getAttribute('aria-expanded') === 'true'; $$('#radar .extra').forEach(function (a) { a.hidden = open; }); mb.setAttribute('aria-expanded', open ? 'false' : 'true'); mb.textContent = open ? 'Show ' + (radar.length - 3) + ' more' : 'Show fewer'; }); }
  $$('.radar-more').forEach(function (b) { b.addEventListener('click', function () { var m = $('.more', b.closest('article')), open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'Hide evidence' : 'Evidence'; }); });

  /* ideas */
  var ideas = E.ideas || [];
  function card(i, n) {
    var picked = state.picked.indexOf(i.id) > -1;
    var cam = (i.camera || []).map(function (c) { return CAM[c] || c; }).join(' · ');
    var hooks = (i.hooks || []).map(function (h) { return '<div class="hook"><em>' + esc(h) + '</em><button class="btn small" data-copy="' + esc(h) + '">Copy</button></div>'; }).join('');
    var film = i.film || {};
    var insp = (i.inspiration || []).map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>' + (s.note ? ' — ' + esc(s.note) : '') + '</li>'; }).join('');
    var tp = (i.talking_points || []);
    return '<article class="idea" id="idea-' + esc(i.id) + '" data-aud="' + esc(i.audience) + '" data-cam="' + esc((i.camera || []).join(' ')) + '" data-eff="' + esc(i.effort) + '">' +
      '<div class="top"><span class="num">' + n + '</span><h3>' + esc(i.title) + '</h3></div>' +
      '<div class="tags"><span class="tag aud">' + esc(AUD[i.audience] || i.audience) + '</span><span class="tag eff-' + esc(i.effort) + '">' + esc(EFF[i.effort] || i.effort) + '</span></div>' +
      '<p class="hookprev">“' + esc(i.hook_preview || (i.hooks && i.hooks[0]) || '') + '”</p>' +
      '<p>' + esc(i.summary) + '</p>' +
      '<p class="meta">' + esc([i.format, cam, i.specialty].filter(Boolean).join(' · ')) + '</p>' +
      '<div class="actions"><button class="btn card-toggle" aria-expanded="false">Full guide</button><label class="pick"><input type="checkbox" data-pick="' + esc(i.id) + '"' + (picked ? ' checked' : '') + '> Add to my week</label></div>' +
      '<div class="guide" hidden>' +
      '<div class="block full"><h5>The concept</h5><p>' + esc(i.concept) + '</p></div>' +
      '<div class="block full"><h5>Why this idea</h5><p>' + esc(i.why) + '</p></div>' +
      '<div class="block full"><h5>Two ways in</h5><div class="hooks">' + hooks + '</div></div>' +
      '<div class="block"><h5>What to film</h5>' + (film.essential ? '<p class="note">Essential</p>' + list(film.essential, true) : '') + (film.nice && film.nice.length ? '<p class="note">If you can</p>' + list(film.nice) : '') + (film.skip && film.skip.length ? '<p class="note">Skip</p>' + list(film.skip) : '') + '</div>' +
      '<div class="block"><h5>Structure</h5>' + list(i.structure, true) + '</div>' +
      (tp.length ? '<div class="block"><h5>Talking points <button class="btn small" data-copy="' + esc(tp.join('\n')) + '">Copy</button></h5>' + list(tp) + '</div>' : '') +
      (i.voiceover ? '<div class="block"><h5>Sample voiceover <button class="btn small" data-copy="' + esc(i.voiceover) + '">Copy</button></h5><div class="vo">' + esc(i.voiceover) + '</div><p class="note">A starting point in a generic voice. Say it your way.</p></div>' : '') +
      (i.caption ? '<div class="block"><h5>Caption</h5><p>' + esc(i.caption.goal || '') + '</p>' + (i.caption.example ? '<p class="note">Example opening: “' + esc(i.caption.example) + '”</p>' : '') + '</div>' : '') +
      (i.adapt && i.adapt.length ? '<div class="block"><h5>Make it yours</h5>' + list(i.adapt) + '</div>' : '') +
      (insp ? '<div class="block full insp"><h5>What informed this</h5><ul>' + insp + '</ul>' + (i.inspiration_note ? '<p class="note">' + esc(i.inspiration_note) + '</p>' : '') + '</div>' : '') +
      '<div class="block full"><button class="btn card-toggle">Close guide</button></div>' +
      '</div></article>';
  }
  $('#grid').innerHTML = ideas.map(function (i, n) { return card(i, n + 1); }).join('');

  /* expand / collapse */
  $$('.card-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var art = b.closest('.idea'), g = $('.guide', art), open = g.hidden, head = $('.actions .card-toggle', art);
      g.hidden = !open; art.classList.toggle('open', open); head.setAttribute('aria-expanded', open ? 'true' : 'false'); head.textContent = open ? 'Close guide' : 'Full guide';
      if (open) art.scrollIntoView({ block: 'start', behavior: 'smooth' }); else head.focus();
    });
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copy(b.getAttribute('data-copy'), b); });

  /* filters */
  var F = { aud: 'all', cam: 'all', eff: 'all' };
  function applyFilters() {
    var n = 0;
    $$('.idea').forEach(function (a) {
      var ok = (F.aud === 'all' || a.dataset.aud === F.aud || (F.aud !== 'both' && a.dataset.aud === 'both')) &&
               (F.cam === 'all' || (' ' + a.dataset.cam + ' ').indexOf(' ' + F.cam + ' ') > -1) &&
               (F.eff === 'all' || a.dataset.eff === F.eff);
      a.hidden = !ok; if (ok) n++;
    });
    $('#count').textContent = n === ideas.length ? 'Showing all ' + n + ' ideas' : 'Showing ' + n + ' of ' + ideas.length + ' ideas';
    $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', F[c.dataset.g] === c.dataset.v ? 'true' : 'false'); });
  }
  $$('.chip').forEach(function (c) { c.addEventListener('click', function () { F[c.dataset.g] = c.dataset.v; applyFilters(); }); });
  applyFilters();

  /* next appointment + experiment */
  var next = ideas.filter(function (i) { return i.next_appointment; });
  $('#next').innerHTML = next.map(function (i) { return '<article><h4>' + esc(i.title) + '</h4><p>' + esc(i.next_note || i.summary) + '</p><a class="jump" href="#idea-' + esc(i.id) + '">Open the guide →</a></article>'; }).join('');
  if (!next.length) $('#next-sec').hidden = true;
  var ex = ideas.filter(function (i) { return i.experiment; })[0];
  if (ex) { $('#experiment').innerHTML = '<h4>' + esc(ex.title) + '</h4><p>' + esc(ex.summary) + '</p><p>' + esc(ex.experiment_note || ex.why) + '</p><p><a class="jump" href="#idea-' + esc(ex.id) + '">Open the guide →</a></p>'; } else { $('#exp-sec').hidden = true; }

  /* inspiration: visual tiles with on-demand official embeds */
  function tiktokId(u) { var m = /video\/(\d+)/.exec(u || ''); return m ? m[1] : ''; }
  $('#insp').innerHTML = (E.inspiration || []).map(function (s, idx) {
    var pl = (s.platform || '').toLowerCase();
    return '<article class="tile" data-i="' + idx + '"><div class="tile-top"><span class="plat ' + (pl.indexOf('tik') > -1 ? 'tt' : 'ig') + '">' + esc(s.platform) + '</span><span class="note">' + esc([s.date, s.metrics].filter(Boolean).join(' · ')) + '</span></div>' +
      (s.quote ? '<p class="quote">“' + esc(s.quote) + '”</p>' : '') +
      '<p class="who"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.creator) + '</a></p>' +
      '<p>' + esc(s.what) + '</p><p class="learn"><b>Take from it:</b> ' + esc(s.learn) + '</p>' +
      '<div class="actions"><button class="btn small preview-btn">Preview here</button><a class="btn small" href="' + esc(s.url) + '" target="_blank" rel="noopener">Open original ↗</a></div>' +
      '<div class="embed" hidden></div></article>';
  }).join('');
  var loaded = {};
  function loadScript(src, cb) { if (loaded[src]) { cb(true); return; } var sc = document.createElement('script'); sc.src = src; sc.async = true; var done = false; sc.onload = function () { done = true; loaded[src] = true; cb(true); }; sc.onerror = function () { done = true; cb(false); }; setTimeout(function () { if (!done) cb(false); }, 6000); document.body.appendChild(sc); }
  $$('.preview-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var art = b.closest('.tile'), s = (E.inspiration || [])[+art.dataset.i], box = $('.embed', art);
      if (!box.hidden) { box.hidden = true; box.innerHTML = ''; b.textContent = 'Preview here'; return; }
      box.hidden = false; b.textContent = 'Loading…';
      var fail = function () { box.innerHTML = '<p class="note">Preview can\'t load here. <a href="' + esc(s.url) + '" target="_blank" rel="noopener">Open it on ' + esc(s.platform) + ' ↗</a></p>'; b.textContent = 'Close preview'; };
      if ((s.platform || '').toLowerCase().indexOf('tik') > -1) {
        var id = tiktokId(s.url); if (!id) { fail(); return; }
        box.innerHTML = '<blockquote class="tiktok-embed" cite="' + esc(s.url) + '" data-video-id="' + esc(id) + '" style="max-width:605px;min-width:325px"><section></section></blockquote>';
        loadScript('https://www.tiktok.com/embed.js', function (ok) { if (!ok) { fail(); return; } b.textContent = 'Close preview'; setTimeout(function () { if (!box.hidden && !box.querySelector('iframe')) fail(); }, 9000); });
      } else {
        box.innerHTML = '<blockquote class="instagram-media" data-instgrm-permalink="' + esc(s.url) + '" data-instgrm-version="14" style="margin:0;max-width:540px;min-width:280px;width:100%"></blockquote>';
        loadScript('https://www.instagram.com/embed.js', function (ok) { if (!ok) { fail(); return; } try { window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process(); } catch (e) { } b.textContent = 'Close preview'; setTimeout(function () { if (!box.hidden && !box.querySelector('iframe')) fail(); }, 9000); });
      }
    });
  });

  /* my week (checklist) */
  function renderChecklist() {
    var picked = ideas.filter(function (i) { return state.picked.indexOf(i.id) > -1; });
    var panel = $('#checklist'); panel.hidden = !picked.length; $('#pickcount').textContent = picked.length + (picked.length === 1 ? ' idea picked' : ' ideas picked');
    if (!picked.length) return;
    var html = picked.map(function (i) {
      var items = (i.film && i.film.essential || []).map(function (s) { var id = i.id + '|' + s; return '<label><input type="checkbox" data-tick="' + esc(id) + '"' + (state.ticks[id] ? ' checked' : '') + '><span>' + esc(s) + '</span></label>'; }).join('');
      return '<h5>' + esc(i.title) + '</h5><div>' + items + '</div>' + (i.hooks && i.hooks[0] ? '<p class="note">Hook: “' + esc(i.hooks[0].split(' (')[0]) + '”</p>' : '');
    }).join('');
    $('#checklist-body').innerHTML = html;
    var text = picked.map(function (i) { return i.title.toUpperCase() + '\nHook: ' + (i.hooks && i.hooks[0] ? i.hooks[0].split(' (')[0] : '') + '\n' + (i.film && i.film.essential || []).map(function (s) { return '[ ] ' + s; }).join('\n'); }).join('\n\n');
    $('#copy-checklist').setAttribute('data-copy', 'MY WEEK — ' + E.week_label + '\n\n' + text);
  }
  document.addEventListener('change', function (e) {
    var p = e.target.getAttribute && e.target.getAttribute('data-pick');
    if (p) { var i = state.picked.indexOf(p); if (e.target.checked && i < 0) state.picked.push(p); if (!e.target.checked && i > -1) state.picked.splice(i, 1); store.set(state); renderChecklist(); if (e.target.checked) toast('Added to my week'); }
    var t = e.target.getAttribute && e.target.getAttribute('data-tick');
    if (t) { state.ticks[t] = e.target.checked; store.set(state); }
  });
  $('#toggle-checklist').addEventListener('click', function () { var p = $('#checklist'); p.classList.toggle('open'); $('#toggle-checklist').textContent = p.classList.contains('open') ? 'Hide' : 'Show my checklist'; });
  $('#clear-picks').addEventListener('click', function () { state.picked = []; state.ticks = {}; store.set(state); $$('[data-pick]').forEach(function (c) { c.checked = false; }); renderChecklist(); });
  renderChecklist();

  /* deep link to an idea */
  if (location.hash && /^#idea-/.test(location.hash)) { var a = $(location.hash); if (a) { $('.card-toggle', a).click(); } }
})();
