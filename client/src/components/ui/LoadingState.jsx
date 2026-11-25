export function LoadingState({ message = 'Loading clinic records...' }) {
  return (
    <div className="state-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="text-secondary">{message}</p>
    </div>
  );
}
