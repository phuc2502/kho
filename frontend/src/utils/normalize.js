// Chuẩn hóa chuỗi: bỏ dấu tiếng Việt, chuyển về chữ thường để hỗ trợ tìm kiếm không dấu gần đúng
export const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};
