/* =========================================================
   Bella i 3D — bygget av primitiver, ingen modellfil.

   Positur: sittende katt, sett fra siden vender ansiktet mot +X.
   Målene er i meter, så hun blir på størrelse med en ekte katt
   når hun settes ned i AR (ca. 45 cm til issen, 52 cm til ørene).
   ========================================================= */

import * as THREE from "./vendor/three.module.min.js";

var FUR_LIGHT = 0xf4f2f0;   // den hvite pelsen
var FUR_GREY = 0xb4bbc4;    // sølvgrå masken
var PINK = 0xe8a0a8;
var IRIS = 0x7d6a3a;        // grønnbrune øyne

function mat(color, rough) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: rough === undefined ? 0.92 : rough,
    metalness: 0.0
  });
}

function sphere(r, color, seg) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 24, seg || 18), mat(color));
}

/* Litt ujevn kule — gir pelsen et mykt preg uten hår-geometri.

   Om en flate skal ligge utenpå en annen (den grå masken over skallen),
   må begge ha samme støy i samme retning. Derfor regnes støyen ut fra
   retningen, og en eventuell rotasjon påføres geometrien FØR støyen —
   roteres meshen etterpå, forskyves mønsteret og den innerste pelsen
   stikker gjennom i flekker. */
function fluffyGeo(r, amount, seg, phiLength, preRotZ) {
  var geo = new THREE.SphereGeometry(
    r, seg || 28, seg || 22,
    0, Math.PI * 2,
    0, phiLength === undefined ? Math.PI : phiLength
  );
  if (preRotZ) geo.rotateZ(preRotZ);
  var pos = geo.attributes.position;
  var v = new THREE.Vector3();
  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Støyen regnes ut fra retningen, ikke posisjonen. Da får to
    // kuler med ulik radius nøyaktig samme mønster, og den ytterste
    // dekker alltid den innerste i stedet for å flekke seg.
    var len = v.length() || 1;
    var dx = v.x / len, dy = v.y / len, dz = v.z / len;
    var n = Math.sin(dx * 9) * Math.cos(dy * 7.5) * Math.sin(dz * 8.5);
    v.multiplyScalar(1 + n * (amount === undefined ? 0.05 : amount));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function fluffySphere(r, color, amount, seg) {
  return new THREE.Mesh(fluffyGeo(r, amount, seg), mat(color));
}

export function createBella() {
  var root = new THREE.Group();
  var rig = new THREE.Group();
  root.add(rig);

  /* ---------- kropp: sittende, tyngden bak ---------- */

  // Bakpart / lår — det hun sitter på
  var haunch = fluffySphere(0.150, FUR_LIGHT, 0.05);
  haunch.scale.set(0.95, 1.02, 1.05);
  haunch.position.set(-0.030, 0.150, 0);
  rig.add(haunch);

  // Bryst, høyere og lenger fram
  var chest = fluffySphere(0.118, FUR_LIGHT, 0.05);
  chest.scale.set(0.92, 1.20, 0.95);
  chest.position.set(0.060, 0.235, 0);
  rig.add(chest);

  // Skuldre, binder bryst og hode sammen
  var neck = fluffySphere(0.088, FUR_LIGHT, 0.05, 20);
  neck.scale.set(1.0, 0.9, 1.0);
  neck.position.set(0.062, 0.320, 0);
  rig.add(neck);

  /* ---------- forbein: rette søyler ned til gulvet ---------- */

  function frontLeg(z) {
    var g = new THREE.Group();
    var leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.033, 0.145, 6, 14), mat(FUR_LIGHT));
    leg.position.y = 0.108;
    g.add(leg);
    var foot = sphere(0.040, FUR_LIGHT, 18);
    foot.scale.set(1.35, 0.75, 1.0);
    foot.position.set(0.013, 0.028, 0);
    g.add(foot);
    g.position.set(0.108, 0, z);
    return g;
  }
  rig.add(frontLeg(0.056), frontLeg(-0.056));

  // Bakpotene stikker så vidt fram under bakparten
  function hindPaw(z) {
    var m = sphere(0.048, FUR_LIGHT, 18);
    m.scale.set(1.5, 0.6, 1.0);
    m.position.set(0.045, 0.030, z);
    return m;
  }
  rig.add(hindPaw(0.105), hindPaw(-0.105));

  /* ---------- hale: svinger rundt på gulvet ---------- */

  // Halen ligger langs gulvet og svinger rundt siden hennes, slik
  // katter legger den når de sitter.
  var tail = new THREE.Group();
  var tailSegs = [];
  var prev = tail;
  var TAIL_CURL = 0.26;
  for (var i = 0; i < 8; i++) {
    var seg = new THREE.Group();
    var m = fluffySphere(0.038 - i * 0.0020, i > 5 ? FUR_GREY : FUR_LIGHT, 0.07, 14);
    m.position.x = 0.038;
    seg.add(m);
    seg.position.x = i === 0 ? 0 : 0.043;
    seg.rotation.y = TAIL_CURL;   // krøller seg jevnt rundt
    prev.add(seg);
    tailSegs.push(seg);
    prev = seg;
  }
  // Starter bak på høyre side og sveiper framover rundt henne
  tail.position.set(-0.115, 0.042, 0.075);
  tail.rotation.y = -1.15;
  rig.add(tail);

  /* ---------- hode ---------- */

  var head = new THREE.Group();
  head.position.set(0.068, 0.378, 0);
  rig.add(head);

  var SKULL_R = 0.105;
  var skull = new THREE.Mesh(fluffyGeo(SKULL_R, 0.045, 32), mat(FUR_LIGHT));
  skull.scale.set(1.0, 0.97, 1.04);
  head.add(skull);

  // Sølvgrå maske over issen. Samme støyfrekvens som skallen og litt
  // større radius, ellers stikker den hvite pelsen gjennom i flekker.
  var mask = new THREE.Mesh(
    fluffyGeo(SKULL_R * 1.03, 0.045, 32, Math.PI * 0.44, 0.22),
    mat(FUR_GREY)
  );
  mask.scale.set(1.0, 0.97, 1.04);
  head.add(mask);

  // Kinnskjegg — det som gjør henne rund i fjeset
  function cheek(z) {
    var c = fluffySphere(0.058, FUR_LIGHT, 0.10, 18);
    c.scale.set(0.9, 0.95, 1.0);
    c.position.set(0.040, -0.028, z);
    return c;
  }
  head.add(cheek(0.062), cheek(-0.062));

  // Snute
  var muzzle = sphere(0.046, FUR_LIGHT, 22);
  muzzle.scale.set(0.92, 0.70, 1.05);
  muzzle.position.set(0.078, -0.026, 0);
  head.add(muzzle);

  var nose = sphere(0.0145, PINK, 16);
  nose.scale.set(0.75, 0.85, 1.15);
  nose.position.set(0.117, -0.012, 0);
  head.add(nose);

  /* ---------- kjeve: åpner seg når hun snakker ---------- */

  var jaw = new THREE.Group();
  jaw.position.set(0.052, -0.044, 0);
  head.add(jaw);

  var chin = sphere(0.040, FUR_LIGHT, 20);
  chin.scale.set(0.95, 0.62, 1.02);
  chin.position.set(0.026, -0.010, 0);
  jaw.add(chin);

  // Innsiden av munnen, synlig først når kjeven går ned
  var mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x8d4a52, roughness: 1 })
  );
  mouth.scale.set(0.75, 0.6, 0.85);
  mouth.position.set(0.042, 0.006, 0);
  jaw.add(mouth);

  /* ---------- ører ---------- */

  function ear(z) {
    var g = new THREE.Group();
    var outer = new THREE.Mesh(new THREE.ConeGeometry(0.050, 0.108, 18), mat(FUR_GREY));
    g.add(outer);
    var inner = new THREE.Mesh(new THREE.ConeGeometry(0.030, 0.074, 16), mat(PINK));
    inner.position.set(0.014, -0.006, 0);
    g.add(inner);
    g.position.set(-0.010, 0.100, z);
    g.rotation.x = z > 0 ? 0.30 : -0.30;
    g.rotation.z = -0.10;
    return g;
  }
  var earL = ear(0.058), earR = ear(-0.058);
  head.add(earL, earR);

  /* ---------- øyne ---------- */

  function makeEye(z) {
    var g = new THREE.Group();
    var white = sphere(0.029, 0xf7f5f3, 20);
    g.add(white);
    var iris = sphere(0.021, IRIS, 18);
    iris.position.x = 0.014;
    g.add(iris);
    var pupil = sphere(0.0105, 0x141009, 14);
    pupil.position.x = 0.025;
    g.add(pupil);
    var glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(0.027, 0.009, 0.008);
    g.add(glint);
    g.position.set(0.068, 0.016, z);
    // Blunk gjøres ved å klemme øyet flatt — en egen øyelokk-kule
    // ville stukket ut av pelsen.
    return { group: g };
  }
  var eyeL = makeEye(0.046), eyeR = makeEye(-0.046);
  head.add(eyeL.group, eyeR.group);

  /* ---------- værhår ---------- */

  var whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  [0.022, 0.0, -0.022].forEach(function (dy) {
    [1, -1].forEach(function (side) {
      var pts = [
        new THREE.Vector3(0.088, -0.020 + dy * 0.4, side * 0.028),
        new THREE.Vector3(0.130, -0.008 + dy, side * 0.090),
        new THREE.Vector3(0.150, 0.006 + dy * 1.5, side * 0.145)
      ];
      head.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), whiskerMat));
    });
  });

  /* ---------- skygge ---------- */

  var shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.23, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-0.01, 0.003, 0);
  shadow.scale.set(1.25, 1, 1);
  root.add(shadow);

  /* =========================================================
     Animasjon
     ========================================================= */

  var state = {
    talking: 0,
    listening: false,
    blink: 0,
    blinkTimer: 1 + Math.random() * 3,
    lookAt: new THREE.Vector2(0, 0),
    t: Math.random() * 10
  };

  function update(dt) {
    state.t += dt;
    var t = state.t;

    // Pust
    var breath = Math.sin(t * 1.7) * 0.5 + 0.5;
    chest.scale.x = 0.92 + breath * 0.035;
    chest.scale.z = 0.95 + breath * 0.035;
    haunch.scale.y = 1.02 + breath * 0.015;

    // Hale — svinger raskere når hun er engasjert
    var speed = state.listening ? 2.4 : 1.4;
    var amp = state.listening ? 0.16 : 0.09;
    for (var i = 0; i < tailSegs.length; i++) {
      tailSegs[i].rotation.y = TAIL_CURL + Math.sin(t * speed - i * 0.5) * amp;
      tailSegs[i].rotation.z = Math.cos(t * speed * 0.8 - i * 0.4) * amp * 0.4;
    }

    // Hodet følger blikket, med litt egenbevegelse
    var yaw = state.lookAt.x * 0.45 + Math.sin(t * 0.5) * 0.05;
    var pitch = -state.lookAt.y * 0.28 + Math.sin(t * 0.73) * 0.03;
    head.rotation.y += (yaw - head.rotation.y) * Math.min(1, dt * 4);
    head.rotation.z += (pitch - head.rotation.z) * Math.min(1, dt * 4);
    // Nysgjerrig hodetilt når hun lytter
    var roll = state.listening ? Math.sin(t * 0.9) * 0.12 + 0.09 : 0;
    head.rotation.x += (roll - head.rotation.x) * Math.min(1, dt * 3);

    // Ørene spisser seg når hun lytter
    var earT = state.listening ? -0.22 : -0.10;
    earL.rotation.z += ((earT + Math.sin(t * 3.1) * 0.025) - earL.rotation.z) * Math.min(1, dt * 5);
    earR.rotation.z += ((earT + Math.sin(t * 2.7 + 1) * 0.025) - earR.rotation.z) * Math.min(1, dt * 5);

    // Blunk
    state.blinkTimer -= dt;
    if (state.blinkTimer <= 0) { state.blink = 1; state.blinkTimer = 2.5 + Math.random() * 4; }
    if (state.blink > 0) state.blink = Math.max(0, state.blink - dt * 7);
    var open = 1 - state.blink * 0.9;
    eyeL.group.scale.y = open;
    eyeR.group.scale.y = open;

    // Kjeven: setTalking() kalles utenfra mens talesyntesen kjører
    // Negativ rotasjon rundt Z: framsiden av kjeven (+X) svinger ned (-Y).
    var openTarget = -state.talking * 0.42;
    jaw.rotation.z += (openTarget - jaw.rotation.z) * Math.min(1, dt * 22);
    muzzle.scale.y = 0.70 - Math.abs(jaw.rotation.z) * 0.12;

    // Liten vekt-forskyvning så hun ikke står helt død
    rig.rotation.z = Math.sin(t * 0.6) * 0.012;
  }

  return {
    group: root,
    head: head,
    update: update,
    setTalking: function (v) { state.talking = Math.max(0, Math.min(1, v)); },
    setListening: function (v) { state.listening = !!v; },
    lookAt: function (x, y) { state.lookAt.set(x, y); },
    blink: function () { state.blink = 1; }
  };
}
