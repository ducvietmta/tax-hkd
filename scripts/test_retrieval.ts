import { retrieve } from '../worker/src/retriever';
const qs = [
  'Doanh thu 800 triệu bán Shopee có phải nộp thuế không?',
  'doanh thu 1.5 ty ban hang online tinh thue the nao',
  'làm affiliate tiktok bị trừ bao nhiêu phần trăm',
  'hộ kinh doanh có cần xuất hóa đơn điện tử không',
  'cho thuê nhà thuế bao nhiêu',
  'kê khai thuế theo quý hay năm',
];
for (const q of qs) {
  const t = performance.now();
  const { results, routeId } = retrieve(q, 4);
  console.log(`\nQ: ${q}  [route=${routeId}] ${(performance.now() - t).toFixed(1)}ms`);
  for (const r of results) console.log(`  ${r.score.toFixed(1)} ${r.viaRoute ? 'R' : ' '} ${r.chunk.ref_id} | ${r.chunk.section?.slice(0, 70)}`);
}
