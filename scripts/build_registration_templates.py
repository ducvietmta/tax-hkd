"""Derive fillable templates from the official files; never synthesize a form.

Input originals are archived in outputs/registration-wizard. Only selected field
paragraphs become placeholders. Tables, styles, margins and legal text survive.
"""
from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as E
import hashlib, json, io

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'outputs/registration-wizard'
DEST = ROOT / 'public/documents'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'
E.register_namespace('w', NS['w'])

def text(node):
    return ''.join(t.text or '' for t in node.findall('.//w:t', NS))

def replace(node, value):
    # Original blank fields contain tab leaders and hard breaks. Remove those
    # fill-in aids after supplying a value so long names wrap naturally.
    for parent in node.iter():
        for child in list(parent):
            if child.tag in [W+'tab',W+'br',W+'instrText',W+'fldChar']:
                parent.remove(child)
    ts = node.findall('.//w:t', NS)
    if not ts:
        ts = [E.SubElement(E.SubElement(node, W+'r'), W+'t')]
    ts[0].text = value
    ts[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    for t in ts[1:]:
        t.text = ''

def save(source, target, root):
    # ElementTree drops declarations referenced only by mc:Ignorable. Remove
    # those optional compatibility hints; retain all actual namespace elements.
    for node in root.iter():
        node.attrib.pop('{http://schemas.openxmlformats.org/markup-compatibility/2006}Ignorable',None)
    with ZipFile(source) as zin, ZipFile(target, 'w', ZIP_DEFLATED) as zout:
        note_data=None
        if 'word/footnotes.xml' in zin.namelist():
            notes=E.fromstring(zin.read('word/footnotes.xml'))
            refs=root.findall('.//w:footnoteReference',NS)
            old_ids=list(dict.fromkeys(r.get(W+'id') for r in refs))
            mapping={old:str(i+1) for i,old in enumerate(old_ids)}
            for ref in refs:ref.set(W+'id',mapping[ref.get(W+'id')])
            for note in list(notes):
                old=note.get(W+'id')
                if old in mapping:note.set(W+'id',mapping[old])
                elif old not in ['-1','0']:notes.remove(note)
            note_data=E.tostring(notes,encoding='utf8',xml_declaration=True)
        for item in zin.infolist():
            data=E.tostring(root, encoding='utf-8', xml_declaration=True) if item.filename == 'word/document.xml' else note_data if item.filename=='word/footnotes.xml' else zin.read(item.filename)
            zout.writestr(item,data)

def household():
    source = SRC/'tt68-appendices.docx'
    with ZipFile(source) as z:
        raw=z.read('word/document.xml')
        for _,(prefix,uri) in E.iterparse(io.BytesIO(raw),events=['start-ns']):
            if not prefix.startswith('ns'):E.register_namespace(prefix,uri)
        root=E.fromstring(raw)
    body = root.find('w:body', NS)
    elements = list(body)
    title = next(i for i,e in enumerate(elements) if text(e) == 'GIẤY ĐỀ NGHỊ ĐĂNG KÝ HỘ KINH DOANH')
    start = next(i for i in range(title-1, -1, -1) if text(elements[i]) == 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
    end = next(i for i in range(title+1,len(elements)) if 'CHỦ HỘ KINH DOANH' in text(elements[i]) and '(Ký và ghi họ tên)' in text(elements[i]))+1
    section = next((deepcopy(x.find('.//w:sectPr', NS)) for x in elements[start:end] if x.find('.//w:sectPr', NS) is not None), deepcopy(body.find('w:sectPr', NS)))
    for e in list(body): body.remove(e)
    for e in elements[start:end]: body.append(e)
    # A standalone form must not inherit the next form's page header/footer.
    if section is not None:
        for child in list(section):
            if child.tag in [W+'headerReference', W+'footerReference', W+'type']: section.remove(child)
        body.append(section)
    save(source, DEST/'Mau-01-HKD-TT68-2025.docx', deepcopy(root))
    ps = root.findall('.//w:p', NS)
    (SRC/'household-field-index.txt').write_text('\n'.join(f'{i}: {text(p)}' for i,p in enumerate(ps)), encoding='utf8')
    return root

def main():
    root = household()
    # Exact source field prefixes are checked, so a template change fails loudly.
    ps = root.findall('.//w:p', NS)
    mapping = {
        'Kính gửi:': 'Kính gửi: Cơ quan đăng ký kinh doanh {{commune}}, {{province}}',
        'Tôi là (ghi họ tên bằng chữ in hoa):': 'Tôi là (ghi họ tên bằng chữ in hoa): {{fullName}}',
        'Sinh ngày:': 'Sinh ngày: {{birthDate}}',
        'Giới tính:': 'Giới tính: {{gender}}',
        'Số định danh cá nhân:': 'Số định danh cá nhân: {{personalId}}',
        'Điện thoại (nếu có):': 'Điện thoại (nếu có): {{phone}}       Thư điện tử (nếu có): {{email}}',
        'Tên hộ kinh doanh viết bằng tiếng Việt': 'Tên hộ kinh doanh viết bằng tiếng Việt (ghi bằng chữ in hoa): {{businessName}}',
        'Tổng số (bằng số, bằng chữ, VNĐ):': 'Tổng số (bằng số, bằng chữ, VNĐ): {{capital}} đồng ({{capitalWords}})',
        '5.2. Ngày bắt đầu': '5.2. Ngày bắt đầu hoạt động (trường hợp hộ kinh doanh dự kiến bắt đầu hoạt động kể từ ngày được cấp Giấy chứng nhận đăng ký hộ kinh doanh thì không cần kê khai nội dung này): {{startDate}}',
        '5.3. Tổng số lao động': '5.3. Tổng số lao động (dự kiến): {{workers}}',
    }
    for prefix, value in mapping.items():
        matches = [p for p in ps if text(p).startswith(prefix)]
        assert matches, prefix
        replace(matches[0], value)
    # Source's trụ sở group follows heading 2, independently of the identity branch.
    start = next(i for i,p in enumerate(ps) if text(p).startswith('2. Trụ sở'))
    for prefix, value in [('Số nhà/phòng,','{{street}}'), ('Xã/Phường/Đặc khu:','{{commune}}'), ('Tỉnh/Thành phố trực thuộc trung ương:','{{province}}')]:
        p = next(p for p in ps[start+1:] if text(p).startswith(prefix))
        replace(p, text(p).split(':')[0]+': '+value)
    # Populate the original industry row rather than replace the official table.
    table = next(t for t in root.findall('.//w:tbl',NS) if 'Mã ngành' in text(t) and 'Ngành, nghề kinh doanh chính' in text(t))
    rows = table.findall('w:tr',NS)
    assert len(rows)>1
    for cell, value in zip(rows[1].findall('w:tc',NS), ['1','{{industryName}}; chi tiết: {{activity}}','{{industry}}','X']):
        p=cell.find('w:p',NS);replace(p,value)
        pp=p.find('w:pPr',NS)
        if pp is not None:
            for ind in pp.findall('w:ind',NS):pp.remove(ind)
    # Checkbox glyphs belong to the original form; user choice supplies the mark.
    for p in ps:
        t=text(p)
        if t.strip()=='Cá nhân': replace(p,'{{soloMark}} Cá nhân')
        if t.strip()=='Các thành viên hộ gia đình': replace(p,'{{familyMark}} Các thành viên hộ gia đình')
    for i,value in {31:'Điện thoại: {{phone}}     Fax (nếu có):',32:'Thư điện tử (nếu có): {{email}}     Website (nếu có):',33:'{{noFixedMark}} Không kinh doanh tại trụ sở (đánh dấu X vào ô này nếu hộ kinh doanh không có địa điểm kinh doanh cố định)',47:'Số nhà/phòng, ngách/hẻm, ngõ/kiệt, đường/phố/đại lộ, tổ/xóm/ấp/thôn: {{noticeStreet}}',48:'Xã/Phường/Đặc khu: {{noticeCommune}}',49:'Tỉnh/Thành phố trực thuộc trung ương: {{noticeProvince}}',54:'☒ Phương pháp kê khai'}.items():replace(ps[i],value)
    for i in [33,54,57,58]:
        for parent in ps[i].iter():
            for child in list(parent):
                if child.tag in [W+'pict',W+'drawing',W+'object']:parent.remove(child)
    table=next(t for t in root.findall('.//w:tbl',NS) if 'Số định danh cá nhân' in text(t) and 'Chữ ký' in text(t))
    rows=table.findall('w:tr',NS)
    row=deepcopy(rows[2])
    for cell,value in zip(row.findall('w:tc',NS),['{{memberNumber}}','{{memberName}}','{{memberBirthDate}}','{{memberId}}','{{memberGender}}','','','','','']):
        replace(cell.find('w:p',NS),value)
    for old in rows[2:]:table.remove(old)
    table.append(row)
    save(SRC/'tt68-appendices.docx', DEST/'Template-01-HKD.docx',root)

    source=SRC/'03-dkt.docx'
    with ZipFile(source) as z: root=E.fromstring(z.read('word/document.xml'))
    ps=root.findall('.//w:p',NS)
    changes={12:'☒ Cá nhân kinh doanh',17:'1. Họ và tên: {{fullName}}',18:'2. Ngày, tháng, năm sinh: {{birthDate}}',19:'3. Số định danh cá nhân: {{personalId}}',20:'4. Điện thoại liên hệ: {{phone}}',21:'5. Email: {{email}}',22:'6. Số định danh cá nhân đã cấp trước đó (trong trường hợp cá nhân được xác lập lại số định danh cá nhân): {{previousId}}',23:'7. Số tài khoản ngân hàng: {{personalAccount}}',24:'    Tên chủ tài khoản: {{personalAccountOwner}}    Tên ngân hàng: {{personalBank}}',55:'1. Tên cửa hàng/thương hiệu: {{businessName}}',57:'Số nhà, ngách, hẻm, ngõ, đường/phố, tổ/xóm/ấp/thôn: {{street}}',58:'Xã/Phường/Đặc khu: {{commune}}',59:'Tỉnh/Thành phố trực thuộc trung ương: {{province}}',60:'Điện thoại (nếu có): {{phone}}     Fax (nếu có):     Email (nếu có): {{email}}',62:'Số nhà, ngách, hẻm, ngõ, đường/phố, tổ/xóm/ấp/thôn: {{noticeStreet}}',63:'Xã/Phường/Đặc khu: {{noticeCommune}}',64:'Tỉnh/Thành phố trực thuộc trung ương: {{noticeProvince}}',66:'4. Ngành nghề kinh doanh: {{activity}}',67:'5. Ngày bắt đầu hoạt động: {{startDate}}',68:'6. Số tài khoản ngân hàng: {{businessAccount}}',69:'    Tên tài khoản: {{businessAccountOwner}}    Tên ngân hàng: {{businessBank}}'}
    assert text(ps[17]).startswith('1. Họ và tên:') and text(ps[66]).startswith('4. Ngành nghề')
    for i,value in changes.items():replace(ps[i],value)
    save(source,DEST/'Template-03-DKT.docx',root)
    (DEST/'Mau-03-DKT-TT90-2026.docx').write_bytes(source.read_bytes())
    manifest={
      'version':'2026-10-17.1',
      'household':{'source':'https://dangkykinhdoanh.gov.vn/Images/editor/files/01_7_2025_%20Ph%E1%BB%A5%20l%E1%BB%A5c%20Th%C3%B4ng%20t%C6%B0%2068%202025%20TT%20BTC.docx','scope':'Mẫu số 1 Phụ lục II TT68/2025; TT121/2026 chỉ sửa Phụ lục I','originalSha256':hashlib.sha256((SRC/'tt68-appendices.docx').read_bytes()).hexdigest()},
      'individual':{'source':'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/90-btc.rar','scope':'03-ĐKT; công dân Việt Nam có dữ liệu dân cư; Wordconv giữ bố cục gốc','originalSha256':hashlib.sha256((DEST/'Mau-03-DKT-TT90-2026.doc').read_bytes()).hexdigest()},
    }
    (DEST/'registration-templates.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')

if __name__=='__main__':main()
