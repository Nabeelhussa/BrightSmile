import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'Unable to load data',
  message = 'Something went wrong while communicating with the server.',
  onRetry,
}) {
  return (
    <div className="state-container" role="alert">
      <div className="state-icon error" aria-hidden="true">
        <AlertCircle size={24} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} style={{ marginTop: 6 }}>
          <RefreshCw size={15} />
          Try Again
        </Button>
      )}
    </div>
  );
}
