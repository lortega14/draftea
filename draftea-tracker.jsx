import { useState, useEffect, useCallback } from "react";
import {
  Zap, Clock, BarChart2, TrendingUp, TrendingDown,
  CheckCircle2, Pencil, Trash2, ArrowUpRight, ArrowDownRight,
  Target, Award, Activity, Minus, X, ChevronUp, AlignLeft
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ─── Storage ──────────────────────────────────────────────────────────────────
const S_KEY = "draftea_v3";
const C_KEY  = "draftea_v3_cap";

async function sGet(k) {
  try {
    if (window.storage) { const r = await window.storage.get(k); return r?.value ?? null; }
    return localStorage.getItem(k);
  } catch { return null; }
}
async function sSet(k, v) {
  try {
    if (window.storage) await window.storage.set(k, v);
    else localStorage.setItem(k, v);
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MXN = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(n);
const PCT = n => `${n>=0?"+":""}${n.toFixed(2)}%`;
const todayStr = () => new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"});
const shortDate = s => { const p=s.split("/"); return p.length===3?`${p[0]}/${p[1]}`:s; };

const G = "#34d399";  // emerald
const R = "#fb7185";  // rose
const P = "#a855f7";  // purple
const B = "#3b82f6";  // blue
const C = "#06b6d4";  // cyan
const MUTED = "#64748b";
const pc = p => p >= 0 ? G : R;

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [sessions, setSessions] = useState([]);
  const [capital, setCapital]   = useState("");
  const [final,   setFinal]     = useState("");
  const [note,    setNote]      = useState("");
  const [view,    setView]      = useState("session");
  const [flash,   setFlash]     = useState(false);
  const [editId,  setEditId]    = useState(null);
  const [ready,   setReady]     = useState(false);
  const [toast,   setToast]     = useState(null);

  useEffect(() => {
    (async () => {
      const raw = await sGet(S_KEY);
      const cap = await sGet(C_KEY);
      if (raw) { try { setSessions(JSON.parse(raw)); } catch {} }
      if (cap)  setCapital(cap);
      setReady(true);
    })();
  }, []);

  const persist = useCallback(async updated => {
    setSessions(updated);
    await sSet(S_KEY, JSON.stringify(updated));
  }, []);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleSave = async () => {
    const c = parseFloat(capital), f = parseFloat(final);
    if (!c || !f || isNaN(c) || isNaN(f) || c <= 0) return;
    const profit = f - c, pct = (profit/c)*100;
    const entry = { id: editId || Date.now(), date: todayStr(), capital: c, final: f, profit, pct, note: note.trim() };
    const updated = editId ? sessions.map(s => s.id===editId ? entry : s) : [entry, ...sessions];
    await persist(updated);
    await sSet(C_KEY, String(f));
    setCapital(String(f)); setFinal(""); setNote(""); setEditId(null);
    setFlash(true); setTimeout(() => setFlash(false), 1800);
    showToast(profit >= 0 ? "Sesión guardada · " + MXN(profit) : "Sesión guardada · " + MXN(profit));
  };

  const handleDelete = async id => {
    await persist(sessions.filter(s => s.id !== id));
    showToast("Sesión eliminada");
  };

  const handleEdit = s => {
    setCapital(String(s.capital)); setFinal(String(s.final)); setNote(s.note||""); setEditId(s.id); setView("session");
  };

  // Stats
  const wins  = sessions.filter(s => s.profit > 0);
  const losses = sessions.filter(s => s.profit < 0);
  const totalP = sessions.reduce((a,b) => a+b.profit, 0);
  const avgP   = sessions.length ? totalP/sessions.length : 0;
  const best   = sessions.length ? sessions.reduce((a,b) => b.profit>a.profit?b:a) : null;
  const worst  = sessions.length ? sessions.reduce((a,b) => b.profit<a.profit?b:a) : null;
  const wr     = sessions.length ? (wins.length/sessions.length)*100 : 0;
  let streak=0, sType=null;
  for (const s of sessions) {
    const t = s.profit>=0?"win":"loss";
    if (!sType) { sType=t; streak=1; } else if (t===sType) streak++; else break;
  }

  const chronoSessions = [...sessions].reverse();
  const chartData = chronoSessions.reduce((acc,s,i) => {
    const prev = i===0 ? 0 : acc[i-1].acum;
    acc.push({ date: shortDate(s.date), acum: +(prev+s.profit).toFixed(2), profit: +s.profit.toFixed(2) });
    return acc;
  }, []);

  const c = parseFloat(capital), f2 = parseFloat(final);
  const preview = !isNaN(c) && !isNaN(f2) && c>0 && final!=="" ? f2-c : null;
  const last = sessions[0];

  if (!ready) return (
    <div style={{minHeight:"100vh",background:"#07090f",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:32,height:32,border:"2px solid rgba(168,85,247,0.3)",borderTopColor:P,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* Mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}

      <div className="layout">
        {/* ── Sidebar (tablet+) ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark"><Activity size={16} strokeWidth={2.5} /></div>
            <span className="logo-text">Draftea</span>
          </div>
          <nav className="sidebar-nav">
            {TABS.map(t => (
              <button key={t.id} className={`snav-item ${view===t.id?"snav-active":""}`} onClick={() => setView(t.id)}>
                <t.Icon size={16} strokeWidth={1.8} />
                <span>{t.label}</span>
                {t.id==="history" && sessions.length>0 && <span className="snav-badge">{sessions.length}</span>}
              </button>
            ))}
          </nav>
          {sessions.length > 0 && (
            <div className="sidebar-total">
              <div className="st-label">Total acumulado</div>
              <div className="st-value" style={{color: pc(totalP)}}>{totalP>=0?"+":""}{MXN(totalP)}</div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="main-wrap">
          {/* Mobile header */}
          <header className="mobile-header">
            <div className="mh-logo">
              <div className="logo-mark-sm"><Activity size={13} strokeWidth={2.5} /></div>
              <span className="mh-title">Draftea</span>
            </div>
            {sessions.length > 0 && (
              <div className="mh-total" style={{color: pc(totalP)}}>
                {totalP>=0?"+":""}{MXN(totalP)}
              </div>
            )}
          </header>

          {/* Content */}
          <main className="content-area">
            {view==="session"  && <SessionView capital={capital} setCapital={setCapital} final={final} setFinal={setFinal} note={note} setNote={setNote} preview={preview} last={last} onSave={handleSave} flash={flash} editId={editId} onCancelEdit={() => {setEditId(null);setFinal("");setNote("");}} stats={{wins,losses,totalP,avgP,wr,best,worst,streak,sType}} />}
            {view==="history"  && <HistoryView sessions={sessions} onDelete={handleDelete} onEdit={handleEdit} />}
            {view==="charts"   && <ChartsView chartData={chartData} sessions={sessions} stats={{totalP,avgP,wr,wins,losses}} />}
          </main>

          {/* Mobile bottom nav */}
          <nav className="mobile-nav" role="navigation" aria-label="Navegación principal">
            {TABS.map(t => (
              <button key={t.id} className={`mnav-btn ${view===t.id?"mnav-active":""}`} onClick={() => setView(t.id)} aria-label={t.label}>
                <t.Icon size={20} strokeWidth={view===t.id?2.2:1.6} />
                <span className="mnav-lbl">{t.label}</span>
                {t.id==="history" && sessions.length>0 && <span className="mnav-dot" />}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

const TABS = [
  { id:"session", label:"Sesión",   Icon: Zap       },
  { id:"history", label:"Historial",Icon: Clock     },
  { id:"charts",  label:"Gráficas", Icon: BarChart2 },
];

// ─── Session View ─────────────────────────────────────────────────────────────
function SessionView({ capital, setCapital, final, setFinal, note, setNote, preview, last, onSave, flash, editId, onCancelEdit, stats }) {
  const { wins, losses, totalP, avgP, wr, best, worst, streak, sType } = stats;

  return (
    <div className="view">
      {/* Result hero */}
      {last && !editId && (
        <div className="result-hero glass-card" style={{borderColor: pc(last.profit)+"30"}}>
          <div className="rh-top">
            <div>
              <p className="label-xs">Sesión anterior · {last.date}</p>
              <div className="rh-amount" style={{color: pc(last.profit)}}>
                {last.profit>=0?"+":""}{MXN(last.profit)}
              </div>
              <p className="rh-pct" style={{color: pc(last.profit)}}>{PCT(last.pct)}</p>
            </div>
            <div className="rh-icon-wrap" style={{background: pc(last.profit)+"18", borderColor: pc(last.profit)+"30"}}>
              {last.profit>=0
                ? <TrendingUp  size={22} color={G} strokeWidth={2} />
                : <TrendingDown size={22} color={R} strokeWidth={2} />}
            </div>
          </div>
          <p className="rh-caption">{MXN(last.capital)} <ArrowUpRight size={10} style={{display:"inline",verticalAlign:"middle"}} /> {MXN(last.final)}</p>
        </div>
      )}

      {/* Input card with mesh glow */}
      <div className="input-card-wrap">
        <div className="mesh-card-glow" aria-hidden="true" />
        <div className="glass-card input-card">
          <div className="ic-header">
            <p className="label-xs">{editId ? "Editando sesión" : todayStr()}</p>
            {editId && (
              <button className="cancel-btn" onClick={onCancelEdit}>
                <X size={13} /> Cancelar
              </button>
            )}
          </div>

          <div className="fields-row">
            <Field label="Capital inicial" value={capital} onChange={setCapital}
              hint={last && !editId ? `Último: ${MXN(last.final)}` : undefined} />
            <Field label="Saldo final" value={final} onChange={setFinal} />
          </div>

          {preview !== null && (
            <div className="preview-pill" style={{background: pc(preview)+"10", borderColor: pc(preview)+"30"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {preview>=0
                  ? <TrendingUp  size={14} color={G} />
                  : <TrendingDown size={14} color={R} />}
                <span className="preview-label">Resultado estimado</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span className="preview-val" style={{color: pc(preview)}}>
                  {preview>=0?"+":""}{MXN(preview)}
                </span>
                <span className="preview-pct" style={{color: pc(preview)}}>
                  {PCT((preview/parseFloat(capital))*100)}
                </span>
              </div>
            </div>
          )}

          <div className="note-field">
            <label className="field-lbl"><AlignLeft size={10} /> Nota opcional</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)}
              placeholder="¿Qué ocurrió hoy?" className="text-input" />
          </div>

          <button className="save-btn" onClick={onSave}
            style={{background: flash ? `linear-gradient(135deg,#059669,#10b981)` : undefined}}>
            {flash
              ? <><CheckCircle2 size={16} /> Guardado</>
              : <><Zap size={16} strokeWidth={2.5} /> {editId?"Actualizar sesión":"Guardar sesión"}</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      {wins.length + losses.length > 0 && (
        <>
          <p className="section-eyebrow">Estadísticas</p>
          <div className="stats-grid">
            <StatCard Icon={Activity}    label="Total"           value={MXN(totalP)}           color={pc(totalP)} />
            <StatCard Icon={Target}      label="Promedio/sesión" value={MXN(avgP)}              color={pc(avgP)}   />
            <StatCard Icon={Award}       label="Win rate"        value={`${wr.toFixed(1)}%`}    color={wr>=50?G:R} />
            <StatCard Icon={BarChart2}   label="Sesiones"        value={`${wins.length}G · ${losses.length}P`} color={P} />
            {best  && <StatCard Icon={TrendingUp}   label="Mejor día"  value={MXN(best.profit)}  color={G} sub={best.date}  />}
            {worst && <StatCard Icon={TrendingDown} label="Peor día"   value={MXN(worst.profit)} color={R} sub={worst.date} />}
            {sType && <StatCard Icon={sType==="win"?ChevronUp:Minus} label="Racha" value={`${streak} ${sType==="win"?"victorias":"pérdidas"}`} color={sType==="win"?G:R} sub="consecutivas" />}
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
        <div key={s.id} className="glass-card history-row" style={{borderColor: pc(s.profit)+"28"}}>
          <div className="hr-icon" style={{background: pc(s.profit)+"14", borderColor: pc(s.profit)+"28"}}>
            {s.profit>=0
              ? <TrendingUp  size={16} color={G} strokeWidth={2} />
              : <TrendingDown size={16} color={R} strokeWidth={2} />}
          </div>
          <div className="hr-body">
            <p className="label-xs">{s.date}</p>
            <p className="hr-amount" style={{color: pc(s.profit)}}>
              {s.profit>=0?"+":""}{MXN(s.profit)}
              <span className="hr-pct">{PCT(s.pct)}</span>
            </p>
            <p className="hr-flow">{MXN(s.capital)} → {MXN(s.final)}</p>
            {s.note && <p className="hr-note">"{s.note}"</p>}
          </div>
          <div className="hr-actions">
            <button className="icon-btn" onClick={() => onEdit(s)} title="Editar">
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button className="icon-btn danger" onClick={() => onDelete(s.id)} title="Eliminar">
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Charts View ─────────────────────────────────────────────────────────────
function ChartsView({ chartData, sessions, stats }) {
  const { totalP, avgP, wr, wins, losses } = stats;
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
      {/* KPI pills */}
      <div className="kpi-row">
        <KPIPill label="Total" value={MXN(totalP)} color={pc(totalP)} />
        <KPIPill label="Win rate" value={`${wr.toFixed(0)}%`} color={wr>=50?G:R} />
        <KPIPill label="Promedio" value={MXN(avgP)} color={pc(avgP)} />
      </div>

      {/* Cumulative line */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <p className="chart-title">Crecimiento acumulado</p>
          <div className="chart-dot" style={{background: P}} />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={P} />
                <stop offset="50%"  stopColor={B} />
                <stop offset="100%" stopColor={C} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10,fontFamily:"Inter"}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:MUTED,fontSize:10,fontFamily:"JetBrains Mono,monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={58} />
            <Tooltip content={<LineTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="acum" stroke="url(#lineGrad)" strokeWidth={2.5}
              dot={{fill:P,r:3,strokeWidth:0}} activeDot={{r:5,fill:P,stroke:"rgba(168,85,247,0.3)",strokeWidth:4}} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <p className="chart-title">Resultado por sesión</p>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span className="legend-item" style={{color:G}}><span className="legend-dot" style={{background:G}} />Ganancia</span>
            <span className="legend-item" style={{color:R}}><span className="legend-dot" style={{background:R}} />Pérdida</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:MUTED,fontSize:10,fontFamily:"JetBrains Mono,monospace"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={58} />
            <Tooltip content={<BarTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="profit" radius={[4,4,0,0]} maxBarSize={40}>
              {chartData.map((d,i) => (
                <Cell key={i} fill={d.profit>=0?G:R} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, hint }) {
  return (
    <div className="field-wrap">
      <label className="field-lbl">{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <input type="number" value={value} onChange={e=>onChange(e.target.value)}
        placeholder="0.00" className="num-input" inputMode="decimal" />
    </div>
  );
}

function StatCard({ Icon, label, value, color, sub }) {
  return (
    <div className="glass-card stat-card">
      <div className="sc-icon" style={{background:color+"12",borderColor:color+"25"}}>
        <Icon size={14} color={color} strokeWidth={2} />
      </div>
      <p className="sc-label">{label}</p>
      <p className="sc-value" style={{color}}>{value}</p>
      {sub && <p className="sc-sub">{sub}</p>}
    </div>
  );
}

function KPIPill({ label, value, color }) {
  return (
    <div className="glass-card kpi-pill" style={{borderColor:color+"30",background:color+"08"}}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={{color}}>{value}</p>
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="chart-tooltip">
      <p className="tt-label">{label}</p>
      <p className="tt-value" style={{background:"linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
        {v>=0?"+":""}{MXN(v)}
      </p>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="chart-tooltip">
      <p className="tt-label">{label}</p>
      <p className="tt-value" style={{color: pc(v)}}>{v>=0?"+":""}{MXN(v)}</p>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:#07090f;color:#f8fafc;font-family:'Inter',system-ui,sans-serif;overflow-x:hidden}

/* ── MESH BG ── */
.mesh-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.mesh-orb{position:absolute;border-radius:50%;filter:blur(90px);animation:float 20s ease-in-out infinite alternate}
.mesh-orb-1{width:600px;height:600px;top:-200px;left:-150px;background:radial-gradient(ellipse,rgba(168,85,247,0.35),transparent 65%);animation-duration:22s}
.mesh-orb-2{width:500px;height:500px;bottom:-150px;right:-100px;background:radial-gradient(ellipse,rgba(59,130,246,0.3),transparent 65%);animation-duration:18s;animation-delay:-8s}
.mesh-orb-3{width:400px;height:400px;top:40%;left:35%;background:radial-gradient(ellipse,rgba(6,182,212,0.2),transparent 65%);animation-duration:26s;animation-delay:-14s}
@keyframes float{0%{transform:translate(0,0) scale(1)}100%{transform:translate(40px,60px) scale(1.08)}}

/* ── LAYOUT ── */
.layout{position:relative;z-index:1;display:flex;min-height:100vh}

/* ── SIDEBAR ── */
.sidebar{display:none;width:220px;flex-shrink:0;position:fixed;top:0;left:0;bottom:0;z-index:40;padding:24px 16px;flex-direction:column;gap:8px;
  background:rgba(7,9,15,0.6);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);
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

.sidebar-total{margin-top:auto;padding:14px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
.st-label{font-size:10px;color:#475569;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
.st-value{font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace}

/* ── MAIN WRAP ── */
.main-wrap{flex:1;display:flex;flex-direction:column;min-height:100vh}
@media(min-width:768px){.main-wrap{margin-left:220px}}

/* ── MOBILE HEADER ── */
.mobile-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
  background:rgba(7,9,15,0.7);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);
  border-bottom:1px solid rgba(255,255,255,0.07);position:sticky;top:0;z-index:30}
@media(min-width:768px){.mobile-header{display:none}}
.mh-logo{display:flex;align-items:center;gap:8px}
.logo-mark-sm{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff}
.mh-title{font-size:16px;font-weight:800;letter-spacing:-0.4px}
.mh-total{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600}

/* ── CONTENT ── */
.content-area{flex:1;padding-bottom:80px}
@media(min-width:768px){.content-area{padding-bottom:40px}}

.view{max-width:680px;margin:0 auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px}
@media(min-width:640px){.view{padding:28px 24px}}
@media(min-width:1024px){.view{padding:32px 32px}}

/* ── GLASS CARD ── */
.glass-card{background:rgba(255,255,255,0.05);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
  border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:20px}
@media(min-width:640px){.glass-card{border-radius:22px;padding:24px}}

/* ── RESULT HERO ── */
.result-hero{transition:border-color 0.3s}
.rh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.rh-amount{font-size:30px;font-weight:800;letter-spacing:-1.5px;font-family:'JetBrains Mono',monospace;margin:4px 0 2px}
@media(min-width:640px){.rh-amount{font-size:38px}}
.rh-pct{font-size:14px;font-weight:600;font-family:'JetBrains Mono',monospace}
.rh-icon-wrap{width:48px;height:48px;border-radius:14px;border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.rh-caption{font-size:11px;color:#475569;font-family:'JetBrains Mono',monospace;margin-top:8px}

/* ── INPUT CARD ── */
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

.preview-pill{display:flex;justify-content:space-between;align-items:center;border:1px solid;border-radius:11px;padding:11px 14px;margin-bottom:14px;flex-wrap:wrap;gap:8px;transition:all 0.2s}
.preview-label{font-size:12px;color:#64748b;font-weight:500}
.preview-val{font-size:16px;font-weight:700;font-family:'JetBrains Mono',monospace}
.preview-pct{font-size:12px;font-weight:600;font-family:'JetBrains Mono',monospace}

.save-btn{width:100%;background:linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4);border:none;border-radius:12px;padding:14px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s,transform 0.1s,background 0.3s;letter-spacing:0.2px}
.save-btn:hover{opacity:0.9}
.save-btn:active{transform:scale(0.98)}

/* ── STATS GRID ── */
.section-eyebrow{font-size:10px;font-weight:600;color:#334155;letter-spacing:2.5px;text-transform:uppercase;padding:0 2px}
.stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(min-width:640px){.stats-grid{grid-template-columns:repeat(3,1fr)}}

.stat-card{padding:14px!important;display:flex;flex-direction:column;gap:6px}
.sc-icon{width:30px;height:30px;border-radius:8px;border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc-label{font-size:10px;color:#475569;letter-spacing:1.2px;text-transform:uppercase;font-weight:500;margin-top:2px}
.sc-value{font-size:17px;font-weight:700;font-family:'JetBrains Mono',monospace}
.sc-sub{font-size:10px;color:#334155;font-family:'JetBrains Mono',monospace}

/* ── HISTORY ── */
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

/* ── CHARTS ── */
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
.tt-label{font-size:10px;color:#64748b;margin-bottom:4px;font-family:'Inter',sans-serif}
.tt-value{font-size:15px;font-weight:700;font-family:'JetBrains Mono',monospace}

/* ── MOBILE NAV ── */
.mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;
  background:rgba(7,9,15,0.8);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);
  border-top:1px solid rgba(255,255,255,0.07);padding-bottom:env(safe-area-inset-bottom,0)}
@media(min-width:768px){.mobile-nav{display:none}}
.mnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 0 8px;border:none;background:transparent;color:#475569;font-family:inherit;cursor:pointer;position:relative;transition:color 0.15s}
.mnav-active{color:#a855f7}
.mnav-lbl{font-size:10px;font-weight:600;letter-spacing:0.5px}
.mnav-dot{position:absolute;top:8px;right:calc(50% - 16px);width:5px;height:5px;border-radius:50%;background:#a855f7}

/* ── UTILS ── */
.label-xs{font-size:10px;color:#64748b;letter-spacing:2px;text-transform:uppercase;font-weight:500}

/* ── TOAST ── */
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:100;background:rgba(7,9,15,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:9px 18px;font-size:13px;font-weight:500;color:#f8fafc;display:flex;align-items:center;gap:7px;animation:toastIn 0.25s ease;white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

@media(prefers-reduced-motion:reduce){
  .mesh-orb,.mesh-card-glow,.toast{animation:none}
}
`;
