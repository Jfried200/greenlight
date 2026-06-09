import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://iyhvtydtdtuippgqepax.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i0VdyOjM8nEmf7FADYB9rQ_IAEssVfH";

async function dbInsert(table, payload) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=representation" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { console.warn(`[gl] insert failed:`, await res.text()); return null; }
    return await res.json();
  } catch (e) { console.warn("[gl] db error:", e); return null; }
}

async function dbUpdate(table, id, payload) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=representation" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { console.warn(`[gl] update failed:`, await res.text()); return null; }
    return await res.json();
  } catch (e) { console.warn("[gl] db error:", e); return null; }
}

function getAnonId() {
  try {
    let id = localStorage.getItem("gl_anon_id");
    if (!id) { id = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("gl_anon_id", id); }
    return id;
  } catch { return "anon_" + Math.random().toString(36).slice(2); }
}

// ── Brand ──────────────────────────────────────────────────────────────────────
// #3 - Background: very dark green (almost black). Accent: brighter green.
const BRAND = {
  green: "#22D98A",        // brighter accent green
  dark: "#0A0F0D",         // very dark green, nearly black
  mid: "#111A15",
  muted: "#5A8A72",
  surface: "#111A15",
  border: "rgba(34,217,138,0.15)",
};

// ── Data ───────────────────────────────────────────────────────────────────────
// #5 - Vape: removed subtype step (single type). Tincture: removed subtype step.
const METHODS = [
  { id: "flower",      label: "Flower",      icon: "🌿", subtypes: ["Joint", "Blunt", "Pipe", "Bong", "One hitter", "Bowl"] },
  { id: "vape",        label: "Vape",        icon: "💨", subtypes: null },
  { id: "edible",      label: "Edible",      icon: "🍬", subtypes: ["Gummy / candy", "Beverage", "Capsule / pill", "Baked good"] },
  { id: "concentrate", label: "Concentrate", icon: "💎", subtypes: ["Dab", "Wax", "Shatter", "Live resin"] },
  { id: "tincture",    label: "Tincture",    icon: "🧪", subtypes: null },
];

const AMOUNTS = [
  { id: "light",    label: "A little",  desc: "One hit, a drag, half a low-dose gummy (2.5–5mg)", mult: 0.85 },
  { id: "moderate", label: "Moderate",  desc: "A proper session — full bowl, half a joint, 10mg edible", mult: 1.0 },
  { id: "heavy",    label: "A lot",     desc: "Blunt, dabs, 25mg+ edible, multiple hits", mult: 1.25 },
];

const BASE_WINDOWS = {
  flower: 150, vape: 120, edible: 420, concentrate: 210, tincture: 180,
};

const EDIBLE_SUBTYPES_SLOW = ["Capsule / pill", "Baked good"];

function calcWindow(method, subtype, amount) {
  let rec = BASE_WINDOWS[method] || 180;
  const a = AMOUNTS.find(a => a.id === amount);
  if (a) rec = Math.round(rec * a.mult);
  if (method === "edible") rec = Math.max(rec, EDIBLE_SUBTYPES_SLOW.includes(subtype) ? 480 : 240);
  if (method === "concentrate") rec = Math.max(rec, 120);
  return rec;
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtCountdown(secs) {
  if (secs <= 0) return "00:00:00";
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function getMsg(method, amount) {
  if (method === "edible") return "Edibles build slowly — giving it full time pays off. Don't stack.";
  if (method === "concentrate") return "High potency. Longer spacing protects your tolerance and your experience.";
  if (amount === "heavy") return "The full benefit is still unfolding. We'll be here when the timing is right.";
  if (amount === "light") return "Light session — your window is shorter, but still worth respecting.";
  return "A proper session. Let the effects fully land before you consider another.";
}

// ── Timer ring ─────────────────────────────────────────────────────────────────
const TimerRing = ({ progress, size = 260, children }) => {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.min(1, progress));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(34,217,138,0.1)" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={BRAND.green} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
      <foreignObject x={20} y={20} width={size-40} height={size-40}>
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};

const SCREENS = { HOME:"home", METHOD:"method", SUBTYPE:"subtype", AMOUNT:"amount", ADJUST:"adjust", RUNNING:"running", DONE:"done", FEEDBACK:"feedback" };

const RATINGS = [
  { id: "too_soon",     emoji: "👎👎", label: "Much too soon" },
  { id: "little_soon", emoji: "👎",   label: "A little too soon" },
  { id: "about_right", emoji: "👍",   label: "About right" },
  { id: "perfect",     emoji: "👍👍", label: "Perfect timing" },
];

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Greenlight() {
  const [screen, setScreen]           = useState(SCREENS.HOME);
  const [method, setMethod]           = useState(null);
  const [subtype, setSubtype]         = useState(null);
  const [amount, setAmount]           = useState(null);
  const [windowMins, setWindowMins]   = useState(0);
  const [adjustedMins, setAdjustedMins] = useState(0); // #1 user-adjusted timer
  const [secsLeft, setSecsLeft]       = useState(0);
  const [startTime, setStartTime]     = useState(null);
  const [feedback, setFeedback]       = useState(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (screen === SCREENS.RUNNING) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setScreen(SCREENS.DONE); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [screen]);

  // After amount is picked, calculate rec and go to ADJUST screen
  const handleAmount = (a) => {
    setAmount(a);
    const mins = calcWindow(method, subtype, a);
    setWindowMins(mins);
    setAdjustedMins(mins);
    setScreen(SCREENS.ADJUST);
  };

  const startTimer = async () => {
    const finalMins = adjustedMins;
    setSecsLeft(finalMins * 60);
    setStartTime(Date.now());
    setScreen(SCREENS.RUNNING);
    const rows = await dbInsert("sessions", {
      anon_id: getAnonId(), method, subtype, amount,
      recommended_mins: windowMins, adjusted_mins: finalMins,
      started_at: new Date().toISOString(),
    });
    if (rows && rows[0]?.id) setSessionId(rows[0].id);
  };

  const submitFeedback = async () => {
    setFeedbackDone(true);
    const actualElapsed = startTime ? Math.round((Date.now() - startTime) / 60000) : null;
    if (sessionId) {
      await dbUpdate("sessions", sessionId, { feedback, actual_elapsed_mins: actualElapsed, feedback_at: new Date().toISOString() });
    } else {
      await dbInsert("feedback", { anon_id: getAnonId(), method, subtype, amount, recommended_mins: windowMins, adjusted_mins: adjustedMins, actual_elapsed_mins: actualElapsed, feedback, feedback_at: new Date().toISOString() });
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setMethod(null); setSubtype(null); setAmount(null);
    setWindowMins(0); setAdjustedMins(0); setSecsLeft(0); setStartTime(null);
    setFeedback(null); setFeedbackDone(false); setSessionId(null);
    setScreen(SCREENS.HOME);
  };

  const progressRunning = adjustedMins > 0 ? (adjustedMins * 60 - secsLeft) / (adjustedMins * 60) : 0;
  const methodObj = METHODS.find(m => m.id === method);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    app: { minHeight:"100vh", background:BRAND.dark, display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"'Outfit','DM Sans',system-ui,sans-serif", color:"#e8f5f0", padding:"0 0 48px", overflowX:"hidden" },
    header: { width:"100%", padding:"24px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box" },
    wordmark: { fontSize:22, fontWeight:700, letterSpacing:"-0.5px", color:"#e8f5f0" },
    card: { background:BRAND.surface, border:`1px solid ${BRAND.border}`, borderRadius:20, padding:"20px", width:"100%", maxWidth:380, boxSizing:"border-box" },
    pill: { display:"inline-flex", alignItems:"center", gap:6, background:"rgba(34,217,138,0.08)", border:`1px solid rgba(34,217,138,0.2)`, borderRadius:100, padding:"6px 14px", fontSize:13, color:BRAND.green, fontWeight:500 },
    // #6 - button with depth, shadow, active press effect
    btn: {
      width:"100%", padding:"17px", borderRadius:14, border:"none",
      background:`linear-gradient(180deg, #28F096 0%, #1AB876 100%)`,
      color:"#0A0F0D", fontSize:16, fontWeight:700, cursor:"pointer",
      letterSpacing:"-0.2px", fontFamily:"inherit",
      boxShadow:"0 4px 0 #0D7A4A, 0 6px 16px rgba(34,217,138,0.25)",
      transform:"translateY(0)",
      transition:"transform 0.08s ease, box-shadow 0.08s ease",
      WebkitTapHighlightColor:"transparent",
    },
    btnGhost: { background:"transparent", border:`1px solid ${BRAND.border}`, color:BRAND.muted, borderRadius:14, padding:"13px 20px", fontSize:14, cursor:"pointer", fontFamily:"inherit" },
    label: { fontSize:13, color:BRAND.muted, fontWeight:500, letterSpacing:"0.3px", textTransform:"uppercase" },
    heading: { fontSize:22, fontWeight:700, color:"#e8f5f0", letterSpacing:"-0.5px", margin:"0 0 6px" },
    sub: { fontSize:14, color:BRAND.muted, lineHeight:1.5, margin:0 },
    grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
    optCard: (sel) => ({ background: sel ? "rgba(34,217,138,0.1)" : "rgba(255,255,255,0.03)", border:`1.5px solid ${sel ? BRAND.green : "rgba(34,217,138,0.08)"}`, borderRadius:14, padding:"14px", cursor:"pointer", transition:"all 0.15s ease", textAlign:"left" }),
    backBtn: { background:"transparent", border:"none", color:BRAND.muted, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0, fontFamily:"inherit" },
  };

  // Press effect handlers for main button
  const btnPress = (e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = "0 1px 0 #0D7A4A, 0 2px 8px rgba(34,217,138,0.2)"; };
  const btnRelease = (e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 0 #0D7A4A, 0 6px 16px rgba(34,217,138,0.25)"; };

  const PrimaryBtn = ({ onClick, disabled, children, style = {} }) => (
    <button
      style={{ ...s.btn, ...(disabled ? { opacity:0.4, cursor:"default" } : {}), ...style }}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={btnPress} onMouseUp={btnRelease}
      onTouchStart={btnPress} onTouchEnd={btnRelease}>
      {children}
    </button>
  );

  const wrap = (children) => (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={s.header}>
        <div style={s.wordmark}>green<span style={{ color:BRAND.green }}>light</span></div>
        {![SCREENS.HOME, SCREENS.RUNNING, SCREENS.DONE, SCREENS.FEEDBACK].includes(screen) && (
          <button style={s.backBtn} onClick={reset}>✕ start over</button>
        )}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:"100%", padding:"24px 20px 0", boxSizing:"border-box", gap:20 }}>
        {children}
      </div>
    </div>
  );

  // ── Screens ────────────────────────────────────────────────────────────────
  if (screen === SCREENS.HOME) return wrap(
    <>
      <div style={{ textAlign:"center", marginBottom:8 }}>
        <div style={{ ...s.pill, margin:"0 auto 20px" }}>find your tempo.</div>
        <h1 style={{ fontSize:32, fontWeight:700, color:"#e8f5f0", letterSpacing:"-1px", margin:"0 0 10px", lineHeight:1.1 }}>
          Know when to<br /><span style={{ color:BRAND.green }}>go again.</span>
        </h1>
        {/* #4 - Updated tagline */}
        <p style={{ ...s.sub, maxWidth:290, margin:"0 auto" }}>Get more from every session. Use smarter, waste less, feel better.</p>
      </div>
      <TimerRing progress={0.65} size={260}>
        <div style={{ fontSize:13, color:BRAND.muted, marginBottom:4 }}>next session in</div>
        <div style={{ fontSize:36, fontWeight:700, color:BRAND.green, letterSpacing:"-1px", lineHeight:1 }}>2h 15m</div>
        <div style={{ fontSize:12, color:"rgba(90,138,114,0.6)", marginTop:4 }}>example</div>
      </TimerRing>
      <PrimaryBtn onClick={() => setScreen(SCREENS.METHOD)} style={{ maxWidth:340 }}>Set my timer →</PrimaryBtn>
      <p style={{ fontSize:12, color:"rgba(90,138,114,0.5)", margin:"4px 0 0", textAlign:"center" }}>No account required</p>
    </>
  );

  if (screen === SCREENS.METHOD) return wrap(
    <div style={{ ...s.card, maxWidth:380 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ ...s.label, marginBottom:8 }}>Step 1 of 3</div>
        <h2 style={s.heading}>How did you consume?</h2>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {METHODS.map(m => (
          <div key={m.id} style={s.optCard(method === m.id)} onClick={() => {
            setMethod(m.id);
            // #5 - skip subtype for vape and tincture
            if (!m.subtypes) { setSubtype(null); setScreen(SCREENS.AMOUNT); }
            else setScreen(SCREENS.SUBTYPE);
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>{m.icon}</span>
              <span style={{ fontSize:15, fontWeight:600, color: method === m.id ? BRAND.green : "#e8f5f0" }}>{m.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === SCREENS.SUBTYPE) return wrap(
    <div style={{ ...s.card, maxWidth:380 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ ...s.label, marginBottom:8 }}>Step 2 of 3</div>
        <h2 style={s.heading}>Which type?</h2>
        <p style={s.sub}>{methodObj?.icon} {methodObj?.label}</p>
      </div>
      <div style={s.grid2}>
        {methodObj?.subtypes?.map(st => (
          <div key={st} style={s.optCard(subtype === st)} onClick={() => { setSubtype(st); setScreen(SCREENS.AMOUNT); }}>
            <div style={{ fontSize:14, fontWeight:500, color: subtype === st ? BRAND.green : "#e8f5f0" }}>{st}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === SCREENS.AMOUNT) return wrap(
    <div style={{ ...s.card, maxWidth:380 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ ...s.label, marginBottom:8 }}>Step {methodObj?.subtypes ? "3" : "2"} of {methodObj?.subtypes ? "3" : "2"}</div>
        <h2 style={s.heading}>How much?</h2>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {AMOUNTS.map(a => (
          <div key={a.id} style={{ ...s.optCard(amount === a.id), padding:"16px" }} onClick={() => handleAmount(a.id)}>
            <div style={{ fontSize:15, fontWeight:600, color: amount === a.id ? BRAND.green : "#e8f5f0", marginBottom:4 }}>{a.label}</div>
            <div style={{ fontSize:13, color:BRAND.muted, lineHeight:1.4 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // #1 - Adjust timer screen
  if (screen === SCREENS.ADJUST) return wrap(
    <div style={{ ...s.card, maxWidth:380 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ ...s.label, marginBottom:8 }}>Almost there</div>
        <h2 style={s.heading}>Your recommended wait</h2>
        <p style={s.sub}>Based on your session, we suggest waiting <strong style={{ color:BRAND.green }}>{fmtTime(windowMins)}</strong>. Adjust if you know your tolerance.</p>
      </div>
      <div style={{ background:"rgba(34,217,138,0.06)", border:`1px solid ${BRAND.border}`, borderRadius:16, padding:"20px", marginBottom:20, textAlign:"center" }}>
        <div style={{ fontSize:48, fontWeight:700, color:BRAND.green, letterSpacing:"-2px", lineHeight:1 }}>{fmtTime(adjustedMins)}</div>
        <div style={{ fontSize:13, color:BRAND.muted, marginTop:6 }}>your timer</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginTop:20 }}>
          {[[-30,"−30m"], [-15,"−15m"], [+15,"+15m"], [+30,"+30m"]].map(([delta, label]) => (
            <button key={label}
              style={{ background:"rgba(34,217,138,0.08)", border:`1px solid ${BRAND.border}`, borderRadius:10, padding:"8px 12px", color: delta < 0 ? BRAND.muted : BRAND.green, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
              onClick={() => setAdjustedMins(m => Math.max(15, m + delta))}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <PrimaryBtn onClick={startTimer}>Start timer — {fmtTime(adjustedMins)} →</PrimaryBtn>
      <button style={{ ...s.btnGhost, width:"100%", marginTop:10 }} onClick={reset}>Start over</button>
    </div>
  );

  if (screen === SCREENS.RUNNING) return wrap(
    <>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:13, color:BRAND.muted, textTransform:"uppercase", letterSpacing:"0.5px" }}>
          {methodObj?.icon} {methodObj?.label}{subtype ? ` · ${subtype}` : ""}
        </div>
      </div>
      <TimerRing progress={progressRunning} size={270}>
        <div style={{ fontSize:12, color:BRAND.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>wait time</div>
        <div style={{ fontSize:40, fontWeight:700, color:"#e8f5f0", letterSpacing:"-2px", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>
          {fmtCountdown(secsLeft)}
        </div>
        <div style={{ fontSize:13, color:BRAND.muted, marginTop:6 }}>of {fmtTime(adjustedMins)}</div>
      </TimerRing>
      <div style={{ ...s.card, maxWidth:340, textAlign:"center" }}>
        <p style={{ ...s.sub, fontSize:13, margin:0 }}>{getMsg(method, amount)}</p>
      </div>
      <button style={{ ...s.btnGhost }} onClick={reset}>Cancel</button>
    </>
  );

  if (screen === SCREENS.DONE) return wrap(
    <>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🟢</div>
        <h2 style={{ ...s.heading, fontSize:28, textAlign:"center" }}>You're good to go.</h2>
        <p style={{ ...s.sub, textAlign:"center" }}>Your {fmtTime(adjustedMins)} window is up.</p>
      </div>
      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:10 }}>
        <PrimaryBtn onClick={() => setScreen(SCREENS.FEEDBACK)}>Log next session + give feedback</PrimaryBtn>
        <button style={{ ...s.btnGhost, width:"100%" }} onClick={reset}>Start over</button>
      </div>
    </>
  );

  if (screen === SCREENS.FEEDBACK) {
    if (feedbackDone) return wrap(
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✨</div>
        <h2 style={{ ...s.heading, textAlign:"center" }}>Thanks — noted.</h2>
        <p style={{ ...s.sub, textAlign:"center", marginBottom:24 }}>Your feedback makes the next recommendation better.</p>
        <PrimaryBtn onClick={reset} style={{ maxWidth:300 }}>New session</PrimaryBtn>
      </div>
    );
    return wrap(
      <div style={{ ...s.card, maxWidth:380 }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ ...s.label, marginBottom:8 }}>Quick feedback</div>
          <h2 style={{ ...s.heading, fontSize:20 }}>How was the timing?<br />Did you find your tempo?</h2>
          <p style={{ ...s.sub, marginTop:6 }}>Last recommendation: {fmtTime(adjustedMins)}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {RATINGS.map(r => (
            <div key={r.id}
              style={{ ...s.optCard(feedback === r.id), display:"flex", alignItems:"center", gap:12, padding:"14px 16px" }}
              onClick={() => setFeedback(r.id)}>
              <span style={{ fontSize:20 }}>{r.emoji}</span>
              <span style={{ fontSize:15, fontWeight:500, color: feedback === r.id ? BRAND.green : "#e8f5f0" }}>{r.label}</span>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={submitFeedback} disabled={!feedback}>Submit</PrimaryBtn>
      </div>
    );
  }

  return null;
}
