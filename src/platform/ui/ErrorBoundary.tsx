/**
 * The last line of defence (platform/delivery → the application degrades
 * visibly rather than silently).
 *
 * Without one of these a single render error unmounts the entire tree and the
 * learner gets a white page. They cannot tell whether the site is broken, their
 * network is broken, or they did something wrong — and the report that reaches
 * the maintainer is "it didn't work", which is unactionable.
 *
 * This catches the error, keeps the page, says plainly what happened, and gives
 * the learner the two things that actually recover a stuck browser application:
 * reload, and clear the stored state that may have caused it. It also shows the
 * error text, because the person reading it is more likely to be a nurse
 * anaesthetist filing a useful bug report than someone who will be alarmed by a
 * stack trace.
 *
 * NOTHING IS REPORTED ANYWHERE. There is no error-reporting service here and
 * there will not be one; the learner copies the details if they choose to.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  /** Names the surface, so a report says which part failed. */
  readonly surface: string;
}

interface State {
  readonly error: Error | null;
  readonly componentStack: string;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, componentStack: info.componentStack ?? '' });
    // Logged to the console for a learner who opens it, and nowhere else.
    console.error(`Open Sim Lab: the ${this.props.surface} failed to render.`, error);
  }

  private reset = (): void => {
    this.setState({ error: null, componentStack: '' });
  };

  private clearAndReload = (): void => {
    // Preferences and a saved session are the state most likely to have caused
    // a render to fail, and the least costly to lose.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('opensimlab.')) localStorage.removeItem(key);
      }
    } catch { /* a browser that refuses storage has none to clear */ }
    location.reload();
  };

  override render(): ReactNode {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    const details = `Open Sim Lab — ${this.props.surface}\n${error.name}: ${error.message}\n${componentStack}`;

    return (
      <div className="document">
        <header className="document__bar">
          <a className="document__home" href="/">Open Sim Lab</a>
        </header>
        <main className="reading" id="main">
          <h1>Something in the {this.props.surface} broke</h1>
          <p>
            This is a defect in Open Sim Lab, not something you did. The patient was never real
            and nothing has been lost that was not already only on this device.
          </p>
          <h2>What to try</h2>
          <ul>
            <li>Reload the page. Most render errors do not survive one.</li>
            <li>
              If it happens again, clear this site&rsquo;s stored settings below. That resets your
              preferences and any saved session, and nothing else.
            </li>
          </ul>
          <div className="error-actions">
            <button type="button" className="button button--primary" onClick={() => location.reload()}>
              Reload the page
            </button>
            <button type="button" className="button" onClick={this.reset}>
              Try that screen again
            </button>
            <button type="button" className="button" onClick={this.clearAndReload}>
              Clear stored settings and reload
            </button>
          </div>

          <h2>What to send if you report it</h2>
          <p>
            Copying this and saying what you were doing is genuinely the most useful thing you can
            do with a broken build. Nothing here has been sent anywhere.
          </p>
          <pre className="error-details">{details}</pre>
          <p>
            <a href="https://github.com/clay-good/opensimlab/issues" rel="noreferrer noopener">
              Open an issue on the public repository
            </a>
          </p>
        </main>
        <footer className="document__foot">
          <a href="/">Back to the front page</a>
          <a href="/anesthesia">The simulator</a>
        </footer>
      </div>
    );
  }
}
