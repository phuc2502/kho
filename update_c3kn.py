"""
update_c3kn.py
Cập nhật Chương 3 - khái niệm.docx với các thay đổi v2.0:
  - Sửa thuộc tính SanPham, SoSerial, NhatKyEmail
  - Thêm thực thể LoSanXuat
  - Thêm/sửa quan hệ LoSanXuat, NhatKyEmail mở rộng
"""
import sys, copy, zipfile, shutil, os
sys.stdout.reconfigure(encoding='utf-8')
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
WR = f'{{{W}}}'

XML_PATH = r'D:\TTCN_Hang\kho\unpacked_c3kn\word\document.xml'
OUT_DOCX = r'D:\TTCN_Hang\kho\Chuong3_khainiemv2.docx'
SRC_DIR  = r'D:\TTCN_Hang\kho\unpacked_c3kn'
ORIG_DOCX = r'D:\TTCN_Hang\kho\Chương 3 - khái niệm.docx'

# ── helpers ──────────────────────────────────────────────────────────────────

def para_text(p):
    return ''.join((t.text or '') for t in p.iter(f'{WR}t'))

def set_para_text(p, new_text):
    """Replace ALL text in paragraph's first run with new_text, remove extra runs."""
    runs = p.findall(f'.//{WR}r')
    if not runs:
        return
    # Rebuild content of first run
    first = runs[0]
    # Remove existing w:t in first run
    for t in first.findall(f'{WR}t'):
        first.remove(t)
    # Add new w:t
    t_el = etree.SubElement(first, f'{WR}t')
    if new_text.startswith(' ') or new_text.endswith(' '):
        t_el.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    t_el.text = new_text
    # Remove remaining runs (runs[1:])
    parent = p
    # runs might be nested in hyperlinks etc; find direct run children
    # More robust: collect all direct w:r children and text nodes
    # The doc paragraphs here are simple plain text so just removing extra runs works
    for r in runs[1:]:
        rp = r.getparent()
        if rp is not None:
            rp.remove(r)

def clone_para_with_text(source_p, new_text, mark=''):
    """Deep-copy a paragraph, replace its text, optionally prepend a bold marker."""
    new_p = copy.deepcopy(source_p)
    # Clear runs
    for r in list(new_p.iter(f'{WR}r')):
        for t in r.findall(f'{WR}t'):
            r.remove(t)
    runs = list(new_p.iter(f'{WR}r'))
    # Remove all runs
    for r in runs:
        rp = r.getparent()
        if rp is not None:
            rp.remove(r)
    # Build fresh run
    pPr = new_p.find(f'{WR}pPr')
    rPr_src = source_p.find(f'.//{WR}r/{WR}rPr')
    r_el = etree.SubElement(new_p, f'{WR}r')
    if rPr_src is not None:
        r_el.append(copy.deepcopy(rPr_src))
    if mark:
        # Bold marker
        r_bold = copy.deepcopy(r_el)
        rb_pr = r_bold.find(f'{WR}rPr')
        if rb_pr is None:
            rb_pr = etree.SubElement(r_bold, f'{WR}rPr')
        # Insert w:b
        b_el = etree.SubElement(rb_pr, f'{WR}b')
        t_b = etree.SubElement(r_bold, f'{WR}t')
        t_b.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        t_b.text = mark + ' '
        new_p.insert(list(new_p).index(r_el), r_bold)
        new_p.remove(r_el)
        # Add plain run for main text
        r2 = copy.deepcopy(r_bold)
        rb2 = r2.find(f'{WR}rPr')
        if rb2 is not None:
            for b in rb2.findall(f'{WR}b'):
                rb2.remove(b)
        for t in r2.findall(f'{WR}t'):
            r2.remove(t)
        t2 = etree.SubElement(r2, f'{WR}t')
        if new_text.startswith(' ') or new_text.endswith(' '):
            t2.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        t2.text = new_text
        new_p.append(r2)
    else:
        t_el = etree.SubElement(r_el, f'{WR}t')
        if new_text.startswith(' ') or new_text.endswith(' '):
            t_el.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        t_el.text = new_text
    return new_p

# ── load XML ─────────────────────────────────────────────────────────────────

tree = etree.parse(XML_PATH)
root = tree.getroot()
body = root.find(f'{WR}body')
children = list(body)

def ptext(i): return para_text(children[i])

# ── 1. Sửa thuộc tính các thực thể ──────────────────────────────────────────

# [13] SanPham: thêm Thoi_han_bao_hanh
old13 = ptext(13)
assert 'SanPham' in old13, f"Expected SanPham at [13]: {old13}"
new13 = old13.rstrip(')') + ', ⭐ Thoi_han_bao_hanh)'
set_para_text(children[13], new13)
print(f"[13] SanPham updated: ...{new13[-40:]}")

# [14] SoSerial: thêm Ma_lo, Han_bao_hanh
old14 = ptext(14)
assert 'SoSerial' in old14, f"Expected SoSerial at [14]: {old14}"
new14 = old14.rstrip(')') + ', ⭐ Ma_lo, ⭐ Han_bao_hanh)'
set_para_text(children[14], new14)
print(f"[14] SoSerial updated: ...{new14[-50:]}")

# [23] NhatKyEmail: thêm Ma_san_pham, Ma_vi_tri, Da_xu_ly
old23 = ptext(23)
assert 'NhatKyEmail' in old23, f"Expected NhatKyEmail at [23]: {old23}"
new23 = old23.rstrip(')') + ', ⭐ Ma_san_pham, ⭐ Ma_vi_tri, ⭐ Da_xu_ly)'
set_para_text(children[23], new23)
print(f"[23] NhatKyEmail updated: ...{new23[-60:]}")

# ── 2. Thêm thực thể LoSanXuat sau [23] ──────────────────────────────────────

lo_text = ('⭐ LoSanXuat (Ma_lo, Ma_san_pham, So_lo_nha_may, Ngay_san_xuat, '
           'So_luong_san_xuat, Nguon_goc, Ghi_chu, Thoi_gian_tao)')
new_lo_p = clone_para_with_text(children[23], lo_text)

# Insert after [23], which is index 23 in body children
idx23 = list(body).index(children[23])
body.insert(idx23 + 1, new_lo_p)
print(f"[24-new] LoSanXuat inserted after [23]")

# Refresh children list after insertion
children = list(body)

# ── 3. Cập nhật quan hệ ──────────────────────────────────────────────────────
# Now [33] is SanPham <Có> SoSerial (1:N) — insert LoSanXuat relationships after it
# [39] now shifts by 1 → [40]; let's find by text to be safe

def find_idx(text_fragment):
    for i, c in enumerate(list(body)):
        t = para_text(c)
        if text_fragment in t:
            return i, c
    return None, None

# 3a. After "SanPham <Có> SoSerial (1:N)" → add SanPham <Có> LoSanXuat and LoSanXuat <Chứa> SoSerial
idx_sanpham_serial, p_sanpham_serial = find_idx('SanPham <Có> SoSerial')
assert idx_sanpham_serial is not None, "SanPham <Có> SoSerial not found"
print(f"Found SanPham-SoSerial at [{idx_sanpham_serial}]")

new_rel1 = clone_para_with_text(p_sanpham_serial, '⭐ SanPham <Có> LoSanXuat (1:N)')
new_rel2 = clone_para_with_text(p_sanpham_serial, '⭐ LoSanXuat <Chứa> SoSerial (1:N)')

# Insert both after SanPham-SoSerial
idx_insert = list(body).index(p_sanpham_serial)
body.insert(idx_insert + 1, new_rel1)
body.insert(idx_insert + 2, new_rel2)
print(f"  Inserted SanPham-LoSanXuat and LoSanXuat-SoSerial after [{idx_insert}]")

# Refresh
children = list(body)

# 3b. After "PhieuNhapKho <Ghi nhận> SoSerial (1:N)" → add PhieuNhapKho <Ghi nhận> LoSanXuat
idx_nhap_serial, p_nhap_serial = find_idx('PhieuNhapKho <Ghi nhận> SoSerial')
assert idx_nhap_serial is not None, "PhieuNhapKho <Ghi nhận> SoSerial not found"
print(f"Found PhieuNhapKho-SoSerial at [{idx_nhap_serial}]")

new_rel3 = clone_para_with_text(p_nhap_serial,
    '⭐ PhieuNhapKho <Ghi nhận> LoSanXuat (N:N) <Ma_lo, So_luong_nhap_lo, Ngay_san_xuat_lo>')

idx_ins3 = list(body).index(p_nhap_serial)
body.insert(idx_ins3 + 1, new_rel3)
print(f"  Inserted PhieuNhapKho-LoSanXuat after [{idx_ins3}]")

# Refresh
children = list(body)

# 3c. Sau "NguoiDung <Ghi nhận> NhatKyEmail (1:N)" → thêm SanPham và ViTriTrongKho liên kết NhatKyEmail
idx_nk_email, p_nk_email = find_idx('NguoiDung <Ghi nhận> NhatKyEmail')
assert idx_nk_email is not None, "NguoiDung <Ghi nhận> NhatKyEmail not found"
print(f"Found NguoiDung-NhatKyEmail at [{idx_nk_email}]")

new_rel4 = clone_para_with_text(p_nk_email,
    '⭐ SanPham <Liên kết> NhatKyEmail (1:N)')
new_rel5 = clone_para_with_text(p_nk_email,
    '⭐ ViTriTrongKho <Liên kết> NhatKyEmail (1:N)')

idx_ins4 = list(body).index(p_nk_email)
body.insert(idx_ins4 + 1, new_rel4)
body.insert(idx_ins4 + 2, new_rel5)
print(f"  Inserted SanPham-NhatKyEmail and ViTriTrongKho-NhatKyEmail after [{idx_ins4}]")

# ── 4. Save XML ───────────────────────────────────────────────────────────────

tree.write(XML_PATH, xml_declaration=True, encoding='UTF-8', standalone=True)
print(f"\nXML saved → {XML_PATH}")

# ── 5. Repack docx ────────────────────────────────────────────────────────────
# Copy original to output then update word/document.xml from unpacked dir

shutil.copy2(ORIG_DOCX, OUT_DOCX)
with zipfile.ZipFile(OUT_DOCX, 'a') as zout:
    # Walk all files in SRC_DIR and update
    for root_dir, dirs, files in os.walk(SRC_DIR):
        for fname in files:
            fpath = os.path.join(root_dir, fname)
            arcname = os.path.relpath(fpath, SRC_DIR).replace('\\', '/')
            zout.write(fpath, arcname)

# zipfile 'a' mode adds duplicates; use a write+replace approach instead
import io

with zipfile.ZipFile(ORIG_DOCX, 'r') as zin:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            arcname = item.filename
            # Check if we have an updated version
            disk_path = os.path.join(SRC_DIR, arcname.replace('/', os.sep))
            if os.path.isfile(disk_path):
                with open(disk_path, 'rb') as f:
                    zout.writestr(item, f.read())
            else:
                zout.writestr(item, zin.read(arcname))

with open(OUT_DOCX, 'wb') as f:
    f.write(buf.getvalue())

print(f"Repacked docx → {OUT_DOCX}")

# ── 6. Verify ─────────────────────────────────────────────────────────────────
tree2 = etree.parse(XML_PATH)
root2 = tree2.getroot()
body2 = root2.find(f'{WR}body')
children2 = list(body2)
print(f"\nFinal body children: {len(children2)}")
checks = ['LoSanXuat', 'Thoi_han_bao_hanh', 'Han_bao_hanh', 'Da_xu_ly', 'LoSanXuat <Chứa>',
          'PhieuNhapKho <Ghi nhận> LoSanXuat', 'SanPham <Liên kết> NhatKyEmail']
for chk in checks:
    found = any(chk in para_text(c) for c in children2)
    status = '✓' if found else '✗'
    print(f"  {status} {chk}")
