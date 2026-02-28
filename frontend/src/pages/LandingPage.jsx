import { Link } from 'react-router-dom';

/* ─── Data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
    { icon: '⚡', title: 'Groq-Powered Speed', desc: 'Uses Llama 3.3-70B via Groq for sub-second AI function refactoring — 100× faster than traditional approaches.', color: '#a78bfa' },
    { icon: '🧠', title: 'Smart Scoring', desc: 'Static anti-pattern analysis scores every function before LLM calls. Zero wasted API requests on already-modern code.', color: '#60a5fa' },
    { icon: '🛡️', title: 'Syntax-Safe', desc: 'Every evolution is validated with node --check or Docker sandbox before committing. Self-correction if the first attempt fails.', color: '#4ade80' },
    { icon: '🐳', title: 'Docker or Local', desc: 'Run validation in an isolated Docker container for production safety, or use local node --check for blazing-fast dev cycles.', color: '#22d3ee' },
    { icon: '📂', title: 'Batch Processing', desc: 'Clone any GitHub repo, scan all JS files, evolve every function — fully automated from URL to audit report.', color: '#fbbf24' },
    { icon: '📊', title: 'Live Dashboard', desc: 'Real-time progress tracking, animated stats, and detailed audit reports — all from a beautiful web interface.', color: '#f87171' },
];

const STEPS = [
    { num: '01', title: 'Paste a GitHub URL', desc: 'Enter any public repository URL on the ACEE dashboard. The engine clones it instantly.' },
    { num: '02', title: 'AI Scores & Evolves', desc: 'Each function is scored for anti-patterns. Only those needing work are sent to the Groq LLM for refactoring.' },
    { num: '03', title: 'Validate & Ship', desc: 'Evolved code is syntax-checked in Docker or locally. Failed evolutions are auto-reverted. Results appear in your dashboard.' },
];

const STATS_BANNER = [
    { value: '35+', label: 'Files per Run' },
    { value: '45%', label: 'Success Rate' },
    { value: '<1s', label: 'Per Function' },
    { value: '12', label: 'Anti-Patterns' },
];

/* ─── Components ──────────────────────────────────────────────────────────── */

function Navbar() {
    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(2,4,10,0.75)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text-1)' }}>
                        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px var(--purple-glow)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>ACEE</span>
                    </Link>

                    {/* Nav links */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['Features', 'How it Works', 'About'].map(item => (
                            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} style={{
                                color: 'var(--text-2)', fontSize: '0.88rem', fontWeight: 500, textDecoration: 'none',
                                padding: '6px 14px', borderRadius: 8, transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => { e.target.style.color = 'var(--text-1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { e.target.style.color = 'var(--text-2)'; e.target.style.background = 'none'; }}
                            >{item}</a>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>Log in</Link>
                    <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '9px 20px', width: 'auto', boxShadow: '0 4px 16px rgba(108,99,255,0.35)' }}>Get Started</Link>
                </div>
            </div>
        </nav>
    );
}

function HeroSection() {
    return (
        <section style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '140px 32px 80px', position: 'relative', overflow: 'hidden',
        }}>
            {/* Radial glow behind hero */}
            <div style={{
                position: 'absolute', width: 800, height: 800, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 60%)',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', filter: 'blur(60px)'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
                {/* Version badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', borderRadius: 99,
                    background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
                    fontSize: '0.8rem', color: 'var(--purple-3)', fontWeight: 600, marginBottom: 32,
                    animation: 'fadeUp 0.5s var(--ease) both',
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
                    v1.0 — Now with Smart Anti-Pattern Scoring
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 900,
                    letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 24,
                    animation: 'fadeUp 0.6s var(--ease) 0.1s both',
                }}>
                    Evolve your codebase<br />
                    <span className="grad-text">with AI precision.</span>
                </h1>

                <p style={{
                    color: 'var(--text-2)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.7,
                    maxWidth: 580, margin: '0 auto 40px',
                    animation: 'fadeUp 0.6s var(--ease) 0.2s both',
                }}>
                    ACEE clones any GitHub repo, scores every function for anti-patterns,
                    and evolves your JavaScript to modern ES6+ standards — automatically.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.6s var(--ease) 0.3s both' }}>
                    <Link to="/register" className="btn btn-primary" style={{ width: 'auto', paddingInline: 32, fontSize: '1rem' }}>
                        Get Started Free →
                    </Link>
                    <a href="#how-it-works" className="btn btn-ghost" style={{ fontSize: '1rem', paddingInline: 28 }}>
                        See How It Works
                    </a>
                </div>
            </div>

            {/* Hero visual — pure CSS */}
            <div style={{
                marginTop: 80, width: '100%', maxWidth: 900, height: 340, position: 'relative',
                animation: 'fadeUp 0.8s var(--ease) 0.4s both',
                borderRadius: 24, overflow: 'hidden',
                background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1729 30%, #0b1120 100%)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>
                {/* Gradient color wash */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(34,211,238,0.12) 0%, rgba(108,99,255,0.18) 35%, rgba(248,113,113,0.08) 65%, rgba(251,191,36,0.1) 100%)', filter: 'blur(40px)' }} />
                {/* Animated orbs */}
                <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(108,99,255,0.35),transparent 70%)', top: '20%', left: '15%', animation: 'float 6s ease-in-out infinite', filter: 'blur(30px)' }} />
                <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,0.3),transparent 70%)', top: '40%', right: '20%', animation: 'float 8s ease-in-out infinite', animationDelay: '-3s', filter: 'blur(25px)' }} />
                <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(74,222,128,0.2),transparent 70%)', bottom: '15%', left: '40%', animation: 'float 7s ease-in-out infinite', animationDelay: '-5s', filter: 'blur(20px)' }} />
                {/* Grid lines */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {/* Center geometric shape */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" style={{ opacity: 0.6, animation: 'spin 20s linear infinite' }}>
                        <polygon points="100,10 190,60 190,140 100,190 10,140 10,60" stroke="url(#grad1)" strokeWidth="1.5" fill="none" />
                        <polygon points="100,30 170,70 170,130 100,170 30,130 30,70" stroke="url(#grad2)" strokeWidth="1" fill="none" opacity="0.5" />
                        <polygon points="100,50 150,80 150,120 100,150 50,120 50,80" stroke="url(#grad1)" strokeWidth="0.8" fill="none" opacity="0.3" />
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6c63ff" />
                                <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                            <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#4ade80" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                {/* Floating terminal preview */}
                <div style={{ position: 'absolute', bottom: 24, left: 32, right: 32, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {['#f87171', '#fbbf24', '#4ade80'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
                        <span style={{ marginLeft: 8, color: 'var(--text-4)', fontSize: '0.7rem' }}>acee-engine</span>
                    </div>
                    <div><span style={{ color: 'var(--green)' }}>✓</span> Cloned <span style={{ color: 'var(--purple-3)' }}>35 files</span> from github.com/user/project</div>
                    <div><span style={{ color: 'var(--amber)' }}>⚡</span> Scored 16 functions — <span style={{ color: 'var(--cyan)' }}>12 need evolution</span></div>
                    <div><span style={{ color: 'var(--green)' }}>🚀</span> Evolving with Groq Llama-3.3-70B… <span style={{ color: 'var(--green)' }}>45.71% success rate</span></div>
                </div>
            </div>
        </section>
    );
}

function StatsBanner() {
    return (
        <section style={{
            borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.015)', padding: '56px 32px',
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
                {STATS_BANNER.map((s, i) => (
                    <div key={s.label} style={{ animation: `fadeUp 0.5s var(--ease) ${i * 0.1}s both` }}>
                        <div style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>{s.value}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 500, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function FeaturesSection() {
    return (
        <section id="features" style={{ padding: '120px 32px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
                <p style={{ color: 'var(--purple-3)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Features</p>
                <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
                    Everything you need to<br /><span className="grad-text-static">modernize legacy code</span>
                </h2>
                <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto' }}>
                    Built for developers who refuse to settle for outdated patterns. Every feature designed around speed, safety, and intelligence.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {FEATURES.map((f, i) => (
                    <div key={f.title} className="glass" style={{
                        borderRadius: 'var(--r-lg)', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 16,
                        animation: `fadeUp 0.5s var(--ease) ${i * 0.08}s both`,
                        transition: 'transform 0.25s var(--spring), box-shadow 0.25s',
                        cursor: 'default',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,.6), 0 0 30px ${f.color}11`; e.currentTarget.style.borderColor = `${f.color}33`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
                    >
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                            {f.icon}
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{f.title}</h3>
                        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section id="how-it-works" style={{ padding: '120px 32px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 72 }}>
                    <p style={{ color: 'var(--purple-3)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>How It Works</p>
                    <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
                        Three steps to <span className="grad-text-static">evolved code</span>
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
                    {/* Connecting line */}
                    <div style={{ position: 'absolute', top: 40, left: '16%', right: '16%', height: 1, background: 'linear-gradient(90deg, var(--purple-1), var(--cyan), var(--green))', opacity: 0.2 }} />

                    {STEPS.map((s, i) => (
                        <div key={s.num} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative',
                            animation: `fadeUp 0.5s var(--ease) ${i * 0.15}s both`,
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'var(--bg-surface)', border: '2px solid var(--glass-border-lit)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 900, color: 'var(--purple-3)',
                                boxShadow: '0 0 30px rgba(108,99,255,0.15)', marginBottom: 28,
                                letterSpacing: '-0.02em',
                            }}>
                                {s.num}
                            </div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>{s.title}</h3>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 280 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AboutSection() {
    return (
        <section id="about" style={{ padding: '120px 32px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                <div>
                    <p style={{ color: 'var(--purple-3)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>About ACEE</p>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 20 }}>
                        Built by developers,<br />for <span className="grad-text-static">developers</span>
                    </h2>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 20 }}>
                        ACEE — the AI Code Evolution Engine — was created to solve a simple problem:
                        legacy JavaScript codebases are everywhere, and manually refactoring them is tedious.
                    </p>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 28 }}>
                        Using tree-sitter for precise AST parsing, Groq-powered Llama 3.3-70B for intelligent refactoring,
                        and Docker-sandboxed validation, ACEE delivers production-safe code evolution at unprecedented speed.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Link to="/register" className="btn btn-primary" style={{ width: 'auto', paddingInline: 24 }}>Start Evolving →</Link>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ paddingInline: 20 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                            GitHub
                        </a>
                    </div>
                </div>

                {/* Tech stack card */}
                <div className="glass" style={{ borderRadius: 'var(--r-lg)', padding: 32, animation: 'float 8s ease-in-out infinite' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Tech Stack</p>
                    {[
                        { name: 'Tree-sitter', desc: 'AST parsing & function extraction', color: '#4ade80' },
                        { name: 'Groq + Llama 3.3-70B', desc: 'Ultra-fast LLM code evolution', color: '#60a5fa' },
                        { name: 'Docker / Node', desc: 'Sandboxed syntax validation', color: '#22d3ee' },
                        { name: 'React + Vite', desc: 'Live dashboard & auth UI', color: '#a78bfa' },
                        { name: 'Express + MongoDB', desc: 'Backend API & user auth', color: '#fbbf24' },
                    ].map((t, i) => (
                        <div key={t.name} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                            borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, boxShadow: `0 0 8px ${t.color}66`, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{t.name}</div>
                                <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 2 }}>{t.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    return (
        <section style={{
            padding: '120px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{
                position: 'absolute', width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 60%)',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(80px)', pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
                <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 20 }}>
                    Ready to evolve?<br />
                    <span className="grad-text-static">Start building with ACEE.</span>
                </h2>
                <p style={{ color: 'var(--text-2)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 36 }}>
                    Create a free account, paste a repo URL, and watch your codebase transform in minutes.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                    <Link to="/register" className="btn btn-primary" style={{ width: 'auto', paddingInline: 36, fontSize: '1.05rem' }}>
                        Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-ghost" style={{ fontSize: '1.05rem', paddingInline: 28 }}>
                        Log In
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '48px 32px 40px',
            background: 'rgba(2,4,10,0.6)',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,var(--purple-1),var(--purple-2))', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-2)' }}>ACEE Engine</span>
                    <span style={{ color: 'var(--text-4)', fontSize: '0.8rem' }}>· AI Code Evolution Engine</span>
                </div>

                <div style={{ display: 'flex', gap: 24 }}>
                    {['Features', 'How it Works', 'About'].map(item => (
                        <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                            style={{ color: 'var(--text-3)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                            onMouseEnter={e => e.target.style.color = 'var(--text-1)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text-3)'}
                        >{item}</a>
                    ))}
                </div>

                <p style={{ color: 'var(--text-4)', fontSize: '0.78rem' }}>
                    © {new Date().getFullYear()} ACEE. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-void)' }}>
            <div className="mesh-bg" />
            <div className="grid-overlay" />

            <Navbar />
            <HeroSection />
            <StatsBanner />
            <FeaturesSection />
            <HowItWorks />
            <AboutSection />
            <CTASection />
            <Footer />
        </div>
    );
}
