/**
 * Tiện ích xử lý và chuẩn hóa chuỗi tiếng Việt dùng chung cho toàn bộ Worker.
 * Giúp đồng bộ hóa logic so khớp giữa Router, Retriever, Guard và Tax Engine.
 */

/**
 * Chuẩn hóa chuỗi cơ bản: lowercase, NFC/NFD tách dấu, khử dấu tiếng Việt, thay đ->d.
 * Giữ nguyên các ký tự chữ và số.
 */
export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Gập chuỗi (fold) để tìm kiếm: lowercase, khử dấu, thay thế ký tự đặc biệt bằng khoảng trắng,
 * thu gọn nhiều khoảng trắng liên tiếp và trim hai đầu.
 */
export function foldText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
