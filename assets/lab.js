/* Club Stylist Content Lab — edition renderer.
   Expects window.EDITION (injected by build.py). All state that matters to a member
   (picked ideas, checklist ticks) lives in their own browser's localStorage. */
(function () {
  var E = window.EDITION; if (!E) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var key = 'lab:' + E.slug;
  var store = { get: function () { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; } }, set: function (v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } } };
  var state = store.get(); state.picked = state.picked || []; state.ticks = state.ticks || {};

  var AUD = { clients: 'Clients', stylists: 'Stylists', both: 'Clients + stylists' };
  var CAM = { 'no-face': 'No face', 'hands': 'Hands only', 'voiceover': 'Voiceover', 'on-camera': 'On camera' };
  var EFF = { low: 'Low effort', medium: 'Medium effort', high: 'Bigger project' };

  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1400); }
  function copy(text, btn) {
    var done = function () { toast('Copied'); if (btn) { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1200); } };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { fallback(); }); } else { fallback(); }
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select and copy manually'); } document.body.removeChild(ta); }
  }
  function kindLabel(k) { return { verified: 'Verified', observed: 'Observed pattern', hypothesis: 'Informed hypothesis', experiment: 'Creative experiment' }[k] || ''; }
  function list(items, ol) { if (!items || !items.length) return ''; return '<' + (ol ? 'ol' : 'ul') + '>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</' + (ol ? 'ol' : 'ul') + '>'; }
  function linkList(links) { if (!links || !links.length) return ''; return '<div class="links">' + links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>'; }).join('') + '</div>'; }

  /* header */
  $('#week').textContent = E.week_label; $('#title').textContent = E.title; $('#lede').textContent = E.lede || '';
  if (E.spotlight) { $('#spot').innerHTML = 'Spotlight: <span>' + esc(E.spotlight) + '</span>'; } else { $('#spot').hidden = true; }

  /* radar */
  $('#radar').innerHTML = (E.radar || []).map(function (r) {
    return '<article><h4>' + esc(r.headline) + (r.kind ? '<span class="kind">' + kindLabel(r.kind) + '</span>' : '') + '</h4><p>' + esc(r.detail) + '</p>' + linkList(r.links) + '</article>';
  }).join('');

  /* ideas */
  var ideas = E.ideas || [];
  function card(i, n) {
    var picked = state.picked.indexOf(i.id) > -1;
    var cam = (i.camera || []).map(function (c) { return '<span class="tag">' + esc(CAM[c] || c) + '</span>'; }).join('');
    var hooks = (i.hooks || []).map(function (h) { return '<div class="hook"><em>' + esc(h) + '</em><button class="btn small" data-copy="' + esc(h) + '">Copy</button></div>'; }).join('');
    var film = i.film || {};
    var insp = (i.inspiration || []).map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>' + (s.note ? ' — ' + esc(s.note) : '') + '</li>'; }).join('');
    var tp = (i.talking_points || []);
    return '<article class="idea" id="idea-' + esc(i.id) + '" data-aud="' + esc(i.audience) + '" data-cam="' + esc((i.camera || []).join(' ')) + '" data-eff="' + esc(i.effort) + '">' +
      '<div class="top"><span class="num">' + n + '</span><h3>' + esc(i.title) + '</h3></div>' +
      '<div class="tags"><span class="tag aud">' + esc(AUD[i.audience] || i.audience) + '</span><span class="tag">' + esc(i.format) + '</span>' + cam + '<span class="tag eff-' + esc(i.effort) + '">' + esc(EFF[i.effort] || i.effort) + '</span>' + (i.specialty ? '<span class="tag">' + esc(i.specialty) + '</span>' : '') + '</div>' +
      '<p class="hookprev">“' + esc(i.hook_preview || (i.hooks && i.hooks[0]) || '') + '”</p>' +
      '<p>' + esc(i.summary) + '</p>' +
      '<div class="actions"><button class="btn card-toggle" aria-expanded="false">Full guide</button><label class="pick"><input type="checkbox" data-pick="' + esc(i.id) + '"' + (picked ? ' checked' : '') + '> Add to my week</label></div>' +
      '<div class="guide" hidden>' +
      '<div class="block full"><h5>The concept</h5><p>' + esc(i.concept) + '</p></div>' +
      '<div class="block full"><h5>Why this idea</h5><p>' + esc(i.why) + '</p></div>' +
      '<div class="block full"><h5>Hook options</h5><div class="hooks">' + hooks + '</div></div>' +
      '<div class="block"><h5>What to film</h5>' + (film.essential ? '<p class="note">Essential</p>' + list(film.essential, true) : '') + (film.nice && film.nice.length ? '<p class="note">If you can</p>' + list(film.nice) : '') + (film.skip && film.skip.length ? '<p class="note">Skip</p>' + list(film.skip) : '') + '</div>' +
      '<div class="block"><h5>Structure</h5>' + list(i.structure, true) + '</div>' +
      (tp.length ? '<div class="block"><h5>Talking points <button class="btn small" data-copy="' + esc(tp.join('\n')) + '">Copy</button></h5>' + list(tp) + '</div>' : '') +
      (i.voiceover ? '<div class="block"><h5>Sample voiceover <button class="btn small" data-copy="' + esc(i.voiceover) + '">Copy</button></h5><div class="vo">' + esc(i.voiceover) + '</div></div>' : '') +
      (i.caption ? '<div class="block"><h5>Caption</h5><p>' + esc(i.caption.goal || '') + '</p>' + (i.caption.example ? '<p class="note">Example opening: “' + esc(i.caption.example) + '”</p>' : '') + '</div>' : '') +
      (i.adapt && i.adapt.length ? '<div class="block"><h5>How to adapt it</h5>' + list(i.adapt) + '</div>' : '') +
      (insp ? '<div class="block full insp"><h5>What informed this</h5><ul>' + insp + '</ul>' + (i.inspiration_note ? '<p class="note">' + esc(i.inspiration_note) + '</p>' : '') + '</div>' : '') +
      '</div></article>';
  }
  $('#grid').innerHTML = ideas.map(card).join('');

  /* expand / collapse */
  $$('.card-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var art = b.closest('.idea'), g = $('.guide', art), open = g.hidden;
      g.hidden = !open; art.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'Close guide' : 'Full guide';
      if (open) art.scrollIntoView({ block: 'start', behavior: 'smooth' });
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

  /* next appointment + experiment + inspiration */
  var next = ideas.filter(function (i) { return i.next_appointment; });
  $('#next').innerHTML = next.map(function (i) { return '<article><h4>' + esc(i.title) + '</h4><p>' + esc(i.next_note || i.summary) + '</p><a class="jump" href="#idea-' + esc(i.id) + '">Open the guide →</a></article>'; }).join('');
  if (!next.length) $('#next-sec').hidden = true;
  var ex = ideas.filter(function (i) { return i.experiment; })[0];
  if (ex) { $('#experiment').innerHTML = '<h4>' + esc(ex.title) + '</h4><p>' + esc(ex.experiment_note || ex.why) + '</p><p><a class="jump" href="#idea-' + esc(ex.id) + '">Open the guide →</a></p>'; } else { $('#exp-sec').hidden = true; }
  $('#insp').innerHTML = (E.inspiration || []).map(function (s) {
    return '<article><h4><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.creator) + '</a> <span class="note">' + esc([s.platform, s.date, s.metrics].filter(Boolean).join(' · ')) + '</span></h4><p>' + esc(s.what) + '</p><p><b>Take from it:</b> ' + esc(s.learn) + '</p></article>';
  }).join('');

  /* my week (checklist) */
  function renderChecklist() {
    var picked = ideas.filter(function (i) { return state.picked.indexOf(i.id) > -1; });
    var panel = $('#checklist'); panel.hidden = !picked.length; $('#pickcount').textContent = picked.length + (picked.length === 1 ? ' idea picked' : ' ideas picked');
    if (!picked.length) return;
    var shots = []; picked.forEach(function (i) { (i.film && i.film.essential || []).forEach(function (s) { shots.push({ id: i.id + '|' + s, idea: i.title, s: s }); }); });
    var html = picked.map(function (i) {
      var items = (i.film && i.film.essential || []).map(function (s) { var id = i.id + '|' + s; return '<label><input type="checkbox" data-tick="' + esc(id) + '"' + (state.ticks[id] ? ' checked' : '') + '><span>' + esc(s) + '</span></label>'; }).join('');
      return '<h5>' + esc(i.title) + '</h5><div>' + items + '</div>' + (i.hooks && i.hooks[0] ? '<p class="note">Hook: “' + esc(i.hooks[0]) + '”</p>' : '');
    }).join('');
    $('#checklist-body').innerHTML = html;
    var text = picked.map(function (i) { return i.title.toUpperCase() + '\nHook: ' + (i.hooks && i.hooks[0] || '') + '\n' + (i.film && i.film.essential || []).map(function (s) { return '[ ] ' + s; }).join('\n'); }).join('\n\n');
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
