# 🐾 Bella

En liten nettside til ære for Bella — britisk langhårskatt i sølvchinchilla-drakt,
hunnkatt, født **16. februar 2025**.

## Se siden

https://mahomud2406.github.io/bella/

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
| `index.html` | Innholdet på siden |
| `styles.css` | Design, lys/mørk modus, responsivt oppsett |
| `script.js` | Alder, nedtelling, talesekvens, lydsyntese og bildevisning |
| `fonts.css`, `fonts/` | Selvhostede fonter |
| `images/` | Bilder av Bella, rotert riktig og optimalisert for web |
