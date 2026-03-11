import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ─── GOOGLE FONTS ────────────────────────────────────────────────────────────
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
  `}</style>
);

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #07080f;
    --surface:   #0e1018;
    --surface2:  #13151f;
    --surface3:  #1a1d2b;
    --border:    rgba(255,255,255,0.06);
    --border2:   rgba(255,255,255,0.1);
    --cyan:      #00d4ff;
    --cyan-dim:  rgba(0,212,255,0.15);
    --cyan-glow: rgba(0,212,255,0.3);
    --amber:     #f59e0b;
    --amber-dim: rgba(245,158,11,0.15);
    --green:     #10b981;
    --green-dim: rgba(16,185,129,0.15);
    --red:       #ef4444;
    --red-dim:   rgba(239,68,68,0.15);
    --purple:    #a855f7;
    --purple-dim:rgba(168,85,247,0.15);
    --text:      #e2e8f0;
    --text-2:    #94a3b8;
    --text-3:    #475569;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius:    10px;
    --radius-lg: 16px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .layout {
    display: flex;
    min-height: 100vh;
  }

  /* ── SIDEBAR ──────────────────────────────── */
  .sidebar {
    width: 240px;
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
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo-badge {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 36px; height: 36px;
    background: var(--cyan-dim);
    border: 1px solid var(--cyan-glow);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }

  .logo-text {
    font-family: var(--font-head);
    font-weight: 800;
    font-size: 15px;
    color: var(--text);
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .logo-sub {
    font-size: 9px;
    color: var(--cyan);
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-section {
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--text-3);
    text-transform: uppercase;
    padding: 12px 12px 6px;
    font-weight: 500;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 13px;
    color: var(--text-2);
    border: 1px solid transparent;
    position: relative;
  }

  .nav-item:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .nav-item.active {
    background: var(--cyan-dim);
    border-color: var(--cyan-glow);
    color: var(--cyan);
  }

  .nav-item.active .nav-icon { color: var(--cyan); }

  .nav-icon { font-size: 15px; width: 20px; text-align: center; }

  .nav-badge {
    margin-left: auto;
    background: var(--red);
    color: white;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 20px;
    font-weight: 700;
    min-width: 18px;
    text-align: center;
  }

  .nav-badge.cyan { background: var(--cyan); color: var(--bg); }

  .sidebar-footer {
    padding: 16px 12px;
    border-top: 1px solid var(--border);
  }

  .status-dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .status-label {
    font-size: 11px;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── MAIN ──────────────────────────────────── */
  .main {
    margin-left: 240px;
    flex: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    height: 60px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .topbar-title {
    font-family: var(--font-head);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .workspace-selector {
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 7px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    outline: none;
  }

  .page-content {
    flex: 1;
    padding: 32px;
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
    font-size: 20px;
    margin-bottom: 12px;
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
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    border-right: 1px solid var(--border);
    flex-shrink: 0;
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
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .status-pending_review { background: var(--amber-dim); color: var(--amber); }
  .status-approved { background: var(--green-dim); color: var(--green); }
  .status-published { background: var(--cyan-dim); color: var(--cyan); }
  .status-rejected { background: var(--red-dim); color: var(--red); }
  .status-failed { background: var(--red-dim); color: var(--red); }

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
    background: linear-gradient(90deg, var(--cyan), var(--amber));
    border-radius: 2px;
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

  .kr-desc { color: var(--text-2); }
  .kr-pct { color: var(--cyan); font-weight: 600; }

  .progress-bar {
    height: 6px;
    background: var(--surface3);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  /* ── GENERATOR FORM ─────────────────────────── */
  .form-group { margin-bottom: 20px; }

  .form-label {
    display: block;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .form-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 10px 14px;
    border-radius: var(--radius);
    outline: none;
    transition: border-color 0.15s;
  }

  .form-input:focus { border-color: var(--cyan); }

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
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    border: 1px solid var(--border2);
    cursor: pointer;
    transition: all 0.15s;
    background: var(--surface2);
    color: var(--text-2);
  }

  .niche-chip.selected {
    background: var(--cyan-dim);
    border-color: var(--cyan-glow);
    color: var(--cyan);
  }

  /* ── TOAST ───────────────────────────────────── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
  }

  .toast {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    padding: 14px 18px;
    font-size: 13px;
    max-width: 320px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .toast.success { border-left: 3px solid var(--green); }
  .toast.error   { border-left: 3px solid var(--red); }
  .toast.info    { border-left: 3px solid var(--cyan); }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }

  /* ── EMPTY STATE ─────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-3);
    text-align: center;
    gap: 12px;
  }

  .empty-icon { font-size: 40px; opacity: 0.5; }
  .empty-title { font-family: var(--font-head); font-size: 16px; color: var(--text-2); }
  .empty-desc  { font-size: 12px; max-width: 280px; line-height: 1.6; }

  /* ── FILTER TABS ─────────────────────────────── */
  .filter-tabs {
    display: flex;
    gap: 4px;
    background: var(--surface2);
    padding: 4px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .filter-tab {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--text-3);
    letter-spacing: 0.5px;
  }

  .filter-tab.active {
    background: var(--surface);
    color: var(--cyan);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* ── ACTIVITY FEED ───────────────────────────── */
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .activity-item:last-child { border-bottom: none; }

  .activity-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-top: 4px;
    flex-shrink: 0;
  }

  .activity-text { font-size: 12px; color: var(--text-2); line-height: 1.5; }
  .activity-time { font-size: 10px; color: var(--text-3); margin-top: 2px; }

  /* ── LOADING ─────────────────────────────────── */
  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border2);
    border-top-color: var(--cyan);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
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
const API_BASE = "http://localhost:8000/api";

const api = {
  async getQueue(workspaceId, status) {
    try {
      const params = status ? `?status=${status}&limit=20` : "?limit=20";
      const res = await fetch(`${API_BASE}/content/${workspaceId}/queue${params}`);
      if (!res.ok) throw new Error("API error");
      return await res.json();
    } catch { return null; }
  },
  async approveContent(workspaceId, contentId) {
    try {
      const res = await fetch(`${API_BASE}/content/${workspaceId}/queue/${contentId}/approve`, { method: "PATCH" });
      return res.ok;
    } catch { return false; }
  },
  async rejectContent(workspaceId, contentId) {
    try {
      const res = await fetch(`${API_BASE}/content/${workspaceId}/queue/${contentId}/reject`, { method: "PATCH" });
      return res.ok;
    } catch { return false; }
  },
  async generateContent(workspaceId, topic) {
    try {
      const res = await fetch(`${API_BASE}/content/${workspaceId}/generate?topic=${encodeURIComponent(topic)}`, { method: "POST" });
      return res.ok;
    } catch { return false; }
  },
  async getMetrics(workspaceId) {
    try {
      const res = await fetch(`${API_BASE}/metrics/${workspaceId}/summary`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { return null; }
  },
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
      <div className="stat-icon">{icon}</div>
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
function QueueItem({ item, onApprove, onReject, onRegenerate, loading }) {
  return (
    <div className="queue-card">
      <div className="queue-card-header">
        <div className="flex items-center gap-12">
          <StatusPill status={item.status} />
          <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-head)", fontWeight: 700 }}>
            {item.topic}
          </span>
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
        </div>
      </div>
      <div className="queue-card-body">
        <div className="queue-image-placeholder" style={{ background: item.gradient }}>
          <span style={{ fontSize: 50 }}>{item.emoji}</span>
        </div>
        <div className="queue-content">
          <div className="queue-text">{item.text}</div>
          <div className="queue-hashtags">
            {(item.hashtags || []).slice(0, 8).map(h => (
              <span key={h} className="hashtag-chip">#{h}</span>
            ))}
            {item.hashtags?.length > 8 && (
              <span className="hashtag-chip" style={{ color: "var(--text-3)" }}>+{item.hashtags.length - 8} más</span>
            )}
          </div>
          {item.cta && (
            <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span>👉</span>
              <span>{item.cta}</span>
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
          {item.status === "published" && item.platform_post_ids && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(item.platform_post_ids).map(([platform, postId]) => (
                <span key={platform} style={{ fontSize: 11, color: "var(--green)", background: "var(--green-dim)", padding: "3px 10px", borderRadius: 20 }}>
                  ✅ {platform}: {postId}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function OverviewView({ workspace }) {
  const m = MOCK_METRICS.summary;
  return (
    <div>
      <div className="grid-4 mb-24">
        <StatCard icon="❤️" value={m.total_likes.toLocaleString()} label="Likes esta semana" delta="+18% vs semana anterior" deltaUp accentColor="var(--red)" />
        <StatCard icon="💬" value={m.total_comments.toLocaleString()} label="Comentarios" delta="+12% vs semana anterior" deltaUp accentColor="var(--cyan)" />
        <StatCard icon="📤" value={m.total_shares.toLocaleString()} label="Compartidos" delta="+7% vs semana anterior" deltaUp accentColor="var(--purple)" />
        <StatCard icon="⚡" value={`${m.avg_engagement_rate}%`} label="Engagement rate" delta="Meta: 5.0%" deltaUp accentColor="var(--amber)" />
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Alcance diario</div>
              <div className="section-sub">Últimos 7 días</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_METRICS.chart}>
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

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Engagement rate</div>
              <div className="section-sub">% por día</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_METRICS.chart}>
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Engagement %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Actividad reciente</div>
          </div>
          {ACTIVITY_FEED.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
              <div>
                <div className="activity-text">{a.text}</div>
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Top posts de la semana</div>
          </div>
          {MOCK_METRICS.topPosts.map((p, i) => (
            <div key={i} className="metric-row">
              <div>
                <div style={{ fontSize: 13, marginBottom: 3 }}>{p.topic}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>❤️ {p.likes} likes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "var(--cyan)", fontWeight: 700, fontSize: 16 }}>{p.engagement}%</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>engagement</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: "14px", background: "var(--surface2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>PUBLICACIONES HOY</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[{h:"9:00 AM", color:"var(--green)", label:"✅ Pub."}, {h:"12:00 PM", color:"var(--cyan)", label:"⏳ Rev."}, {h:"6:00 PM", color:"var(--text-3)", label:"📋 Prog."}].map((s,i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px", background: "var(--surface3)", borderRadius: 8 }}>
                  <div style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{s.h}</div>
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
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState({});

  const filtered = filter === "all" ? queue : queue.filter(i => i.status === filter);
  const pendingCount = queue.filter(i => i.status === "pending_review").length;

  const handleApprove = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    await new Promise(r => setTimeout(r, 800));
    setQueue(q => q.map(i => i.id === id ? { ...i, status: "approved" } : i));
    toast("Post aprobado y en cola para publicación ✅", "success");
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleReject = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    await new Promise(r => setTimeout(r, 500));
    setQueue(q => q.map(i => i.id === id ? { ...i, status: "rejected" } : i));
    toast("Post rechazado", "error");
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleRegenerate = async (id) => {
    setLoading(l => ({ ...l, [id]: true }));
    toast("Regenerando contenido con IA... 🔄", "info");
    await new Promise(r => setTimeout(r, 2000));
    setQueue(q => q.filter(i => i.id !== id));
    toast("Nuevo contenido en la cola en ~2 minutos 🤖", "success");
    setLoading(l => ({ ...l, [id]: false }));
  };

  const handleApproveAll = async () => {
    const pendingIds = queue.filter(i => i.status === "pending_review").map(i => i.id);
    for (const id of pendingIds) await handleApprove(id);
  };

  return (
    <div>
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
        {pendingCount > 0 && (
          <button className="btn btn-success" onClick={handleApproveAll}>
            ✅ Aprobar todos ({pendingCount})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Sin contenido en esta vista</div>
          <div className="empty-desc">El sistema generará nuevos posts a las 7:00 AM automáticamente</div>
        </div>
      ) : (
        filtered.map(item => (
          <QueueItem
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onRegenerate={handleRegenerate}
            loading={loading[item.id]}
          />
        ))
      )}
    </div>
  );
}

const NICHES = [
  { key: "salud_natural", label: "🌿 Salud Natural" },
  { key: "suplementos", label: "💊 Suplementos" },
  { key: "bienestar", label: "🧘 Bienestar" },
  { key: "emprendimiento", label: "🚀 Emprendimiento" },
  { key: "motivacion", label: "🔥 Motivación" },
  { key: "lifestyle", label: "✨ Lifestyle" },
];

function GeneratorView({ workspace, toast }) {
  const [topic, setTopic] = useState("");
  const [niches, setNiches] = useState(workspace?.niches || ["salud_natural"]);
  const [tone, setTone] = useState("inspirador");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const toggleNiche = (key) => {
    setNiches(n => n.includes(key) ? n.filter(x => x !== key) : [...n, key]);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) { toast("Escribe un tema primero", "error"); return; }
    setGenerating(true);
    setResult(null);
    toast("Generando contenido con GPT-4o... 🤖", "info");
    await new Promise(r => setTimeout(r, 2500));
    setResult({
      text: `¿Sabías que el ${topic.toLowerCase()} puede transformar completamente tu calidad de vida? 🌟\n\nEn el mundo actual, cada vez más personas buscan alternativas naturales y efectivas para mejorar su bienestar. Y la ciencia nos da la razón.\n\nLos beneficios más importantes que debes conocer:\n\n✅ Mejora significativa en tu energía diaria\n✅ Reducción del estrés y la ansiedad\n✅ Mejor calidad del sueño\n✅ Sistema inmune más fuerte\n\nEl secreto está en la consistencia. No se trata de cambios radicales de un día para otro, sino de pequeños pasos que se acumulan con el tiempo.\n\n¿Estás listo para comenzar tu transformación? 🙌`,
      hashtags: ["bienestar","saludnatural","transformacion","habitos","vidasaludable","salud","bienestarmental","lifestyle","motivacion","cambio"],
      cta: "Deja un ❤️ si esto te motivó y comparte con alguien que lo necesite",
      image_prompt: `Premium health and wellness lifestyle photography showing ${topic}, vibrant and energetic, warm natural lighting, professional advertisement style`,
    });
    setGenerating(false);
    toast("¡Contenido generado exitosamente! ✨", "success");
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Generar post manual</div>
            <div className="section-sub">Crea contenido con IA en segundos</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tema del post</label>
          <input
            className="form-input"
            placeholder="Ej: beneficios del magnesio, rutina matutina, omega-3..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nichos activos</label>
          <div className="niche-grid">
            {NICHES.map(n => (
              <div
                key={n.key}
                className={`niche-chip ${niches.includes(n.key) ? "selected" : ""}`}
                onClick={() => toggleNiche(n.key)}
              >
                {n.label}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tono del contenido</label>
          <select className="form-input workspace-selector" value={tone} onChange={e => setTone(e.target.value)} style={{ width: "100%" }}>
            {["inspirador","educativo","urgente","emocional","divertido","profesional"].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Plataformas objetivo</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["📘 Facebook","📸 Instagram"].map(p => (
              <div key={p} className="niche-chip selected" style={{ cursor: "default" }}>{p}</div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? <><span className="spinner" /> Generando con GPT-4o...</> : "⚡ Generar contenido"}
        </button>
      </div>

      <div className="card">
        {!result && !generating && (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <div className="empty-title">Listo para generar</div>
            <div className="empty-desc">Escribe un tema y presiona generar. El contenido aparecerá aquí en segundos.</div>
          </div>
        )}
        {generating && (
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>🤖</div>
            <div className="empty-title">GPT-4o trabajando...</div>
            <div className="empty-desc">Analizando tendencias, generando texto, hashtags y prompt de imagen</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {[0,150,300].map(d => (
                <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cyan)", animation: `pulse 1s ease ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
        {result && (
          <div>
            <div className="section-header">
              <div className="section-title">✨ Resultado generado</div>
              <button className="btn btn-success btn-sm">📋 Agregar a cola</button>
            </div>
            <div className="form-group">
              <label className="form-label">Texto del post</label>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14, fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-line", maxHeight: 220, overflowY: "auto" }}>
                {result.text}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">CTA</label>
              <div style={{ background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--radius)", padding: 12, fontSize: 13, color: "var(--amber)" }}>
                👉 {result.cta}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hashtags ({result.hashtags.length})</label>
              <div className="queue-hashtags">
                {result.hashtags.map(h => <span key={h} className="hashtag-chip">#{h}</span>)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Prompt de imagen (DALL-E 3)</label>
              <div style={{ background: "var(--purple-dim)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "var(--radius)", padding: 12, fontSize: 11, color: "var(--purple)", fontStyle: "italic", lineHeight: 1.5 }}>
                🎨 {result.image_prompt}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricsView() {
  return (
    <div>
      <div className="grid-3 mb-24">
        <StatCard icon="👥" value="18,430" label="Alcance total semanal" delta="+24% vs semana anterior" deltaUp accentColor="var(--cyan)" />
        <StatCard icon="📊" value="4.7%" label="Engagement rate promedio" delta="Meta: 5.0%" deltaUp accentColor="var(--amber)" />
        <StatCard icon="📢" value="21" label="Posts publicados esta semana" delta="Meta: 21 ✅" deltaUp accentColor="var(--green)" />
      </div>

      <div className="card mb-24">
        <div className="section-header">
          <div>
            <div className="section-title">Likes diarios</div>
            <div className="section-sub">Últimos 7 días</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MOCK_METRICS.chart} barSize={32}>
            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="likes" fill="var(--cyan)" radius={[4,4,0,0]} name="Likes" opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-header"><div className="section-title">Desglose por plataforma</div></div>
          {[
            { platform: "📘 Facebook", likes: 1240, reach: 8100, eng: "4.2%", color: "var(--cyan)" },
            { platform: "📸 Instagram", likes: 1607, reach: 10330, eng: "5.1%", color: "var(--purple)" },
          ].map((p, i) => (
            <div key={i} className="metric-row">
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.platform}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>❤️ {p.likes} likes · 👥 {p.reach} alcance</div>
              </div>
              <div style={{ color: p.color, fontWeight: 800, fontSize: 20, fontFamily: "var(--font-head)" }}>{p.eng}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-header"><div className="section-title">Mejor horario de publicación</div></div>
          {[
            { hour: "9:00 AM", engagement: 4.2, posts: 7 },
            { hour: "6:00 PM", engagement: 6.1, posts: 7 },
            { hour: "12:00 PM", engagement: 3.8, posts: 7 },
          ].map((h, i) => (
            <div key={i} className="metric-row">
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: i === 1 ? "var(--amber)" : "var(--text)" }}>{h.hour} {i === 1 ? "⭐ MEJOR" : ""}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{h.posts} posts publicados</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--cyan)", fontFamily: "var(--font-head)" }}>{h.engagement}%</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>engagement</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OKRView() {
  return (
    <div>
      <div className="grid-3 mb-24">
        <StatCard icon="🎯" value="2" label="OKRs activos" accentColor="var(--cyan)" />
        <StatCard icon="📈" value="74%" label="Progreso promedio" delta="+8% esta semana" deltaUp accentColor="var(--green)" />
        <StatCard icon="⚠️" value="1" label="KRs en riesgo" accentColor="var(--amber)" />
      </div>
      {MOCK_OKRS.map(okr => <OKRCard key={okr.id} okr={okr} />)}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-header">
          <div className="section-title">💡 Recomendaciones del sistema</div>
        </div>
        {[
          { icon: "🔴", text: "La tasa de aprobación (73%) está por debajo del objetivo del 80%. Considera reducir el tiempo de revisión o activar el modo autónomo para posts de baja complejidad.", type: "danger" },
          { icon: "🟡", text: "El engagement del jueves y viernes superó el 6%. Programa más posts en esos días para maximizar el KR2.", type: "warning" },
          { icon: "🟢", text: "El alcance promedio (2,630) ya supera la meta de 2,000. Considera aumentar la meta para seguir creciendo.", type: "success" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: 18 }}>{r.icon}</span>
            <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ workspaces, currentWorkspace, setCurrentWorkspace }) {
  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Workspaces</div>
            <button className="btn btn-primary btn-sm">+ Nuevo</button>
          </div>
          {workspaces.map(ws => (
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
        <div className="card">
          <div className="section-header"><div className="section-title">Configuración del sistema</div></div>
          {[
            { label: "Publisher Mode", value: "MOCK (desarrollo)", color: "var(--amber)" },
            { label: "Review Gate", value: "Dashboard activo", color: "var(--green)" },
            { label: "Review Timeout", value: "4 horas → auto-publicar", color: "var(--cyan)" },
            { label: "OpenAI Model", value: "GPT-4o", color: "var(--purple)" },
            { label: "Imagen Tier 1", value: "DALL-E 3", color: "var(--cyan)" },
            { label: "Scheduler", value: "Celery Beat activo", color: "var(--green)" },
          ].map((s, i) => (
            <div key={i} className="metric-row">
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{s.label}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",  icon: "⬡",  label: "Overview",     section: "PRINCIPAL" },
  { id: "queue",     icon: "◈",  label: "Cola de posts", section: null, badge: "pending" },
  { id: "generator", icon: "✦",  label: "Generador",    section: null },
  { id: "metrics",   icon: "◎",  label: "Métricas",     section: "ANÁLISIS" },
  { id: "okrs",      icon: "◐",  label: "OKRs / Metas", section: null },
  { id: "settings",  icon: "⚙",  label: "Configuración",section: "SISTEMA" },
];

const VIEW_TITLES = {
  overview: "Mission Control",
  queue: "Cola de contenido",
  generator: "Generador IA",
  metrics: "Métricas",
  okrs: "OKRs & Metas",
  settings: "Configuración",
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("overview");
  const [workspace, setWorkspace] = useState(MOCK_WORKSPACES[0]);
  const { toasts, toast } = useToast();

  const pendingCount = MOCK_QUEUE.filter(q => q.status === "pending_review").length;
  let lastSection = null;

  return (
    <>
      <FontLink />
      <style>{CSS}</style>
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-badge">
              <div className="logo-icon">🤖</div>
              <div>
                <div className="logo-text">SocialAI</div>
                <div className="logo-sub">Command Center</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => {
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
            <div className="status-label">
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
                value={workspace.id}
                onChange={e => setWorkspace(MOCK_WORKSPACES.find(w => w.id === e.target.value))}
              >
                {MOCK_WORKSPACES.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
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
            {view === "queue"     && <QueueView workspace={workspace} toast={toast} />}
            {view === "generator" && <GeneratorView workspace={workspace} toast={toast} />}
            {view === "metrics"   && <MetricsView />}
            {view === "okrs"      && <OKRView />}
            {view === "settings"  && <SettingsView workspaces={MOCK_WORKSPACES} currentWorkspace={workspace} setCurrentWorkspace={setWorkspace} />}
          </div>
        </main>

        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
