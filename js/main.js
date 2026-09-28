/* ============================================================
   Prashanth Reddy — Portfolio
   Entry flow, menu navigation, synthesized SFX, ambient music,
   and a lightweight particle-network background.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LS_MUTE = "pr_portfolio_muted";

  /* ---------- element refs ---------- */
  const entry      = document.getElementById("entry");
  const startBtn   = document.getElementById("start-btn");
  const app        = document.getElementById("app");
  const music      = document.getElementById("bg-music");
  const playBtn    = document.getElementById("play-toggle");
  const playIcon   = document.getElementById("play-icon");
  const prevBtn    = document.getElementById("prev-track");
  const nextBtn    = document.getElementById("next-track");
  const trackName  = document.getElementById("track-name");
  const trackTip   = document.getElementById("track-tip");
  const items      = Array.from(document.querySelectorAll(".menu__item"));
  const panels     = Array.from(document.querySelectorAll(".panel"));

  let started = false;
  let focusIdx = 0;
  let hoverMuteUntil = 0; // suppress menu hover blips briefly after a selection (during scroll)
  let finishIntro = null; // set while the Home intro is mid-sequence; completes it if the user navigates away

  /* ============================================================
     WEB AUDIO — synthesized UI sound effects (no audio files)
     Created lazily on the first user gesture (autoplay policy).
     ============================================================ */
  let actx = null;
  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }

  function tone(freq, dur, type, peak, delay) {
    const ctx = audio();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const sfx = {
    hover:   () => tone(1180, 0.05, "square", 0.05),
    move:    () => tone(880, 0.05, "square", 0.06),
    select:  () => { tone(660, 0.09, "triangle", 0.11); tone(990, 0.12, "triangle", 0.10, 0.06); },
    back:    () => { tone(520, 0.09, "triangle", 0.10); tone(360, 0.12, "triangle", 0.09, 0.05); },
    start:   () => { tone(440, 0.10, "sawtooth", 0.08); tone(660, 0.12, "sawtooth", 0.09, 0.08);
                     tone(880, 0.18, "triangle", 0.10, 0.16); }
  };

  /* ============================================================
     MUSIC  (playlist + transport controls)
     ============================================================ */
  const PLAYLIST = [
    { src: "assets/music.mp3",                             title: "Drawings",        artist: "Nikita Kondrashev" },
    { src: "assets/leberch-soft-piano-589658.mp3",         title: "Soft Piano",      artist: "Leberch" },
    { src: "assets/atlasaudio-nostalgic-piano-520047.mp3", title: "Nostalgic Piano", artist: "AtlasAudio" },
    { src: "assets/leberch-minimal-piano-590996.mp3",      title: "Minimal Piano",   artist: "Leberch" },
    { src: "assets/leberch-piano-580522.mp3",              title: "Piano",           artist: "Leberch" }
  ];
  const PLAY_GLYPH = "▶";   // ▶
  const PAUSE_GLYPH = "⏸";  // ⏸
  let trackIdx = 0;
  try { music.volume = 0.35; } catch (e) {}

  // Persist the paused/playing choice across reloads (reuses the old key).
  function wantsPaused() {
    try { return localStorage.getItem(LS_MUTE) === "1"; } catch (e) { return false; }
  }
  function rememberPaused(p) {
    try { localStorage.setItem(LS_MUTE, p ? "1" : "0"); } catch (e) {}
  }
  function updatePlayIcon() {
    if (playIcon) playIcon.textContent = music.paused ? PLAY_GLYPH : PAUSE_GLYPH;
    if (playBtn) playBtn.setAttribute("aria-label", music.paused ? "Play music" : "Pause music");
  }
  function showTrack() {
    const t = PLAYLIST[trackIdx];
    if (trackName) trackName.textContent = t.title;
    if (trackTip) trackTip.textContent = t.title + " — " + t.artist;
  }
  function loadTrack(i) {
    trackIdx = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    music.src = PLAYLIST[trackIdx].src;
    showTrack();
  }
  function playCurrent() {
    if (!music.volume) music.volume = 0.35;
    rememberPaused(false);
    music.play().then(updatePlayIcon).catch(updatePlayIcon);
    updatePlayIcon();
  }
  function togglePlay() {
    if (music.paused) { playCurrent(); }
    else { music.pause(); rememberPaused(true); updatePlayIcon(); }
  }
  function gotoTrack(delta, fromUser) {
    if (fromUser) sfx.move();
    loadTrack(trackIdx + delta);
    music.volume = 0.35;
    playCurrent();
  }

  // auto-advance through the playlist, wrapping around
  music.addEventListener("ended", () => { loadTrack(trackIdx + 1); playCurrent(); });
  music.addEventListener("play", updatePlayIcon);
  music.addEventListener("pause", updatePlayIcon);

  function startMusic() {
    loadTrack(0);
    rememberPaused(false);   // entering the site always starts the music
    music.volume = 0.0;
    music.play().then(() => {
      updatePlayIcon();
      const target = 0.35, stepv = target / 40;
      const id = setInterval(() => {
        music.volume = Math.min(target, music.volume + stepv);
        if (music.volume >= target) clearInterval(id);
      }, 40);
    }).catch(updatePlayIcon);
  }

  if (playBtn) playBtn.addEventListener("click", () => { sfx.select(); togglePlay(); });
  if (prevBtn) prevBtn.addEventListener("click", () => gotoTrack(-1, true));
  if (nextBtn) nextBtn.addEventListener("click", () => gotoTrack(1, true));

  /* ============================================================
     ENTRY -> APP
     ============================================================ */
  function enterApp() {
    if (started) return;
    started = true;
    sfx.start();
    entry.classList.add("is-leaving");
    setTimeout(() => {
      entry.hidden = true;
      entry.style.display = "none";
      app.hidden = false;
      app.classList.add("is-entering");
      startMusic();
      items[0].focus({ preventScroll: true });
      runHomeIntro();
    }, reduceMotion ? 0 : 550);
  }

  startBtn.addEventListener("click", enterApp);

  /* ============================================================
     PANEL SWITCHING
     ============================================================ */
  function activate(name, opts) {
    const silent = opts && opts.silent;
    if (finishIntro) finishIntro();
    let idx = items.findIndex((b) => b.dataset.panel === name);
    if (idx < 0) idx = 0;
    focusIdx = idx;

    items.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle("is-active", on);
      b.classList.toggle("is-focus", on);
      b.setAttribute("aria-selected", String(on));
    });
    panels.forEach((p) => {
      const on = p.id === "panel-" + name;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    });
    if (!silent) sfx.select();
    // smoothly scroll back to the top so the newly opened section starts at the top
    const content = document.querySelector(".content");
    if (content) content.scrollTop = 0;
    // mute hover blips while the page scrolls (items slide under a still cursor)
    hoverMuteUntil = performance.now() + 700;
    scrollToTop();
  }

  // One-time intro on first entry: photo eases in, welcome text reveals word-by-word.
  function runHomeIntro() {
    const home = document.querySelector(".home");
    if (!home || reduceMotion) return;
    const photo = home.querySelector(".home__photo");
    const textEl = home.querySelector(".home__text");
    if (photo) photo.classList.add("is-intro");
    if (!textEl) return;

    const STEP = 34;
    const lead = textEl.querySelector(".lead");
    const cta = textEl.querySelector(".cta-row");
    const restEls = Array.from(textEl.children).filter((el) => el !== lead && el !== cta);

    function wrapWords(elements) {
      const words = [];
      elements.forEach((el) => (function walk(node) {
        Array.from(node.childNodes).forEach((ch) => {
          if (ch.nodeType === 3) {
            if (ch.textContent === "") return;
            const parts = ch.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((p) => {
              if (p === "") return;
              if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
              else { const s = document.createElement("span"); s.className = "reveal-word"; s.textContent = p; frag.appendChild(s); words.push(s); }
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1) { walk(ch); }
        });
      })(el));
      return words;
    }
    function reveal(words) {
      words.forEach((s, i) => { s.style.animationDelay = (i * STEP) + "ms"; s.classList.add("show"); });
      return words.length * STEP;
    }

    const leadWords = lead ? wrapWords([lead]) : [];
    const restWords = wrapWords(restEls);
    if (cta) cta.classList.add("intro-hidden");

    const leadDur = reveal(leadWords);

    // "tap to continue" gate after the first paragraph
    const prompt = document.createElement("button");
    prompt.type = "button";
    prompt.className = "home__continue";
    prompt.innerHTML = 'Tap to continue <span class="cta-caret" aria-hidden="true">&#9656;</span>';
    if (lead) lead.insertAdjacentElement("afterend", prompt);
    const showT = setTimeout(() => { prompt.classList.add("in"); try { prompt.focus({ preventScroll: true }); } catch (e) {} }, leadDur + 700);

    function advance() {
      clearTimeout(showT);
      finishIntro = null;
      prompt.classList.add("out");
      setTimeout(() => prompt.remove(), 320);
      reveal(restWords);
      if (cta) { cta.classList.remove("intro-hidden"); cta.classList.add("reveal-cta"); cta.style.animationDelay = (restWords.length * STEP + 250) + "ms"; }
    }
    prompt.addEventListener("click", () => { sfx.select(); advance(); });
    finishIntro = advance; // if the user navigates away first, reveal the rest so it isn't stuck hidden
  }

  // Custom rAF smooth-scroll (reliable: not cancelled by the button's focus,
  // unlike native behaviour:"smooth"). Respects reduced-motion.
  function scrollToTop() {
    const startY = window.scrollY || document.documentElement.scrollTop || 0;
    if (reduceMotion || startY <= 0) { window.scrollTo(0, 0); return; }
    const dur = 420;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, Math.round(startY * (1 - ease(p))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  items.forEach((btn, i) => {
    btn.addEventListener("click", () => activate(btn.dataset.panel));
    btn.addEventListener("mouseenter", () => { if (started && performance.now() >= hoverMuteUntil) sfx.hover(); });
    btn.addEventListener("focus", () => { focusIdx = i; });
  });

  // inline "data-goto" buttons (welcome links + CTAs)
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => activate(el.dataset.goto));
  });

  /* ============================================================
     DETAIL MODAL  (project / leadership cards + interest tiles)
     ============================================================ */
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  let modalReturnFocus = null;

  function modalOpen() { return modal && !modal.hidden; }
  function openModal(fragment, trigger) {
    if (!modal || !fragment) return;
    modalBody.replaceChildren(fragment);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalBody.scrollTop = 0;
    modalReturnFocus = trigger || null;
    const closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modalOpen()) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    modalBody.replaceChildren();
    sfx.back();
    if (modalReturnFocus) { try { modalReturnFocus.focus({ preventScroll: true }); } catch (e) {} }
    modalReturnFocus = null;
  }
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeModal(); });
  }

  // project / leadership cards -> open their <template class="card__detail">
  document.querySelectorAll(".card").forEach((card) => {
    const tpl = card.querySelector(".card__detail");
    const open = () => { if (tpl && tpl.content) { sfx.select(); openModal(tpl.content.cloneNode(true), card); } };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  // interest tiles -> open <template id="...">
  document.querySelectorAll(".interest[data-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const tpl = document.getElementById(el.dataset.modal);
      if (tpl && tpl.content) { sfx.select(); openModal(tpl.content.cloneNode(true), el); }
    });
  });

  /* ---------- top-bar identity dropdown (EXP / BASE / FOCUS) ---------- */
  const idToggle = document.getElementById("id-toggle");
  const idStats  = document.getElementById("id-stats");
  function closeId() { if (idStats) { idStats.hidden = true; if (idToggle) idToggle.setAttribute("aria-expanded", "false"); } }
  function toggleId() {
    if (!idStats) return;
    const willOpen = idStats.hidden;
    idStats.hidden = !willOpen;
    if (idToggle) idToggle.setAttribute("aria-expanded", String(willOpen));
  }
  if (idToggle) idToggle.addEventListener("click", (e) => { e.stopPropagation(); sfx.hover(); toggleId(); });
  document.addEventListener("click", (e) => {
    if (idStats && !idStats.hidden && !idStats.contains(e.target) && idToggle && !idToggle.contains(e.target)) closeId();
  });

  /* ============================================================
     KEYBOARD
     ============================================================ */
  function moveFocus(delta) {
    focusIdx = (focusIdx + delta + items.length) % items.length;
    items.forEach((b, i) => b.classList.toggle("is-focus", i === focusIdx));
    items[focusIdx].focus({ preventScroll: true });
    sfx.move();
  }

  document.addEventListener("keydown", (e) => {
    // ENTRY screen: X / Enter / Space to continue
    if (!started) {
      if (e.key === "x" || e.key === "X" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enterApp();
      }
      return;
    }

    // If the identity dropdown is open, Escape closes it
    if (idStats && !idStats.hidden && e.key === "Escape") { e.preventDefault(); closeId(); return; }

    // If a detail popup is open, only Escape (to close it) is handled
    if (modalOpen()) { if (e.key === "Escape") { e.preventDefault(); closeModal(); } return; }

    // APP shortcuts
    switch (e.key) {
      case "ArrowDown": case "ArrowRight":
        e.preventDefault(); moveFocus(1); break;
      case "ArrowUp": case "ArrowLeft":
        e.preventDefault(); moveFocus(-1); break;
      case "Enter": case " ":
        e.preventDefault(); activate(items[focusIdx].dataset.panel); break;
      case "k": case "K":
        togglePlay(); break;
      case "n": case "N":
        gotoTrack(1, true); break;
      case "p": case "P":
        gotoTrack(-1, true); break;
      case "Escape":
        sfx.back(); activate("home"); break;
      default:
        if (/^[1-9]$/.test(e.key)) {
          const n = parseInt(e.key, 10) - 1;
          if (items[n]) activate(items[n].dataset.panel);
        }
    }
  });

  /* ============================================================
     BACKGROUND — extraterrestrial sky:
     twinkling stars, drifting green/violet signal nodes, comets
     ============================================================ */
  (function bg() {
    if (reduceMotion) return;
    const canvas = document.getElementById("bg-canvas");
    const ctx = canvas.getContext("2d");
    let w, h, dpr, stars = [], comet = null, cometTimer = 900, raf = null, tPrev = 0;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";

      // Static starfield with depth: mostly small faint stars, a few bright ones,
      // and slight color-temperature variation (white / warm / blue) for realism.
      const starCount = Math.min(480, Math.floor((innerWidth * innerHeight) / 3800));
      const tints = ["214,236,255", "255,244,224", "200,216,255", "236,236,246"];
      stars = Array.from({ length: starCount }, () => {
        const bright = Math.random() < 0.12;
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: (bright ? Math.random() * 1.1 + 1.0 : Math.random() * 0.9 + 0.3) * dpr,
          base: bright ? Math.random() * 0.3 + 0.6 : Math.random() * 0.4 + 0.32,
          tw: Math.random() * Math.PI * 2,
          tws: Math.random() * 2.2 + 0.6,
          tint: tints[(Math.random() * tints.length) | 0]
        };
      });
    }

    function spawnComet() {
      const fromLeft = Math.random() < 0.5;
      comet = {
        x: fromLeft ? -30 * dpr : w + 30 * dpr,
        y: Math.random() * h * 0.5,
        vx: (fromLeft ? 1 : -1) * (Math.random() * 1.4 + 2.1) * dpr,
        vy: (Math.random() * 1.1 + 0.9) * dpr,
        life: 1
      };
    }

    function frame(t) {
      const dt = Math.min(50, (t - tPrev) || 16); tPrev = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.85; // dim in-draw instead of via a composited layer opacity

      // stars (fixed position, gentle twinkle)
      for (const s of stars) {
        s.tw += s.tws * dt / 1000;
        const a = Math.max(0.12, s.base + Math.sin(s.tw) * 0.38);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + s.tint + "," + a.toFixed(3) + ")";
        ctx.fill();
      }

      // occasional comet / shooting star
      cometTimer -= dt;
      if (!comet && cometTimer <= 0) { spawnComet(); cometTimer = 1200 + Math.random() * 2000; }
      if (comet) {
        comet.x += comet.vx; comet.y += comet.vy; comet.life -= 0.008;
        const tx = comet.x - comet.vx * 8, ty = comet.y - comet.vy * 8;
        const grad = ctx.createLinearGradient(comet.x, comet.y, tx, ty);
        const a = Math.max(0, comet.life).toFixed(2);
        grad.addColorStop(0, "rgba(200,228,255," + a + ")");
        grad.addColorStop(1, "rgba(200,228,255,0)");
        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y); ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad; ctx.lineWidth = 3 * dpr; ctx.stroke();
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 2.3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(225,240,255," + a + ")"; ctx.fill();
        if (comet.life <= 0 || comet.y > h + 40 * dpr || comet.x < -40 * dpr || comet.x > w + 40 * dpr) comet = null;
      }

      raf = requestAnimationFrame(frame);
    }

    function play() { if (!raf) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size();
    play();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : play());
  })();

})();
