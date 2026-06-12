import * as XLSX from 'xlsx';

const ISO_DATE = () => new Date().toISOString().slice(0, 10);

/**
 * Export một hoặc nhiều sheet vào file .xlsx
 * @param {string} filename - tên file (không cần đuôi)
 * @param {Array<{name:string, headers:string[], rows:any[][], colWidths?:number[]}>} sheets
 */
export const exportToExcel = (filename, sheets) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, headers, rows, colWidths }) => {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Bold header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9E1F2' } } };
      }
    }

    // Auto column widths
    const widths = colWidths
      ? colWidths.map(w => ({ wch: w }))
      : headers.map((h, ci) => {
          const maxLen = Math.max(
            String(h).length,
            ...rows.map(row => String(row[ci] ?? '').length)
          );
          return { wch: Math.min(maxLen + 4, 60) };
        });
    ws['!cols'] = widths;

    const safeName = name.slice(0, 31).replace(/[:\\/?*\[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  XLSX.writeFile(wb, `${filename}_${ISO_DATE()}.xlsx`);
};

/**
 * Shorthand cho single-sheet export
 */
export const exportSheetToExcel = (filename, headers, rows, colWidths) => {
  exportToExcel(filename, [{ name: 'Dữ liệu', headers, rows, colWidths }]);
};
