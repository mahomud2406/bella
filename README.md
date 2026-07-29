# 🐾 Bella

En liten nettside til ære for Bella — britisk langhårskatt i sølvchinchilla-drakt,
hunnkatt, født **16. februar 2025**.

## Se siden

https://mahomud2406.github.io/bella/

## AR-modus — `ar.html`

Sett Bella ned på gulvet i ditt eget rom og snakk med henne. Hun forstår
**norsk** og **arabisk**, svarer på samme språk, og munnen går mens hun prater.

Siden faller ned tre trinn, avhengig av hva enheten klarer:

| Trinn | Krav | Hva du får |
| --- | --- | --- |
| WebXR | Android + Chrome | Ekte gulvsporing. Sikt mot gulvet, trykk, og hun står der. |
| Kamera | Kamera-tilgang | Kamerabildet bak henne. Dra for å flytte, knip for å skalere. |
| 3D | Ingenting | Bella i 3D mot en mørk bakgrunn. |

Mikrofonen står på og lytter kontinuerlig. Den pauses automatisk mens Bella
snakker, slik at hun ikke svarer på sin egen stemme, og kan skrus av med
knappen. Er mikrofonen blokkert eller mangler, kan du skrive til henne i stedet.

### Snakker hun med ekte AI?

Som standard bruker hun en **innebygd hjerne** i `brain.js` — mønster­gjenkjenning
på begge språk. Den virker uten nett, uten nøkkel og uten oppsett.

Vil du at hun skal svare på hva som helst, kan du legge inn din egen gratis
API-nøkkel fra [Google AI Studio](https://aistudio.google.com/apikey) under ⚙ i
AR-modus. Nøkkelen lagres bare i `localStorage` i din egen nettleser, ligger
ikke i repoet, og sendes bare til Google. Svikter API-et, faller hun umiddelbart
tilbake til den innebygde hjernen.

En nøkkel i en statisk nettside kan ikke holdes hemmelig — derfor er den lagt
opp som noe hver enkelt legger inn selv, ikke noe som følger med koden.

### Katten

3D-Bella er bygget av kuler og kjegler i `bella3d.js` — ingen modellfil. Hun er
skalert til ekte kattestørrelse (ca. 45 cm sittende), puster, blunker, vifter
med halen, spisser ørene når hun lytter, og har en kjeve som beveger seg mens
talesyntesen kjører. Mangler enheten stemme for språket, går munnen likevel, så
det ser ut som hun svarer.

## Hva som er på siden

- **Under panseret** — ansiktet hennes gjennomgått som en bilutstilling. Trykk
  «Start motoren», så leses spesifikasjonene opp mens markørene lyser opp:
  *«The mouth is Mercedes»*, *«Nose is Tesla»*, *«Forehead is Maserati»* — og til
  slutt motoren, som er en sovende katt.
- **Alder** som regnes ut kalenderriktig, med ring som viser hvor langt hun er
  kommet mot neste bursdag.
- **Nedtelling** til neste bursdag, med konfetti på selve dagen.
- **Galleri** med bildevisning i full størrelse.
- Lys/mørk modus, responsivt oppsett og redusert bevegelse for de som ber om det.

## Litt om hvordan det virker

Lyden er ikke en lydfil. Stemmen kommer fra nettleserens egen talesyntese
(`SpeechSynthesisUtterance`), og malingen er bygget fra bunnen av i Web Audio:
brunt støy gjennom et lavpassfilter, amplitudemodulert på ~25 Hz, med en
langsom «pust» oppå. Bølgeformen på dashbordet tegnes fra en `AnalyserNode`.

Siden har ingen byggesteg og ingen eksterne avhengigheter — fontene
(Fraunces og Outfit, SIL Open Font License 1.1) ligger i `fonts/`.

Hvis en nettleser mangler talesyntese, vises replikkene som tekst i stedet,
og hver linje står oppe lenge nok til å leses uansett.

## Kjør lokalt

```bash
python3 -m http.server 8000
# åpne http://localhost:8000
```

## Slå på GitHub Pages

Settings → Pages → **Source: Deploy from a branch** → `main` / `/ (root)` → Save.

## Filer

| Fil | Innhold |
| --- | --- |
| `index.html` | Hovedsiden |
| `styles.css` | Design, lys/mørk modus, responsivt oppsett |
| `script.js` | Alder, nedtelling, talesekvens, lydsyntese og bildevisning |
| `ar.html`, `ar.css`, `ar.js` | AR-modus: kamera, WebXR, mikrofon og stemme |
| `bella3d.js` | 3D-modellen av Bella, bygget av primitiver |
| `brain.js` | Samtale: innebygd tospråklig hjerne + valgfri Gemini |
| `fonts.css`, `fonts/` | Selvhostede fonter (Fraunces og Outfit, OFL 1.1) |
| `vendor/` | three.js (MIT), lagt i repoet så siden ikke er avhengig av CDN |
| `images/` | Bilder av Bella, rotert riktig og optimalisert for web |
