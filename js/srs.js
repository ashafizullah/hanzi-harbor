// Spaced repetition (SM-2 inspired) for HanziHarbor
// status: new | learning | reviewing | mastered | hard

const SRS_KEY = "hanziharbor_srs_v1";

function defaultCardState() {
  return {
    status: "new",
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: 0,
    lastReview: null,
  };
}

function loadSrs() {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSrs(map) {
  localStorage.setItem(SRS_KEY, JSON.stringify(map));
}

function getCardState(id) {
  const map = loadSrs();
  return map[id] || defaultCardState();
}

function setCardState(id, state) {
  const map = loadSrs();
  map[id] = state;
  saveSrs(map);
}

// quality: 0 again/hard, 1 still learning, 2 good, 3 easy/mastered
function gradeCard(id, quality) {
  const s = getCardState(id);
  s.reps += 1;
  s.lastReview = Date.now();

  if (quality === 0) {
    s.status = "hard";
    s.lapses += 1;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.interval = 0;
    s.due = Date.now() + 5 * 60 * 1000; // 5 min — re-see soon
  } else if (quality === 1) {
    s.status = "learning";
    s.interval = Math.max(1, s.interval || 0);
    s.ease = Math.max(1.3, s.ease - 0.05);
    s.due = Date.now() + 24 * 60 * 60 * 1000; // tomorrow
  } else if (quality === 2) {
    s.status = "reviewing";
    if (s.interval < 1) s.interval = 1;
    else s.interval = Math.max(1, Math.round(s.interval * s.ease));
    s.ease = Math.min(3.0, s.ease + 0.05);
    s.due = Date.now() + s.interval * 24 * 60 * 60 * 1000;
  } else {
    s.status = "mastered";
    s.interval = Math.max(s.interval * 1.5, 10);
    s.ease = Math.min(3.2, s.ease + 0.1);
    s.due = Date.now() + s.interval * 24 * 60 * 60 * 1000;
  }

  setCardState(id, s);
  return s;
}

function markStatus(id, status) {
  const map = loadSrs();
  if (status === "new") {
    map[id] = defaultCardState();
    saveSrs(map);
    return map[id];
  }
  const s = map[id] || defaultCardState();
  s.status = status;
  s.lastReview = Date.now();
  if (status === "mastered") {
    s.interval = Math.max(s.interval || 0, 7);
    s.due = Date.now() + s.interval * 24 * 60 * 60 * 1000;
  } else if (status === "learning") {
    s.interval = 1;
    s.due = Date.now() + 24 * 60 * 60 * 1000;
  } else if (status === "hard") {
    s.interval = 0;
    s.due = Date.now() + 5 * 60 * 1000;
  }
  map[id] = s;
  saveSrs(map);
  return s;
}

function isDue(state) {
  if (!state || state.status === "new") return false; // new handled separately
  if (state.status === "mastered") return false;
  return !state.due || state.due <= Date.now();
}

// Cards already in the system that are due for review
function getReviewDueIds(vocab) {
  const map = loadSrs();
  return vocab
    .filter((v) => {
      const s = map[v.id];
      if (!s || s.status === "new") return false;
      return isDue(s);
    })
    .map((v) => v.id);
}

// Untouched cards, sorted by HSK then frequency order in list
function getNewIds(vocab, maxHsk = 6) {
  const map = loadSrs();
  return vocab
    .filter((v) => v.hsk <= maxHsk)
    .filter((v) => !map[v.id] || map[v.id].status === "new")
    .map((v) => v.id);
}

// Highest HSK level with meaningful progress; unlock next when mastered enough
function getUnlockedLevel(vocab) {
  const map = loadSrs();
  let unlocked = 1;
  for (let h = 1; h <= 6; h++) {
    const level = vocab.filter((v) => v.hsk === h);
    if (!level.length) continue;
    const seen = level.filter((v) => map[v.id] && map[v.id].status !== "new");
    // Unlock next level after seeing 60% of current level
    if (seen.length / level.length >= 0.6) unlocked = Math.min(6, h + 1);
    else break;
  }
  return unlocked;
}

// Build a balanced session: reviews first, then new words up to daily budget
function buildSession(vocab, opts = {}) {
  const map = loadSrs();
  const sessionCap = opts.sessionCap || 20;
  const dailyNewLimit = opts.dailyNewLimit || 8;
  const newIntroducedToday = opts.newIntroducedToday || 0;
  const unlocked = getUnlockedLevel(vocab);

  const rank = { hard: 0, learning: 1, reviewing: 2, new: 3, mastered: 4 };

  const reviews = prioritize(getReviewDueIds(vocab), map);

  const newBudget = Math.max(0, dailyNewLimit - newIntroducedToday);
  const newIds = getNewIds(vocab, unlocked).slice(0, newBudget);

  // Prefer ~70% review / 30% new when both exist
  let reviewSlice = reviews;
  let newSlice = newIds;
  if (reviews.length && newIds.length) {
    const reviewTarget = Math.min(reviews.length, Math.max(sessionCap - newIds.length, Math.floor(sessionCap * 0.7)));
    reviewSlice = reviews.slice(0, reviewTarget);
    newSlice = newIds.slice(0, sessionCap - reviewSlice.length);
  } else if (reviews.length) {
    reviewSlice = reviews.slice(0, sessionCap);
    newSlice = [];
  } else {
    reviewSlice = [];
    newSlice = newIds.slice(0, Math.min(sessionCap, dailyNewLimit));
  }

  // Interleave lightly so new words aren't all at the end
  const queue = [];
  const R = reviewSlice.slice();
  const N = newSlice.slice();
  while (R.length || N.length) {
    if (R.length && (!N.length || queue.length % 3 !== 2)) queue.push(R.shift());
    else if (N.length) queue.push(N.shift());
  }

  return {
    queue,
    reviewCount: reviewSlice.length,
    newCount: newSlice.length,
    totalDueReviews: reviews.length,
    totalNewAvailable: newIds.length,
    unlockedLevel: unlocked,
    dailyNewRemaining: Math.max(0, dailyNewLimit - newIntroducedToday - newSlice.length),
  };
}

function prioritize(ids, map) {
  const rank = { hard: 0, learning: 1, reviewing: 2, new: 3, mastered: 4 };
  return [...ids].sort((a, b) => {
    const sa = map[a]?.status || "new";
    const sb = map[b]?.status || "new";
    if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
    const da = map[a]?.due || 0;
    const db = map[b]?.due || 0;
    return da - db;
  });
}

window.SRS = {
  loadSrs,
  saveSrs,
  getCardState,
  setCardState,
  gradeCard,
  markStatus,
  getReviewDueIds,
  getNewIds,
  getUnlockedLevel,
  buildSession,
  prioritize,
  defaultCardState,
};
