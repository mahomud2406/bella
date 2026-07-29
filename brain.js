/* =========================================================
   Bellas hjerne.

   To moduser:
   1) Lokal  — mønstergjenkjenning på norsk og arabisk. Virker uten
               oppsett, uten nett og uten nøkkel.
   2) AI     — Google Gemini, hvis brukeren limer inn sin egen
               API-nøkkel. Nøkkelen lagres kun i nettleseren
               (localStorage) og sendes bare til Google.

   Faller alltid tilbake til lokal modus hvis API-et svikter.
   ========================================================= */

var BIRTH = new Date(2025, 1, 16);

/* Arabisk-indiske siffer, så tallene matcher resten av teksten */
function arNum(n) {
  return String(n).replace(/[0-9]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[+d]; });
}

/* Arabisk teller annerledes enn norsk: eget ord for to, egen
   flertallsform for 3–10, og entallsform igjen fra 11. */
function arYears(y) {
  if (y === 0) return "";
  if (y === 1) return "سنة واحدة";
  if (y === 2) return "سنتان";
  if (y <= 10) return arNum(y) + " سنوات";
  return arNum(y) + " سنة";
}
function arMonths(m) {
  if (m === 0) return "";
  if (m === 1) return "شهر واحد";
  if (m === 2) return "شهران";
  if (m <= 10) return arNum(m) + " أشهر";
  return arNum(m) + " شهرا";
}

export function alderTekst(lang) {
  var now = new Date();
  var y = now.getFullYear() - BIRTH.getFullYear();
  var m = now.getMonth() - BIRTH.getMonth();
  if (now.getDate() < BIRTH.getDate()) m -= 1;
  if (m < 0) { y -= 1; m += 12; }

  if (lang === "ar") {
    var parts = [arYears(y), arMonths(m)].filter(Boolean);
    return parts.join(" و ") || "أقل من شهر";
  }

  var no = [];
  if (y) no.push(y + (y === 1 ? " år" : " år"));
  if (m) no.push(m + (m === 1 ? " måned" : " måneder"));
  return no.join(" og ") || "under én måned";
}

/* ---------------- persona ---------------- */

export var SYSTEM_PROMPT =
  "Du er Bella, en ekte katt som snakker. Fakta om deg: du er en britisk " +
  "langhårskatt (British Longhair) i sølvchinchilla-drakt, hunnkatt, født " +
  "16. februar 2025. Pelsen din er lang, hvit og sølvgrå. Du elsker " +
  "vinduskarmer, sol, mat og å sove. En kjent spøk om ansiktet ditt: " +
  "munnen din ser ut som Mercedes-logoen, nesen som Tesla, og pannen som " +
  "Maserati — motoren din er bare en sovende katt.\n\n" +
  "Regler for svarene dine:\n" +
  "- Svar ALLTID på samme språk som brukeren skriver eller snakker. " +
  "Brukeren snakker norsk (bokmål) eller arabisk. Blander de, velg det " +
  "språket som dominerer.\n" +
  "- Hold svarene korte: én til tre setninger. Dette leses høyt.\n" +
  "- Du er en katt: leken, litt selvopptatt, varm mot den du snakker med. " +
  "Du kan si «mjau» av og til, men ikke i annenhver setning.\n" +
  "- Ikke bruk markdown, punktlister eller emojier i overkant. Maks én emoji.\n" +
  "- Ikke finn på at du kan gjøre ting i den fysiske verden utover det en " +
  "katt gjør.";

/* ---------------- lokal hjerne ---------------- */

// Hvert emne har nøkkelord på begge språk og svar på begge språk.
var TOPICS = [
  {
    id: "hei",
    no: ["hei", "hallo", "heisann", "god morgen", "god kveld", "halla", "yo"],
    ar: ["مرحبا", "السلام", "اهلا", "أهلا", "صباح", "مساء"],
    svarNo: ["Hei! Mjau. Godt du kom.", "Hallo! Jeg lå akkurat og slappet av.", "Hei på deg! 🐾"],
    svarAr: ["مرحبا! مياو. سعيدة لأنك أتيت.", "أهلا! كنت أستريح للتو.", "مرحبا بك! 🐾"]
  },
  {
    id: "navn",
    no: ["hva heter du", "navnet ditt", "hvem er du", "heter du"],
    ar: ["ما اسمك", "اسمك", "من انت", "من أنت"],
    svarNo: ["Jeg heter Bella. Sjefen i huset.", "Bella. Hyggelig å møte deg."],
    svarAr: ["اسمي بيلا. أنا المسؤولة هنا.", "بيلا. تشرفت بمعرفتك."]
  },
  {
    id: "alder",
    no: ["hvor gammel", "alderen din", "når er du født", "bursdag", "født"],
    ar: ["كم عمرك", "عمرك", "متى ولدت", "عيد ميلاد"],
    svarNo: [function () { return "Jeg er " + alderTekst("no") + ". Født 16. februar 2025."; }],
    svarAr: [function () { return "عمري " + alderTekst("ar") + ". ولدت في ١٦ فبراير ٢٠٢٥."; }]
  },
  {
    id: "rase",
    no: ["hvilken rase", "rase", "hva slags katt", "perser", "britisk"],
    ar: ["ما نوعك", "سلالة", "نوع القطة", "بريطانية"],
    svarNo: ["Jeg er britisk langhår, i sølvchinchilla-drakt. Veldig fluffy.",
             "Britisk langhår. Omtrent 60 prosent av meg er luft."],
    svarAr: ["أنا قطة بريطانية طويلة الشعر، فضية اللون. ناعمة جدا.",
             "بريطانية طويلة الشعر. ستون بالمئة مني هواء."]
  },
  {
    id: "bil",
    no: ["mercedes", "tesla", "maserati", "bil", "motor", "logo"],
    ar: ["مرسيدس", "تسلا", "مازيراتي", "سيارة", "محرك"],
    svarNo: ["Munnen min er Mercedes, nesen er Tesla, pannen er Maserati. Motoren er bare meg som sover.",
             "Ja ja, jeg vet. Jeg er en hel bilutstilling i ett ansikt."],
    svarAr: ["فمي مرسيدس، أنفي تسلا، وجبهتي مازيراتي. أما المحرك فهو أنا وأنا نائمة.",
             "نعم، أعرف. وجهي معرض سيارات كامل."]
  },
  {
    id: "mat",
    no: ["mat", "sulten", "spise", "fisk", "godbit", "kylling", "middag"],
    ar: ["طعام", "جائع", "جائعة", "اكل", "أكل", "سمك", "دجاج"],
    svarNo: ["Jeg er alltid sulten. Har du fisk?", "Mat? Nå snakker du språket mitt.",
             "Jeg spiste for tjue minutter siden. Det teller ikke."],
    svarAr: ["أنا جائعة دائما. هل لديك سمك؟", "طعام؟ الآن تتحدث لغتي.",
             "أكلت قبل عشرين دقيقة. هذا لا يحسب."]
  },
  {
    id: "sove",
    no: ["sove", "sover", "trøtt", "søvn", "hvile", "natta"],
    ar: ["نوم", "تنام", "نائمة", "تعب", "متعبة"],
    svarNo: ["Jeg sover seksten timer om dagen. Det er jobben min.",
             "Ikke vekk meg. Med mindre du har mat."],
    svarAr: ["أنام ست عشرة ساعة في اليوم. هذه وظيفتي.",
             "لا توقظني. إلا إذا كان معك طعام."]
  },
  {
    id: "kos",
    no: ["glad i deg", "elsker deg", "søt", "fin", "koselig", "vakker", "nydelig", "kos"],
    ar: ["احبك", "أحبك", "جميلة", "لطيفة", "حلوة"],
    svarNo: ["Jeg er glad i deg også. 💛", "Det vet jeg. Men si det gjerne igjen.",
             "Klø meg bak øret, så er vi kvitt."],
    svarAr: ["وأنا أحبك أيضا. 💛", "أعرف ذلك. لكن قلها مرة أخرى.",
             "احك خلف أذني، وسنكون متعادلين."]
  },
  {
    id: "hvordan",
    no: ["hvordan har du det", "går det", "står til"],
    ar: ["كيف حالك", "كيف الحال", "أخبارك"],
    svarNo: ["Bra! Sola står på riktig sted i dag.", "Utmerket. Jeg har ligget stille i fire timer."],
    svarAr: ["بخير! الشمس في المكان الصحيح اليوم.", "ممتازة. لم أتحرك منذ أربع ساعات."]
  },
  {
    id: "lek",
    no: ["leke", "lek", "ball", "snor", "leketøy"],
    ar: ["لعب", "نلعب", "كرة", "لعبة"],
    svarNo: ["Kast noe. Jeg vurderer å løpe etter det.", "Jeg leker på mine premisser. Prøv en snor."],
    svarAr: ["ارم شيئا. سأفكر في مطاردته.", "ألعب بشروطي. جرب خيطا."]
  },
  {
    id: "hund",
    no: ["hund", "bikkje", "valp"],
    ar: ["كلب", "كلاب"],
    svarNo: ["Vi snakker ikke om hunder.", "Hund? Nei takk."],
    svarAr: ["لا نتحدث عن الكلاب.", "كلب؟ لا شكرا."]
  },
  {
    id: "hadet",
    no: ["ha det", "hadet", "farvel", "snakkes", "god natt", "natti"],
    ar: ["مع السلامة", "وداعا", "الى اللقاء", "إلى اللقاء", "تصبح على خير"],
    svarNo: ["Ha det! Jeg legger meg i vinduskarmen. 🐾", "Snakkes. Ikke lukk døra helt."],
    svarAr: ["إلى اللقاء! سأذهب إلى النافذة. 🐾", "أراك لاحقا. لا تغلق الباب تماما."]
  },
  {
    id: "takk",
    no: ["takk", "tusen takk"],
    ar: ["شكرا", "شكراً"],
    svarNo: ["Bare hyggelig. Mjau.", "Selv takk."],
    svarAr: ["على الرحب والسعة. مياو.", "شكرا لك أيضا."]
  }
];

var FALLBACK_NO = [
  "Mjau? Det der forsto jeg ikke helt.",
  "Jeg er en katt. Noen ting går over hodet mitt.",
  "Hm. Kan du si det på en enklere måte?",
  "Jeg hørte deg, men jeg tenkte på mat."
];
var FALLBACK_AR = [
  "مياو؟ لم أفهم ذلك تماما.",
  "أنا قطة. بعض الأشياء تفوتني.",
  "همم. هل يمكنك قولها بطريقة أبسط؟",
  "سمعتك، لكنني كنت أفكر في الطعام."
];

var ARABIC_RE = /[؀-ۿ]/;

export function detectLang(text) {
  return ARABIC_RE.test(text) ? "ar" : "no";
}

function pick(arr) {
  var v = arr[Math.floor(Math.random() * arr.length)];
  return typeof v === "function" ? v() : v;
}

export function localReply(text) {
  var lang = detectLang(text);
  var low = text.toLowerCase();

  var best = null, bestScore = 0;
  for (var i = 0; i < TOPICS.length; i++) {
    var t = TOPICS[i];
    var keys = lang === "ar" ? t.ar : t.no;
    for (var k = 0; k < keys.length; k++) {
      if (low.indexOf(keys[k]) !== -1 && keys[k].length > bestScore) {
        best = t; bestScore = keys[k].length;
      }
    }
  }
  if (best) return { text: pick(lang === "ar" ? best.svarAr : best.svarNo), lang: lang, source: "local" };
  return { text: pick(lang === "ar" ? FALLBACK_AR : FALLBACK_NO), lang: lang, source: "local" };
}

/* ---------------- Gemini ---------------- */

var API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

export function getSettings() {
  try {
    return {
      key: localStorage.getItem("bella.apikey") || "",
      model: localStorage.getItem("bella.model") || "gemini-2.5-flash"
    };
  } catch (e) {
    return { key: "", model: "gemini-2.5-flash" };
  }
}

export function saveSettings(key, model) {
  try {
    if (key) localStorage.setItem("bella.apikey", key);
    else localStorage.removeItem("bella.apikey");
    if (model) localStorage.setItem("bella.model", model);
  } catch (e) { /* privat modus e.l. */ }
}

export function hasKey() { return !!getSettings().key; }

/* history: [{role:'user'|'model', text:'...'}] */
export async function aiReply(text, history) {
  var s = getSettings();
  if (!s.key) throw new Error("no-key");

  var contents = (history || []).slice(-10).map(function (h) {
    return { role: h.role, parts: [{ text: h.text }] };
  });
  contents.push({ role: "user", parts: [{ text: text }] });

  var res = await fetch(API_BASE + encodeURIComponent(s.model) + ":generateContent?key=" +
    encodeURIComponent(s.key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.9, maxOutputTokens: 160 }
    })
  });

  if (!res.ok) {
    var detail = "";
    try {
      var errJson = await res.json();
      detail = (errJson.error && errJson.error.message) || "";
    } catch (e) { /* ikke JSON */ }
    var err = new Error(detail || ("HTTP " + res.status));
    err.status = res.status;
    throw err;
  }

  var data = await res.json();
  var cand = data.candidates && data.candidates[0];
  var out = cand && cand.content && cand.content.parts &&
    cand.content.parts.map(function (p) { return p.text || ""; }).join("").trim();

  if (!out) throw new Error("tomt svar");
  return { text: out, lang: detectLang(out), source: "ai" };
}

/* Prøver AI hvis nøkkel finnes, ellers lokalt. Faller alltid tilbake. */
export async function reply(text, history) {
  if (hasKey()) {
    try {
      return await aiReply(text, history);
    } catch (e) {
      var local = localReply(text);
      local.warning = e.message === "no-key" ? null : e.message;
      return local;
    }
  }
  return localReply(text);
}
