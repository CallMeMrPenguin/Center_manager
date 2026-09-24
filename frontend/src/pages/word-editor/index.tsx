import React from 'react';
import { WordDocumentEditor } from './components/WordDocumentEditor';

export default function WordEditorPage() {
  // Directly open full-featured Word editor workspace
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <WordDocumentEditor />
    </div>
  );
}
