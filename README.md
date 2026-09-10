# HanziHarbor

A modern, mobile-friendly Mandarin vocabulary learning app built around **interactive flashcards** and **spaced repetition (SRS)**.

Learn New HSK 3.0 words a little every day — Hanzi first, then meaning & pinyin. Hard cards come back sooner. New words are capped so you never drown in the full list.

**Live use:** open `index.html` in a browser (no build step, works offline after first load).

**Made with [Xiaomi MiMo Desktop](https://www.mi.com)** — designed, coded, and iterated with MiMo’s desktop agent.

---

## Features

- **Flashcards** — Hanzi on the front; flip for pinyin, English meaning, traditional form
- **Audio** — browser `zh-CN` speech for every word
- **New HSK 3.0** — 5,363 words, exclusive levels 1–6
- **SRS** — simplified SM-2; Hard / Learning / Known / Easy intervals
- **Daily session** — reviews first, then up to 8 new words/day; HSK unlocks progressively
- **Practice modes**
  - Hanzi → Meaning
  - Meaning → Hanzi (hanzi-only choices)
  - Pinyin → Hanzi (hanzi-only choices)
  - Listening → pick the meaning
- **Progress** — daily goal, streak, XP, accuracy, mastery by HSK level
- **Library / search** — filter by HSK, category, topic; search hanzi, pinyin, or meaning
- **Dark mode** + Plus Jakarta Sans UI
- **Responsive** — bottom tabs on mobile, left sidebar on desktop

---

## Quick start

```bash
# Option A — just open it
open index.html

# Option B — local server
python3 -m http.server 8765
# then visit http://127.0.0.1:8765
```

No npm install. No backend. Progress is stored in `localStorage`.

---

## Project structure

```
mandarin-learn/
  index.html          # App shell
  css/styles.css      # Design system + layout
  js/hsk-data.js      # New HSK 3.0 vocabulary
  js/srs.js           # Spaced repetition engine
  js/app.js           # UI + study / practice logic
  DESIGN.md           # Visual / product design notes
```

---

## Data sources & license

| Data | Source |
|------|--------|
| Hanzi, HSK levels, pinyin, traditional | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (New HSK 3.0, exclusive 1–6) |
| Official HSK 3.0 lists (upstream) | [elkmovie/hsk30](https://github.com/elkmovie/hsk30) |
| English meanings | [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) via that repository |

Vocabulary dataset: **MIT**.

This application’s UI & code: **MIT** — © [bisamandarin.com](https://bisamandarin.com)

---

## Credits

Built with **Xiaomi MiMo Desktop** (MiMo agent) — from product design and SRS logic to responsive UI, dark mode, and multi-mode practice.

Made by **[bisamandarin.com](https://bisamandarin.com)**.
