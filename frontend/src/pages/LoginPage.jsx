import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CODE_LINES = [
    { ln: '1', parts: [{ t: 'kw', v: 'import' }, { t: 'op', v: ' { ' }, { t: 'cls', v: 'Analyzer' }, { t: 'op', v: ' } ' }, { t: 'kw', v: 'from' }, { t: 'str', v: ' "./analyzer.js"' }] },
    { ln: '2', parts: [{ t: 'kw', v: 'import' }, { t: 'op', v: ' { ' }, { t: 'cls', v: 'CodeEvolver' }, { t: 'op', v: ' } ' }, { t: 'kw', v: 'from' }, { t: 'str', v: ' "./evolver.js"' }] },
    { ln: '3', parts: [] },
    { ln: '4', parts: [{ t: 'cmt', v: '// 🧠 Score optimization need first' }] },
    { ln: '5', parts: [{ t: 'kw', v: 'const' }, { t: 'op', v: ' { score, reasons } = analyzer.' }, { t: 'fn', v: 'scoreOptimizationNeed' }, { t: 'op', v: '(func.functionBody)' }] },
    { ln: '6', parts: [{ t: 'kw', v: 'if' }, { t: 'op', v: ' (score === ' }, { t: 'num', v: '0' }, { t: 'op', v: ') {' }] },
    { ln: '7', parts: [{ t: 'cmt', v: '  // ✨ Already modern, skip' }] },
    { ln: '8', parts: [{ t: 'op', v: '  ' }, { t: 'kw', v: 'continue' }, { t: 'op', v: ';' }] },
    { ln: '9', parts: [{ t: 'op', v: '}' }] },
    { ln: '10', parts: [{ t: 'cmt', v: '// 🚀 Evolve with AI' }] },
    { ln: '11', parts: [{ t: 'kw', v: 'const' }, { t: 'op', v: ' upgraded = ' }, { t: 'kw', v: 'await' }, { t: 'op', v: ' evolver.' }, { t: 'fn', v: 'evolveFunction' }, { t: 'op', v: '(func)' }] },
];

function CodePreview() {
    return (
        <div className="code-card glass" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.2)' }}>
            {/* Window chrome */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
                {['#f87171', '#fbbf24', '#4ade80'].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: .8 }} />
                ))}
                <span style={{ marginLeft: 8, color: 'var(--text-3)', fontSize: '0.7rem', fontFamily: 'inherit' }}>evolver_main.js</span>
            </div>
            {CODE_LINES.map(line => (
                <div key={line.ln} className="code-line">
                    <span className="code-ln">{line.ln}</span>
                    <span>
                        {line.parts.map((p, i) => <span key={i} className={`code-${p.t}`}>{p.v}</span>)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function FeaturePill({ icon, label }) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: 99, fontSize: '0.8rem', color: 'var(--purple-3)', fontWeight: 500
        }}>
            <span>{icon}</span>{label}
        </div>
    );
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault(); setError(''); setLoading(true);
        try { await login(form); navigate('/dashboard'); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Background */}
            <div className="mesh-bg" />
            <div className="grid-overlay" />
            <div className="mesh-orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(34,211,238,0.08) 0%,transparent 70%)', top: '60%', left: '20%', animationDelay: '-2s' }} />

            <div className="auth-layout" style={{ position: 'relative', zIndex: 1 }}>
                {/* Left panel */}
                <div className="auth-left">
                    <div style={{ maxWidth: 480, width: '100%', animation: 'slideRight 0.6s var(--ease) both' }}>
                        <div style={{ marginBottom: 48 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--purple-glow)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>ACEE Engine</span>
                            </div>
                            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
                                AI-powered<br /><span className="grad-text">code evolution</span><br />at scale.
                            </h2>
                            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: 360 }}>
                                Automatically analyse, score and evolve JavaScript codebases using LLM-driven refactoring with zero manual effort.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
                            <FeaturePill icon="⚡" label="Groq-powered LLM" />
                            <FeaturePill icon="🛡️" label="Syntax-safe validation" />
                            <FeaturePill icon="🎯" label="Smart anti-pattern scoring" />
                            <FeaturePill icon="🐳" label="Docker or local mode" />
                        </div>
                        <CodePreview />
                    </div>
                </div>

                {/* Right panel — form */}
                <div className="auth-right">
                    <div className="auth-form-wrap">
                        <div style={{ textAlign: 'center', marginBottom: 36 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 14, marginBottom: 20, boxShadow: '0 0 30px var(--purple-glow), inset 0 1px 0 rgba(255,255,255,0.2)', animation: 'glow-pulse 3s ease-in-out infinite' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                            </div>
                            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome back</h1>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                                Sign in to your <span className="grad-text-static" style={{ fontWeight: 700 }}>ACEE</span> workspace
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label className="label" htmlFor="email">Email address</label>
                                <input id="email" name="email" type="email" className="input" placeholder="you@example.com"
                                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoComplete="email" />
                            </div>
                            <div>
                                <label className="label" htmlFor="password">Password</label>
                                <input id="password" name="password" type="password" className="input" placeholder="••••••••"
                                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="current-password" />
                            </div>

                            {error && (
                                <div className="error-text" style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                                {loading ? <><div className="spinner" /><span>Signing in…</span></> : 'Sign in →'}
                            </button>
                        </form>

                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '28px 0' }} />
                        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.88rem' }}>
                            No account?{' '}
                            <Link to="/register" style={{ color: 'var(--purple-3)', textDecoration: 'none', fontWeight: 600 }}>
                                Create one free →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
