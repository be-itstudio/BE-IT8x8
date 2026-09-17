// ============================================================
//  BE-IT 8x8  ·  SETTINGS  —  edit values here, nothing else.
//  "Choosing transformation. Eight weeks, eight habits."
// ============================================================
window.CONFIG = {
  // --- SHARED DATABASE ---------------------------------------------
  // DEV: points at Pete's existing Supabase (8x8 tables are prefixed b8_).
  // HANDOVER: blank these two — BE-IT pastes their own from Supabase → Settings → API.
  SUPABASE_URL: "https://jwrzswycqqoydywdvcdl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_-y7zKOSsPu9fKEczVd6rYQ_4Farc6HZ",

  // --- CHALLENGE DATES (Sydney) ------------------------------------
  START_DATE:  "2026-09-17",   // TEST MODE — was 2026-10-12, revert before real members join
  END_DATE:    "2026-12-05",   // Sat — Day 55, final day
  LOCK_DATE:   "2026-09-16",   // TEST MODE — was 2026-10-11, revert before real members join
  TIMEZONE:    "Australia/Sydney",
  // Week 8 is a 6-day week (Mon 30 Nov – Sat 5 Dec); perfect-week bonus applies at 6/6.

  // --- SCORING -----------------------------------------------------
  POINTS_PER_TICK:   10,    // 8 habits ticked = 80/day
  PERFECT_WEEK_BONUS: 200,  // all 8 habits, every day of a completed week
  DETOX_BONUS:       100,   // weekly socials-detox tick

  // --- OWNER TOOLS -------------------------------------------------
  OWNER_CODE: "beit8x8",    // unlock admin: members, links, edits, export
  JOIN_CODE:  "beit8x8",    // shared "door" code to start a self-onboarding signup
  ACTIVITY_LEVELS: ["Sedentary", "Lightly active", "Moderately active", "Very active", "Athlete"],
  INPUT_CHOICES: ["Book", "Audiobook", "Podcast"],

  // --- THE FIVE FIXED HABITS (same wording for everyone) -----------
  FIXED_HABITS: [
    { key: "macros", label: "Hit your macros" },
    { key: "water",  label: "Hit your water" },
    { key: "move",   label: "Move for 45 minutes" },
    { key: "read",   label: "Read your becoming statement" },
    { key: "input",  label: "Ten minutes of input" },
  ],

  // --- THE MENU OF TEN (each member picks 3 at first launch) -------
  CHOOSABLE_HABITS: [
    "No alcohol",
    "7+ hours sleep",
    "No food after 8pm",
    "No phone for the first 30 minutes of the day",
    "No added sugar",
    "Nothing with more than five ingredients on the label",
    "10,000 steps",
    "10 minutes mobility or stretching",
    "Three lines journalled",
    "One message of encouragement to someone else",
  ],

  // --- THE WEEKLY BONUS -------------------------------------------
  DETOX_LABEL: "Socials detox — a full 24 hours off social media",

  // --- BECOMING STATEMENT -----------------------------------------
  // 3 member-chosen lines + 1 fixed line. Each dropdown also gets "Write my own".
  BECOMING_FIXED_LINE: "This is who I am. Not who I'm trying to be.",
  BECOMING_LINE1: {   // "I am someone who ___."
    prefix: "I am someone who",
    options: [
      "keeps my word", "does what I say I'll do", "lives by my values, not my moods",
      "honours my own standards", "backs myself", "trusts myself", "leads myself first",
      "leads by example", "radiates love", "empowers others", "prioritises growth",
      "is present and secure in who I am", "is confident in who I am", "is strong",
      "is capable", "is disciplined", "shows up when it's hard", "finishes what I start",
      "chooses courage", "is becoming someone I'm proud of",
      "is anchored in something bigger than how I feel",
    ],
  },
  BECOMING_LINE2: {   // "I prove it by ___."
    prefix: "I prove it by",
    options: [
      "leading myself first", "following through on what I said I'd do",
      "showing up as the person I want to be", "choosing growth over comfort",
      "nourishing my body instead of numbing it", "fuelling my body because I respect it",
      "holding my standards when it's inconvenient", "doing the hard thing first",
      "doing the work when nobody's watching", "moving my body every single day",
      "speaking to myself the way I'd speak to someone I love",
      "starting my day with what I'm grateful for", "empowering others to become their best",
      "keeping going long after it stops being exciting",
    ],
  },
  BECOMING_LINE3: {   // "I don't negotiate with ___."
    prefix: "I don't negotiate with",
    options: [
      "my own excuses", "negative self-talk", "the version of me that quits",
      "giving up on who I said I'd be", "the story I used to tell about myself",
      "the voice that says I'm not capable", "how I feel in the moment", "distraction",
      "comfort", "half-effort", "doubt", "fear", "settling", "being too busy",
    ],
  },
};
