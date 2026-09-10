/* Hanzi Harbor app */
(function () {
  const VOCAB = window.VOCAB || [];
  const byId = Object.fromEntries(VOCAB.map((v) => [v.id, v]));

  // ── State ────────────────────────────────────
  const PROGRESS_KEY = "hanziharbor_progress_v1";
  const THEME_KEY = "hanziharbor_theme";
  const DAILY_KEY = "hanziharbor_daily_v1";

  let state = {
    view: "home",
    studyQueue: [],
    studyIndex: 0,
    studyFlipped: false,
    studyNewIds: new Set(),
    studyHardRequeue: [],
    practice: null,
    libFilter: { hsk: "all", category: "all", topic: "all" },
    libSearch: "",
    libLimit: 40,
    dictQuery: "",
  };

  const SESSION_CAP = 20;
  const DAILY_NEW_LIMIT = 8;

  const CAT_EN = {
    "kata benda": "noun",
    "kata kerja": "verb",
    "kata sifat": "adjective",
    "kata keterangan": "adverb",
    "kata ganti": "pronoun",
    "kata depan": "preposition",
    "kata sambung": "conjunction",
    "angka": "number",
    "kata bantu hitung": "classifier",
    "partikel": "particle",
    "partikel modal": "modal particle",
    "seru": "interjection",
    "ungkapan": "expression",
    "idiom": "idiom",
    "singkatan": "abbreviation",
    "nama orang": "name",
    "nama tempat": "place",
    "nama organisasi": "organization",
    "nama khusus": "proper noun",
    "lainnya": "other",
    "umum": "general",
    "tindakan": "actions",
    "sifat": "qualities",
    "keterangan": "modifiers",
    "perkenalan": "introductions",
    "tata bahasa": "grammar",
    "sapaan": "greetings",
    "budaya": "culture",
    "tempat": "places",
    "nama": "names",
    "organisasi": "organizations",
  };

  function enLabel(s) {
    return CAT_EN[s] || s;
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || defaultProgress();
    } catch {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return {
      totalReviewed: 0,
      totalCorrect: 0,
      xp: 0,
      sessions: 0,
    };
  }

  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }

  function todayKey() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function loadDaily() {
    try {
      return JSON.parse(localStorage.getItem(DAILY_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveDaily(d) {
    localStorage.setItem(DAILY_KEY, JSON.stringify(d));
  }

  function getStreak() {
    const daily = loadDaily();
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (daily[key] && daily[key].reviewed > 0) streak++;
      else if (i === 0) continue; // today may not have started
      else break;
    }
    // If today empty but yesterday had activity, streak still counts yesterday
    const t = daily[todayKey()];
    if (!t || t.reviewed === 0) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yk = y.toISOString().slice(0, 10);
      if (daily[yk] && daily[yk].reviewed > 0) {
        // keep streak as counted from yesterday
        return streak;
      }
      if (!(t && t.reviewed > 0)) {
        // recount from yesterday only
        streak = 0;
        for (let i = 1; i < 365; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (daily[key] && daily[key].reviewed > 0) streak++;
          else break;
        }
        return streak;
      }
    }
    return streak;
  }

  function recordReview(correct, isNew) {
    const progress = loadProgress();
    progress.totalReviewed += 1;
    if (correct) progress.totalCorrect += 1;
    progress.xp += correct ? 10 : 3;
    saveProgress(progress);

    const daily = loadDaily();
    const key = todayKey();
    if (!daily[key]) daily[key] = { reviewed: 0, correct: 0, xp: 0, newIntroduced: 0 };
    daily[key].reviewed += 1;
    if (correct) daily[key].correct += 1;
    daily[key].xp += correct ? 10 : 3;
    if (isNew) daily[key].newIntroduced = (daily[key].newIntroduced || 0) + 1;
    saveDaily(daily);
  }

  function newIntroducedToday() {
    const d = loadDaily();
    return d[todayKey()]?.newIntroduced || 0;
  }

  // ── Theme ────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.innerHTML = theme === "dark" ? icons.sun : icons.moon;
      btn.setAttribute("aria-label", theme === "dark" ? "Light mode" : "Dark mode");
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
    else applyTheme("light");
  }

  // ── Speech ───────────────────────────────────
  function speak(text, btn) {
    if (!window.speechSynthesis) {
      toast("Audio is not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find((v) => v.lang.startsWith("zh"));
    if (zh) u.voice = zh;
    if (btn) {
      btn.classList.add("speaking");
      u.onend = () => btn.classList.remove("speaking");
      u.onerror = () => btn.classList.remove("speaking");
    }
    window.speechSynthesis.speak(u);
  }

  // Load voices async
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  // ── Utils ────────────────────────────────────
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function confetti(x, y) {
    const root = document.getElementById("confetti");
    root.innerHTML = "";
    const colors = ["#C84B31", "#2D6A4F", "#F59E0B", "#E07A5F", "#6FBF9A"];
    for (let i = 0; i < 14; i++) {
      const dot = document.createElement("i");
      dot.style.left = x + (Math.random() - 0.5) * 120 + "px";
      dot.style.top = y + "px";
      dot.style.background = colors[i % colors.length];
      dot.style.animationDelay = Math.random() * 0.15 + "s";
      root.appendChild(dot);
    }
    setTimeout(() => (root.innerHTML = ""), 1000);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function unique(arr) {
    return [...new Set(arr)].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function masteryStats() {
    const map = SRS.loadSrs();
    const total = VOCAB.length;
    const counts = { new: 0, learning: 0, hard: 0, reviewing: 0, mastered: 0 };
    VOCAB.forEach((v) => {
      const s = map[v.id]?.status || "new";
      counts[s] = (counts[s] || 0) + 1;
    });
    const mastered = counts.mastered;
    const pct = total ? Math.round((mastered / total) * 100) : 0;
    const byHsk = {};
    for (let h = 1; h <= 6; h++) {
      const items = VOCAB.filter((v) => v.hsk === h);
      const m = items.filter((v) => (map[v.id]?.status || "new") === "mastered").length;
      byHsk[h] = { total: items.length, mastered: m, pct: items.length ? Math.round((m / items.length) * 100) : 0 };
    }
    return { total, counts, mastered, pct, byHsk, map };
  }

  function dailyGoal() {
    const daily = loadDaily();
    const t = daily[todayKey()] || { reviewed: 0 };
    const goal = 10;
    return { done: t.reviewed, goal, pct: Math.min(100, Math.round((t.reviewed / goal) * 100)) };
  }

  // ── Icons ────────────────────────────────────
  const svg = (body, size = 22) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  const icons = {
    home: svg(`<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/>`),
    study: svg(`<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 9v6M9 12h6"/>`),
    practice: svg(`<path d="M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.5 6.3 20l2.1-6.4L3 9.6h6.8L12 3z"/>`),
    library: svg(`<path d="M4 5h7v15H4zM13 5h7v15h-7z"/>`),
    progress: svg(`<path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 4-6"/>`),
    speaker: svg(`<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M18 6a8 8 0 010 12"/>`, 20),
    flame: svg(`<path d="M12 3c1 3-1 4-1 6a4 4 0 008 0c0-3-2-5-2-5 2 2 4 5 4 8a7 7 0 11-14 0c0-4 3-7 5-9z"/>`, 16),
    sun: svg(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`, 18),
    moon: svg(`<path d="M21 14.5A8.5 8.5 0 119.5 3 7 7 0 0021 14.5z"/>`, 18),
    search: svg(`<circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>`, 18),
  };

  // ── Navigation ───────────────────────────────
  function setView(name) {
    state.view = name;
    document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
    document.getElementById("view-" + name)?.classList.add("active");
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === name);
    });
    if (name === "home") renderHome();
    if (name === "study") renderStudy();
    if (name === "practice") renderPractice();
    if (name === "library") renderLibrary();
    if (name === "progress") renderProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Home ─────────────────────────────────────
  function startDailySession() {
    const session = SRS.buildSession(VOCAB, {
      sessionCap: SESSION_CAP,
      dailyNewLimit: DAILY_NEW_LIMIT,
      newIntroducedToday: newIntroducedToday(),
    });
    if (!session.queue.length) {
      toast("No cards ready for this session");
      return;
    }
    const map = SRS.loadSrs();
    state.studyQueue = session.queue;
    state.studyNewIds = new Set(session.queue.filter((id) => !map[id] || map[id].status === "new"));
    state.studyIndex = 0;
    state.studyFlipped = false;
    state.studyHardRequeue = [];
    setView("study");
  }

  function renderHome() {
    const session = SRS.buildSession(VOCAB, {
      sessionCap: SESSION_CAP,
      dailyNewLimit: DAILY_NEW_LIMIT,
      newIntroducedToday: newIntroducedToday(),
    });
    const g = dailyGoal();
    const streak = getStreak();
    const stats = masteryStats();
    const progress = loadProgress();
    const map = SRS.loadSrs();
    const reviewsDue = session.totalDueReviews;
    const newUsed = newIntroducedToday();
    const hardCount = VOCAB.filter((v) => map[v.id]?.status === "hard").length;

    document.getElementById("streakChip").innerHTML = `<span class="flame-icon">${icons.flame}</span> ${streak}`;

    const el = document.getElementById("homeContent");
    const ready = session.queue.length > 0;

    el.innerHTML = `
      <div class="goal-banner">
        <div class="goal-ring" style="--p:${g.pct}">
          <div class="goal-ring-inner">${g.done}/${g.goal}</div>
        </div>
        <div class="goal-copy">
          <h3>Today's goal</h3>
          <p>${g.done >= g.goal ? "Great! Daily goal complete." : `Finish ${g.goal - g.done} more cards today.`}</p>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:16px">
        <div class="stat">
          <div class="stat-label">Due for review</div>
          <div class="stat-value">${reviewsDue}</div>
        </div>
        <div class="stat">
          <div class="stat-label">New words today</div>
          <div class="stat-value">${Math.max(0, newUsed)}<small>/${DAILY_NEW_LIMIT}</small></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="section-title" style="margin-top:0">Study session</div>
        <p style="color:var(--muted);font-size:14px;margin-bottom:14px">
          ${
            ready
              ? `Ready: <strong>${session.reviewCount}</strong> reviews + <strong>${session.newCount}</strong> new words (max ${SESSION_CAP}/session). HSK unlocked through level ${session.unlockedLevel}.`
              : "All of today's cards are done. More will appear tomorrow per your SRS schedule."
          }
        </p>
        ${hardCount ? `<p style="color:var(--danger);font-size:13px;font-weight:600;margin-bottom:12px">${hardCount} words marked Hard — they will appear more often.</p>` : ""}
        <div class="btn-row">
          <button class="btn btn-primary" id="startDue" ${ready ? "" : "disabled style=\"opacity:0.5\""}>${ready ? "Start session" : "Done for today"}</button>
          <button class="btn btn-secondary" data-nav="practice">Quick practice</button>
        </div>
      </div>

      <div class="card">
        <div class="section-title" style="margin-top:0">Summary</div>
        <div class="grid-2">
          <div>
            <div class="stat-label">Streak</div>
            <div class="stat-value" style="font-size:22px;display:flex;align-items:center;gap:6px">${icons.flame} ${streak} days</div>
          </div>
          <div>
            <div class="stat-label">Total reviews</div>
            <div class="stat-value" style="font-size:22px">${progress.totalReviewed}</div>
          </div>
          <div>
            <div class="stat-label">Mastered</div>
            <div class="stat-value" style="font-size:22px">${stats.mastered}<small>/${stats.total}</small></div>
          </div>
          <div>
            <div class="stat-label">XP</div>
            <div class="stat-value" style="font-size:22px">${progress.xp}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="section-title" style="margin-top:0">How study works</div>
        <ul style="color:var(--muted);font-size:13px;line-height:1.7;padding-left:18px;margin:0">
          <li>Active recall: Hanzi first; meaning &amp; pinyin appear after flip</li>
          <li>Hard → reappears in-session &amp; is scheduled sooner</li>
          <li>Max ${DAILY_NEW_LIMIT} new words/day, starting HSK ${session.unlockedLevel}</li>
          <li>Next HSK unlocks after ~60% of the previous level is touched</li>
        </ul>
      </div>

      <footer class="site-footer home-footer">
        <p>Made by <a href="https://bisamandarin.com" target="_blank" rel="noopener">bisamandarin.com</a></p>
        <p class="footer-source">
          Hanzi data from
          <a href="https://github.com/drkameleon/complete-hsk-vocabulary" target="_blank" rel="noopener">complete-hsk-vocabulary</a>
          (New HSK 3.0) · meanings from
          <a href="https://www.mdbg.net/chinese/dictionary?page=cc-cedict" target="_blank" rel="noopener">CC-CEDICT</a>
          · MIT
        </p>
      </footer>
    `;

    document.getElementById("startDue").onclick = () => {
      if (ready) startDailySession();
      else setView("library");
    };
    el.querySelectorAll("[data-nav]").forEach((b) => {
      b.onclick = () => setView(b.dataset.nav);
    });
  }

  // ── Study ────────────────────────────────────
  function startStudy(ids) {
    const map = SRS.loadSrs();
    const prioritized = SRS.prioritize(ids, map);
    state.studyQueue = prioritized.slice(0, SESSION_CAP);
    state.studyNewIds = new Set(state.studyQueue.filter((id) => !map[id] || map[id].status === "new"));
    state.studyIndex = 0;
    state.studyFlipped = false;
    state.studyHardRequeue = [];
    setView("study");
  }

  function gradeCurrent(q, e) {
    const id = state.studyQueue[state.studyIndex];
    if (!id) return;
    const isNew = state.studyNewIds.has(id);
    const correct = q >= 2;
    SRS.gradeCard(id, q);
    recordReview(correct, isNew);

    if (correct && e && e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top);
    }

    // Re-queue hard cards later in this same session (once each)
    if (q === 0 && !state.studyHardRequeue.includes(id)) {
      state.studyHardRequeue.push(id);
      state.studyQueue.push(id);
    }

    state.studyIndex += 1;
    state.studyFlipped = false;
    renderStudy();
  }

  function renderStudy() {
    const el = document.getElementById("studyContent");
    if (!state.studyQueue.length) {
      el.innerHTML = `
        <div class="empty">
          <h3>No study session yet</h3>
          <p>Start from the daily session (reviews + new words).</p>
          <button class="btn btn-primary" id="studyGoDue" style="margin-top:16px">Start session daysan</button>
        </div>`;
      document.getElementById("studyGoDue").onclick = startDailySession;
      return;
    }

    if (state.studyIndex >= state.studyQueue.length) {
      const total = state.studyQueue.length;
      const newDone = state.studyNewIds.size;
      el.innerHTML = `
        <div class="empty">
          <h3>Session complete!</h3>
          <p>${total} cards reviewed · ${newDone} new words.</p>
          <div class="btn-row" style="margin-top:16px">
            <button class="btn btn-primary" id="studyAgain">Next session</button>
            <button class="btn btn-secondary" data-nav="home">Back to home</button>
          </div>
        </div>`;
      document.getElementById("studyAgain").onclick = startDailySession;
      el.querySelectorAll("[data-nav]").forEach((b) => (b.onclick = () => setView(b.dataset.nav)));
      return;
    }

    const id = state.studyQueue[state.studyIndex];
    const v = byId[id];
    if (!v) {
      state.studyIndex += 1;
      renderStudy();
      return;
    }
    const s = SRS.getCardState(id);
    const pct = Math.round(((state.studyIndex + 1) / state.studyQueue.length) * 100);
    const isNewCard = !s.lastReview;

    el.innerHTML = `
      <div class="study-head">
        <span style="font-size:13px;font-weight:700;color:var(--muted)">${state.studyIndex + 1} / ${state.studyQueue.length}</span>
        <div class="progress-bar"><i style="width:${pct}%"></i></div>
        <button class="btn btn-ghost" id="endStudy" style="min-height:36px;padding:0 8px">Done</button>
      </div>

      <div class="flash-wrap">
        <div class="flashcard ${state.studyFlipped ? "flipped" : ""}" id="flashcard" role="button" tabindex="0" aria-label="Flip card">
          <div class="flash-face front">
            <div class="flash-meta">
              <span class="badge hsk">HSK ${v.hsk}</span>
              <span class="badge">${isNewCard ? "new" : s.status}</span>
            </div>
            <button class="audio-btn" id="audioFront" type="button" aria-label="Play audio">${icons.speaker}</button>
            <div class="flash-hanzi">${v.hanzi}</div>
            <p style="color:var(--muted);font-size:13px">What's the meaning &amp; pronunciation?</p>
            <p style="color:var(--muted);font-size:12px">Tap the card · or press Space</p>
          </div>
          <div class="flash-face back">
            <div class="flash-meta">
              <span class="badge hsk">HSK ${v.hsk}</span>
              <span class="badge">${isNewCard ? "new" : s.status}</span>
            </div>
            <button class="audio-btn" id="audioBack" type="button" aria-label="Play audio">${icons.speaker}</button>
            <div class="flash-hanzi" style="font-size:40px">${v.hanzi}</div>
            <div class="flash-pinyin">${v.pinyin}</div>
            <div class="flash-meaning">${v.meaning}</div>
            ${
              v.traditional && v.traditional !== v.hanzi
                ? `<div style="color:var(--muted);font-size:14px;font-family:var(--hanzi)">繁: ${v.traditional}</div>`
                : ""
            }
            ${
              v.exampleZh
                ? `<div class="flash-example"><span class="zh">${v.exampleZh}</span>${v.exampleId || ""}</div>`
                : ""
            }
          </div>
        </div>
      </div>

      <p class="flip-hint">${state.studyFlipped ? "Be honest: how well did you know it? (1 / 2 / 3)" : "Flip first, then grade"}</p>

      <div class="grade-row">
        <button class="grade-btn hard" data-grade="0" ${state.studyFlipped ? "" : "disabled"}>1 · Hard</button>
        <button class="grade-btn learn" data-grade="1" ${state.studyFlipped ? "" : "disabled"}>2 · Learning</button>
        <button class="grade-btn ok" data-grade="2" ${state.studyFlipped ? "" : "disabled"}>3 · Known</button>
      </div>
      <button class="btn btn-ghost btn-block" id="gradeEasy" data-grade="3" style="margin-top:8px;min-height:40px;${state.studyFlipped ? "" : "display:none"}">Easy — long interval</button>
    `;

    const card = document.getElementById("flashcard");

    function flipCard() {
      if (state.studyFlipped) return;
      state.studyFlipped = true;
      card.classList.add("flipped");
      const hint = document.querySelector(".flip-hint");
      if (hint) hint.textContent = "Be honest: how well did you know it? (1 / 2 / 3)";
      el.querySelectorAll(".grade-btn[data-grade]").forEach((b) => (b.disabled = false));
      const easy = document.getElementById("gradeEasy");
      if (easy) easy.style.display = "flex";
    }

    card.onclick = (e) => {
      if (e.target.closest(".audio-btn")) return;
      flipCard();
    };

    document.getElementById("audioFront").onclick = (e) => {
      e.stopPropagation();
      speak(v.hanzi, e.currentTarget);
    };
    document.getElementById("audioBack").onclick = (e) => {
      e.stopPropagation();
      speak(v.hanzi, e.currentTarget);
    };

    document.getElementById("endStudy").onclick = () => {
      state.studyQueue = [];
      state.studyIndex = 0;
      setView("home");
    };

    el.querySelectorAll("[data-grade]").forEach((btn) => {
      btn.onclick = (e) => {
        if (!state.studyFlipped) {
          toast("Flip the card first");
          return;
        }
        gradeCurrent(Number(btn.dataset.grade), e);
      };
    });

    if (state._prevStudyKey) document.removeEventListener("keydown", state._prevStudyKey);
    state._prevStudyKey = (e) => {
      if (state.view !== "study" || state.studyIndex >= state.studyQueue.length) return;
      if (e.code === "Space") {
        e.preventDefault();
        flipCard();
      } else if (state.studyFlipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const q = { "1": 0, "2": 1, "3": 2, "4": 3 }[e.key];
        gradeCurrent(q, null);
      }
    };
    document.addEventListener("keydown", state._prevStudyKey);
  }

  // ── Practice ─────────────────────────────────
  const PRACTICE_MODES = {
    hz2id: { title: "Hanzi → Meaning", desc: "See Hanzi, pick the English meaning", icon: "汉", promptLabel: "What does it mean?", kind: "meaning" },
    id2hz: { title: "Meaning → Hanzi", desc: "See the meaning, pick the right Hanzi", icon: "译", promptLabel: "Which Hanzi is correct?", kind: "hanzi" },
    pin2hz: { title: "Pinyin → Hanzi", desc: "See pinyin, pick the Hanzi", icon: "拼", promptLabel: "Hanzi for this pinyin?", kind: "hanzi" },
    listen: { title: "Listening", desc: "Listen to audio, pick the answer", icon: "听", promptLabel: "What do you hear?", kind: "meaning" },
  };

  function startPractice(mode) {
    const pool = shuffle(VOCAB).slice(0, 10);
    state.practice = { mode, queue: pool, index: 0, score: 0, answered: false };
    renderPractice();
  }

  function renderPractice() {
    const el = document.getElementById("practiceContent");

    if (!state.practice) {
      el.innerHTML = `
        <h1 class="page-title">Practice</h1>
        <p class="page-sub">Short 10-question drills. Pick a mode.</p>
        <div class="mode-grid">
          ${Object.entries(PRACTICE_MODES)
            .map(
              ([key, m]) => `
            <button class="mode-card" data-mode="${key}">
              <div class="mode-icon">${m.icon}</div>
              <h3>${m.title}</h3>
              <p>${m.desc}</p>
            </button>`
            )
            .join("")}
        </div>
        <div class="card">
          <div class="section-title" style="margin-top:0">Tips</div>
          <p style="color:var(--muted);font-size:14px">
            Listening uses your browser's zh-CN voice. Turn volume on.
            Correct answers earn XP and update SRS.
          </p>
        </div>`;
      el.querySelectorAll("[data-mode]").forEach((b) => {
        b.onclick = () => startPractice(b.dataset.mode);
      });
      return;
    }

    const { mode, queue, index, score, answered } = state.practice;
    const m = PRACTICE_MODES[mode];

    if (index >= queue.length) {
      const pctScore = Math.round((score / queue.length) * 100);
      el.innerHTML = `
        <div class="empty">
          <h3>Practice selesai</h3>
          <p>Score: <strong>${score}/${queue.length}</strong> (${pctScore}%)</p>
          <div class="btn-row" style="margin-top:16px">
            <button class="btn btn-primary" id="retryPractice">Try again</button>
            <button class="btn btn-secondary" id="backPractice">Choose another mode</button>
          </div>
        </div>`;
      document.getElementById("retryPractice").onclick = () => startPractice(mode);
      document.getElementById("backPractice").onclick = () => {
        state.practice = null;
        renderPractice();
      };
      return;
    }

    const q = queue[index];

    // Distractors: never show the prompt itself as a clue on a choice
    let wrongPool = VOCAB.filter((v) => v.id !== q.id);
    if (mode === "pin2hz") {
      // Avoid same pinyin (homophones) as choices — too confusing / spoil-y
      wrongPool = wrongPool.filter((v) => v.pinyin !== q.pinyin);
    }
    if (mode === "id2hz") {
      wrongPool = wrongPool.filter((v) => v.meaning !== q.meaning);
    }
    if (mode === "hz2id" || mode === "listen") {
      wrongPool = wrongPool.filter((v) => v.meaning !== q.meaning);
    }
    const options = shuffle([q, ...shuffle(wrongPool).slice(0, 3)]);

    let promptMain = "";
    let promptSub = "";
    let promptLatin = false;

    if (mode === "hz2id") {
      // Hanzi only — pinyin on the prompt would weaken reading recall
      promptMain = q.hanzi;
    } else if (mode === "listen") {
      promptMain = "?";
      promptLatin = true;
    } else if (mode === "id2hz") {
      promptMain = q.meaning;
      promptLatin = true;
    } else if (mode === "pin2hz") {
      promptMain = q.pinyin;
      promptLatin = true;
    }

    // Options must not leak the field being tested
    const optLabel = (v) => {
      if (m.kind === "hanzi") {
        // Meaning → Hanzi / Pinyin → Hanzi: hanzi only (no pinyin subtitle)
        return `<span class="opt-hanzi">${v.hanzi}</span>`;
      }
      // Hanzi → Meaning / Listening: meaning only (no hanzi/pinyin)
      return `<span>${v.meaning}</span>`;
    };

    el.innerHTML = `
      <div class="study-head">
        <button class="btn btn-ghost" id="exitPractice" style="min-height:36px;padding:0 8px">← Modes</button>
        <div class="progress-bar"><i style="width:${Math.round((index / queue.length) * 100)}%"></i></div>
        <span style="font-size:13px;font-weight:700;color:var(--muted)">${score} pts</span>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <div class="quiz-prompt">
          <div class="label">${m.promptLabel}</div>
          <div class="q-main ${promptLatin ? "latin" : ""}">${promptMain}</div>
          ${promptSub ? `<div class="q-sub">${promptSub}</div>` : ""}
          ${
            mode === "listen"
              ? `<button class="btn btn-secondary" id="playAudio" style="margin-top:16px">${icons.speaker} Play again</button>`
              : ""
          }
        </div>
        <div style="padding:0 16px 18px">
          <div class="options">
            ${options
              .map(
                (v, i) => `
              <button class="option" data-id="${v.id}" data-i="${i}">
                ${optLabel(v)}
              </button>`
              )
              .join("")}
          </div>
          <div class="quiz-feedback" id="quizFeedback"></div>
          <button class="btn btn-primary btn-block" id="nextQ" style="margin-top:12px;display:none">Next</button>
        </div>
      </div>`;

    if (mode === "listen") {
      setTimeout(() => speak(q.hanzi, document.getElementById("playAudio")), 300);
      document.getElementById("playAudio").onclick = (e) => speak(q.hanzi, e.currentTarget);
    }

    document.getElementById("exitPractice").onclick = () => {
      state.practice = null;
      renderPractice();
    };

    const feedback = document.getElementById("quizFeedback");
    const nextBtn = document.getElementById("nextQ");

    el.querySelectorAll(".option").forEach((btn) => {
      btn.onclick = (e) => {
        if (state.practice.answered) return;
        state.practice.answered = true;
        const ok = btn.dataset.id === q.id;
        if (ok) {
          state.practice.score += 1;
          btn.classList.add("correct");
          feedback.className = "quiz-feedback show good";
          feedback.textContent = `Correct! ${q.hanzi} · ${q.pinyin} · ${q.meaning}`;
          const r = e.currentTarget.getBoundingClientRect();
          confetti(r.left + r.width / 2, r.top);
        } else {
          btn.classList.add("wrong");
          el.querySelector(`[data-id="${q.id}"]`)?.classList.add("correct");
          feedback.className = "quiz-feedback show bad";
          feedback.textContent = `Not quite. Answer: ${q.hanzi} · ${q.pinyin} · ${q.meaning}`;
        }
        el.querySelectorAll(".option").forEach((b) => (b.disabled = true));
        recordReview(ok);
        SRS.gradeCard(q.id, ok ? 2 : 0);
        nextBtn.style.display = "flex";
      };
    });

    nextBtn.onclick = () => {
      state.practice.index += 1;
      state.practice.answered = false;
      renderPractice();
    };
  }

  // ── Library ──────────────────────────────────
  function renderLibrary() {
    const el = document.getElementById("libraryContent");
    const cats = unique(VOCAB.map((v) => v.category));
    const topics = unique(VOCAB.map((v) => v.topic));
    const f = state.libFilter;

    let items = VOCAB.filter((v) => {
      if (f.hsk !== "all" && String(v.hsk) !== String(f.hsk)) return false;
      if (f.category !== "all" && v.category !== f.category) return false;
      if (f.topic !== "all" && v.topic !== f.topic) return false;
      if (state.libSearch) {
        const q = state.libSearch.toLowerCase();
        return (
          v.hanzi.includes(q) ||
          (v.traditional && v.traditional.includes(q)) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaning.toLowerCase().includes(q) ||
          String(v.hsk) === q
        );
      }
      return true;
    });

    const map = SRS.loadSrs();
    const visible = items.slice(0, state.libLimit);
    const more = items.length > state.libLimit;

    el.innerHTML = `
      <h1 class="page-title">Library</h1>
      <p class="page-sub">${VOCAB.length.toLocaleString("en-US")} words · New HSK 3.0 (levels 1–6) · English meanings</p>

      <div class="search-box">
        <span style="color:var(--muted);display:grid;place-items:center">${icons.search}</span>
        <input id="libSearch" type="search" placeholder="Search hanzi, pinyin, or meaning…" value="${state.libSearch}" />
      </div>

      <div class="chip-row" id="hskChips">
        ${["all", 1, 2, 3, 4, 5, 6]
          .map(
            (h) =>
              `<button class="chip ${String(f.hsk) === String(h) ? "active" : ""}" data-hsk="${h}">${h === "all" ? "All HSK" : "HSK " + h}</button>`
          )
          .join("")}
      </div>

      <div class="chip-row" id="catChips">
        <button class="chip ${f.category === "all" ? "active" : ""}" data-cat="all">All categories</button>
        ${cats.slice(0, 18).map((c) => `<button class="chip ${f.category === c ? "active" : ""}" data-cat="${c}">${enLabel(c)}</button>`).join("")}
      </div>

      <div class="chip-row" id="topicChips">
        <button class="chip ${f.topic === "all" ? "active" : ""}" data-topic="all">All topics</button>
        ${topics.slice(0, 20).map((t) => `<button class="chip ${f.topic === t ? "active" : ""}" data-topic="${t}">${enLabel(t)}</button>`).join("")}
      </div>

      <div class="btn-row" style="margin-bottom:16px">
        <button class="btn btn-primary" id="studyFiltered">Study from ${items.length.toLocaleString("id-ID")} results</button>
      </div>

      <div class="vocab-list">
        ${
          visible.length
            ? visible
                .map((v) => {
                  const st = map[v.id]?.status || "new";
                  return `
          <button class="vocab-item" data-open="${v.id}">
            <div class="vocab-hanzi">${v.hanzi}</div>
            <div class="vocab-body">
              <div class="pin">${v.pinyin}${v.traditional && v.traditional !== v.hanzi ? ` · ${v.traditional}` : ""}</div>
              <div class="mean">${v.meaning}</div>
            </div>
            <span class="status-dot ${st}" title="${st}"></span>
          </button>`;
                })
                .join("")
            : `<div class="empty"><h3>No results</h3><p>Try a different filter or keyword.</p></div>`
        }
      </div>
      ${
        more
          ? `<div style="margin-top:12px"><button class="btn btn-secondary btn-block" id="loadMore">Load more (${items.length - state.libLimit} more)</button></div>`
          : ""
      }
    `;

    const search = document.getElementById("libSearch");
    search.oninput = () => {
      state.libSearch = search.value.trim();
      state.libLimit = 40;
      renderLibrary();
      const s2 = document.getElementById("libSearch");
      s2.focus();
      s2.setSelectionRange(s2.value.length, s2.value.length);
    };

    el.querySelectorAll("[data-hsk]").forEach((b) => {
      b.onclick = () => {
        state.libFilter.hsk = b.dataset.hsk;
        state.libLimit = 40;
        renderLibrary();
      };
    });
    el.querySelectorAll("[data-cat]").forEach((b) => {
      b.onclick = () => {
        state.libFilter.category = b.dataset.cat;
        state.libLimit = 40;
        renderLibrary();
      };
    });
    el.querySelectorAll("[data-topic]").forEach((b) => {
      b.onclick = () => {
        state.libFilter.topic = b.dataset.topic;
        state.libLimit = 40;
        renderLibrary();
      };
    });
    el.querySelectorAll("[data-open]").forEach((b) => {
      b.onclick = () => openModal(b.dataset.open);
    });
    const moreBtn = document.getElementById("loadMore");
    if (moreBtn) {
      moreBtn.onclick = () => {
        state.libLimit += 60;
        renderLibrary();
      };
    }
    document.getElementById("studyFiltered").onclick = () => {
      if (!items.length) return;
      startStudy(items.map((v) => v.id));
    };
  }

  // ── Progress ─────────────────────────────────
  function renderProgress() {
    const el = document.getElementById("progressContent");
    const stats = masteryStats();
    const progress = loadProgress();
    const g = dailyGoal();
    const streak = getStreak();
    const acc = progress.totalReviewed ? Math.round((progress.totalCorrect / progress.totalReviewed) * 100) : 0;

    el.innerHTML = `
      <h1 class="page-title">Progress</h1>
      <p class="page-sub">Track mastery and study habits.</p>

      <div class="grid-2" style="margin-bottom:12px">
        <div class="stat">
          <div class="stat-label">Daily streak</div>
          <div class="stat-value">${streak}<small> days</small></div>
        </div>
        <div class="stat">
          <div class="stat-label">Today's goal</div>
          <div class="stat-value">${g.done}<small>/${g.goal}</small></div>
        </div>
        <div class="stat">
          <div class="stat-label">Mastered</div>
          <div class="stat-value">${stats.pct}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Accuracy</div>
          <div class="stat-value">${acc}%</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px">
        <div class="section-title" style="margin-top:0">Word status</div>
        <div class="grid-2" style="gap:10px">
          <div><div class="stat-label">New</div><strong>${stats.counts.new}</strong></div>
          <div><div class="stat-label">Learning</div><strong>${stats.counts.learning}</strong></div>
          <div><div class="stat-label">Hard</div><strong>${stats.counts.hard}</strong></div>
          <div><div class="stat-label">Review</div><strong>${stats.counts.reviewing}</strong></div>
          <div><div class="stat-label">Known</div><strong>${stats.counts.mastered}</strong></div>
          <div><div class="stat-label">Total reviews</div><strong>${progress.totalReviewed}</strong></div>
        </div>
      </div>

      <div class="card">
        <div class="section-title" style="margin-top:0">Mastery by New HSK 3.0</div>
        <div class="level-bars">
          ${[1, 2, 3, 4, 5, 6]
            .map((h) => {
              const s = stats.byHsk[h];
              return `
            <div class="level-row">
              <div class="top"><span>HSK ${h}</span><span>${s.mastered}/${s.total} · ${s.pct}%</span></div>
              <div class="level-track"><i style="width:${s.pct}%"></i></div>
            </div>`;
            })
            .join("")}
        </div>
      </div>

      <div class="card" style="margin-top:12px">
        <div class="section-title" style="margin-top:0">Actions</div>
        <div class="btn-row">
          <button class="btn btn-secondary" id="resetProgress">Reset local progress</button>
        </div>
        <p style="color:var(--muted);font-size:12px;margin-top:10px">Data is stored on this device (localStorage).</p>
      </div>
    `;

    document.getElementById("resetProgress").onclick = () => {
      if (!confirm("Delete all local progress and SRS data?")) return;
      localStorage.removeItem(PROGRESS_KEY);
      localStorage.removeItem(SRS_KEY_PLACEHOLDER());
      localStorage.removeItem(DAILY_KEY);
      localStorage.removeItem("hanziharbor_srs_v1");
      toast("Progress reset");
      renderProgress();
      renderHome();
    };
  }

  function SRS_KEY_PLACEHOLDER() {
    return "hanziharbor_srs_v1";
  }

  // ── Dictionary modal ─────────────────────────
  function openModal(id) {
    const v = byId[id];
    if (!v) return;
    const s = SRS.getCardState(id);
    const bd = document.getElementById("modalBackdrop");
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-label="Word detail">
        <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
        <div style="display:flex;gap:6px;margin-bottom:4px">
          <span class="badge hsk">HSK ${v.hsk}</span>
          <span class="badge">${enLabel(v.category)}</span>
          <span class="badge">${enLabel(v.topic)}</span>
          <span class="badge">${s.status}</span>
        </div>
        <div class="modal-hanzi">${v.hanzi}</div>
        <div class="modal-pinyin">${v.pinyin}</div>
        ${v.traditional && v.traditional !== v.hanzi ? `<div style="color:var(--muted);font-family:var(--hanzi);margin-top:2px">Traditional: ${v.traditional}</div>` : ""}
        <div class="modal-meaning">${v.meaning}</div>
        ${
          v.exampleZh
            ? `<div class="modal-ex"><div class="zh">${v.exampleZh}</div><div class="id">${v.exampleId || ""}</div></div>`
            : ""
        }
        <div class="btn-row">
          <button class="btn btn-primary" id="modalSpeak">${icons.speaker} Listen</button>
          <button class="btn btn-secondary" id="modalStudy">Study this card</button>
        </div>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn btn-secondary" data-mark="mastered">Mark Known</button>
          <button class="btn btn-secondary" data-mark="learning">Still Learning</button>
          <button class="btn btn-secondary" data-mark="hard">Hard</button>
        </div>
      </div>`;
    bd.classList.add("open");
    bd.onclick = (e) => {
      if (e.target === bd) closeModal();
    };
    document.getElementById("modalClose").onclick = closeModal;
    document.getElementById("modalSpeak").onclick = () => speak(v.hanzi);
    document.getElementById("modalStudy").onclick = () => {
      closeModal();
      startStudy([v.id]);
    };
    bd.querySelectorAll("[data-mark]").forEach((btn) => {
      btn.onclick = () => {
        SRS.markStatus(v.id, btn.dataset.mark);
        toast("Status updated");
        closeModal();
        if (state.view === "library") renderLibrary();
        if (state.view === "progress") renderProgress();
      };
    });
  }

  function closeModal() {
    const bd = document.getElementById("modalBackdrop");
    bd.classList.remove("open");
    bd.innerHTML = "";
  }

  // ── Init ─────────────────────────────────────
  function init() {
    initTheme();

    document.getElementById("themeToggle").onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    };

    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.innerHTML = icons[btn.dataset.view] + `<span>${btn.dataset.label}</span>`;
      btn.onclick = () => setView(btn.dataset.view);
    });

    // Keyboard: space to flip when studying
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && state.view === "study" && state.studyQueue.length && state.studyIndex < state.studyQueue.length) {
        e.preventDefault();
        document.getElementById("flashcard")?.click();
      }
      if (e.key === "Escape") closeModal();
    });

    setView("home");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
