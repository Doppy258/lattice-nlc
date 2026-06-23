/**
 * Build a CSV from rows and trigger a client-side download. Pure browser APIs
 * (Blob + object URL) — no network, so it works fully offline.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const escape = (cell: string | number) => {
    const s = String(cell)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
