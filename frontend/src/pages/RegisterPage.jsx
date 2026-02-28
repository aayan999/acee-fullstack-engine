import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATS_PREVIEW = [
    { label: 'Files Evolved', value: '35', color: '#60a5fa' },
    { label: 'Success Rate', value: '45%', color: '#4ade80' },
    { label: 'Code Saved', value: '140c', color: '#a78bfa' },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault(); setError(''); setLoading(true);
        try { await register(form); navigate('/login'); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <div className="mesh-bg" />
            <div className="grid-overlay" />
            <div className="mesh-orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle,rgba(108,99,255,0.12) 0%,transparent 70%)', bottom: '-100px', right: '-100px', animationDelay: '-3s' }} />

            <div className="auth-layout" style={{ position: 'relative', zIndex: 1 }}>
                {/* Left panel */}
                <div className="auth-left">
                    <div style={{ maxWidth: 460, width: '100%', animation: 'slideRight 0.6s var(--ease) both' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
                            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--purple-glow)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>ACEE Engine</span>
                        </div>

                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16 }}>
                            Join the next generation<br />of <span className="grad-text">intelligent refactoring</span>
                        </h2>
                        <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 48, maxWidth: 380 }}>
                            Connect any GitHub repo, and ACEE will automatically identify anti-patterns and evolve your code to modern standards.
                        </p>

                        {/* Mini dashboard preview */}
                        <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 28, display: 'flex', flexDirection: 'column', gap: 20, animation: 'float 7s ease-in-out infinite' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Last evolution run</span>
                                <span className="status-pill" style={{ background: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.25)', color: 'var(--green)', fontSize: '0.75rem' }}>
                                    <span className="status-dot" style={{ background: 'var(--green)' }} />Done
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                {STATS_PREVIEW.map(s => (
                                    <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                                <span style={{ color: 'var(--green)' }}>✨</span> Skipping <span style={{ color: 'var(--purple-3)' }}>getUserById</span>: Already modern<br />
                                <span style={{ color: 'var(--amber)' }}>🔧</span> Evolving <span style={{ color: 'var(--purple-3)' }}>asyncHandler</span> (score: 2)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="auth-right">
                    <div className="auth-form-wrap">
                        <div style={{ textAlign: 'center', marginBottom: 36 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 14, marginBottom: 20, boxShadow: '0 0 30px var(--purple-glow), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Create your account</h1>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                                Start evolving with <span className="grad-text-static" style={{ fontWeight: 700 }}>ACEE</span> in seconds
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label className="label" htmlFor="username">Username</label>
                                <input id="username" name="username" type="text" className="input" placeholder="yourname"
                                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required autoComplete="username" />
                            </div>
                            <div>
                                <label className="label" htmlFor="email">Email address</label>
                                <input id="email" name="email" type="email" className="input" placeholder="you@example.com"
                                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
                            </div>
                            <div>
                                <label className="label" htmlFor="password">Password</label>
                                <input id="password" name="password" type="password" className="input" placeholder="••••••••"
                                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="new-password" />
                            </div>

                            {error && (
                                <div className="error-text" style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                                {loading ? <><div className="spinner" /><span>Creating account…</span></> : 'Create account →'}
                            </button>
                        </form>

                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '28px 0' }} />
                        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.88rem' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--purple-3)', textDecoration: 'none', fontWeight: 600 }}>Sign in →</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
