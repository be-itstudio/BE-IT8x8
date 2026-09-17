(function () {
  "use strict";
  const C = window.CONFIG;
  const HAS_DB = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  const REST = C.SUPABASE_URL + "/rest/v1";
  const $ = s => document.querySelector(s);
  const el = h => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  const esc = s => (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1500); };

  // ---------- dates (all in Sydney) ----------
  const sydNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: C.TIMEZONE }));
  const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const TODAY = ymd(sydNow());
  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return ymd(d); };
  const dow = iso => new Date(iso + "T00:00:00").getDay();               // 0 Sun .. 6 Sat
  const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const nice = iso => { const d = new Date(iso + "T00:00:00"); return WD[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()]; };
  const weekStart = iso => addDays(iso, -((dow(iso) + 6) % 7));           // Monday of that week

  const DAYS = (() => { const o = []; let d = C.START_DATE; while (d <= C.END_DATE) { o.push(d); d = addDays(d, 1); } return o; })();
  const WEEKS = (() => {
    const w = []; let cur = null;
    DAYS.forEach(d => { if (dow(d) === 1 || !cur) { cur = { start: d, days: [] }; w.push(cur); } cur.days.push(d); });
    w.forEach(x => x.last = x.days[x.days.length - 1]);
    return w;
  })();
  const currentWeek = () => WEEKS.find(w => TODAY >= w.start && TODAY <= w.last) || null;
  const phase = TODAY < C.START_DATE ? "pre" : (TODAY > C.END_DATE ? "over" : "live");
  const HABIT_KEYS = ["macros", "water", "move", "read", "input", "c1", "c2", "c3"];
  const DAY_INDEX = DAYS.indexOf(TODAY) + 1;                              // 1-based day-of-challenge, 0 if outside range
  const TOTAL_DAYS = DAYS.length;

  // ---------- scoring ----------
  function score(daysMap, detoxSet) {
    let total = 0; const perfect = {};
    DAYS.forEach(d => {
      const r = daysMap[d]; if (!r) { perfect[d] = false; return; }
      const n = HABIT_KEYS.reduce((a, k) => a + (r[k] ? 1 : 0), 0);
      total += n * C.POINTS_PER_TICK; perfect[d] = (n === 8);
    });
    WEEKS.forEach(w => {
      if (TODAY <= w.last) return;                                        // bonuses only at week close
      if (w.days.every(d => perfect[d])) total += C.PERFECT_WEEK_BONUS;
      if (detoxSet.has(w.start)) total += C.DETOX_BONUS;
    });
    let streak = 0, d = perfect[TODAY] ? TODAY : addDays(TODAY, -1);
    while (d >= C.START_DATE && d <= C.END_DATE && perfect[d]) { streak++; d = addDays(d, -1); }
    return { total, streak, perfect };
  }

  // ---------- api ----------
  const H = () => ({ apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + C.SUPABASE_ANON_KEY, "Content-Type": "application/json" });
  const api = {
    async memberByToken(tok) {
      const r = await fetch(REST + "/b8_members?select=*&token=eq." + encodeURIComponent(tok), { headers: H() });
      const rows = r.ok ? await r.json() : []; return rows[0] || null;
    },
    async allMembers() {
      const r = await fetch(REST + "/b8_members?select=*&order=created_at", { headers: H() });
      return r.ok ? r.json() : [];
    },
    async daysFor(id) {
      const r = await fetch(REST + "/b8_days?select=*&member_id=eq." + id, { headers: H() });
      const rows = r.ok ? await r.json() : []; const m = {}; rows.forEach(x => m[x.date] = x); return m;
    },
    async detoxFor(id) {
      const r = await fetch(REST + "/b8_detox?select=week_start&member_id=eq." + id, { headers: H() });
      const rows = r.ok ? await r.json() : []; return new Set(rows.map(x => x.week_start));
    },
    async allDays() {
      const m = {}, PAGE = 1000; let from = 0;
      while (true) {
        const r = await fetch(REST + "/b8_days?select=*", { headers: { ...H(), "Range-Unit": "items", Range: from + "-" + (from + PAGE - 1) } });
        if (!r.ok) break; const rows = await r.json();
        rows.forEach(x => (m[x.member_id] = m[x.member_id] || {})[x.date] = x);
        if (rows.length < PAGE) break; from += PAGE;
      }
      return m;
    },
    async allDetox() {
      const r = await fetch(REST + "/b8_detox?select=member_id,week_start", { headers: H() });
      const rows = r.ok ? await r.json() : []; const m = {}; rows.forEach(x => (m[x.member_id] = m[x.member_id] || new Set()).add(x.week_start)); return m;
    },
    async tick(id, date, field, val) {
      const r = await fetch(REST + "/b8_days", {
        method: "POST", headers: { ...H(), Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ member_id: id, date, [field]: val })
      });
      return r.ok;
    },
    async setDetox(id, week, on) {
      if (on) {
        const r = await fetch(REST + "/b8_detox", { method: "POST", headers: { ...H(), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ member_id: id, week_start: week }) });
        return r.ok;
      }
      const r = await fetch(REST + "/b8_detox?member_id=eq." + id + "&week_start=eq." + week, { method: "DELETE", headers: H() });
      return r.ok;
    },
    async patchMember(id, patch) {
      const r = await fetch(REST + "/b8_members?id=eq." + id, { method: "PATCH", headers: H(), body: JSON.stringify(patch) });
      return r.ok;
    },
    async addMember(row) {
      const r = await fetch(REST + "/b8_members", { method: "POST", headers: { ...H(), Prefer: "return=representation" }, body: JSON.stringify(row) });
      const rows = r.ok ? await r.json() : []; return rows[0] || null;
    },
    async deleteMember(id) {
      const r = await fetch(REST + "/b8_members?id=eq." + id, { method: "DELETE", headers: H() });
      return r.ok;
    },
  };

  // ---------- view switching ----------
  const VIEWS = ["gate", "setup", "home", "board", "admin"];
  function show(v) {
    VIEWS.forEach(x => $("#view-" + x).classList.toggle("hide", x !== v));
    const inApp = (v === "home" || v === "board");
    $("#tabs").classList.toggle("hide", !inApp);
    $("#logoImg").classList.toggle("hide", false);
    if (inApp) document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === v));
    window.scrollTo(0, 0);
  }

  // ---------- state ----------
  let ME = null, MY_DAYS = {}, MY_DETOX = new Set(), OWNER = false;

  // ================= FRONT DOOR (join / find / onboard) =================
  const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";                 // no ambiguous 0/O/1/I/L
  const genCode = () => { let s = ""; for (let i = 0; i < 5; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]; return s; };
  async function uniqueCode() { for (let i = 0; i < 6; i++) { const c = genCode(); if (!(await api.memberByToken(c))) return c; } return genCode() + "2"; }
  const myLink = tok => location.origin + location.pathname.replace(/index\.html$/, "") + "?m=" + tok;

  function showFront(msg) {
    $("#view-gate").innerHTML = `<div class="center">
      <img class="tl" src="welcome.png" alt="BE-IT 8x8 — Choosing Transformation">
      ${msg ? `<div class="note warn" style="max-width:340px;margin-bottom:14px">${esc(msg)}</div>` : ""}
      <div class="card" style="max-width:340px; width:100%">
        <div class="kick sm">Welcome to 8x8</div>
        <p class="sub" style="margin:0 0 14px">Paid up and ready? Join below. Already started? Jump back in.</p>
        <button class="btn" id="goJoin" style="margin-bottom:10px">I've paid — join</button>
        <button class="btn ghost" id="goFind">Find my account</button>
      </div></div>`;
    show("gate");
    $("#goJoin").onclick = showJoin;
    $("#goFind").onclick = showFind;
  }

  function showJoin() {
    $("#view-gate").innerHTML = `<div class="wrap" style="max-width:420px;margin:0 auto">
      <div class="eyebrow">Join 8x8</div>
      <div class="kick sm">Enter your join code</div>
      <p class="sub" style="margin:0 0 12px">BE-IT sent this with your link once you paid.</p>
      <div class="card">
        <input class="txt" id="joincode" placeholder="Join code" autocapitalize="none">
        <button class="btn" id="joinGo" style="margin-top:12px">Continue</button>
        <button class="btn ghost sm" id="joinBack" style="margin-top:10px">← Back</button>
      </div></div>`;
    show("gate");
    const pc = new URLSearchParams(location.search).get("code"); if (pc) $("#joincode").value = pc;
    $("#joinBack").onclick = () => showFront();
    $("#joinGo").onclick = () => {
      if (($("#joincode").value || "").trim().toLowerCase() === String(C.JOIN_CODE).toLowerCase()) renderOnboard();
      else toast("That code isn't right");
    };
  }

  function renderOnboard() {
    const act = C.ACTIVITY_LEVELS.map(a => `<option>${esc(a)}</option>`).join("");
    const inp = C.INPUT_CHOICES.map(a => `<option>${esc(a)}</option>`).join("");
    $("#view-gate").innerHTML = `<div class="wrap" style="max-width:460px;margin:0 auto">
      <div class="eyebrow">Onboarding · one time</div>
      <div class="kick sm">Your details</div>
      <p class="sub" style="margin:0 0 12px">Court uses your numbers to set your macros. You'll pick your habits and write your becoming statement in the app straight after.</p>
      <div class="card">
        <label class="fld"><span class="lb">Full name *</span><input class="txt" id="o_name"></label>
        <label class="fld"><span class="lb">Gender *</span><select class="txt" id="o_gender"><option value="">Choose…</option><option value="F">Female</option><option value="M">Male</option></select></label>
        <label class="fld"><span class="lb">Mobile *</span><input class="txt" id="o_phone" inputmode="tel"></label>
        <label class="fld"><span class="lb">Email</span><input class="txt" id="o_email" inputmode="email"></label>
        <label class="fld"><span class="lb">Height *</span><input class="txt" id="o_height" placeholder="e.g. 178cm"></label>
        <label class="fld"><span class="lb">Weight *</span><input class="txt" id="o_weight" placeholder="e.g. 82kg"></label>
        <label class="fld"><span class="lb">Age *</span><input class="txt" id="o_age" inputmode="numeric"></label>
        <label class="fld"><span class="lb">Activity level *</span><select class="txt" id="o_activity"><option value="">Choose…</option>${act}</select></label>
        <label class="fld"><span class="lb">Injuries or dietary restrictions</span><textarea class="txt" id="o_injuries" placeholder="Anything Court should know…"></textarea></label>
        <label class="fld" style="margin:0"><span class="lb">Your daily input *</span><select class="txt" id="o_input"><option value="">Choose…</option>${inp}</select></label>
      </div>
      <div class="card">
        <div class="hrow pick" id="o_consent" data-on="0"><span class="lab">I'm happy for BE-IT to use my before/after photos in marketing</span><span class="cb"></span></div>
        <div class="hrow pick" id="o_agree" data-on="0" style="margin-top:8px"><span class="lab">I understand these eight habits are locked for eight weeks *</span><span class="cb"></span></div>
      </div>
      <button class="btn" id="onbGo">Create my account</button>
      <button class="btn ghost sm" id="onbBack" style="margin-top:10px">← Back</button>
    </div>`;
    show("gate");
    const tog = id => { const n = $(id); n.onclick = () => { const on = n.dataset.on !== "1"; n.dataset.on = on ? "1" : "0"; n.classList.toggle("on", on); n.querySelector(".cb").textContent = on ? "✓" : ""; }; };
    tog("#o_consent"); tog("#o_agree");
    $("#onbBack").onclick = () => showJoin();
    $("#onbGo").onclick = submitOnboard;
  }

  async function submitOnboard() {
    const v = id => ($(id).value || "").trim();
    const req = { name: "#o_name", gender: "#o_gender", phone: "#o_phone", height: "#o_height", weight: "#o_weight", age: "#o_age", activity: "#o_activity", input: "#o_input" };
    for (const k in req) if (!v(req[k])) { toast("Fill in all the * fields"); $(req[k]).focus(); return; }
    if ($("#o_agree").dataset.on !== "1") { toast("Please tick the 8-week sign-off"); return; }
    const btn = $("#onbGo"); btn.disabled = true; btn.textContent = "Creating…";
    const code = await uniqueCode();
    const m = await api.addMember({
      token: code, name: v("#o_name"), gender: v("#o_gender"), phone: v("#o_phone"), email: v("#o_email"),
      height: v("#o_height"), weight: v("#o_weight"), age: v("#o_age"), activity: v("#o_activity"),
      injuries: v("#o_injuries"), input_choice: v("#o_input"),
      photo_consent: $("#o_consent").dataset.on === "1", agreed: true, setup_complete: false,
    });
    if (!m) { btn.disabled = false; btn.textContent = "Create my account"; toast("⚠️ Couldn't save — check signal"); return; }
    ME = m; localStorage.setItem("b8_token", m.token); showWelcome(m);
  }

  function showWelcome(m) {
    $("#view-gate").innerHTML = `<div class="center"><div class="card" style="max-width:360px;width:100%">
      <div class="kick sm">You're in, ${esc((m.name || "").split(" ")[0])} 🖤</div>
      <p class="sub" style="margin:0 0 12px">This is your personal code — it's how you log back in on any phone. Screenshot it.</p>
      <div class="card" style="text-align:center;background:#fff;color:#000;margin:0 0 14px">
        <div style="font-family:var(--display);font-size:40px;letter-spacing:3px">${esc(m.token)}</div>
        <div style="color:#444;font-size:11px;letter-spacing:2px;text-transform:uppercase">your code</div>
      </div>
      <button class="btn" id="wlGo">Next: build your statement →</button>
      <button class="btn ghost sm" id="wlCopy" style="margin-top:10px">Copy my private link</button>
    </div></div>`;
    show("gate");
    $("#wlCopy").onclick = async () => { try { await navigator.clipboard.writeText(myLink(m.token)); toast("Link copied"); } catch (e) { toast("Copy failed"); } };
    $("#wlGo").onclick = () => { setupState = { b1: "", b2: "", b3: "", habits: [] }; renderSetup(); };
  }

  function showFind() {
    $("#view-gate").innerHTML = `<div class="wrap" style="max-width:420px;margin:0 auto">
      <div class="eyebrow">Welcome back</div>
      <div class="kick sm">Enter your code</div>
      <p class="sub" style="margin:0 0 12px">The personal code you got when you joined. Lost it? Message a BE-IT coach.</p>
      <div class="card">
        <input class="txt" id="findcode" placeholder="Your code" autocapitalize="characters">
        <button class="btn" id="findGo" style="margin-top:12px">Log in</button>
        <button class="btn ghost sm" id="findBack" style="margin-top:10px">← Back</button>
      </div></div>`;
    show("gate");
    $("#findBack").onclick = () => showFront();
    $("#findGo").onclick = async () => {
      const val = ($("#findcode").value || "").trim(); if (!val) return;
      let m = await api.memberByToken(val) || await api.memberByToken(val.toUpperCase());
      if (!m) { toast("Code not recognised"); return; }
      ME = m; localStorage.setItem("b8_token", m.token);
      if (!ME.setup_complete && TODAY <= C.LOCK_DATE) { setupState = { b1: "", b2: "", b3: "", habits: [] }; return renderSetup(); }
      loadMineThen(renderHome);
    };
  }

  // ================= SETUP (first launch) =================
  let setupState = { b1: "", b2: "", b3: "", habits: [] };
  function lineBlock(n, cfg) {
    const opts = cfg.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join("");
    return `<label class="fld">
      <span class="lb">${esc(cfg.prefix)}…</span>
      <select class="txt" data-act="bsel" data-n="${n}">
        <option value="">Choose…</option>${opts}
        <option value="__own">✍️ Write my own</option>
      </select>
      <input class="txt" data-act="bown" data-n="${n}" placeholder="Write your own…" style="margin-top:8px; display:none">
    </label>`;
  }
  function renderSetup() {
    const s = setupState;
    const preview = (s.b1 || s.b2 || s.b3)
      ? `<div class="becoming" style="font-size:16px">
           I am someone who <b>${esc(s.b1 || "…")}</b>. I prove it by <b>${esc(s.b2 || "…")}</b>. I don't negotiate with <b>${esc(s.b3 || "…")}</b>.
           <span class="fixed">${esc(C.BECOMING_FIXED_LINE)}</span></div>`
      : `<p class="sub">Your statement builds here as you choose.</p>`;
    const habits = C.CHOOSABLE_HABITS.map((h, i) => {
      const on = s.habits.includes(i);
      return `<div class="hrow pick ${on ? "on" : ""}" data-act="pick" data-i="${i}">
        <span class="lab">${esc(h)}</span>
        <span class="cb">${on ? "✓" : ""}</span></div>`;
    }).join("");
    const fixedList = C.FIXED_HABITS.map(f => `<div class="hrow locked">
        <span class="lab">${esc(f.label)}</span><span class="tag">everyone</span></div>`).join("");
    const ready = s.b1 && s.b2 && s.b3 && s.habits.length === 3;
    $("#view-setup").innerHTML = `<div class="wrap">
      <div class="eyebrow">First launch · one time</div>
      <div class="kick">Create your<br>becoming statement</div>
      <p class="sub" style="margin:0 0 8px">This is the destination you're setting. You'll read it out loud every morning for 55 days — it's the GPS for who you're becoming.</p>
      <p class="sub" style="margin:0 0 14px"><b>Don't pick what's comfortable. Pick who you are choosing to become.</b></p>
      <div class="card">
        ${lineBlock(1, C.BECOMING_LINE1)}
        ${lineBlock(2, C.BECOMING_LINE2)}
        ${lineBlock(3, C.BECOMING_LINE3)}
      </div>
      <div class="card">${preview}</div>
      <p class="sub" style="margin:10px 0 0">It locks on Sun 11 Oct — no edits after.</p>

      <div class="kick sm" style="margin-top:24px">Choose your three</div>
      <p class="sub" style="margin:0 0 8px">Everyone does the five. These three are your choice — daily, for eight weeks, locked the moment you submit.</p>
      <p class="sub" style="margin:0 0 14px"><b>Choose the three that would change you. Not the three you could already tick today.</b></p>
      <div class="divlab">The five everyone does</div>
      ${fixedList}
      <div class="divlab">Your three</div>
      ${habits}
      <div class="note ${s.habits.length === 3 ? "" : "warn"}" id="pickcount" style="margin:10px 0 16px">${s.habits.length}/3 chosen</div>

      <button class="btn" id="setupSave" ${ready ? "" : "disabled"}>Lock it in</button>
    </div>`;
    $("#view-setup").querySelectorAll("[data-act]").forEach(bindSetup);
    const sv = $("#setupSave"); if (sv) sv.onclick = confirmSetup;
    show("setup");
  }
  function bindSetup(node) {
    const act = node.dataset.act;
    if (act === "bsel") node.onchange = () => {
      const n = node.dataset.n, own = node.parentElement.querySelector('[data-act="bown"]');
      if (node.value === "__own") { own.style.display = "block"; own.focus(); setupState["b" + n] = own.value.trim(); }
      else { own.style.display = "none"; setupState["b" + n] = node.value; }
      renderPreviewOnly();
    };
    if (act === "bown") node.oninput = () => { setupState["b" + node.dataset.n] = node.value.trim(); renderPreviewOnly(); };
    if (act === "pick") node.onclick = () => {
      const i = +node.dataset.i, arr = setupState.habits, at = arr.indexOf(i);
      if (at >= 0) arr.splice(at, 1);
      else { if (arr.length >= 3) { toast("Pick exactly 3"); return; } arr.push(i); }
      const on = arr.includes(i);                                          // update in place — no re-render, no scroll jump
      node.classList.toggle("on", on);
      node.querySelector(".cb").textContent = on ? "✓" : "";
      const pc = $("#pickcount"); if (pc) { pc.textContent = arr.length + "/3 chosen"; pc.classList.toggle("warn", arr.length !== 3); }
      renderPreviewOnly();
    };
  }
  function renderPreviewOnly() { // light refresh without losing focus: just update preview + button
    const s = setupState;
    const card = $("#view-setup").querySelectorAll(".card")[1];
    if (card) card.innerHTML = (s.b1 || s.b2 || s.b3)
      ? `<div class="becoming" style="font-size:16px">I am someone who <b>${esc(s.b1 || "…")}</b>. I prove it by <b>${esc(s.b2 || "…")}</b>. I don't negotiate with <b>${esc(s.b3 || "…")}</b>.<span class="fixed">${esc(C.BECOMING_FIXED_LINE)}</span></div>`
      : `<p class="sub">Your statement builds here as you choose.</p>`;
    const ready = s.b1 && s.b2 && s.b3 && s.habits.length === 3;
    const sv = $("#setupSave"); if (sv) sv.disabled = !ready;
  }
  function confirmSetup() {
    const s = setupState;
    const h = s.habits.map(i => C.CHOOSABLE_HABITS[i]);
    const msg = `Lock this in? No edits after.\n\nI am someone who ${s.b1}.\nI prove it by ${s.b2}.\nI don't negotiate with ${s.b3}.\n\nHabits:\n• ${h.join("\n• ")}`;
    if (!confirm(msg)) return;
    const patch = { b1: s.b1, b2: s.b2, b3: s.b3, h1: h[0], h2: h[1], h3: h[2], setup_complete: true };
    Object.assign(ME, patch);
    api.patchMember(ME.id, patch).then(ok => {
      if (!ok) { toast("⚠️ Not saved — check signal"); ME.setup_complete = false; return; }
      toast("Locked in 🔒"); loadMineThen(renderHome);
    });
  }

  // ================= HOME =================
  const chosenLabels = m => [m.h1, m.h2, m.h3];
  function becomingHtml(m) {
    return `<div class="becoming">
      I am someone who <b>${esc(m.b1)}</b>. I prove it by <b>${esc(m.b2)}</b>. I don't negotiate with <b>${esc(m.b3)}</b>.
      <span class="fixed">${esc(C.BECOMING_FIXED_LINE)}</span></div>`;
  }
  function habitRow(field, label, on, locked) {
    return `<div class="hrow ${on ? "on" : ""} ${locked ? "locked" : ""}" ${locked ? "" : `data-act="tick" data-f="${field}"`}>
      <span class="lab">${esc(label)}</span>
      ${locked ? `<span class="tag">${phase === "pre" ? "soon" : "closed"}</span>` : `<span class="cb">${on ? "✓" : ""}</span>`}
    </div>`;
  }
  function renderHome() {
    if (!ME.setup_complete) {
      $("#view-home").innerHTML = `<div class="wrap"><div class="card"><div class="kick sm">Not set up</div>
        <p class="sub">Your becoming statement and habits weren't locked in before Sun 11 Oct. Grab a BE-IT coach — they can set it for you.</p></div></div>`;
      show("home"); return;
    }
    const r = MY_DAYS[TODAY] || {};
    const editable = phase === "live";
    const sc = score(MY_DAYS, MY_DETOX);
    const fixed = C.FIXED_HABITS.map(f => habitRow(f.key, f.label, !!r[f.key], !editable)).join("");
    const chosen = chosenLabels(ME).map((lab, i) => habitRow("c" + (i + 1), lab, !!r["c" + (i + 1)], !editable)).join("");
    const cw = currentWeek();
    const detoxOn = cw ? MY_DETOX.has(cw.start) : false;
    const detox = cw ? `<div class="hrow ${detoxOn ? "on" : ""} ${editable ? "" : "locked"}" ${editable ? `data-act="detox"` : ""}>
        <span class="lab">${esc(C.DETOX_LABEL)}<br><span class="tag">weekly bonus · +${C.DETOX_BONUS}</span></span>
        ${editable ? `<span class="cb">${detoxOn ? "✓" : ""}</span>` : `<span class="tag">closed</span>`}</div>` : "";

    const banner = phase === "pre"
      ? `<div class="note warn" style="margin-bottom:12px">Challenge starts <b>Mon 12 Oct</b>. Read your statement daily — ticking for points opens on day one.</div>`
      : phase === "over"
        ? `<div class="note" style="margin-bottom:12px">Challenge complete. Final total below. 🖤</div>` : "";
    const dayComplete = HABIT_KEYS.every(k => !!r[k]);

    $("#view-home").innerHTML = `<div class="wrap">
      ${banner}
      ${phase === "live" ? `<div class="kick daycount">Day ${DAY_INDEX} / ${TOTAL_DAYS}</div>` : ""}
      ${dayComplete ? `<button class="day-pill" id="viewCompleteBtn">✓ Day complete — view</button>` : ""}
      <div class="eyebrow">${phase === "live" ? nice(TODAY) : "Your becoming statement"}</div>
      <div class="card">${becomingHtml(ME)}</div>

      <div class="stat">
        <div class="b"><div class="n pts">${sc.total}</div><div class="l">Points</div></div>
        <div class="b"><div class="n pts">${sc.streak}${sc.streak ? " 🔥" : ""}</div><div class="l">Day streak</div></div>
      </div>

      <div class="divlab">Today · tick to complete</div>
      ${fixed}
      <div class="divlab">Your three</div>
      ${chosen}
      ${detox ? `<div class="divlab">This week</div>${detox}` : ""}
    </div>`;
    $("#view-home").querySelectorAll("[data-act]").forEach(bindHome);
    if ($("#viewCompleteBtn")) $("#viewCompleteBtn").onclick = renderCompleteCard;
    show("home");
  }
  function updateHomeStats() {
    const sc = score(MY_DAYS, MY_DETOX);
    const ns = document.querySelectorAll("#view-home .stat .n");
    if (ns[0]) ns[0].textContent = sc.total;
    if (ns[1]) ns[1].textContent = sc.streak + (sc.streak ? " 🔥" : "");
  }
  function paintRow(node, on) { node.classList.toggle("on", on); const cb = node.querySelector(".cb"); if (cb) cb.textContent = on ? "✓" : ""; }
  function bindHome(node) {
    const act = node.dataset.act;
    if (act === "tick") node.onclick = async () => {                       // toggle in place — page stays put
      const f = node.dataset.f; const r = MY_DAYS[TODAY] || (MY_DAYS[TODAY] = { member_id: ME.id, date: TODAY });
      const nv = !r[f]; r[f] = nv; paintRow(node, nv); updateHomeStats();
      const ok = await api.tick(ME.id, TODAY, f, nv);
      if (!ok) { r[f] = !nv; paintRow(node, !nv); updateHomeStats(); toast("⚠️ Not saved — check signal"); return; }
      if (nv && HABIT_KEYS.every(k => !!r[k])) { renderCompleteCard(); renderHome(); }
    };
    if (act === "detox") node.onclick = async () => {
      const cw = currentWeek(); if (!cw) return;
      const on = !MY_DETOX.has(cw.start);
      if (on) MY_DETOX.add(cw.start); else MY_DETOX.delete(cw.start);
      paintRow(node, on); updateHomeStats();
      const ok = await api.setDetox(ME.id, cw.start, on);
      if (!ok) { if (on) MY_DETOX.delete(cw.start); else MY_DETOX.add(cw.start); paintRow(node, !on); updateHomeStats(); toast("⚠️ Not saved"); }
    };
  }

  // ================= DAY-COMPLETE CARD =================
  function dayHabitCount(iso) { return HABIT_KEYS.reduce((a, k) => a + (MY_DAYS[iso] && MY_DAYS[iso][k] ? 1 : 0), 0); }
  function dayStatus(iso) {
    if (iso > TODAY) return "future";
    const n = dayHabitCount(iso);
    return n === 8 ? "perfect" : n > 0 ? "partial" : "missed";
  }
  function completeGridHtml() {
    return WEEKS.map(w => `<div class="wk">${w.days.map(d =>
      `<div class="d ${dayStatus(d)} ${d === TODAY ? "today" : ""}"></div>`).join("")}</div>`).join("");
  }
  function renderCompleteCard() {
    const sc = score(MY_DAYS, MY_DETOX);
    const quotes = C.COMPLETION_QUOTES || [];
    const quote = quotes.length ? quotes[(DAY_INDEX - 1) % quotes.length] : "";
    $("#view-complete").innerHTML = `
      <button class="cmpl-close" id="cmplClose">✕</button>
      <button class="cmpl-share" id="cmplShare">↑</button>
      <div class="cmpl-card" id="cmplCard">
        <img class="cmpl-logo" src="logo.png" alt="BE-IT 8x8">
        <div class="cmpl-title">Day ${DAY_INDEX} complete</div>
        <div class="cmpl-sub">Choosing Transformation</div>
        ${quote ? `<div class="cmpl-quote">“${esc(quote)}”</div>` : ""}
        <div class="cmpl-grid">${completeGridHtml()}</div>
        <div class="cmpl-foot">${sc.streak ? sc.streak + " day streak 🔥 · " : ""}${sc.total} points</div>
      </div>`;
    $("#view-complete").classList.remove("hide");
    $("#cmplClose").onclick = () => $("#view-complete").classList.add("hide");
    $("#cmplShare").onclick = shareCompleteCard;
  }
  async function shareCompleteCard() {
    if (typeof html2canvas === "undefined") { toast("⚠️ Sharing unavailable — try a screenshot"); return; }
    const node = $("#cmplCard");
    let canvas;
    try { canvas = await html2canvas(node, { backgroundColor: "#000000", scale: 2 }); }
    catch (e) { toast("⚠️ Couldn't build image — try a screenshot"); return; }
    canvas.toBlob(async blob => {
      if (!blob) { toast("⚠️ Couldn't build image"); return; }
      const file = new File([blob], "beit-8x8-day-" + DAY_INDEX + ".png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "BE-IT 8x8" }); return; } catch (e) { /* user cancelled or unsupported, fall through */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  // ================= LEADERBOARD =================
  async function renderBoard() {
    $("#view-board").innerHTML = `<div class="wrap"><p class="sub" style="text-align:center;padding:24px">Loading…</p></div>`;
    show("board");
    let members, days, detox;
    try { members = await api.allMembers(); days = await api.allDays(); detox = await api.allDetox(); }
    catch (e) {
      $("#view-board").innerHTML = `<div class="wrap"><div class="card" style="text-align:center">
        <p class="sub" style="margin:0 0 12px">Couldn't load — check your signal.</p>
        <button class="btn ghost sm" id="bretry">Try again</button></div></div>`;
      $("#bretry").onclick = renderBoard; return;
    }
    const rows = members.filter(m => m.setup_complete).map(m => {
      const sc = score(days[m.id] || {}, detox[m.id] || new Set());
      return { id: m.id, name: m.name, pts: sc.total, streak: sc.streak };
    }).sort((a, b) => b.pts - a.pts || b.streak - a.streak);
    const medal = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
    const body = rows.map((m, i) => `<tr class="${ME && m.id === ME.id ? "me" : ""}">
      <td><span class="rankmed">${medal(i)}</span></td>
      <td>${esc(m.name)}</td>
      <td class="num">${m.pts}</td>
      <td class="num">${m.streak ? m.streak + " 🔥" : "–"}</td></tr>`).join("");
    $("#view-board").innerHTML = `<div class="wrap">
      <div class="eyebrow">Choosing transformation</div>
      <div class="kick">Leaderboard</div>
      <p class="sub" style="margin:0 0 12px">Ranked on total points. Streak is bragging rights, not ranked.</p>
      <div class="card tight"><table>
        <thead><tr><th>#</th><th>Name</th><th class="num">Points</th><th class="num">Streak</th></tr></thead>
        <tbody>${body || `<tr><td colspan="4" class="sub" style="padding:16px">Nobody's locked in yet.</td></tr>`}</tbody>
      </table></div>
    </div>`;
  }

  // ================= ADMIN =================
  const randTok = () => Math.random().toString(36).slice(2, 8);
  const linkFor = tok => location.origin + location.pathname.replace(/index\.html$/, "") + "?m=" + tok;
  function showAdmin() {
    OWNER = localStorage.getItem("b8_owner") === "1";
    if (!OWNER) {
      $("#view-admin").innerHTML = `<div class="wrap"><div class="card" style="max-width:340px;margin:40px auto">
        <div class="kick sm">Owner tools</div>
        <label class="fld"><span class="lb">Owner code</span><input class="txt" id="ocode" type="password" placeholder="code"></label>
        <button class="btn" id="ounlock">Unlock</button></div></div>`;
      show("admin");
      $("#ounlock").onclick = () => { if ($("#ocode").value.trim() === C.OWNER_CODE) { localStorage.setItem("b8_owner", "1"); showAdmin(); } else toast("Wrong code"); };
      return;
    }
    renderAdmin();
  }
  async function renderAdmin() {
    $("#view-admin").innerHTML = `<div class="wrap"><p class="sub" style="text-align:center;padding:24px">Loading…</p></div>`;
    show("admin");
    const members = await api.allMembers();
    const byId = {}; members.forEach(m => byId[m.id] = m);
    const list = members.map(m => `<div class="hrow" style="cursor:default; align-items:flex-start">
      <span class="lab">${esc(m.name)} ${m.gender ? `<span class="tag">${esc(m.gender)}</span>` : ""}
        <br><span class="tag">code ${esc(m.token)} · ${m.setup_complete ? "set up ✓" : "not set up"}</span>
        ${m.phone ? `<br><span class="sub" style="font-size:11px">${esc(m.phone)}</span>` : ""}</span>
      <span style="display:flex; flex-direction:column; gap:6px; min-width:98px">
        <button class="btn sm" data-act="edit" data-id="${m.id}">Edit</button>
        <button class="btn sm ghost" data-act="copy" data-l="${esc(linkFor(m.token))}">Copy link</button>
        <button class="btn sm danger" data-act="del" data-id="${m.id}" data-n="${esc(m.name)}">Delete</button>
      </span></div>`).join("");
    $("#view-admin").innerHTML = `<div class="wrap">
      <div class="eyebrow">Owner tools</div>
      <div class="kick sm">Members (${members.length})</div>
      <div class="card">
        <label class="fld"><span class="lb">Add members — one per line: Name, M/F</span>
          <textarea class="txt" id="addbox" placeholder="Jess Taylor, F&#10;Mark Lee, M"></textarea></label>
        <button class="btn" id="addbtn">Add &amp; make links</button>
      </div>
      ${members.length ? `<div style="display:flex; gap:8px; margin-bottom:12px">
        <button class="btn ghost sm" id="copyall" style="flex:1">Copy all links</button>
        <button class="btn ghost sm" id="exportcsv" style="flex:1">Export CSV</button></div>` : ""}
      ${list || `<p class="sub">No members yet — add them above, or they self-join.</p>`}
      <button class="btn ghost sm" id="olock" style="margin-top:16px">Lock owner tools</button>
    </div>`;
    const box = $("#addbox");
    $("#addbtn").onclick = async () => {
      const lines = box.value.split("\n").map(x => x.trim()).filter(Boolean);
      if (!lines.length) return;
      let n = 0;
      for (const line of lines) {
        const parts = line.split(","); const name = parts[0].trim();
        const gender = (parts[1] || "").trim().toUpperCase().slice(0, 1);
        if (!name) continue;
        const ok = await api.addMember({ token: randTok(), name, gender: gender || null });
        if (ok) n++;
      }
      toast(n + " added"); renderAdmin();
    };
    const ca = $("#copyall");
    if (ca) ca.onclick = async () => {
      const txt = members.map(m => m.name + " — code " + m.token + " — " + linkFor(m.token)).join("\n");
      try { await navigator.clipboard.writeText(txt); toast("All links copied"); } catch (e) { toast("Copy failed"); }
    };
    const ex = $("#exportcsv"); if (ex) ex.onclick = () => exportCSV(members);
    $("#olock").onclick = () => { localStorage.removeItem("b8_owner"); showAdmin(); };
    $("#view-admin").querySelectorAll("[data-act]").forEach(node => {
      const act = node.dataset.act;
      if (act === "edit") node.onclick = () => editMember(byId[node.dataset.id]);
      if (act === "copy") node.onclick = async () => { try { await navigator.clipboard.writeText(node.dataset.l); toast("Link copied"); } catch (e) { toast("Copy failed"); } };
      if (act === "del") node.onclick = async () => { if (!confirm("Delete " + node.dataset.n + "? This removes all their data.")) return; await api.deleteMember(node.dataset.id); toast("Deleted"); renderAdmin(); };
    });
  }

  function editMember(m) {
    if (!m) return renderAdmin();
    const opt = (v, list) => `<option value="">—</option>` + list.map(x => `<option ${v === x ? "selected" : ""}>${esc(x)}</option>`).join("");
    const F = (id, label, val, area) => `<label class="fld"><span class="lb">${label}</span>${area ? `<textarea class="txt" id="${id}">${esc(val || "")}</textarea>` : `<input class="txt" id="${id}" value="${esc(val || "")}">`}</label>`;
    $("#view-admin").innerHTML = `<div class="wrap" style="max-width:460px;margin:0 auto">
      <div class="eyebrow">Edit member · code ${esc(m.token)}</div>
      <div class="kick sm">${esc(m.name)}</div>
      <div class="card">
        ${F("e_name", "Full name", m.name)}
        <label class="fld"><span class="lb">Gender</span><select class="txt" id="e_gender">${opt(m.gender, ["F", "M"])}</select></label>
        ${F("e_phone", "Mobile", m.phone)}${F("e_email", "Email", m.email)}
        ${F("e_height", "Height", m.height)}${F("e_weight", "Weight", m.weight)}${F("e_age", "Age", m.age)}
        <label class="fld"><span class="lb">Activity</span><select class="txt" id="e_activity">${opt(m.activity, C.ACTIVITY_LEVELS)}</select></label>
        ${F("e_injuries", "Injuries / dietary", m.injuries, true)}
        <label class="fld" style="margin:0"><span class="lb">Daily input</span><select class="txt" id="e_input">${opt(m.input_choice, C.INPUT_CHOICES)}</select></label>
      </div>
      <div class="card">
        <div class="divlab" style="margin-top:0">Chosen habits</div>
        <label class="fld"><span class="lb">Habit 1</span><select class="txt" id="e_h1">${opt(m.h1, C.CHOOSABLE_HABITS)}</select></label>
        <label class="fld"><span class="lb">Habit 2</span><select class="txt" id="e_h2">${opt(m.h2, C.CHOOSABLE_HABITS)}</select></label>
        <label class="fld" style="margin:0"><span class="lb">Habit 3</span><select class="txt" id="e_h3">${opt(m.h3, C.CHOOSABLE_HABITS)}</select></label>
      </div>
      <div class="card">
        <div class="divlab" style="margin-top:0">Becoming statement</div>
        ${F("e_b1", "I am someone who…", m.b1)}${F("e_b2", "I prove it by…", m.b2)}${F("e_b3", "I don't negotiate with…", m.b3)}
      </div>
      <button class="btn" id="e_save">Save changes</button>
      <button class="btn ghost sm" id="e_reset" style="margin-top:10px">Reset their setup (they redo habits + statement)</button>
      <button class="btn ghost sm" id="e_back" style="margin-top:10px">← Back to members</button>
    </div>`;
    show("admin");
    $("#e_back").onclick = renderAdmin;
    $("#e_save").onclick = async () => {
      const v = id => ($(id).value || "").trim() || null;
      const patch = {
        name: v("#e_name") || m.name, gender: v("#e_gender"), phone: v("#e_phone"), email: v("#e_email"),
        height: v("#e_height"), weight: v("#e_weight"), age: v("#e_age"), activity: v("#e_activity"),
        injuries: v("#e_injuries"), input_choice: v("#e_input"),
        h1: v("#e_h1"), h2: v("#e_h2"), h3: v("#e_h3"), b1: v("#e_b1"), b2: v("#e_b2"), b3: v("#e_b3"),
      };
      const ok = await api.patchMember(m.id, patch);
      toast(ok ? "Saved ✓" : "⚠️ Not saved"); if (ok) renderAdmin();
    };
    $("#e_reset").onclick = async () => {
      if (!confirm("Reset " + m.name + "'s setup? They redo their habits + statement.")) return;
      await api.patchMember(m.id, { setup_complete: false, h1: null, h2: null, h3: null, b1: null, b2: null, b3: null });
      toast("Reset"); renderAdmin();
    };
  }

  function exportCSV(members) {
    const cols = ["name", "gender", "phone", "email", "height", "weight", "age", "activity", "injuries", "input_choice", "photo_consent", "h1", "h2", "h3", "token", "setup_complete", "created_at"];
    const head = ["Name", "Gender", "Phone", "Email", "Height", "Weight", "Age", "Activity", "Injuries/dietary", "Input", "Photo consent", "Habit 1", "Habit 2", "Habit 3", "Code", "Set up", "Joined"];
    const q = x => { x = (x == null ? "" : String(x)); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const csv = [head.join(",")].concat(members.map(m => cols.map(c => q(m[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "beit-8x8-members.csv"; a.click();
    toast("Exported");
  }

  // ---------- boot ----------
  document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => { b.dataset.tab === "board" ? renderBoard() : renderHome(); });
  $("#adminBtn").onclick = () => showAdmin();

  function loadMineThen(fn) { Promise.all([api.daysFor(ME.id), api.detoxFor(ME.id)]).then(([d, x]) => { MY_DAYS = d; MY_DETOX = x; fn(); }); }

  async function boot() {
    if (!HAS_DB) return showFront("Database not connected yet. (Add Supabase keys in config.js.)");
    const params = new URLSearchParams(location.search);
    if (params.has("admin")) return showAdmin();
    if (params.has("join")) return showJoin();
    let tok = params.get("m") || localStorage.getItem("b8_token");
    if (params.get("m")) { localStorage.setItem("b8_token", params.get("m")); history.replaceState(null, "", location.pathname); }
    if (!tok) return showFront();
    try { ME = await api.memberByToken(tok); }
    catch (e) { return showFront("Couldn't connect — check your signal and reopen."); }
    if (!ME) return showFront("That link isn't recognised. Join below, or find your account.");
    if (!ME.setup_complete && TODAY <= C.LOCK_DATE) { setupState = { b1: "", b2: "", b3: "", habits: [] }; return renderSetup(); }
    loadMineThen(renderHome);
  }
  boot();
})();
