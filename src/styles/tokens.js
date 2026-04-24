export const C = {
  purple: "#391E4E",
  purpleLight: "#4d2870",
  purpleDark: "#240f36",
  gold: "#D4A413",
  goldLight: "#e8bb2a",
  silver: "#C0C0C0",
  silverDim: "#8a8a8a",
  black: "#090101",
  bg: "#0e0614",
  card: "#1a0d24",
  cardBorder: "#2e1745",
};

export const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { font-size: 16px; }

  body {
    background: #0e0614;
    color: #C0C0C0;
    font-family: 'Montserrat', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #240f36; }
  ::-webkit-scrollbar-thumb { background: #D4A413; border-radius: 2px; }

  /* ── Animations ── */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 #D4A41344} 50%{box-shadow:0 0 0 10px #D4A41300} }
  @keyframes glow     { 0%,100%{text-shadow:0 0 8px #D4A41366} 50%{text-shadow:0 0 28px #D4A413cc,0 0 56px #D4A41344} }
  @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes waveBar  { 0%,100%{height:4px} 50%{height:22px} }
  @keyframes noteFloat{ 0%{transform:translateY(0) rotate(-10deg) scale(1);opacity:1} 100%{transform:translateY(-80px) rotate(20deg) scale(0.5);opacity:0} }
  @keyframes chordPop { 0%{transform:scale(0.8) translateY(6px);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1) translateY(0);opacity:1} }
  @keyframes slideRight{from{transform:translateX(-16px);opacity:0} to{transform:translateX(0);opacity:1}}
  @keyframes theorySectionIn{from{opacity:0;transform:translateY(30px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes dragPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }

  .fade-up   { animation: fadeUp 0.45s ease both; }
  .fade-in   { animation: fadeIn 0.35s ease both; }
  .note-float{ animation: noteFloat 1.4s ease forwards; }
  .chord-pop { animation: chordPop 0.35s cubic-bezier(.34,1.56,.64,1) both; }
  .dragging  { animation: dragPulse 0.8s ease infinite; opacity:0.7; transform:scale(0.95); }

  /* ── Buttons ── */
  .btn-gold {
    background: linear-gradient(135deg,#D4A413,#e8bb2a);
    color: #090101; border: none; border-radius: 8px;
    padding: 10px 20px;
    font-family:'Montserrat',sans-serif; font-weight:700; font-size:13px;
    cursor:pointer; transition:all 0.2s;
    letter-spacing:0.04em; text-transform:uppercase;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-gold:hover  { filter:brightness(1.12); transform:translateY(-2px); box-shadow:0 6px 20px #D4A41344; }
  .btn-gold:active { transform:translateY(0); }
  .btn-gold:disabled { opacity:0.45; cursor:not-allowed; transform:none; }

  .btn-outline {
    background:transparent; color:#C0C0C0;
    border:1px solid #2e1745; border-radius:8px;
    padding:10px 20px;
    font-family:'Montserrat',sans-serif; font-weight:600; font-size:13px;
    cursor:pointer; transition:all 0.2s; letter-spacing:0.03em;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-outline:hover { border-color:#D4A41388; color:#D4A413; }

  .btn-purple {
    background:linear-gradient(135deg,#391E4E,#4d2870);
    color:#C0C0C0; border:1px solid #D4A41333;
    border-radius:8px; padding:10px 20px;
    font-family:'Montserrat',sans-serif; font-weight:600; font-size:13px;
    cursor:pointer; transition:all 0.2s; letter-spacing:0.03em;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-purple:hover { border-color:#D4A41388; transform:translateY(-1px); }

  /* ── Cards ── */
  .card {
    background:#1a0d24; border:1px solid #2e1745;
    border-radius:16px; padding:20px;
  }
  @media (max-width:480px) {
    .card { padding:14px; border-radius:12px; }
  }

  /* ── Tags ── */
  .tag {
    display:inline-block; background:#240f36; border:1px solid #2e1745;
    color:#8a8a8a; font-size:10px; font-weight:700;
    letter-spacing:0.1em; text-transform:uppercase;
    border-radius:4px; padding:3px 8px;
  }
  .tag.gold { background:#D4A41318; border-color:#D4A41355; color:#D4A413; }
  .tag.purple{ background:#391E4E66; border-color:#4d2870; color:#c9a0ff; }

  select, input, textarea {
    font-family:'Montserrat',sans-serif !important;
    font-size:14px !important;
  }

  /* ── Mobile tap targets ── */
  @media (max-width:640px) {
    .btn-gold, .btn-outline, .btn-purple {
      padding: 12px 16px;
      font-size: 12px;
      min-height: 44px;
    }
    select { min-height:44px; }
  }
`;