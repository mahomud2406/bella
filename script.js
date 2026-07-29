/* =========================================================
   Bella 🐾
   - alder og bursdagsnedtelling
   - "under panseret": talesyntese + syntetisk maling
   - galleri med bildevisning
   ========================================================= */
(function () {
  "use strict";

  var BIRTH = new Date(2025, 1, 16, 0, 0, 0); // 16. februar 2025 (måned er 0-indeksert)
  var nf = new Intl.NumberFormat("nb-NO");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* ===================== ALDER ===================== */

  // Kalenderriktig differanse i år, måneder og dager.
  function ageParts(from, to) {
    var years = to.getFullYear() - from.getFullYear();
    var months = to.getMonth() - from.getMonth();
    var days = to.getDate() - from.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) { years -= 1; months += 12; }
    return { years: years, months: months, days: days };
  }

  function catYears(totalYears) {
    if (totalYears < 1) return Math.round(totalYears * 15);
    if (totalYears < 2) return Math.round(15 + (totalYears - 1) * 9);
    return Math.round(24 + (totalYears - 2) * 4);
  }

  function lastBirthday(now) {
    var d = new Date(now.getFullYear(), BIRTH.getMonth(), BIRTH.getDate());
    if (d > now) d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  function nextBirthday(now) {
    var d = new Date(now.getFullYear(), BIRTH.getMonth(), BIRTH.getDate());
    if (d <= now) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  function renderAge() {
    var now = new Date();
    var p = ageParts(BIRTH, now);
    var totalDays = Math.floor((now - BIRTH) / 86400000);

    var bits = [];
    if (p.years) bits.push(plural(p.years, "år", "år"));
    if (p.months) bits.push(plural(p.months, "måned", "måneder"));
    bits.push(plural(p.days, "dag", "dager"));

    $("age-main").textContent = bits.join(", ");
    $("age-exact").textContent = "Født " + BIRTH.toLocaleDateString("nb-NO", {
      day: "numeric", month: "long", year: "numeric"
    }) + " — britisk langhår, og fullt klar over hvor fin hun er.";

    $("stat-days").textContent = nf.format(totalDays);
    $("stat-naps").textContent = nf.format(totalDays * 5);
    $("stat-cat").textContent = nf.format(catYears(totalDays / 365.25));
    $("stat-purr").textContent = nf.format(totalDays * 3);

    // Ringen: hvor langt hun er kommet mot neste bursdag
    var prev = lastBirthday(now), next = nextBirthday(now);
    var pct = (now - prev) / (next - prev);
    $("dialPct").textContent = Math.round(pct * 100) + "%";
    var circ = 2 * Math.PI * 86;
    $("dialFg").style.strokeDashoffset = String(circ * (1 - pct));
  }

  /* ===================== NEDTELLING ===================== */

  var cdD = $("cd-d"), cdH = $("cd-h"), cdM = $("cd-m"), cdS = $("cd-s"), cdNote = $("cd-note");
  var partyStarted = false;

  function tick() {
    var now = new Date();

    if (now.getMonth() === BIRTH.getMonth() && now.getDate() === BIRTH.getDate()) {
      cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = "🎉";
      cdNote.textContent = "Gratulerer med dagen, Bella! " +
        (now.getFullYear() - BIRTH.getFullYear()) + " år i dag! 🎂";
      cdNote.classList.add("party");
      if (!partyStarted) { partyStarted = true; confetti(); }
      return;
    }

    var target = nextBirthday(now), diff = target - now;
    cdD.textContent = Math.floor(diff / 86400000);
    cdH.textContent = pad(Math.floor(diff / 3600000) % 24);
    cdM.textContent = pad(Math.floor(diff / 60000) % 60);
    cdS.textContent = pad(Math.floor(diff / 1000) % 60);
    cdNote.textContent = "Neste bursdag: " + target.toLocaleDateString("nb-NO", {
      day: "numeric", month: "long", year: "numeric"
    }) + " — da fyller hun " + (target.getFullYear() - BIRTH.getFullYear()) + " år.";
  }

  function confetti() {
    if (reduceMotion) return;
    var emojis = ["🎉", "🎂", "🐾", "💛", "✨"];
    for (var i = 0; i < 44; i++) {
      var el = document.createElement("span");
      el.textContent = emojis[i % emojis.length];
      el.style.cssText = "position:fixed;top:-40px;z-index:70;pointer-events:none;font-size:" +
        (14 + Math.random() * 20) + "px;left:" + (Math.random() * 100) + "vw;" +
        "transition:transform 4s linear, opacity 4s linear;";
      document.body.appendChild(el);
      (function (el) {
        requestAnimationFrame(function () {
          el.style.transform = "translateY(110vh) rotate(" + (Math.random() * 720 - 360) + "deg)";
          el.style.opacity = "0";
        });
        setTimeout(function () { el.remove(); }, 4200);
      })(el);
    }
  }

  /* ===================== UNDER PANSERET ===================== */

  var STEPS = [
    { spot: 1, en: "The mouth is Mercedes",  no: "Munnen er Mercedes" },
    { spot: 2, en: "Nose is Tesla",          no: "Nesen er Tesla" },
    { spot: 3, en: "Forehead is Maserati",   no: "Pannen er Maserati" },
    { spot: 4, en: "And the engine…",   no: "Og motoren …", purr: true }
  ];

  var startBtn = $("startBtn"), startLabel = $("startLabel");
  var subtitle = $("subtitle"), subtitleNo = $("subtitleNo"), voiceHint = $("voiceHint");
  var running = false, seqTimer = null;

  function setSpot(n) {
    var i;
    var hots = document.querySelectorAll(".hot");
    for (i = 0; i < hots.length; i++) hots[i].classList.toggle("on", +hots[i].dataset.spot === n);
    var specs = document.querySelectorAll(".spec");
    for (i = 0; i < specs.length; i++) specs[i].classList.toggle("on", +specs[i].dataset.spot === n);
    var lines = document.querySelectorAll(".lead-line");
    for (i = 0; i < lines.length; i++) lines[i].classList.toggle("on", +lines[i].dataset.line === n);
  }

  function clearSpots() { setSpot(0); }

  /* ---- talesyntese ---- */

  var synth = window.speechSynthesis;

  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    var i;
    // Foretrekk britisk engelsk, ellers hvilken som helst engelsk stemme
    for (i = 0; i < voices.length; i++) if (/^en[-_]GB/i.test(voices[i].lang)) return voices[i];
    for (i = 0; i < voices.length; i++) if (/^en/i.test(voices[i].lang)) return voices[i];
    return null;
  }

  // Sier teksten og kaller done() når den er ferdig. Faller tilbake til
  // ren tekstvisning hvis nettleseren ikke har talesyntese.
  function speak(text, done) {
    var fallbackMs = Math.max(1500, text.length * 85);
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      seqTimer = setTimeout(done, fallbackMs);
      return;
    }
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(seqTimer);
      done();
    }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.9;
    u.pitch = 1;
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onend = finish;
    u.onerror = finish;
    // Noen nettlesere glemmer å fyre onend — ha alltid en sikkerhetsventil.
    seqTimer = setTimeout(finish, fallbackMs + 2500);
    try { synth.speak(u); } catch (e) { finish(); }
  }

  /* ---- syntetisk maling (Web Audio) ---- */

  var ac = null, analyser = null, scopeRAF = null, purrNodes = null;

  function purr(seconds, done) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { seqTimer = setTimeout(done, seconds * 1000); return; }
    if (!ac) ac = new Ctx();
    if (ac.state === "suspended") ac.resume();

    // Brunt støy-loop = grunnlyden i en katts maling
    var sr = ac.sampleRate, len = Math.floor(sr * 2);
    var buf = ac.createBuffer(1, len, sr), data = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    var src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;

    var lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 200; lp.Q.value = 1.2;

    // ~25 Hz amplitudemodulasjon gir det karakteristiske vibrato-suset
    var rumble = ac.createGain();
    rumble.gain.value = 0.55;
    var lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 25;
    var lfoAmt = ac.createGain(); lfoAmt.gain.value = 0.45;
    lfo.connect(lfoAmt); lfoAmt.connect(rumble.gain);

    // Sakte "pust" oppå
    var master = ac.createGain();
    var breath = ac.createOscillator(); breath.type = "sine"; breath.frequency.value = 0.33;
    var breathAmt = ac.createGain(); breathAmt.gain.value = 0.16;
    breath.connect(breathAmt); breathAmt.connect(master.gain);

    analyser = ac.createAnalyser();
    analyser.fftSize = 1024;

    src.connect(lp); lp.connect(rumble); rumble.connect(master);
    master.connect(analyser); analyser.connect(ac.destination);

    var t = ac.currentTime;
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(0.45, t + 0.9);
    master.gain.setValueAtTime(0.45, t + seconds - 1.2);
    master.gain.linearRampToValueAtTime(0.0001, t + seconds);

    src.start(t); lfo.start(t); breath.start(t);
    src.stop(t + seconds); lfo.stop(t + seconds); breath.stop(t + seconds);

    purrNodes = [src, lfo, breath];
    drawScope();
    sleepyZs(seconds);
    seqTimer = setTimeout(function () { purrNodes = null; done(); }, seconds * 1000);
  }

  function stopPurr() {
    if (!purrNodes) return;
    for (var i = 0; i < purrNodes.length; i++) {
      try { purrNodes[i].stop(); } catch (e) { /* allerede stoppet */ }
    }
    purrNodes = null;
  }

  /* ---- oscilloskop ---- */

  var scope = $("scope"), sctx = scope.getContext("2d");

  function scopeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue("--blue-deep").trim() || "#4c6b90";
  }

  function flatLine() {
    var w = scope.width, h = scope.height;
    sctx.clearRect(0, 0, w, h);
    sctx.strokeStyle = scopeColor();
    sctx.globalAlpha = 0.35;
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2);
    sctx.stroke();
    sctx.globalAlpha = 1;
  }

  function drawScope() {
    if (!analyser) return;
    var bufLen = analyser.fftSize;
    var arr = new Uint8Array(bufLen);
    var w = scope.width, h = scope.height;

    (function loop() {
      if (!purrNodes) { flatLine(); scopeRAF = null; return; }
      scopeRAF = requestAnimationFrame(loop);
      analyser.getByteTimeDomainData(arr);
      sctx.clearRect(0, 0, w, h);
      sctx.lineWidth = 2.5;
      sctx.strokeStyle = scopeColor();
      sctx.beginPath();
      var slice = w / bufLen, x = 0;
      for (var i = 0; i < bufLen; i++) {
        // Forsterk utslaget litt så malingen faktisk synes
        var y = h / 2 + ((arr[i] - 128) / 128) * (h / 2) * 2.6;
        y = Math.max(2, Math.min(h - 2, y));
        if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
        x += slice;
      }
      sctx.stroke();
    })();
  }

  function sleepyZs(seconds) {
    if (reduceMotion) return;
    var wrap = document.querySelector(".face-wrap");
    if (!wrap) return;
    var n = 0;
    var iv = setInterval(function () {
      if (++n > seconds * 1.5) { clearInterval(iv); return; }
      var z = document.createElement("span");
      z.textContent = "💤";
      z.style.cssText = "position:absolute;right:12%;top:35%;font-size:" + (16 + Math.random() * 14) +
        "px;pointer-events:none;z-index:3;transition:transform 2.6s ease-out, opacity 2.6s ease-out;";
      wrap.appendChild(z);
      requestAnimationFrame(function () {
        z.style.transform = "translate(" + (Math.random() * 60 - 10) + "px,-90px) rotate(" +
          (Math.random() * 40 - 20) + "deg)";
        z.style.opacity = "0";
      });
      setTimeout(function () { z.remove(); }, 2700);
    }, 650);
  }

  /* ---- selve sekvensen ---- */

  function stopSequence() {
    running = false;
    clearTimeout(seqTimer);
    if (synth) { try { synth.cancel(); } catch (e) { /* ignorer */ } }
    stopPurr();
    if (scopeRAF) { cancelAnimationFrame(scopeRAF); scopeRAF = null; }
    flatLine();
    clearSpots();
    startBtn.classList.remove("running");
    startLabel.textContent = "Start motoren";
    subtitle.textContent = "Motoren er slått av.";
    subtitleNo.textContent = "";
  }

  function runStep(i) {
    if (!running) return;
    if (i >= STEPS.length) {
      subtitle.textContent = "Motoren går. 🐾";
      subtitleNo.textContent = "Ingen kjente feil.";
      running = false;
      startBtn.classList.remove("running");
      startLabel.textContent = "Kjør igjen";
      setTimeout(clearSpots, 1500);
      return;
    }
    var s = STEPS[i];
    setSpot(s.spot);
    subtitle.textContent = "“" + s.en + "”";
    subtitleNo.textContent = s.no;

    // Hver replikk skal stå lenge nok til å leses, også når nettleseren
    // mangler stemmer og talesyntesen returnerer med én gang.
    var shownAt = Date.now();
    var minMs = Math.max(1500, s.en.length * 70);

    speak(s.en, function () {
      if (!running) return;
      var wait = Math.max(380, minMs - (Date.now() - shownAt));
      seqTimer = setTimeout(function () {
        if (!running) return;
        if (s.purr) {
          subtitle.textContent = "“" + s.en + "” 💤";
          subtitleNo.textContent = "… lyden av en sovende katt.";
          purr(7, function () { runStep(i + 1); });
        } else {
          runStep(i + 1);
        }
      }, wait);
    });
  }

  startBtn.addEventListener("click", function () {
    if (running) { stopSequence(); return; }
    running = true;
    startBtn.classList.add("running");
    startLabel.textContent = "Stopp";
    // Klikket er brukergesten som låser opp både lyd og tale.
    if (!ac) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { ac = new Ctx(); }
    }
    if (ac && ac.state === "suspended") ac.resume();
    runStep(0);
  });

  // Markørene kan også trykkes hver for seg
  Array.prototype.forEach.call(document.querySelectorAll(".hot, .spec"), function (el) {
    el.addEventListener("click", function () {
      if (running) return;
      var n = +el.dataset.spot;
      var step = STEPS[n - 1];
      setSpot(n);
      if (step) {
        subtitle.textContent = "“" + step.en + "”";
        subtitleNo.textContent = step.no;
      }
    });
  });

  /* ===================== GALLERI ===================== */

  var lb = $("lightbox"), lbImg = $("lb-img"), lbCap = $("lb-cap"), lastFocus = null;

  function openLightbox(btn) {
    lastFocus = btn;
    lbImg.src = btn.dataset.full;
    lbImg.alt = btn.querySelector("img").alt;
    lbCap.textContent = btn.dataset.caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("lb-close").focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".shot"), function (btn) {
    btn.addEventListener("click", function () { openLightbox(btn); });
  });
  $("lb-close").addEventListener("click", closeLightbox);
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.tagName === "FIGURE") closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!lb.hidden) closeLightbox();
      else if (running) stopSequence();
    }
  });

  /* ===================== PYNT OG OPPSTART ===================== */

  function scatterPaws() {
    if (reduceMotion) return;
    var field = $("pawField"), marks = ["🐾", "🐾", "✨"];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("span");
      s.textContent = marks[i % marks.length];
      s.style.left = (Math.random() * 100) + "vw";
      s.style.bottom = "-40px";
      s.style.fontSize = (14 + Math.random() * 16) + "px";
      s.style.animationDuration = (18 + Math.random() * 22) + "s";
      s.style.animationDelay = (-Math.random() * 30) + "s";
      field.appendChild(s);
    }
  }

  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    function showAll() {
      Array.prototype.forEach.call(els, function (el) { el.classList.add("in"); });
    }
    if (!("IntersectionObserver" in window) || reduceMotion) { showAll(); return; }

    // Skjul først nå — da er innholdet synlig hvis skriptet aldri kjører.
    document.documentElement.classList.add("js-reveal");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });

    // Sikkerhetsnett: ingenting skal bli stående usynlig.
    setTimeout(showAll, 6000);
  }

  renderAge();
  tick();
  setInterval(tick, 1000);
  setInterval(renderAge, 60000);
  scatterPaws();
  setupReveal();
  flatLine();

  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    voiceHint.textContent = "Nettleseren din har ikke talesyntese — teksten vises i stedet.";
  } else {
    voiceHint.textContent = "Skru på lyden 🔊";
    // Chrome laster stemmelisten asynkront.
    if (synth.getVoices().length === 0 && "onvoiceschanged" in synth) {
      synth.onvoiceschanged = function () { synth.onvoiceschanged = null; };
    }
  }
})();
