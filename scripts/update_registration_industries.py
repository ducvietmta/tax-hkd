"""Refresh the static catalogue from the official public table, without LLMs.

This is a maintenance command, never called in the user's questionnaire.
Review the resulting diff and legal version before publishing it.
"""
from pathlib import Path
import urllib.request, re, html, json, hashlib

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://dangkykinhdoanh.gov.vn/vn/Pages/NganhNghe.aspx'
def main():
    source=urllib.request.urlopen(SOURCE,timeout=40).read().decode('utf8')
    assert '36/2025/Q' in html.unescape(source), 'Portal no longer identifies QD36/2025; review required'
    rows=[]
    for m in re.finditer(r'<summary>\s*<span class="badge">([^<]+)</span>\s*<span class="lbl">(.*?)</span>\s*</summary>',source,re.S):
        code=html.unescape(m[1]).strip()
        if re.fullmatch(r'\d{4}',code):rows.append({'code':code,'name':html.unescape(re.sub('<[^>]+>','',m[2])).strip()})
    assert len(rows)==495 and len(set(r['code'] for r in rows))==495, 'Catalogue shape changed; review required'
    result={'version':'QD36-2025-official-portal-2026-10-17','source':SOURCE,'legalSource':'https://vanban.chinhphu.vn/?classid=1&docid=215475&pageid=27160','effectiveFrom':'2025-11-15','retrievedAt':'2026-10-17','sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'rows':rows}
    (ROOT/'src/features/registration/data/vsic2025.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
if __name__=='__main__':main()
