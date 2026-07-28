const fs = require('fs');
const path = require('path');
const prompts = require(path.join(__dirname, '../prompts.json'));
const content = prompts.prompts_test_formatter[0].content;
const tsxPath = 'frontend/src/pages/test-formatter/index.tsx';
let code = fs.readFileSync(tsxPath, 'utf8');

const startIdx = code.indexOf('const DEFAULT_TEST_FORMATTER_PROMPTS');
const endIdx = code.indexOf('const DEFAULT_LAYOUT');

if (startIdx !== -1 && endIdx !== -1) {
  const newSection = `const DEFAULT_TEST_FORMATTER_PROMPTS: PromptItem[] = [
  {
    id: "tf_2",
    title: "Form",
    content: ${JSON.stringify(content)}
  }
];\n\n`;
  code = code.substring(0, startIdx) + newSection + code.substring(endIdx);
  fs.writeFileSync(tsxPath, code);
  console.log('Successfully updated index.tsx default prompt!');
} else {
  console.error('Indices not found:', startIdx, endIdx);
}
