# Hanzi Harbor — Mandarin Learning Platform

## Concept
A calm daily-study app for Mandarin vocabulary. Feels like a modern paper study deck (Anki/Quizlet rigor) with Duolingo-friendly daily rhythm. Not a marketing site — a working product.

## Style anchor
Quiet product UI × Chinese paper ink: warm off-white surfaces, cinnabar accent, large Hanzi as the visual hero on every card. Minimal chrome, high contrast text, soft micro-motion.

## Palette
| Role | Light | Dark |
|---|---|---|
| Background | `#F6F4EF` | `#121418` |
| Surface | `#FFFFFF` | `#1C1F26` |
| Surface-2 | `#EEEBE4` | `#262A33` |
| Ink | `#1A1D23` | `#F2EFE8` |
| Muted | `#6B7280` | `#9CA3AF` |
| Accent (cinnabar) | `#C84B31` | `#E07A5F` |
| Success (jade) | `#2D6A4F` | `#6FBF9A` |
| Warning | `#B45309` | `#F59E0B` |
| Danger | `#B91C1C` | `#F87171` |

## Typography
- UI: `system-ui, -apple-system, "Segoe UI", sans-serif`
- Hanzi: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`
- Display Hanzi: 64–96px on flashcards (hero weight)
- Body: 15–16px, titles 22–28px

## Layout
- Mobile-first single column, max content 720px
- Bottom tab nav (mobile) / top nav (desktop)
- Card-based sections, 16–20px radius, soft borders
- Spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32 / 48

## Signature moments
1. 3D flip flashcard with soft shadow lift
2. Correct-answer pulse + subtle confetti dots
3. Daily streak flame chip
4. Hanzi character pop-in on card reveal

## Screens
1. **Home** — daily goal, streak, due cards, quick start
2. **Study** — flashcards with flip, mark mastered/learning/hard, audio
3. **Practice** — 4 modes: Hanzi→Arti, Arti→Hanzi, Pinyin→Hanzi, Listening
4. **Library** — browse by HSK / category / topic + search
5. **Progress** — mastery %, totals, streak history
6. **Dictionary** — search any vocab entry

## Tech
- Static SPA: HTML + CSS + vanilla JS
- localStorage persistence
- Web Speech API (`zh-CN`) for pronunciation
- Simplified SM-2 SRS
- Offline-first, no build step
