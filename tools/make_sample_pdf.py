# -*- coding: utf-8 -*-
"""生成一个最小可用的示例 PDF（占位附件）。

真实讲义 PDF 到位后，直接覆盖 content/text/ 下的同名文件即可，无需再运行本脚本。
（只用标准 14 号字体 Helvetica，不嵌入中文字体，所以正文是英文提示语。）
"""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, 'content', 'text', 'sample-handout.pdf')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

LINES = [
    'Sample Handout (PDF attachment demo)',
    '',
    'This file is only a placeholder.',
    'Replace it with your own handout PDF:',
    '',
    '    content/text/sample-handout.pdf',
    '',
    'Or point data/chapters.js to another file:',
    '',
    '    docs: [ { path: "content/text/your-file.pdf",',
    '             title: "..." } ]',
    '',
    'The viewer embeds it with <iframe> and also',
    'offers a "open in new tab" link, which is more',
    'reliable on mobile browsers.',
]


def esc(s):
    return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


body = ['BT', '/F1 13 Tf', '72 760 Td', '18 TL']
for i, ln in enumerate(LINES):
    if i == 0:
        body.append('/F1 17 Tf')
        body.append('(%s) Tj' % esc(ln))
        body.append('/F1 13 Tf')
    else:
        body.append('(%s) Tj' % esc(ln))
    body.append('T*')
body.append('ET')
stream = '\n'.join(body).encode('latin-1')

objs = []
objs.append(b'<< /Type /Catalog /Pages 2 0 R >>')
objs.append(b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
objs.append(b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
            b'/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>')
objs.append(b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n' + stream + b'\nendstream')
objs.append(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

out = bytearray(b'%PDF-1.4\n')
offsets = []
for i, o in enumerate(objs, start=1):
    offsets.append(len(out))
    out += str(i).encode() + b' 0 obj\n' + o + b'\nendobj\n'

xref_pos = len(out)
out += b'xref\n0 ' + str(len(objs) + 1).encode() + b'\n'
out += b'0000000000 65535 f \n'
for off in offsets:
    out += ('%010d 00000 n \n' % off).encode()
out += (b'trailer\n<< /Size ' + str(len(objs) + 1).encode() +
        b' /Root 1 0 R >>\nstartxref\n' + str(xref_pos).encode() + b'\n%%EOF\n')

with open(OUT, 'wb') as f:
    f.write(bytes(out))

print('saved', OUT, os.path.getsize(OUT), 'bytes')
