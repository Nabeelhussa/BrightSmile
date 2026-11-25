export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'icon' ? 'btn-icon' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
