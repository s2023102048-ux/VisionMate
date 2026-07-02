'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  {
    icon: '🗺️',
    tag: 'Welcome',
    title: 'Your Accessibility\nCompanion',
    body: 'VisionMate helps people with mobility challenges discover accessible routes, report hazards, and explore the community safely.',
    visual: [
      { icon: '♿', label: 'Wheelchair Routes' },
      { icon: '🚶', label: 'Walkable Paths' },
      { icon: '📍', label: 'Hazard Reports' },
    ],
  },
  {
    icon: '📍',
    tag: 'Step 1',
    title: 'Tap to Select\na Location',
    body: 'Tap anywhere on the map to drop a pin. You can drag the pin to fine-tune its exact spot before taking action.',
    steps: [
      { num: '1', text: 'Tap on the map' },
      { num: '2', text: 'Drag to reposition' },
      { num: '3', text: 'Choose what to do next' },
    ],
    tip: { icon: '💡', text: 'A card appears with your options — navigate or report.' },
  },
  {
    icon: '🧭',
    tag: 'Step 2',
    title: 'Get Accessible\nDirections',
    body: 'Choose Walk or Wheelchair mode and get a route that avoids barriers. Community hazards are shown along the way.',
    modes: [
      { icon: '🚶', label: 'Walk', sub: 'Pedestrian route' },
      { icon: '♿', label: 'Wheelchair', sub: 'Accessible route' },
    ],
    tip: { icon: '🗺️', text: 'Search a destination using the bar at the top of the screen.' },
  },
  {
    icon: '📸',
    tag: 'Step 3',
    title: 'Report a Hazard\nfor Others',
    body: 'See a broken ramp, missing curb cut, or blocked path? Snap a photo and report it to help the whole community.',
    steps: [
      { num: '📸', text: 'Take or upload a photo' },
      { num: '🏷️', text: 'Pick a hazard category' },
      { num: '✅', text: 'Submit to add it to the map' },
    ],
    tip: { icon: '🙌', text: 'Every report makes VisionMate more useful for everyone.' },
  },
  {
    icon: '🆘',
    tag: 'Safety',
    title: 'SOS Button\nAlways Ready',
    body: 'The red SOS button is always visible at the bottom-left. Use it in an emergency to call for help or share your live location.',
    visual: [
      { icon: '📞', label: 'Call Family' },
      { icon: '🧑‍⚕️', label: 'Call Caregiver' },
      { icon: '📡', label: 'Share Location' },
    ],
    tip: { icon: '📱', text: 'You\'ll be asked to save an emergency contact on first use.' },
  },
];

export default function OnboardingModal() {
  const [visible, setVisible]   = useState(false);
  const [slide, setSlide]       = useState(0);
  const [exiting, setExiting]   = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('vm_onboarding_done');
    if (!seen) setVisible(true);
  }, []);

  const close = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem('vm_onboarding_done', '1');
    }, 350);
  };

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else close();
  };

  const prev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  if (!visible) return null;

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const progress = ((slide + 1) / SLIDES.length) * 100;

  // We use a single accent color across all slides now for a minimal look
  const accent = '#1a56db';
  const accentSoft = 'rgba(26,86,219,0.1)';

  return (
    <div
      id="onboarding-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.4)', // lighter overlay
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: exiting ? 'obFadeOut 0.35s ease forwards' : 'obFadeIn 0.35s ease',
        fontFamily: "'Inter', 'Outfit', sans-serif",
      }}
    >
      <div
        id="onboarding-modal"
        style={{
          width: '100%', maxWidth: '400px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: '#f0f0f0' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: accent,
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0',
        }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: accent,
            background: accentSoft,
            padding: '4px 10px', borderRadius: '8px',
          }}>
            {s.tag}
          </span>
          <button
            id="ob-skip"
            onClick={close}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: '0.82rem',
              cursor: 'pointer', padding: '4px 0',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            Skip
          </button>
        </div>

        {/* Main illustration area */}
        <div style={{
          margin: '20px 20px 0',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '28px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16,
          minHeight: 160,
          justifyContent: 'center',
        }}>
          {/* Hero icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            {s.icon}
          </div>

          {/* Visual pills */}
          {s.visual && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {s.visual.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '7px 12px',
                }}>
                  <span style={{ fontSize: '1rem' }}>{v.icon}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500 }}>{v.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step list */}
          {s.steps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280 }}>
              {s.steps.map((st, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '9px 12px',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '12px',
                    background: accentSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: accent, flexShrink: 0,
                  }}>{st.num}</div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{st.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mode cards */}
          {s.modes && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
              {s.modes.map((m, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '12px 10px',
                }}>
                  <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{m.label}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{m.sub}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text content */}
        <div style={{ padding: '20px 22px 6px' }}>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.3,
            color: 'var(--text)',
            whiteSpace: 'pre-line',
          }}>{s.title}</h2>
          <p style={{
            margin: 0, fontSize: '0.88rem', lineHeight: 1.5,
            color: 'var(--text-muted)',
          }}>{s.body}</p>
        </div>

        {/* Tip pill */}
        {s.tip && (
          <div style={{
            margin: '12px 22px 0',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 12px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{s.tip.icon}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.tip.text}</span>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 24px',
          gap: 12,
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                id={`ob-dot-${i}`}
                style={{
                  width: i === slide ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: i === slide ? accent : '#d0d0d0',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {slide > 0 && (
              <button
                id="ob-prev"
                onClick={prev}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)', cursor: 'pointer', fontSize: '0.88rem',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.target.style.background = 'var(--surface)'}
              >
                Back
              </button>
            )}
            <button
              id="ob-next"
              onClick={next}
              style={{
                padding: '8px 20px', borderRadius: '8px',
                background: accent,
                border: 'none',
                color: '#fff', cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes obFadeIn  { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes obFadeOut { from { opacity: 1; transform: scale(1); }   to { opacity: 0; transform: scale(0.98); } }
      `}</style>
    </div>
  );
}
