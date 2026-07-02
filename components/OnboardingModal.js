'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  {
    emoji: '♿',
    title: 'Welcome to VisionMate',
    subtitle: 'Real-Time PWD Accessibility Map',
    body: 'A crowdsourced platform that helps mobility-impaired individuals navigate safely. Powered by <strong>Gemini AI</strong> and built by the community — for the community.',
    color: '#7c4dff',
    glow: 'rgba(124,77,255,0.35)',
  },
  {
    emoji: '📍',
    title: 'Drop a Pin, Report a Hazard',
    subtitle: 'Step 1 of Reporting',
    body: 'Tap anywhere on the map to place a pin. You can <strong>drag it</strong> to fine-tune the exact location. Then tap the <strong>＋ Report</strong> button to open the form.',
    color: '#00bcd4',
    glow: 'rgba(0,188,212,0.35)',
    tip: '💡 Drag the pin to reposition it anytime!',
  },
  {
    emoji: '📸',
    title: 'Snap a Photo',
    subtitle: 'Step 2 of Reporting',
    body: 'Take a photo of the sidewalk, ramp, entrance, or obstacle. Then <strong>pick a category</strong> (e.g. Broken Sidewalk, No Ramp) to help the AI analyze it more accurately.',
    color: '#ff9800',
    glow: 'rgba(255,152,0,0.35)',
    tip: '📂 You can upload from your gallery too!',
  },
  {
    emoji: '🤖',
    title: 'Gemini AI Inspects It',
    subtitle: 'AI-Powered Accessibility Scoring',
    body: 'Google\'s <strong>Gemini 2.0 AI</strong> automatically analyzes your photo and gives an <strong>Accessibility Score (1–5 ★)</strong>, lists positive features, and flags warnings.',
    color: '#4caf50',
    glow: 'rgba(76,175,80,0.35)',
    badges: ['🟢 Safe', '🟡 Minor', '🟠 Moderate', '🔴 Dangerous'],
  },
  {
    emoji: '🧭',
    title: 'Navigate with Hazard Alerts',
    subtitle: 'Smart Accessible Routing',
    body: 'Search any destination and choose <strong>Walk 🚶</strong> or <strong>Wheelchair ♿</strong> mode. Your route will automatically show <strong>nearby hazards</strong> reported by the community.',
    color: '#2196f3',
    glow: 'rgba(33,150,243,0.35)',
    tip: '🗺️ Tap "Start in Google Maps" for GPS navigation!',
  },
  {
    emoji: '🆘',
    title: 'SOS Emergency Button',
    subtitle: 'Always Within Reach',
    body: 'The red <strong>SOS button</strong> (bottom-left) is always visible. Tap it to <strong>call family</strong>, <strong>call your caregiver</strong>, or instantly <strong>share your live GPS location</strong>.',
    color: '#f44336',
    glow: 'rgba(244,67,54,0.35)',
    tip: '📞 First use will ask you to save a contact number.',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide]     = useState(0);
  const [exiting, setExiting] = useState(false);

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

  const prev = () => { if (slide > 0) setSlide(s => s - 1); };

  if (!visible) return null;

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className={`ob-overlay${exiting ? ' ob-exit' : ''}`} id="onboarding-overlay">
      <div className="ob-modal" id="onboarding-modal" style={{ '--ob-color': s.color, '--ob-glow': s.glow }}>

        {/* Skip */}
        <button className="ob-skip" id="ob-skip" onClick={close}>Skip</button>

        {/* Slide content */}
        <div className="ob-slide" key={slide} id={`ob-slide-${slide}`}>
          {/* Icon orb */}
          <div className="ob-orb">
            <span className="ob-emoji">{s.emoji}</span>
          </div>

          <div className="ob-subtitle">{s.subtitle}</div>
          <h2 className="ob-title">{s.title}</h2>
          <p className="ob-body" dangerouslySetInnerHTML={{ __html: s.body }} />

          {/* Optional tip */}
          {s.tip && <div className="ob-tip">{s.tip}</div>}

          {/* Optional severity badges */}
          {s.badges && (
            <div className="ob-badges">
              {s.badges.map((b, i) => (
                <span key={i} className="ob-badge">{b}</span>
              ))}
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ob-dot${i === slide ? ' active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          <button
            className="ob-btn-prev"
            id="ob-prev"
            onClick={prev}
            disabled={slide === 0}
          >
            ← Back
          </button>
          <button className="ob-btn-next" id="ob-next" onClick={next}>
            {isLast ? '🚀 Get Started' : 'Next →'}
          </button>
        </div>

      </div>
    </div>
  );
}
