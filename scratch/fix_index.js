const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/pages/test-formatter/index.tsx');
let lines = fs.readFileSync(targetFile, 'utf8').split('\n');

// Find line starting with const res = await api.compileTest
let startLineIdx = lines.findIndex(l => l.includes('const res = await api.compileTest'));
let endLineIdx = lines.findIndex((l, idx) => idx > startLineIdx && l.includes('catch (e) {'));

if (startLineIdx !== -1 && endLineIdx !== -1) {
  const newLines = [
    '      const res = await api.compileTest(exercisesData, layout, numVersions, mixOptions, grade, unit, saveToDocs, saveFolderId || null);',
    '      if (res.success) {',
    '        const filesList = res.files || [res.filename];',
    '        setLastCompiledFiles(filesList);',
    '        showToast(`Đã xuất bản thành công ${filesList.length} đề thi vào thư mục workspace_files!`, "success");',
    '      }'
  ];
  lines.splice(startLineIdx, endLineIdx - startLineIdx, ...newLines);
  fs.writeFileSync(targetFile, lines.join('\n'));
  console.log('Fixed index.tsx cleanly!');
} else {
  console.log('Line indices not found');
}
