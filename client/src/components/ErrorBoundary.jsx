import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

/**
 * Branded error boundary.
 *
 * A render error anywhere below this point shows a recoverable message instead
 * of a blank white page. Stack traces stay in the console, never on screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Useful in development / browser console; never shown to visitors.
    console.error("Page crashed:", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
        <div className="w-full max-w-lg">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
            <AlertTriangle size={30} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h1 className="h2 text-ink">
            This page ran into a problem
          </h1>
          <p className="body-lg mx-auto mt-4 max-w-md text-muted">
            Something on our side stopped working. The rest of the site is still
            fine — try loading this page again, or head back to the homepage.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={this.handleRetry} className="btn-primary w-full sm:w-auto">
              <RotateCcw size={17} /> Try again
            </button>
            <Link to="/" className="btn-outline w-full sm:w-auto">
              <Home size={17} /> Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
