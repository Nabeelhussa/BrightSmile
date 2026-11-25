export function DataTable({
  columns,
  rows,
  keyExtractor = (row) => row.id,
  renderMobileCard,
  ariaLabel = 'Data table',
}) {
  return (
    <>
      <div className="desktop-table-wrap table-scroll">
        <table className="data-table" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.align ? { textAlign: col.align } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={col.align ? { textAlign: col.align } : undefined}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderMobileCard && (
        <div className="mobile-card-list">
          {rows.map((row) => (
            <div key={keyExtractor(row)} className="mobile-item-card">
              {renderMobileCard(row)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
