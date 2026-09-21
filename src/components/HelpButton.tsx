import { useState } from 'react';

const FAQS = [
  {
    q: 'How do I create a task?',
    a: 'Click "+ New task" on the dashboard, fill in a title (required), and optionally a description, status, priority and due date, then click "Create task".',
  },
  {
    q: 'How do I move a task between columns?',
    a: 'Drag any task card and drop it into To do, In progress, or Done. You can also click on the card and change its Status dropdown directly.',
  },
  {
    q: 'How do I edit or delete a task?',
    a: 'Click anywhere on a task card to open the edit dialog. You can edit title, description, priority, or due date, or click "Delete" to permanently remove it.',
  },
  {
    q: 'What does the "Live" indicator mean?',
    a: 'Your board updates in real time over a WebSocket connection. If you have TaskFlow open in two tabs or browsers, changes in one appear instantly in the other.',
  },
  {
    q: 'How do I switch between light and dark theme?',
    a: 'Use the sun/moon toggle in the sidebar (or top corner on the login screen). Your choice is saved automatically.',
  },
  {
    q: 'Is my data private and persistent?',
    a: 'Yes — every task is securely tied to your user account and token. Data is saved in the server storage and persists across server restarts.',
  },
];

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        id="help-fab-btn"
        className="help-fab"
        onClick={() => setOpen(true)}
        aria-label="Help and FAQ"
        title="Help & FAQ"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.3 9.2a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.2 1-1.2 2" />
          <circle cx="12" cy="17" r="0.4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div id="help-modal-backdrop" className="modal-backdrop" onClick={() => setOpen(false)}>
          <div id="help-modal" className="modal help-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Help &amp; FAQ</h3>
            <div className="help-list">
              {FAQS.map((item) => (
                <div className="help-item" key={item.q}>
                  <div className="help-q">{item.q}</div>
                  <div className="help-a">{item.a}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                id="help-modal-got-it"
                className="btn-primary"
                onClick={() => setOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
