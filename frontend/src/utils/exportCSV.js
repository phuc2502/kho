/**
 * Xuất dữ liệu ra file CSV
 * @param {string} filename   - Tên file (không cần đuôi .csv)
 * @param {string[]} headers  - Tiêu đề cột
 * @param {any[][]} rows      - Mảng các dòng (mỗi dòng là mảng giá trị)
 */
export function exportToCSV(filename, headers, rows) {
  const BOM = '﻿'; // UTF-8 BOM cho Excel đọc được tiếng Việt
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    // Wrap in quotes if contains comma, newline or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))];
  const csvContent = BOM + csvRows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
