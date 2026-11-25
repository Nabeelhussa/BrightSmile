export function Card({ title, icon: Icon, actions, children, className = '', noBodyPadding = false }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-header">
          {title && (
            <div className="row-inline" style={{ gap: 10 }}>
              {Icon && (
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-primary-50)',
                    border: '1px solid var(--color-primary-200)',
                    color: 'var(--color-primary-700)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </div>
              )}
              <h2 className="card-title">{title}</h2>
            </div>
          )}
          {actions && <div className="row-inline">{actions}</div>}
        </div>
      )}
      {noBodyPadding ? children : <div className="card-body">{children}</div>}
    </section>
  );
}
