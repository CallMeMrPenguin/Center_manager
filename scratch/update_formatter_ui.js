const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/pages/test-formatter/index.tsx');
let code = fs.readFileSync(file, 'utf8');

const target1 = `showToast(\`Đã tạo thành công \${filesList.length} phiên bản đề thi!\`, "success");`;
const replacement1 = `showToast(\`Đã tạo thành công \${filesList.length} phiên bản đề thi!\`, "success");

        filesList.forEach((fname: string) => {
          const downloadUrl = \`/api/files/download/\${encodeURIComponent(fname)}\`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log('Replaced target 1 (auto download)');
}

const target2 = `<div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try { await api.openWorkspaceFolder();`;

const replacement2 = `<div className="flex items-center gap-2">
                {lastCompiledFiles.map((fname) => (
                  <a
                    key={fname}
                    href={\`/api/files/download/\${encodeURIComponent(fname)}\`}
                    download={fname}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[0.66rem] rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Download size={11} />
                    <span>TẢI ĐỀ (.DOCX)</span>
                  </a>
                ))}
                <button
                  onClick={async () => {
                    try { await api.openWorkspaceFolder();`;

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log('Replaced target 2 (banner download button)');
}

fs.writeFileSync(file, code);
console.log('Done updating index.tsx');
