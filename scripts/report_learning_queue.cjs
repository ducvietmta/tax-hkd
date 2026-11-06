/**
 * Hàng đợi học từ lượt lỗi: gom 128 lượt chưa đạt theo nguyên nhân gốc,
 * sắp ưu tiên theo số lượng để bổ sung kiến thức/cơ giới hóa theo cụm,
 * không theo từng mã câu. Nguồn: per-case-128.json (đợt rà soát 663)
 * hoặc retest-manifest.json nếu chưa có báo cáo phân loại.
 * Chỉ đọc dữ liệu cục bộ, không gọi mạng, không đổi verdict.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const classifiedPath = path.join(root, 'outputs/fixes-663-2026-11-03/per-case-128.json');
const manifestPath = path.join(root, 'outputs/systematic-fixes-2026-11-02/retest-manifest.json');
const outPath = path.join(root, 'outputs/fixes-663-2026-11-03/learning-queue.md');

let rows;
if (fs.existsSync(classifiedPath)) {
  rows = JSON.parse(fs.readFileSync(classifiedPath, 'utf8'))
    .map(r => ({ idx: r.idx, ids: r.ids, verdict: r.verdict_cu, category: r.category, remaining: r.remaining }));
} else {
  const man = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  rows = man.cases.map(c => ({ idx: c.idx, ids: c.ids, verdict: c.before.verdict, category: 'CHƯA PHÂN LOẠI', remaining: c.before.reason }));
}

const groups = new Map();
for (const r of rows) {
  if (!groups.has(r.category)) groups.set(r.category, []);
  groups.get(r.category).push(r);
}
const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

const action = (category) => {
  if (category.includes('bao phủ')) return 'Truy vết retrievalTrace của lượt chạy lại: nguồn quyết định có vào passages không; thiếu thì bổ sung thẻ đã đối chiếu văn bản chính thức, thừa nguồn nhiễu thì siết ghim theo subrequest.';
  if (category.includes('đóng gói')) return 'Đã sửa cơ chế trả lời từng phần + trích nguồn bắt buộc (2026-11-03); chạy lại live để xác nhận hết source=evidence_context_incomplete.';
  if (category.includes('so sánh')) return 'Đã cơ giới hóa kết luận so sánh bằng ledger; mở rộng mẫu biến thể khi chạy lại.';
  if (category.includes('phạm vi')) return 'Đã mở IN_SCOPE cho câu hỏi nguồn pháp luật; câu meta về hệ thống cần định nghĩa hợp đồng riêng nếu giữ trong bộ chấm.';
  if (category.includes('kiến thức')) return 'Đối chiếu văn bản chính thức (VBQPPL/Công báo/PDF gốc), bổ sung thẻ kèm điều khoản + hiệu lực + trạng thái kiểm duyệt; không nâng VERIFIED khi chưa đủ.';
  if (category.includes('vận hành')) return 'Cần raw results/diagnostic_code từng request; không xử lý bằng KB.';
  if (category.includes('tiêu chí')) return 'Bổ sung đáp án mẫu/dữ kiện hoặc loại khỏi mẫu chấm; không sửa luật để khớp.';
  return 'Chạy lại live, chấm theo idx, rồi truy vết frame/evidence/ledger của từng lượt còn sai.';
};

const lines = ['# Hàng đợi học từ 128 lượt chưa đạt (tự sinh, không đổi verdict)', '',
  `Tổng: ${rows.length} lượt, ${sorted.length} nhóm nguyên nhân.`, ''];
for (const [category, items] of sorted) {
  lines.push(`## ${category} — ${items.length} lượt`);
  lines.push(`Hành động: ${action(category)}`);
  lines.push(`Lượt: ${items.map(i => `${i.idx}(${i.ids.join('/')})`).join(', ')}`);
  lines.push('');
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`learning queue: ${rows.length} rows, ${sorted.length} groups -> ${path.relative(root, outPath)}`);
for (const [category, items] of sorted) console.log(`- ${category}: ${items.length}`);
