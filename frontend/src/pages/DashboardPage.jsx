import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

/* ─── Config ──────────────────────────────────────────── */
const STATS = [
    { key: 'totalScanned', label: 'Files Scanned', icon: '📂', color: '#60a5fa', maxRef: 100 },
    { key: 'successfulFixes', label: 'Evolutions', icon: '✅', color: '#4ade80', maxRef: 100 },
    { key: 'syntaxErrorsPrevented', label: 'Errors Blocked', icon: '🛡️', color: '#fbbf24', maxRef: 50 },
    { key: 'totalCharsSaved', label: 'Chars Reduced', icon: '📉', color: '#a78bfa', maxRef: 5000 },
    { key: 'successRate', label: 'Success Rate', icon: '📈', color: '#6c63ff', maxRef: 100 },
];

const EMPTY = { totalScanned: 0, successfulFixes: 0, syntaxErrorsPrevented: 0, totalCharsSaved: 0, successRate: '0.00', completionTime: null, repoUrl: null, runId: null, evolvedFilesCount: 0 };

/* ─── Animated counter ────────────────────────────────── */
function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const n = parseFloat(value) || 0;
        if (n === 0) { setDisplay(0); return; }
        let start = 0;
        const step = n / 30;
        const id = setInterval(() => {
            start += step;
            if (start >= n) { setDisplay(n); clearInterval(id); }
            else setDisplay(Math.floor(start));
        }, 30);
        return () => clearInterval(id);
    }, [value]);
    return <>{typeof value === 'string' && value.includes('.') ? display.toFixed(2) : display.toLocaleString()}</>;
}

/* ─── Stat card ───────────────────────────────────────── */
function StatCard({ stat, value, index, maxValue }) {
    const isRate = stat.key === 'successRate';
    const isChars = stat.key === 'totalCharsSaved';
    const pct = maxValue > 0 ? Math.min((parseFloat(value) / maxValue) * 100, 100) : 0;

    return (
        <div className="stat-card glass" style={{
            animationDelay: `${index * 0.08}s`, borderRadius: 'var(--r-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,.6), 0 0 30px ${stat.color}22, inset 0 1px 0 rgba(255,255,255,0.05)`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,0.05)'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-icon-wrap" style={{ background: `${stat.color}15` }}>
                    <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: stat.color, background: `${stat.color}12`, borderRadius: 99, padding: '3px 10px' }}>
                    {pct.toFixed(0)}%
                </div>
            </div>
            <div>
                <div className="stat-value" style={{ color: stat.color, animationDelay: `${index * 0.08 + 0.1}s` }}>
                    <AnimatedNumber value={isRate ? parseFloat(value || 0) : (value ?? 0)} />
                    {isRate && '%'}
                    {isChars && <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-2)', marginLeft: 4 }}> chars</span>}
                </div>
                <div className="stat-label">{stat.label}</div>
            </div>
            <div className="stat-bar-wrap">
                <div className="stat-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${stat.color}88, ${stat.color})` }} />
            </div>
        </div>
    );
}

/* ─── Status banner ───────────────────────────────────── */
function StatusBanner({ status, repoUrl, isRunning, onForceReset }) {
    // Only show banner while a run is actively in progress
    if (status !== 'running') return null;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
            borderRadius: 'var(--r-md)', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
            animation: 'fadeIn 0.3s var(--ease) both', marginBottom: 24,
        }}>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span>
            <div style={{ flex: 1 }}>
                <span style={{ color: 'var(--amber)', fontWeight: 600, fontSize: '0.88rem' }}>Evolution in progress…</span>
                {repoUrl && <span style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginLeft: 8 }}>— {repoUrl.length > 50 ? '…' + repoUrl.slice(-40) : repoUrl}</span>}
            </div>
            {isRunning && <div className="progress-bar" style={{ width: 120 }} />}
            {onForceReset && (
                <button className="btn btn-ghost" onClick={onForceReset} style={{ fontSize: '0.78rem', padding: '5px 12px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                    ⛔ Force Stop
                </button>
            )}
        </div>
    );
}

/* ─── Quick action cards ──────────────────────────────── */
function QuickActions({ onRefresh }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32, animation: 'fadeUp 0.5s var(--ease) 0.15s both' }}>
            {[
                { icon: '🏠', label: 'Home', desc: 'Back to landing', to: '/' },
                { icon: '📖', label: 'Docs', desc: 'How ACEE works', to: '/#how-it-works' },
                { icon: '🔄', label: 'Refresh', desc: 'Reload stats', action: onRefresh },
            ].map(a => {
                const inner = (
                    <>
                        <span style={{ fontSize: '1.3rem' }}>{a.icon}</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-1)' }}>{a.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{a.desc}</div>
                        </div>
                    </>
                );
                const style = {
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    transition: 'all 0.2s var(--ease)', textDecoration: 'none',
                };
                if (a.action) {
                    return (
                        <div key={a.label} className="glass" style={style} onClick={a.action}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
                        >{inner}</div>
                    );
                }
                return (
                    <Link key={a.label} to={a.to} className="glass" style={style}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.35)'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
                    >{inner}</Link>
                );
            })}
        </div>
    );
}

/* ─── Main Dashboard ──────────────────────────────────── */
export default function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(EMPTY);
    const [runStatus, setRunStatus] = useState({ status: 'idle', repoUrl: null });
    const [repoInput, setRepoInput] = useState('');
    const [runError, setRunError] = useState('');
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [evolvedFiles, setEvolvedFiles] = useState([]);
    const [expandedFile, setExpandedFile] = useState(null);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const pollRef = useRef(null);

    const fetchEvolvedFiles = useCallback(async (runId) => {
        if (!runId) return;
        setLoadingFiles(true);
        try {
            const { data } = await api.getEvolvedFiles(runId);
            setEvolvedFiles(data.evolvedFiles || []);
        } catch (_) { setEvolvedFiles([]); }
        finally { setLoadingFiles(false); }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.dashboard();
            const t = data.totalScanned || 0, f = data.successfulFixes || 0;
            setStats({ ...EMPTY, ...data, successRate: t > 0 ? ((f / t) * 100).toFixed(2) : '0.00' });
            if (data.runId) fetchEvolvedFiles(data.runId);
        } catch (_) { }
        finally { setLoading(false); }
    }, [fetchEvolvedFiles]);

    const fetchStatus = useCallback(async () => {
        try {
            const { data } = await api.getStatus();
            setRunStatus(data);
            // Status endpoint now returns 'running' or 'idle' only
            // When no longer running, stop polling and refresh stats
            if (data.status !== 'running') {
                clearInterval(pollRef.current); pollRef.current = null;
                fetchStats();
            }
        } catch (_) { }
    }, [fetchStats]);

    useEffect(() => {
        fetchStats();
        api.getStatus().then(({ data }) => {
            setRunStatus(data);
            if (data.status === 'running') pollRef.current = setInterval(fetchStatus, 3000);
        }).catch(() => { });
        return () => clearInterval(pollRef.current);
    }, []); // eslint-disable-line

    const handleRun = async e => {
        e.preventDefault(); setRunError('');
        try {
            await api.evolve(repoInput.trim());
            setRunStatus({ status: 'running', repoUrl: repoInput.trim() });
            pollRef.current = setInterval(fetchStatus, 3000);
        } catch (err) { setRunError(err.message); }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        navigate('/login');
    };

    const handleForceReset = async () => {
        try {
            await api.resetRun();
            clearInterval(pollRef.current);
            pollRef.current = null;
            setRunStatus({ status: 'idle', repoUrl: null });
            fetchStats();
        } catch (err) { setRunError(err.message); }
    };

    const isRunning = runStatus.status === 'running';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="dash-layout">
            <div className="mesh-bg" />
            <div className="grid-overlay" />

            {/* ─── Sticky nav ──────────────────────────────── */}
            <nav className="dash-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-1)' }}>
                        <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--purple-glow)' }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                            <span className="grad-text-static">ACEE</span>
                        </span>
                    </Link>
                    <div style={{ height: 18, width: 1, background: 'var(--glass-border)', margin: '0 4px' }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 500 }}>Dashboard</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link to="/" style={{ color: 'var(--text-3)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500, padding: '6px 12px', borderRadius: 8, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--text-1)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-3)'}
                    >Home</Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 99 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{user?.username ?? user?.email}</span>
                    </div>
                    <button className="btn btn-ghost" onClick={handleLogout} disabled={loggingOut} id="logout-btn" style={{ padding: '7px 16px' }}>
                        {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            </nav>

            <div className="dash-content" style={{ position: 'relative', zIndex: 1 }}>

                {/* ─── Welcome header ──────────────────────────── */}
                <div style={{ marginBottom: 32, animation: 'fadeUp 0.5s var(--ease) both' }}>
                    <h1 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8 }}>
                        {greeting}, <span className="grad-text">{user?.username ?? 'Developer'}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.95rem' }}>
                        Manage your code evolution runs and view audit statistics.
                    </p>
                </div>

                {/* ─── Status banner ───────────────────────────── */}
                <StatusBanner status={runStatus.status} repoUrl={runStatus.repoUrl} isRunning={isRunning} onForceReset={handleForceReset} />

                {/* ─── Quick actions ───────────────────────────── */}
                <QuickActions onRefresh={fetchStats} />

                {/* ─── Run panel ───────────────────────────────── */}
                <div className="glass" style={{
                    borderRadius: 'var(--r-lg)', padding: '28px 32px', marginBottom: 32,
                    animation: 'fadeUp 0.5s var(--ease) 0.1s both',
                    borderColor: isRunning ? 'rgba(251,191,36,0.2)' : 'rgba(108,99,255,0.15)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Start Evolution Run</span>
                        {isRunning && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--amber)', background: 'rgba(251,191,36,0.1)', padding: '3px 10px', borderRadius: 99, marginLeft: 'auto' }}>⚡ RUNNING</span>}
                    </div>
                    <form onSubmit={handleRun} style={{ display: 'flex', gap: 12 }}>
                        <input
                            id="repoUrl" type="url" className="input"
                            placeholder="https://github.com/owner/repository"
                            value={repoInput} onChange={e => setRepoInput(e.target.value)}
                            disabled={isRunning} required style={{ flex: 1, fontSize: '0.95rem' }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isRunning || !repoInput.trim()} id="run-btn"
                            style={{ width: 'auto', paddingInline: 28, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {isRunning
                                ? <><div className="spinner" />Running…</>
                                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>Run Evolution</>}
                        </button>
                    </form>
                    {runError && (
                        <div className="error-text" style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {runError}
                        </div>
                    )}
                </div>

                {/* ─── Stats section ───────────────────────────── */}
                <div style={{ marginBottom: 16, animation: 'fadeUp 0.5s var(--ease) 0.2s both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Audit Statistics</h2>
                            <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', margin: 0 }}>Your personal evolution metrics</p>
                        </div>
                        <button className="btn btn-ghost" onClick={fetchStats} id="refresh-btn" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: 'var(--text-3)' }}>
                        <div className="spinner" style={{ borderColor: 'rgba(108,99,255,0.2)', borderTopColor: 'var(--purple-1)' }} />
                        <span style={{ fontSize: '0.9rem' }}>Loading stats…</span>
                    </div>
                ) : (
                    <>
                        {/* Cards grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 32 }}>
                            {STATS.map((s, i) => (
                                <StatCard key={s.key} stat={s} value={stats[s.key]} index={i} maxValue={s.key === 'successRate' ? 100 : s.maxRef} />
                            ))}
                        </div>

                        {/* ─── Summary row ──────────────────────────── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            {/* Overview card */}
                            <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '24px 28px', animation: 'fadeUp 0.5s var(--ease) 0.3s both' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '1rem' }}>📋</span> Run Overview
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[
                                        { label: 'Engine', value: 'Groq Llama-3.3-70B', color: 'var(--blue)' },
                                        { label: 'Validation', value: 'Node --check', color: 'var(--cyan)' },
                                        { label: 'Scoring', value: `${stats.totalScanned > 0 ? stats.totalScanned : '—'} functions analyzed`, color: 'var(--green)' },
                                        { label: 'Status', value: stats.totalScanned > 0 ? `${stats.successRate}% success` : 'No runs yet', color: 'var(--purple-3)' },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span style={{ color: 'var(--text-3)', fontSize: '0.82rem', fontWeight: 500 }}>{row.label}</span>
                                            <span style={{ color: row.color, fontSize: '0.85rem', fontWeight: 600 }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* How it works mini */}
                            <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '24px 28px', animation: 'fadeUp 0.5s var(--ease) 0.35s both' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '1rem' }}>🔄</span> How ACEE Works
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        { step: '1', text: 'Clone & scan all JS files', icon: '📂', done: stats.totalScanned > 0 },
                                        { step: '2', text: 'Score functions for anti-patterns', icon: '🧠', done: stats.totalScanned > 0 },
                                        { step: '3', text: 'Evolve with Groq LLM refactoring', icon: '⚡', done: stats.successfulFixes > 0 },
                                        { step: '4', text: 'Validate with syntax checking', icon: '🛡️', done: stats.totalScanned > 0 },
                                    ].map(s => (
                                        <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: s.done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
                                                border: s.done ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800,
                                                color: s.done ? 'var(--green)' : 'var(--text-3)', flexShrink: 0,
                                            }}>
                                                {s.done ? '✓' : s.step}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: s.done ? 'var(--text-1)' : 'var(--text-3)' }}>{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ─── Evolved Files section ─────────────────── */}
                        {evolvedFiles.length > 0 && (
                            <div style={{ marginBottom: 32, animation: 'fadeUp 0.5s var(--ease) 0.4s both' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Evolved Files</h2>
                                        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', margin: 0 }}>{evolvedFiles.length} file{evolvedFiles.length !== 1 ? 's' : ''} successfully evolved</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {evolvedFiles.map((f, i) => {
                                        const isExpanded = expandedFile === i;
                                        const diffSign = f.charDiff > 0 ? '-' : '+';
                                        const diffColor = f.charDiff > 0 ? '#4ade80' : '#fbbf24';
                                        const diffLabel = f.charDiff > 0 ? `${f.charDiff} chars reduced` : `${Math.abs(f.charDiff)} chars added`;
                                        return (
                                            <div key={i} className="glass" style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', borderColor: isExpanded ? 'rgba(108,99,255,0.25)' : undefined }}>
                                                <div
                                                    onClick={() => setExpandedFile(isExpanded ? null : i)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                                >
                                                    <span style={{ fontSize: '1rem' }}>📄</span>
                                                    <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                        {f.filePath}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diffColor, background: `${diffColor}15`, borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                                                        {diffSign}{Math.abs(f.charDiff)} chars
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                                                        {f.originalSize} → {f.evolvedSize}
                                                    </span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </div>
                                                {isExpanded && f.evolvedContent && (
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 4px 4px' }}>
                                                        <pre style={{
                                                            margin: 0, padding: '16px 18px', fontSize: '0.78rem', lineHeight: 1.65,
                                                            color: '#c9d1d9', background: 'rgba(0,0,0,0.35)', borderRadius: '0 0 var(--r-md) var(--r-md)',
                                                            overflow: 'auto', maxHeight: 400, fontFamily: '"Fira Code", "Cascadia Code", monospace',
                                                            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                                        }}>
                                                            {f.evolvedContent}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No data empty state */}
                        {stats.totalScanned === 0 && (
                            <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: '40px 32px', textAlign: 'center', borderColor: 'rgba(108,99,255,0.15)', animation: 'fadeUp 0.5s var(--ease) 0.4s both' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'float 4s ease-in-out infinite' }}>🚀</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Ready to evolve your first repo</h3>
                                <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
                                    Paste a GitHub URL above and click <strong style={{ color: 'var(--purple-3)' }}>Run Evolution</strong>.
                                    ACEE will clone, analyze, score and refactor every function automatically.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* ─── Footer ──────────────────────────────────── */}
                <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-4)', fontSize: '0.78rem' }}>ACEE Engine v1.0 · AI Code Evolution</span>
                    <Link to="/" style={{ color: 'var(--text-3)', fontSize: '0.78rem', textDecoration: 'none' }}>← Back to home</Link>
                </div>
            </div>
        </div>
    );
}
