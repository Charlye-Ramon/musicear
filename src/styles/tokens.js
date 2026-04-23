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

  body {
    background: ${C.bg};
    color: ${C.silver};
    font-family: 'Montserrat', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.purpleDark}; }
  ::-webkit-scrollbar-thumb { background: ${C.gold}; border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse {
    0%,100% { box-shadow: 0 0 0 0 ${C.gold}44; }
    50%      { box-shadow: 0 0 0 10px ${C.gold}00; }
  }
  @keyframes glow {
    0%,100% { text-shadow: 0 0 8px ${C.gold}66; }
    50%      { text-shadow: 0 0 28px ${C.gold}cc, 0 0 56px ${C.gold}44; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); } to { transform: rotate(360deg); }
  }
  @keyframes waveBar {
    0%,100% { height: 4px; } 50% { height: 22px; }
  }
  @keyframes noteFloat {
    0%   { transform: translateY(0) rotate(-10deg) scale(1); opacity: 1; }
    100% { transform: translateY(-80px) rotate(20deg) scale(0.5); opacity: 0; }
  }
  @keyframes chordPop {
    0%   { transform: scale(0.8) translateY(6px); opacity: 0; }
    60%  { transform: scale(1.05); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes ripple {
    0%   { transform: scale(0); opacity: 0.6; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes slideRight {
    from { transform: translateX(-16px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes theorySectionIn {
    from { opacity: 0; transform: translateY(30px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .fade-up  { animation: fadeUp 0.45s ease both; }
  .fade-in  { animation: fadeIn 0.35s ease both; }
  .note-float { animation: noteFloat 1.4s ease forwards; }
  .chord-pop  { animation: chordPop 0.35s cubic-bezier(.34,1.56,.64,1) both; }

  .btn-gold {
    background: linear-gradient(135deg, ${C.gold}, ${C.goldLight});
    color: ${C.black};
    border: none; border-radius: 8px;
    padding: 10px 22px;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700; font-size: 13px;
    cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .btn-gold:hover  { filter: brightness(1.12); transform: translateY(-2px); box-shadow: 0 6px 20px ${C.gold}44; }
  .btn-gold:active { transform: translateY(0); }
  .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-outline {
    background: transparent; color: ${C.silver};
    border: 1px solid ${C.cardBorder}; border-radius: 8px;
    padding: 10px 22px;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.04em;
  }
  .btn-outline:hover { border-color: ${C.gold}88; color: ${C.gold}; }

  .btn-purple {
    background: linear-gradient(135deg, ${C.purple}, ${C.purpleLight});
    color: ${C.silver}; border: 1px solid ${C.gold}33;
    border-radius: 8px; padding: 10px 22px;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.04em;
  }
  .btn-purple:hover { border-color: ${C.gold}88; transform: translateY(-1px); }

  .card {
    background: ${C.card};
    border: 1px solid ${C.cardBorder};
    border-radius: 16px; padding: 24px;
  }

  .tag {
    display: inline-block;
    background: ${C.purpleDark};
    border: 1px solid ${C.cardBorder};
    color: ${C.silverDim};
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 4px; padding: 3px 8px;
  }
  .tag.gold {
    background: ${C.gold}18;
    border-color: ${C.gold}55;
    color: ${C.gold};
  }
  .tag.purple {
    background: ${C.purple}66;
    border-color: ${C.purpleLight};
    color: #c9a0ff;
  }

  select, input {
    font-family: 'Montserrat', sans-serif !important;
  }
`;
