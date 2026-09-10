# Hanzi Harbor

[![License: MIT](https://img.shields.io/badge/License-MIT-c84b31.svg)](LICENSE)
[![New HSK 3.0](https://img.shields.io/badge/HSK-New%203.0-2d6a4f.svg)](https://github.com/drkameleon/complete-hsk-vocabulary)

A modern, mobile-friendly Mandarin vocabulary learning app built around **interactive flashcards** and **spaced repetition (SRS)**.

Learn New HSK 3.0 words a little every day — Hanzi first, then meaning & pinyin. Hard cards come back sooner. New words are capped so you never drown in the full list.

**Run it:** open `index.html` in a browser (no build step, works offline after first load).

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
hanzi-harbor/
  index.html          # App shell
  css/styles.css      # Design system + layout
  js/hsk-data.js      # New HSK 3.0 vocabulary
  js/srs.js           # Spaced repetition engine
  js/app.js           # UI + study / practice logic
  DESIGN.md           # Visual / product design notes
  LICENSE             # MIT
```

---

## Data sources

| Data | Source |
|------|--------|
| Hanzi, HSK levels, pinyin, traditional | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (New HSK 3.0, exclusive 1–6) |
| Official HSK 3.0 lists (upstream) | [elkmovie/hsk30](https://github.com/elkmovie/hsk30) |
| English meanings | [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) via that repository |

Vocabulary dataset is distributed under **MIT** by its upstream authors. See the linked repositories for full notices.

---

## License

This project’s application code and UI are released under the **[MIT License](LICENSE)**.

```
MIT License

Copyright (c) 2026 bisamandarin.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Credits

Built with **Xiaomi MiMo Desktop** (MiMo agent) — from product design and SRS logic to responsive UI, dark mode, and multi-mode practice.

Made by **[bisamandarin.com](https://bisamandarin.com)**.

| | |
|---|---|
| Xiaomi MiMo (X) | [@XiaomiMiMoDevs](https://x.com/XiaomiMiMoDevs) |
| Adams Hafizullah (X) | [@adamshafizullah](https://x.com/adamshafizullah) |
| Adams Hafizullah (LinkedIn) | [linkedin.com/in/adamshafizullah](https://www.linkedin.com/in/adamshafizullah/) |
| Product | [bisamandarin.com](https://bisamandarin.com) |
