import os
import re

project_dir = r'C:\Users\PC\.gemini\antigravity\scratch\health-psychology-knowledge-tree'
findings = []

secret_patterns = [
    (r'(?i)(api[_-]?key|secret|token|password|passwd|auth)\s*[:=]\s*[\'\"][a-zA-Z0-9_\-]{8,}[\'\"]', 'High', 'Potential Hardcoded Secret'),
    (r'ghp_[a-zA-Z0-9]{36}', 'Critical', 'GitHub Personal Access Token'),
    (r'AIza[0-9A-Za-z\-_]{35}', 'Critical', 'Google API Key'),
    (r'sk-[a-zA-Z0-9]{32,}', 'Critical', 'OpenAI API Key')
]

for root, dirs, files in os.walk(project_dir):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.json', '.py', '.md')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for pat, sev, desc in secret_patterns:
                    matches = re.finditer(pat, content)
                    for m in matches:
                        # Exclude self-matches
                        if 'scan_security.py' not in file:
                            findings.append((sev, file, desc, m.group(0)[:30]))

print(f"=== Security Sentinel Scan Complete ===")
print(f"Total findings: {len(findings)}")
if len(findings) == 0:
    print("STATUS: PASSED. Zero critical or high security issues detected.")
else:
    for f in findings:
        print(f"[{f[0]}] in {f[1]}: {f[2]}")
