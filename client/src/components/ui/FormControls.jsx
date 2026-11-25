export function FormField({ label, htmlFor, required = false, error, hint, fullSpan = false, children }) {
  return (
    <div className={`form-field ${fullSpan ? 'full-span' : ''}`.trim()}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="required-mark" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

export function TextInput({ hasError = false, className = '', ...props }) {
  return (
    <input
      className={`form-input ${hasError ? 'has-error' : ''} ${className}`.trim()}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export function SelectInput({ hasError = false, className = '', children, ...props }) {
  return (
    <select
      className={`form-select ${hasError ? 'has-error' : ''} ${className}`.trim()}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextareaInput({ hasError = false, className = '', ...props }) {
  return (
    <textarea
      className={`form-textarea ${hasError ? 'has-error' : ''} ${className}`.trim()}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export function CheckboxField({ id, label, checked, onChange }) {
  return (
    <label className="checkbox-row" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
