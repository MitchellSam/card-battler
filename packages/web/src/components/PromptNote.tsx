// PromptNote: the sticky-note prompt (one at a time). Generic shell; the
// content (title, body, buttons) is provided by App from engine state.

export interface NoteButton {
  label: string;
  onClick: () => void;
  tone?: 'blue' | 'red' | 'green' | 'yellow' | 'plain';
  disabled?: boolean;
}

export interface PromptNoteProps {
  title: string;
  body?: React.ReactNode;
  buttons?: NoteButton[];
  children?: React.ReactNode;
}

export function PromptNote({ title, body, buttons = [], children }: PromptNoteProps) {
  return (
    <div className="note">
      <div className="marker" style={{ fontSize: 17, color: 'var(--red)', marginBottom: 6 }}>
        {title}
      </div>
      {body !== undefined && (
        <div style={{ fontSize: 16, lineHeight: 1.3, marginBottom: 9 }}>{body}</div>
      )}
      {children}
      {buttons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {buttons.map((b) => (
            <button
              key={b.label}
              className={`note-btn ${b.tone && b.tone !== 'plain' ? b.tone : ''}`}
              onClick={b.onClick}
              disabled={b.disabled}
              style={{ opacity: b.disabled ? 0.5 : 1 }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
