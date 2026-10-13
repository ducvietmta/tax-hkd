# RAG Knowledge Export — 2026-10-12

Kho tri thức thuế hộ kinh doanh & cá nhân kinh doanh (Việt Nam), xuất để build
lại hệ RAG trên backend riêng.

## Nội dung gói

| File | Mô tả |
|---|---|
| `chunks.jsonl` | Toàn bộ chunks tri thức (JSONL, 1 chunk/dòng). Xem schema bên dưới. |
| `query-map.json` | Bản đồ query → canonical refs (định tuyến nhanh, dùng trước khi vector search). |
| `router.json` | Định tuyến intent/slot (V6). |
| `citation_validity.md` | Sổ theo dõi hiệu lực văn bản pháp lý (dòng nào quá 7 ngày từ "Ngày kiểm tra" phải kiểm tra lại). |
| `style-corpus/` | Corpus giọng văn: `style_cards.jsonl` (thẻ phong cách) + `rewrite_examples.jsonl` (ví dụ viết lại) — dùng để biên tập câu trả lời cho tự nhiên, KHÔNG phải nguồn tri thức thuế. |

## Schema chunks.jsonl

```json
{"id": "KB/16D-....md#123", "file": "KB/16D-....md", "section": "16.75. Ngưỡng 1 tỷ...",
 "ref_id": "16.75", "tier": "VERIFIED_CONDITIONAL", "text": "..."}
```

- `ref_id`: mã thẻ canonical (vd "16.75", "16.95") — chỉ có ở file 16/16C/16D/16E/16F.
- `tier`: cấp độ tin cậy của chunk. **HỢP ĐỒNG QUAN TRỌNG NHẤT:**

## Tier contract (bắt buộc khi build)

- `VERIFIED` / `VERIFIED_CONDITIONAL` — được dùng làm căn cứ chốt đáp án.
  `VERIFIED_CONDITIONAL` chỉ chốt khi đủ điều kiện ghi trong thẻ.
- `CONTROL` (file 00*) — luật điều phối, không phải tri thức trả lời.
- `CASE_EVIDENCE` (file 01–11) — case thực tế từ group, KHÔNG phải căn cứ pháp lý.
- `LESSONS`, `GAP_INDEX`, `DERIVED`, `SPLIT`, `PENDING`, `NEED_DIRECT_AUTHORITY`,
  `DEPRECATED`, `UNLABELED_CANONICAL`, `CITATION_LEDGER`, `OPS_LOG`, `PROCESS`, `META`
  — không dùng để chốt đáp án khi chưa có canonical xác nhận.

## Gợi ý pipeline trên backend

1. Embed `chunks.jsonl` bằng model embedding đa ngữ (bản gốc dùng
   `paraphrase-multilingual-mpnet-base-v2`, 768 chiều, cosine).
2. Route: tra `query-map.json` trước (khớp → đọc thẳng thẻ canonical);
   không khớp → vector search top-5, lọc tier.
3. Chỉ dùng chunk `VERIFIED`/`VERIFIED_CONDITIONAL` để kết luận;
   `CASE_EVIDENCE` chỉ làm ngữ cảnh phụ.
4. Kiểm tra hiệu lực văn bản qua `citation_validity.md` trước khi chốt số liệu.

## Phiên bản
- KB version: 5.1 (+16F mở rộng, CV 7403/CT-TMĐT 06/10/2026)
- Ngày xuất: 2026-10-12
- Tổng chunks: 1166 (xem thống kê tier khi build)
