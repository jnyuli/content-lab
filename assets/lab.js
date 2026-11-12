/* Content Lab member page. Expects window.EDITION (v3). Renders approved ideas, strongest first.
   Reference posts: a designed tile by default; on the live site the official Instagram embed
   loads lazily when the card scrolls into view, and replaces the tile only if it renders. */
(function () {
  var E = window.EDITION; if (!E) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var list = function (a, ol) { return !a || !a.length ? '' : '<' + (ol ? 'ol' : 'ul') + '>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</' + (ol ? 'ol' : 'ul') + '>'; };
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1400); }
  function copy(text) {
    var done = function () { toast('Filming plan copied'); };
    var fb = function () { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select and copy manually'); } document.body.removeChild(ta); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
  }
  var AUD = { clients: 'for clients', stylists: 'for stylists', both: 'for clients and stylists' };

  $('#week').textContent = E.week_label; $('#title').textContent = E.title || 'Content Lab'; $('#lede').textContent = E.lede || '';
  var ideas = (E.ideas || []).filter(function (i) { return E.preview ? i.preview_rank : i.status === 'approved'; });
  ideas.sort(function (a, b) { return (a.preview_rank || a.rank || 99) - (b.preview_rank || b.rank || 99); });

  function plan(i) { return i.title.toUpperCase() + '\nHook: ' + i.hook + '\n\n' + i.steps.map(function (s, n) { return (n + 1) + '. ' + s; }).join('\n') + (i.guide && i.guide.shots ? '\n\nShots:\n' + i.guide.shots.map(function (s) { return '- ' + s; }).join('\n') : ''); }
  function card(i) {
    var r = i.ref || {}; var g = i.guide || {};
    return '<article class="idea fold" id="' + esc(i.id) + '"><div class="head" role="button" tabindex="0" aria-expanded="false">' +
      '<div class="cpv">' + esc(i.cpv) + ' · ' + esc(AUD[i.audience] || i.audience) + (i.experiment ? ' · <span class="exp">Original experiment</span>' : '') + '</div>' +
      '<h2>' + esc(i.title) + '</h2>' +
      (i.principle ? '<p class="principle">' + esc(i.principle) + '</p>' : '') +
      (i.drivers ? '<p class="drivers">' + (i.format ? '<b>' + esc(i.format) + '</b> · ' : '') + i.drivers.map(esc).join(' · ') + '</p>' : '') +
      '<span class="chev"><span class="o">Open idea</span><span class="c">Close idea</span></span></div><div class="body" hidden>' +
      (r.anon ? '<div class="ref anon"><div class="tile"><div class="lbl">What performed</div><div class="q">' + esc(r.headline) + '</div><p class="desc">' + esc(r.desc) + '</p>' + (r.numbers ? '<div class="ev">' + esc(r.numbers) + '</div>' : '') + '</div></div>' :
      '<div class="ref' + (r.still ? ' has-still' : '') + '" data-url="' + esc(r.url) + '">' + (r.still ? '<a class="still" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="Open the original post"><img src="' + esc(r.still) + '" alt="' + esc(r.still_alt || ('Opening frame of the reference post by ' + r.creator)) + '" loading="lazy"></a>' : '') + '<div class="tile"><div class="q">“' + esc(r.line) + '”</div><div class="who">' + esc(r.creator) + ' · ' + esc(r.platform) + (r.date ? ' · ' + esc(r.date) : '') + '</div>' + (i.evidence && (i.evidence.views || i.evidence.likes) ? '<div class="ev">' + [i.evidence.views ? esc(i.evidence.views) + ' views' : '', i.evidence.likes ? esc(i.evidence.likes) + ' likes' : '', esc(i.evidence.relative || '')].filter(Boolean).join(' · ') + '</div>' : '') + '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + (i.experiment ? 'See what inspired it ↗' : 'Watch the original post ↗') + '</a></div><div class="embed"></div></div>') +
      (i.dissection ? '<div class="dissect"><h3>Why it worked</h3><dl>' + i.dissection.map(function (d) { return '<dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd>'; }).join('') + '</dl></div><h3 class="mine">Make your own</h3>' : '') +
      '<p class="concept">' + esc(i.concept) + '</p>' +
      '<div class="hook"><b>Open with</b>“' + esc(i.hook) + '”</div>' +
      '<ol class="steps">' + (i.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<div class="actions"><button class="btn primary copy">Copy filming plan</button><button class="btn more" aria-expanded="false">Full guide</button></div>' +
      '<div class="guide" hidden>' +
      '<div><h3>Another way in</h3><p>“' + esc(i.hook2) + '”</p></div>' +
      '<div><h3>Shot list</h3>' + list(g.shots) + '</div>' +
      '<div><h3>Structure</h3>' + list(g.structure, true) + '</div>' +
      '<div><h3>What to say</h3>' + list(g.talking) + '</div>' +
      '<div><h3>Caption</h3><p>' + esc(g.caption) + '</p></div>' +
      '<div><h3>Make it yours</h3>' + list(g.adapt) + '</div>' +
      (g.text_to_client ? '<div><h3>Text to send your client</h3><p>' + esc(g.text_to_client) + '</p></div>' : '') +
      (r.anon ? '' : '<div class="why"><h3>' + (i.experiment ? 'Where the idea comes from' : 'Why the reference worked') + '</h3><p>' + esc(r.why) + ' <a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + (i.experiment ? 'Open the source ↗' : 'Open the post ↗') + '</a></p></div>') +
      '<div class="actions"><button class="btn more">Close guide</button></div>' +
      '</div></div></article>';
  }
  var insp = (E.inspiration || []).filter(function (x) { return E.demo_inspiration ? x.status !== 'rejected' : x.status === 'approved'; });
  function tile(v, link) { v = v || {}; if (v.still) { return '<a class="itile img" href="' + esc(link || '#') + '" target="_blank" rel="noopener"><img src="' + esc(v.still) + '" alt="' + esc(v.alt || 'Reference image') + '" loading="lazy"><div class="icap">' + (v.sub ? '<div class="isub">' + esc(v.sub) + '</div>' : '') + '</div></a>'; }
    return '<div class="itile ' + esc(v.style || 'plain') + '"><div class="ihead">' + esc(v.headline || '') + '</div>' + (v.sub ? '<div class="isub">' + esc(v.sub) + '</div>' : '') + '</div>'; }
  function icard(x) {
    var s = x.seen || {}; var src = s.source || {}; var a = x.application || {}; var g = a.guide || {};
    var hasIdea = a.hook && a.steps && a.steps.length;
    return '<article class="idea insp fold" id="' + esc(x.id) + '"><div class="head" role="button" tabindex="0" aria-expanded="false">' +
      '<div class="cpv">' + (x.kind === 'trend' ? 'Emerging trend' : 'Creative observation') + ' · creative experiment</div>' +
      '<h2>' + esc(x.title) + '</h2>' + '<span class="chev"><span class="o">Open idea</span><span class="c">Close idea</span></span></div><div class="body" hidden>' +
      tile(x.visual, (x.seen && x.seen.example && x.seen.example.url) || (s && s.source && s.source.url)) +
      '<p class="concept"><b>What\'s happening.</b> ' + esc(s.what) + ' ' + esc(s.why) + (src.url ? ' <a class="src" href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(x.kind === 'trend' ? 'Reported by ' : 'Seen at ') + esc(src.name) + (src.date ? ', ' + esc(src.date) : '') + ' ↗</a>' : '') + (s.example && s.example.url ? ' <a class="src" href="' + esc(s.example.url) + '" target="_blank" rel="noopener">' + esc(s.example.name) + ' ↗</a>' : '') + '</p>' +
      '<p class="concept"><b>For a hairstylist.</b> ' + esc(a.concept) + '</p>' +
      (hasIdea ? '<div class="hook"><b>Open with</b>“' + esc(a.hook) + '”</div>' +
        '<ol class="steps">' + a.steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>' +
        '<div class="actions"><button class="btn primary copy">Copy filming plan</button><button class="btn more" aria-expanded="false">Full guide</button></div>' +
        '<div class="guide" hidden>' +
        (a.hook2 ? '<div><h3>Another way in</h3><p>“' + esc(a.hook2) + '”</p></div>' : '') +
        '<div><h3>Shot list</h3>' + list(g.shots) + '</div>' +
        '<div><h3>Structure</h3>' + list(g.structure, true) + '</div>' +
        '<div><h3>What to say</h3>' + list(g.talking) + '</div>' +
        '<div><h3>Caption</h3><p>' + esc(g.caption) + '</p></div>' +
        '<div><h3>Make it yours</h3>' + list(g.adapt) + '</div>' +
        (g.not ? '<div><h3>What it isn\'t</h3><p>' + esc(g.not) + '</p></div>' : '') +
        '<div class="actions"><button class="btn more">Close guide</button></div>' +
        '</div>' : '') +
      '</div></article>';
  }
  function src(a) { return (a || []).map(function (x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + ' ↗</a>'; }).join(' · '); }
  var upd = (E.updates || []).length ? '<section class="updates"><div class="eyebrow">On Instagram this week</div>' + E.updates.map(function (u) { return '<div class="upd"><h3>' + esc(u.title) + '</h3><p>' + esc(u.what) + '</p><p class="so"><b>For you:</b> ' + esc(u.so_what) + '</p><p class="src">' + src(u.sources) + '</p></div>'; }).join('') + '</section>' : '';
  var T = E.trends; var tmax = T ? Math.max.apply(null, T.groups.reduce(function (a, g) { return a.concat(g.items.map(function (it) { return parseFloat(String(it[1]).replace(/[^0-9.]/g, '')) || 0; })); }, [])) : 1;
  var trends = T ? '<section class="idea trends"><div class="cpv">Trends · what clients type</div><h2>What clients are searching</h2><p class="principle">' + esc(T.intro) + '</p><div class="tgrid">' + T.groups.map(function (g) { var gmax = Math.max.apply(null, g.items.map(function (it) { return parseFloat(String(it[1]).replace(/[^0-9.]/g, '')) || 0; })) || 1; return '<div class="tg"><h3>' + esc(g.label) + '</h3><ul>' + g.items.map(function (it) { var v = parseFloat(String(it[1]).replace(/[^0-9.]/g, '')) || 0; return '<li><div class="trow"><span>' + esc(it[0]) + '</span><b>' + esc(it[1]) + '</b></div><div class="bar"><i style="width:' + Math.max(6, Math.round(v / gmax * 100)) + '%"></i></div></li>'; }).join('') + '</ul></div>'; }).join('') + '</div><div class="hook use"><b>The pattern</b>' + esc(T.takeaway) + '</div><p class="tsrc">Change in searches · ' + src([T.source]) + '</p></section>' : '';
  var ideaHead = (E.updates || E.trends) ? '<div class="eyebrow ideas-eyebrow">This week\'s ideas</div>' : '';
  $('#ideas').innerHTML = upd + ideaHead + ideas.map(card).join('') + trends + (insp.length ? '<section class="fresh"><div class="eyebrow">Fresh inspiration</div><p class="lede small">From outside hair: one or two things happening in fashion, photography, design or culture, and one original way to use them. Experiments, not proven posts.</p>' + insp.map(icard).join('') + '</section>' : '');
  var all = ideas.concat(insp.map(function (x) { var a = x.application || {}; return { id: x.id, title: x.title, hook: a.hook, steps: a.steps || [], guide: a.guide }; }));
  $$('.idea.fold').forEach(function (a) {
    var h = $('.head', a), body = $('.body', a);
    function toggle() { var open = body.hidden; body.hidden = !open; a.classList.toggle('open', open); h.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) { $$('.ref', a).forEach(function (r) { if (window.__hydrate) window.__hydrate(r); }); } else { a.scrollIntoView({ block: 'nearest' }); } }
    h.addEventListener('click', toggle);
    h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt && tgt.classList.contains('fold')) $('.head', tgt).click(); }
  $$('.idea:not(.trends)').forEach(function (a, n) {
    var i = all[n]; if (!$('.copy', a)) return;
    $('.copy', a).addEventListener('click', function () { copy(plan(i)); });
    $$('.more', a).forEach(function (b) { b.addEventListener('click', function () { var g = $('.guide', a), open = g.hidden; g.hidden = !open; var head = $('.actions .more', a); head.setAttribute('aria-expanded', open ? 'true' : 'false'); head.textContent = open ? 'Close guide' : 'Full guide'; if (!open) a.scrollIntoView({ block: 'start', behavior: 'smooth' }); }); });
  });

  /* lazy official embeds (live site only; blocked inside a Claude artifact, where the tile stays) */
  var scriptState = null;
  function loadEmbedScript(cb) {
    if (scriptState === 'ok') return cb(true); if (scriptState === 'fail') return cb(false);
    if (scriptState === 'loading') { return setTimeout(function () { loadEmbedScript(cb); }, 300); }
    scriptState = 'loading'; var s = document.createElement('script'); s.src = 'https://www.instagram.com/embed.js'; s.async = true;
    var t = setTimeout(function () { if (scriptState === 'loading') { scriptState = 'fail'; cb(false); } }, 6000);
    s.onload = function () { clearTimeout(t); scriptState = 'ok'; cb(true); }; s.onerror = function () { clearTimeout(t); scriptState = 'fail'; cb(false); };
    document.body.appendChild(s);
  }
  function hydrate(ref) {
    var url = ref.getAttribute('data-url'); if (!url || ref.dataset.done || url.indexOf('instagram.com/') < 0) return; ref.dataset.done = '1';
    var box = $('.embed', ref); box.innerHTML = '<blockquote class="instagram-media" data-instgrm-permalink="' + esc(url) + '" data-instgrm-version="14" style="margin:0;width:100%;min-width:0"></blockquote>';
    loadEmbedScript(function (ok) {
      if (!ok) return;
      try { window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process(); } catch (e) { }
      var tries = 0; var iv = setInterval(function () { tries++; if (box.querySelector('iframe')) { clearInterval(iv); ref.classList.add('live'); } else if (tries > 20) { clearInterval(iv); } }, 400);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { hydrate(e.target); io.unobserve(e.target); } }); }, { rootMargin: '200px' });
    $$('.ref').forEach(function (r) { io.observe(r); });
  }
  if (location.hash) { var t = $(location.hash); if (t) t.scrollIntoView(); }
})();
