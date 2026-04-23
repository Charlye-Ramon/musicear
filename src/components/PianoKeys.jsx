import { C } from "../styles/tokens";
import { NOTE_ES } from "../constants/music";

const WHITE_NOTES = ["C","D","E","F","G","A","B"];
const BLACK_NOTES = { "C#":0, "D#":1, "F#":3, "G#":4, "A#":5 };

export default function PianoKeys({ highlightNotes = [], onNoteClick, octaves = [3,4] }) {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0 4px" }}>
      <div style={{ display: "flex", gap: 2, width: "fit-content" }}>
        {octaves.map(oct =>
          WHITE_NOTES.map((w) => {
            const isHighlighted = highlightNotes.includes(w);
            const blackNote = Object.entries(BLACK_NOTES).find(([n]) => n.startsWith(w) && n.length > 1 && n[0] === w)?.[0];
            const isBlackHighlighted = blackNote && highlightNotes.includes(blackNote);

            return (
              <div key={`${w}${oct}`} style={{ position: "relative" }}>
                {/* White key */}
                <div
                  onClick={() => onNoteClick?.(w)}
                  style={{
                    width: 34, height: 96,
                    background: isHighlighted
                      ? `linear-gradient(180deg, ${C.gold} 0%, ${C.goldLight} 100%)`
                      : "linear-gradient(180deg, #f5f3ee 0%, #e8e4da 100%)",
                    border: `1px solid #bbb`,
                    borderRadius: "0 0 6px 6px",
                    transition: "background 0.25s, box-shadow 0.25s",
                    boxShadow: isHighlighted
                      ? `0 0 14px ${C.gold}99, inset 0 -4px 8px ${C.gold}44`
                      : "inset 0 -4px 8px rgba(0,0,0,0.08)",
                    cursor: onNoteClick ? "pointer" : "default",
                    position: "relative", zIndex: 1,
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    paddingBottom: 6,
                  }}
                >
                  {isHighlighted && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: C.black }}>
                      {NOTE_ES[w]}
                    </span>
                  )}
                </div>

                {/* Black key */}
                {blackNote && (
                  <div
                    onClick={() => onNoteClick?.(blackNote)}
                    style={{
                      position: "absolute",
                      top: 0, left: 22, zIndex: 2,
                      width: 22, height: 60,
                      background: isBlackHighlighted
                        ? `linear-gradient(180deg, ${C.gold}, #a07800)`
                        : `linear-gradient(180deg, ${C.black} 0%, #1a1a1a 100%)`,
                      borderRadius: "0 0 4px 4px",
                      border: `1px solid ${isBlackHighlighted ? C.gold : "#333"}`,
                      boxShadow: isBlackHighlighted
                        ? `0 0 12px ${C.gold}99`
                        : "2px 4px 8px rgba(0,0,0,0.5)",
                      cursor: onNoteClick ? "pointer" : "default",
                      transition: "background 0.25s, box-shadow 0.25s",
                      display: "flex", alignItems: "flex-end", justifyContent: "center",
                      paddingBottom: 4,
                    }}
                  >
                    {isBlackHighlighted && (
                      <span style={{ fontSize: 7, fontWeight: 800, color: C.black }}>
                        {NOTE_ES[blackNote]?.slice(0,3)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
