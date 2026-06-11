'use strict';
const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber
} = require('docx');

// ── Page & font constants ────────────────────────────────────────────────────
const F  = 'Times New Roman';
const FS = 26;                          // 13 pt in half-points
const LS = { line: 360, lineRule: 'auto' }; // 1.5 line spacing

// A4 Vietnamese academic margins (DXA)
const PAGE_W = 11906, PAGE_H = 16838;
const ML = 1985, MR = 1134, MT = 1418, MB = 1418;
const CW = PAGE_W - ML - MR;           // 8787

// ── Text helpers ─────────────────────────────────────────────────────────────
const r  = (t, x = {}) => new TextRun({ text: t, font: F, size: FS, ...x });
const rb = (t, x = {}) => r(t, { bold: true, ...x });
const ri = (t, x = {}) => r(t, { italics: true, ...x });

// ── Paragraph helpers ────────────────────────────────────────────────────────
const body = (txt) => new Paragraph({
  alignment: AlignmentType.BOTH,
  spacing: { ...LS, before: 0, after: 100 },
  indent: { firstLine: 567 },
  children: [r(txt)]
});

// Table caption: bold, centered, placed ABOVE table
const tblCap = (txt) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { ...LS, before: 160, after: 60 },
  children: [rb(txt, { size: 24 })]          // 12pt bold, match Group 29
});

// Source note: italic, centered, placed BELOW table
const srcNote = (txt = 'Nguồn: Nhóm nghiên cứu') => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { ...LS, before: 40, after: 200 },
  children: [ri(txt, { size: 24 })]
});

const blank = () => new Paragraph({ spacing: { before: 0, after: 60 }, children: [r('')] });

// ── Table helpers ─────────────────────────────────────────────────────────────
const B  = (c = '000000', s = 4) => ({ style: BorderStyle.SINGLE, size: s, color: c });
const CB = { top: B(), bottom: B(), left: B(), right: B() };

// Column widths (sum = CW = 8787)
const W = [1950, 1350, 1950, 1900, 870, 767]; // Thuộc tính | Kiểu DL | Ràng buộc | Giải thích | Format | Index
// Total: 1950+1350+1950+1900+870+767 = 8787 ✓

const mkCell = (text, width, opts = {}) => {
  const { bold = false, center = false, bg } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CB,
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 276, lineRule: 'auto', before: 0, after: 0 },
      children: [new TextRun({ text: text, font: F, size: 22, bold })]
    })]
  });
};

const HEADERS = ['Thuộc tính', 'Kiểu dữ liệu', 'Ràng buộc', 'Giải thích', 'Format', 'Index'];

const buildTable = (rows) => new Table({
  width: { size: CW, type: WidthType.DXA },
  columnWidths: W,
  rows: [
    // Header row: bold + centered + gray background
    new TableRow({
      tableHeader: true,
      children: HEADERS.map((h, i) => mkCell(h, W[i], { bold: true, center: true, bg: 'D9D9D9' }))
    }),
    // Data rows
    ...rows.map((row) =>
      new TableRow({
        children: row.map((cell, i) => mkCell(cell, W[i]))
      })
    )
  ]
});

// ── Load table data ───────────────────────────────────────────────────────────
const tables = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'tables_data.json'), 'utf8'
));

// ── Build document children ───────────────────────────────────────────────────
const C = [];

// Section heading
C.push(new Paragraph({
  spacing: { ...LS, before: 240, after: 120 },
  children: [rb('3.1.3. Thiết kế mức vật lý', { size: 26 })]
}));

C.push(body('Dựa trên thiết kế mức logic đã được xác lập ở mục 3.1.2, thiết kế mức vật lý chi tiết hóa từng bảng dữ liệu trong hệ thống Quản lý kho thành phẩm FOSITEK thành các đặc tả kiểu dữ liệu cụ thể, ràng buộc toàn vẹn và chỉ số (index) phục vụ triển khai trực tiếp trên hệ quản trị cơ sở dữ liệu SQL Server. Hệ thống bao gồm 32 bảng được chia thành 6 nhóm chức năng như trình bày dưới đây.'));

// One block per table
for (const tbl of tables) {
  C.push(tblCap(tbl.title));
  C.push(buildTable(tbl.rows));
  C.push(srcNote());
}

// ── Assemble document ─────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MT, bottom: MB, left: ML, right: MR }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 0 },
          children: [ri('Thiết kế mức vật lý – Hệ thống Quản lý Kho FOSITEK', { size: 20 })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: FS })]
        })]
      })
    },
    children: C
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, 'ThietKeMucVatLy_FOSITEK.docx');
  fs.writeFileSync(out, buf);
  console.log('Done:', out);
});
