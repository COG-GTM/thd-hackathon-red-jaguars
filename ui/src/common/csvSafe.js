// Spreadsheet apps treat cells starting with these characters as formulas.
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r', '\n']

export const sanitizeCsvCell = value => {
  if (value === null || value === undefined) return value
  if (typeof value !== 'string') return value
  const trimmed = value.replace(/^[\s\u00a0\ufeff]+/, '')
  if (trimmed.length > 0 && FORMULA_TRIGGERS.includes(trimmed[0])) {
    return "'" + value
  }
  return value
}

export const sanitizeCsvData = rows =>
  Array.isArray(rows)
    ? rows.map(row =>
        Array.isArray(row)
          ? row.map(sanitizeCsvCell)
          : row && typeof row === 'object'
          ? Object.keys(row).reduce((acc, key) => {
              acc[key] = sanitizeCsvCell(row[key])
              return acc
            }, {})
          : row
      )
    : rows
