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
  LOCK_DATE:   "2026-09-24",   // TEST MODE — was 2026-10-11, revert before real members join
  TIMEZONE:    "Australia/Sydney",
  // Week 8 is a 6-day week (Mon 30 Nov – Sat 5 Dec); perfect-week bonus applies at 6/6.

  // --- SCORING -----------------------------------------------------
  POINTS_PER_TICK:   10,    // 7 daily habits ticked = 70/day
  PERFECT_WEEK_BONUS: 200,  // all 7 daily habits every day of the week, PLUS the detox tick that week
  DETOX_BONUS:       100,   // weekly socials-detox tick (counts every week it's ticked, regardless of the rest)

  // --- OWNER TOOLS -------------------------------------------------
  OWNER_CODE: "beit8x8",    // unlock admin: members, links, edits, export
  JOIN_CODE:  "beit8x8",    // shared "door" code to start a self-onboarding signup
  NUTRITION_LEVELS: ["80/20", "90/10", "100% whole food"],
  INPUT_CHOICES: ["Non-fiction Book", "Audiobook"],

  // --- THE FIVE DAILY FIXED HABITS (same wording for everyone) -----
  // Socials detox is the 6th "set" habit but is weekly, not daily — handled separately, see DETOX_LABEL below.
  FIXED_HABITS: [
    { key: "macros", label: "Eat whole food" },
    { key: "water",  label: "Hit your water" },
    { key: "move",   label: "Move for 45 minutes" },
    { key: "read",   label: "Read your becoming statement" },
    { key: "input",  label: "Ten minutes of input" },
  ],

  // --- THE MENU OF TWELVE (each member picks 2 at first launch) ----
  CHOOSABLE_HABITS: [
    "No alcohol",
    "7+ hours sleep",
    "No food after 8pm",
    "No phone for the first 30 minutes of the day",
    "No screens 30 minutes before bed",
    "10 minutes of morning sunlight within 30 minutes of waking",
    "10,000 steps",
    "10 minutes mobility or stretching",
    "Three lines journalled",
    "Five minutes of stillness — prayer, meditation or silence",
    "One message of encouragement to someone else",
    "5 minutes of daily breathwork (app or guided)",
  ],

  // --- THE WEEKLY DETOX (one of the eight habits, but weekly) ------
  DETOX_LABEL: "Socials detox — a full 24 hours off social media",

  // --- FUEL TAB (static, read-only — nothing here is tracked or scored) ---
  FUEL_SECTIONS: [
    { title: "Why real food", body: `
      <p>Most of what fills a supermarket was built in a factory to be eaten fast and eaten again. It's the reason a lot of us feel flat, foggy, and hungry an hour after eating.</p>
      <p>Real food does the opposite. It fills you up, and it gives your body what it needs to recover, sleep and think clearly.</p>
      <p>No counting. No weighing. No scanning. For eight weeks you eat food that looks like food, and you pay attention to what it does to you.</p>
      <p><b>The rule:</b> nothing out of a packet with more than five ingredients.</p>` },
    { title: "What to expect", body: `
      <p>We're telling you this up front so you don't think something's gone wrong.</p>
      <p><b>Days 1–5</b> are the hard bit. Headaches, tiredness, thinking about food more than usual. Your body is adjusting. It passes.</p>
      <p><b>Week 2</b> — energy levels out. The 3pm crash shrinks.</p>
      <p><b>Week 3 on</b> — this is where most people go <i>oh</i>. Sleep's better. You're not hungry an hour after eating. Cooking has become a habit instead of a decision.</p>
      <p>If week one is rough, you're not doing it wrong. You're doing it.</p>
      <p class="fuel-note"><i>If you feel more than mildly off, or it hasn't settled after a few days, see your GP.</i></p>` },
    { title: "Your level", body: `
      <p>Locked for eight weeks. <b>80/20</b> = 4 free meals a week. <b>90/10</b> = 2. <b>100%</b> = none.</p>
      <p>A free meal is <b>one meal, normal size.</b> Not a day, not a weekend. Alcohol counts as one — two drinks, one meal used. Used or lost, resets Monday.</p>
      <p>You can move up mid-challenge. Not down. No level scores more than another.</p>` },
    { title: "What our plates look like", body: `
      <p>Not a formula. Just the shape we come back to.</p>
      <p>Something with protein — meat, fish, eggs, yoghurt. Something that grew — veg, salad, fruit. Something that came out of the ground — rice, potatoes, oats. Fat you can name — olive oil, butter, avocado.</p>
      <p>Eat until you're satisfied. Most of us have stopped noticing where that point is. Finding it again is part of the eight weeks.</p>
      <p><b>Always fine:</b> coffee, tea, salt, herbs, spices, olive oil, butter, honey, protein powder, milk, yoghurt, cheese, tinned tomatoes, tinned fish, frozen veg, oats, rice, bread with five or fewer ingredients.</p>` },
    { title: "Become your own investigator", body: `
      <p>Nobody knows your body. Not us, not an app. The only way you find out what works is to pay attention — and most of us have outsourced that to a number on a screen.</p>
      <p>After a meal, ask:</p>
      <ul>
        <li>How do I feel an hour from now?</li>
        <li>Was that enough, or am I already thinking about the next thing?</li>
        <li>Did I eat that sitting down, or standing up on my phone?</li>
        <li>How did I sleep after the way I ate yesterday?</li>
        <li>Was I hungry, or was I tired, bored or stressed?</li>
      </ul>
      <p>Try eating at the same times each day, sitting down, phone face down. Same food, different experience.</p>
      <p class="fuel-note"><i>If food starts feeling stressful or all-consuming, tell a coach. That's what we're here for.</i></p>` },
    { title: "Meals we love", body: `
      <p>Meal ideas coming soon — we'll drop 8–10 go-to combos here.</p>
      <p>Posted in the group chat weekly too. Steal freely.</p>` },
    { title: "Beyond the eight weeks", body: `
      <p>Eight weeks is long enough for this to stop being something you're doing and start being how you eat.</p>
      <p>By December you'll have your own data — what makes you feel good, what flattens you, what happens when you sleep and eat well at the same time. Nobody can take that off you.</p>
      <p>Then you add things back on your terms. That's the difference between a diet and a standard.</p>
      <p class="fuel-final"><b>You are someone who fuels themselves well. You're not trying to become that person — you're proving you already are.</b></p>` },
  ],
  FUEL_FOOTER: "General information only, not nutritional or medical advice. We're sharing how we eat — real food instead of ultra-processed food. If you're pregnant, on medication or managing a health condition, check with your doctor first.",

  // --- DAY-COMPLETE CARD --------------------------------------------
  // Shown when all 7 daily habits are ticked for the day. One picked per day, in order, looping.
  COMPLETION_QUOTES: [
    "This is a commitment to a better you.",
    "Every action you take is a vote for who you want to become.",
    "Backing your words with action.",
    "This is who you said you'd be.",
    "Doing it for future you.",
    "Future you will thank you for choosing growth.",
    "It's a choice, not a chore.",
    "Keep choosing who you said you'd be.",
    "Be the person that inspires others to grow too.",
    "You are stacking the proof.",
    "Every day you show up for you, you build something that can't be bought.",
  ],

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
