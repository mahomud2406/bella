/* =========================================================
   AR-modus: Bella på gulvet, med mikrofon og stemme.

   Tre nivåer, avhengig av hva enheten støtter:
   1) WebXR  — ekte gulvsporing med hit-test (Android/Chrome)
   2) Kamera — kamerabildet bak, Bella plasseres og flyttes med fingeren
   3) 3D     — uten kamera, hvis brukeren sier nei eller det mangler
   ========================================================= */

import * as THREE from "./vendor/three.module.min.js";
import { createBella } from "./bella3d.js";
import * as Brain from "./brain.js";

/* ---------------- elementer ---------------- */

var $ = function (id) { return document.getElementById(id); };

var intro = $("intro"), hud = $("hud"), settings = $("settings");
var camEl = $("cam"), canvas = $("scene");
var bubble = $("bubble"), bubbleText = $("bubbleText");
var heard = $("heard"), heardText = $("heardText");
var statusEl = $("status"), placeHint = $("placeHint");
var micBtn = $("micBtn"), micIco = $("micIco");

/* ---------------- 3D ---------------- */

var renderer, scene, camera, bella, reticle, clock;
var mode = "plain";           // 'xr' | 'camera' | 'plain'
var placed = false;
var talking = false;
var talkUntil = 0;            // brukes når vi må late som hun snakker

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 40);
  camera.position.set(0, 1.05, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f9a, 2.2));
  var key = new THREE.DirectionalLight(0xfff6e8, 1.6);
  key.position.set(2, 4, 2);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xcfe0ff, 0.7);
  rim.position.set(-2, 2, -3);
  scene.add(rim);

  bella = createBella();
  bella.group.visible = false;
  scene.add(bella.group);

  // Ring som viser hvor hun havner (WebXR)
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.10, 0.13, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  reticle.visible = false;
  reticle.matrixAutoUpdate = false;
  scene.add(reticle);

  clock = new THREE.Clock();
  window.addEventListener("resize", onResize);
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function placeBella(x, y, z) {
  bella.group.position.set(x, y, z);
  bella.group.visible = true;
  placed = true;
  placeHint.hidden = true;
  faceTheCamera();
  // Utenfor WebXR står kameraet stille, så vi sikter det mot henne.
  // Ellers havner hun nederst i bildet, halvveis bak knapperaden.
  if (mode !== "xr") aimCameraAt(bella.group.position);
}

function aimCameraAt(target) {
  camera.lookAt(target.x, target.y + 0.42, target.z);
}

function faceTheCamera() {
  var dx = camera.position.x - bella.group.position.x;
  var dz = camera.position.z - bella.group.position.z;
  bella.group.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
}

/* ---------------- animasjonssløyfe ---------------- */

function frame(time, xrFrame) {
  var dt = Math.min(clock.getDelta(), 0.05);

  if (mode === "xr" && xrFrame) updateHitTest(xrFrame);

  if (bella) {
    // Munnen beveger seg så lenge hun "snakker"
    var isTalking = talking || performance.now() < talkUntil;
    if (isTalking) {
      var t = clock.elapsedTime;
      var v = (Math.sin(t * 19) * 0.5 + 0.5) * (Math.sin(t * 7.3) * 0.32 + 0.68);
      bella.setTalking(v);
    } else {
      bella.setTalking(0);
    }
    if (placed) faceTheCameraSoft(dt);
    bella.update(dt);
  }

  renderer.render(scene, camera);
}

function faceTheCameraSoft(dt) {
  var dx = camera.position.x - bella.group.position.x;
  var dz = camera.position.z - bella.group.position.z;
  var target = Math.atan2(dx, dz) - Math.PI / 2;
  var cur = bella.group.rotation.y;
  var diff = ((target - cur + Math.PI) % (Math.PI * 2)) - Math.PI;
  bella.group.rotation.y = cur + diff * Math.min(1, dt * 2);
}

/* ---------------- WebXR ---------------- */

var xrHitSource = null, xrRefSpace = null;

async function startXR() {
  var session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "light-estimation"],
    domOverlay: { root: hud }
  });

  renderer.xr.enabled = true;
  await renderer.xr.setSession(session);
  mode = "xr";

  xrRefSpace = await session.requestReferenceSpace("local");
  var viewerSpace = await session.requestReferenceSpace("viewer");
  xrHitSource = await session.requestHitTestSource({ space: viewerSpace });

  session.addEventListener("select", function () {
    if (reticle.visible) {
      var p = new THREE.Vector3().setFromMatrixPosition(reticle.matrix);
      placeBella(p.x, p.y, p.z);
    }
  });

  session.addEventListener("end", function () {
    xrHitSource = null;
    renderer.xr.enabled = false;
    endSession();
  });

  renderer.setAnimationLoop(frame);
  setStatus("Rett kameraet mot gulvet, og trykk.");
}

function updateHitTest(xrFrame) {
  if (!xrHitSource) return;
  var results = xrFrame.getHitTestResults(xrHitSource);
  if (results.length && !placed) {
    var pose = results[0].getPose(xrRefSpace);
    reticle.visible = true;
    reticle.matrix.fromArray(pose.transform.matrix);
  } else {
    reticle.visible = false;
  }
  // Kameraposisjonen i XR ligger i renderer.xr sitt kamera
  var xrCam = renderer.xr.getCamera();
  camera.position.copy(xrCam.position);
}

/* ---------------- kameramodus ---------------- */

async function startCamera() {
  var stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false
  });
  camEl.srcObject = stream;
  camEl.classList.add("on");
  await camEl.play().catch(function () { /* autoplay-detaljer */ });
  mode = "camera";
  startPlainLoop();
  // Bella settes ned et par meter foran, på gulvet
  placeBella(0, 0, -2.6);
  placeHint.hidden = false;
  placeHint.textContent = "Dra Bella dit du vil ha henne — knip for å endre størrelse";
  setTimeout(function () { placeHint.hidden = true; }, 5000);
}

function startPlainLoop() {
  renderer.setAnimationLoop(frame);
}

function startPlain() {
  mode = "plain";
  scene.background = null;
  document.body.style.background =
    "radial-gradient(70vw 60vh at 50% 30%, #26303f, #0b0d12 70%)";
  startPlainLoop();
  placeBella(0, 0, -2.6);
  placeHint.hidden = true;
}

/* ---- dra for å flytte, knip for å skalere (kamera- og 3D-modus) ---- */

var ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();
var dragging = false, pinchStart = 0, scaleStart = 1;

function pointToFloor(clientX, clientY, out) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray.intersectPlane(ground, out) ? out : null;
}

function onTouchStart(e) {
  if (mode === "xr" || !placed) return;
  if (e.touches && e.touches.length === 2) {
    pinchStart = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    scaleStart = bella.group.scale.x;
    dragging = false;
  } else {
    dragging = true;
  }
}

function onTouchMove(e) {
  if (mode === "xr" || !placed) return;
  if (e.touches && e.touches.length === 2 && pinchStart) {
    var d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    var s = Math.max(0.35, Math.min(3, scaleStart * (d / pinchStart)));
    bella.group.scale.setScalar(s);
    e.preventDefault();
    return;
  }
  if (!dragging) return;
  var pt = (e.touches && e.touches[0]) || e;
  var hit = pointToFloor(pt.clientX, pt.clientY, new THREE.Vector3());
  if (hit) {
    // Hold henne på rimelig avstand så hun ikke havner i fanget på kameraet
    var dist = Math.hypot(hit.x - camera.position.x, hit.z - camera.position.z);
    if (dist > 0.7 && dist < 12) {
      bella.group.position.set(hit.x, 0, hit.z);
      aimCameraAt(bella.group.position);
    }
  }
  e.preventDefault();
}

function onTouchEnd() { dragging = false; pinchStart = 0; }

canvas.addEventListener("touchstart", onTouchStart, { passive: true });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });
canvas.addEventListener("touchend", onTouchEnd);
canvas.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse") onTouchStart(e); });
canvas.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" && dragging) onTouchMove(e); });
canvas.addEventListener("pointerup", onTouchEnd);

/* ---------------- tale ut ---------------- */

var synth = window.speechSynthesis;
var voicesReady = false;

function loadVoices() {
  if (!synth) return [];
  var v = synth.getVoices();
  if (v.length) voicesReady = true;
  return v;
}
if (synth && "onvoiceschanged" in synth) {
  synth.onvoiceschanged = function () { loadVoices(); };
}
loadVoices();

function pickVoice(langTag) {
  var voices = loadVoices();
  var base = langTag.split("-")[0];
  var i;
  for (i = 0; i < voices.length; i++) if (voices[i].lang.replace("_", "-") === langTag) return voices[i];
  for (i = 0; i < voices.length; i++) if (voices[i].lang.toLowerCase().indexOf(base) === 0) return voices[i];
  // Norsk: nynorsk og "no" er gode nok erstatninger for nb
  if (base === "nb") {
    for (i = 0; i < voices.length; i++) if (/^(no|nn|nb)/i.test(voices[i].lang)) return voices[i];
  }
  return null;
}

function speak(text, lang) {
  return new Promise(function (resolve) {
    var tag = lang === "ar" ? "ar-SA" : "nb-NO";
    // Uansett om det finnes stemme: la munnen gå, så det ser ut som hun svarer.
    var estimate = Math.max(1400, text.length * 78);

    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      talkUntil = performance.now() + estimate;
      setTimeout(resolve, estimate);
      return;
    }

    var voice = pickVoice(tag);
    if (!voice && lang === "ar") {
      setStatus("Enheten har ingen arabisk stemme — svaret vises som tekst.");
    }

    var u = new SpeechSynthesisUtterance(text);
    u.lang = tag;
    if (voice) u.voice = voice;
    u.rate = lang === "ar" ? 0.95 : 1.0;
    u.pitch = 1.2;

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      talking = false;
      clearTimeout(guard);
      resolve();
    }

    talking = true;
    u.onend = finish;
    u.onerror = finish;
    // Sikkerhetsventil: noen nettlesere fyrer aldri onend.
    var guard = setTimeout(finish, estimate + 4000);

    try { synth.speak(u); } catch (e) { finish(); }
  });
}

/* ---------------- tale inn ---------------- */

var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
var rec = null, micOn = false, micWanted = true, recLang = "nb-NO", restarting = false;
var micFails = 0;   // teller sammenhengende feil, så vi ikke restarter i evig løkke

function initRecognition() {
  if (!SR) {
    micBtn.disabled = true;
    micBtn.classList.add("off");
    setStatus("Nettleseren støtter ikke taleinput — skriv til henne i stedet.");
    return false;
  }
  rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = recLang;

  rec.onresult = function (e) {
    var interim = "", final = "";
    for (var i = e.resultIndex; i < e.results.length; i++) {
      var r = e.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    micFails = 0;
    if (interim) showHeard(interim);
    if (final.trim()) {
      showHeard(final);
      handleInput(final.trim());
    }
  };

  rec.onerror = function (e) {
    // "no-speech" betyr bare stillhet, og "aborted" er vi som stoppet selv.
    if (e.error === "no-speech" || e.error === "aborted") return;

    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      micWanted = false;
      setMicUI(false);
      setStatus("Mikrofonen er blokkert. Du kan skrive til Bella i stedet.");
      return;
    }

    // Alt annet (ingen mikrofon, nettverksfeil) kan gjenta seg i det
    // uendelige. Gi opp etter noen forsøk i stedet for å restarte evig.
    micFails++;
    if (micFails >= 3) {
      micWanted = false;
      setMicUI(false);
      setStatus("Får ikke brukt mikrofonen (" + e.error + "). Skriv til Bella i stedet.");
    } else {
      setStatus("Mikrofonfeil: " + e.error + " — prøver igjen.");
    }
  };

  rec.onend = function () {
    micOn = false;
    // Kontinuerlig lytting: start igjen med mindre vi selv slo av,
    // eller Bella snakker akkurat nå (så hun ikke hører seg selv).
    if (micWanted && !talking && !restarting) {
      restarting = true;
      setTimeout(function () { restarting = false; startMic(); }, 250);
    }
    setMicUI(micWanted && micOn);
  };
  return true;
}

function startMic() {
  if (!rec || !micWanted || micOn || talking) return;
  try {
    rec.lang = recLang;
    rec.start();
    micOn = true;
    setMicUI(true);
  } catch (e) {
    // start() kaster hvis den allerede kjører — det er greit
    micOn = true;
  }
}

function stopMic() {
  if (!rec) return;
  try { rec.stop(); } catch (e) { /* ignorer */ }
  micOn = false;
  setMicUI(false);
}

function setMicUI(live) {
  micBtn.classList.toggle("live", !!live);
  micBtn.classList.toggle("off", !micWanted);
  micBtn.setAttribute("aria-pressed", micWanted ? "true" : "false");
  micIco.textContent = micWanted ? "🎤" : "🔇";
}

micBtn.addEventListener("click", function () {
  micWanted = !micWanted;
  if (micWanted) { micFails = 0; setStatus("Mikrofonen er på — bare snakk."); startMic(); }
  else { setStatus("Mikrofonen er av."); stopMic(); }
  setMicUI(micWanted && micOn);
});

/* ---------------- samtale ---------------- */

var history = [];
var busy = false;

function showHeard(t) {
  heardText.textContent = t;
  heard.hidden = false;
}

function showBubble(text, lang) {
  bubbleText.textContent = text;
  bubbleText.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  bubble.hidden = false;
}

function setStatus(t) { statusEl.textContent = t || ""; }

async function handleInput(text) {
  if (busy || !text) return;
  busy = true;

  // Slå av mikrofonen mens hun svarer, ellers hører hun sin egen stemme
  stopMic();
  bella.setListening(false);
  setStatus("Bella tenker …");

  var res;
  try {
    res = await Brain.reply(text, history);
  } catch (e) {
    res = { text: "Mjau … noe gikk galt her.", lang: "no", source: "local" };
  }

  history.push({ role: "user", text: text });
  history.push({ role: "model", text: res.text });
  if (history.length > 20) history = history.slice(-20);

  showBubble(res.text, res.lang);
  setStatus(res.warning ? "AI-en svarte ikke (" + res.warning + ") — bruker innebygd hjerne."
    : (res.source === "ai" ? "Svarte via AI" : ""));

  await speak(res.text, res.lang);

  busy = false;
  bella.setListening(true);
  if (micWanted) startMic();
}

$("sayForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var input = $("sayInput");
  var v = input.value.trim();
  if (!v) return;
  input.value = "";
  showHeard(v);
  handleInput(v);
});

/* språkvalg for mikrofonen */
Array.prototype.forEach.call(document.querySelectorAll(".lang"), function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".lang").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    recLang = btn.dataset.lang;
    setStatus(recLang === "ar-SA" ? "Mikrofonen lytter etter arabisk." : "Mikrofonen lytter etter norsk.");
    if (micWanted) { stopMic(); setTimeout(startMic, 300); }
  });
});

/* ---------------- oppstart ---------------- */

function showHud() {
  intro.hidden = true;
  hud.hidden = false;
  bella.setListening(true);
  if (initRecognition() && micWanted) startMic();
  setTimeout(function () {
    var greet = "Hei! Jeg er Bella. Si noe til meg.";
    showBubble(greet, "no");
    speak(greet, "no").then(function () { if (micWanted) startMic(); });
  }, 800);
}

function endSession() {
  micWanted = false;
  stopMic();
  if (synth) { try { synth.cancel(); } catch (e) { /* ignorer */ } }
  if (camEl.srcObject) {
    camEl.srcObject.getTracks().forEach(function (t) { t.stop(); });
    camEl.srcObject = null;
  }
  camEl.classList.remove("on");
  if (renderer) renderer.setAnimationLoop(null);
  hud.hidden = true;
  intro.hidden = false;
  placed = false;
  if (bella) bella.group.visible = false;
}

$("exitBtn").addEventListener("click", function () {
  if (mode === "xr" && renderer.xr.getSession()) renderer.xr.getSession().end();
  else endSession();
});

$("againBtn").addEventListener("click", function () {
  if (mode === "xr") {
    placed = false;
    bella.group.visible = false;
    placeHint.hidden = false;
    placeHint.textContent = "Rett kameraet mot gulvet og trykk for å sette ned Bella";
  } else {
    bella.group.position.set(0, 0, -2.6);
    aimCameraAt(bella.group.position);
    bella.group.scale.setScalar(1);
  }
});

$("enterAR").addEventListener("click", async function () {
  initSceneOnce();
  try {
    if (navigator.xr && await navigator.xr.isSessionSupported("immersive-ar")) {
      showHud();
      await startXR();
      return;
    }
  } catch (e) { /* faller videre til kamera */ }

  try {
    showHud();
    await startCamera();
  } catch (e) {
    setStatus("Fikk ikke tilgang til kameraet — viser Bella i 3D i stedet.");
    startPlain();
  }
});

$("enter3D").addEventListener("click", function () {
  initSceneOnce();
  showHud();
  startPlain();
});

var sceneReady = false;
function initSceneOnce() {
  if (sceneReady) return;
  initScene();
  sceneReady = true;
}

/* ---------------- innstillinger ---------------- */

function openSettings() {
  var s = Brain.getSettings();
  $("keyInput").value = s.key;
  $("modelInput").value = s.model;
  $("keyStatus").textContent = s.key
    ? "Nøkkel lagret i denne nettleseren. Bella svarer via AI."
    : "Ingen nøkkel lagret. Bella bruker den innebygde hjernen.";
  settings.hidden = false;
}
$("openSettings").addEventListener("click", openSettings);
$("settingsBtn").addEventListener("click", openSettings);
$("closeSettings").addEventListener("click", function () { settings.hidden = true; });
$("saveKey").addEventListener("click", function () {
  Brain.saveSettings($("keyInput").value.trim(), $("modelInput").value.trim() || "gemini-2.5-flash");
  $("keyStatus").textContent = Brain.hasKey()
    ? "Lagret. Bella svarer nå via AI."
    : "Ingen nøkkel lagret — Bella bruker den innebygde hjernen.";
});
$("clearKey").addEventListener("click", function () {
  Brain.saveSettings("", $("modelInput").value.trim());
  $("keyInput").value = "";
  $("keyStatus").textContent = "Nøkkelen er slettet.";
});

/* ---------------- støtteinfo på startskjermen ---------------- */

(async function () {
  var notes = [];
  var xrOk = false;
  try { xrOk = !!(navigator.xr && await navigator.xr.isSessionSupported("immersive-ar")); } catch (e) { /* nei */ }

  if (xrOk) notes.push("Enheten din støtter ekte AR — Bella settes rett på gulvet.");
  else notes.push("Enheten din har ikke WebXR. Bella vises oppå kamerabildet, og du flytter henne med fingeren.");

  if (!SR) notes.push("Taleinput støttes ikke her (prøv Chrome) — du kan skrive til henne.");
  if (!window.speechSynthesis) notes.push("Ingen talesyntese — svarene vises som tekst.");

  $("supportNote").textContent = notes.join(" ");
})();
