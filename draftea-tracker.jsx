import { useState, useEffect, useCallback } from "react";
import {
  Zap, Clock, BarChart2, TrendingUp, TrendingDown,
  CheckCircle2, Pencil, Trash2, ArrowUpRight,
  Target, Award, Activity, Minus, X, ChevronUp,
  AlignLeft, LogOut, Mail, Lock, Eye, EyeOff, User
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ─── Supabase config ──────────────────────────────────────────────────────────
const SUPA_URL = "https://tegfxbcteopwqfqikdkk.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ2Z4YmN0ZW9wd3FmcWlrZGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzAzMTgsImV4cCI6MjA5Nzc0NjMxOH0.00Exs-BVicsfOzFqME0viDpdwhi6pxwyUBQ7tSqchRY";

const headers = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPA_ANON,
  ...(token ? { "Authorization": `Bearer ${token}` } : { "Authorization": `Bearer ${SUPA_ANON}` }),
});

// ─── Auth API ────────────────────────────────────────────────────────────────
async function signUp(email, password) {
  const r = await fetch(`${SUPA_URL}/auth/v1/signup`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}
async function signIn(email, password) {
  const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}
async function signOut(token) {
  await fetch(`${SUPA_URL}/auth/v1/logout`, {
    method: "POST", headers: headers(token),
  });
}
async function getUser(token) {
  const r = await fetch(`${SUPA_URL}/auth/v1/user`, { headers: headers(token) });
  return r.json();
}

// ─── Sessions API ─────────────────────────────────────────────────────────────
async function fetchSessions(token) {
  const r = await fetch(`${SUPA_URL}/rest/v1/sessions?select=*&order=created_at.desc`, {
    headers: { ...headers(token), "Prefer": "return=representation" },
  });
  return r.json();
}
async function insertSession(token, data) {
  const r = await fetch(`${SUPA_URL}/rest/v1/sessions`, {
    method: "POST",
    headers: { ...headers(token), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return r.json();
}
async function updateSession(token, id, data) {
  const r = await fetch(`${SUPA_URL}/rest/v1/sessions?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers(token), "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return r.json();
}
async function deleteSession(token, id) {
  await fetch(`${SUPA_URL}/rest/v1/sessions?id=eq.${id}`, {
    method: "DELETE", headers: headers(token),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MXN = n => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
const PCT = n => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const todayStr = () => new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
const shortDate = s => { const p = s.split("/"); return p.length === 3 ? `${p[0]}/${p[1]}` : s; };

const G = "#34d399", R = "#fb7185", P = "#a855f7", B = "#3b82f6", C = "#06b6d4", MUTED = "#64748b";
const pc = p => p >= 0 ? G : R;

const TOKEN_KEY = "draftea_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = t => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setTokenS] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [capital, setCapital] = useState("");
  const [final, setFinal] = useState("");
  const [note, setNote] = useState("");
  const [view, setView] = useState("session");
  const [flash, setFlash] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const showToast = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 2600); };

  // ── Boot: restore session ──
  useEffect(() => {
    (async () => {
      const t = getToken();
      if (t) {
        const u = await getUser(t);
        if (u?.id) {
          setUser(u); setTokenS(t);
          await loadSessions(t);
        } else { setToken(null); }
      }
      setLoading(false);
    })();
  }, []);

  const loadSessions = async (t) => {
    setSyncing(true);
    const data = await fetchSessions(t);
    if (Array.isArray(data)) {
      setSessions(data);
      if (data.length > 0) setCapital(String(data[0].final));
    }
    setSyncing(false);
  };

  const handleAuth = async (email, password, isSignUp) => {
    const fn = isSignUp ? signUp : signIn;
    const data = await fn(email, password);
    if (data.error || data.error_description || data.msg) {
      showToast(data.error_description || data.msg || "Error de autenticación", true);
      return false;
    }
    const t = data.access_token;
    setToken(t); setTokenS(t);
    const u = isSignUp ? data.user : (await getUser(t));
    setUser(u);
    await loadSessions(t);
    showToast(isSignUp ? "Cuenta creada" : "Bienvenido de vuelta");
    return true;
  };

  const handleLogout = async () => {
    await signOut(token);
    setToken(null); setTokenS(null); setUser(null); setSessions([]); setCapital("");
    showToast("Sesión cerrada");
  };

  const handleSave = async () => {
    const c = parseFloat(capital), f = parseFloat(final);
    if (!c || !f || isNaN(c) || isNaN(f) || c <= 0) return;
    const profit = f - c, pct = (profit / c) * 100;
    const payload = { date: todayStr(), capital: c, final: f, profit, pct, note: note.trim() };
    setSyncing(true);
    if (editId) {
      const updated = await updateSession(token, editId, payload);
      if (Array.isArray(updated)) setSessions(prev => prev.map(s => s.id === editId ? updated[0] : s));
    } else {
      const inserted = await insertSession(token, payload);
      if (Array.isArray(inserted)) setSessions(prev => [inserted[0], ...prev]);
    }
    setSyncing(false);
    setCapital(String(f)); setFinal(""); setNote(""); setEditId(null);
    setFlash(true); setTimeout(() => setFlash(false), 1800);
    showToast(profit >= 0 ? "Guardado · " + MXN(profit) : "Guardado · " + MXN(profit));
  };

  const handleDelete = async (id) => {
    await deleteSession(token, id);
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast("Sesión eliminada");
  };

  const handleEdit = s => {
    setCapital(String(s.capital)); setFinal(String(s.final)); setNote(s.note || ""); setEditId(s.id); setView("session");
  };

  // ── Stats ──
  const wins = sessions.filter(s => s.profit > 0);
  const losses = sessions.filter(s => s.profit < 0);
  const totalP = sessions.reduce((a, b) => a + b.profit, 0);
  const avgP = sessions.length ? totalP / sessions.length : 0;
  const best = sessions.length ? sessions.reduce((a, b) => b.profit > a.profit ? b : a) : null;
  const worst = sessions.length ? sessions.reduce((a, b) => b.profit < a.profit ? b : a) : null;
  const wr = sessions.length ? (wins.length / sessions.length) * 100 : 0;
  let streak = 0, sType = null;
  for (const s of sessions) {
    const t = s.profit >= 0 ? "win" : "loss";
    if (!sType) { sType = t; streak = 1; } else if (t === sType) streak++; else break;
  }

  const chronoSessions = [...sessions].reverse();
  const chartData = chronoSessions.reduce((acc, s, i) => {
    const prev = i === 0 ? 0 : acc[i - 1].acum;
    acc.push({ date: shortDate(s.date), acum: +(prev + s.profit).toFixed(2), profit: +s.profit.toFixed(2) });
    return acc;
  }, []);

  const c2 = parseFloat(capital), f2 = parseFloat(final);
  const preview = !isNaN(c2) && !isNaN(f2) && c2 > 0 && final !== "" ? f2 - c2 : null;
  const last = sessions[0];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#07090f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div className="spinner" />
      <style>{`${GLOBAL_CSS} .spinner{width:32px;height:32px;border:2px solid rgba(168,85,247,0.2);border-top-color:#a855f7;border-radius:50%;animation:spin 0.8s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb mesh-orb-1" /><div className="mesh-orb mesh-orb-2" /><div className="mesh-orb mesh-orb-3" />
      </div>
      {toast && <Toast toast={toast} />}
      <AuthScreen onAuth={handleAuth} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb mesh-orb-1" /><div className="mesh-orb mesh-orb-2" /><div className="mesh-orb mesh-orb-3" />
      </div>
      {toast && <Toast toast={toast} />}
      {syncing && <div className="sync-bar" />}

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark"><Activity size={16} strokeWidth={2.5} /></div>
            <span className="logo-text">Draftea</span>
          </div>
          <nav className="sidebar-nav">
            {TABS.map(t => (
              <button key={t.id} className={`snav-item ${view === t.id ? "snav-active" : ""}`} onClick={() => setView(t.id)}>
                <t.Icon size={16} strokeWidth={1.8} /><span>{t.label}</span>
                {t.id === "history" && sessions.length > 0 && <span className="snav-badge">{sessions.length}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            {sessions.length > 0 && (
              <div className="sidebar-total">
                <div className="st-label">Total acumulado</div>
                <div className="st-value" style={{ color: pc(totalP) }}>{totalP >= 0 ? "+" : ""}{MXN(totalP)}</div>
              </div>
            )}
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={13} strokeWidth={2} /> Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="main-wrap">
          {/* Mobile header */}
          <header className="mobile-header">
            <div className="mh-logo">
              <div className="logo-mark-sm"><Activity size={13} strokeWidth={2.5} /></div>
              <span className="mh-title">Draftea</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {sessions.length > 0 && <div className="mh-total" style={{ color: pc(totalP) }}>{totalP >= 0 ? "+" : ""}{MXN(totalP)}</div>}
              <button className="mh-logout" onClick={handleLogout} title="Cerrar sesión"><LogOut size={14} strokeWidth={2} /></button>
            </div>
          </header>

          <main className="content-area">
            {view === "session" && <SessionView capital={capital} setCapital={setCapital} final={final} setFinal={setFinal} note={note} setNote={setNote} preview={preview} last={last} onSave={handleSave} flash={flash} editId={editId} onCancelEdit={() => { setEditId(null); setFinal(""); setNote(""); }} stats={{ wins, losses, totalP, avgP, wr, best, worst, streak, sType }} />}
            {view === "history" && <HistoryView sessions={sessions} onDelete={handleDelete} onEdit={handleEdit} />}
            {view === "charts" && <ChartsView chartData={chartData} sessions={sessions} stats={{ totalP, avgP, wr, wins, losses }} />}
          </main>

          <nav className="mobile-nav">
            {TABS.map(t => (
              <button key={t.id} className={`mnav-btn ${view === t.id ? "mnav-active" : ""}`} onClick={() => setView(t.id)}>
                <t.Icon size={20} strokeWidth={view === t.id ? 2.2 : 1.6} />
                <span className="mnav-lbl">{t.label}</span>
                {t.id === "history" && sessions.length > 0 && <span className="mnav-dot" />}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

const TABS = [
  { id: "session", label: "Sesión", Icon: Zap },
  { id: "history", label: "Historial", Icon: Clock },
  { id: "charts", label: "Gráficas", Icon: BarChart2 },
];

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handle = async () => {
    if (!email || !pass) return;
    setBusy(true); setErr("");
    const ok = await onAuth(email, pass, isSignUp);
    if (!ok) setErr(isSignUp ? "No se pudo crear la cuenta. Intenta con otra contraseña (min. 6 caracteres)." : "Correo o contraseña incorrectos.");
    setBusy(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <div className="logo-mark-lg"><Activity size={22} strokeWidth={2.5} /></div>
        </div>
        <h1 className="auth-title">Draftea Tracker</h1>
        <p className="auth-sub">{isSignUp ? "Crea tu cuenta para empezar" : "Inicia sesión para continuar"}</p>

        <div className="auth-fields">
          <div className="field-wrap">
            <label className="field-lbl"><Mail size={10} /> Correo electrónico</label>
            <div className="input-icon-wrap">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com" className="num-input" autoComplete="email"
                onKeyDown={e => e.key === "Enter" && handle()} />
            </div>
          </div>
          <div className="field-wrap">
            <label className="field-lbl"><Lock size={10} /> Contraseña</label>
            <div className="input-icon-wrap" style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" className="num-input" autoComplete={isSignUp ? "new-password" : "current-password"}
                onKeyDown={e => e.key === "Enter" && handle()} style={{ paddingRight: 40 }} />
              <button className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {err && <p className="auth-err"><X size={12} />{err}</p>}

        <button className="save-btn" onClick={handle} disabled={busy} style={{ marginTop: 8 }}>
          {busy
            ? <><div className="btn-spinner" />{isSignUp ? "Creando cuenta..." : "Iniciando sesión..."}</>
            : <><User size={15} />{isSignUp ? "Crear cuenta" : "Iniciar sesión"}</>}
        </button>

        <button className="auth-switch" onClick={() => { setIsSignUp(!isSignUp); setErr(""); }}>
          {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>
      </div>
    </div>
  );
}

// ─── Session View ─────────────────────────────────────────────────────────────
function SessionView({ capital, setCapital, final, setFinal, note, setNote, preview, last, onSave, flash, editId, onCancelEdit, stats }) {
  const { wins, losses, totalP, avgP, wr, best, worst, streak, sType } = stats;
  return (
    <div className="view">
      {last && !editId && (
        <div className="result-hero glass-card" style={{ borderColor: pc(last.profit) + "30" }}>
          <div className="rh-top">
            <div>
              <p className="label-xs">Sesión anterior · {last.date}</p>
              <div className="rh-amount" style={{ color: pc(last.profit) }}>{last.profit >= 0 ? "+" : ""}{MXN(last.profit)}</div>
              <p className="rh-pct" style={{ color: pc(last.profit) }}>{PCT(last.pct)}</p>
            </div>
            <div className="rh-icon-wrap" style={{ background: pc(last.profit) + "18", borderColor: pc(last.profit) + "30" }}>
              {last.profit >= 0 ? <TrendingUp size={22} color={G} strokeWidth={2} /> : <TrendingDown size={22} color={R} strokeWidth={2} />}
            </div>
          </div>
          <p className="rh-caption">{MXN(last.capital)} <ArrowUpRight size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {MXN(last.final)}</p>
        </div>
      )}

      <div className="input-card-wrap">
        <div className="mesh-card-glow" aria-hidden="true" />
        <div className="glass-card input-card">
          <div className="ic-header">
            <p className="label-xs">{editId ? "Editando sesión" : todayStr()}</p>
            {editId && <button className="cancel-btn" onClick={onCancelEdit}><X size={13} />Cancelar</button>}
          </div>
          <div className="fields-row">
            <Field label="Capital inicial" value={capital} onChange={setCapital} hint={last && !editId ? `Último: ${MXN(last.final)}` : undefined} />
            <Field label="Saldo final" value={final} onChange={setFinal} />
          </div>
          {preview !== null && (
            <div className="preview-pill" style={{ background: pc(preview) + "10", borderColor: pc(preview) + "30" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {preview >= 0 ? <TrendingUp size={14} color={G} /> : <TrendingDown size={14} color={R} />}
                <span className="preview-label">Resultado estimado</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="preview-val" style={{ color: pc(preview) }}>{preview >= 0 ? "+" : ""}{MXN(preview)}</span>
                <span className="preview-pct" style={{ color: pc(preview) }}>{PCT((preview / parseFloat(capital)) * 100)}</span>
              </div>
            </div>
          )}
          <div className="note-field">
            <label className="field-lbl"><AlignLeft size={10} /> Nota opcional</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="¿Qué ocurrió hoy?" className="text-input" />
          </div>
          <button className="save-btn" onClick={onSave} style={{ background: flash ? `linear-gradient(135deg,#059669,#10b981)` : undefined }}>
            {flash ? <><CheckCircle2 size={16} />Guardado</> : <><Zap size={16} strokeWidth={2.5} />{editId ? "Actualizar sesión" : "Guardar sesión"}</>}
          </button>
        </div>
      </div>

      {wins.length + losses.length > 0 && (
        <>
          <p className="section-eyebrow">Estadísticas</p>
          <div className="stats-grid">
            <StatCard Icon={Activity} label="Total" value={MXN(totalP)} color={pc(totalP)} />
            <StatCard Icon={Target} label="Promedio/sesión" value={MXN(avgP)} color={pc(avgP)} />
            <StatCard Icon={Award} label="Win rate" value={`${wr.toFixed(1)}%`} color={wr >= 50 ? G : R} />
            <StatCard Icon={BarChart2} label="Sesiones" value={`${wins.length}G · ${losses.length}P`} color={P} />
            {best && <StatCard Icon={TrendingUp} label="Mejor día" value={MXN(best.profit)} color={G} sub={best.date} />}
            {worst && <StatCard Icon={TrendingDown} label="Peor día" value={MXN(worst.profit)} color={R} sub={worst.date} />}
            {sType && <StatCard Icon={sType === "win" ? ChevronUp : Minus} label="Racha" value={`${streak} ${sType === "win" ? "victorias" : "pérdidas"}`} color={sType === "win" ? G : R} sub="consecutivas" />}
          </div>
        </>
      )}
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────
function HistoryView({ sessions, onDelete, onEdit }) {
  return (
    <div className="view">
      <p className="section-eyebrow">Historial</p>
      {sessions.length === 0 ? (
        <div className="glass-card empty-card">
          <Clock size={32} color={MUTED} strokeWidth={1.5} />
          <p className="empty-title">Sin sesiones</p>
          <p className="empty-sub">Registra tu primera sesión en la pestaña Sesión.</p>
        </div>
      ) : sessions.map(s => (
        <div key={s.id} className="glass-card history-row" style={{ borderColor: pc(s.profit) + "28" }}>
          <div className="hr-icon" style={{ background: pc(s.profit) + "14", borderColor: pc(s.profit) + "28" }}>
            {s.profit >= 0 ? <TrendingUp size={16} color={G} strokeWidth={2} /> : <TrendingDown size={16} color={R} strokeWidth={2} />}
          </div>
          <div className="hr-body">
            <p className="label-xs">{s.date}</p>
            <p className="hr-amount" style={{ color: pc(s.profit) }}>
              {s.profit >= 0 ? "+" : ""}{MXN(s.profit)}<span className="hr-pct">{PCT(s.pct)}</span>
            </p>
            <p className="hr-flow">{MXN(s.capital)} → {MXN(s.final)}</p>
            {s.note && <p className="hr-note">"{s.note}"</p>}
          </div>
          <div className="hr-actions">
            <button className="icon-btn" onClick={() => onEdit(s)}><Pencil size={14} strokeWidth={2} /></button>
            <button className="icon-btn danger" onClick={() => onDelete(s.id)}><Trash2 size={14} strokeWidth={2} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Charts View ──────────────────────────────────────────────────────────────
function ChartsView({ chartData, sessions, stats }) {
  const { totalP, avgP, wr } = stats;
  if (sessions.length === 0) return (
    <div className="view">
      <div className="glass-card empty-card">
        <BarChart2 size={32} color={MUTED} strokeWidth={1.5} />
        <p className="empty-title">Sin datos</p>
        <p className="empty-sub">Necesitas al menos una sesión para ver gráficas.</p>
      </div>
    </div>
  );
  return (
    <div className="view">
      <p className="section-eyebrow">Gráficas</p>
      <div className="kpi-row">
        <KPIPill label="Total" value={MXN(totalP)} color={pc(totalP)} />
        <KPIPill label="Win rate" value={`${wr.toFixed(0)}%`} color={wr >= 50 ? G : R} />
        <KPIPill label="Promedio" value={MXN(avgP)} color={pc(avgP)} />
      </div>
      <div className="glass-card chart-card">
        <div className="chart-header">
          <p className="chart-title">Crecimiento acumulado</p>
          <div className="chart-dot" style={{ background: P }} />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={P} />
                <stop offset="50%" stopColor={B} />
                <stop offset="100%" stopColor={C} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={58} />
            <Tooltip content={<LineTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="acum" stroke="url(#lg)" strokeWidth={2.5}
              dot={{ fill: P, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: P, stroke: "rgba(168,85,247,0.3)", strokeWidth: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card chart-card">
        <div className="chart-header">
          <p className="chart-title">Resultado por sesión</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="legend-item" style={{ color: G }}><span className="legend-dot" style={{ background: G }} />Ganancia</span>
            <span className="legend-item" style={{ color: R }}><span className="legend-dot" style={{ background: R }} />Pérdida</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={58} />
            <Tooltip content={<BarTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((d, i) => <Cell key={i} fill={d.profit >= 0 ? G : R} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, hint }) {
  return (
    <div className="field-wrap">
      <label className="field-lbl">{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00" className="num-input" inputMode="decimal" />
    </div>
  );
}
function StatCard({ Icon, label, value, color, sub }) {
  return (
    <div className="glass-card stat-card">
      <div className="sc-icon" style={{ background: color + "12", borderColor: color + "25" }}><Icon size={14} color={color} strokeWidth={2} /></div>
      <p className="sc-label">{label}</p>
      <p className="sc-value" style={{ color }}>{value}</p>
      {sub && <p className="sc-sub">{sub}</p>}
    </div>
  );
}
function KPIPill({ label, value, color }) {
  return (
    <div className="glass-card kpi-pill" style={{ borderColor: color + "30", background: color + "08" }}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={{ color }}>{value}</p>
    </div>
  );
}
function Toast({ toast }) {
  return (
    <div className="toast" style={{ borderColor: toast.err ? "rgba(251,113,133,0.3)" : "rgba(255,255,255,0.1)" }}>
      {toast.err ? <X size={14} color={R} /> : <CheckCircle2 size={14} color={G} />}
      {toast.msg}
    </div>
  );
}
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return <div className="chart-tooltip"><p className="tt-label">{label}</p><p className="tt-value" style={{ background: "linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{v >= 0 ? "+" : ""}{MXN(v)}</p></div>;
}
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return <div className="chart-tooltip"><p className="tt-label">{label}</p><p className="tt-value" style={{ color: pc(v) }}>{v >= 0 ? "+" : ""}{MXN(v)}</p></div>;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:#07090f;color:#f8fafc;font-family:'Inter',system-ui,sans-serif;overflow-x:hidden}

.mesh-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.mesh-orb{position:absolute;border-radius:50%;filter:blur(90px);animation:float 20s ease-in-out infinite alternate}
.mesh-orb-1{width:600px;height:600px;top:-200px;left:-150px;background:radial-gradient(ellipse,rgba(168,85,247,0.35),transparent 65%);animation-duration:22s}
.mesh-orb-2{width:500px;height:500px;bottom:-150px;right:-100px;background:radial-gradient(ellipse,rgba(59,130,246,0.3),transparent 65%);animation-duration:18s;animation-delay:-8s}
.mesh-orb-3{width:400px;height:400px;top:40%;left:35%;background:radial-gradient(ellipse,rgba(6,182,212,0.2),transparent 65%);animation-duration:26s;animation-delay:-14s}
@keyframes float{0%{transform:translate(0,0) scale(1)}100%{transform:translate(40px,60px) scale(1.08)}}

.sync-bar{position:fixed;top:0;left:0;right:0;height:2px;z-index:200;background:linear-gradient(90deg,#a855f7,#3b82f6,#06b6d4);animation:syncSlide 1.2s ease-in-out infinite alternate}
@keyframes syncSlide{0%{transform:translateX(-30%)}100%{transform:translateX(30%)}}

.layout{position:relative;z-index:1;display:flex;min-height:100vh}

.sidebar{display:none;width:220px;flex-shrink:0;position:fixed;top:0;left:0;bottom:0;z-index:40;padding:24px 16px;flex-direction:column;gap:8px;
  background:rgba(7,9,15,0.65);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);
  border-right:1px solid rgba(255,255,255,0.07)}
@media(min-width:768px){.sidebar{display:flex}}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:4px 8px 24px}
.logo-mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.logo-text{font-size:16px;font-weight:800;letter-spacing:-0.5px;color:#f8fafc}
.sidebar-nav{display:flex;flex-direction:column;gap:4px;flex:1}
.snav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border:none;background:transparent;color:#64748b;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;border-radius:10px;transition:background 0.15s,color 0.15s;text-align:left;position:relative}
.snav-item:hover{background:rgba(255,255,255,0.05);color:#94a3b8}
.snav-active{background:rgba(168,85,247,0.12)!important;color:#f8fafc!important}
.snav-active svg{color:#a855f7}
.snav-badge{margin-left:auto;background:rgba(168,85,247,0.25);color:#c084fc;border-radius:999px;padding:1px 7px;font-size:10px;font-weight:700}
.sidebar-footer{margin-top:auto;display:flex;flex-direction:column;gap:8px}
.sidebar-total{padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
.st-label{font-size:10px;color:#475569;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
.st-value{font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace}
.logout-btn{display:flex;align-items:center;gap:7px;padding:8px 12px;border:none;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;color:#475569;font-family:inherit;font-size:12px;cursor:pointer;transition:all 0.15s;font-weight:500}
.logout-btn:hover{background:rgba(251,113,133,0.08);color:#fb7185;border-color:rgba(251,113,133,0.2)}

.main-wrap{flex:1;display:flex;flex-direction:column;min-height:100vh}
@media(min-width:768px){.main-wrap{margin-left:220px}}

.mobile-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
  background:rgba(7,9,15,0.7);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);
  border-bottom:1px solid rgba(255,255,255,0.07);position:sticky;top:0;z-index:30}
@media(min-width:768px){.mobile-header{display:none}}
.mh-logo{display:flex;align-items:center;gap:8px}
.logo-mark-sm{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff}
.mh-title{font-size:16px;font-weight:800;letter-spacing:-0.4px}
.mh-total{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600}
.mh-logout{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 8px;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
.mh-logout:hover{color:#fb7185;border-color:rgba(251,113,133,0.25);background:rgba(251,113,133,0.08)}

.content-area{flex:1;padding-bottom:80px}
@media(min-width:768px){.content-area{padding-bottom:40px}}
.view{max-width:680px;margin:0 auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px}
@media(min-width:640px){.view{padding:28px 24px}}
@media(min-width:1024px){.view{padding:32px 32px}}

.glass-card{background:rgba(255,255,255,0.05);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:20px}
@media(min-width:640px){.glass-card{border-radius:22px;padding:24px}}

.result-hero{transition:border-color 0.3s}
.rh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.rh-amount{font-size:30px;font-weight:800;letter-spacing:-1.5px;font-family:'JetBrains Mono',monospace;margin:4px 0 2px}
@media(min-width:640px){.rh-amount{font-size:38px}}
.rh-pct{font-size:14px;font-weight:600;font-family:'JetBrains Mono',monospace}
.rh-icon-wrap{width:48px;height:48px;border-radius:14px;border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rh-caption{font-size:11px;color:#475569;font-family:'JetBrains Mono',monospace;margin-top:8px}

.input-card-wrap{position:relative}
.mesh-card-glow{position:absolute;inset:-1px;border-radius:23px;background:linear-gradient(135deg,rgba(168,85,247,0.4),rgba(59,130,246,0.3),rgba(6,182,212,0.2));filter:blur(18px);opacity:0.5;z-index:-1;animation:glowPulse 4s ease-in-out infinite alternate}
@keyframes glowPulse{0%{opacity:0.35;transform:scale(0.98)}100%{opacity:0.55;transform:scale(1.01)}}
.input-card{position:relative;z-index:1}
.ic-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.cancel-btn{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:5px 10px;color:#94a3b8;font-family:inherit;font-size:12px;cursor:pointer;font-weight:500}

.fields-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
@media(max-width:380px){.fields-row{grid-template-columns:1fr}}
.field-wrap{display:flex;flex-direction:column;gap:4px}
.field-lbl{display:flex;align-items:center;gap:5px;font-size:10px;color:#64748b;letter-spacing:1.2px;text-transform:uppercase;font-weight:500;margin-bottom:2px}
.field-hint{font-size:10px;color:#334155;margin-top:-2px;margin-bottom:2px}
.num-input,.text-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:11px;padding:11px 13px;color:#f8fafc;font-family:'JetBrains Mono',monospace;font-size:15px;outline:none;width:100%;transition:border-color 0.2s,box-shadow 0.2s;-webkit-appearance:none}
.num-input:focus,.text-input:focus{border-color:rgba(168,85,247,0.6);box-shadow:0 0 0 3px rgba(168,85,247,0.12)}
.num-input::placeholder,.text-input::placeholder{color:#1e293b;font-family:'Inter',sans-serif}
.text-input{font-family:'Inter',sans-serif;font-size:14px}
.note-field{margin-bottom:16px;margin-top:2px}

.preview-pill{display:flex;justify-content:space-between;align-items:center;border:1px solid;border-radius:11px;padding:11px 14px;margin-bottom:14px;flex-wrap:wrap;gap:8px}
.preview-label{font-size:12px;color:#64748b;font-weight:500}
.preview-val{font-size:16px;font-weight:700;font-family:'JetBrains Mono',monospace}
.preview-pct{font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace}

.save-btn{width:100%;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);border:none;border-radius:12px;padding:14px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s,transform 0.1s,background 0.3s;letter-spacing:0.2px}
.save-btn:hover{opacity:0.88}
.save-btn:active{transform:scale(0.98)}
.save-btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}

.section-eyebrow{font-size:10px;font-weight:600;color:#334155;letter-spacing:2.5px;text-transform:uppercase;padding:0 2px}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(min-width:640px){.stats-grid{grid-template-columns:repeat(3,1fr)}}
.stat-card{padding:14px!important;display:flex;flex-direction:column;gap:6px}
.sc-icon{width:30px;height:30px;border-radius:8px;border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc-label{font-size:10px;color:#475569;letter-spacing:1.2px;text-transform:uppercase;font-weight:500;margin-top:2px}
.sc-value{font-size:17px;font-weight:700;font-family:'JetBrains Mono',monospace}
.sc-sub{font-size:10px;color:#334155;font-family:'JetBrains Mono',monospace}

.history-row{display:flex;align-items:flex-start;gap:14px;transition:border-color 0.2s}
.hr-icon{width:42px;height:42px;border-radius:12px;border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hr-body{flex:1;min-width:0}
.hr-amount{font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;margin:3px 0;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.hr-pct{font-size:12px;font-weight:500;font-family:'JetBrains Mono',monospace}
.hr-flow{font-size:11px;color:#475569;font-family:'JetBrains Mono',monospace;margin-top:2px}
.hr-note{font-size:11px;color:#475569;font-style:italic;margin-top:5px}
.hr-actions{display:flex;gap:6px;flex-shrink:0;padding-top:2px}
.icon-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:7px 9px;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;transition:background 0.15s,color 0.15s}
.icon-btn:hover{background:rgba(255,255,255,0.08);color:#94a3b8}
.icon-btn.danger:hover{background:rgba(251,113,133,0.12);color:#fb7185;border-color:rgba(251,113,133,0.25)}
.empty-card{text-align:center;padding:52px 24px!important;display:flex;flex-direction:column;align-items:center;gap:12px}
.empty-title{font-size:16px;font-weight:600;color:#94a3b8}
.empty-sub{font-size:13px;color:#475569;max-width:240px}

.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.kpi-pill{text-align:center;padding:14px 10px!important}
.kpi-label{font-size:10px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.kpi-value{font-size:16px;font-weight:700;font-family:'JetBrains Mono',monospace}
@media(max-width:360px){.kpi-value{font-size:13px}}
.chart-card{padding:20px!important}
@media(min-width:640px){.chart-card{padding:24px!important}}
.chart-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.chart-title{font-size:13px;font-weight:600;color:#94a3b8}
.chart-dot{width:8px;height:8px;border-radius:50%}
.legend-item{font-size:10px;font-weight:500;display:flex;align-items:center;gap:5px;letter-spacing:0.5px}
.legend-dot{width:7px;height:7px;border-radius:50%}
.chart-tooltip{background:rgba(7,9,15,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:11px;padding:10px 14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.tt-label{font-size:10px;color:#64748b;margin-bottom:4px}
.tt-value{font-size:15px;font-weight:700;font-family:'JetBrains Mono',monospace}

.mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;
  background:rgba(7,9,15,0.85);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);
  border-top:1px solid rgba(255,255,255,0.07);padding-bottom:env(safe-area-inset-bottom,0)}
@media(min-width:768px){.mobile-nav{display:none}}
.mnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 0 8px;border:none;background:transparent;color:#475569;font-family:inherit;cursor:pointer;position:relative;transition:color 0.15s}
.mnav-active{color:#a855f7}
.mnav-lbl{font-size:10px;font-weight:600;letter-spacing:0.5px}
.mnav-dot{position:absolute;top:8px;right:calc(50% - 16px);width:5px;height:5px;border-radius:50%;background:#a855f7}

.label-xs{font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:500}

.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:200;background:rgba(7,9,15,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:500;color:#f8fafc;display:flex;align-items:center;gap:7px;animation:toastIn 0.25s ease;white-space:nowrap;max-width:90vw}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

.auth-shell{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.auth-card{width:100%;max-width:400px;display:flex;flex-direction:column;gap:0}
.auth-logo{display:flex;justify-content:center;margin-bottom:20px}
.logo-mark-lg{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff}
.logo-mark-lg svg{filter:drop-shadow(0 0 12px rgba(168,85,247,0.5))}
.auth-title{font-size:24px;font-weight:800;letter-spacing:-0.8px;text-align:center;margin-bottom:6px}
.auth-sub{font-size:13px;color:#64748b;text-align:center;margin-bottom:28px}
.auth-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:16px}
.input-icon-wrap{position:relative}
.pass-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#475569;cursor:pointer;display:flex;align-items:center;padding:2px}
.auth-err{display:flex;align-items:center;gap:6px;font-size:12px;color:#fb7185;background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.2);border-radius:8px;padding:9px 12px;margin-bottom:4px}
.auth-switch{background:none;border:none;color:#64748b;font-family:inherit;font-size:12px;cursor:pointer;margin-top:14px;text-align:center;text-decoration:underline;text-underline-offset:3px}
.auth-switch:hover{color:#94a3b8}

@media(prefers-reduced-motion:reduce){.mesh-orb,.mesh-card-glow,.sync-bar{animation:none}}
`;