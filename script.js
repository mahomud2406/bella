// Bella 🐾 — alder, nedtelling og bildevisning
(function () {
  "use strict";

  var BIRTH = new Date(2025, 1, 16, 0, 0, 0); // 16. februar 2025 (måned er 0-indeksert)

  var nf = new Intl.NumberFormat("nb-NO");

  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  /* ---------------- alder ---------------- */

  // Kalenderbasert differanse: år, måneder og dager.
  function ageParts(from, to) {
    var years = to.getFullYear() - from.getFullYear();
    var months = to.getMonth() - from.getMonth();
    var days = to.getDate() - from.getDate();

    if (days < 0) {
      months -= 1;
      // antall dager i måneden før "to"
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: years, months: months, days: days };
  }

  function catYears(totalYears) {
    if (totalYears < 1) return Math.round(totalYears * 15);
    if (totalYears < 2) return Math.round(15 + (totalYears - 1) * 9);
    return Math.round(24 + (totalYears - 2) * 4);
  }

  function renderAge() {
    var now = new Date();
    var p = ageParts(BIRTH, now);
    var totalDays = Math.floor((now - BIRTH) / 86400000);
    var totalYears = totalDays / 365.25;

    var bits = [];
    if (p.years) bits.push(plural(p.years, "år", "år"));
    if (p.months) bits.push(plural(p.months, "måned", "måneder"));
    bits.push(plural(p.days, "dag", "dager"));

    document.getElementById("age-main").textContent = bits.join(", ");
    document.getElementById("age-exact").textContent =
      "Bella ble født " + BIRTH.toLocaleDateString("nb-NO", {
        day: "numeric", month: "long", year: "numeric"
      }) + ".";

    document.getElementById("stat-days").textContent = nf.format(totalDays);
    document.getElementById("stat-naps").textContent = nf.format(totalDays * 5);
    document.getElementById("stat-cat").textContent = nf.format(catYears(totalYears));
  }

  /* ---------------- nedtelling ---------------- */

  function nextBirthday(now) {
    var d = new Date(now.getFullYear(), BIRTH.getMonth(), BIRTH.getDate(), 0, 0, 0);
    if (d <= now) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  function isBirthdayToday(now) {
    return now.getMonth() === BIRTH.getMonth() && now.getDate() === BIRTH.getDate();
  }

  var cdD = document.getElementById("cd-d");
  var cdH = document.getElementById("cd-h");
  var cdM = document.getElementById("cd-m");
  var cdS = document.getElementById("cd-s");
  var cdNote = document.getElementById("cd-note");
  var partyStarted = false;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var now = new Date();

    if (isBirthdayToday(now)) {
      var turns = now.getFullYear() - BIRTH.getFullYear();
      cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = "🎉";
      cdNote.textContent = "Gratulerer med dagen, Bella! " + turns + " år i dag! 🎂";
      cdNote.classList.add("party");
      if (!partyStarted) { partyStarted = true; confetti(); }
      return;
    }

    var target = nextBirthday(now);
    var diff = target - now;
    var d = Math.floor(diff / 86400000);
    var h = Math.floor(diff / 3600000) % 24;
    var m = Math.floor(diff / 60000) % 60;
    var s = Math.floor(diff / 1000) % 60;

    cdD.textContent = d;
    cdH.textContent = pad(h);
    cdM.textContent = pad(m);
    cdS.textContent = pad(s);
    cdNote.textContent =
      "Neste bursdag: " + target.toLocaleDateString("nb-NO", {
        day: "numeric", month: "long", year: "numeric"
      }) + " — da fyller hun " + (target.getFullYear() - BIRTH.getFullYear()) + " år.";
  }

  /* ---------------- konfetti (kun på bursdagen) ---------------- */

  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var emojis = ["🎉", "🎂", "🐾", "💛", "✨"];
    for (var i = 0; i < 40; i++) {
      (function (i) {
        var el = document.createElement("span");
        el.textContent = emojis[i % emojis.length];
        el.style.cssText =
          "position:fixed;top:-40px;z-index:60;pointer-events:none;font-size:" +
          (14 + Math.random() * 18) + "px;left:" + (Math.random() * 100) + "vw;" +
          "transition:transform 4s linear, opacity 4s linear;";
        document.body.appendChild(el);
        requestAnimationFrame(function () {
          el.style.transform = "translateY(110vh) rotate(" + (Math.random() * 720 - 360) + "deg)";
          el.style.opacity = "0";
        });
        setTimeout(function () { el.remove(); }, 4200);
      })(i);
    }
  }

  /* ---------------- lightbox ---------------- */

  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  var lastFocus = null;

  function openLightbox(btn) {
    lastFocus = btn;
    lbImg.src = btn.dataset.full;
    lbImg.alt = btn.querySelector("img").alt;
    lbCap.textContent = btn.dataset.caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
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

  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.tagName === "FIGURE") closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lb.hidden) closeLightbox();
  });

  /* ---------------- start ---------------- */

  renderAge();
  tick();
  setInterval(tick, 1000);
  // Oppdater alderen ved midnatt-ish, slik at siden holder seg riktig hvis den står åpen.
  setInterval(renderAge, 60000);
})();
