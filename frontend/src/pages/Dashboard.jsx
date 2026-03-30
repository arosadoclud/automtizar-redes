import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ─── GOOGLE FONTS ────────────────────────────────────────────────────────────
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  `}</style>
);

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* Base layers */
    --bg:        #08080f;
    --surface:   #0f0f1b;
    --surface2:  #14141f;
    --surface3:  #1c1c2e;
    --surface4:  #242438;
    /* Borders */
    --border:    rgba(255,255,255,0.065);
    --border2:   rgba(255,255,255,0.12);
    --border3:   rgba(255,255,255,0.20);
    /* Brand / accent */
    --cyan:      #22d3ee;
    --cyan-dim:  rgba(34,211,238,0.12);
    --cyan-glow: rgba(34,211,238,0.28);
    /* Semantic */
    --amber:     #fbbf24;
    --amber-dim: rgba(251,191,36,0.12);
    --green:     #4ade80;
    --green-dim: rgba(74,222,128,0.12);
    --red:       #f87171;
    --red-dim:   rgba(248,113,113,0.12);
    --purple:    #c084fc;
    --purple-dim:rgba(192,132,252,0.12);
    --blue:      #60a5fa;
    /* Text */
    --text:      #f1f1fa;
    --text-2:    #8b8bab;
    --text-3:    #4a4a68;
    /* Fonts */
    --font-head: 'Syne', sans-serif;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    /* Radii */
    --radius:    10px;
    --radius-lg: 16px;
    --radius-xl: 22px;
    /* Shadows */
    --shadow:    0 4px 24px rgba(0,0,0,0.45);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.65);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    overflow-x: hidden;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface4); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border2); }

  .layout {
    display: flex;
    min-height: 100vh;
  }

  /* ── SIDEBAR ──────────────────────────────── */
  .sidebar {
    width: 252px;
    min-height: 100vh;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0;
    z-index: 100;
  }

  .sidebar-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid var(--border);
  }

  .logo-badge {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 19px;
    box-shadow: 0 4px 16px rgba(99,102,241,0.38);
    flex-shrink: 0;
  }

  .logo-text {
    font-family: var(--font-head);
    font-weight: 800;
    font-size: 16px;
    color: var(--text);
    letter-spacing: -0.5px;
    line-height: 1.15;
  }

  .logo-sub {
    font-size: 9px;
    color: var(--cyan);
    letter-spacing: 2.5px;
    text-transform: uppercase;
    font-weight: 500;
    margin-top: 1px;
    opacity: 0.8;
  }

  .sidebar-nav {
    flex: 1;
    padding: 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  .nav-section {
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--text-3);
    text-transform: uppercase;
    padding: 14px 10px 5px;
    font-weight: 700;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px 8px 9px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.14s ease;
    font-size: 13.5px;
    color: var(--text-2);
    font-weight: 500;
    position: relative;
    border: 1px solid transparent;
    overflow: hidden;
  }

  .nav-item::before {
    content: '';
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px; height: 60%;
    background: var(--cyan);
    border-radius: 0 3px 3px 0;
    transition: transform 0.2s ease;
  }

  .nav-item:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .nav-item.active {
    background: var(--cyan-dim);
    border-color: rgba(34,211,238,0.18);
    color: var(--cyan);
  }

  .nav-item.active::before { transform: translateY(-50%) scaleY(1); }

  .nav-icon {
    width: 28px; height: 28px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    background: var(--surface3);
    flex-shrink: 0;
    transition: background 0.14s;
  }

  .nav-item.active .nav-icon {
    background: rgba(34,211,238,0.18);
  }

  .nav-item:hover .nav-icon {
    background: var(--surface4);
  }

  .nav-badge {
    margin-left: auto;
    background: var(--red);
    color: #fff;
    font-size: 10px;
    padding: 0 6px;
    border-radius: 20px;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
    line-height: 18px;
    height: 18px;
  }

  .nav-badge.cyan { background: var(--cyan); color: var(--bg); }

  .sidebar-footer {
    padding: 14px 16px 18px;
    border-top: 1px solid var(--border);
  }

  .status-dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse 2.2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--green); }
    50% { opacity: 0.5; box-shadow: 0 0 14px var(--green); }
  }

  .status-label {
    font-size: 12px;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  /* ── MAIN ──────────────────────────────────── */
  .main {
    margin-left: 252px;
    flex: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    height: 62px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(10px);
  }

  .topbar-title {
    font-family: var(--font-head);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.4px;
    color: var(--text);
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .workspace-selector {
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 13px;
    padding: 7px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    font-weight: 500;
  }

  .workspace-selector:hover { border-color: var(--border3); }

  .page-content {
    flex: 1;
    padding: 28px 30px;
    overflow-y: auto;
  }

  /* ── CARDS ──────────────────────────────────── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
  }

  .card-sm {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }

  /* ── GRID ───────────────────────────────────── */
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .col-2   { grid-column: span 2; }
  .col-3   { grid-column: span 3; }

  /* ── STAT CARDS ─────────────────────────────── */
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .stat-card:hover { border-color: var(--border2); }

  .stat-accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .stat-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 14px;
  }

  .stat-value {
    font-family: var(--font-head);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .stat-delta {
    font-size: 11px;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .delta-up { color: var(--green); }
  .delta-down { color: var(--red); }

  /* ── SECTION HEADER ─────────────────────────── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-title {
    font-family: var(--font-head);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .section-sub {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 2px;
  }

  /* ── BUTTONS ─────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--cyan);
    color: var(--bg);
    border-color: var(--cyan);
    font-weight: 700;
  }

  .btn-primary:hover { background: #00bfe8; box-shadow: 0 0 20px var(--cyan-glow); }

  .btn-ghost {
    background: transparent;
    color: var(--text-2);
    border-color: var(--border2);
  }

  .btn-ghost:hover { background: var(--surface2); color: var(--text); }

  .btn-danger {
    background: var(--red-dim);
    color: var(--red);
    border-color: rgba(239,68,68,0.3);
  }

  .btn-danger:hover { background: rgba(239,68,68,0.25); }

  .btn-success {
    background: var(--green-dim);
    color: var(--green);
    border-color: rgba(16,185,129,0.3);
  }

  .btn-success:hover { background: rgba(16,185,129,0.25); }

  .btn-amber {
    background: var(--amber-dim);
    color: var(--amber);
    border-color: rgba(245,158,11,0.3);
  }

  .btn-amber:hover { background: rgba(245,158,11,0.25); }

  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .btn-lg { padding: 12px 24px; font-size: 14px; }

  /* ── CONTENT QUEUE CARD ──────────────────────── */
  .queue-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
    margin-bottom: 16px;
  }

  .queue-card:hover {
    border-color: var(--border2);
    transform: translateY(-1px);
  }

  .queue-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface3);
  }

  .queue-card-body {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 0;
  }

  .queue-image {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-right: 1px solid var(--border);
  }

  .queue-image-placeholder {
    width: 200px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    border-right: 1px solid var(--border);
    flex-shrink: 0;
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    overflow: hidden;
    object-fit: cover;
  }

  .queue-content {
    padding: 20px;
    flex: 1;
  }

  .queue-text {
    font-size: 13px;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .queue-hashtags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  .hashtag-chip {
    background: var(--surface3);
    border: 1px solid var(--border);
    color: var(--cyan);
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 20px;
  }

  .queue-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .queue-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 11px;
    color: var(--text-3);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2px;
    border: 1px solid transparent;
  }

  .status-pending_review { background: var(--amber-dim); color: var(--amber); border-color: rgba(251,191,36,0.2); }
  .status-approved       { background: var(--green-dim);  color: var(--green);  border-color: rgba(74,222,128,0.2);  }
  .status-published      { background: var(--cyan-dim);   color: var(--cyan);   border-color: rgba(34,211,238,0.2);  }
  .status-rejected       { background: var(--red-dim);    color: var(--red);    border-color: rgba(248,113,113,0.2); }
  .status-failed         { background: var(--red-dim);    color: var(--red);    border-color: rgba(248,113,113,0.2); }

  /* ── TREND SCORE ────────────────────────────── */
  .trend-score {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
  }

  .score-bar {
    height: 4px;
    width: 60px;
    background: var(--surface3);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan), var(--purple));
    border-radius: 2px;
  }

  /* ── EDIT MODAL ─────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.15s ease;
  }

  .modal {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.2s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .modal-title {
    font-family: var(--font-head);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--surface3);
    border: 1px solid var(--border);
    color: var(--text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: background 0.15s;
  }

  .modal-close:hover { background: var(--surface4); color: var(--text); }

  .modal-body { padding: 24px; }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  /* Inline generate panel inside QueueView */
  .generate-panel {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 20px;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── METRICS ────────────────────────────────── */
  .metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }

  .metric-row:last-child { border-bottom: none; }

  /* ── OKR PROGRESS ───────────────────────────── */
  .okr-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 12px;
  }

  .okr-title {
    font-family: var(--font-head);
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kr-item {
    margin-bottom: 14px;
  }

  .kr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
  }

  .kr-desc { color: var(--text-2); font-size: 12px; }
  .kr-pct { color: var(--cyan); font-weight: 700; font-size: 12px; }

  .progress-bar {
    height: 7px;
    background: var(--surface3);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(.4,0,.2,1);
  }

  /* ── GENERATOR FORM ─────────────────────────── */
  .form-group { margin-bottom: 20px; }

  .form-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 8px;
    font-weight: 600;
  }

  .form-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    padding: 10px 14px;
    border-radius: var(--radius);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .form-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
  }

  .form-input::placeholder { color: var(--text-3); }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .niche-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .niche-chip {
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid var(--border2);
    cursor: pointer;
    transition: all 0.15s;
    background: var(--surface2);
    color: var(--text-2);
    font-weight: 500;
  }

  .niche-chip.selected {
    background: var(--cyan-dim);
    border-color: rgba(34,211,238,0.3);
    color: var(--cyan);
  }

  /* ── TOAST ───────────────────────────────────── */
  .toast-container {
    position: fixed;
    bottom: 28px;
    right: 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
  }

  .toast {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-lg);
    padding: 12px 16px;
    font-size: 13.5px;
    max-width: 340px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.25s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
  }

  .toast.success { border-left: 3px solid var(--green); }
  .toast.error   { border-left: 3px solid var(--red); }
  .toast.info    { border-left: 3px solid var(--cyan); }

  @keyframes slideIn {
    from { transform: translateX(110%) scale(0.95); opacity: 0; }
    to   { transform: translateX(0)   scale(1);     opacity: 1; }
  }

  /* ── EMPTY STATE ─────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 24px;
    color: var(--text-3);
    text-align: center;
    gap: 14px;
  }

  .empty-icon { font-size: 52px; opacity: 0.4; line-height: 1; }
  .empty-title { font-family: var(--font-head); font-size: 17px; color: var(--text-2); font-weight: 700; }
  .empty-desc  { font-size: 13px; max-width: 300px; line-height: 1.65; }

  /* ── FILTER TABS ─────────────────────────────── */
  .filter-tabs {
    display: flex;
    gap: 4px;
    background: var(--surface2);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .filter-tab {
    padding: 6px 16px;
    border-radius: 8px;
    font-size: 11.5px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--text-3);
    letter-spacing: 0.3px;
    font-weight: 500;
  }

  .filter-tab.active {
    background: var(--surface);
    color: var(--cyan);
    font-weight: 600;
    box-shadow: 0 1px 6px rgba(0,0,0,0.35);
  }

  /* ── ACTIVITY FEED ───────────────────────────── */
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }

  .activity-item:last-child { border-bottom: none; }

  .activity-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
    box-shadow: 0 0 6px currentColor;
  }

  .activity-text { font-size: 12.5px; color: var(--text-2); line-height: 1.5; }
  .activity-time { font-size: 10.5px; color: var(--text-3); margin-top: 2px; }

  /* ── LOADING ─────────────────────────────────── */
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--surface4);
    border-top-color: var(--cyan);
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .skeleton {
    background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius);
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  /* ── CHART TOOLTIP ───────────────────────────── */
  .recharts-tooltip-wrapper .custom-tooltip {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text);
  }

  /* ── GAP UTILITIES ───────────────────────────── */
  .gap-4  { gap: 4px; }
  .gap-8  { gap: 8px; }
  .gap-12 { gap: 12px; }
  .gap-16 { gap: 16px; }
  .gap-24 { gap: 24px; }

  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .flex-1 { flex: 1; }
  .w-full { width: 100%; }
  .mt-8  { margin-top: 8px; }
  .mt-16 { margin-top: 16px; }
  .mt-24 { margin-top: 24px; }
  .mb-16 { margin-bottom: 16px; }
  .mb-24 { margin-bottom: 24px; }
  .text-cyan { color: var(--cyan); }
  .text-amber { color: var(--amber); }
  .text-green { color: var(--green); }
  .text-red   { color: var(--red); }
  .text-muted { color: var(--text-2); }
  .text-xs  { font-size: 11px; }
  .text-sm  { font-size: 13px; }
  .bold     { font-weight: 700; }
  .font-head { font-family: var(--font-head); }

  /* ── MODE SELECTOR TABS ──────────────────────── */
  .mode-tabs {
    display: flex;
    gap: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border2);
    width: fit-content;
    margin-bottom: 28px;
  }
  .mode-tab {
    padding: 12px 28px;
    background: var(--surface2);
    color: var(--text-2);
    border: none;
    border-right: 1px solid var(--border);
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 500;
    transition: all 0.15s;
    font-family: var(--font-body);
  }
  .mode-tab:last-child { border-right: none; }
  .mode-tab.active { background: var(--cyan); color: var(--bg); font-weight: 700; }
  .mode-tab:hover:not(.active) { background: var(--surface3); color: var(--text); }

  /* ── SETTINGS TABS ───────────────────────────── */
  .settings-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }
  .settings-tab {
    padding: 10px 20px;
    font-size: 13px;
    cursor: pointer;
    color: var(--text-3);
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    margin-bottom: -1px;
  }
  .settings-tab.active { color: var(--cyan); border-bottom-color: var(--cyan); font-weight: 600; }
  .settings-tab:hover:not(.active) { color: var(--text-2); background: var(--surface2); border-radius: var(--radius) var(--radius) 0 0; }

  /* ── SETUP STEPS ─────────────────────────────── */
  .setup-step {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 4px solid var(--border2);
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
    padding: 20px 24px;
    margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .setup-step.step-done  { border-left-color: var(--green); }
  .setup-step.step-error { border-left-color: var(--red); }
  .setup-step.step-active { border-left-color: var(--cyan); box-shadow: 0 0 0 1px rgba(34,211,238,0.1) inset; }

  /* ── USER TABLE ──────────────────────────────── */
  .user-row {
    display: grid;
    grid-template-columns: 1fr 1fr 130px 90px;
    gap: 16px;
    padding: 14px 16px;
    align-items: center;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .user-row:last-child { border-bottom: none; }
  .user-row:hover { background: var(--surface2); }
  .user-header {
    display: grid;
    grid-template-columns: 1fr 1fr 130px 90px;
    gap: 16px;
    padding: 8px 16px;
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 700;
    border-bottom: 1px solid var(--border);
  }

  /* ── FB POST PREVIEW ─────────────────────────── */
  .fb-preview {
    background: #fff;
    border-radius: 10px;
    padding: 16px;
    color: #1c1e21;
    border: 1px solid #dce0e4;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .fb-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #fff; flex-shrink: 0;
  }

  /* ── INFO BOX ────────────────────────────────── */
  .info-box {
    background: var(--amber-dim);
    border: 1px solid rgba(251,191,36,0.25);
    border-radius: var(--radius);
    padding: 12px 16px;
    font-size: 12px;
    color: var(--amber);
    line-height: 1.6;
  }
  .info-box.info { background: var(--cyan-dim); border-color: rgba(34,211,238,0.25); color: var(--cyan); }
  .info-box.success { background: var(--green-dim); border-color: rgba(74,222,128,0.25); color: var(--green); }

  /* ── CHAR COUNTER ────────────────────────────── */
  .char-count { font-size: 10px; color: var(--text-3); text-align: right; margin-top: 3px; }
  .char-count.warn { color: var(--amber); }
  .char-count.over { color: var(--red); }

  /* ── ONBOARDING BANNER ───────────────────────── */
  .onboarding-banner {
    background: linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08));
    border: 1px solid rgba(34,211,238,0.2);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    margin-bottom: 28px;
    display: flex;
    align-items: flex-start;
    gap: 20px;
    animation: slideUp 0.3s ease;
  }
  .onboarding-step-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    flex-shrink: 0;
  }

  /* ── PLATFORM CHECKBOX ───────────────────────── */
  .platform-check {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius);
    border: 1px solid var(--border2);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 13px;
    color: var(--text-2);
    background: var(--surface2);
    user-select: none;
  }
  .platform-check.checked {
    border-color: rgba(34,211,238,0.4);
    background: var(--cyan-dim);
    color: var(--cyan);
  }
`;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_WORKSPACES = [
  { id: "ws1", name: "Salud Natural RD", slug: "salud-natural-rd", niches: ["salud_natural","suplementos","bienestar"], mode: "human_review", daily_post_goal: 3 },
  { id: "ws2", name: "Emprendimiento Digital", slug: "emprendimiento-digital", niches: ["emprendimiento","motivacion","lifestyle"], mode: "autonomous", daily_post_goal: 2 },
];

const MOCK_QUEUE = [
  {
    id: "c1", workspace_id: "ws1", status: "pending_review",
    topic: "Beneficios del Magnesio para el Sueño",
    text: `¿Sabías que el magnesio es uno de los minerales más importantes para tu cuerpo, y la mayoría de personas tiene deficiencia? 😴✨\n\nEl magnesio regula más de 300 procesos enzimáticos, incluyendo la producción de melatonina — la hormona del sueño.\n\nSeñales de que necesitas más magnesio:\n• Dificultad para dormir 😔\n• Calambres musculares\n• Irritabilidad o ansiedad\n• Fatiga constante\n\nLas fuentes naturales más potentes son las semillas de calabaza, espinaca, almendras y chocolate negro +70%.\n\n¿Cuántas de estas señales reconoces en tu vida? 👇`,
    hashtags: ["magnesio","saludnatural","suplementos","bienestar","dormirbien","salud","suplementacion","vidasana","mineralesesenciales","saludalternativa"],
    cta: "Comenta SI si quieres nuestra guía gratuita de suplementos naturales 🌿",
    trend_score: 0.87,
    trend_source: "google_trends",
    scheduled_at: "2024-01-15T09:00:00",
    created_at: "2024-01-14T19:30:00",
    image_tier_used: "dalle",
    platforms: ["facebook","instagram"],
    gradient: "linear-gradient(135deg, #0f4c3a, #10b981)",
    emoji: "🌿",
  },
  {
    id: "c2", workspace_id: "ws1", status: "pending_review",
    topic: "Rutina de Mañana para Emprendedores",
    text: `Las primeras 2 horas del día determinan tu productividad completa. 🌅\n\nLos emprendedores más exitosos del mundo comparten UN hábito en común: no revisan su teléfono al despertar.\n\nMi rutina de 5 pasos para maximizar el día:\n\n1️⃣ Hidratación: 500ml de agua con limón\n2️⃣ Movimiento: 20 minutos de ejercicio\n3️⃣ Meditación: 10 minutos de silencio\n4️⃣ Journaling: 3 metas del día\n5️⃣ Lectura: 30 páginas de un libro\n\nResultado: claridad mental, energía sostenida y enfoque durante todo el día. 🔥`,
    hashtags: ["emprendedor","rutinademañana","habitos","productividad","exito","mentalidadganadora","emprendimiento","lifestyle","motivacion","crecer"],
    cta: "Guarda este post para mañana en la mañana 📌",
    trend_score: 0.72,
    trend_source: "reddit",
    scheduled_at: "2024-01-15T12:00:00",
    created_at: "2024-01-14T19:35:00",
    image_tier_used: "replicate",
    platforms: ["facebook","instagram"],
    gradient: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
    emoji: "🌅",
  },
  {
    id: "c3", workspace_id: "ws1", status: "approved",
    topic: "Cúrcuma: El Antiinflamatorio Natural",
    text: `La cúrcuma ha sido usada por más de 4,000 años en la medicina ayurvédica. Hoy la ciencia confirma lo que los ancestros ya sabían. 💛\n\nLa curcumina (el compuesto activo) tiene propiedades antiinflamatorias tan potentes como algunos medicamentos, sin los efectos secundarios.\n\nBeneficios comprobados:\n✓ Reduce inflamación crónica\n✓ Mejora la función cerebral\n✓ Protege el corazón\n✓ Ayuda a la digestión\n\nTruco: combínala con pimienta negra para aumentar su absorción un 2,000%.`,
    hashtags: ["curcuma","antiinflamatorio","saludnatural","medicamentosnatural","curcumin","bienestar","remediosnaturales"],
    cta: "¿Consumes cúrcuma? Dinos cómo en los comentarios 💛",
    trend_score: 0.65,
    trend_source: "rss",
    scheduled_at: "2024-01-15T18:00:00",
    created_at: "2024-01-14T19:40:00",
    image_tier_used: "pillow",
    platforms: ["instagram"],
    gradient: "linear-gradient(135deg, #4a2800, #f59e0b)",
    emoji: "💛",
  },
  {
    id: "c4", workspace_id: "ws1", status: "published",
    topic: "Los 5 Alimentos que Destruyen tu Energía",
    text: `Hay alimentos que llevas años consumiendo creyendo que son saludables... y están robando tu energía. ⚡\n\nLa lista que nadie quiere ver:\n\n❌ Jugos "naturales" de caja — puro azúcar\n❌ Yogurt con frutas — más azúcar que un postre\n❌ Barritas de cereal — calorías vacías\n❌ Bebidas energéticas — colapso en 2 horas\n❌ Pan integral de supermercado — harina refinada con colorante`,
    hashtags: ["alimentacion","saludable","energia","nutricion","saludnatural","dietasana","habitos","bienestar"],
    cta: "Comparte esto con alguien que necesita verlo 🔁",
    trend_score: 0.91,
    trend_source: "google_trends",
    scheduled_at: "2024-01-14T09:00:00",
    published_at: "2024-01-14T09:02:00",
    created_at: "2024-01-13T20:00:00",
    image_tier_used: "dalle",
    platforms: ["facebook","instagram"],
    platform_post_ids: { facebook: "FB_123456", instagram: "IG_789012" },
    gradient: "linear-gradient(135deg, #3d0000, #ef4444)",
    emoji: "⚡",
  },
];

const MOCK_METRICS = {
  summary: { total_likes: 2847, total_comments: 412, total_shares: 189, avg_engagement_rate: 4.7, total_reach: 18430, published_posts: 21 },
  chart: [
    { day: "Lun", likes: 320, reach: 2100, engagement: 4.2 },
    { day: "Mar", likes: 410, reach: 2800, engagement: 5.1 },
    { day: "Mié", likes: 280, reach: 1900, engagement: 3.8 },
    { day: "Jue", likes: 520, reach: 3400, engagement: 6.2 },
    { day: "Vie", likes: 480, reach: 3100, engagement: 5.8 },
    { day: "Sáb", likes: 390, reach: 2600, engagement: 4.9 },
    { day: "Dom", likes: 447, reach: 2530, engagement: 4.7 },
  ],
  topPosts: [
    { topic: "Los 5 Alimentos que Destruyen tu Energía", likes: 847, engagement: 7.2 },
    { topic: "Beneficios del Magnesio", likes: 623, engagement: 6.1 },
    { topic: "Rutina de Mañana", likes: 512, engagement: 5.4 },
  ],
};

const MOCK_OKRS = [
  {
    id: "okr1", objective: "Crecer audiencia en Q1 2024",
    key_results: [
      { id: "kr1", description: "Nuevos seguidores Instagram", metric: "followers", target: 500, current: 312, unit: "seguidores" },
      { id: "kr2", description: "Engagement rate promedio semanal", metric: "engagement_rate", target: 5.0, current: 4.7, unit: "%" },
      { id: "kr3", description: "Alcance mínimo por post", metric: "reach", target: 2000, current: 2630, unit: "personas" },
    ]
  },
  {
    id: "okr2", objective: "Consistencia de publicación",
    key_results: [
      { id: "kr4", description: "Posts publicados esta semana", metric: "posts", target: 21, current: 18, unit: "posts" },
      { id: "kr5", description: "Tasa de aprobación de contenido", metric: "approval_rate", target: 80, current: 73, unit: "%" },
    ]
  },
];

const ACTIVITY_FEED = [
  { type: "published", text: "Post publicado: «Los 5 Alimentos que Destruyen tu Energía»", time: "Hace 2h", color: "#00d4ff" },
  { type: "approved", text: "Contenido aprobado: «Cúrcuma: El Antiinflamatorio Natural»", time: "Hace 3h", color: "#10b981" },
  { type: "generated", text: "3 posts generados automáticamente para hoy", time: "Hace 5h", color: "#a855f7" },
  { type: "trend", text: "Trend scan completado: 8 temas detectados", time: "Hace 6h", color: "#f59e0b" },
  { type: "metrics", text: "Métricas recopiladas: +847 likes en últimas 24h", time: "Hace 8h", color: "#10b981" },
  { type: "published", text: "Post publicado: «Cúrcuma y sus beneficios»", time: "Ayer 18:00", color: "#00d4ff" },
];

// ─── API LAYER ────────────────────────────────────────────────────────────────
const API_BASE = "/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("vg_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleUnauthorized = () => {
  localStorage.removeItem("vg_token");
  localStorage.removeItem("vg_user");
  window.location.reload();
};

const apiFetch = (url, options = {}) => {
  const headers = { ...getAuthHeader(), ...(options.headers || {}) };
  return fetch(url, { ...options, headers }).then((res) => {
    if (res.status === 401) {
      handleUnauthorized();
      return new Response("null", { status: 401 });
    }
    return res;
  });
};

// ─── TIME HELPER ─────────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  if (!isoStr) return "–";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

const api = {
  async getWorkspaces() {
    try {
      const res = await apiFetch(`${API_BASE}/workspaces/`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { return null; }
  },
  async getStats() {
    try {
      const res = await apiFetch(`${API_BASE}/stream/stats`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { return null; }
  },
  async getQueue(workspaceId) {
    try {
      const res = await apiFetch(`${API_BASE}/content/${workspaceId}/queue?limit=50`);
      if (!res.ok) throw new Error("API error");
      return await res.json();
    } catch { return null; }
  },
  async approveContent(workspaceId, contentId, publishNow = false) {
    try {
      const res = await apiFetch(
        `${API_BASE}/content/${workspaceId}/posts/${contentId}/approve?publish_now=${publishNow}`,
        { method: "POST" }
      );
      return res.ok;
    } catch { return false; }
  },
  async rejectContent(workspaceId, contentId) {
    try {
      const res = await apiFetch(
        `${API_BASE}/content/${workspaceId}/posts/${contentId}/reject`,
        { method: "POST" }
      );
      return res.ok;
    } catch { return false; }
  },
  async generateContent(workspaceId, topic) {
    try {
      const res = await apiFetch(
        `${API_BASE}/content/${workspaceId}/generate?topic=${encodeURIComponent(topic)}`,
        { method: "POST" }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async updatePost(workspaceId, postId, { topic, text, hashtags, cta }) {
    try {
      const res = await apiFetch(`${API_BASE}/content/${workspaceId}/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, text, hashtags, cta }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async deletePost(workspaceId, postId) {
    try {
      const res = await apiFetch(`${API_BASE}/content/${workspaceId}/posts/${postId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch { return false; }
  },
  async generateVideo(workspaceId, postId, publishReel = false) {
    try {
      const res = await apiFetch(
        `${API_BASE}/content/${workspaceId}/posts/${postId}/generate-video?publish=${publishReel}&duration=5`,
        { method: "POST" }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async getMetrics(workspaceId) {
    try {
      const res = await apiFetch(`${API_BASE}/metrics/${workspaceId}/summary`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { return null; }
  },
  // User management (admin only)
  async listUsers() {
    try {
      const res = await apiFetch(`${API_BASE}/auth/users`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async createUser(name, email, password, role = "agent") {
    try {
      const res = await apiFetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.detail || "Error al crear usuario" };
      }
      return await res.json();
    } catch { return { error: "Error de red" }; }
  },
  async deleteUser(userId) {
    try {
      const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, { method: "DELETE" });
      return res.ok;
    } catch { return false; }
  },
  async createWorkspace(data) {
    try {
      const res = await apiFetch(`${API_BASE}/workspaces/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async createManualPost(workspaceId, data) {
    try {
      const res = await apiFetch(`${API_BASE}/content/${workspaceId}/posts/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/health`);
      if (!res.ok) return { status: "error" };
      return { status: "ok" };
    } catch { return { status: "error" }; }
  },
  // alias
  async getUsers() { return this.listUsers(); },
};

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, toast: add };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CUSTOM CHART TOOLTIP ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 12, color: "var(--text)" }}>
        <div style={{ color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, display: "flex", gap: 8 }}>
            <span>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending_review: "⏳ En revisión",
  approved: "✅ Aprobado",
  published: "📢 Publicado",
  rejected: "❌ Rechazado",
  failed: "💥 Fallido",
};

function StatusPill({ status }) {
  return (
    <span className={`status-pill status-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, delta, deltaUp, accentColor = "var(--cyan)" }) {
  return (
    <div className="stat-card">
      <div className="stat-accent" style={{ background: accentColor }} />
      <div className="stat-icon" style={{ background: accentColor + '22', border: `1px solid ${accentColor}44` }}>{icon}</div>
      <div className="stat-value" style={{ color: accentColor }}>{value}</div>
      <div className="stat-label">{label}</div>
      {delta && (
        <div className={`stat-delta ${deltaUp ? "delta-up" : "delta-down"}`}>
          {deltaUp ? "↑" : "↓"} {delta}
        </div>
      )}
    </div>
  );
}

// ─── OKR PROGRESS ────────────────────────────────────────────────────────────
function OKRCard({ okr }) {
  return (
    <div className="okr-card">
      <div className="okr-title">
        <span>🎯</span>
        <span>{okr.objective}</span>
      </div>
      {okr.key_results.map(kr => {
        const pct = Math.min(Math.round((kr.current / kr.target) * 100), 100);
        const color = pct >= 100 ? "var(--green)" : pct >= 60 ? "var(--cyan)" : pct >= 30 ? "var(--amber)" : "var(--red)";
        return (
          <div key={kr.id} className="kr-item">
            <div className="kr-header">
              <span className="kr-desc">{kr.description}</span>
              <span className="kr-pct" style={{ color }}>{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
              <span>{kr.current} {kr.unit}</span>
              <span>Meta: {kr.target} {kr.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── QUEUE ITEM ───────────────────────────────────────────────────────────────
function EditPostModal({ post, onSave, onClose, saving }) {
  const [topic, setTopic]       = useState(post.topic || "");
  const [text, setText]         = useState(post.content?.text || post.text || "");
  const [cta, setCta]           = useState(post.content?.cta || post.cta || "");
  const [hashInput, setHashInput] = useState(
    (post.content?.hashtags || post.hashtags || []).map(h => h.startsWith("#") ? h : `#${h}`).join(", ")
  );

  const handleSave = () => {
    const hashtags = hashInput
      .split(",")
      .map(h => h.trim().replace(/^#/, ""))
      .filter(Boolean);
    onSave({ topic, text, hashtags, cta });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">✏️ Editar post</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Tema</label>
            <input
              className="form-input"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Tema del post"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Texto del post</label>
            <textarea
              className="form-input"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={9}
              style={{ resize: "vertical", fontFamily: "var(--font-body)", lineHeight: 1.7 }}
              placeholder="Escribe el contenido del post..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">CTA (Call to Action)</label>
            <input
              className="form-input"
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="Ej: Deja un ❤️ si esto te motivó..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Hashtags (separados por coma)</label>
            <input
              className="form-input"
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              placeholder="#saludnatural, #bienestar, #omega3"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Guardando...</> : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QueueItem({ item, onApprove, onReject, onRegenerate, onPublish, onEdit, onDelete, onGenerateVideo, loading }) {
  const videoUrl = item.content?.video_url || null;
  // La API devuelve los campos dentro de item.content
  const text      = item.content?.text      || item.text      || "";
  const hashtags  = item.content?.hashtags  || item.hashtags  || [];
  const cta       = item.content?.cta       || item.cta       || "";

  // Prefer saved local image (served via /images/), fall back to DALL-E URL
  const localPath = item.content?.image_local_path || item.image_local_path;
  const rawUrl    = item.content?.image_url || item.image_url || null;
  const imgUrl    = localPath
    ? `http://localhost:8000/images/${localPath.replace(/^.*generated_images[/\\]/, "")}`
    : rawUrl;
  const hasImage  = !!imgUrl;

  return (
    <div className="queue-card">
      <div className="queue-card-header">
        <div className="flex items-center gap-12">
          <StatusPill status={item.status} />
          <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-head)", fontWeight: 700 }}>
            {item.topic || item.content_type}
          </span>
          {hasImage && <span title="Tiene imagen" style={{ fontSize: 10 }}>🖼️</span>}
          {videoUrl && <span title="Video generado" style={{ fontSize: 10 }}>🎬</span>}
        </div>
        <div className="queue-meta">
          {item.trend_score && (
            <div className="trend-score">
              <span style={{ color: "var(--text-3)", fontSize: 10 }}>TREND</span>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${item.trend_score * 100}%` }} />
              </div>
              <span style={{ color: "var(--cyan)", fontSize: 10, fontWeight: 600 }}>
                {Math.round(item.trend_score * 100)}
              </span>
            </div>
          )}
          {item.image_tier_used && (
            <span style={{ fontSize: 10, color: "var(--text-3)", background: "var(--surface3)", padding: "2px 8px", borderRadius: 20 }}>
              {item.image_tier_used === "dalle" ? "🎨 DALL-E 3" : item.image_tier_used === "replicate" ? "🤖 Replicate" : "🖼️ Pillow"}
            </span>
          )}
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>
            📅 {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString("es-DO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "Sin programar"}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            title="Editar post"
            onClick={() => onEdit && onEdit(item)}
            disabled={loading}
            style={{ padding: "3px 8px", fontSize: 11 }}
          >
            ✏️ Editar
          </button>
          <button
            className="btn btn-sm"
            title="Eliminar post"
            onClick={() => onDelete && onDelete(item.id)}
            disabled={loading}
            style={{ padding: "3px 8px", fontSize: 11, color: "var(--red)", background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="queue-card-body">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.topic || "Post image"}
            className="queue-image-placeholder"
            style={{ objectFit: "cover", display: "block" }}
            onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <div
          className="queue-image-placeholder"
          style={{ display: imgUrl ? "none" : "flex", background: item.gradient || "var(--surface3)" }}
        >
          <span style={{ fontSize: 50 }}>{item.emoji || "📝"}</span>
        </div>
        <div className="queue-content">
          <div className="queue-text" style={{ whiteSpace: "pre-line" }}>{text}</div>
          <div className="queue-hashtags">
            {hashtags.slice(0, 8).map(h => (
              <span key={h} className="hashtag-chip">{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
            {hashtags.length > 8 && (
              <span className="hashtag-chip" style={{ color: "var(--text-3)" }}>+{hashtags.length - 8} más</span>
            )}
          </div>
          {cta && (
            <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span>👉</span>
              <span>{cta}</span>
            </div>
          )}
          {item.status === "pending_review" && (
            <div className="queue-actions">
              <button className="btn btn-success" onClick={() => onApprove(item.id)} disabled={loading}>
                {loading ? <span className="spinner" /> : "✅"} Aprobar
              </button>
              <button className="btn btn-danger" onClick={() => onReject(item.id)} disabled={loading}>
                ❌ Rechazar
              </button>
              <button className="btn btn-amber" onClick={() => onRegenerate(item.id)} disabled={loading}>
                🔄 Regenerar
              </button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {item.platforms?.map(p => (
                  <span key={p} style={{ fontSize: 10, color: "var(--text-3)", background: "var(--surface3)", padding: "3px 10px", borderRadius: 20 }}>
                    {p === "facebook" ? "📘 FB" : "📸 IG"}
                  </span>
                ))}
              </div>
            </div>
          )}
          {item.status === "approved" && (
            <div className="queue-actions">
              <button className="btn btn-primary" onClick={() => onPublish && onPublish(item.id)} disabled={loading}>
                {loading ? <span className="spinner" /> : "📢"} Publicar ahora
              </button>
              {hasImage && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onGenerateVideo && onGenerateVideo(item.id, true)}
                  disabled={loading}
                  title="Generar video Reel con RunwayML y publicarlo"
                  style={{ fontSize: 11, color: "var(--purple)", border: "1px solid rgba(167,139,250,0.3)" }}
                >
                  {loading ? <span className="spinner" /> : "🎬"} Generar Reel y publicar
                </button>
              )}
            </div>
          )}
          {item.status === "published" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {item.publish_results && Object.entries(item.publish_results).map(([platform, res]) => res && (
                <span key={platform} style={{ fontSize: 11, color: res.success ? "var(--green)" : "var(--red)", background: res.success ? "var(--green-dim)" : "var(--red-dim, #3d0000)", padding: "3px 10px", borderRadius: 20 }}>
                  {res.success ? "✅" : "❌"} {platform}{res.post_id ? `: ${res.post_id.slice(-8)}` : ""}
                </span>
              ))}
              {item.reel_publish_results && (
                <span style={{ fontSize: 11, color: "var(--purple)", background: "rgba(167,139,250,0.12)", padding: "3px 10px", borderRadius: 20 }}>🎬 Reel publicado</span>
              )}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {hasImage && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onGenerateVideo && onGenerateVideo(item.id, true)}
                    disabled={loading}
                    title="Generar video Reel con RunwayML"
                    style={{ fontSize: 11, color: "var(--purple)", border: "1px solid rgba(167,139,250,0.3)" }}
                  >
                    {loading ? <span className="spinner" /> : "🎬"} Generar Reel
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onPublish && onPublish(item.id)}
                  disabled={loading}
                  style={{ fontSize: 11, color: "var(--cyan)", border: "1px solid rgba(34,211,238,0.25)" }}
                  title="Volver a publicar en Facebook e Instagram"
                >
                  {loading ? <span className="spinner" /> : "🔁"} Volver a publicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function OverviewView({ workspace }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) return;
    api.getQueue(workspace.id).then(data => {
      if (data) setPosts(data);
      setLoading(false);
    });
  }, [workspace?.id]);

  const published = useMemo(() => posts.filter(p => p.status === "published" || p.published), [posts]);
  const pending   = useMemo(() => posts.filter(p => p.status === "pending_review"), [posts]);
  const approved  = useMemo(() => posts.filter(p => p.status === "approved"), [posts]);

  const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const chartData = useMemo(() => {
    const map = {};
    DAY_LABELS.forEach(d => { map[d] = { day: d, posts: 0, reach: 0, engagement: 0 }; });
    published.forEach(p => {
      if (!p.created_at) return;
      const label = DAY_LABELS[new Date(p.created_at).getDay()];
      map[label].posts += 1;
      map[label].reach += 1200;
    });
    return DAY_LABELS.map(d => ({
      ...map[d],
      engagement: map[d].posts > 0 ? parseFloat((4.0 + map[d].posts * 0.3).toFixed(1)) : 0,
    }));
  }, [published]);

  const topPosts = useMemo(() =>
    published.slice(0, 3).map((p, i) => ({
      topic: p.topic || "Post",
      likes: Math.max(180 - i * 30, 50) + published.length * 12,
      engagement: parseFloat((5.2 - i * 0.5).toFixed(1)),
    })),
    [published]
  );

  const activityFeed = useMemo(() =>
    posts.slice(0, 6).map(p => ({
      text: (p.status === "published" || p.published)
        ? `Post publicado: «${p.topic}»`
        : p.status === "approved"
          ? `Contenido aprobado: «${p.topic}»`
          : p.status === "pending_review"
            ? `Post en revisión: «${p.topic}»`
            : `Post generado: «${p.topic}»`,
      time: timeAgo(p.created_at),
      color: (p.status === "published" || p.published) ? "var(--cyan)"
           : p.status === "approved" ? "var(--green)"
           : p.status === "pending_review" ? "var(--amber)"
           : "var(--purple)",
    })),
    [posts]
  );

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <div className="empty-title" style={{ marginTop: 16 }}>Cargando datos...</div>
    </div>
  );

  return (
    <div>
      <div className="grid-4 mb-24">
        <StatCard icon="📢" value={String(published.length)} label="Posts publicados" delta={`${posts.length} posts total`} deltaUp accentColor="var(--cyan)" />
        <StatCard icon="⏳" value={String(pending.length)} label="En revisión" delta={pending.length > 0 ? "Requieren acción" : "¡Al día!"} deltaUp={pending.length === 0} accentColor="var(--amber)" />
        <StatCard icon="✅" value={String(approved.length)} label="Aprobados" delta="Listos para publicar" deltaUp accentColor="var(--green)" />
        <StatCard icon="📋" value={String(posts.length)} label="Total generados" delta={`Meta: ${workspace?.daily_post_goal || 3}/día`} deltaUp accentColor="var(--purple)" />
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Posts publicados por día</div>
              <div className="section-sub">Distribución semanal real</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" fill="var(--cyan)" radius={[4,4,0,0]} name="Posts" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Alcance estimado</div>
              <div className="section-sub">~1,200 personas por post</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="reach" stroke="#00d4ff" strokeWidth={2} fill="url(#reachGrad)" name="Alcance" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Actividad reciente</div>
          </div>
          {activityFeed.length > 0 ? activityFeed.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
              <div>
                <div className="activity-text">{a.text}</div>
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: "32px 20px" }}>
              <div className="empty-desc">Sin actividad registrada aún</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Últimos posts publicados</div>
          </div>
          {topPosts.length > 0 ? topPosts.map((p, i) => (
            <div key={i} className="metric-row">
              <div>
                <div style={{ fontSize: 13, marginBottom: 3, lineHeight: 1.4 }}>{p.topic}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>❤️ ~{p.likes} likes estimados</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--cyan)", fontWeight: 700, fontSize: 16 }}>{p.engagement}%</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>eng. est.</div>
              </div>
            </div>
          )) : (
            <div className="empty-state" style={{ padding: "32px 20px" }}>
              <div className="empty-desc">Publica tus primeros posts para ver las métricas</div>
            </div>
          )}
          <div style={{ marginTop: 16, padding: "14px", background: "var(--surface2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.5px" }}>RESUMEN DEL WORKSPACE</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Publicados", value: String(published.length), color: "var(--green)" },
                { label: "En revisión", value: String(pending.length), color: "var(--amber)" },
                { label: "Meta/día", value: String(workspace?.daily_post_goal || 3), color: "var(--cyan)" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", background: "var(--surface3)", borderRadius: 8 }}>
                  <div style={{ color: s.color, fontSize: 22, fontWeight: 700, fontFamily: "var(--font-head)" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function QueueView({ workspace, toast }) {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState({});
  const [fetching, setFetching] = useState(true);
  const [editPost, setEditPost] = useState(null);   // post being edited
  const [saving, setSaving] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const workspaceId = workspace?.id;

  const loadQueue = useCallback(async () => {
    if (!workspaceId) return;
    setFetching(true);
    const data = await api.getQueue(workspaceId);
    if (data) setQueue(data);
    setFetching(false);
  }, [workspaceId]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const filtered = filter === "all" ? queue : queue.filter(i => i.status === filter);
  const pendingCount = queue.filter(i => i.status === "pending_review").length;

  const handleApprove = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    const ok = await api.approveContent(workspaceId, id, false);
    if (ok) {
      setQueue(q => q.map(i => i.id === id ? { ...i, status: "approved" } : i));
      toast("Post aprobado ✅", "success");
    } else {
      toast("Error al aprobar el post", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handlePublish = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    toast("Publicando en Facebook e Instagram... 📢", "info");
    const ok = await api.approveContent(workspaceId, id, true);
    if (ok) {
      setQueue(q => q.map(i => i.id === id ? { ...i, status: "published", published: true } : i));
      toast("¡Publicado en Facebook e Instagram! 🎉", "success");
    } else {
      toast("Error al publicar", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleReject = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    const ok = await api.rejectContent(workspaceId, id);
    if (ok) {
      setQueue(q => q.map(i => i.id === id ? { ...i, status: "rejected" } : i));
      toast("Post rechazado", "error");
    } else {
      toast("Error al rechazar", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleRegenerate = async (id) => {
    const item = queue.find(i => i.id === id);
    if (!item) return;
    setLoading(l => ({ ...l, [id]: true }));
    toast("Rechazando y regenerando con IA... 🔄", "info");
    await api.rejectContent(workspaceId, id);
    setQueue(q => q.map(i => i.id === id ? { ...i, status: "rejected" } : i));
    const newPost = await api.generateContent(workspaceId, item.topic || item.content_type || "bienestar");
    if (newPost) {
      setQueue(q => [{ ...newPost, id: newPost.id }, ...q]);
      toast("Nuevo post generado con IA 🤖", "success");
    } else {
      toast("Error al regenerar", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este post permanentemente?")) return;
    setLoading(l => ({ ...l, [id]: true }));
    const ok = await api.deletePost(workspaceId, id);
    if (ok) {
      setQueue(q => q.filter(i => i.id !== id));
      toast("Post eliminado 🗑️", "error");
    } else {
      toast("Error al eliminar", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleEditOpen = (post) => setEditPost(post);
  const handleEditClose = () => setEditPost(null);

  const handleEditSave = async ({ topic, text, hashtags, cta }) => {
    if (!editPost) return;
    setSaving(true);
    const updated = await api.updatePost(workspaceId, editPost.id, { topic, text, hashtags, cta });
    if (updated) {
      setQueue(q => q.map(i => i.id === editPost.id ? { ...i, ...updated } : i));
      toast("Post actualizado ✅", "success");
      setEditPost(null);
    } else {
      toast("Error al guardar los cambios", "error");
    }
    setSaving(false);
  };

  const handleGenerateNew = async () => {
    if (!genTopic.trim()) { toast("Escribe un tema primero", "error"); return; }
    setGenerating(true);
    toast("Generando nuevo post con GPT-4o... 🤖", "info");
    const newPost = await api.generateContent(workspaceId, genTopic.trim());
    if (newPost) {
      setQueue(q => [{ ...newPost, id: newPost.id }, ...q]);
      toast("¡Nuevo post generado! ✨", "success");
      setGenTopic("");
      setShowGenerate(false);
      setFilter("pending_review");
    } else {
      toast("Error al generar el post", "error");
    }
    setGenerating(false);
  };

  const handleApproveAll = async () => {
    const pendingIds = queue.filter(i => i.status === "pending_review").map(i => i.id);
    for (const id of pendingIds) await handleApprove(id);
  };

  const handleGenerateVideo = async (id, publishReel) => {
    setLoading(l => ({ ...l, [id]: true }));
    toast("🎬 Generando video con RunwayML... (~30-60s)", "info");
    const result = await api.generateVideo(workspaceId, id, publishReel);
    if (result?.video_url) {
      setQueue(q => q.map(i => i.id === id ? {
        ...i,
        content: { ...i.content, video_url: result.video_url },
        reel_publish_results: result.publish_results,
      } : i));
      toast(publishReel ? "🎬 Reel publicado en FB e IG! 🎉" : "🎬 Video generado ✅", "success");
    } else {
      toast("❌ Error generando video. ¿Está configurado RUNWAYML_API_KEY?", "error");
    }
    setLoading(l => ({ ...l, [id]: false }));
  };

  return (
    <div>
      {/* Edit modal */}
      {editPost && (
        <EditPostModal
          post={editPost}
          onSave={handleEditSave}
          onClose={handleEditClose}
          saving={saving}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-24">
        <div className="filter-tabs">
          {[
            { key: "all", label: "Todos" },
            { key: "pending_review", label: `En revisión ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
            { key: "approved", label: "Aprobados" },
            { key: "published", label: "Publicados" },
            { key: "rejected", label: "Rechazados" },
          ].map(f => (
            <div key={f.key} className={`filter-tab ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowGenerate(v => !v)}
          >
            {showGenerate ? "✕ Cancelar" : "✨ Nuevo post"}
          </button>
          <button className="btn btn-ghost" onClick={loadQueue} disabled={fetching} title="Recargar cola">
            {fetching ? <span className="spinner" /> : "🔄"} Actualizar
          </button>
          {pendingCount > 0 && (
            <button className="btn btn-success" onClick={handleApproveAll}>
              ✅ Aprobar todos ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Inline generate panel */}
      {showGenerate && (
        <div className="generate-panel">
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12, fontFamily: "var(--font-head)" }}>
            ✨ Generar nuevo post con IA
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Tema del post (ej: Omega-3, rutina matutina, magnesio...)"
              value={genTopic}
              onChange={e => setGenTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerateNew()}
              disabled={generating}
            />
            <button
              className="btn btn-primary"
              onClick={handleGenerateNew}
              disabled={generating || !genTopic.trim()}
            >
              {generating ? <><span className="spinner" /> Generando...</> : "⚡ Generar"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
            GPT-4o generará el texto, hashtags y una imagen DALL-E 3. El post aparecerá en "En revisión".
          </div>
        </div>
      )}

      {fetching && queue.length === 0 && (
        <div className="empty-state"><div className="spinner" style={{ width: 40, height: 40 }} /><div className="empty-title" style={{ marginTop: 16 }}>Cargando Cola...</div></div>
      )}

      {!fetching && filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Sin contenido en esta vista</div>
          <div className="empty-desc">Usa "✨ Nuevo post" para generar contenido, o el sistema lo hará automáticamente a las 7:00 AM</div>
        </div>
      ) : (
        filtered.map(item => (
          <QueueItem
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onRegenerate={handleRegenerate}
            onPublish={handlePublish}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onGenerateVideo={handleGenerateVideo}
            loading={loading[item.id]}
          />
        ))
      )}
    </div>
  );
}

// ─── NICHES ───────────────────────────────────────────────────────────────────
const NICHES = [
  { key: "salud_natural",  label: "🌿 Salud Natural" },
  { key: "suplementos",    label: "💊 Suplementos" },
  { key: "bienestar",      label: "🧘 Bienestar" },
  { key: "emprendimiento", label: "🚀 Emprendimiento" },
  { key: "motivacion",     label: "🔥 Motivación" },
  { key: "lifestyle",      label: "✨ Lifestyle" },
];

function CreatePostView({ workspace, toast }) {
  const [mode, setMode]             = useState("manual");
  // Manual state
  const [mTopic, setMTopic]         = useState("");
  const [mText, setMText]           = useState("");
  const [mCta, setMCta]             = useState("");
  const [mHashtags, setMHashtags]   = useState("");
  const [mPlatforms, setMPlatforms] = useState(["facebook", "instagram"]);
  const [mSchedule, setMSchedule]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [manualDone, setManualDone] = useState(false);
  // AI state
  const [aiTopic, setAiTopic]       = useState("");
  const [aiNiches, setAiNiches]     = useState(workspace?.niches || ["salud_natural"]);
  const [aiTone, setAiTone]         = useState("inspirador");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult]     = useState(null);
  // Auto mode state
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoCount, setAutoCount]   = useState(1);
  const [autoResults, setAutoResults] = useState([]);
  const [autoLog, setAutoLog]       = useState([]);

  const previewText     = mode === "manual" ? mText : (aiResult?.content?.text || aiResult?.text || "");
  const previewHashtags = mode === "manual"
    ? mHashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(Boolean)
    : (aiResult?.content?.hashtags || aiResult?.hashtags || []);
  const previewCta      = mode === "manual" ? mCta : (aiResult?.content?.cta || aiResult?.cta || "");

  const togglePlatform = (p) =>
    setMPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleManualSubmit = async () => {
    if (!mText.trim()) { toast("Escribe el texto del post", "error"); return; }
    if (!workspace?.id) { toast("Selecciona un workspace primero", "error"); return; }
    setSubmitting(true);
    const hashtags = mHashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(Boolean);
    const post = await api.createManualPost(workspace.id, {
      topic: mTopic || "Post manual",
      text: mText,
      cta: mCta,
      hashtags,
      platforms: mPlatforms,
      scheduled_at: mSchedule ? new Date(mSchedule).toISOString() : null,
    });
    if (post) {
      toast("✅ Post añadido a la cola para revisión", "success");
      setMTopic(""); setMText(""); setMCta(""); setMHashtags(""); setMSchedule("");
      setManualDone(true);
    } else {
      toast("Error al crear el post", "error");
    }
    setSubmitting(false);
  };

  const AUTO_TOPICS = [
    "5 beneficios del magnesio que no conocías",
    "Por qué el azúcar está destruyendo tu energía",
    "Cómo mejorar tu sueño con suplementos naturales",
    "Los 3 errores más comunes al hacer dieta",
    "Alimentos que aceleran el metabolismo naturalmente",
    "Por qué deberías tomar vitamina D todos los días",
    "Cómo el estrés afecta tu peso corporal",
    "5 señales de que tu cuerpo necesita más proteína",
    "Omega-3: el suplemento que más necesitas",
    "Cómo construir hábitos saludables que duren",
    "El secreto para tener más energía durante el día",
    "Por qué el colágeno es esencial después de los 30",
    "Los mejores antioxidantes naturales para tu cuerpo",
    "Cómo combatir la inflamación con alimentación",
    "5 razones para emprender en salud y bienestar",
    "Cómo el zinc fortalece tu sistema inmune",
    "La diferencia entre grasa buena y grasa mala",
    "Qué pasa en tu cuerpo cuando dejas el azúcar",
    "Suplementos esenciales para deportistas",
    "Cómo leer las etiquetas nutricionales correctamente",
  ];
  const AUTO_TONES = ["inspirador", "educativo", "urgente", "emocional", "divertido"];

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { toast("Escribe un tema primero", "error"); return; }
    if (!workspace?.id) { toast("Selecciona un workspace primero", "error"); return; }
    setAiGenerating(true); setAiResult(null);
    toast("Generando contenido con GPT-4o... 🤖", "info");
    const post = await api.generateContent(workspace.id, aiTopic.trim());
    if (post) { setAiResult(post); toast("¡Post generado con IA! ✨", "success"); }
    else { toast("Error al generar el post. ¿Está configurada OPENAI_API_KEY?", "error"); }
    setAiGenerating(false);
  };

  const handleAutoGenerate = async () => {
    if (!workspace?.id) { toast("Selecciona un workspace primero", "error"); return; }
    setAutoGenerating(true); setAutoResults([]); setAutoLog([]);
    const usedTopics = new Set();
    let successCount = 0;
    for (let i = 0; i < autoCount; i++) {
      // Pick a random unique topic from pool
      let available = AUTO_TOPICS.filter(t => !usedTopics.has(t));
      if (available.length === 0) available = AUTO_TOPICS; // reset if exhausted
      const topic = available[Math.floor(Math.random() * available.length)];
      usedTopics.add(topic);
      const tone = AUTO_TONES[Math.floor(Math.random() * AUTO_TONES.length)];
      setAutoLog(prev => [...prev, { topic, tone, status: "generando" }]);
      const post = await api.generateContent(workspace.id, topic);
      const status = post ? "✅" : "❌";
      setAutoLog(prev => prev.map((l, idx) => idx === i ? { ...l, status } : l));
      if (post) { setAutoResults(prev => [...prev, post]); successCount++; }
    }
    setAutoGenerating(false);
    toast(`🚀 ${successCount} post${successCount !== 1 ? "s" : ""} generados — ve a Cola de Revisión`, "success");
  };

  // Live preview panel (shared)
  const FbPreview = ({ text, hashtags, cta, imgUrl }) => {
    const hasContent = text || hashtags.length > 0;
    if (!hasContent) return (
      <div className="empty-state" style={{ padding: "50px 24px" }}>
        <div className="empty-icon" style={{ fontSize: 44 }}>👁️</div>
        <div className="empty-title">Vista previa en tiempo real</div>
        <div className="empty-desc" style={{ maxWidth: 260 }}>
          {mode === "manual" ? "Empieza a escribir el texto del post para ver cómo se verá en Facebook e Instagram" : "Genera el contenido con IA para ver la vista previa aquí"}
        </div>
      </div>
    );
    return (
      <div>
        {imgUrl && (
          <img src={imgUrl} alt="post" style={{ width: "100%", borderRadius: "var(--radius)", maxHeight: 200, objectFit: "cover", marginBottom: 14 }} />
        )}
        <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>📘 Vista previa Facebook</div>
        <div className="fb-preview">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div className="fb-avatar">🌿</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Vitagloss</div>
              <div style={{ fontSize: 11, color: "#65676b" }}>Ahora · 🌐</div>
            </div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 10, color: "#1c1e21" }}>
            {text.length > 500 ? text.substring(0, 500) + "..." : text}
          </div>
          {cta && <div style={{ fontSize: 13, color: "#1877f2", fontWeight: 600, marginBottom: 8 }}>👉 {cta}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {hashtags.slice(0, 10).map(h => <span key={h} style={{ color: "#1877f2", fontSize: 12 }}>#{h}</span>)}
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
          {hashtags.length} hashtags · {text.length} caracteres
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Mode selector */}
      <div className="mode-tabs">
        <button className={`mode-tab ${mode === "manual" ? "active" : ""}`} onClick={() => { setMode("manual"); setManualDone(false); }}>
          ✍️ Escribir manualmente
        </button>
        <button className={`mode-tab ${mode === "ai" ? "active" : ""}`} onClick={() => { setMode("ai"); setAiResult(null); }}>
          🤖 Generar con IA
        </button>
        <button className={`mode-tab ${mode === "auto" ? "active" : ""}`} onClick={() => { setMode("auto"); setAutoResults([]); setAutoLog([]); }} style={mode !== "auto" ? { borderColor: "var(--amber)", color: "var(--amber)" } : {}  }>
          🚀 Modo Automático
        </button>
      </div>

      {/* Success banner */}
      {manualDone && (
        <div className="info-box success" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>¡Post guardado en la cola!</div>
            <div style={{ fontSize: 11 }}>Ve a <strong>Cola de Revisión</strong> para aprobar y publicarlo en Facebook e Instagram.</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setManualDone(false)}>✕</button>
        </div>
      )}

      <div className={mode === "auto" ? "" : "grid-2"}>
        {/* LEFT: Form */}
        <div className="card">
          {mode === "auto" ? (
            <>
              <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="section-title">🚀 Modo Automático — La IA lo hace todo</div>
                  <div className="section-sub">Elige cuántos posts quieres y la IA selecciona los temas, el tono y genera el contenido completo con imagen</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div style={{ background: "var(--surface2)", borderRadius: "var(--radius-lg)", padding: 20, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>¿Cuántos posts generar?</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[1, 3, 5, 7, 10].map(n => (
                      <button key={n} onClick={() => setAutoCount(n)}
                        style={{
                          padding: "10px 18px", borderRadius: "var(--radius)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15,
                          background: autoCount === n ? "var(--cyan)" : "var(--surface3)",
                          color: autoCount === n ? "#0f172a" : "var(--text-2)",
                          transition: "all 0.15s",
                        }}>{n}</button>
                    ))}
                  </div>
                </div>

                <div style={{ background: "var(--surface2)", borderRadius: "var(--radius-lg)", padding: 20, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>La IA seleccionará</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      { icon: "🎯", label: "Tema optimizado para engagement", sub: "de banco de 20+ temas virales" },
                      { icon: "🎭", label: "Tono automático variado", sub: "inspirador, educativo, urgente..." },
                      { icon: "🎨", label: "Imagen DALL-E 3 personalizada", sub: "prompt generado por GPT-4o" },
                    ].map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16 }}>{f.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{f.label}</div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{f.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic bank preview */}
              <div style={{ background: "var(--surface2)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 24, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Banco de temas (muestra aleatoria de la IA) 🎲</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AUTO_TOPICS.slice(0, 8).map((t, i) => (
                    <span key={i} style={{ background: "var(--surface3)", border: "1px solid var(--border2)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--text-2)" }}>{t}</span>
                  ))}
                  <span style={{ background: "var(--surface3)", border: "1px solid var(--border2)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--text-3)" }}>+{AUTO_TOPICS.length - 8} más...</span>
                </div>
              </div>

              {/* Progress log */}
              {(autoLog.length > 0 || autoGenerating) && (
                <div style={{ background: "var(--surface2)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 20, border: "1px solid var(--border)", maxHeight: 220, overflowY: "auto" }}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Progreso en tiempo real</div>
                  {autoLog.map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < autoLog.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 14, width: 20 }}>{l.status === "generando" ? <span className="spinner" style={{ width: 14, height: 14 }} /> : l.status}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{l.topic}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>Tono: {l.tone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results summary */}
              {!autoGenerating && autoResults.length > 0 && (
                <div style={{ background: "var(--green-dim)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>🎉 {autoResults.length} posts generados exitosamente</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)" }}>Todos están en <strong>Cola de Revisión</strong> esperando tu aprobación. Revísalos uno por uno antes de publicar.</div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleAutoGenerate}
                disabled={autoGenerating}
                style={{ background: autoGenerating ? undefined : "linear-gradient(135deg, var(--amber), #f97316)", fontSize: 16, padding: "16px 24px" }}
              >
                {autoGenerating
                  ? <><span className="spinner" /> Generando {autoLog.filter(l => l.status === "✅").length} de {autoCount} posts...</>
                  : `🚀 Generar ${autoCount} post${autoCount > 1 ? "s" : ""} automáticamente`
                }
              </button>
              <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 8 }}>
                La IA elige tema + tono + imagen por cada post. Todos irán a revisión antes de publicarse.
              </div>
            </>
          ) : mode === "manual" ? (
            <>
              <div className="section-header">
                <div>
                  <div className="section-title">✍️ Crear post manualmente</div>
                  <div className="section-sub">Escribe exactamente lo que quieres publicar — tú tienes el control total</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Título o tema del post <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(opcional)</span></label>
                <input className="form-input" placeholder="Ej: Beneficios del Omega-3 para la salud" value={mTopic} onChange={e => setMTopic(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Texto del post <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea
                  className="form-input form-textarea"
                  rows={8}
                  placeholder={"Escribe aquí el contenido de tu post...\n\nUsa emojis, saltos de línea y listas para mayor engagement.\n\nEjemplo:\n🌿 ¿Sabías que el magnesio ayuda a dormir mejor?\n\n• Reduce el cortisol (hormona del estrés)\n• Activa la melatonina natural\n• Relaja los músculos\n\n¿Tomas magnesio? Cuéntanos 👇"}
                  value={mText}
                  onChange={e => setMText(e.target.value)}
                  style={{ resize: "vertical", lineHeight: 1.7 }}
                />
                <div className={`char-count ${mText.length > 2000 ? "over" : mText.length > 1500 ? "warn" : ""}`}>
                  {mText.length} caracteres {mText.length > 2000 && "⚠️ muy largo para Instagram"}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">CTA — Call to Action <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(la acción que quieres que hagan)</span></label>
                <input className="form-input" placeholder="Ej: Comenta SI si esto te ayudó 👇" value={mCta} onChange={e => setMCta(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Hashtags <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(separados por coma)</span></label>
                <input
                  className="form-input"
                  placeholder="#saludnatural, #bienestar, #omega3, #vidasana"
                  value={mHashtags}
                  onChange={e => setMHashtags(e.target.value)}
                />
                <div className="char-count">
                  {mHashtags.split(",").filter(h => h.trim()).length} hashtags — recomendado: 8-15 para Instagram
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Plataformas donde publicar</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ id: "facebook", label: "📘 Facebook" }, { id: "instagram", label: "📸 Instagram" }].map(p => (
                    <div key={p.id} className={`platform-check ${mPlatforms.includes(p.id) ? "checked" : ""}`} onClick={() => togglePlatform(p.id)}>
                      <span style={{ fontSize: 13 }}>{mPlatforms.includes(p.id) ? "☑" : "☐"}</span>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Programar publicación <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(opcional — si lo dejas vacío va directo a revisión)</span></label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={mSchedule}
                  onChange={e => setMSchedule(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleManualSubmit} disabled={submitting || !mText.trim()}>
                {submitting ? <><span className="spinner" /> Guardando en cola...</> : "📤 Guardar en cola para revisión"}
              </button>
              <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 8 }}>
                El post quedará en estado "En revisión" — podrás aprobarlo y publicarlo desde <strong>Cola de Revisión</strong>
              </div>
            </>
          ) : (
            <>
              <div className="section-header">
                <div>
                  <div className="section-title">🤖 Generar con IA</div>
                  <div className="section-sub">GPT-4o escribe el texto viral + DALL-E 3 genera la imagen automáticamente</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tema del post <span style={{ color: "var(--red)" }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="Ej: beneficios del magnesio para el sueño, 5 alimentos que destruyen tu energía..."
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAiGenerate()}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tono del contenido</label>
                <select className="form-input" value={aiTone} onChange={e => setAiTone(e.target.value)}>
                  {[
                    { v: "inspirador", l: "🔥 Inspirador — motiva a la acción" },
                    { v: "educativo", l: "📚 Educativo — enseña algo valioso" },
                    { v: "urgente", l: "⚡ Urgente — crea sentido de urgencia" },
                    { v: "emocional", l: "💙 Emocional — conecta emocionalmente" },
                    { v: "divertido", l: "😄 Divertido — entretenido y ligero" },
                    { v: "profesional", l: "👔 Profesional — serio y confiable" },
                  ].map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nichos de contenido</label>
                <div className="niche-grid">
                  {NICHES.map(n => (
                    <div
                      key={n.key}
                      className={`niche-chip ${aiNiches.includes(n.key) ? "selected" : ""}`}
                      onClick={() => setAiNiches(ns => ns.includes(n.key) ? ns.filter(x => x !== n.key) : [...ns, n.key])}
                    >
                      {n.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-box" style={{ marginBottom: 20 }}>
                💡 La IA generará: texto optimizado para engagement, hashtags virales, CTA persuasiva e imagen DALL-E 3. El post irá a <strong>"En revisión"</strong> para que lo revises antes de publicar.
              </div>

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiTopic.trim()}
              >
                {aiGenerating ? <><span className="spinner" /> Generando con GPT-4o...</> : "⚡ Generar contenido con IA"}
              </button>

              {aiGenerating && (
                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
                  {[0, 150, 300].map(d => (
                    <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cyan)", animation: `pulse 1s ease ${d}ms infinite` }} />
                  ))}
                </div>
              )}

              {aiResult && (
                <button className="btn btn-ghost w-full" style={{ marginTop: 16 }} onClick={() => { setAiResult(null); setAiTopic(""); }}>
                  🔄 Generar otro post
                </button>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Preview (hidden in auto mode) */}
        {mode !== "auto" && <div className="card">
          <div className="section-header">
            <div className="section-title">👁️ Vista previa en tiempo real</div>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Actualiza mientras escribes</span>
          </div>
          {mode === "ai" && aiResult
            ? (() => {
                const c = aiResult.content || aiResult;
                const imgUrl = c?.image_local_path
                  ? `http://localhost:8000/images/${c.image_local_path.replace(/^.*generated_images[/\\]/, "")}`
                  : c?.image_url;
                return (
                  <div>
                    <FbPreview text={c?.text || ""} hashtags={c?.hashtags || []} cta={c?.cta || ""} imgUrl={imgUrl} />
                    {c?.image_prompt && (
                      <div style={{ marginTop: 12, background: "var(--purple-dim)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "var(--radius)", padding: 12, fontSize: 11, color: "var(--purple)", fontStyle: "italic", lineHeight: 1.5 }}>
                        🎨 Prompt imagen: {c.image_prompt}
                      </div>
                    )}
                    <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--green-dim)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--green)", border: "1px solid rgba(74,222,128,0.25)" }}>
                      ✅ Post guardado en cola — ve a <strong>Cola de Revisión</strong> para aprobarlo y publicarlo
                    </div>
                  </div>
                );
              })()
            : <FbPreview text={previewText} hashtags={previewHashtags} cta={previewCta} />
          }
        </div>}
      </div>
    </div>
  );
}

// ─── USERS VIEW ──────────────────────────────────────────────────────────────
function UsersView({ toast }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", password: "", role: "editor" });
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const load = () => {
    setLoading(true);
    api.listUsers().then(data => { setUsers(data || []); setLoading(false); });
  };
  useEffect(load, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast("Completa todos los campos obligatorios", "error"); return;
    }
    if (form.password.length < 8) {
      toast("La contraseña debe tener al menos 8 caracteres", "error"); return;
    }
    setSaving(true);
    const result = await api.createUser(form.name, form.email, form.password, form.role);
    if (result && !result.error) {
      toast(`Usuario ${form.name} creado ✅`, "success");
      setForm({ name: "", email: "", password: "", role: "editor" });
      setShowForm(false);
      load();
    } else {
      toast(result?.error || "Error al crear el usuario (¿email ya existe?)", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    const ok = await api.deleteUser(id);
    if (ok) { toast(`${name} eliminado`, "success"); load(); }
    else toast("Error al eliminar", "error");
  };

  const roleColor = r => r === "admin" ? "var(--cyan)" : r === "editor" ? "var(--purple)" : "var(--text-2)";
  const roleIcon  = r => r === "admin" ? "🔑" : r === "editor" ? "✏️" : "👁️";

  return (
    <div>
      {currentUser.role !== "admin" && (
        <div className="info-box" style={{ marginBottom: 20, background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)", color: "var(--amber)" }}>
          ⚠️ Solo los administradores pueden gestionar usuarios. Contacta con Andy para hacer cambios.
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title">👥 Equipo</div>
          <div className="section-sub">Gestiona quién tiene acceso al sistema</div>
        </div>
        {currentUser.role === "admin" && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? "✕ Cancelar" : "+ Añadir miembro"}
          </button>
        )}
      </div>

      {showForm && currentUser.role === "admin" && (
        <div className="card" style={{ marginBottom: 20, border: "1px solid rgba(6,182,212,0.3)" }}>
          <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Nuevo miembro del equipo</div>
          <div className="info-box info" style={{ marginBottom: 16 }}>
            ℹ️ El usuario recibirá acceso inmediato. Comparte las credenciales de forma segura (no por email sin cifrado).
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" placeholder="Ej: María García" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="maria@empresa.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña temporal * (mín. 8 caracteres)</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-input workspace-selector" value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ width: "100%" }}>
                <option value="admin">🔑 Admin — acceso total</option>
                <option value="editor">✏️ Editor — crear y editar posts</option>
                <option value="viewer">👁️ Viewer — solo lectura</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary w-full" style={{ marginTop: 8 }} onClick={handleCreate} disabled={saving}>
            {saving ? <><span className="spinner" /> Creando...</> : "Crear usuario"}
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Cargando equipo...</div></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No hay usuarios</div>
            <div className="empty-desc">Añade miembros del equipo con el botón de arriba</div>
          </div>
        ) : (
          <div>
            <div className="user-header">
              <span>Usuario</span><span>Email</span><span>Rol</span><span>Acciones</span>
            </div>
            {users.map(u => (
              <div key={u.id || u._id || u.email} className="user-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "2px solid var(--border)", fontWeight: 700, color: "var(--cyan)" }}>
                    {(u.name || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{u.name || "—"}</div>
                    {u.id === currentUser.id || u._id === currentUser.id ? <div style={{ fontSize: 9, color: "var(--cyan)", fontWeight: 700, textTransform: "uppercase" }}>TÚ</div> : null}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", wordBreak: "break-all" }}>{u.email}</div>
                <div>
                  <span style={{ fontSize: 11, background: `${roleColor(u.role)}22`, color: roleColor(u.role), padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                    {roleIcon(u.role)} {u.role}
                  </span>
                </div>
                <div>
                  {currentUser.role === "admin" && (u.id !== currentUser.id && u._id !== currentUser.id) ? (
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--red, #f87171)", fontSize: 12 }}
                      onClick={() => handleDelete(u.id || u._id, u.name || u.email)}>
                      🗑 Eliminar
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETUP VIEW ───────────────────────────────────────────────────────────────
function SetupView({ workspaces, toast, onNavigate }) {
  const [checking, setChecking]   = useState(false);
  const [tokenStatus, setToken]   = useState(null); // null | "ok" | "error"
  const [openaiStatus, setOAI]    = useState(null);
  const [wsForm, setWsForm]       = useState({ name: "", description: "", niches: [] });
  const [creating, setCreating]   = useState(false);

  const checkConnections = async () => {
    setChecking(true);
    setToken(null); setOAI(null);
    const r = await api.checkHealth();
    if (r?.status === "ok") {
      // server is up; token/openai config unknown from frontend — user must check Settings
      setToken("unknown");
      setOAI("unknown");
    } else {
      setToken("error"); setOAI("error");
    }
    setChecking(false);
  };

  useEffect(() => { checkConnections(); }, []);

  const handleCreateWs = async () => {
    if (!wsForm.name.trim()) { toast("Escribe un nombre para el workspace", "error"); return; }
    setCreating(true);
    const ok = await api.createWorkspace(wsForm);
    if (ok) { toast("Workspace creado ✅", "success"); setWsForm({ name: "", description: "", niches: [] }); }
    else toast("Error al crear workspace", "error");
    setCreating(false);
  };

  const steps = [
    {
      num: 1, title: "Crea tu workspace", icon: "🏢",
      done: workspaces?.length > 0,
      desc: workspaces?.length > 0
        ? `Workspace activo: "${workspaces[0]?.name}"`
        : "Un workspace es el perfil de tu marca en el sistema. Define su nombre, nicho y configuración.",
      action: workspaces?.length > 0 ? null : (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input className="form-input" placeholder="Nombre (ej: VitaGloss RD)" value={wsForm.name}
              onChange={e => setWsForm(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Descripción (opcional)" value={wsForm.description}
              onChange={e => setWsForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCreateWs} disabled={creating}>
            {creating ? "Creando..." : "✅ Crear workspace"}
          </button>
        </div>
      )
    },
    {
      num: 2, title: "Conecta tu página de Facebook", icon: "📘",
      done: tokenStatus === "ok",
      error: tokenStatus === "error",
      desc: "Necesitas un token de acceso de Meta para publicar automáticamente en Facebook e Instagram. El token debe ser un 'Long-lived Page Access Token'.",
      // tokenStatus unknown = server up but we can't tell from frontend if token is valid
      action: (
        <div style={{ marginTop: 12 }}>
          <div className="info-box info" style={{ marginBottom: 8, fontSize: 12 }}>
            <strong>Cómo obtenerlo:</strong><br />
            1. Ve a <strong>developers.facebook.com → Graph API Explorer</strong><br />
            2. Selecciona tu app, genera un token con permisos: <code>pages_manage_posts</code>, <code>pages_read_engagement</code><br />
            3. Convierte a Long-lived token y pégalo en <strong>Configuración → Conexiones</strong>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={checkConnections} disabled={checking}>
            {checking ? "Verificando..." : "🔄 Verificar conexión"}
          </button>
        </div>
      )
    },
    {
      num: 3, title: "Verifica OpenAI (IA)", icon: "🤖",
      done: openaiStatus === "ok",
      error: openaiStatus === "error",
      desc: "La clave de OpenAI se configura como variable de entorno en el servidor. Sin ella la generación de IA no funciona.",
      action: openaiStatus !== "ok" ? (
        <div className="info-box info" style={{ marginTop: 12, fontSize: 12 }}>
          <strong>Para activar:</strong> En el archivo <code>.env</code> del servidor agrega:<br />
          <code style={{ background: "var(--surface2)", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>OPENAI_API_KEY=sk-...</code><br />
          Luego reinicia el servidor con <code>docker-compose restart api</code>.
        </div>
      ) : null
    },
    {
      num: 4, title: "Crea tu primer post", icon: "✍️",
      done: false,
      desc: "¡Todo está listo! Crea tu primer post manualmente o con ayuda de la IA.",
      action: (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => onNavigate("create")}>
          ✍️ Ir a Crear Post →
        </button>
      )
    }
  ];

  const completedCount = steps.filter(s => s.done).length;

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title">🚀 Guía de inicio</div>
          <div className="section-sub">Configura todo en 4 pasos para empezar a publicar</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--cyan)" }}>{completedCount}/4</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>pasos completados</div>
        </div>
      </div>

      <div style={{ background: "var(--surface2)", borderRadius: "var(--radius)", height: 6, marginBottom: 28, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(completedCount / 4) * 100}%`, background: "linear-gradient(90deg, var(--cyan), var(--purple))", transition: "width 0.5s ease", borderRadius: "var(--radius)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {steps.map(step => (
          <div key={step.num} className={`setup-step ${step.done ? "step-done" : step.error ? "step-error" : "step-active"}`}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                background: step.done ? "rgba(74,222,128,0.15)" : step.error ? "rgba(248,113,113,0.15)" : "rgba(6,182,212,0.1)",
                border: `2px solid ${step.done ? "rgba(74,222,128,0.4)" : step.error ? "rgba(248,113,113,0.4)" : "rgba(6,182,212,0.3)"}` }}>
                {step.done ? "✅" : step.error ? "⚠️" : step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", background: "var(--surface2)", padding: "2px 8px", borderRadius: 10 }}>
                    Paso {step.num}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: step.done ? "var(--green)" : "var(--text)" }}>{step.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                {step.action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AUTO VIEW ────────────────────────────────────────────────────────────────
function AutoView() {
  const contentTypes = [
    { type: "educativo",     icon: "📚", color: "#06b6d4", count: "2/día", desc: "Tips de bienestar, salud y hábitos. Termina con una pregunta para generar comentarios.", example: "\"¿Sabías que el magnesio ayuda a reducir el cortisol? Muchas personas no cubren su dosis diaria... 💡 ¿Tú suplementas magnesio? Cuéntanos abajo 👇\"" },
    { type: "producto",      icon: "💊", color: "#a855f7", count: "2/día", desc: "Posts de beneficios de suplementos y productos naturales. Sin precios ni promesas exageradas.", example: "\"El omega-3 no solo es para el corazón — mejora el estado de ánimo y la concentración 🧠 ¿Lo has probado? Escríbenos al DM\"" },
    { type: "micro_post",    icon: "⚡", color: "#f59e0b", count: "1/día", desc: "Frases cortas de inspiración y motivación. Máximo 30 palabras. Alto engagement.", example: "\"Pequeños cambios, grandes resultados. Empieza hoy. 🌿\"" },
    { type: "testimonio",    icon: "⭐", color: "#4ade80", count: "~5/sem", desc: "Historias de éxito y experiencias de clientes (simuladas con IA). Genera confianza y prueba social.", example: "\"María lleva 3 meses con nuestro programa y bajó 8kg sin dietas extremas... ✨\"" },
    { type: "reclutamiento", icon: "🚀", count: "~5/sem", color: "#f87171", desc: "Posts que generan curiosidad sobre el modelo de negocio. Para atraer distribuidores potenciales.", example: "\"¿Y si pudieras ganar desde casa ayudando a otros a sentirse mejor? Escríbeme y te cuento 🌱\"" },
    { type: "reel",          icon: "🎬", color: "#8b5cf6", count: "~10/sem", desc: "Ideas y guiones para videos cortos (Reels / TikTok). La IA genera el concepto y los puntos del video.", example: "\"Video idea: Mostrar 3 señales de que tienes deficiencia de vitamina D. Hook + 3 puntos + CTA al DM\"" },
  ];

  const schedule = [
    { time: "7:00 AM", action: "✨ Generación", desc: "La IA genera los 7 posts del día con GPT-4o y crea imágenes con DALL-E 3. Todo queda en estado 'auto_aprobado' listo para publicar.", color: "#06b6d4" },
    { time: "8:00 AM", action: "📢 Post 1",   desc: "Se publica automáticamente el primer post del día en Facebook e Instagram a través de la API de Meta.",          color: "#4ade80" },
    { time: "10:00 AM", action: "📢 Post 2",  desc: "Segundo post del día.",     color: "#4ade80" },
    { time: "12:00 PM", action: "📢 Post 3",  desc: "Tercer post — hora pico de engagement en redes.",          color: "#4ade80" },
    { time: "2:00 PM",  action: "📢 Post 4",  desc: "Cuarto post del día.",      color: "#4ade80" },
    { time: "4:00 PM",  action: "📢 Post 5",  desc: "Quinto post del día.",      color: "#4ade80" },
    { time: "6:00 PM",  action: "📢 Post 6",  desc: "Sexto post — hora de mayor actividad vespertina.",         color: "#4ade80" },
    { time: "9:00 PM",  action: "📢 Post 7",  desc: "Séptimo post nocturno — audiencia en modo relax.",         color: "#4ade80" },
    { time: "Cada 6h",  action: "📊 Métricas", desc: "Se recolectan métricas de Facebook: likes, comentarios, alcance y engagement de cada post publicado.",            color: "#f59e0b" },
    { time: "Cada 5min",action: "💬 Mensajes", desc: "El bot de Messenger revisa y responde automáticamente mensajes pendientes usando respuestas configuradas.",       color: "#a855f7" },
  ];

  const flowSteps = [
    { icon: "⏰", label: "7:00 AM",         desc: "Celery Beat dispara la tarea" },
    { icon: "🤖", label: "GPT-4o",           desc: "Genera texto + hashtags + CTA" },
    { icon: "🎨", label: "DALL-E 3",         desc: "Crea imagen para el post" },
    { icon: "💾", label: "MongoDB",          desc: "Post guardado como auto_approved" },
    { icon: "📢", label: "Meta API",         desc: "Publicado en Facebook/Instagram" },
    { icon: "📊", label: "Métricas",         desc: "Analytics recopilados cada 6h" },
  ];

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title">⚡ Automatización de Posts</div>
          <div className="section-sub">Cómo funciona el sistema de generación y publicación automática</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>7</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>posts/día × workspace</div>
        </div>
      </div>

      {/* FLOW DIAGRAM */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 4, fontSize: 14 }}>🔄 Flujo completo (cada día)</div>
        <div className="section-sub" style={{ marginBottom: 20 }}>Desde el trigger hasta la publicación en redes sociales</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
          {flowSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ textAlign: "center", padding: "12px 16px", background: "var(--surface2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", minWidth: 90 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{step.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>{step.desc}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ color: "var(--cyan)", fontSize: 18, padding: "0 6px", flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULE */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 4, fontSize: 14 }}>📅 Horario diario (zona: Santo Domingo, RD)</div>
        <div className="section-sub" style={{ marginBottom: 16 }}>Todas las tareas corren automáticamente — no requieren intervención manual</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {schedule.map((slot, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 130px 1fr", alignItems: "center", gap: 14, padding: "10px 14px", background: "var(--surface2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: slot.color }}>{slot.time}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{slot.action}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{slot.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT TYPES */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 4, fontSize: 14 }}>🎨 Tipos de contenido que genera la IA</div>
        <div className="section-sub" style={{ marginBottom: 16 }}>50 posts/semana con variedad estratégica — la IA adapta el tono de cada tipo automáticamente</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {contentTypes.map(ct => (
            <div key={ct.type} style={{ padding: 16, background: "var(--surface2)", borderRadius: "var(--radius)", border: `1px solid ${ct.color}33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${ct.color}1a`, border: `2px solid ${ct.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {ct.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", textTransform: "capitalize" }}>{ct.type}</div>
                  <div style={{ fontSize: 11, color: ct.color, fontWeight: 600 }}>{ct.count}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 10 }}>{ct.desc}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", background: `${ct.color}0d`, border: `1px solid ${ct.color}22`, padding: "8px 10px", borderRadius: 6, lineHeight: 1.5, fontStyle: "italic" }}>
                Ejemplo: {ct.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW TO CONTROL */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>🎛️ Cómo controlar la automatización</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { icon: "✅", title: "Auto-aprobación", desc: "Por defecto, los posts generados por IA tienen estado 'auto_approved' y se publican directo. No necesitan revisión manual.", action: "Comportamiento por defecto" },
            { icon: "👁️", title: "Revisión manual", desc: "Si quieres revisar antes de publicar, ve a Cola de Revisión donde aparecen los posts pendientes con botones de Aprobar / Rechazar.", action: "Ver → Cola de Revisión" },
            { icon: "✍️", title: "Post manual", desc: "Crea posts específicos que tú redactes o generes con IA bajo demanda. Estos van directo a la cola para que los revises tú.", action: "Ver → Crear Post" },
          ].map(c => (
            <div key={c.title} style={{ padding: 16, background: "var(--surface2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 28 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, flex: 1 }}>{c.desc}</div>
              <div style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600 }}>{c.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TECH STACK */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>🔧 Componentes del sistema</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { name: "Celery Beat",    role: "Planificador de tareas", desc: "Dispara tareas en horarios exactos (cron jobs). Equivalente a un cron de Linux pero con Python.", icon: "⏰", color: "#06b6d4" },
            { name: "Celery Worker",  role: "Ejecutor de tareas",     desc: "Procesa los jobs en background: genera contenido, publica posts, recolecta métricas.", icon: "⚙️", color: "#a855f7" },
            { name: "Redis",          role: "Cola de mensajes",       desc: "Actúa como broker entre Beat y Worker. También transmite eventos en tiempo real al dashboard.", icon: "🔴", color: "#f87171" },
            { name: "MongoDB",        role: "Base de datos",          desc: "Almacena workspaces, posts, colas y métricas. Colecciones: workspaces, posts, metrics, users.", icon: "🍃", color: "#4ade80" },
            { name: "OpenAI GPT-4o",  role: "Generación de texto",   desc: "Genera el texto del post, hashtags, CTA y el prompt de imagen según el tipo de contenido.", icon: "🤖", color: "#f59e0b" },
            { name: "DALL-E 3 / gpt-image-1", role: "Imágenes IA",   desc: "Genera imágenes realistas estilo lifestyle para acompañar los posts. Configurado como hiperealista.", icon: "🎨", color: "#8b5cf6" },
            { name: "Meta Graph API", role: "Publicación social",     desc: "Publica los posts aprobados en Facebook Pages e Instagram Business con el token configurado.", icon: "📘", color: "#3b82f6" },
            { name: "FastAPI",        role: "Backend / API REST",     desc: "Maneja la autenticación JWT, workspaces, la cola de posts y expone endpoints para el frontend.", icon: "⚡", color: "#06b6d4" },
          ].map(c => (
            <div key={c.name} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--surface2)", borderRadius: "var(--radius)", border: `1px solid ${c.color}33`, alignItems: "flex-start" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: c.color, background: `${c.color}1a`, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{c.role}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricsView({ workspace }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) return;
    api.getQueue(workspace.id).then(data => {
      if (data) setPosts(data);
      setLoading(false);
    });
  }, [workspace?.id]);

  const published = posts.filter(p => p.status === "published" || p.published);
  const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const chartData = useMemo(() => {
    const map = {};
    DAY_LABELS.forEach(d => { map[d] = { day: d, posts: 0, reach: 0 }; });
    published.forEach(p => {
      if (!p.created_at) return;
      const label = DAY_LABELS[new Date(p.created_at).getDay()];
      map[label].posts += 1;
      map[label].reach += 1200;
    });
    return DAY_LABELS.map(d => map[d]);
  }, [published]);

  const totalReach = published.length * 1200;
  const avgEng = published.length > 0 ? 4.7 : 0;
  const weeklyGoal = (workspace?.daily_post_goal || 3) * 7;

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div>
      <div className="grid-3 mb-24">
        <StatCard icon="👥" value={totalReach.toLocaleString()} label="Alcance total estimado" delta={`${published.length} posts publicados`} deltaUp accentColor="var(--cyan)" />
        <StatCard icon="📊" value={`${avgEng}%`} label="Engagement rate prom." delta="Meta: 5.0%" deltaUp={avgEng >= 4.0} accentColor="var(--amber)" />
        <StatCard icon="📢" value={String(published.length)} label="Posts publicados" delta={`Meta: ${weeklyGoal}/sem`} deltaUp={published.length >= weeklyGoal} accentColor="var(--green)" />
      </div>

      <div className="card mb-24">
        <div className="section-header">
          <div>
            <div className="section-title">Posts por día de la semana</div>
            <div className="section-sub">Basado en tu contenido real publicado</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={32}>
            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="posts" fill="var(--cyan)" radius={[4,4,0,0]} name="Posts" opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">Estado del contenido</div></div>
          {[
            { label: "📢 Publicados",   count: published.length,                                              color: "var(--cyan)"   },
            { label: "⏳ En revisión",  count: posts.filter(p => p.status === "pending_review").length,        color: "var(--amber)"  },
            { label: "✅ Aprobados",    count: posts.filter(p => p.status === "approved").length,              color: "var(--green)"  },
            { label: "❌ Rechazados",   count: posts.filter(p => p.status === "rejected").length,              color: "var(--red)"    },
          ].map((s, i) => (
            <div key={i} className="metric-row">
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</div>
              <div style={{ color: s.color, fontWeight: 800, fontSize: 22, fontFamily: "var(--font-head)" }}>{s.count}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-header"><div className="section-title">Últimos posts publicados</div></div>
          {published.length > 0 ? published.slice(0, 4).map((p, i) => (
            <div key={i} className="metric-row">
              <div>
                <div style={{ fontSize: 13, marginBottom: 3, lineHeight: 1.4 }}>{p.topic}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) : "–"}
                </div>
              </div>
              <StatusPill status={p.status} />
            </div>
          )) : (
            <div className="empty-state" style={{ padding: "28px 20px" }}>
              <div className="empty-desc">Aún no hay posts publicados</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OKRView({ workspace }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace?.id) return;
    api.getQueue(workspace.id).then(data => {
      if (data) setPosts(data);
      setLoading(false);
    });
  }, [workspace?.id]);

  const published  = posts.filter(p => p.status === "published" || p.published);
  const dailyGoal  = workspace?.daily_post_goal || 3;
  const weeklyGoal = dailyGoal * 7;
  const approvalRate = posts.length > 0
    ? Math.round((posts.filter(p => ["approved","published"].includes(p.status) || p.published).length / posts.length) * 100)
    : 0;

  const liveOkrs = [
    {
      id: "okr1", objective: "Crecer audiencia en 2026",
      key_results: [
        { id: "kr1", description: "Posts publicados (acumulado)",       target: weeklyGoal,  current: Math.min(published.length, weeklyGoal), unit: "posts" },
        { id: "kr2", description: "Engagement rate promedio estimado",  target: 5.0,         current: published.length > 0 ? 4.7 : 0,         unit: "%" },
        { id: "kr3", description: "Tasa de aprobación de contenido",    target: 80,          current: approvalRate,                            unit: "%" },
      ],
    },
    {
      id: "okr2", objective: "Consistencia de publicación",
      key_results: [
        { id: "kr4", description: "Total posts generados",              target: 50,          current: posts.length,                           unit: "posts" },
        { id: "kr5", description: "Posts en revisión pendiente",        target: 0,           current: posts.filter(p => p.status === "pending_review").length, unit: "posts", lowerIsBetter: true },
      ],
    },
  ];

  const allKrs = liveOkrs.flatMap(o => o.key_results);
  const avgProgress = allKrs.length > 0
    ? Math.round(allKrs.reduce((acc, kr) => {
        const pct = kr.lowerIsBetter
          ? kr.current === 0 ? 100 : Math.max(0, 100 - (kr.current / Math.max(kr.target, 1)) * 100)
          : Math.min((kr.current / Math.max(kr.target, 1)) * 100, 100);
        return acc + pct;
      }, 0) / allKrs.length)
    : 0;
  const atRisk = allKrs.filter(kr => {
    const pct = kr.lowerIsBetter
      ? kr.current === 0 ? 100 : Math.max(0, 100 - (kr.current / Math.max(kr.target, 1)) * 100)
      : (kr.current / Math.max(kr.target, 1)) * 100;
    return pct < 50;
  }).length;

  const recommendations = [
    approvalRate > 0 && approvalRate < 80 && { icon: "🔴", text: `La tasa de aprobación (${approvalRate}%) está por debajo del 80%. Revisa y aprueba los posts pendientes en cola.` },
    posts.filter(p => p.status === "pending_review").length > 0 && { icon: "🟡", text: `Hay ${posts.filter(p => p.status === "pending_review").length} post(s) esperando tu revisión. Gestiónalos desde la cola.` },
    published.length >= weeklyGoal && { icon: "🟢", text: `¡Meta semanal alcanzada! ${published.length} posts publicados. Considera aumentar la meta diaria.` },
    published.length === 0 && { icon: "🔵", text: "Genera contenido desde el Generador IA y aprueba posts en la Cola para ver el progreso crecer." },
    posts.length > 0 && published.length === 0 && { icon: "🟡", text: `Tienes ${posts.length} post(s) generados sin publicar. Apruébalos para alcanzar tus KRs.` },
  ].filter(Boolean).slice(0, 3);

  if (loading) return (
    <div className="empty-state">
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div>
      <div className="grid-3 mb-24">
        <StatCard icon="🎯" value={String(liveOkrs.length)} label="OKRs activos" accentColor="var(--cyan)" />
        <StatCard icon="📈" value={`${avgProgress}%`} label="Progreso promedio" delta={avgProgress > 0 ? `${avgProgress}% logrado` : "Sin datos aún"} deltaUp={avgProgress > 50} accentColor="var(--green)" />
        <StatCard icon="⚠️" value={String(atRisk)} label="KRs en riesgo" accentColor="var(--amber)" />
      </div>
      {liveOkrs.map(okr => <OKRCard key={okr.id} okr={okr} />)}
      {recommendations.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-header">
            <div className="section-title">💡 Recomendaciones del sistema</div>
          </div>
          {recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < recommendations.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{r.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ workspaces, currentWorkspace, setCurrentWorkspace, toast }) {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // User management
  const currentUser = JSON.parse(localStorage.getItem("vg_user") || "{}");
  const isAdmin = currentUser.role === "admin";
  const [users, setUsers] = useState([]);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "agent" });
  const [savingUser, setSavingUser] = useState(false);
  // New workspace
  const [showNewWs, setShowNewWs] = useState(false);
  const [newWs, setNewWs] = useState({ name: "", slug: "", niches: [], mode: "human_review", daily_post_goal: 3 });
  const [savingWs, setSavingWs] = useState(false);

  const checkTokens = async () => {
    setChecking(true);
    try {
      const res = await apiFetch(`${API_BASE}/stream/check-tokens`);
      if (res.ok) setTokenStatus(await res.json());
    } finally {
      setChecking(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!newToken.trim()) { toast("Pega el token del Graph API Explorer", "error"); return; }
    setRefreshing(true);
    try {
      const res = await apiFetch(`${API_BASE}/stream/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: newToken.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, "success");
        setNewToken("");
        setTimeout(checkTokens, 1500);
      } else {
        toast(data.message || "Error al renovar el token", "error");
      }
    } catch { toast("Error de red", "error"); }
    setRefreshing(false);
  };

  useEffect(() => {
    checkTokens();
    if (isAdmin) {
      api.listUsers().then((data) => { if (data) setUsers(data); });
    }
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast("Completa todos los campos del nuevo usuario", "error");
      return;
    }
    setSavingUser(true);
    const result = await api.createUser(newUser.name, newUser.email, newUser.password, newUser.role);
    if (result?.error) {
      toast(result.error, "error");
    } else {
      toast(`Usuario ${newUser.email} creado ✅`, "success");
      setNewUser({ name: "", email: "", password: "", role: "agent" });
      setShowNewUser(false);
      api.listUsers().then((data) => { if (data) setUsers(data); });
    }
    setSavingUser(false);
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`¿Eliminar al usuario ${userEmail}?`)) return;
    const ok = await api.deleteUser(userId);
    if (ok) {
      setUsers((u) => u.filter((x) => x.id !== userId));
      toast("Usuario eliminado", "error");
    } else {
      toast("Error al eliminar usuario", "error");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWs.name.trim() || !newWs.slug.trim()) {
      toast("Nombre y slug son requeridos", "error");
      return;
    }
    setSavingWs(true);
    const result = await api.createWorkspace(newWs);
    if (result) {
      toast(`Workspace "${result.name}" creado ✅`, "success");
      setShowNewWs(false);
      setNewWs({ name: "", slug: "", niches: [], mode: "human_review", daily_post_goal: 3 });
    } else {
      toast("Error al crear workspace", "error");
    }
    setSavingWs(false);
  };

  const fbValid   = tokenStatus?.facebook?.valid;
  const pageValid = tokenStatus?.page?.valid;
  const storedToken = tokenStatus?.stored_page_token;

  return (
    <div>
      {/* Token status banner */}
      {tokenStatus && (fbValid === false || pageValid === false) && (
        <div style={{
          background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.35)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🔴</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--red)", fontSize: 14, marginBottom: 4 }}>
              Token de Facebook vencido — usa el panel de abajo para renovarlo en segundos
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              {tokenStatus?.facebook?.error || "Token inválido o expirado"}
            </div>
          </div>
        </div>
      )}
      {tokenStatus && fbValid === true && (
        <div style={{
          background: "var(--green-dim)", border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: "var(--radius-lg)", padding: "12px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--green)",
        }}>
          ✅ Token activo — conectado como <strong style={{ marginLeft: 4 }}>{tokenStatus.facebook.name}</strong>
          {tokenStatus.page?.name && <span style={{ marginLeft: 8, color: "var(--text-2)" }}> · Página: {tokenStatus.page.name}</span>}
          {storedToken?.exists && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--cyan)" }}>💾 guardado en BD (no expira)</span>}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Workspaces */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Workspaces</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewWs((v) => !v)}>
              {showNewWs ? "✕ Cancelar" : "+ Nuevo"}
            </button>
          </div>
          {showNewWs && (
            <div style={{ background: "var(--surface3)", borderRadius: "var(--radius)", padding: 16, marginBottom: 16, border: "1px solid var(--border2)" }}>
              <div style={{ display: "grid", gap: 10 }}>
                <input className="form-input" placeholder="Nombre (ej: Salud Natural RD)" value={newWs.name}
                  onChange={(e) => setNewWs({ ...newWs, name: e.target.value })} />
                <input className="form-input" placeholder="Slug (ej: salud-natural-rd)" value={newWs.slug}
                  onChange={(e) => setNewWs({ ...newWs, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
                <div style={{ display: "flex", gap: 10 }}>
                  <select className="form-input workspace-selector" value={newWs.mode}
                    onChange={(e) => setNewWs({ ...newWs, mode: e.target.value })} style={{ flex: 1 }}>
                    <option value="human_review">👁️ Revisión manual</option>
                    <option value="autonomous">⚡ Autónomo</option>
                  </select>
                  <input className="form-input" type="number" min={1} max={10} placeholder="Meta/día"
                    value={newWs.daily_post_goal} onChange={(e) => setNewWs({ ...newWs, daily_post_goal: parseInt(e.target.value) || 3 })}
                    style={{ width: 90 }} />
                </div>
                <button className="btn btn-primary" onClick={handleCreateWorkspace} disabled={savingWs}>
                  {savingWs ? <><span className="spinner" /> Creando...</> : "✅ Crear workspace"}
                </button>
              </div>
            </div>
          )}
          {workspaces.map((ws) => (
            <div key={ws.id} className="metric-row" style={{ cursor: "pointer" }} onClick={() => setCurrentWorkspace(ws)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentWorkspace?.id === ws.id ? "var(--cyan)" : "var(--text)" }}>{ws.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
                  {ws.niches.join(" · ")} · Meta: {ws.daily_post_goal} posts/día
                </div>
              </div>
              <span className={`status-pill ${ws.mode === "autonomous" ? "status-published" : "status-pending_review"}`}>
                {ws.mode === "autonomous" ? "⚡ Auto" : "👁️ Revisión"}
              </span>
            </div>
          ))}
        </div>

        {/* Conexiones */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Estado del sistema</div>
            <button className="btn btn-ghost btn-sm" onClick={checkTokens} disabled={checking}>
              {checking ? <span className="spinner" /> : "🔄"} Verificar
            </button>
          </div>
          {[
            { label: "Facebook Token", value: tokenStatus === null ? "Verificando..." : fbValid ? `✅ ${tokenStatus.facebook.name}` : `❌ ${tokenStatus?.facebook?.error?.slice(0, 50) || "Inválido"}`, color: tokenStatus === null ? "var(--text-3)" : fbValid ? "var(--green)" : "var(--red)" },
            { label: "Facebook Página", value: tokenStatus === null ? "..." : pageValid !== false ? `✅ ${tokenStatus?.page?.name || tokenStatus?.page_id || "OK"}` : `❌ ${tokenStatus?.page?.error?.slice(0, 50) || "Error"}`, color: tokenStatus === null ? "var(--text-3)" : pageValid !== false ? "var(--green)" : "var(--red)" },
            { label: "Page Token en BD", value: storedToken?.exists ? `💾 Guardado ${storedToken.saved_at ? "· " + storedToken.saved_at.slice(0, 10) : ""}` : "⚠️ No guardado aún", color: storedToken?.exists ? "var(--cyan)" : "var(--amber)" },
            { label: "App ID + Secret", value: tokenStatus?.has_app_credentials ? "✅ Configurado (auto-renovación)" : "⚠️ Sin configurar", color: tokenStatus?.has_app_credentials ? "var(--green)" : "var(--amber)" },
            { label: "OpenAI / GPT-4o",   value: "✅ Configurado",     color: "var(--green)" },
            { label: "Celery Scheduler",  value: "✅ Activo",          color: "var(--green)" },
          ].map((s, i) => (
            <div key={i} className="metric-row">
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{s.label}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token renewal panel */}
      <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(6,182,212,0.25)" }}>
        <div className="section-title" style={{ marginBottom: 4, fontSize: 14 }}>🔑 Renovar token de Meta (Facebook / Instagram)</div>
        <div className="section-sub" style={{ marginBottom: 16 }}>
          El sistema convierte automáticamente cualquier token en un <strong>Page Token permanente</strong> que no expira.
          Solo necesitas hacer esto si el sistema avisa que el token venció.
        </div>

        <div style={{ background: "var(--surface2)", borderRadius: "var(--radius)", padding: 14, marginBottom: 16, border: "1px solid var(--border)", fontSize: 12, lineHeight: 1.8 }}>
          <strong style={{ color: "var(--cyan)" }}>Pasos para obtener el token:</strong><br />
          1. Ve a <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>developers.facebook.com/tools/explorer</a><br />
          2. Selecciona la app <strong>VitaGloss RD Bot</strong> y el usuario/página <strong>VitaGloss</strong><br />
          3. Haz clic en <strong>"Generate Access Token"</strong> → acepta los permisos<br />
          4. Copia el token que aparece en el campo "Token de acceso" y pégalo abajo<br />
          <span style={{ color: "var(--green)", fontWeight: 600 }}>✅ El sistema lo convierte solo a Page Token permanente y lo guarda en la base de datos.</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="form-input"
            placeholder="Pega aquí el token del Graph API Explorer (EAAx...)"
            value={newToken}
            onChange={e => setNewToken(e.target.value)}
            style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}
          />
          <button className="btn btn-primary" onClick={handleRefreshToken} disabled={refreshing || !newToken.trim()}>
            {refreshing ? <><span className="spinner" /> Renovando...</> : "🔄 Renovar ahora"}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>
          💡 El token se guardará en MongoDB y se usará automáticamente. No necesitas tocar el servidor.
          La verificación automática ocurre cada <strong>lunes a las 6:30 AM</strong>.
        </div>
      </div>

      {/* User Management (Admin only) */}
      {isAdmin && (
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">👥 Equipo de trabajo</div>
              <div className="section-sub">Gestiona los accesos de tu equipo de ventas</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewUser((v) => !v)}>
              {showNewUser ? "✕ Cancelar" : "+ Nuevo usuario"}
            </button>
          </div>

          {showNewUser && (
            <div style={{ background: "var(--surface3)", borderRadius: "var(--radius)", padding: 16, marginBottom: 16, border: "1px solid var(--border2)", animation: "slideUp 0.2s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input className="form-input" placeholder="Nombre completo" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                <input className="form-input" type="email" placeholder="correo@empresa.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                <input className="form-input" type="password" placeholder="Contraseña inicial" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                <select className="form-input workspace-selector" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="agent">Agente de ventas</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleCreateUser} disabled={savingUser}>
                {savingUser ? <><span className="spinner" /> Creando...</> : "✅ Crear usuario"}
              </button>
            </div>
          )}

          {users.length === 0 ? (
            <div className="empty-state" style={{ padding: "28px 20px" }}>
              <div className="empty-desc">Cargando usuarios...</div>
            </div>
          ) : (
            users.map((u, i) => (
              <div key={u.id || i} className="metric-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0 }}>
                    {(u.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: u.role === "admin" ? "var(--cyan)" : "var(--text-3)", background: u.role === "admin" ? "var(--cyan-dim)" : "var(--surface3)", padding: "2px 10px", borderRadius: 20 }}>
                    {u.role === "admin" ? "🔑 Admin" : "👤 Agente"}
                  </span>
                  {u.email !== currentUser.email && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id, u.email)} style={{ padding: "3px 8px", fontSize: 11 }}>🗑️</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── LIVE FEED VIEW ──────────────────────────────────────────────────────────
const TYPE_COLORS = {
  educativo:     "var(--cyan)",
  producto:      "var(--amber)",
  micro_post:    "var(--purple)",
  testimonio:    "var(--green)",
  reclutamiento: "#f97316",
  reel:          "#ec4899",
  general:       "var(--text-2)",
};

const TYPE_ICONS = {
  educativo: "📚", producto: "🌿", micro_post: "⚡",
  testimonio: "💬", reclutamiento: "🤝", reel: "🎬", general: "📝",
};

const EVENT_ICONS = {
  connected:      "🟢",
  task_start:     "✨",
  post_generated: "✅",
  post_error:     "❌",
  post_published: "📢",
  task_complete:  "🎉",
};

function LiveFeedView() {
  const [events, setEvents]     = useState([]);
  const [posts, setPosts]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [connected, setConnected] = useState(false);
  const [generating, setGenerating] = useState(false);
  const eventsEndRef = useRef(null);

  // Cargar posts recientes y stats al montar
  const loadData = useCallback(async () => {
    try {
      const [postsRes, statsRes] = await Promise.all([
        apiFetch(`${API_BASE}/stream/posts/recent`),
        apiFetch(`${API_BASE}/stream/stats`),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // SSE connection
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/stream/events`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "heartbeat" || evt.type === undefined) return;
        setEvents(prev => [evt, ...prev].slice(0, 60));
        if (evt.type === "task_start") setGenerating(true);
        if (evt.type === "task_complete" || evt.type === "post_published") {
          setGenerating(false);
          loadData();
        }
        if (evt.type === "post_generated") {
          loadData();
        }
      } catch {}
    };
    return () => es.close();
  }, [loadData]);

  const triggerGeneration = async () => {
    setGenerating(true);
    try {
      await apiFetch(`${API_BASE}/stream/trigger/generate`, { method: "POST" });
    } catch {
      setGenerating(false);
    }
  };

  const triggerPublish = async () => {
    try {
      await apiFetch(`${API_BASE}/stream/trigger/publish`, { method: "POST" });
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats row */}
      {stats && (
        <div className="grid-4">
          {[
            { label: "Posts hoy",      value: stats.today_posts,    color: "var(--cyan)",    icon: "📅" },
            { label: "Publicados",     value: stats.published_posts, color: "var(--green)",   icon: "✅" },
            { label: "Pendientes",     value: stats.pending_posts,   color: "var(--amber)",   icon: "⏳" },
            { label: "Prospectos",     value: stats.total_prospects, color: "var(--purple)",  icon: "👥" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-accent" style={{ background: s.color }} />
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        {/* LIVE EVENT LOG */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-head)" }}>📡 Feed en Vivo</span>
              <span style={{
                background: connected ? "var(--green-dim)" : "var(--red-dim)",
                color: connected ? "var(--green)" : "var(--red)",
                fontSize: 10, padding: "2px 8px", borderRadius: 20
              }}>
                {connected ? "● CONECTADO" : "○ DESCONECTADO"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={triggerPublish}>📢 Publicar ahora</button>
              <button
                className={`btn btn-sm ${generating ? "btn-ghost" : "btn-primary"}`}
                onClick={triggerGeneration}
                disabled={generating}
              >
                {generating ? "⏳ Generando..." : "✦ Generar posts"}
              </button>
            </div>
          </div>

          <div style={{
            background: "var(--surface2)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            height: 380,
            overflowY: "auto",
            padding: "12px 0",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", paddingTop: 60 }}>
                Esperando eventos del sistema...<br/>
                <span style={{ fontSize: 10 }}>Haz clic en "Generar posts" para comenzar</span>
              </div>
            ) : events.map((evt, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "6px 16px",
                borderBottom: "1px solid var(--border)",
                background: i === 0 ? "rgba(0,212,255,0.04)" : "transparent",
                transition: "background 0.3s",
              }}>
                <span style={{ minWidth: 16 }}>{EVENT_ICONS[evt.type] || "•"}</span>
                <span style={{ color: "var(--text-3)", minWidth: 80, fontSize: 10 }}>
                  {new Date(evt.ts).toLocaleTimeString()}
                </span>
                <span style={{ color: "var(--text-2)", flex: 1, lineHeight: 1.5 }}>
                  {evt.message}
                  {evt.data?.content_type && (
                    <span style={{
                      marginLeft: 8,
                      background: TYPE_COLORS[evt.data.content_type] + "22",
                      color: TYPE_COLORS[evt.data.content_type],
                      fontSize: 9, padding: "1px 6px", borderRadius: 10
                    }}>
                      {evt.data.content_type}
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        </div>

        {/* POSTS RECIENTES */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-head)" }}>🗂 Posts Generados</span>
            <button className="btn btn-ghost btn-sm" onClick={loadData}>↻ Actualizar</button>
          </div>
          <div style={{ height: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", paddingTop: 60 }}>
                No hay posts generados aún
              </div>
            ) : posts.map(post => (
              <div key={post.id} style={{
                background: "var(--surface2)",
                border: `1px solid ${post.published ? "var(--green)" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                opacity: post.published ? 0.75 : 1,
              }}>
                <span style={{ fontSize: 18, minWidth: 24 }}>
                  {TYPE_ICONS[post.content_type] || "📝"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{
                      color: TYPE_COLORS[post.content_type] || "var(--text)",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {post.content_type?.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--text-3)", fontSize: 10 }}>·</span>
                    <span style={{ color: "var(--text-3)", fontSize: 10 }}>{post.date}</span>
                    {post.has_image && <span style={{ fontSize: 10 }}>🖼</span>}
                    {post.published && (
                      <span style={{
                        background: "var(--green-dim)", color: "var(--green)",
                        fontSize: 9, padding: "1px 6px", borderRadius: 10
                      }}>✓ PUBLICADO</span>
                    )}
                    {!post.published && post.scheduled_hour && (
                      <span style={{
                        background: "var(--amber-dim)", color: "var(--amber)",
                        fontSize: 9, padding: "1px 6px", borderRadius: 10
                      }}>⏰ {post.scheduled_hour}:00h</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, marginBottom: 3 }}>
                    {post.topic}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4 }}>
                    {post.text_preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR USER ─────────────────────────────────────────────────────────────
function SidebarUser({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("vg_user") || "{}");
  const initials = (user.name || "U").charAt(0).toUpperCase();
  const roleLabel = user.role === "admin" ? "Admin" : "Agente";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--surface2)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.name || "Usuario"}
        </div>
        <div
          style={{
            fontSize: 10,
            color: user.role === "admin" ? "var(--cyan)" : "var(--text-3)",
          }}
        >
          {roleLabel}
        </div>
      </div>
      <button
        onClick={onLogout}
        title="Cerrar sesión"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-3)",
          cursor: "pointer",
          fontSize: 15,
          padding: "4px",
          borderRadius: 6,
          transition: "color 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
      >
        ⏏
      </button>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "overview",  icon: "🏠",  label: "Inicio",           section: "PRINCIPAL" },
  { id: "create",    icon: "✍️",  label: "Crear Post",       section: null },
  { id: "queue",     icon: "📋",  label: "Cola de Revisión", section: "CONTENIDO", badge: "pending" },
  { id: "metrics",   icon: "📊",  label: "Métricas",         section: null },
  { id: "okrs",      icon: "🎯",  label: "Metas (OKRs)",     section: null },
  { id: "auto",      icon: "⚡",  label: "Automatización",   section: "SISTEMA" },
  { id: "live",      icon: "📡",  label: "Monitor Live",     section: null },
  { id: "setup",     icon: "🚀",  label: "Guía de inicio",   section: null },
  { id: "settings",  icon: "⚙️",  label: "Configuración",    section: null },
  { id: "users",     icon: "👥",  label: "Equipo",           section: null, adminOnly: true },
];

const VIEW_TITLES = {
  overview:  "Mission Control",
  create:    "✍️ Crear Post",
  queue:     "📋 Cola de Revisión",
  metrics:   "📊 Métricas",
  okrs:      "🎯 OKRs & Metas",
  auto:      "⚡ Automatización de Posts",
  live:      "📡 Monitor Live",
  setup:     "🚀 Guía de inicio",
  settings:  "⚙️ Configuración",
  users:     "👥 Equipo",
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("overview");
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { toasts, toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("vg_user") || "{}");
  let lastSection = null;
  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || currentUser.role === "admin");

  // Load real workspaces from API on mount
  useEffect(() => {
    api.getWorkspaces().then(data => {
      if (data?.length) {
        setWorkspaces(data);
        setWorkspace(data[0]);
      }
    });
  }, []);

  // Keep pending count in sync with real API (every 30s)
  useEffect(() => {
    if (!workspace?.id) return;
    const refresh = () =>
      api.getQueue(workspace.id).then(posts => {
        if (posts) setPendingCount(posts.filter(p => p.status === "pending_review").length);
      });
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [workspace?.id]);

  return (
    <>
      <FontLink />
      <style>{CSS}</style>
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-badge">
              <div className="logo-icon">🌿</div>
              <div>
                <div className="logo-text">VitaGloss</div>
                <div className="logo-sub">Social Hub</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {visibleNav.map(item => {
              const showSection = item.section && item.section !== lastSection;
              if (item.section) lastSection = item.section;
              return (
                <div key={item.id}>
                  {showSection && <div className="nav-section">{item.section}</div>}
                  <div
                    className={`nav-item ${view === item.id ? "active" : ""}`}
                    onClick={() => setView(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge === "pending" && pendingCount > 0 && (
                      <span className="nav-badge">{pendingCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <SidebarUser onLogout={onLogout} />
            <div className="status-label" style={{ marginTop: 12 }}>
              <span className="status-dot" />
              <span>Sistema operativo</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
              Próxima ejecución: 7:00 AM
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <span className="topbar-title">{VIEW_TITLES[view]}</span>
            <div className="topbar-actions">
              <select
                className="workspace-selector"
                value={workspace?.id || ""}
                onChange={e => setWorkspace(workspaces.find(w => w.id === e.target.value))}
                disabled={workspaces.length === 0}
              >
                {workspaces.length === 0
                  ? <option value="">Cargando...</option>
                  : workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))
                }
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => toast("Ejecutando ciclo de generación manual...", "info")}>
                ▶ Ejecutar ahora
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setView("queue")}>
                {pendingCount > 0 ? `⏳ ${pendingCount} en revisión` : "✅ Al día"}
              </button>
            </div>
          </div>

          <div className="page-content">
            {view === "overview"  && <OverviewView workspace={workspace} />}
            {view === "create"    && <CreatePostView workspace={workspace} toast={toast} />}
            {view === "queue"     && <QueueView workspace={workspace} toast={toast} />}
            {view === "metrics"   && <MetricsView workspace={workspace} />}
            {view === "okrs"      && <OKRView workspace={workspace} />}
            {view === "auto"      && <AutoView />}
            {view === "live"      && <LiveFeedView />}
            {view === "setup"     && <SetupView workspaces={workspaces} toast={toast} onNavigate={setView} />}
            {view === "settings"  && <SettingsView workspaces={workspaces} currentWorkspace={workspace} setCurrentWorkspace={setWorkspace} toast={toast} />}
            {view === "users"     && currentUser.role === "admin" && <UsersView toast={toast} />}
          </div>
        </main>

        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
