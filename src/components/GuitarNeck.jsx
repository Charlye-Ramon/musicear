import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, GUITAR_OPEN_SEMITONES, GUITAR_STRING_NAMES } from "../constants/music";

const DOT_FRETS = [3, 5, 7, 9, 12];

export default function GuitarNeck({ highlightNotes = [], frets = 12, onNoteClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{
        display: "inline-block",
        background: "linear-gradient(180deg, #2a1a0a 0%, #1e1206 100%)",
        border: `2px solid #5a3a18`,
        borderRadius: 10,
        padding: "10px 0",
        minWidth: 520,
      }}>
        {/* Fret numbers header */}
        <div style={{ display: "flex", paddingLeft: 36, marginBottom: 6 }}>
          {Array.from({ length: frets }, (_, f) => (
            <div key={f} style={{
              width: 44, textAlign: "center",
              fontSize: 9, color: DOT_FRETS.includes(f+1) ? C.gold : C.silverDim,
              fontWeight: DOT_FRETS.includes(f+1) ? 700 : 400,
            }}>
              {f + 1}
            </div>
          ))}
        </div>

        {/* Strings */}
        {GUITAR_STRING_NAMES.map((stringName, si) => {
          const openSemitone = GUITAR_OPEN_SEMITONES[si];
          return (
            <div key={si} style={{ display: "flex", alignItems: "center", height: 32 }}>
              {/* Open string label */}
              <div style={{
                width: 36, textAlign: "center",
                fontSize: 11, fontWeight: 700,
                color: highlightNotes.includes(NOTES[openSemitone % 12]) ? C.gold : C.silver,
                borderRight: `3px solid #8B6914`,
                flexShrink: 0,
              }}>
                {stringName}
              </div>

              {/* Frets */}
              {Array.from({ length: frets }, (_, f) => {
                const noteIdx = (openSemitone + f + 1) % 12;
                const note = NOTES[noteIdx];
                const highlighted = highlightNotes.includes(note);
                const isDot = DOT_FRETS.includes(f + 1) && si === 2;
                const isDoubleDot = f + 1 === 12 && (si === 1 || si === 3);

                return (
                  <div
                    key={f}
                    onClick={() => onNoteClick?.(note)}
                    style={{
                      width: 44, height: 32,
                      borderRight: `1px solid #6B4E14`,
                      position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: onNoteClick ? "pointer" : "default",
                    }}
                  >
                    {/* String line */}
                    <div style={{
                      position: "absolute", left: 0, right: 0, top: "50%",
                      height: si === 0 || si === 5 ? 1 : si === 1 || si === 4 ? 1.5 : 2,
                      background: `linear-gradient(90deg, #C8A96E44, #C8A96E88, #C8A96E44)`,
                      transform: "translateY(-50%)",
                    }} />

                    {/* Position dot */}
                    {(isDot || isDoubleDot) && !highlighted && (
                      <div style={{
                        position: "absolute",
                        width: 6, height: 6, borderRadius: "50%",
                        background: C.silverDim + "55",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1,
                      }} />
                    )}

                    {/* Highlighted note */}
                    {highlighted && (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: `radial-gradient(circle at 35% 35%, ${C.goldLight}, ${C.gold})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 7, fontWeight: 800, color: C.black,
                        zIndex: 2, position: "relative",
                        boxShadow: `0 0 10px ${C.gold}99, 0 0 20px ${C.gold}44`,
                        animation: "pulse 2s ease-in-out infinite",
                        flexShrink: 0,
                      }}>
                        {NOTE_ES[note]?.slice(0, 3)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
