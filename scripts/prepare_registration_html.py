"""Package LibreOffice conversions as standalone printable HTML templates."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def main():
    folder=ROOT/'outputs/registration-wizard/html'
    for file in folder.glob('*.html'):
        source=file.read_text(encoding='utf8')
        # The source's legacy VML separators become solid GIF rectangles in
        # Writer's HTML filter. Preserve textual field marks, omit the bitmaps.
        source=re.sub(r'<img\b[^>]*>', '', source, flags=re.I)
        source=source.replace('lang="en-US"','lang="vi"').replace('<title></title>','<title>Hồ sơ đăng ký</title>')
        aid='<style>@media print{.taxhkd-print-help{display:none}}.taxhkd-print-help{font:13px/1.7 Arial,sans-serif;background:#eef7f2;padding:14px;margin:0 0 20px;color:#205840}@page{size:A4}</style>'
        source=source.replace('</head>',aid+'</head>')
        help_text='Mở chức năng In của trình duyệt (Ctrl+P), chọn khổ A4, tỷ lệ 100%, tắt đầu/chân trang. Có thể chọn “Lưu thành PDF”. Kiểm tra thông tin, ghi ngày và ký trước khi nộp. Giấy tờ bổ sung áp dụng theo checklist trên TaxHKD.'
        source=re.sub(r'(<body[^>]*>)',lambda m:m[1]+'<div class="taxhkd-print-help">'+help_text+'</div>',source,count=1)
        (ROOT/'public/documents'/file.name).write_text(source,encoding='utf8')
if __name__=='__main__':main()
