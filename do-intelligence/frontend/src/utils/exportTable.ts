/**
 * exportTable.ts
 * Lightweight CSV / Excel export with no external dependencies.
 * Excel receives a UTF-8 BOM tab-separated file (.xls) that Excel opens natively.
 */

type Row = Record<string, any>

function escapeCSV(value: any): string {
    const str = value === null || value === undefined ? '' : String(value)
    // Wrap in quotes if the value contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function buildCSV(columns: string[], rows: Row[], keys: string[]): string {
    const header = columns.map(escapeCSV).join(',')
    const body = rows
        .map((row) => keys.map((k) => escapeCSV(row[k])).join(','))
        .join('\n')
    return `${header}\n${body}`
}

function buildExcel(columns: string[], rows: Row[], keys: string[]): string {
    // Tab-separated with UTF-8 BOM – opens natively in Excel
    const BOM = '\uFEFF'
    const header = columns.join('\t')
    const body = rows
        .map((row) =>
            keys.map((k) => {
                const v = row[k] === null || row[k] === undefined ? '' : String(row[k])
                return v.replace(/\t/g, ' ')
            }).join('\t')
        )
        .join('\n')
    return `${BOM}${header}\n${body}`
}

function download(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function exportCSV(
    columns: string[],
    rows: Row[],
    keys: string[],
    filename = 'export'
) {
    download(buildCSV(columns, rows, keys), `${filename}.csv`, 'text/csv;charset=utf-8;')
}

export function exportExcel(
    columns: string[],
    rows: Row[],
    keys: string[],
    filename = 'export'
) {
    download(
        buildExcel(columns, rows, keys),
        `${filename}.xls`,
        'application/vnd.ms-excel;charset=utf-8;'
    )
}
