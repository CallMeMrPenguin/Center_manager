import { request, invalidateCache } from './client';

export interface WordDocument {
  id: number;
  title: string;
  content_html?: string;
  content_json?: string;
  category: string;
  description?: string;
  tags?: string;
  paper_size?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: string; // JSON { top, bottom, left, right } in mm
  is_template?: number;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MergeDataResponse {
  success: boolean;
  students: { id: number; name: string; grade: string; nickname?: string }[];
  classes: { id: number; name: string; grade: string }[];
  teachers: { id: number; name: string; role: string }[];
}

export const wordDocumentsApi = {
  getDocuments: async (params?: { category?: string; search?: string; is_template?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.is_template !== undefined) query.append('is_template', String(params.is_template));

    const path = `/api/word-documents${query.toString() ? `?${query.toString()}` : ''}`;
    return request<{ success: boolean; documents: WordDocument[] }>(path, {
      tags: ['word_documents'],
      forceRefresh: true,
    });
  },

  getTemplates: async () => {
    return request<{ success: boolean; templates: WordDocument[] }>('/api/word-documents/templates', {
      tags: ['word_documents'],
    });
  },

  getDocument: async (id: number) => {
    return request<{ success: boolean; document: WordDocument }>(`/api/word-documents/${id}`, {
      forceRefresh: true,
    });
  },

  createDocument: async (payload: Partial<WordDocument>) => {
    const res = await request<{ success: boolean; id: number; title: string }>('/api/word-documents', {
      method: 'POST',
      body: JSON.stringify(payload),
      tags: ['word_documents'],
    });
    invalidateCache(['word_documents']);
    return res;
  },

  updateDocument: async (id: number, payload: Partial<WordDocument>) => {
    const res = await request<{ success: boolean; id: number }>(`/api/word-documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      tags: ['word_documents'],
    });
    invalidateCache(['word_documents']);
    return res;
  },

  deleteDocument: async (id: number) => {
    const res = await request<{ success: boolean; id: number }>(`/api/word-documents/${id}`, {
      method: 'DELETE',
      tags: ['word_documents'],
    });
    invalidateCache(['word_documents']);
    return res;
  },

  duplicateDocument: async (id: number) => {
    const res = await request<{ success: boolean; id: number }>(`/api/word-documents/${id}/duplicate`, {
      method: 'POST',
      tags: ['word_documents'],
    });
    invalidateCache(['word_documents']);
    return res;
  },

  getMergeData: async () => {
    return request<MergeDataResponse>('/api/word-documents/merge-data', {
      tags: ['students', 'classes', 'teachers'],
      ttlMs: 60000,
    });
  },
};
