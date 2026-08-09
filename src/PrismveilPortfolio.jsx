import React, { useEffect, useRef, useState } from "react";
import "./PrismveilPortfolio.css";

const SKILLS = [
  { code: "V1", label: "Narrative Editing", detail: "Cutting for pace, rhythm, and story beats", value: 95 },
  { code: "V2", label: "Story Structure & Pacing", detail: "Shaping raw footage into a clear arc", value: 90 },
  { code: "C1", label: "Color Grading", detail: "Mood-driven grades, consistent skin tones", value: 70 },
  { code: "A1", label: "Sound Design & Mix", detail: "Cleanup, layering, music sync", value: 72 },
  { code: "G1", label: "Motion Graphics", detail: "Titles, lower-thirds, kinetic type", value: 40 },
];

const PROJECTS = [
  { file: "BUSINESS.mp4", title: "Business", aspect: "9:16" },
  { file: "FOR REELS-copy.mp4", title: "For Reels", aspect: "9:16" },
  { file: "PERSONAL BRANDS.mp4", title: "Personal Brands", aspect: "9:16" },
  { file: "REELS.mp4", title: "Reels", aspect: "9:16" },
];

function useRevealOnScroll() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Ruler() {
  const ticks = Array.from({ length: 61 }, (_, i) => i);
  return (
    <div className="pv-ruler" role="presentation" aria-hidden="true">
      <div className="pv-ruler-track">
        {ticks.map((i) => (
          <div key={i} className={`pv-tick ${i % 5 === 0 ? "pv-tick-major" : ""}`} />
        ))}
        <div className="pv-playhead" />
      </div>
    </div>
  );
}

function SkillTrack({ skill, active, delay }) {
  return (
    <div className="pv-track" style={{ transitionDelay: `${delay}ms` }} data-active={active}>
      <div className="pv-track-head">
        <span className="pv-track-code">{skill.code}</span>
        <div>
          <div className="pv-track-label">{skill.label}</div>
          <div className="pv-track-detail">{skill.detail}</div>
        </div>
      </div>
      <div className="pv-track-lane">
        <div
          className="pv-track-fill"
          style={{ width: active ? `${skill.value}%` : "0%" }}
        />
        <div className="pv-track-waveform" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ height: `${18 + ((i * 37) % 60)}%` }} />
          ))}
        </div>
      </div>
      <span className="pv-track-value">{skill.value}%</span>
    </div>
  );
}

function FullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}

function requestVideoFullscreen(container, video) {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    return;
  }
  // Preferred: fullscreen the container so our custom controls stay visible
  // instead of the browser swapping in its own native video controls.
  if (container?.requestFullscreen) {
    container.requestFullscreen();
    return;
  }
  if (container?.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
    return;
  }
  // iOS Safari only supports fullscreen on the <video> element itself,
  // so it falls back to the native player there (custom UI is not
  // available on iOS fullscreen video regardless of approach).
  if (video?.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
    return;
  }
  if (video?.requestFullscreen) video.requestFullscreen();
}

function formatTime(t) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ProjectCard({ project }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const seekingRef = useRef(false);
  const isTouchRef = useRef(false);
  // Tracks what the user actually wants, independent of the video element's
  // real (and sometimes browser-overridden) state. Mobile browsers will
  // silently pause inline video that scrolls off-screen to save power; if
  // nothing resumes it afterward it just looks "stuck stopped" even though
  // the user never paused it. This ref is what lets us tell the difference
  // between "user paused this" and "the browser paused this on us".
  const wantsPlayRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  };

  const pauseVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
  };

  // Hover-to-preview is a desktop-only affordance. On touch devices these
  // same events can fire from a tap (in an order that fights with the tap's
  // own play/pause toggle), which is what made "resume" appear to do
  // nothing on mobile. Skip them entirely once we know this is a touch UI.
  const handleEnter = () => {
    if (isTouchRef.current) return;
    wantsPlayRef.current = true;
    if (videoRef.current?.paused) playVideo();
  };

  const handleLeave = () => {
    if (isTouchRef.current) return;
    wantsPlayRef.current = false;
    pauseVideo();
  };

  const handleTouchStart = () => {
    isTouchRef.current = true;
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    // Always act on the video's real state rather than React state, so a
    // stray/duplicate event never leaves play and pause out of sync.
    if (v.paused) {
      wantsPlayRef.current = true;
      playVideo();
    } else {
      wantsPlayRef.current = false;
      pauseVideo();
    }
  };

  // Mobile browsers can silently pause inline video on their own (power
  // saving, buffering hiccups, background throttling) without the user
  // ever tapping pause. Rather than guess exactly when that happens, treat
  // any pause as unintended when wantsPlayRef is still true and resume
  // right away — this self-corrects regardless of the cause, instead of
  // relying on a scroll/visibility trigger that may never fire again.
  const handleUnexpectedPause = () => {
    setPlaying(false);
    if (wantsPlayRef.current) {
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (wantsPlayRef.current && v && v.paused) v.play().catch(() => {});
      });
    }
  };

  // Catches the other way playback silently dies: a network buffering
  // stall. When that happens the video isn't "paused" at all — .paused
  // stays false, so no pause event ever fires — it just freezes on the
  // current frame forever. Poll for currentTime not advancing while it's
  // supposed to be playing, and kick it back into gear when that happens.
  useEffect(() => {
    const lastTimeRef = { current: -1 };
    const watchdog = setInterval(() => {
      const v = videoRef.current;
      if (!v || !wantsPlayRef.current || v.paused || v.ended) return;
      if (Math.abs(v.currentTime - lastTimeRef.current) < 0.03) {
        if (v.readyState < 3) {
          // Not enough data buffered at all — force a fresh fetch.
          const t = v.currentTime;
          v.load();
          v.currentTime = t;
        }
        v.play().catch(() => {});
      }
      lastTimeRef.current = v.currentTime;
    }, 2000);
    return () => clearInterval(watchdog);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      const v = videoRef.current;
      if (!v || document.hidden) return;
      if (wantsPlayRef.current && v.paused) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next && v.volume === 0) {
      v.volume = 1;
      setVolume(1);
    }
    setMuted(next);
  };

  const handleVolume = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    const shouldMute = val === 0;
    v.muted = shouldMute;
    setMuted(shouldMute);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setProgress(val);
    const v = videoRef.current;
    if (!v || !duration) return;
    const t = (val / 100) * duration;
    v.currentTime = t;
    setCurrentTime(t);
  };

  const handleSeekStart = (e) => {
    e.stopPropagation();
    seekingRef.current = true;
  };

  const handleSeekEnd = (e) => {
    e.stopPropagation();
    seekingRef.current = false;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || seekingRef.current) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleLoadedMeta = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();
    requestVideoFullscreen(cardRef.current, videoRef.current);
  };

  return (
    <div
      ref={cardRef}
      className={`pv-clip pv-clip-${project.aspect === "16:9" ? "wide" : "tall"}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleTouchStart}
    >
      <video
        ref={videoRef}
        src={`/videos/${encodeURIComponent(project.file)}`}
        muted={muted}
        loop
        playsInline
        preload="auto"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMeta}
        onPlay={() => setPlaying(true)}
        onPause={handleUnexpectedPause}
        onEnded={() => setPlaying(false)}
      />

      {!playing && (
        <div className="pv-clip-play" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      <div className="pv-clip-topbar">
        <span className="pv-clip-badge pv-mono">{project.aspect}</span>
        <span className="pv-clip-title pv-mono">
          {project.title} <span className="pv-clip-chevron">›</span>
        </span>
      </div>

      <div className="pv-clip-controls" onClick={(e) => e.stopPropagation()}>
        <input
          type="range"
          className="pv-clip-seek"
          min="0"
          max="100"
          step="0.1"
          value={Number.isFinite(progress) ? progress : 0}
          onChange={handleSeek}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          aria-label="Seek"
        />
        <div className="pv-clip-controls-row">
          <button
            type="button"
            className="pv-clip-btn"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="pv-clip-btn"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <span style={{ fontSize: "0.95rem" }}>{muted || volume === 0 ? "🔇" : "🔊"}</span>
          </button>
          <input
            type="range"
            className="pv-clip-vol"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={handleVolume}
            aria-label="Volume"
          />
          <div className="pv-clip-right">
            <span className="pv-clip-time pv-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              type="button"
              className="pv-clip-btn"
              onClick={handleFullscreen}
              aria-label="Fullscreen"
            >
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrismveilPortfolio() {
  const [skillsRef, skillsVisible] = useRevealOnScroll();
  const heroVideoRef = useRef(null);
  const heroWrapRef = useRef(null);
  const heroSeekingRef = useRef(false);
  const heroWantsPlayRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroCurrentTime, setHeroCurrentTime] = useState(0);
  const [heroDuration, setHeroDuration] = useState(0);
  const [started, setStarted] = useState(false);
  const [heroPlaying, setHeroPlaying] = useState(false);

  const startWithSound = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.volume = 1;
    setVolume(1);
    heroWantsPlayRef.current = true;
    v.play().catch(() => {});
    setStarted(true);
  };

  const toggleHeroPlay = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    if (v.paused) {
      heroWantsPlayRef.current = true;
      v.play().catch(() => {});
    } else {
      heroWantsPlayRef.current = false;
      v.pause();
    }
  };

  // Mobile browsers can silently pause inline video on their own (power
  // saving, buffering hiccups, background throttling). Rather than guess
  // exactly when that happens, treat any pause as unintended when
  // heroWantsPlayRef is still true and resume right away.
  const handleHeroUnexpectedPause = () => {
    setHeroPlaying(false);
    if (heroWantsPlayRef.current) {
      requestAnimationFrame(() => {
        const v = heroVideoRef.current;
        if (heroWantsPlayRef.current && v && v.paused) v.play().catch(() => {});
      });
    }
  };

  // Catches a network buffering stall: the video isn't "paused" (no pause
  // event fires) but currentTime stops advancing and it freezes on frame.
  // Poll for that and force it to recover instead of leaving it dead.
  useEffect(() => {
    const lastTimeRef = { current: -1 };
    const watchdog = setInterval(() => {
      const v = heroVideoRef.current;
      if (!v || !heroWantsPlayRef.current || v.paused || v.ended) return;
      if (Math.abs(v.currentTime - lastTimeRef.current) < 0.03) {
        if (v.readyState < 3) {
          const t = v.currentTime;
          v.load();
          v.currentTime = t;
        }
        v.play().catch(() => {});
      }
      lastTimeRef.current = v.currentTime;
    }, 2000);
    return () => clearInterval(watchdog);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      const v = heroVideoRef.current;
      if (!v || document.hidden) return;
      if (heroWantsPlayRef.current && v.paused) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const toggleMute = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next && v.volume === 0) {
      v.volume = 1;
      setVolume(1);
    }
    setMuted(next);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const v = heroVideoRef.current;
    if (!v) return;
    v.volume = val;
    const shouldMute = val === 0;
    v.muted = shouldMute;
    setMuted(shouldMute);
  };

  const handleHeroSeek = (e) => {
    const val = parseFloat(e.target.value);
    setHeroProgress(val);
    const v = heroVideoRef.current;
    if (!v || !heroDuration) return;
    const t = (val / 100) * heroDuration;
    v.currentTime = t;
    setHeroCurrentTime(t);
  };

  const handleHeroTimeUpdate = () => {
    const v = heroVideoRef.current;
    if (!v || !v.duration || heroSeekingRef.current) return;
    setHeroCurrentTime(v.currentTime);
    setHeroProgress((v.currentTime / v.duration) * 100);
  };

  const handleHeroLoadedMeta = () => {
    const v = heroVideoRef.current;
    if (v) setHeroDuration(v.duration);
  };

  const handleHeroSeekStart = () => {
    heroSeekingRef.current = true;
  };

  const handleHeroSeekEnd = () => {
    heroSeekingRef.current = false;
  };

  const handleHeroFullscreen = () => {
    requestVideoFullscreen(heroWrapRef.current, heroVideoRef.current);
  };

  return (
    <div className="pv-root">
      <link rel="icon" type="image/png" href="/images/Lololo.png" />

      <nav className="pv-nav">
        <div className="pv-logo">
          <img src="/images/Lololo.png" alt="Prismveil logo" className="pv-gem" />
          <span className="pv-logo-text">Prismveil</span>
        </div>
      </nav>

      <header className="pv-hero">
        <div>
          <p className="pv-eyebrow">Film &amp; Content Editor</p>
          <h1 className="pv-h1 pv-display">
            Cuts that carry <em>the story.</em>
          </h1>
          <p className="pv-sub">
            I'm the editor behind Prismveil — shaping raw footage into promos, brand
            films, and content edits with clean pacing and a consistent grade.
          </p>
        </div>

        <div className="pv-viewfinder" id="reel">
          <div className="pv-video-wrap" ref={heroWrapRef}>
            <video
              ref={heroVideoRef}
              src="/videos/Getting%20Sweeet%20with%20Sam.mp4"
              muted={muted}
              loop
              playsInline
              preload="auto"
              aria-label="Showreel preview"
              onClick={toggleHeroPlay}
              onTimeUpdate={handleHeroTimeUpdate}
              onLoadedMetadata={handleHeroLoadedMeta}
              onPlay={() => setHeroPlaying(true)}
              onPause={handleHeroUnexpectedPause}
            />
            {started && !heroPlaying && (
              <div className="pv-hero-paused-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
            {!started && (
              <button
                type="button"
                className="pv-hero-play-btn"
                onClick={startWithSound}
                aria-label="Play showreel with sound"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play with sound</span>
              </button>
            )}
            <div className="pv-video-overlay">
              <span className="pv-rec">
                <span className="pv-rec-dot" /> SHOWREEL
              </span>
              <div className="pv-hero-bottom" style={{ pointerEvents: "auto" }}>
                <input
                  type="range"
                  className="pv-hero-seek"
                  min="0"
                  max="100"
                  step="0.1"
                  value={Number.isFinite(heroProgress) ? heroProgress : 0}
                  onChange={handleHeroSeek}
                  onMouseDown={handleHeroSeekStart}
                  onTouchStart={handleHeroSeekStart}
                  onMouseUp={handleHeroSeekEnd}
                  onTouchEnd={handleHeroSeekEnd}
                  aria-label="Seek showreel"
                />
                <div className="pv-bottom-row">
                  <div className="pv-vol-control">
                    <button
                      type="button"
                      className="pv-vol-btn"
                      onClick={toggleMute}
                      aria-label={muted ? "Unmute showreel" : "Mute showreel"}
                    >
                      {muted || volume === 0 ? "🔇" : "🔊"}
                    </button>
                    <input
                      type="range"
                      className="pv-vol-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                    />
                  </div>
                  <div className="pv-hero-right">
                    <span className="pv-tc pv-mono">
                      {formatTime(heroCurrentTime)} / {formatTime(heroDuration)}
                    </span>
                    <button
                      type="button"
                      className="pv-vol-btn"
                      onClick={handleHeroFullscreen}
                      aria-label="Fullscreen showreel"
                    >
                      <FullscreenIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Ruler />

      <section className="pv-section" id="work">
        <p className="pv-eyebrow">Selected Work</p>
        <h2 className="pv-h2 pv-display" style={{ marginBottom: "1.6rem" }}>
          From the project bin.
        </h2>
        <div className="pv-gallery">
          <div className="pv-gallery-row">
            {PROJECTS.filter((p) => p.aspect === "9:16").map((p) => (
              <ProjectCard key={p.file} project={p} />
            ))}
          </div>
          {PROJECTS.filter((p) => p.aspect === "16:9").map((p) => (
            <ProjectCard key={p.file} project={p} />
          ))}
        </div>
      </section>

      <section className="pv-section" id="about">
        <div className="pv-about-col">
          <p className="pv-eyebrow">About</p>
          <div className="pv-avatar-wrap">
            <img src="/images/me.png" alt="Kylle Eisen" className="pv-avatar" />
          </div>
          <h2 className="pv-h2 pv-display">Editing under the Prismveil name.</h2>
          <div className="pv-info-card">
            <div className="pv-info-row">
              <span className="pv-info-label pv-mono">Name</span>
              <span className="pv-info-value">Kylle Eisen</span>
            </div>
            <div className="pv-info-row">
              <span className="pv-info-label pv-mono">Age</span>
              <span className="pv-info-value">22 (turning 23 on Aug 17)</span>
            </div>
            <div className="pv-info-row">
              <span className="pv-info-label pv-mono">Editing in</span>
              <span className="pv-info-value">CapCut</span>
            </div>
          </div>
          <p className="pv-bio">
            I'm a self-taught video editor and the person behind{" "}
            <strong>Prismveil</strong> — a black-and-gold creative brand built
            around clean cuts and deliberate pacing. I got here the same way I
            learn everything: build first, refine after. Every project starts
            with the story the footage is already telling, then I cut, grade,
            and score around it.
          </p>
          <p className="pv-bio" style={{ marginTop: "1rem" }}>
            Currently based in the Philippines, taking on freelance edits for
            YouTube creators, brand promos, and short-form content — with an eye
            for a distinct visual identity in every delivery.
          </p>

          <div className="pv-mixer-wrap" id="skills" ref={skillsRef}>
            <div className="pv-mixer">
              <div className="pv-mixer-head">
                <span>Skills.mix</span>
                <span>5 tracks</span>
              </div>
              {SKILLS.map((skill, i) => (
                <SkillTrack key={skill.code} skill={skill} active={skillsVisible} delay={i * 90} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="pv-footer" id="contact">
        <span>© {new Date().getFullYear()} Prismveil — Video Editing</span>
        <a href="mailto:hello@prismveil.studio">hello@prismveil.studio</a>
      </footer>
    </div>
  );
}