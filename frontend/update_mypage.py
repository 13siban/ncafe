import re

file_path = '/home/young/workspace/ncafe/frontend/app/mypage/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the useState for activeTab
content = re.sub(r"const \[activeTab, setActiveTab\] = useState[^;]+;\n", "", content)

# Remove the tabs div
content = re.sub(r"\s*<div className=\{styles\.tabs\}>.*?</div>\s*<div className=\{styles\.tabContent\}>", "\n                    <div className={styles.tabContent}>\n", content, flags=re.DOTALL)

# Remove the {activeTab === 'profile' && ( ... )} blocks
content = re.sub(r"\{activeTab === 'profile' && \(\s*<>\s*(.*?)\s*</>\s*\)\}", r"\1", content, flags=re.DOTALL)
content = re.sub(r"\{activeTab === 'orders' && \(\s*(<section.*?)\s*\)\}", r"<hr className={styles.divider} />\n\n\1", content, flags=re.DOTALL)
content = re.sub(r"\{activeTab === 'favorites' && \(\s*(<section.*?)\s*\)\}", r"<hr className={styles.divider} />\n\n\1", content, flags=re.DOTALL)
content = re.sub(r"\{activeTab === 'topMenus' && \(\s*(<section.*?)\s*\)\}", r"<hr className={styles.divider} />\n\n\1", content, flags=re.DOTALL)
content = re.sub(r"\{activeTab === 'points' && \(\s*(<section.*?)\s*\)\}", r"<hr className={styles.divider} />\n\n\1", content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx updated successfully")
