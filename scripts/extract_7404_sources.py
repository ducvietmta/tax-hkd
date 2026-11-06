"""Read supplied DOCX files as evidence; never execute embedded content."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET

source = Path(sys.argv[1])
out = Path('rag_data/sources/7404-2026')
out.mkdir(parents=True, exist_ok=True)
public = Path('public/documents')
public.mkdir(parents=True, exist_ok=True)
manifest = []
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for file in sorted(source.glob('*.docx')):
    match = re.search(r'Phụ lục (\d)', file.name)
    if not match:
        continue
    annex = int(match[1])
    with zipfile.ZipFile(file) as archive:
        document = ET.fromstring(archive.read('word/document.xml'))
    paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns))
                  for p in document.findall('.//w:body//w:p', ns)]
    text = '\n'.join(f'P{i+1:03d}: {p}' for i, p in enumerate(paragraphs) if p.strip())
    (out / f'annex-{annex}.txt').write_text(text + '\n', encoding='utf-8')
    dest = public / f'CT-7404-2026-PL{annex}.docx'
    shutil.copyfile(file, dest)
    manifest.append({'annex': annex, 'filename': file.name,
                     'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                     'paragraph_count': len(paragraphs),
                     'source_url': f'/documents/{dest.name}',
                     'extracted_path': str(out / f'annex-{annex}.txt').replace('\\', '/')})
assert [d['annex'] for d in manifest] == [1, 2, 3, 4, 5]
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Archived and extracted five supplied documents with SHA256 and stable paragraph locators.')
