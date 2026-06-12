/**
 * Các template HTML cho in phiếu kho — FOSITEK Warehouse System
 */

const fmt = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtDateTime = () => new Date().toLocaleString('vi-VN');

const header = (title, code) => `
  <div class="doc-header">
    <div class="company-name">Công ty TNHH FOSITEK</div>
    <div class="company-sub">Hệ thống Quản lý Kho thành phẩm linh kiện điện tử</div>
    <div class="doc-title">${title}</div>
    <div class="doc-code">${code}</div>
  </div>`;

// ─────────────────────────────────────────────
// 1. PHIẾU NHẬP KHO
// ─────────────────────────────────────────────
export const receiptTemplate = (receipt) => {
  const statusMap = { draft: 'Nháp', approved: 'Đã duyệt', completed: 'Hoàn thành', rejected: 'Từ chối' };
  const rows = (receipt.items || []).map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.product?.name || '—'}</td>
      <td class="text-center">${item.product?.sku || '—'}</td>
      <td class="text-center">${item.quantity} ${item.product?.unit || 'Cái'}</td>
      <td class="text-center">${item.warehouseNode?.code || '—'}<br><span style="font-size:11px;color:#555">${item.warehouseNode?.name || ''}</span></td>
      <td class="text-right">${fmt(item.price)}</td>
      <td class="text-right">${fmt((item.quantity || 0) * (item.price || 0))}</td>
    </tr>`).join('');

  return `<div class="page">
    ${header('Phiếu Nhập Kho', `Số phiếu: <strong>${receipt.code}</strong>`)}

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Ngày lập:</span><span>${fmtDate(receipt.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Trạng thái:</span><span>${statusMap[receipt.status] || receipt.status}</span></div>
    <div class="info-row"><span class="info-label">Người lập:</span><span>${receipt.createdByUser?.fullName || receipt.createdByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Ghi chú:</span><span>${receipt.ghiChu || '—'}</span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:4%">STT</th><th>Tên sản phẩm</th><th style="width:12%">Mã SKU</th>
      <th style="width:10%">Số lượng</th><th style="width:16%">Vị trí lưu kho</th>
      <th style="width:14%">Giá sản xuất</th><th style="width:14%">Thành tiền</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="6" class="text-right font-bold">Tổng cộng:</td>
      <td class="text-right font-bold">${fmt(receipt.totalAmount)}</td>
    </tr></tfoot>
  </table>

  <div class="signatures">
    <div class="sig-row" style="grid-template-columns:repeat(3,1fr)">
      <div class="sig-box"><div class="sig-title">Người lập phiếu</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${receipt.createdByUser?.fullName || receipt.createdByUser?.username || ''}</div></div>
      <div class="sig-box"><div class="sig-title">Thủ kho</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
      <div class="sig-box"><div class="sig-title">Người phê duyệt</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
    </div>
  </div>
  <div class="print-footer">In lúc: ${fmtDateTime()}</div>
</div>`;
};

// ─────────────────────────────────────────────
// 2. PHIẾU XUẤT KHO
// ─────────────────────────────────────────────
export const deliveryTemplate = (delivery) => {
  const statusMap = {
    preparing: 'Đang soạn', draft: 'Chờ phê duyệt', approved: 'Đã phê duyệt',
    shipping: 'Đang vận chuyển', completed: 'Hoàn tất', rejected: 'Từ chối', cancelled: 'Đã hủy'
  };
  const rows = (delivery.items || []).map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.product?.name || '—'}</td>
      <td class="text-center">${item.product?.sku || '—'}</td>
      <td class="text-center">${item.quantity} ${item.product?.unit || 'Cái'}</td>
      <td class="text-center">${item.warehouseNode?.code || '—'}<br><span style="font-size:11px;color:#555">${item.warehouseNode?.name || ''}</span></td>
      <td class="text-right">${fmt(item.price)}</td>
      <td class="text-right">${fmt((item.quantity || 0) * (item.price || 0))}</td>
    </tr>`).join('');

  return `<div class="page">
    ${header('Phiếu Xuất Kho', `Số phiếu: <strong>${delivery.code}</strong>`)}

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Ngày lập:</span><span>${fmtDate(delivery.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Trạng thái:</span><span>${statusMap[delivery.status] || delivery.status}</span></div>
    <div class="info-row"><span class="info-label">Người lập:</span><span>${delivery.createdByUser?.fullName || delivery.createdByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Khách hàng / Bên nhận:</span><span>${delivery.tenKhachHang || '—'}</span></div>
    ${delivery.fromRequest?.code ? `<div class="info-row"><span class="info-label">Từ yêu cầu:</span><span>${delivery.fromRequest.code}</span></div>` : ''}
    <div class="info-row"><span class="info-label">Ghi chú:</span><span>${delivery.note || '—'}</span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:4%">STT</th><th>Tên sản phẩm</th><th style="width:12%">Mã SKU</th>
      <th style="width:10%">Số lượng</th><th style="width:16%">Xuất từ vị trí</th>
      <th style="width:14%">Đơn giá bán</th><th style="width:14%">Thành tiền</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="6" class="text-right font-bold">Tổng cộng:</td>
      <td class="text-right font-bold">${fmt(delivery.totalAmount)}</td>
    </tr></tfoot>
  </table>

  <div class="signatures">
    <div class="sig-row" style="grid-template-columns:repeat(4,1fr)">
      <div class="sig-box"><div class="sig-title">Người lập phiếu</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${delivery.createdByUser?.fullName || delivery.createdByUser?.username || ''}</div></div>
      <div class="sig-box"><div class="sig-title">Thủ kho</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
      <div class="sig-box"><div class="sig-title">Người phê duyệt</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
      <div class="sig-box"><div class="sig-title">Bên nhận hàng</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
    </div>
  </div>
  <div class="print-footer">In lúc: ${fmtDateTime()}</div>
</div>`;
};

// ─────────────────────────────────────────────
// 3. PHIẾU KIỂM KÊ (danh sách kiểm đếm)
// ─────────────────────────────────────────────
export const stocktakeSheetTemplate = (stocktake) => {
  const statusMap = {
    pending_approval: 'Chờ phê duyệt', counting: 'Đang kiểm kê',
    submitted: 'Chờ duyệt biên bản', completed: 'Hoàn tất', rejected: 'Từ chối'
  };
  const rows = (stocktake.items || []).map((item, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.product?.name || '—'}</td>
      <td class="text-center">${item.product?.sku || '—'}</td>
      <td class="text-center">${item.product?.unit || 'Cái'}</td>
      <td class="text-center">${item.warehouseNode?.code || '—'}<br><span style="font-size:11px;color:#555">${item.warehouseNode?.name || ''}</span></td>
      <td class="text-center font-bold">${item.systemQty ?? '—'}</td>
      <td class="text-center" style="min-width:60px">${item.countedQty != null ? `<strong>${item.countedQty}</strong>` : '<span style="color:#aaa">___</span>'}</td>
      <td style="min-width:80px">&nbsp;</td>
    </tr>`).join('');

  return `<div class="page">
    ${header('Phiếu Kiểm Kê Kho', `Số phiếu: <strong>${stocktake.code}</strong>`)}

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Ngày kiểm kê:</span><span>${fmtDate(stocktake.date || stocktake.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Trạng thái:</span><span>${statusMap[stocktake.status] || stocktake.status}</span></div>
    <div class="info-row"><span class="info-label">Người lập:</span><span>${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Ghi chú:</span><span>${stocktake.note || '—'}</span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:4%">STT</th><th>Tên sản phẩm</th><th style="width:12%">Mã SKU</th>
      <th style="width:8%">ĐVT</th><th style="width:16%">Vị trí</th>
      <th style="width:10%">SL sổ sách</th><th style="width:10%">SL thực tế</th>
      <th style="width:14%">Ghi chú</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="signatures">
    <div class="sig-row" style="grid-template-columns:repeat(3,1fr)">
      <div class="sig-box"><div class="sig-title">Người lập phiếu</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || ''}</div></div>
      <div class="sig-box"><div class="sig-title">Nhân viên kiểm kê</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
      <div class="sig-box"><div class="sig-title">Quản lý kho</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
    </div>
  </div>
  <div class="print-footer">In lúc: ${fmtDateTime()}</div>
</div>`;
};

// ─────────────────────────────────────────────
// 4. BIÊN BẢN KIỂM KÊ (đối chiếu chênh lệch)
// ─────────────────────────────────────────────
export const stocktakeMinutesTemplate = (stocktake) => {
  const items = stocktake.items || [];
  const diffItems = items.filter(item => {
    const diff = (item.countedQty ?? item.systemQty) - (item.systemQty ?? 0);
    return diff !== 0;
  });

  const allRows = items.map((item, i) => {
    const sys = item.systemQty ?? 0;
    const cnt = item.countedQty ?? sys;
    const diff = cnt - sys;
    const diffCell = diff > 0
      ? `<span class="diff-pos">+${diff}</span>`
      : diff < 0
        ? `<span class="diff-neg">${diff}</span>`
        : `<span class="diff-zero">0</span>`;
    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td>${item.product?.name || '—'}</td>
      <td class="text-center">${item.product?.sku || '—'}</td>
      <td class="text-center">${item.product?.unit || 'Cái'}</td>
      <td class="text-center">${item.warehouseNode?.code || '—'}</td>
      <td class="text-center">${sys}</td>
      <td class="text-center font-bold">${cnt}</td>
      <td class="text-center">${diffCell}</td>
    </tr>`;
  }).join('');

  const totalDiffPos = diffItems.filter(it => (it.countedQty ?? it.systemQty ?? 0) > (it.systemQty ?? 0)).length;
  const totalDiffNeg = diffItems.filter(it => (it.countedQty ?? it.systemQty ?? 0) < (it.systemQty ?? 0)).length;

  return `<div class="page">
    ${header('Biên Bản Kiểm Kê Kho', `Số phiếu: <strong>${stocktake.code}</strong>`)}

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Ngày kiểm kê:</span><span>${fmtDate(stocktake.date || stocktake.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Ngày lập biên bản:</span><span>${fmtDate(stocktake.approvedAt || new Date())}</span></div>
    <div class="info-row"><span class="info-label">Người kiểm kê:</span><span>${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Người phê duyệt:</span><span>${stocktake.approvedByUser?.fullName || stocktake.approvedByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Ghi chú:</span><span>${stocktake.note || '—'}</span></div>
    <div class="info-row"><span class="info-label">Tổng mục chênh lệch:</span><span>
      ${diffItems.length} mục
      (<span class="diff-pos">+${totalDiffPos} thừa</span> /
       <span class="diff-neg">${totalDiffNeg} thiếu</span>)
    </span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:4%">STT</th><th>Tên sản phẩm</th><th style="width:12%">Mã SKU</th>
      <th style="width:7%">ĐVT</th><th style="width:12%">Vị trí</th>
      <th style="width:10%">SL sổ sách</th><th style="width:10%">SL thực tế</th>
      <th style="width:10%">Chênh lệch</th>
    </tr></thead>
    <tbody>${allRows}</tbody>
  </table>

  <div style="margin-top:12px;font-size:12px">
    <strong>Kết luận:</strong> Sau khi kiểm kê, kho có <strong>${diffItems.length}</strong> mục hàng hóa có chênh lệch cần điều chỉnh.
    ${diffItems.length === 0 ? 'Tồn kho thực tế khớp hoàn toàn với sổ sách.' : ''}
  </div>

  <div class="signatures">
    <div class="sig-row" style="grid-template-columns:repeat(3,1fr)">
      <div class="sig-box"><div class="sig-title">Người kiểm kê</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || ''}</div></div>
      <div class="sig-box"><div class="sig-title">Thủ kho</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">&nbsp;</div></div>
      <div class="sig-box"><div class="sig-title">Quản lý kho (Phê duyệt)</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${stocktake.approvedByUser?.fullName || stocktake.approvedByUser?.username || ''}</div></div>
    </div>
  </div>
  <div class="print-footer">In lúc: ${fmtDateTime()}</div>
</div>`;
};

// ─────────────────────────────────────────────
// 5. BÁO CÁO KIỂM KÊ (chỉ các mục có chênh lệch)
// ─────────────────────────────────────────────
export const stocktakeReportTemplate = (stocktake) => {
  const items = stocktake.items || [];
  const diffItems = items.filter(item => {
    const diff = (item.countedQty ?? item.systemQty ?? 0) - (item.systemQty ?? 0);
    return diff !== 0;
  });

  const rows = diffItems.length === 0
    ? `<tr><td colspan="7" class="text-center" style="padding:16px;color:#888;font-style:italic">Không có chênh lệch — tồn kho khớp sổ sách</td></tr>`
    : diffItems.map((item, i) => {
        const sys = item.systemQty ?? 0;
        const cnt = item.countedQty ?? sys;
        const diff = cnt - sys;
        const action = diff > 0 ? 'Nhập bổ sung vào hệ thống' : 'Điều chỉnh giảm trong hệ thống';
        const diffCell = diff > 0
          ? `<span class="diff-pos">+${diff}</span>`
          : `<span class="diff-neg">${diff}</span>`;
        return `<tr>
          <td class="text-center">${i + 1}</td>
          <td>${item.product?.name || '—'}</td>
          <td class="text-center">${item.product?.sku || '—'}</td>
          <td class="text-center">${item.product?.unit || 'Cái'}</td>
          <td class="text-center">${item.warehouseNode?.code || '—'}</td>
          <td class="text-center">${sys} → <strong>${cnt}</strong></td>
          <td class="text-center">${diffCell}</td>
        </tr>`;
      }).join('');

  return `<div class="page">
    ${header('Báo Cáo Kiểm Kê Kho', `Số phiếu: <strong>${stocktake.code}</strong> — Chỉ hiển thị các mục chênh lệch`)}

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Ngày kiểm kê:</span><span>${fmtDate(stocktake.date || stocktake.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Tổng mục kiểm kê:</span><span>${items.length} mục</span></div>
    <div class="info-row"><span class="info-label">Người kiểm kê:</span><span>${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || '—'}</span></div>
    <div class="info-row"><span class="info-label">Mục có chênh lệch:</span><span><strong>${diffItems.length}</strong> / ${items.length} mục</span></div>
    <div class="info-row"><span class="info-label">Ghi chú:</span><span>${stocktake.note || '—'}</span></div>
  </div>

  ${diffItems.length > 0 ? `<p style="font-size:12px;margin-bottom:8px;color:#c00"><strong>⚠ Danh sách hàng hóa cần điều chỉnh sau kiểm kê:</strong></p>` : ''}

  <table>
    <thead><tr>
      <th style="width:4%">STT</th><th>Tên sản phẩm</th><th style="width:12%">Mã SKU</th>
      <th style="width:8%">ĐVT</th><th style="width:12%">Vị trí</th>
      <th style="width:20%">Sổ sách → Thực tế</th>
      <th style="width:10%">Chênh lệch</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:12px;padding:10px;border:1px solid #ccc;background:#fafafa;font-size:12px">
    <strong>Đề xuất xử lý:</strong>
    ${diffItems.length === 0
      ? 'Không cần điều chỉnh. Tồn kho thực tế khớp hoàn toàn với sổ sách.'
      : `Lập phiếu điều chỉnh tồn kho cho <strong>${diffItems.length}</strong> mục hàng hóa có chênh lệch theo biên bản kiểm kê số <strong>${stocktake.code}</strong>.`
    }
  </div>

  <div class="signatures">
    <div class="sig-row" style="grid-template-columns:repeat(2,1fr)">
      <div class="sig-box"><div class="sig-title">Người lập báo cáo</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${stocktake.createdByUser?.fullName || stocktake.createdByUser?.username || ''}</div></div>
      <div class="sig-box"><div class="sig-title">Quản lý kho duyệt</div><div style="font-size:11px;color:#555">(Ký, ghi rõ họ tên)</div><div class="sig-space"></div><div class="sig-name">${stocktake.approvedByUser?.fullName || stocktake.approvedByUser?.username || ''}</div></div>
    </div>
  </div>
  <div class="print-footer">In lúc: ${fmtDateTime()}</div>
</div>`;
};
