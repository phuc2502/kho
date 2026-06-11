/**
 * Mở cửa sổ mới, render HTML in, tự gọi window.print() sau 400ms.
 * @param {string} htmlContent - Nội dung HTML bên trong <body>
 * @param {string} title - Tiêu đề cửa sổ in
 */
export const printDocument = (htmlContent, title = 'In phiếu') => {
  const w = window.open('', '_blank', 'width=960,height=760');
  if (!w) {
    alert('Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép pop-up để in.');
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;background:#fff}
    .page{width:210mm;min-height:297mm;margin:0 auto;padding:14mm 16mm 18mm}

    /* Header */
    .doc-header{text-align:center;margin-bottom:14px;border-bottom:2px solid #000;padding-bottom:10px}
    .company-name{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}
    .company-sub{font-size:11px;color:#444;margin-top:2px}
    .doc-title{font-size:19px;font-weight:bold;text-transform:uppercase;margin:10px 0 4px;letter-spacing:1px}
    .doc-code{font-size:12px;color:#333}

    /* Info block */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 20px;margin:10px 0 14px;font-size:12.5px}
    .info-row{display:flex;gap:6px}
    .info-label{font-weight:bold;min-width:130px;white-space:nowrap;flex-shrink:0}

    /* Tables */
    table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12.5px}
    th,td{border:1px solid #444;padding:5px 7px;vertical-align:middle}
    thead th{background:#f0f0f0;font-weight:bold;text-align:center}
    tfoot td{background:#f5f5f5;font-weight:bold}
    .text-right{text-align:right}
    .text-center{text-align:center}
    .font-bold{font-weight:bold}

    /* Diff indicators */
    .diff-pos{color:green;font-weight:bold}
    .diff-neg{color:red;font-weight:bold}
    .diff-zero{color:#888}

    /* Signatures */
    .signatures{display:grid;gap:10px;margin-top:28px}
    .sig-row{display:grid;gap:10px}
    .sig-box{text-align:center}
    .sig-title{font-weight:bold;font-size:12px}
    .sig-space{height:52px}
    .sig-name{font-weight:bold;font-size:12px;margin-top:2px;border-top:1px dotted #999;padding-top:2px}

    /* Print date */
    .print-footer{text-align:center;margin-top:16px;font-size:11px;color:#777;border-top:1px dashed #ccc;padding-top:6px}

    /* No-print toolbar */
    .no-print{padding:10px 16px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;gap:8px;align-items:center}
    .no-print button{padding:6px 14px;border:1px solid #999;background:#fff;border-radius:4px;cursor:pointer;font-size:13px}
    .no-print button.primary{background:#1d4ed8;color:#fff;border-color:#1d4ed8}

    @media print{
      .no-print{display:none!important}
      body{background:#fff}
      .page{padding:8mm 12mm;margin:0;width:100%}
      @page{size:A4;margin:8mm}
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="primary" onclick="window.print()">🖨 In ngay</button>
    <button onclick="window.close()">✕ Đóng</button>
    <span style="font-size:12px;color:#555;margin-left:8px">${title}</span>
  </div>
  ${htmlContent}
</body>
</html>`);
  w.document.close();
  w.addEventListener('load', () => setTimeout(() => w.print(), 350));
};
