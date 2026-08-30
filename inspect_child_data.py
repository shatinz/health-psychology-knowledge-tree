import json
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/data-child-psychopathology.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'window\.DOC_CHILD_PSYCHOPATHOLOGY\s*=\s*(\{[\s\S]+\});', text)
data = json.loads(m.group(1))

print("Document Title:", data['title'])
print("Total Chapters:", len(data['tree']['children']))
for ch in data['tree']['children']:
    sections = ch.get('children', [])
    total_pts = sum(len(s.get('detailed_points', [])) for s in sections)
    print(f"  * {ch['title']}: {len(sections)} sections, {total_pts} points, weight={ch.get('exam_weight')}")
