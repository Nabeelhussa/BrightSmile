export function Card({ title, actions, children, className = '', noBodyPadding = false }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {actions && <div className="row-inline">{actions}</div>}
        </div>
      )}
      {noBodyPadding ? children : <div className="card-body">{children}</div>}
    </section>
  );
}
