import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '@platform/ui';
import {
  REPORT_CATEGORIES, REPORT_NOTE_LIMIT, buildScenarioReportRequest,
  noteMayContainRealPatientInformation, type ReportCategory, type ScenarioReportContext,
  type ScenarioReportRecentContext,
} from './contracts';
import {
  loadTurnstile, renderTurnstile, reportConfig, submitScenarioReport,
  type ReportServiceConfig, type TurnstileApi,
} from './client';
import './reporting.css';

export function ScenarioProblemReport({ context, openRequest, onOpen, onClose, floating = false }: {
  readonly context: ScenarioReportContext;
  /** A changing request id opens the shared dialog from a nested scenario surface. */
  readonly openRequest?: number;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  /**
   * Pin the trigger to the viewport corner.
   *
   * Only the cockpit may do this. It is a fixed-height layout whose own controls
   * already reserve a strip along the bottom edge, so a pinned trigger has
   * somewhere to live that nothing else occupies. Every other surface here is a
   * scrolling document, and a pinned trigger on a scrolling document sits on top
   * of whatever happens to scroll under it — which was nine separate links and
   * buttons on a 375px phone, two of them covered almost completely.
   */
  readonly floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [note, setNote] = useState('');
  const [recentContext, setRecentContext] = useState<ScenarioReportRecentContext | null>(null);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [service, setService] = useState<ReportServiceConfig | null>(null);
  const reportHost = useRef<HTMLDivElement>(null);
  const turnstileHost = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    // `Done`, not the corner close. Both dismiss the dialog, but the first
    // control in the markup is now the corner X, and landing on it after a
    // successful send announces the way out rather than the confirmation.
    if (sent) {
      reportHost.current
        ?.querySelector<HTMLButtonElement>('[role="dialog"] button:not([data-dialog-dismiss])')
        ?.focus();
    }
  }, [sent]);

  useEffect(() => {
    if (openRequest === undefined) return;
    setOpen(true);
    onOpenRef.current?.();
  }, [openRequest]);

  useEffect(() => {
    if (!open || sent) return undefined;
    let active = true;
    setStatus('Preparing secure submission…');
    void reportConfig().then(async (config) => [config, await loadTurnstile()] as const).then(([config, api]) => {
      if (!active || !turnstileHost.current) return;
      setService(config);
      const id = renderTurnstile(api, turnstileHost.current, config.sitekey, {
        ready: (value) => { if (active) { setToken(value); setStatus('Ready to send.'); } },
        expired: () => { if (active) { setToken(''); setStatus('Security check expired. Please try it again.'); } },
        error: () => { if (active) { setToken(''); setStatus('Security check unavailable. Please try again later.'); } },
      });
      widget.current = { api, id };
      setStatus('Complete the security check to send.');
    }).catch(() => {
      if (active) setStatus('Reporting is unavailable on this host. Your practice session still works normally.');
    });
    return () => {
      active = false;
      if (widget.current) {
        try { widget.current.api.remove(widget.current.id); } catch { /* Removing the modal is sufficient. */ }
        widget.current = null;
      }
    };
  }, [open, sent]);

  const close = () => {
    if (sending) return;
    setOpen(false);
    setToken('');
    setStatus('');
    setSending(false);
    setSent(false);
    setNote('');
    setCategory('');
    setRecentContext(null);
    setService(null);
    onClose?.();
  };

  const remainingNoteCharacters = REPORT_NOTE_LIMIT - note.length;
  const noteAnnouncement = remainingNoteCharacters === 0
    ? `No characters remaining. The note is at its ${REPORT_NOTE_LIMIT} character limit.`
    : remainingNoteCharacters === 20 ? '20 characters remaining.' : '';

  const send = async () => {
    if (!token || !category || sending || noteMayContainRealPatientInformation(note)) return;
    setSending(true);
    setStatus('Sending report…');
    try {
      const queued = await submitScenarioReport(
        buildScenarioReportRequest(context, category, note, token, recentContext));
      setSending(false);
      setSent(true);
      setStatus(queued
        ? 'Thank you. This is in the weekly review queue, and every correction that lands is published in the corrections log.'
        : 'Thanks. This one did not join the queue, either because it matches a report already filed today or because the queue is full. Nothing is wrong on your side. If it still looks wrong tomorrow, please send it again.');
    } catch {
      setToken('');
      setSending(false);
      setStatus('Report not sent. Please try again later.');
      if (widget.current) {
        try { widget.current.api.reset(widget.current.id); } catch { /* Keep send disabled. */ }
      }
    }
  };

  return (
    <div className={floating ? 'problem-report problem-report--floating' : 'problem-report'} ref={reportHost}>
      {/* "Report a problem" framed this as a complaints box, which is not what it
          is. Every correction that arrives here is the only mechanism by which an
          unsigned corpus gets better, and the people who can send one are
          colleagues rather than customers. The control says so. */}
      <Button compact variant="ghost" aria-label="Help us improve this"
        onClick={() => { setOpen(true); onOpen?.(); }}>
        <span className="problem-report__label-long">Help us improve this</span>
        <span className="problem-report__label-short" aria-hidden="true">Improve</span>
      </Button>
      <Modal
        open={open}
        cornerClose
        title="Help us improve this"
        onClose={close}
        dismissible={!sending}
        footer={sent
          ? <Button variant="primary" onClick={close}>Done</Button>
          : <>
              <Button onClick={close} disabled={sending}>Cancel</Button>
              <Button variant="primary" onClick={() => { void send(); }}
                disabled={!token || !category || sending || noteMayContainRealPatientInformation(note)}>
                {sending ? 'Sending…' : 'Send report'}
              </Button>
            </>}
      >
        {/* One live region, mounted before any status text exists: a region inserted into the DOM
            already containing its message is not reliably announced, so success would go unheard. */}
        <p role="status" aria-live="polite" className="field__hint">{status}</p>
        {sent ? null : (
          <div className="problem-report__form">
            <p>
              This is an open-source simulator and you are the review it has not had yet. Tell us
              what looks wrong in this fictional scenario.
            </p>
            {/* The one sentence that changes what arrives here.
                A report saying "the pressure is wrong" cannot be acted on. A
                report saying "it should be nearer 60 and here is the paper" can
                be, and can be shown to have been. Asking for the number and the
                source is the difference between a complaint and a correction. */}
            <p className="problem-report__invitation">
              If you know the value it should be, or how a real patient would behave, put it in the
              note with a source if you have one. That is what lets us change the model and show
              why, in public, with your citation as the reason.
            </p>
            <p className="field__hint">
              Do not include a patient name or any real clinical information.{' '}
              <a href={service?.privacyUrl ?? '/privacy#problem-reports'}>
                How reports stay private
              </a>.
            </p>
            {service && <p className="field__hint">Reviewed by {service.maintainer}.</p>}
            <label className="field" htmlFor="problem-report-category">
              <span className="field__label">Kind of problem</span>
              <select
                id="problem-report-category"
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value as ReportCategory)}
              >
                <option value="" disabled>Choose one</option>
                {REPORT_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field" htmlFor="problem-report-note">
              <span className="field__label" id="problem-report-note-label">What should it be? (optional)</span>
              <textarea
                id="problem-report-note"
                className="field__input"
                rows={3}
                maxLength={REPORT_NOTE_LIMIT}
                autoComplete="off"
                spellCheck={false}
                // The counter and the warning live inside this label for layout. Without an
                // explicit labelledby the accessible name would be the label's whole text
                // content, so it would change on every keystroke and again when the warning
                // appeared — narrating the field's name instead of its value.
                aria-labelledby="problem-report-note-label"
                aria-describedby="problem-report-count"
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, REPORT_NOTE_LIMIT))}
                placeholder="e.g. closer to 60 mmHg. Reves 2010, table 2."
              />
              <span id="problem-report-count" className="field__hint problem-report__count">
                {note.length} / {REPORT_NOTE_LIMIT}
              </span>
              {noteMayContainRealPatientInformation(note) && (
                <span className="field__hint problem-report__warning" role="alert">
                  This may describe a real patient or include contact information. Remove it before sending.
                </span>
              )}
              {/* Running out of room is silent otherwise: the textarea simply stops accepting
                  characters. Announced once on the way down and once at the limit, rather than
                  on every keystroke. */}
              <span className="visually-hidden" role="status" aria-live="polite">{noteAnnouncement}</span>
            </label>
            {context.collectRecentContext && (
              <label className="problem-report__context-choice">
                <input
                  type="checkbox"
                  checked={recentContext !== null}
                  onChange={(event) => setRecentContext(event.target.checked
                    ? context.collectRecentContext?.() ?? null : null)}
                />
                Include the last 20 simulated actions and a bounded patient/equipment snapshot
              </label>
            )}
            <details className="problem-report__preview">
              <summary>Review what will be sent</summary>
              <dl>
                <div><dt>Scenario</dt><dd>{context.scenarioId}</dd></div>
                <div><dt>Version</dt><dd>{context.contentVersion}</dd></div>
                <div><dt>Where</dt><dd>{context.surface}</dd></div>
                <div><dt>Simulated tick</dt><dd>{context.simulatedTick}</dd></div>
                <div><dt>Category</dt><dd>{category || 'Not chosen'}</dd></div>
                <div><dt>Reviewed by</dt><dd>{service?.maintainer ?? 'Unavailable until this host is verified'}</dd></div>
                <div><dt>Recent context</dt><dd>{recentContext ? 'Included' : 'Not included'}</dd></div>
              </dl>
              {recentContext && (
                <pre className="problem-report__context-preview">{JSON.stringify(recentContext, null, 2)}</pre>
              )}
              <p className="field__hint">No debrief writing, practice history, identity, browser details, or real-world time is included.</p>
            </details>
            <div ref={turnstileHost} className="problem-report__turnstile" />
          </div>
        )}
      </Modal>
    </div>
  );
}
