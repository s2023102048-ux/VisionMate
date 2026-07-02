'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  {
    icon: '🗺️',
    bg: 'linear-gradient(135deg, #1a1040 0%, #0d1b2e 100%)',
    accent: '#7c4dff',
    accentSoft: 'rgba(124,77,255,0.15)',
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
    bg: 'linear-gradient(135deg, #0d1f35 0%, #0a1520 100%)',
    accent: '#00bcd4',
    accentSoft: 'rgba(0,188,212,0.15)',
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
    bg: 'linear-gradient(135deg, #0f1e30 0%, #091520 100%)',
    accent: '#2196f3',
    accentSoft: 'rgba(33,150,243,0.15)',
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
    bg: 'linear-gradient(135deg, #1a1505 0%, #130e00 100%)',
    accent: '#ff9800',
    accentSoft: 'rgba(255,152,0,0.15)',
    tag: 'Step 3',
    title: 'Report a Hazard\nfor Others',
    body: 'See a broken ramp, missing curb cut, or blocked path? Snap a photo and report it to help the whole community.',
    steps: [
      { num: '📸', text: 'Take or upload a photo' },
      { num: '🏷️', text: 'Pick a hazard category' },
      { num: '✅', text: 'Submit — it appears on the map instantly' },
    ],
    tip: { icon: '🙌', text: 'Every report makes VisionMate more useful for everyone.' },
  },
  {
    icon: '🆘',
    bg: 'linear-gradient(135deg, #1f0909 0%, #150505 100%)',
    accent: '#f44336',
    accentSoft: 'rgba(244,67,54,0.15)',
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
  const [animDir, setAnimDir]   = useState('forward');

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
    if (slide < SLIDES.length - 1) { setAnimDir('forward'); setSlide(s => s + 1); }
    else close();
  };

  const prev = () => {
    if (slide > 0) { setAnimDir('back'); setSlide(s => s - 1); }
  };

  if (!visible) return null;

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const progress = ((slide + 1) / SLIDES.length) * 100;

  return (
    <div
      id="onboarding-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
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
          background: s.bg,
          borderRadius: '28px',
          border: `1px solid ${s.accent}33`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${s.accent}22`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transition: 'background 0.5s ease',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: s.accent,
            borderRadius: 2,
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        </div>

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0',
        }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: s.accent,
            background: s.accentSoft,
            padding: '4px 10px', borderRadius: '20px',
            border: `1px solid ${s.accent}44`,
          }}>
            {s.tag}
          </span>
          <button
            id="ob-skip"
            onClick={close}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
              cursor: 'pointer', padding: '4px 0',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >
            Skip
          </button>
        </div>

        {/* Main illustration area */}
        <div style={{
          margin: '20px 20px 0',
          background: s.accentSoft,
          border: `1px solid ${s.accent}33`,
          borderRadius: '20px',
          padding: '28px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16,
          minHeight: 160,
          justifyContent: 'center',
        }}>
          {/* Hero icon */}
          <div style={{
            width: 72, height: 72, borderRadius: '22px',
            background: `${s.accent}22`,
            border: `1.5px solid ${s.accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem',
            boxShadow: `0 8px 32px ${s.accent}33`,
          }}>
            {s.icon}
          </div>

          {/* Visual pills (slide 0 & 4) */}
          {s.visual && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {s.visual.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '7px 14px',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{v.icon}</span>
                  <span style={{ fontSize: '0.78rem', color: '#ddd', fontWeight: 500 }}>{v.label}</span>
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
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 12, padding: '9px 14px',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: s.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>{st.num}</div>
                  <span style={{ fontSize: '0.82rem', color: '#e0e0e0' }}>{st.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mode cards (slide 2) */}
          {s.modes && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
              {s.modes.map((m, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '14px 10px',
                }}>
                  <span style={{ fontSize: '1.6rem' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{m.label}</span>
                  <span style={{ fontSize: '0.68rem', color: '#888' }}>{m.sub}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text content */}
        <div style={{ padding: '20px 22px 6px' }}>
          <h2 style={{
            margin: '0 0 10px',
            fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.25,
            color: '#fff',
            whiteSpace: 'pre-line',
          }}>{s.title}</h2>
          <p style={{
            margin: 0, fontSize: '0.88rem', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.6)',
          }}>{s.body}</p>
        </div>

        {/* Tip pill */}
        {s.tip && (
          <div style={{
            margin: '12px 22px 0',
            background: `${s.accent}11`,
            border: `1px solid ${s.accent}33`,
            borderRadius: 12, padding: '9px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.tip.icon}</span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.tip.text}</span>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 24px',
          gap: 12,
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                id={`ob-dot-${i}`}
                style={{
                  width: i === slide ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: i === slide ? s.accent : 'rgba(255,255,255,0.2)',
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
                  padding: '10px 18px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#aaa', cursor: 'pointer', fontSize: '0.88rem',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                ← Back
              </button>
            )}
            <button
              id="ob-next"
              onClick={next}
              style={{
                padding: '10px 24px', borderRadius: '12px',
                background: s.accent,
                border: 'none',
                color: '#fff', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: 700,
                fontFamily: 'inherit',
                boxShadow: `0 4px 20px ${s.accent}55`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {isLast ? 'Get Started →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes obFadeIn  { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes obFadeOut { from { opacity: 1; transform: scale(1); }   to { opacity: 0; transform: scale(0.97); } }
      `}</style>
    </div>
  );
}
