import { useState, useEffect, useCallback } from "react";
import {
  Zap, Clock, BarChart2, TrendingUp, TrendingDown,
  CheckCircle2, Pencil, Trash2, ArrowUpRight,
  Target, Award, Activity, Minus, X, ChevronUp,
  AlignLeft, LogOut, Mail, Lock, Eye, EyeOff, User,
  ArrowDownLeft, Wallet, PlusCircle, DollarSign, Flag,
  Sun, Moon
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

const SUPA_URL = "https://tegfxbcteopwqfqikdkk.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ2Z4YmN0ZW9wd3FmcWlrZGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzAzMTgsImV4cCI6MjA5Nzc0NjMxOH0.00Exs-BVicsfOzFqME0viDpdwhi6pxwyUBQ7tSqchRY";

const hdrs = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPA_ANON,
  "Authorization": `Bearer ${token || SUPA_ANON}`,
});

const signUp  = (e,p) => fetch(`${SUPA_URL}/auth/v1/signup`,{method:"POST",headers:hdrs(),body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const signIn  = (e,p) => fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:hdrs(),body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const signOut = (t)   => fetch(`${SUPA_URL}/auth/v1/logout`,{method:"POST",headers:hdrs(t)});
const getUser = (t)   => fetch(`${SUPA_URL}/auth/v1/user`,{headers:hdrs(t)}).then(r=>r.json());

const fetchSessions    = (t) => fetch(`${SUPA_URL}/rest/v1/sessions?select=*&order=created_at.desc`,{headers:{...hdrs(t),"Prefer":"return=representation"}}).then(r=>r.json());
const insertSession    = (t,d) => fetch(`${SUPA_URL}/rest/v1/sessions`,{method:"POST",headers:{...hdrs(t),"Prefer":"return=representation"},body:JSON.stringify(d)}).then(r=>r.json());
const updateSession    = (t,id,d) => fetch(`${SUPA_URL}/rest/v1/sessions?id=eq.${id}`,{method:"PATCH",headers:{...hdrs(t),"Prefer":"return=representation"},body:JSON.stringify(d)}).then(r=>r.json());
const deleteSession    = (t,id) => fetch(`${SUPA_URL}/rest/v1/sessions?id=eq.${id}`,{method:"DELETE",headers:hdrs(t)});

const fetchWithdrawals = (t) => fetch(`${SUPA_URL}/rest/v1/withdrawals?select=*&order=created_at.desc`,{headers:{...hdrs(t),"Prefer":"return=representation"}}).then(r=>r.json());
const insertWithdrawal = (t,d) => fetch(`${SUPA_URL}/rest/v1/withdrawals`,{method:"POST",headers:{...hdrs(t),"Prefer":"return=representation"},body:JSON.stringify(d)}).then(r=>r.json());
const deleteWithdrawal = (t,id) => fetch(`${SUPA_URL}/rest/v1/withdrawals?id=eq.${id}`,{method:"DELETE",headers:hdrs(t)});

const fetchDeposits    = (t) => fetch(`${SUPA_URL}/rest/v1/deposits?select=*&order=created_at.desc`,{headers:{...hdrs(t),"Prefer":"return=representation"}}).then(r=>r.json());
const insertDeposit    = (t,d) => fetch(`${SUPA_URL}/rest/v1/deposits`,{method:"POST",headers:{...hdrs(t),"Prefer":"return=representation"},body:JSON.stringify(d)}).then(r=>r.json());
const deleteDeposit    = (t,id) => fetch(`${SUPA_URL}/rest/v1/deposits?id=eq.${id}`,{method:"DELETE",headers:hdrs(t)});

const fetchProfile     = (t) => fetch(`${SUPA_URL}/rest/v1/profiles?select=*`,{headers:{...hdrs(t),"Prefer":"return=representation"}}).then(r=>r.json());
const upsertProfile    = (t,d) => fetch(`${SUPA_URL}/rest/v1/profiles?on_conflict=user_id`,{method:"POST",headers:{...hdrs(t),"Prefer":"return=representation,resolution=merge-duplicates"},body:JSON.stringify(d)}).then(r=>r.json());

const MXN = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(n);
const PCT = n => `${n>=0?"+":""}${n.toFixed(2)}%`;
const todayStr = () => new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"});
const shortDate = s => { const p=s.split("/"); return p.length===3?`${p[0]}/${p[1]}`:s; };

const G="#34d399", R="#fb7185", P="#a855f7", B="#3b82f6", C="#06b6d4", MUTED="#64748b";
const pc = p => p>=0 ? G : R;
const TOKEN_KEY = "draftea_token";
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = t => t ? localStorage.setItem(TOKEN_KEY,t) : localStorage.removeItem(TOKEN_KEY);
const GOAL_KEY = "draftea_goal";

export default function App() {
  const [user,        setUser]        = useState(null);
  const [token,       setTokenS]      = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [theme,       setTheme]       = useState(() => localStorage.getItem("draftea_theme") || "dark");

  useEffect(() => {
    localStorage.setItem("draftea_theme", theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits,    setDeposits]    = useState([]);
  const [initialBal,  setInitialBal]  = useState(null);
  const [capital,     setCapital]     = useState("");
  const [final,       setFinal]       = useState("");
  const [note,        setNote]        = useState("");
  const [view,        setView]        = useState("session");
  const [flash,       setFlash]       = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [toast,       setToast]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [showW,       setShowW]       = useState(false);
  const [showD,       setShowD]       = useState(false);
  const [showIB,      setShowIB]      = useState(false);
  const [showGoal,    setShowGoal]    = useState(false);
  const [wAmount,     setWAmount]     = useState("");
  const [wNote,       setWNote]       = useState("");
  const [dAmount,     setDAmount]     = useState("");
  const [dNote,       setDNote]       = useState("");
  const [ibAmount,    setIbAmount]    = useState("");
  const [goalAmount,  setGoalAmount]  = useState("");
  const [goal,        setGoal]        = useState(null);

  const showToast = (msg,err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),2600); };

  useEffect(()=>{
    const savedGoal = localStorage.getItem(GOAL_KEY);
    if (savedGoal) setGoal(parseFloat(savedGoal));
    (async()=>{
      const t = getToken();
      if (t) {
        const u = await getUser(t);
        if (u?.id) {
          setUser(u); setTokenS(t); await loadAll(t);
        } else {
          const rt = localStorage.getItem("draftea_refresh");
          if (rt) {
            const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:hdrs(),body:JSON.stringify({refresh_token:rt})}).then(r=>r.json());
            if (res.access_token) {
              setToken(res.access_token); setTokenS(res.access_token);
              if (res.refresh_token) localStorage.setItem("draftea_refresh",res.refresh_token);
              const u2 = await getUser(res.access_token);
              setUser(u2); await loadAll(res.access_token);
            } else { setToken(null); localStorage.removeItem("draftea_refresh"); }
          } else setToken(null);
        }
      }
      setLoading(false);
    })();
  },[]);

  const loadAll = async (t) => {
    setSyncing(true);
    const [s,w,d,p] = await Promise.all([fetchSessions(t),fetchWithdrawals(t),fetchDeposits(t),fetchProfile(t)]);
    const validSessions = Array.isArray(s) ? s : [];
    const validWithdrawals = Array.isArray(w) ? w : [];
    const validDeposits = Array.isArray(d) ? d : [];
    setSessions(validSessions);
    setWithdrawals(validWithdrawals);
    setDeposits(validDeposits);
    if (Array.isArray(p)&&p.length>0) setInitialBal(p[0].initial_balance);

    if (validSessions.length > 0) {
      const lastSessionTime = new Date(validSessions[0].created_at).getTime();
      const postSessionDeposits = validDeposits
        .filter(x => new Date(x.created_at).getTime() > lastSessionTime)
        .reduce((a,b)=>a+b.amount, 0);
      const postSessionWithdrawals = validWithdrawals
        .filter(x => new Date(x.created_at).getTime() > lastSessionTime)
        .reduce((a,b)=>a+b.amount, 0);
      setCapital(String(validSessions[0].final + postSessionDeposits - postSessionWithdrawals));
    } else {
      const totalDep = validDeposits.reduce((a,b)=>a+b.amount, 0);
      const totalWith = validWithdrawals.reduce((a,b)=>a+b.amount, 0);
      setCapital(String(totalDep - totalWith));
    }
    setSyncing(false);
  };

  const handleAuth = async (email,password,isSignUp) => {
    const data = await (isSignUp?signUp:signIn)(email,password);
    if (data.error||data.error_description||data.msg) { showToast(data.error_description||data.msg||"Error de autenticación",true); return false; }
    const t = data.access_token;
    setToken(t); setTokenS(t);
    if (data.refresh_token) localStorage.setItem("draftea_refresh",data.refresh_token);
    const u = isSignUp ? data.user : await getUser(t);
    setUser(u); await loadAll(t);
    showToast(isSignUp?"Cuenta creada":"Bienvenido de vuelta");
    return true;
  };

  const handleLogout = async () => {
    await signOut(token);
    setToken(null); setTokenS(null); setUser(null); setSessions([]); setWithdrawals([]); setDeposits([]); setInitialBal(null); setCapital("");
    localStorage.removeItem("draftea_refresh");
    showToast("Sesión cerrada");
  };

  const handleSave = async () => {
    const c=parseFloat(capital), f=parseFloat(final);
    if (!c||!f||isNaN(c)||isNaN(f)||c<=0) return;
    const profit=f-c, pct=(profit/c)*100;
    const payload={user_id:user.id,date:todayStr(),capital:c,final:f,profit,pct,note:note.trim()};
    setSyncing(true);
    if (editId) {
      const updated = await updateSession(token,editId,payload);
      if (Array.isArray(updated)) setSessions(prev=>prev.map(s=>s.id===editId?updated[0]:s));
    } else {
      const inserted = await insertSession(token,payload);
      if (Array.isArray(inserted)) setSessions(prev=>[inserted[0],...prev]);
    }
    setSyncing(false);
    setCapital(String(f)); setFinal(""); setNote(""); setEditId(null);
    setFlash(true); setTimeout(()=>setFlash(false),1800);
    showToast((profit>=0?"Guardado · ":"Guardado · ")+MXN(profit));
  };

  const handleDelete = async (id) => { await deleteSession(token,id); setSessions(prev=>prev.filter(s=>s.id!==id)); showToast("Sesión eliminada"); };
  const handleEdit   = s => { setCapital(String(s.capital)); setFinal(String(s.final)); setNote(s.note||""); setEditId(s.id); setView("session"); };

  const handleWithdraw = async () => {
    const amt=parseFloat(wAmount); if(!amt||isNaN(amt)||amt<=0) return;
    setSyncing(true);
    const inserted = await insertWithdrawal(token,{user_id:user.id,amount:amt,date:todayStr(),note:wNote.trim()});
    if (Array.isArray(inserted)) setWithdrawals(prev=>[inserted[0],...prev]);
    setSyncing(false); setWAmount(""); setWNote(""); setShowW(false);
    setCapital(prev=>String((parseFloat(prev)||0)-amt));
    showToast("Retiro registrado · "+MXN(amt));
  };
  const handleDeleteWithdrawal = async (id) => {
    const w = withdrawals.find(x => x.id === id);
    await deleteWithdrawal(token,id);
    setWithdrawals(prev=>prev.filter(w=>w.id!==id));
    if (w) setCapital(prev=>String((parseFloat(prev)||0)+w.amount));
    showToast("Retiro eliminado");
  };

  const handleDeposit = async () => {
    const amt=parseFloat(dAmount); if(!amt||isNaN(amt)||amt<=0) return;
    setSyncing(true);
    const inserted = await insertDeposit(token,{user_id:user.id,amount:amt,date:todayStr(),note:dNote.trim()});
    if (Array.isArray(inserted)) setDeposits(prev=>[inserted[0],...prev]);
    setSyncing(false); setDAmount(""); setDNote(""); setShowD(false);
    setCapital(prev=>String((parseFloat(prev)||0)+amt));
    showToast("Depósito registrado · "+MXN(amt));
  };
  const handleDeleteDeposit = async (id) => {
    const d = deposits.find(x => x.id === id);
    await deleteDeposit(token,id);
    setDeposits(prev=>prev.filter(d=>d.id!==id));
    if (d) setCapital(prev=>String((parseFloat(prev)||0)-d.amount));
    showToast("Depósito eliminado");
  };

  const handleSetInitialBalance = async () => {
    const amt=parseFloat(ibAmount); if(!amt||isNaN(amt)||amt<=0) return;
    setSyncing(true);
    await upsertProfile(token,{user_id:user.id,initial_balance:amt});
    setInitialBal(amt); setIbAmount(""); setShowIB(false); setSyncing(false);
    showToast("Saldo inicial guardado · "+MXN(amt));
  };

  const handleSetGoal = () => {
    const amt=parseFloat(goalAmount); if(!amt||isNaN(amt)||amt<=0) return;
    setGoal(amt); localStorage.setItem(GOAL_KEY,String(amt)); setGoalAmount(""); setShowGoal(false);
    showToast("Meta guardada · "+MXN(amt));
  };

  const totalWithdrawn = withdrawals.reduce((a,b)=>a+b.amount,0);
  const totalDeposited = deposits.reduce((a,b)=>a+b.amount,0);
  const lastSession = sessions[0];
  const lastSessionTime = lastSession ? new Date(lastSession.created_at).getTime() : 0;
  const postSessionDeposited = lastSession
    ? deposits.filter(d => new Date(d.created_at).getTime() > lastSessionTime).reduce((a,b)=>a+b.amount,0)
    : totalDeposited;
  const postSessionWithdrawn = lastSession
    ? withdrawals.filter(w => new Date(w.created_at).getTime() > lastSessionTime).reduce((a,b)=>a+b.amount,0)
    : totalWithdrawn;
  const currentBalance = lastSession
    ? lastSession.final + postSessionDeposited - postSessionWithdrawn
    : postSessionDeposited - postSessionWithdrawn;
  const netProfit = initialBal!=null ? (currentBalance+totalWithdrawn)-totalDeposited-initialBal : null;

  const wins   = sessions.filter(s=>s.profit>0);
  const losses = sessions.filter(s=>s.profit<0);
  const totalP = sessions.reduce((a,b)=>a+b.profit,0);
  const avgP   = sessions.length?totalP/sessions.length:0;
  const best   = sessions.length?sessions.reduce((a,b)=>b.profit>a.profit?b:a):null;
  const worst  = sessions.length?sessions.reduce((a,b)=>b.profit<a.profit?b:a):null;
  const wr     = sessions.length?(wins.length/sessions.length)*100:0;
  let streak=0,sType=null;
  for (const s of sessions) {
    const t=s.profit>=0?"win":"loss";
    if(!sType){sType=t;streak=1;}else if(t===sType)streak++;else break;
  }

  // Últimas 7 sesiones para tendencia reciente (cronológico)
  const recent7 = [...sessions].slice(0,7).reverse();
  const recentTrend = recent7.length>=2
    ? recent7[recent7.length-1].profit >= recent7[0].profit ? "up" : "down"
    : null;

  const chronoSessions = [...sessions].reverse();
  const dateCounts = {};
  const chartData = chronoSessions.reduce((acc,s,i)=>{
    const prev=i===0?0:acc[i-1].acum;
    const baseDate=shortDate(s.date);
    dateCounts[baseDate]=(dateCounts[baseDate]||0)+1;
    const label=dateCounts[baseDate]>1?`${baseDate}#${dateCounts[baseDate]}`:baseDate;
    acc.push({id:s.id,date:label,fullDate:s.date,acum:+(prev+s.profit).toFixed(2),profit:+s.profit.toFixed(2)});
    return acc;
  },[]);

  const c2=parseFloat(capital), f2=parseFloat(final);
  const preview = !isNaN(c2)&&!isNaN(f2)&&c2>0&&final!==""?f2-c2:null;
  const last=sessions[0];

  // Meta progress
  const goalProgress = goal&&currentBalance>0 ? Math.min((currentBalance/goal)*100,100) : 0;

  if (loading) return (
    <div className={`theme-${theme}`} style={{minHeight:"100vh",background:"var(--bg-app)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="spinner"/>
    </div>
  );

  if (!user) return (
    <div className={`theme-${theme}`}>
      <div className="mesh-bg"><div className="mesh-orb mesh-orb-1"/><div className="mesh-orb mesh-orb-2"/><div className="mesh-orb mesh-orb-3"/></div>
      {toast&&<Toast toast={toast}/>}
      <AuthScreen onAuth={handleAuth} theme={theme} toggleTheme={toggleTheme}/>
    </div>
  );

  return (
    <div className={`layout theme-${theme}`}>
      <div className="mesh-bg"><div className="mesh-orb mesh-orb-1"/><div className="mesh-orb mesh-orb-2"/><div className="mesh-orb mesh-orb-3"/></div>
      {toast&&<Toast toast={toast}/>}
      {syncing&&<div className="sync-bar"/>}

    {/* Modal retiro */}
    {showW&&(
      <div className="modal-overlay" onClick={()=>setShowW(false)}>
        <div className="modal-card glass-card" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-icon" style={{background:"rgba(251,113,133,0.12)",borderColor:"rgba(251,113,133,0.25)"}}><ArrowDownLeft size={18} color={R} strokeWidth={2}/></div>
            <div><p className="modal-title">Registrar retiro</p><p className="modal-sub">Dinero retirado de Draftea</p></div>
            <button className="modal-close" onClick={()=>setShowW(false)}><X size={16}/></button>
          </div>
          <div className="field-wrap" style={{marginBottom:12}}>
            <label className="field-lbl"><DollarSign size={10}/> Monto retirado (MXN)</label>
            <input type="number" value={wAmount} onChange={e=>setWAmount(e.target.value)} placeholder="0.00" className="num-input" inputMode="decimal" autoFocus/>
          </div>
          <div className="field-wrap" style={{marginBottom:16}}>
            <label className="field-lbl"><AlignLeft size={10}/> Nota (opcional)</label>
            <input type="text" value={wNote} onChange={e=>setWNote(e.target.value)} placeholder="ej. retiro quincenal" className="text-input"/>
          </div>
          <button className="save-btn" style={{background:"linear-gradient(135deg,#be123c,#fb7185)"}} onClick={handleWithdraw}><ArrowDownLeft size={15}/> Confirmar retiro</button>
        </div>
      </div>
    )}

    {/* Modal depósito */}
    {showD&&(
      <div className="modal-overlay" onClick={()=>setShowD(false)}>
        <div className="modal-card glass-card" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-icon" style={{background:"rgba(52,211,153,0.12)",borderColor:"rgba(52,211,153,0.25)"}}><PlusCircle size={18} color={G} strokeWidth={2}/></div>
            <div><p className="modal-title">Registrar depósito</p><p className="modal-sub">Dinero añadido a Draftea</p></div>
            <button className="modal-close" onClick={()=>setShowD(false)}><X size={16}/></button>
          </div>
          <div className="field-wrap" style={{marginBottom:12}}>
            <label className="field-lbl"><DollarSign size={10}/> Monto depositado (MXN)</label>
            <input type="number" value={dAmount} onChange={e=>setDAmount(e.target.value)} placeholder="0.00" className="num-input" inputMode="decimal" autoFocus/>
          </div>
          <div className="field-wrap" style={{marginBottom:16}}>
            <label className="field-lbl"><AlignLeft size={10}/> Nota (opcional)</label>
            <input type="text" value={dNote} onChange={e=>setDNote(e.target.value)} placeholder="ej. recarga quincenal" className="text-input"/>
          </div>
          <button className="save-btn" style={{background:"linear-gradient(135deg,#059669,#34d399)"}} onClick={handleDeposit}><PlusCircle size={15}/> Confirmar depósito</button>
        </div>
      </div>
    )}

    {/* Modal saldo inicial */}
    {showIB&&(
      <div className="modal-overlay" onClick={()=>setShowIB(false)}>
        <div className="modal-card glass-card" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-icon" style={{background:"rgba(168,85,247,0.12)",borderColor:"rgba(168,85,247,0.25)"}}><Wallet size={18} color={P} strokeWidth={2}/></div>
            <div><p className="modal-title">Saldo inicial</p><p className="modal-sub">¿Cuánto tenías en Draftea al empezar?</p></div>
            <button className="modal-close" onClick={()=>setShowIB(false)}><X size={16}/></button>
          </div>
          <div className="field-wrap" style={{marginBottom:16}}>
            <label className="field-lbl"><DollarSign size={10}/> Saldo inicial (MXN)</label>
            <input type="number" value={ibAmount} onChange={e=>setIbAmount(e.target.value)} placeholder={initialBal!=null?String(initialBal):"0.00"} className="num-input" inputMode="decimal" autoFocus/>
          </div>
          {initialBal!=null&&<p style={{fontSize:11,color:MUTED,marginBottom:12}}>Valor actual: {MXN(initialBal)}</p>}
          <button className="save-btn" onClick={handleSetInitialBalance}><CheckCircle2 size={15}/> Guardar saldo inicial</button>
        </div>
      </div>
    )}

    {/* Modal meta */}
    {showGoal&&(
      <div className="modal-overlay" onClick={()=>setShowGoal(false)}>
        <div className="modal-card glass-card" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-icon" style={{background:"rgba(59,130,246,0.12)",borderColor:"rgba(59,130,246,0.25)"}}><Flag size={18} color={B} strokeWidth={2}/></div>
            <div><p className="modal-title">Meta de bankroll</p><p className="modal-sub">¿A cuánto quieres llegar?</p></div>
            <button className="modal-close" onClick={()=>setShowGoal(false)}><X size={16}/></button>
          </div>
          <div className="field-wrap" style={{marginBottom:16}}>
            <label className="field-lbl"><DollarSign size={10}/> Meta (MXN)</label>
            <input type="number" value={goalAmount} onChange={e=>setGoalAmount(e.target.value)} placeholder={goal!=null?String(goal):"ej. 1000.00"} className="num-input" inputMode="decimal" autoFocus/>
          </div>
          {goal!=null&&<p style={{fontSize:11,color:MUTED,marginBottom:12}}>Meta actual: {MXN(goal)}</p>}
          <button className="save-btn" style={{background:`linear-gradient(135deg,${B},${C})`}} onClick={handleSetGoal}><Flag size={15}/> Guardar meta</button>
          {goal!=null&&<button onClick={()=>{setGoal(null);localStorage.removeItem(GOAL_KEY);setShowGoal(false);showToast("Meta eliminada");}} style={{marginTop:10,background:"none",border:"none",color:MUTED,fontSize:12,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3,width:"100%",textAlign:"center"}}>Quitar meta</button>}
        </div>
      </div>
    )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark"><Activity size={16} strokeWidth={2.5}/></div>
          <span className="logo-text">Draftea</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t=>(
            <button key={t.id} className={`snav-item ${view===t.id?"snav-active":""}`} onClick={()=>setView(t.id)}>
              <t.Icon size={16} strokeWidth={1.8}/><span>{t.label}</span>
              {t.id==="history"&&sessions.length>0&&<span className="snav-badge">{sessions.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-balance">
            <div className="bal-row"><span className="bal-label">Saldo actual</span><span className="bal-val" style={{color:G}}>{currentBalance>0?MXN(currentBalance):"—"}</span></div>
            <div className="bal-row"><span className="bal-label">Depositado</span><span className="bal-val" style={{color:G}}>{totalDeposited>0?MXN(totalDeposited):"—"}</span></div>
            <div className="bal-row"><span className="bal-label">Retirado</span><span className="bal-val" style={{color:R}}>{totalWithdrawn>0?MXN(totalWithdrawn):"—"}</span></div>
            {netProfit!=null&&<div className="bal-row bal-row-total"><span className="bal-label">Ganancia neta</span><span className="bal-val" style={{color:pc(netProfit),fontWeight:700}}>{netProfit>=0?"+":""}{MXN(netProfit)}</span></div>}
          </div>
          {/* Meta progress en sidebar */}
          {goal!=null&&(
            <div className="sidebar-goal">
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,color:"var(--text-secondary)",letterSpacing:1,textTransform:"uppercase"}}>Meta</span>
                <span style={{fontSize:10,color:"var(--color-blue)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{goalProgress.toFixed(0)}%</span>
              </div>
              <div className="goal-bar-track">
                <div className="goal-bar-fill" style={{width:`${goalProgress}%`,background:goalProgress>=100?"var(--color-green)":`linear-gradient(90deg,var(--color-blue),var(--color-cyan))`}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'JetBrains Mono',monospace"}}>{MXN(currentBalance)}</span>
                <span style={{fontSize:10,color:"var(--text-secondary)",fontFamily:"'JetBrains Mono',monospace"}}>{MXN(goal)}</span>
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className="action-btn" onClick={()=>setShowIB(true)}><Wallet size={13}/>{initialBal==null?"Inicial":"Editar inicial"}</button>
            <button className="action-btn" onClick={()=>setShowGoal(true)}><Flag size={13}/>{goal==null?"Meta":"Editar meta"}</button>
            <button className="action-btn" onClick={()=>setShowD(true)}><PlusCircle size={13}/>Depósito</button>
            <button className="action-btn danger" onClick={()=>setShowW(true)}><ArrowDownLeft size={13}/>Retiro</button>
          </div>
          <div className="footer-row">
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Cambiar tema">
              {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === "light" ? "Oscuro" : "Claro"}</span>
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={14} strokeWidth={2} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="mobile-header">
          <div className="mh-logo">
            <div className="logo-mark-sm"><Activity size={13} strokeWidth={2.5}/></div>
            <span className="mh-title">Draftea</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button className="mh-action" onClick={toggleTheme} title="Tema">
              {theme === "light" ? <Moon size={15}/> : <Sun size={15}/>}
            </button>
            <button className="mh-action" onClick={()=>setShowGoal(true)} title="Meta"><Flag size={15}/></button>
            <button className="mh-action" onClick={()=>setShowIB(true)} title="Saldo inicial"><Wallet size={15}/></button>
            <button className="mh-action green" onClick={()=>setShowD(true)} title="Depósito"><PlusCircle size={15}/></button>
            <button className="mh-action red" onClick={()=>setShowW(true)} title="Retiro"><ArrowDownLeft size={15}/></button>
            <button className="mh-action red" onClick={handleLogout} title="Cerrar sesión"><LogOut size={14} strokeWidth={2}/></button>
          </div>
        </header>

        {/* Meta progress bar — mobile */}
        {goal!=null&&(
          <div className="goal-mobile-bar">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,padding:"0 16px"}}>
              <span style={{fontSize:9,color:"var(--text-secondary)",letterSpacing:1.5,textTransform:"uppercase"}}>Meta de bankroll</span>
              <span style={{fontSize:10,color:goalProgress>=100?"var(--color-green)":"var(--color-blue)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{MXN(currentBalance)} / {MXN(goal)} · {goalProgress.toFixed(0)}%</span>
            </div>
            <div className="goal-bar-track">
              <div className="goal-bar-fill" style={{width:`${goalProgress}%`,background:goalProgress>=100?"var(--color-green)":`linear-gradient(90deg,var(--color-blue),var(--color-cyan))`,transition:"width 0.4s ease"}}/>
            </div>
          </div>
        )}

        {(currentBalance>0||totalWithdrawn>0||totalDeposited>0||netProfit!=null)&&(
          <div className="balance-bar">
            <BalPill label="Saldo" value={MXN(currentBalance)} color={G}/>
            {totalDeposited>0&&<BalPill label="Depositado" value={MXN(totalDeposited)} color={G}/>}
            <BalPill label="Retirado" value={MXN(totalWithdrawn)} color={R}/>
            {netProfit!=null&&<BalPill label="Ganancia neta" value={(netProfit>=0?"+":"")+MXN(netProfit)} color={pc(netProfit)}/>}
          </div>
        )}

        <main className="content-area">
          {view==="session"&&<SessionView capital={capital} setCapital={setCapital} final={final} setFinal={setFinal} note={note} setNote={setNote} preview={preview} last={last} onSave={handleSave} flash={flash} editId={editId} onCancelEdit={()=>{setEditId(null);setFinal("");setNote("");}} stats={{wins,losses,totalP,avgP,wr,best,worst,streak,sType}} onWithdraw={()=>setShowW(true)} onDeposit={()=>setShowD(true)} onSetInitial={()=>setShowIB(true)} onSetGoal={()=>setShowGoal(true)} initialBal={initialBal} goal={goal} goalProgress={goalProgress} currentBalance={currentBalance} recent7={recent7} recentTrend={recentTrend}/>}
          {view==="history"&&<HistoryView sessions={sessions} withdrawals={withdrawals} deposits={deposits} onDelete={handleDelete} onEdit={handleEdit} onDeleteWithdrawal={handleDeleteWithdrawal} onDeleteDeposit={handleDeleteDeposit}/>}
          {view==="charts"&&<ChartsView chartData={chartData} sessions={sessions} stats={{totalP,avgP,wr,wins,losses,totalWithdrawn,totalDeposited,netProfit,currentBalance,goal,goalProgress}} theme={theme}/>}
        </main>

        <nav className="mobile-nav">
          {TABS.map(t=>(
            <button key={t.id} className={`mnav-btn ${view===t.id?"mnav-active":""}`} onClick={()=>setView(t.id)}>
              <t.Icon size={20} strokeWidth={view===t.id?2.2:1.6}/>
              <span className="mnav-lbl">{t.label}</span>
              {t.id==="history"&&sessions.length>0&&<span className="mnav-dot"/>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

const TABS=[
  {id:"session", label:"Sesión",   Icon:Zap      },
  {id:"history", label:"Historial",Icon:Clock    },
  {id:"charts",  label:"Gráficas", Icon:BarChart2},
];

function AuthScreen({ onAuth, theme, toggleTheme }) {
  const [isSignUp,setIsSignUp]=useState(false);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const handle=async()=>{
    if(!email||!pass)return; setBusy(true); setErr("");
    const ok=await onAuth(email,pass,isSignUp);
    if(!ok)setErr(isSignUp?"No se pudo crear la cuenta (mín. 6 caracteres).":"Correo o contraseña incorrectos.");
    setBusy(false);
  };
  return (
    <div className="auth-container">
      <div className="auth-glow"/>
      <button 
        className="mh-action" 
        onClick={toggleTheme} 
        style={{position:"absolute",top:20,right:20,zIndex:10}} 
        title="Cambiar tema"
      >
        {theme === "light" ? <Moon size={16}/> : <Sun size={16}/>}
      </button>
      <div className="auth-card glass-card">
        <div className="auth-logo-section">
          <div className="auth-logo"><Activity size={24} strokeWidth={2.5}/></div>
          <h1 className="auth-title">Draftea Tracker</h1>
          <p className="auth-sub">{isSignUp?"Crea tu cuenta para empezar":"Inicia sesión para continuar"}</p>
        </div>
        <div className="auth-form">
          <div className="field-wrap">
            <label className="field-lbl"><Mail size={10}/> Correo electrónico</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" className="num-input" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          <div className="field-wrap">
            <label className="field-lbl"><Lock size={10}/> Contraseña</label>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" className="num-input" style={{paddingRight:40}} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              <button className="pass-toggle" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
          </div>
        </div>
        {err&&<p className="auth-err" style={{marginTop:12}}><X size={12}/>{err}</p>}
        <button className="save-btn" onClick={handle} disabled={busy} style={{marginTop:20}}>
          {busy?<><div className="btn-spinner"/>{isSignUp?"Creando...":"Entrando..."}</>:<><User size={15}/>{isSignUp?"Crear cuenta":"Iniciar sesión"}</>}
        </button>
        <button className="auth-switch" onClick={()=>{setIsSignUp(!isSignUp);setErr("");}}>
          {isSignUp?"¿Ya tienes cuenta? Inicia sesión":"¿No tienes cuenta? Regístrate"}
        </button>
      </div>
    </div>
  );
}

function SessionView({ capital,setCapital,final,setFinal,note,setNote,preview,last,onSave,flash,editId,onCancelEdit,stats,onWithdraw,onDeposit,onSetInitial,onSetGoal,initialBal,goal,goalProgress,currentBalance,recent7,recentTrend }) {
  const {wins,losses,totalP,avgP,wr,best,worst,streak,sType}=stats;
  return (
    <div className="view">
      {last&&!editId&&(
        <div className="result-hero glass-card" style={{borderColor:pc(last.profit)+"30"}}>
          <div className="rh-top">
            <div>
              <p className="label-xs">Sesión anterior · {last.date}</p>
              <div className="rh-amount" style={{color:pc(last.profit)}}>{last.profit>=0?"+":""}{MXN(last.profit)}</div>
              <p className="rh-pct" style={{color:pc(last.profit)}}>{PCT(last.pct)}</p>
            </div>
            <div className="rh-icon-wrap" style={{background:pc(last.profit)+"18",borderColor:pc(last.profit)+"30"}}>
              {last.profit>=0?<TrendingUp size={22} color={G} strokeWidth={2}/>:<TrendingDown size={22} color={R} strokeWidth={2}/>}
            </div>
          </div>
          <p className="rh-caption">{MXN(last.capital)} <ArrowUpRight size={10} style={{display:"inline",verticalAlign:"middle"}}/> {MXN(last.final)}</p>
        </div>
      )}

      {/* Meta de bankroll */}
      {goal!=null&&(
        <div className="glass-card goal-card" onClick={onSetGoal} style={{cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <p className="label-xs" style={{marginBottom:3}}>Meta de bankroll</p>
              <p style={{fontSize:13,fontWeight:600,color:goalProgress>=100?G:B,fontFamily:"'JetBrains Mono',monospace"}}>
                {MXN(currentBalance)} <span style={{color:MUTED,fontWeight:400}}>/ {MXN(goal)}</span>
              </p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:22,fontWeight:800,color:goalProgress>=100?G:B,fontFamily:"'JetBrains Mono',monospace",letterSpacing:-1}}>{goalProgress.toFixed(0)}%</p>
              {goalProgress>=100&&<p style={{fontSize:10,color:G,fontWeight:600,letterSpacing:1}}>META ALCANZADA</p>}
            </div>
          </div>
          <div className="goal-bar-track">
            <div className="goal-bar-fill" style={{width:`${goalProgress}%`,background:goalProgress>=100?G:`linear-gradient(90deg,${B},${C})`}}/>
          </div>
          {goalProgress<100&&<p style={{fontSize:10,color:MUTED,marginTop:6}}>Faltan {MXN(goal-currentBalance)} para tu meta</p>}
        </div>
      )}

      {/* Tendencia reciente — últimas 7 sesiones */}
      {recent7.length>=2&&(
        <div className="glass-card trend-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <p className="label-xs" style={{marginBottom:2}}>Tendencia reciente</p>
              <p style={{fontSize:12,color:recentTrend==="up"?G:R,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                {recentTrend==="up"?<TrendingUp size={13} strokeWidth={2}/>:<TrendingDown size={13} strokeWidth={2}/>}
                {recentTrend==="up"?"En recuperación":"En caída"}
                <span style={{color:MUTED,fontWeight:400}}>· últimas {recent7.length} sesiones</span>
              </p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontSize:11,color:MUTED}}>P&L reciente</p>
              <p style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:pc(recent7.reduce((a,s)=>a+s.profit,0))}}>
                {recent7.reduce((a,s)=>a+s.profit,0)>=0?"+":""}{MXN(recent7.reduce((a,s)=>a+s.profit,0))}
              </p>
            </div>
          </div>
          {/* Mini barras */}
          <div style={{display:"flex",gap:4,alignItems:"flex-end",height:44}}>
            {recent7.map((s,i)=>{
              const maxAbs=Math.max(...recent7.map(x=>Math.abs(x.profit)),1);
              const h=Math.max((Math.abs(s.profit)/maxAbs)*40,4);
              return (
                <div key={s.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,justifyContent:"flex-end"}}>
                  <div style={{width:"100%",height:h,borderRadius:3,background:s.profit>=0?G:R,opacity:i===recent7.length-1?1:0.6,transition:"height 0.3s ease"}}/>
                  <span style={{fontSize:8,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{shortDate(s.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <button className="qa-btn" onClick={onSetInitial}><Wallet size={14} color={P}/> {initialBal!=null?`Inicial: ${MXN(initialBal)}`:"Definir inicial"}</button>
        <button className="qa-btn qa-blue" onClick={onSetGoal}><Flag size={14} color={B}/> {goal!=null?"Editar meta":"Poner meta"}</button>
        <button className="qa-btn qa-green" onClick={onDeposit}><PlusCircle size={14} color={G}/> Depósito</button>
        <button className="qa-btn qa-red" onClick={onWithdraw}><ArrowDownLeft size={14} color={R}/> Retiro</button>
      </div>

      <div className="input-card-wrap">
        <div className="mesh-card-glow"/>
        <div className="glass-card input-card">
          <div className="ic-header">
            <p className="label-xs">{editId?"Editando sesión":todayStr()}</p>
            {editId&&<button className="cancel-btn" onClick={onCancelEdit}><X size={13}/>Cancelar</button>}
          </div>
          <div className="fields-row">
            <Field label="Capital inicial" value={capital} onChange={setCapital} hint={last&&!editId?`Último: ${MXN(last.final)}`:undefined}/>
            <Field label="Saldo final" value={final} onChange={setFinal}/>
          </div>
          {preview!==null&&(
            <div className="preview-pill" style={{background:pc(preview)+"10",borderColor:pc(preview)+"30"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {preview>=0?<TrendingUp size={14} color={G}/>:<TrendingDown size={14} color={R}/>}
                <span className="preview-label">Resultado estimado</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span className="preview-val" style={{color:pc(preview)}}>{preview>=0?"+":""}{MXN(preview)}</span>
                <span className="preview-pct" style={{color:pc(preview)}}>{PCT((preview/parseFloat(capital))*100)}</span>
              </div>
            </div>
          )}
          <div className="note-field">
            <label className="field-lbl"><AlignLeft size={10}/> Nota opcional</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="¿Qué ocurrió hoy?" className="text-input"/>
          </div>
          <button className="save-btn" onClick={onSave} style={{background:flash?`linear-gradient(135deg,#059669,#10b981)`:undefined}}>
            {flash?<><CheckCircle2 size={16}/>Guardado</>:<><Zap size={16} strokeWidth={2.5}/>{editId?"Actualizar sesión":"Guardar sesión"}</>}
          </button>
        </div>
      </div>

      {wins.length+losses.length>0&&(
        <>
          <p className="section-eyebrow">Estadísticas de sesiones</p>
          <div className="stats-grid">
            <StatCard Icon={Activity}    label="Total P&L"       value={MXN(totalP)}         color={pc(totalP)}/>
            <StatCard Icon={Target}      label="Promedio/sesión" value={MXN(avgP)}            color={pc(avgP)}/>
            <StatCard Icon={Award}       label="Win rate"        value={`${wr.toFixed(1)}%`}  color={wr>=50?G:R}/>
            <StatCard Icon={BarChart2}   label="Sesiones"        value={`${wins.length}G · ${losses.length}P`} color={P}/>
            {best&&<StatCard Icon={TrendingUp}   label="Mejor día" value={MXN(best.profit)}  color={G} sub={best.date}/>}
            {worst&&<StatCard Icon={TrendingDown} label="Peor día" value={MXN(worst.profit)} color={R} sub={worst.date}/>}
            {sType&&<StatCard Icon={sType==="win"?ChevronUp:Minus} label="Racha" value={`${streak} ${sType==="win"?"victorias":"pérdidas"}`} color={sType==="win"?G:R} sub="consecutivas"/>}
          </div>
        </>
      )}
    </div>
  );
}

function HistoryView({ sessions,withdrawals,deposits,onDelete,onEdit,onDeleteWithdrawal,onDeleteDeposit }) {
  const [tab,setTab]=useState("sessions");
  return (
    <div className="view">
      <div className="history-tabs">
        <button className={`htab ${tab==="sessions"?"htab-active":""}`} onClick={()=>setTab("sessions")}><Zap size={13}/> Sesiones {sessions.length>0&&<span className="snav-badge">{sessions.length}</span>}</button>
        <button className={`htab ${tab==="deposits"?"htab-active":""}`} onClick={()=>setTab("deposits")}><PlusCircle size={13}/> Depósitos {deposits.length>0&&<span className="snav-badge" style={{background:"rgba(52,211,153,0.2)",color:"#34d399"}}>{deposits.length}</span>}</button>
        <button className={`htab ${tab==="withdrawals"?"htab-active":""}`} onClick={()=>setTab("withdrawals")}><ArrowDownLeft size={13}/> Retiros {withdrawals.length>0&&<span className="snav-badge" style={{background:"rgba(251,113,133,0.2)",color:"#fb7185"}}>{withdrawals.length}</span>}</button>
      </div>
      {tab==="sessions"&&(sessions.length===0?(
        <div className="glass-card empty-card"><Clock size={32} color={MUTED} strokeWidth={1.5}/><p className="empty-title">Sin sesiones</p><p className="empty-sub">Registra tu primera sesión en la pestaña Sesión.</p></div>
      ):sessions.map(s=>(
        <div key={s.id} className="glass-card history-row" style={{borderColor:pc(s.profit)+"28"}}>
          <div className="hr-icon" style={{background:pc(s.profit)+"14",borderColor:pc(s.profit)+"28"}}>{s.profit>=0?<TrendingUp size={16} color={G} strokeWidth={2}/>:<TrendingDown size={16} color={R} strokeWidth={2}/>}</div>
          <div className="hr-body">
            <p className="label-xs">{s.date}</p>
            <p className="hr-amount" style={{color:pc(s.profit)}}>{s.profit>=0?"+":""}{MXN(s.profit)}<span className="hr-pct">{PCT(s.pct)}</span></p>
            <p className="hr-flow">{MXN(s.capital)} → {MXN(s.final)}</p>
            {s.note&&<p className="hr-note">"{s.note}"</p>}
          </div>
          <div className="hr-actions">
            <button className="icon-btn" onClick={()=>onEdit(s)}><Pencil size={14} strokeWidth={2}/></button>
            <button className="icon-btn danger" onClick={()=>onDelete(s.id)}><Trash2 size={14} strokeWidth={2}/></button>
          </div>
        </div>
      )))}
      {tab==="deposits"&&(deposits.length===0?(
        <div className="glass-card empty-card"><PlusCircle size={32} color={MUTED} strokeWidth={1.5}/><p className="empty-title">Sin depósitos</p><p className="empty-sub">Registra un depósito desde la pestaña Sesión.</p></div>
      ):deposits.map(d=>(
        <div key={d.id} className="glass-card history-row" style={{borderColor:"rgba(52,211,153,0.2)"}}>
          <div className="hr-icon" style={{background:"rgba(52,211,153,0.1)",borderColor:"rgba(52,211,153,0.25)"}}><PlusCircle size={16} color={G} strokeWidth={2}/></div>
          <div className="hr-body"><p className="label-xs">{d.date}</p><p className="hr-amount" style={{color:G}}>+{MXN(d.amount)}</p>{d.note&&<p className="hr-note">"{d.note}"</p>}</div>
          <div className="hr-actions"><button className="icon-btn danger" onClick={()=>onDeleteDeposit(d.id)}><Trash2 size={14} strokeWidth={2}/></button></div>
        </div>
      )))}
      {tab==="withdrawals"&&(withdrawals.length===0?(
        <div className="glass-card empty-card"><ArrowDownLeft size={32} color={MUTED} strokeWidth={1.5}/><p className="empty-title">Sin retiros</p><p className="empty-sub">Registra un retiro desde la pestaña Sesión.</p></div>
      ):withdrawals.map(w=>(
        <div key={w.id} className="glass-card history-row" style={{borderColor:"rgba(251,113,133,0.2)"}}>
          <div className="hr-icon" style={{background:"rgba(251,113,133,0.1)",borderColor:"rgba(251,113,133,0.25)"}}><ArrowDownLeft size={16} color={R} strokeWidth={2}/></div>
          <div className="hr-body"><p className="label-xs">{w.date}</p><p className="hr-amount" style={{color:R}}>-{MXN(w.amount)}</p>{w.note&&<p className="hr-note">"{w.note}"</p>}</div>
          <div className="hr-actions"><button className="icon-btn danger" onClick={()=>onDeleteWithdrawal(w.id)}><Trash2 size={14} strokeWidth={2}/></button></div>
        </div>
      )))}
    </div>
  );
}

function ChartsView({ chartData,sessions,stats,theme }) {
  const {totalP,avgP,wr,wins,losses,totalWithdrawn,totalDeposited,netProfit,currentBalance,goal,goalProgress}=stats;
  const gridStroke = theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
  const refLineStroke = theme === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)";

  if (sessions.length===0) return (
    <div className="view"><div className="glass-card empty-card"><BarChart2 size={32} color={MUTED} strokeWidth={1.5}/><p className="empty-title">Sin datos</p><p className="empty-sub">Necesitas al menos una sesión para ver gráficas.</p></div></div>
  );
  return (
    <div className="view">
      <p className="section-eyebrow">Resumen financiero</p>
      <div className="kpi-row kpi-row-2">
        <KPIPill label="Saldo actual"  value={MXN(currentBalance)}                                                color={G}/>
        <KPIPill label="Depositado"    value={MXN(totalDeposited)}                                                color={B}/>
        <KPIPill label="Retirado"      value={MXN(totalWithdrawn)}                                                color={R}/>
        <KPIPill label="Ganancia neta" value={netProfit!=null?(netProfit>=0?"+":"")+MXN(netProfit):"—"}           color={netProfit!=null?pc(netProfit):MUTED}/>
      </div>
      {goal!=null&&(
        <div className="glass-card" style={{padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Flag size={13} color={B} strokeWidth={2}/><p style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}>Meta de bankroll</p></div>
            <p style={{fontSize:14,fontWeight:700,color:goalProgress>=100?G:B,fontFamily:"'JetBrains Mono',monospace"}}>{goalProgress.toFixed(0)}%</p>
          </div>
          <div className="goal-bar-track"><div className="goal-bar-fill" style={{width:`${goalProgress}%`,background:goalProgress>=100?G:`linear-gradient(90deg,${B},${C})`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <span style={{fontSize:10,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{MXN(currentBalance)}</span>
            <span style={{fontSize:10,color:"var(--text-secondary)",fontFamily:"'JetBrains Mono',monospace"}}>{MXN(goal)}</span>
          </div>
        </div>
      )}
      <div className="glass-card chart-card">
        <div className="chart-header"><p className="chart-title">Crecimiento acumulado (P&L)</p><div className="chart-dot" style={{background:P}}/></div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={P}/><stop offset="50%" stopColor={B}/><stop offset="100%" stopColor={C}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 4" stroke={gridStroke}/>
            <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={58}/>
            <Tooltip content={<LineTooltip/>}/>
            <ReferenceLine y={0} stroke={refLineStroke} strokeDasharray="3 3"/>
            <Line type="monotone" dataKey="acum" stroke="url(#lg)" strokeWidth={2.5} dot={{fill:P,r:3,strokeWidth:0}} activeDot={{r:5,fill:P,stroke:"rgba(168,85,247,0.3)",strokeWidth:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card chart-card">
        <div className="chart-header">
          <p className="chart-title">Resultado por sesión</p>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <span className="legend-item" style={{color:G}}><span className="legend-dot" style={{background:G}}/>Ganancia</span>
            <span className="legend-item" style={{color:R}}><span className="legend-dot" style={{background:R}}/>Pérdida</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={gridStroke}/>
            <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={58}/>
            <Tooltip content={<BarTooltip/>}/>
            <ReferenceLine y={0} stroke={refLineStroke}/>
            <Bar dataKey="profit" radius={[4,4,0,0]} maxBarSize={40}>
              {chartData.map((d)=><Cell key={d.id} fill={d.profit>=0?G:R} fillOpacity={0.8}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Field({ label,value,onChange,hint }) {
  return (
    <div className="field-wrap">
      <label className="field-lbl">{label}</label>
      {hint&&<span className="field-hint">{hint}</span>}
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder="0.00" className="num-input" inputMode="decimal"/>
    </div>
  );
}
function StatCard({ Icon,label,value,color,sub }) {
  return (
    <div className="glass-card stat-card">
      <div className="sc-icon" style={{background:color+"12",borderColor:color+"25"}}><Icon size={14} color={color} strokeWidth={2}/></div>
      <p className="sc-label">{label}</p>
      <p className="sc-value" style={{color}}>{value}</p>
      {sub&&<p className="sc-sub">{sub}</p>}
    </div>
  );
}
function KPIPill({ label,value,color }) {
  return (
    <div className="glass-card kpi-pill" style={{borderColor:color+"30",background:color+"08"}}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={{color}}>{value}</p>
    </div>
  );
}
function BalPill({ label,value,color }) {
  return (
    <div className="bal-pill">
      <span className="bal-pill-label">{label}</span>
      <span className="bal-pill-val" style={{color}}>{value}</span>
    </div>
  );
}
function Toast({ toast }) {
  return (
    <div className="toast" style={{borderColor:toast.err?"rgba(251,113,133,0.3)":"rgba(255,255,255,0.1)"}}>
      {toast.err?<X size={14} color={R}/>:<CheckCircle2 size={14} color={G}/>}{toast.msg}
    </div>
  );
}
function LineTooltip({ active,payload,label }) {
  if (!active||!payload?.length) return null;
  const v=payload[0].value;
  const fullDate=payload[0].payload?.fullDate||label;
  return <div className="chart-tooltip"><p className="tt-label">{fullDate}</p><p className="tt-value" style={{background:"linear-gradient(135deg,#a855f7,#3b82f6,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{v>=0?"+":""}{MXN(v)}</p></div>;
}
function BarTooltip({ active,payload,label }) {
  if (!active||!payload?.length) return null;
  const v=payload[0].value;
  const fullDate=payload[0].payload?.fullDate||label;
  return <div className="chart-tooltip"><p className="tt-label">{fullDate}</p><p className="tt-value" style={{color:pc(v)}}>{v>=0?"+":""}{MXN(v)}</p></div>;
}

// Styles migrated to src/index.css
