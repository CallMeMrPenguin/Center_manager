import { AppFile, AppSettings, LayoutSettings, SystemCheck } from './types';

// In dev mode (localhost:5173), Vite proxies /api → FastAPI at :8000.
// In production (served directly from FastAPI), /api calls hit the same origin.
// Either way, relative paths work perfectly — no hardcoded base URL needed.
const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || response.statusText);
  }

  return response.json();
}

export const api = {
  // Config Profiles
  getProfiles: () => request<Record<string, LayoutSettings>>('/api/profiles'),
  saveProfile: (name: string, settings: LayoutSettings) =>
    request<any>('/api/profiles', { method: 'POST', body: JSON.stringify({ name, settings }) }),
  deleteProfile: (name: string) =>
    request<any>(`/api/profiles/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  compileTest: (exercises: any[], settings: LayoutSettings, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string, saveToDocuments?: boolean, saveFolderId?: string | null) =>
    request<{ success: boolean; filename: string; filepath: string; files?: string[] }>('/api/test/compile', {
      method: 'POST',
      body: JSON.stringify({ exercises, settings, num_versions: numVersions, mix_options: mixOptions, grade, unit, save_to_documents: saveToDocuments, save_folder_id: saveFolderId })
    }),

  previewPdf: (exercises: any[], settings: LayoutSettings, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string) =>
    request<{ success: boolean; url: string }>('/api/test/preview-pdf', {
      method: 'POST',
      body: JSON.stringify({ exercises, settings, num_versions: numVersions, mix_options: mixOptions, grade, unit })
    }),

  exportTestExcelCsv: (exercises: any[], format: string, defaultTime?: number, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string, saveToDocuments?: boolean, saveFolderId?: string | null) =>
    request<{ success: boolean; filename: string; filepath: string; files?: string[] }>('/api/test/export-excel-csv', {
      method: 'POST',
      body: JSON.stringify({ exercises, format, default_time: defaultTime, num_versions: numVersions, mix_options: mixOptions, grade, unit, save_to_documents: saveToDocuments, save_folder_id: saveFolderId })
    }),

  // File Manager
  getFiles: () => request<AppFile[]>('/api/files'),

  uploadFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },

  deleteFile: (filename: string) =>
    request<any>(`/api/files/${encodeURIComponent(filename)}`, { method: 'DELETE' }),

  downloadFileUrl: (filename: string) =>
    `${API_BASE}/api/files/download/${encodeURIComponent(filename)}`,

  previewPdfFileUrl: (filename: string) =>
    `${API_BASE}/api/files/preview-pdf/${encodeURIComponent(filename)}`,

  compileFile: (filename: string, profileName: string) =>
    request<any>('/api/files/compile', { method: 'POST', body: JSON.stringify({ filename, profile_name: profileName }) }),

  mergeVocabulary: (grade: number) =>
    request<any>('/api/files/merge-vocabulary', { method: 'POST', body: JSON.stringify({ grade }) }),

  formatVocabulary: (filename: string) =>
    request<any>('/api/files/format-vocabulary', { method: 'POST', body: JSON.stringify({ filename }) }),

  convertCsv: (filename: string) =>
    request<any>('/api/files/convert-csv', { method: 'POST', body: JSON.stringify({ filename }) }),

  convertDocx: (filename: string) =>
    request<any>('/api/files/convert-docx', { method: 'POST', body: JSON.stringify({ filename }) }),

  getSystemCheck: () => request<SystemCheck>('/api/files/system-check'),

  // Database API
  getDbQuestions: (params: { grade?: string; unit?: string; qtype?: string; level?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; questions: any[] }>(`/api/db/questions?${query}`);
  },
  exportDbQuestions: (params: { format: string; grade?: string; unit?: string; difficulty?: string; qtype?: string; search?: string; ids?: number[]; default_time?: number }) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/questions/export', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  importDbQuestionsCsv: async (file: File): Promise<{ success: boolean; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/questions/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },
  deleteDbQuestions: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  clearDbQuestions: (grade?: string, unit?: string) => {
    const cleanParams: Record<string, string> = {};
    if (grade) cleanParams.grade = grade;
    if (unit) cleanParams.unit = unit;
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean }>(`/api/db/questions/clear?${query}`, { method: 'DELETE' });
  },
  incrementDbQuestionsFrequency: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/increment-frequency', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  resetDbQuestionsFrequency: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/reset-frequency', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  editDbQuestion: (id: number, question: any) =>
    request<{ success: boolean }>(`/api/db/questions/${id}/edit`, {
      method: 'POST',
      body: JSON.stringify(question),
    }),

  getDbVocab: (params: { grade?: string; unit?: string; difficulty?: string; pos?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; vocab: any[] }>(`/api/db/vocab?${query}`);
  },
  importDbVocabCsv: async (file: File): Promise<{ success: boolean; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/vocab/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },
  deleteDbVocab: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/vocab/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  clearDbVocab: (grade?: string, unit?: string) => {
    const cleanParams: Record<string, string> = {};
    if (grade) cleanParams.grade = grade;
    if (unit) cleanParams.unit = unit;
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean }>(`/api/db/vocab/clear?${query}`, { method: 'DELETE' });
  },
  exportDbVocabDocx: (params: { grade?: number; unit?: string; difficulty?: string; pos?: string; search?: string; save_to_documents?: boolean; save_folder_id?: string | null }) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/vocab/export', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  exportDbVocabCsv: (params: { grade?: number; unit?: string; difficulty?: string; pos?: string; search?: string; save_to_documents?: boolean; save_folder_id?: string | null }) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/vocab/export-csv', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  editDbVocab: (id: number, vocab: any) =>
    request<{ success: boolean }>(`/api/db/vocab/${id}/edit`, {
      method: 'POST',
      body: JSON.stringify(vocab),
    }),
  getActiveGrades: () =>
    request<{ success: boolean; grades: string[] }>('/api/db/active-grades'),

  getSettings: () => request<AppSettings>('/api/settings'),
  saveSettings: (settings: Partial<AppSettings>) =>
    request<any>('/api/settings', { method: 'POST', body: JSON.stringify(settings) }),
  selectDirectory: () =>
    request<{ success: boolean; directory: string | null }>('/api/system/select-directory', { method: 'POST' }),

  getPrompts: (storageKey: string) =>
    request<any[]>(`/api/prompts/${encodeURIComponent(storageKey)}`),
  savePrompts: (storageKey: string, prompts: any[]) =>
    request<any>(`/api/prompts/${encodeURIComponent(storageKey)}`, {
      method: 'POST',
      body: JSON.stringify({ prompts }),
    }),

  // CSV Validation & Import Confirmation
  validateDbQuestionsCsv: async (file: File): Promise<{ success: boolean; items: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/questions/validate`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },

  confirmDbQuestionsImport: (questions: any[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/confirm-import', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    }),

  validateDbVocabCsv: async (file: File): Promise<{ success: boolean; items: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/vocab/validate`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },

  confirmDbVocabImport: (vocab: any[]) =>
    request<{ success: boolean; count: number }>('/api/db/vocab/confirm-import', {
      method: 'POST',
      body: JSON.stringify({ vocab }),
    }),

  // File system native openers
  openLocalFile: (filename: string) =>
    request<{ success: boolean }>('/api/utils/open-file', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }),

  openWorkspaceFolder: () =>
    request<{ success: boolean }>('/api/utils/open-folder', {
      method: 'POST',
    }),

  // Unit Config API
  getUnitConfig: () => request<Record<string, Record<string, string>>>('/api/unit-config'),
  saveUnitConfig: (config: Record<string, Record<string, string>>) =>
    request<any>('/api/unit-config', { method: 'POST', body: JSON.stringify(config) }),
  getExerciseConfig: () => request<Record<string, string>>('/api/exercise-config'),
  saveExerciseConfig: (config: Record<string, string>) =>
    request<any>('/api/exercise-config', { method: 'POST', body: JSON.stringify(config) }),

  // Grade Analytics Reports API
  getGradeAnalytics: (class_id?: number, student_id?: number) => {
    const params: Record<string, string> = {};
    if (class_id) params.class_id = String(class_id);
    if (student_id) params.student_id = String(student_id);
    const query = new URLSearchParams(params).toString();
    return request<{ session_records: any[]; student_rankings: any[]; analytics_summary?: any }>(`/api/reports/grade-analytics?${query}`);
  },
  resetGrades: (params: { class_id?: number; student_id?: number; from_date?: string; to_date?: string }) =>
    request<{ status: string; reset_count: number }>('/api/reports/reset-grades', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Document Manager (Tài liệu) API
  getDocuments: (params: { folder_id?: string; tag?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ success: boolean; documents: any[] }>(`/api/documents?${query}`);
  },
  createDocumentFolder: (name: string, parentId?: number) =>
    request<{ success: boolean; id: number; name: string; parent_id?: number }>('/api/documents/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId })
    }),
  getDocumentFolders: () =>
    request<{ success: boolean; folders: any[] }>('/api/documents/folders'),
  deleteDocumentFolder: (folderId: number) =>
    request<{ success: boolean }>(`/api/documents/folders/${folderId}`, { method: 'DELETE' }),
  uploadDocument: async (file: File, folderId?: string, tags?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folder_id', folderId);
    if (tags) formData.append('tags', tags);
    const response = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },
  deleteDocument: (docId: number) =>
    request<{ success: boolean }>(`/api/documents/${docId}`, { method: 'DELETE' }),
  updateDocumentTags: (docId: number, tags: string) =>
    request<{ success: boolean }>(`/api/documents/${docId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags })
    }),
  moveDocument: (docId: number, folderId: string | null) =>
    request<{ success: boolean }>(`/api/documents/${docId}/move`, {
      method: 'POST',
      body: JSON.stringify({ folder_id: folderId })
    }),
  moveDocumentFolder: (folderId: number, parentId: string | null) =>
    request<{ success: boolean }>(`/api/documents/folders/${folderId}/move`, {
      method: 'POST',
      body: JSON.stringify({ parent_id: parentId })
    }),
  uploadDocumentAttachment: async (docId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/documents/${docId}/attachments/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },
  deleteDocumentAttachment: (attId: number) =>
    request<{ success: boolean }>(`/api/documents/attachments/${attId}`, { method: 'DELETE' }),
  downloadDocumentUrl: (docId: number) =>
    `${API_BASE}/api/documents/download/${docId}`,
  downloadAttachmentUrl: (attId: number) =>
    `${API_BASE}/api/documents/attachments/download/${attId}`,
  getTrashDocuments: () =>
    request<{ success: boolean; documents: any[]; folders: any[] }>('/api/documents/trash'),
  restoreDocument: (docId: number) =>
    request<{ success: boolean }>(`/api/documents/${docId}/restore`, { method: 'POST' }),
  restoreDocumentFolder: (folderId: number) =>
    request<{ success: boolean }>(`/api/documents/folders/${folderId}/restore`, { method: 'POST' }),
  permanentlyDeleteDocument: (docId: number) =>
    request<{ success: boolean }>(`/api/documents/${docId}/permanent`, { method: 'DELETE' }),
  permanentlyDeleteDocumentFolder: (folderId: number) =>
    request<{ success: boolean }>(`/api/documents/folders/${folderId}/permanent`, { method: 'DELETE' }),

  // Students API
  getStudents: (search = '', status = '') =>
    request<any[]>(`/api/students?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  createStudent: (data: any) =>
    request<any>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: number, data: any) =>
    request<any>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: number) =>
    request<any>(`/api/students/${id}`, { method: 'DELETE' }),

  // Teachers CM API
  getTeachersCM: (search = '', role = '') =>
    request<any[]>(`/api/teachers_cm?search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`),
  createTeacherCM: (data: any) =>
    request<any>('/api/teachers_cm', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacherCM: (id: number, data: any) =>
    request<any>(`/api/teachers_cm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacherCM: (id: number) =>
    request<any>(`/api/teachers_cm/${id}`, { method: 'DELETE' }),

  // Classes API
  getClasses: (search = '') =>
    request<any[]>(`/api/classes?search=${encodeURIComponent(search)}`),
  createClass: (data: any) =>
    request<any>('/api/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: number, data: any) =>
    request<any>(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: number) =>
    request<any>(`/api/classes/${id}`, { method: 'DELETE' }),
  getClassStudents: (classId: number) =>
    request<any[]>(`/api/classes/${classId}/students`),
  enrollStudent: (classId: number, studentId: number, seatColor?: string, gradeGroup?: string) =>
    request<any>(`/api/classes/${classId}/students`, { method: 'POST', body: JSON.stringify({ student_id: studentId, seat_color: seatColor, grade_group: gradeGroup }) }),
  unenrollStudent: (classId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE' }),
  updateStudentGroups: (classId: number, studentId: number, seatColor?: string, gradeGroup?: string) =>
    request<any>(`/api/classes/${classId}/students/${studentId}/groups`, { method: 'PUT', body: JSON.stringify({ student_id: studentId, seat_color: seatColor, grade_group: gradeGroup }) }),
  getClassWeeklySchedule: (classId: number) =>
    request<any[]>(`/api/classes/${classId}/schedule/weekly`),
  addClassWeeklySlot: (classId: number, data: any) =>
    request<any>(`/api/classes/${classId}/schedule/weekly`, { method: 'POST', body: JSON.stringify(data) }),
  replaceClassWeeklySlots: (classId: number, slots: any[]) =>
    request<any>(`/api/classes/${classId}/schedule/weekly/replace`, { method: 'POST', body: JSON.stringify(slots) }),
  deleteClassWeeklySlot: (slotId: number) =>
    request<any>(`/api/classes/0/schedule/weekly/${slotId}`, { method: 'DELETE' }),
  getClassSessions: (classId: number, month = '') =>
    request<any[]>(`/api/classes/${classId}/schedule/sessions?month=${encodeURIComponent(month)}`),
  addClassSession: (classId: number, data: any) =>
    request<any>(`/api/classes/${classId}/schedule/sessions`, { method: 'POST', body: JSON.stringify(data) }),
  updateClassSession: (classId: number, sessionId: number, data: any) =>
    request<any>(`/api/classes/${classId}/schedule/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClassSession: (sessionId: number) =>
    request<any>(`/api/classes/0/schedule/sessions/${sessionId}`, { method: 'DELETE' }),
  getClassSeating: (classId: number) =>
    request<any>(`/api/classes/${classId}/seating`),
  saveClassSeating: (classId: number, numRows: number, layoutJson: string) =>
    request<any>(`/api/classes/${classId}/seating`, { method: 'PUT', body: JSON.stringify({ num_rows: numRows, layout_json: layoutJson }) }),
  mixClassSeating: (classId: number, numCols: number, desksPerCol: number, colsConfig?: any[]) =>
    request<any>(`/api/classes/${classId}/seating/mix`, { method: 'POST', body: JSON.stringify({ num_cols: numCols, desks_per_col: desksPerCol, cols_config: colsConfig }) }),
  generateGradingPairs: (classId: number) =>
    request<any>(`/api/classes/${classId}/seating/grading-pairs`, { method: 'POST' }),
  getClassAttendance: (classId: number, date: string) =>
    request<{ date: string; records: any[] }>(`/api/classes/${classId}/attendance?date=${encodeURIComponent(date)}`),
  saveClassAttendance: (classId: number, date: string, records: any[]) =>
    request<any>(`/api/classes/${classId}/attendance`, { method: 'POST', body: JSON.stringify({ date, records }) }),
  exportClassExcel: (classId: number, date: string, records?: any[]) =>
    request<{ filename: string; status: string }>(`/api/classes/${classId}/export/excel`, {
      method: 'POST',
      body: JSON.stringify({ date, records })
    }),
  exportClassDocx: (classId: number, date: string, records?: any[]) =>
    request<{ filename: string; status: string }>(`/api/classes/${classId}/export/docx`, {
      method: 'POST',
      body: JSON.stringify({ date, records })
    }),

  // Friend Groups API
  getFriendGroups: (classId: number) =>
    request<any[]>(`/api/classes/${classId}/friend-groups`),
  createFriendGroup: (classId: number, groupName: string) =>
    request<any>(`/api/classes/${classId}/friend-groups`, { method: 'POST', body: JSON.stringify({ group_name: groupName }) }),
  deleteFriendGroup: (classId: number, groupId: number) =>
    request<any>(`/api/classes/${classId}/friend-groups/${groupId}`, { method: 'DELETE' }),
  addFriendGroupMember: (classId: number, groupId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/friend-groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) }),
  removeFriendGroupMember: (classId: number, groupId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/friend-groups/${groupId}/members/${studentId}`, { method: 'DELETE' }),

  // Conflict Groups API
  getConflictGroups: (classId: number) =>
    request<any[]>(`/api/classes/${classId}/conflict-groups`),
  createConflictGroup: (classId: number, groupName: string) =>
    request<any>(`/api/classes/${classId}/conflict-groups`, { method: 'POST', body: JSON.stringify({ group_name: groupName }) }),
  deleteConflictGroup: (classId: number, groupId: number) =>
    request<any>(`/api/classes/${classId}/conflict-groups/${groupId}`, { method: 'DELETE' }),
  addConflictGroupMember: (classId: number, groupId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/conflict-groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) }),
  removeConflictGroupMember: (classId: number, groupId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/conflict-groups/${groupId}/members/${studentId}`, { method: 'DELETE' }),

  // Trusted Swaps (Individual) API
  getTrustedSwaps: (classId: number) =>
    request<any[]>(`/api/classes/${classId}/trusted-swaps`),
  addTrustedSwapStudent: (classId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/trusted-swaps`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) }),
  deleteTrustedSwapStudent: (classId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/trusted-swaps/${studentId}`, { method: 'DELETE' }),

  // Seating Algorithms API
  geneticMixSeating: (classId: number, payload?: any) =>
    request<any>(`/api/classes/${classId}/seating/genetic-mix`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  blossomSwapPairs: (classId: number, payload?: any) =>
    request<any>(`/api/classes/${classId}/seating/blossom-swap`, { method: 'POST', body: JSON.stringify(payload || {}) }),


  // Courses API
  getCourses: (search = '', status = '') =>
    request<any[]>(`/api/courses?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  createCourse: (data: any) =>
    request<any>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: number, data: any) =>
    request<any>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: number) =>
    request<any>(`/api/courses/${id}`, { method: 'DELETE' }),

  // Scores API
  getScores: (classId?: number, studentId?: number) =>
    request<any[]>(`/api/scores?class_id=${classId || ''}&student_id=${studentId || ''}`),
  upsertScore: (data: any) =>
    request<any>('/api/scores', { method: 'POST', body: JSON.stringify(data) }),
  deleteScore: (id: number) =>
    request<any>(`/api/scores/${id}`, { method: 'DELETE' }),

  // Parse Quiz API
  parseQuizFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/kiemtra/parse`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || response.statusText);
    }
    return response.json();
  },
};
