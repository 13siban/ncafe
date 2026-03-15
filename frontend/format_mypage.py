import re

file_path = '/home/young/workspace/ncafe/frontend/app/mypage/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<hr className={styles.divider} />", "")
content = re.sub(r'\n\s*\n', '\n\n', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx separators removed")
