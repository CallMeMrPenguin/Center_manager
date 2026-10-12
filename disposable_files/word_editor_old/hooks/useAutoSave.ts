import { useState, useEffect, useRef, useCallback } from 'react';
import { wordDocumentsApi } from '../../../api/wordDocumentsApi';
import { SaveStatus, MarginConfig, Orientation, PaperSize } from '../types';

interface AutoSaveProps {
  docId: number | null;
  title: string;
  contentHtml: string;
  category: string;
  margins: MarginConfig;
  orientation: Orientation;
  paperSize: PaperSize;
  onSaved?: (docId: number) => void;
}

export function useAutoSave({
  docId,
  title,
  contentHtml,
  category,
  margins,
  orientation,
  paperSize,
  onSaved,
}: AutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Key for local backup
  const localKey = `cm_word_draft_${docId || 'new'}`;

  // 1. Instant local storage draft backup
  const backupToLocal = useCallback(() => {
    try {
      localStorage.setItem(
        localKey,
        JSON.stringify({
          docId,
          title,
          contentHtml,
          category,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('Cannot write local draft:', e);
    }
  }, [localKey, docId, title, contentHtml, category]);

  // 2. Direct API save function
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!docId) return false;
    setSaveStatus('saving');
    try {
      await wordDocumentsApi.updateDocument(docId, {
        title,
        content_html: contentHtml,
        category,
        margins: JSON.stringify(margins),
        orientation,
        paper_size: paperSize,
      });
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      // Clear or update local draft
      backupToLocal();
      if (onSaved) onSaved(docId);
      return true;
    } catch (err) {
      console.error('AutoSave failed, keeping draft in local storage:', err);
      setSaveStatus('offline');
      backupToLocal();
      return false;
    }
  }, [docId, title, contentHtml, category, margins, orientation, paperSize, onSaved, backupToLocal]);

  // 3. Trigger debounced auto-save on state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!docId) return;

    setSaveStatus('dirty');
    backupToLocal();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNow();
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [docId, title, contentHtml, category, margins, orientation, paperSize, backupToLocal, saveNow]);

  return {
    saveStatus,
    lastSavedAt,
    saveNow,
    setSaveStatus,
  };
}
