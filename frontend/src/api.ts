import { AppFile, AppSettings, LayoutSettings, SystemCheck } from './types';
import { request, API_BASE, invalidateCache } from './api/client';

export { API_BASE, invalidateCache };

export const api = {
  // Config Profiles
  getProfiles: () => request<Record<string, LayoutSettings>>('/api/profiles', { tags: ['profiles'] }),
  saveProfile: (name: string, settings: LayoutSettings) =>
    request<any>('/api/profiles', { method: 'POST', body: JSON.stringify({ name, settings }), tags: ['profiles'] }),
  deleteProfile: (name: string) =>
    request<any>(`/api/profiles/${encodeURIComponent(name)}`, { method: 'DELETE', tags: ['profiles'] }),

  compileTest: (exercises: any[], settings: LayoutSettings, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string, saveToDocuments?: boolean, saveFolderId?: string | null) =>
    request<{ success: boolean; filename: string; filepath: string; files?: string[] }>('/api/test/compile', {
      method: 'POST',
      body: JSON.stringify({ exercises, settings, num_versions: numVersions, mix_options: mixOptions, grade, unit, save_to_documents: saveToDocuments, save_folder_id: saveFolderId }),
      tags: ['documents']
    }),

  previewPdf: (exercises: any[], settings: LayoutSettings, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string) =>
    request<{ success: boolean; url: string }>('/api/test/preview-pdf', {
      method: 'POST',
      body: JSON.stringify({ exercises, settings, num_versions: numVersions, mix_options: mixOptions, grade, unit })
    }),

  exportTestExcelCsv: (exercises: any[], format: string, defaultTime?: number, numVersions?: number, mixOptions?: boolean, grade?: string, unit?: string, saveToDocuments?: boolean, saveFolderId?: string | null) =>
    request<{ success: boolean; filename: string; filepath: string; files?: string[] }>('/api/test/export-excel-csv', {
      method: 'POST',
      body: JSON.stringify({ exercises, format, default_time: defaultTime, num_versions: numVersions, mix_options: mixOptions, grade, unit, save_to_documents: saveToDocuments, save_folder_id: saveFolderId }),
      tags: ['documents']
    }),

  // File Manager
  getFiles: () => request<AppFile[]>('/api/files', { tags: ['files'] }),
  uploadFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/files/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    invalidateCache(['files']);
    return response.json();
  },
  deleteFile: (filename: string) =>
    request<any>(`/api/files/${encodeURIComponent(filename)}`, { method: 'DELETE', tags: ['files'] }),
  downloadFileUrl: (filename: string) => `${API_BASE}/api/files/download/${encodeURIComponent(filename)}`,
  previewPdfFileUrl: (filename: string) => `${API_BASE}/api/files/preview-pdf/${encodeURIComponent(filename)}`,
  compileFile: (filename: string, profileName: string) =>
    request<any>('/api/files/compile', { method: 'POST', body: JSON.stringify({ filename, profile_name: profileName }) }),
  mergeVocabulary: (grade: number) =>
    request<any>('/api/files/merge-vocabulary', { method: 'POST', body: JSON.stringify({ grade }), tags: ['vocab'] }),
  formatVocabulary: (filename: string) =>
    request<any>('/api/files/format-vocabulary', { method: 'POST', body: JSON.stringify({ filename }), tags: ['vocab'] }),
  convertCsv: (filename: string) =>
    request<any>('/api/files/convert-csv', { method: 'POST', body: JSON.stringify({ filename }) }),
  convertDocx: (filename: string) =>
    request<any>('/api/files/convert-docx', { method: 'POST', body: JSON.stringify({ filename }) }),
  getSystemCheck: () => request<SystemCheck>('/api/files/system-check'),

  // Database API - Questions & Vocab
  getDbQuestions: (params: { grade?: string; unit?: string; qtype?: string; level?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => { if (val !== undefined && val !== null && val !== '') cleanParams[key] = val; });
    return request<{ success: boolean; questions: any[] }>(`/api/db/questions?${new URLSearchParams(cleanParams)}`, { tags: ['questions'] });
  },
  exportDbQuestions: (params: any) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/questions/export', { method: 'POST', body: JSON.stringify(params), tags: ['documents'] }),
  importDbQuestionsCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/questions/import`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    invalidateCache(['questions']);
    return response.json();
  },
  deleteDbQuestions: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/delete-multiple', { method: 'POST', body: JSON.stringify({ ids }), tags: ['questions'] }),
  clearDbQuestions: (grade?: string, unit?: string) => {
    const p: Record<string, string> = {};
    if (grade) p.grade = grade;
    if (unit) p.unit = unit;
    return request<{ success: boolean }>(`/api/db/questions/clear?${new URLSearchParams(p)}`, { method: 'DELETE', tags: ['questions'] });
  },
  incrementDbQuestionsFrequency: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/increment-frequency', { method: 'POST', body: JSON.stringify({ ids }), tags: ['questions'] }),
  resetDbQuestionsFrequency: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/reset-frequency', { method: 'POST', body: JSON.stringify({ ids }), tags: ['questions'] }),
  editDbQuestion: (id: number, question: any) =>
    request<{ success: boolean }>(`/api/db/questions/${id}/edit`, { method: 'POST', body: JSON.stringify(question), tags: ['questions'] }),

  getDbVocab: (params: { grade?: string; unit?: string; difficulty?: string; pos?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => { if (val !== undefined && val !== null && val !== '') cleanParams[key] = val; });
    return request<{ success: boolean; vocab: any[] }>(`/api/db/vocab?${new URLSearchParams(cleanParams)}`, { tags: ['vocab'] });
  },
  importDbVocabCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/vocab/import`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    invalidateCache(['vocab']);
    return response.json();
  },
  deleteDbVocab: (ids: number[]) =>
    request<{ success: boolean; count: number }>('/api/db/vocab/delete-multiple', { method: 'POST', body: JSON.stringify({ ids }), tags: ['vocab'] }),
  clearDbVocab: (grade?: string, unit?: string) => {
    const p: Record<string, string> = {};
    if (grade) p.grade = grade;
    if (unit) p.unit = unit;
    return request<{ success: boolean }>(`/api/db/vocab/clear?${new URLSearchParams(p)}`, { method: 'DELETE', tags: ['vocab'] });
  },
  exportDbVocabDocx: (params: any) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/vocab/export', { method: 'POST', body: JSON.stringify(params), tags: ['documents'] }),
  exportDbVocabCsv: (params: any) =>
    request<{ success: boolean; filename: string; filepath: string }>('/api/db/vocab/export-csv', { method: 'POST', body: JSON.stringify(params), tags: ['documents'] }),
  editDbVocab: (id: number, vocab: any) =>
    request<{ success: boolean }>(`/api/db/vocab/${id}/edit`, { method: 'POST', body: JSON.stringify(vocab), tags: ['vocab'] }),
  getActiveGrades: () => request<{ success: boolean; grades: string[] }>('/api/db/active-grades', { tags: ['questions', 'vocab'] }),

  getSettings: () => request<AppSettings>('/api/settings', { tags: ['settings'] }),
  saveSettings: (settings: Partial<AppSettings>) =>
    request<any>('/api/settings', { method: 'POST', body: JSON.stringify(settings), tags: ['settings'] }),
  selectDirectory: () =>
    request<{ success: boolean; directory: string | null }>('/api/system/select-directory', { method: 'POST' }),

  getPrompts: (storageKey: string) => request<any[]>(`/api/prompts/${encodeURIComponent(storageKey)}`),
  savePrompts: (storageKey: string, prompts: any[]) =>
    request<any>(`/api/prompts/${encodeURIComponent(storageKey)}`, { method: 'POST', body: JSON.stringify({ prompts }) }),

  validateDbQuestionsCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/questions/validate`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    return response.json();
  },
  confirmDbQuestionsImport: (questions: any[]) =>
    request<{ success: boolean; count: number }>('/api/db/questions/confirm-import', { method: 'POST', body: JSON.stringify({ questions }), tags: ['questions'] }),
  validateDbVocabCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/db/vocab/validate`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    return response.json();
  },
  confirmDbVocabImport: (vocab: any[]) =>
    request<{ success: boolean; count: number }>('/api/db/vocab/confirm-import', { method: 'POST', body: JSON.stringify({ vocab }), tags: ['vocab'] }),

  openLocalFile: (filename: string) => request<{ success: boolean }>('/api/utils/open-file', { method: 'POST', body: JSON.stringify({ filename }) }),
  openWorkspaceFolder: () => request<{ success: boolean }>('/api/utils/open-folder', { method: 'POST' }),
  getUnitConfig: () => request<Record<string, Record<string, string>>>('/api/unit-config'),
  saveUnitConfig: (config: Record<string, Record<string, string>>) => request<any>('/api/unit-config', { method: 'POST', body: JSON.stringify(config) }),
  getExerciseConfig: () => request<Record<string, string>>('/api/exercise-config'),
  saveExerciseConfig: (config: Record<string, string>) => request<any>('/api/exercise-config', { method: 'POST', body: JSON.stringify(config) }),

  // Grade Analytics Reports API
  getGradeAnalytics: (class_id?: number, student_id?: number, forceRefresh?: boolean) => {
    const p: Record<string, string> = {};
    if (class_id) p.class_id = String(class_id);
    if (student_id) p.student_id = String(student_id);
    return request<any>(`/api/reports/grade-analytics?${new URLSearchParams(p)}`, { tags: ['reports', 'analytics', 'attendance'], forceRefresh });
  },
  resetGrades: (params: any) =>
    request<{ status: string; reset_count: number }>('/api/reports/reset-grades', { method: 'POST', body: JSON.stringify(params), tags: ['attendance', 'reports', 'analytics'] }),
  getTimePhases: (class_id?: number) => request<any[]>(`/api/reports/time-phases${class_id ? `?class_id=${class_id}` : ''}`, { tags: ['reports'] }),
  saveTimePhase: (payload: any) => request<any>('/api/reports/time-phases', { method: 'POST', body: JSON.stringify(payload), tags: ['reports'] }),
  deleteTimePhase: (phase_id: number) => request<{ status: string; deleted: boolean }>(`/api/reports/time-phases/${phase_id}`, { method: 'DELETE', tags: ['reports'] }),

  // Document Manager (Tài liệu) API
  getDocuments: (params: { folder_id?: string; tag?: string; search?: string }) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => { if (val !== undefined && val !== null && val !== '') cleanParams[key] = val; });
    return request<{ success: boolean; documents: any[] }>(`/api/documents?${new URLSearchParams(cleanParams)}`, { tags: ['documents'] });
  },
  createDocumentFolder: (name: string, parentId?: number) =>
    request<{ success: boolean; id: number; name: string; parent_id?: number }>('/api/documents/folders', { method: 'POST', body: JSON.stringify({ name, parent_id: parentId }), tags: ['documents'] }),
  getDocumentFolders: () => request<{ success: boolean; folders: any[] }>('/api/documents/folders', { tags: ['documents'] }),
  deleteDocumentFolder: (folderId: number) => request<{ success: boolean }>(`/api/documents/folders/${folderId}`, { method: 'DELETE', tags: ['documents'] }),
  uploadDocument: async (file: File, folderId?: string, tags?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folder_id', folderId);
    if (tags) formData.append('tags', tags);
    const response = await fetch(`${API_BASE}/api/documents/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    invalidateCache(['documents']);
    return response.json();
  },
  deleteDocument: (docId: number) => request<{ success: boolean }>(`/api/documents/${docId}`, { method: 'DELETE', tags: ['documents'] }),
  updateDocumentTags: (docId: number, tags: string) => request<{ success: boolean }>(`/api/documents/${docId}/tags`, { method: 'POST', body: JSON.stringify({ tags }), tags: ['documents'] }),
  moveDocument: (docId: number, folderId: string | null) => request<{ success: boolean }>(`/api/documents/${docId}/move`, { method: 'POST', body: JSON.stringify({ folder_id: folderId }), tags: ['documents'] }),
  moveDocumentFolder: (folderId: number, parentId: string | null) => request<{ success: boolean }>(`/api/documents/folders/${folderId}/move`, { method: 'POST', body: JSON.stringify({ parent_id: parentId }), tags: ['documents'] }),
  uploadDocumentAttachment: async (docId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/documents/${docId}/attachments/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    invalidateCache(['documents']);
    return response.json();
  },
  deleteDocumentAttachment: (attId: number) => request<{ success: boolean }>(`/api/documents/attachments/${attId}`, { method: 'DELETE', tags: ['documents'] }),
  downloadDocumentUrl: (docId: number) => `${API_BASE}/api/documents/download/${docId}`,
  downloadAttachmentUrl: (attId: number) => `${API_BASE}/api/documents/attachments/download/${attId}`,
  getTrashDocuments: () => request<{ success: boolean; documents: any[]; folders: any[] }>('/api/documents/trash', { tags: ['documents'] }),
  restoreDocument: (docId: number) => request<{ success: boolean }>(`/api/documents/${docId}/restore`, { method: 'POST', tags: ['documents'] }),
  restoreDocumentFolder: (folderId: number) => request<{ success: boolean }>(`/api/documents/folders/${folderId}/restore`, { method: 'POST', tags: ['documents'] }),
  permanentlyDeleteDocument: (docId: number) => request<{ success: boolean }>(`/api/documents/${docId}/permanent`, { method: 'DELETE', tags: ['documents'] }),
  permanentlyDeleteDocumentFolder: (folderId: number) => request<{ success: boolean }>(`/api/documents/folders/${folderId}/permanent`, { method: 'DELETE', tags: ['documents'] }),

  // Students API
  getStudents: (search = '', status = '') =>
    request<any[]>(`/api/students?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, { tags: ['students'] }),
  createStudent: (data: any) => request<any>('/api/students', { method: 'POST', body: JSON.stringify(data), tags: ['students', 'attendance', 'reports'] }),
  updateStudent: (id: number, data: any) => request<any>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['students', 'attendance', 'reports'] }),
  deleteStudent: (id: number) => request<any>(`/api/students/${id}`, { method: 'DELETE', tags: ['students', 'attendance', 'reports'] }),

  // Teachers CM API
  getTeachersCM: (search = '', role = '') =>
    request<any[]>(`/api/teachers_cm?search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`, { tags: ['teachers'] }),
  createTeacherCM: (data: any) => request<any>('/api/teachers_cm', { method: 'POST', body: JSON.stringify(data), tags: ['teachers', 'classes'] }),
  updateTeacherCM: (id: number, data: any) => request<any>(`/api/teachers_cm/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['teachers', 'classes'] }),
  deleteTeacherCM: (id: number) => request<any>(`/api/teachers_cm/${id}`, { method: 'DELETE', tags: ['teachers', 'classes'] }),

  // Classes API
  getClasses: (search = '') => request<any[]>(`/api/classes?search=${encodeURIComponent(search)}`, { tags: ['classes'] }),
  createClass: (data: any) => request<any>('/api/classes', { method: 'POST', body: JSON.stringify(data), tags: ['classes', 'schedule'] }),
  updateClass: (id: number, data: any) => request<any>(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['classes', 'schedule'] }),
  deleteClass: (id: number) => request<any>(`/api/classes/${id}`, { method: 'DELETE', tags: ['classes', 'schedule'] }),
  getClassStudents: (classId: number, forceRefresh = true) =>
    request<any[]>(`/api/classes/${classId}/students`, { tags: ['classes', 'students', 'attendance', 'seating'], forceRefresh }),
  enrollStudent: (classId: number, studentId: number, seatColor?: string, gradeGroup?: string) =>
    request<any>(`/api/classes/${classId}/students`, { method: 'POST', body: JSON.stringify({ student_id: studentId, seat_color: seatColor, grade_group: gradeGroup }), tags: ['classes', 'students', 'attendance', 'seating'] }),
  unenrollStudent: (classId: number, studentId: number) =>
    request<any>(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE', tags: ['classes', 'students', 'attendance', 'seating'] }),
  updateStudentGroups: (classId: number, studentId: number, seatColor?: string, gradeGroup?: string) =>
    request<any>(`/api/classes/${classId}/students/${studentId}/groups`, { method: 'PUT', body: JSON.stringify({ student_id: studentId, seat_color: seatColor, grade_group: gradeGroup }), tags: ['classes', 'students', 'attendance', 'seating'] }),
  getClassWeeklySchedule: (classId: number) => request<any[]>(`/api/classes/${classId}/schedule/weekly`, { tags: ['schedule'] }),
  addClassWeeklySlot: (classId: number, data: any) => request<any>(`/api/classes/${classId}/schedule/weekly`, { method: 'POST', body: JSON.stringify(data), tags: ['schedule'] }),
  replaceClassWeeklySlots: (classId: number, slots: any[]) => request<any>(`/api/classes/${classId}/schedule/weekly/replace`, { method: 'POST', body: JSON.stringify(slots), tags: ['schedule'] }),
  deleteClassWeeklySlot: (slotId: number) => request<any>(`/api/classes/0/schedule/weekly/${slotId}`, { method: 'DELETE', tags: ['schedule'] }),
  getClassSessions: (classId: number, month = '') => request<any[]>(`/api/classes/${classId}/schedule/sessions?month=${encodeURIComponent(month)}`, { tags: ['schedule', 'sessions'] }),
  addClassSession: (classId: number, data: any) => request<any>(`/api/classes/${classId}/schedule/sessions`, { method: 'POST', body: JSON.stringify(data), tags: ['schedule', 'sessions'] }),
  updateClassSession: (classId: number, sessionId: number, data: any) => request<any>(`/api/classes/${classId}/schedule/sessions/${sessionId}`, { method: 'PUT', body: JSON.stringify(data), tags: ['schedule', 'sessions'] }),
  deleteClassSession: (sessionId: number) => request<any>(`/api/classes/0/schedule/sessions/${sessionId}`, { method: 'DELETE', tags: ['schedule', 'sessions'] }),
  getClassSeating: (classId: number) => request<any>(`/api/classes/${classId}/seating`, { tags: ['seating'] }),
  saveClassSeating: (classId: number, numRows: number, layoutJson: string) =>
    request<any>(`/api/classes/${classId}/seating`, { method: 'PUT', body: JSON.stringify({ num_rows: numRows, layout_json: layoutJson }), tags: ['seating'] }),
  mixClassSeating: (classId: number, numCols: number, desksPerCol: number, colsConfig?: any[], date?: string) =>
    request<any>(`/api/classes/${classId}/seating/mix`, { method: 'POST', body: JSON.stringify({ num_cols: numCols, desks_per_col: desksPerCol, cols_config: colsConfig, date }), tags: ['seating'] }),
  getClassAttendance: (classId: number, date: string, forceRefresh = true) =>
    request<{ date: string; records: any[] }>(`/api/classes/${classId}/attendance?date=${encodeURIComponent(date)}`, { tags: ['attendance'], forceRefresh }),
  saveClassAttendance: (classId: number, date: string, records: any[]) =>
    request<any>(`/api/classes/${classId}/attendance`, { method: 'POST', body: JSON.stringify({ date, records }), tags: ['attendance', 'reports', 'analytics'] }),
  exportClassExcel: (classId: number, date: string, records?: any[]) =>
    request<{ filename: string; status: string }>(`/api/classes/${classId}/export/excel`, { method: 'POST', body: JSON.stringify({ date, records }) }),
  exportClassDocx: (classId: number, date: string, records?: any[]) =>
    request<{ filename: string; status: string }>(`/api/classes/${classId}/export/docx`, { method: 'POST', body: JSON.stringify({ date, records }) }),

  // Groups & Swaps
  getFriendGroups: (classId: number) => request<any[]>(`/api/classes/${classId}/friend-groups`, { tags: ['groups'] }),
  createFriendGroup: (classId: number, groupName: string) => request<any>(`/api/classes/${classId}/friend-groups`, { method: 'POST', body: JSON.stringify({ group_name: groupName }), tags: ['groups'] }),
  deleteFriendGroup: (classId: number, groupId: number) => request<any>(`/api/classes/${classId}/friend-groups/${groupId}`, { method: 'DELETE', tags: ['groups'] }),
  addFriendGroupMember: (classId: number, groupId: number, studentId: number) => request<any>(`/api/classes/${classId}/friend-groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ student_id: studentId }), tags: ['groups'] }),
  removeFriendGroupMember: (classId: number, groupId: number, studentId: number) => request<any>(`/api/classes/${classId}/friend-groups/${groupId}/members/${studentId}`, { method: 'DELETE', tags: ['groups'] }),
  getConflictGroups: (classId: number) => request<any[]>(`/api/classes/${classId}/conflict-groups`, { tags: ['groups'] }),
  createConflictGroup: (classId: number, groupName: string) => request<any>(`/api/classes/${classId}/conflict-groups`, { method: 'POST', body: JSON.stringify({ group_name: groupName }), tags: ['groups'] }),
  deleteConflictGroup: (classId: number, groupId: number) => request<any>(`/api/classes/${classId}/conflict-groups/${groupId}`, { method: 'DELETE', tags: ['groups'] }),
  addConflictGroupMember: (classId: number, groupId: number, studentId: number) => request<any>(`/api/classes/${classId}/conflict-groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ student_id: studentId }), tags: ['groups'] }),
  removeConflictGroupMember: (classId: number, groupId: number, studentId: number) => request<any>(`/api/classes/${classId}/conflict-groups/${groupId}/members/${studentId}`, { method: 'DELETE', tags: ['groups'] }),
  getTrustedSwaps: (classId: number) => request<any[]>(`/api/classes/${classId}/trusted-swaps`, { tags: ['groups'] }),
  addTrustedSwapStudent: (classId: number, studentId: number) => request<any>(`/api/classes/${classId}/trusted-swaps`, { method: 'POST', body: JSON.stringify({ student_id: studentId }), tags: ['groups'] }),
  deleteTrustedSwapStudent: (classId: number, studentId: number) => request<any>(`/api/classes/${classId}/trusted-swaps/${studentId}`, { method: 'DELETE', tags: ['groups'] }),

  geneticMixSeating: (classId: number, payload?: any) => request<any>(`/api/classes/${classId}/seating/genetic-mix`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  blossomSwapPairs: (classId: number, payload?: any) => request<any>(`/api/classes/${classId}/seating/blossom-swap`, { method: 'POST', body: JSON.stringify(payload || {}) }),

  // Courses API
  getCourses: (search = '', status = '') => request<any[]>(`/api/courses?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, { tags: ['courses'] }),
  createCourse: (data: any) => request<any>('/api/courses', { method: 'POST', body: JSON.stringify(data), tags: ['courses'] }),
  updateCourse: (id: number, data: any) => request<any>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['courses'] }),
  deleteCourse: (id: number) => request<any>(`/api/courses/${id}`, { method: 'DELETE', tags: ['courses'] }),

  // Scores API
  getScores: (classId?: number, studentId?: number) => request<any[]>(`/api/scores?class_id=${classId || ''}&student_id=${studentId || ''}`, { tags: ['scores'] }),
  upsertScore: (data: any) => request<any>('/api/scores', { method: 'POST', body: JSON.stringify(data), tags: ['scores', 'reports', 'analytics'] }),
  deleteScore: (id: number) => request<any>(`/api/scores/${id}`, { method: 'DELETE', tags: ['scores', 'reports', 'analytics'] }),

  parseQuizFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/kiemtra/parse`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.text()) || response.statusText);
    return response.json();
  },

  getSkillBreakdown: (classId?: number, studentId?: number) => {
    const p: string[] = [];
    if (classId) p.push(`class_id=${classId}`);
    if (studentId) p.push(`student_id=${studentId}`);
    return request<any>(`/api/reports/skill-breakdown${p.length ? `?${p.join('&')}` : ''}`, { tags: ['reports', 'analytics'] });
  },
  getSessionTestConfig: (classId: number, date: string) =>
    request<{ configured: boolean; test_config: any; session_id: number | null }>(`/api/classes/${classId}/sessions/test-config?date=${encodeURIComponent(date)}`, { tags: ['schedule'] }),
  saveSessionTestConfig: (classId: number, data: any) =>
    request<any>(`/api/classes/${classId}/sessions/test-config`, { method: 'POST', body: JSON.stringify(data), tags: ['schedule'] }),
  getUnitSuggestions: (grade?: string) => request<any>(`/api/suggestions/units${grade ? `?grade=${encodeURIComponent(grade)}` : ''}`),

  // Assignments API (Bài Tập Về Nhà)
  getAssignments: (classId?: number, month = '') => {
    const p: string[] = [];
    if (classId) p.push(`class_id=${classId}`);
    if (month) p.push(`month=${encodeURIComponent(month)}`);
    return request<any[]>(`/api/assignments${p.length ? `?${p.join('&')}` : ''}`, { tags: ['assignments'] });
  },
  getAssignment: (id: number) => request<any>(`/api/assignments/${id}`, { tags: ['assignments'] }),
  createAssignment: (data: any) => request<any>('/api/assignments', { method: 'POST', body: JSON.stringify(data), tags: ['assignments'] }),
  updateAssignment: (id: number, data: any) => request<any>(`/api/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['assignments'] }),
  deleteAssignment: (id: number) => request<any>(`/api/assignments/${id}`, { method: 'DELETE', tags: ['assignments'] }),
  getAssignmentSubmissions: (id: number) => request<any[]>(`/api/assignments/${id}/submissions`, { tags: ['assignments'] }),
  updateAssignmentSubmissions: (id: number, submissions: any[]) =>
    request<any>(`/api/assignments/${id}/submissions`, { method: 'PUT', body: JSON.stringify({ submissions }), tags: ['assignments'] }),

  // Users & Permissions API (Quyền & Vai Trò)
  login: (username: string, password: string) => request<{ success: boolean; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUsers: () => request<any[]>('/api/users', { tags: ['users'] }),
  createUser: (data: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(data), tags: ['users'] }),
  updateUser: (id: number, data: any) => request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data), tags: ['users'] }),
  deleteUser: (id: number) => request<any>(`/api/users/${id}`, { method: 'DELETE', tags: ['users'] }),
  getRolePermissions: () => request<any[]>('/api/roles/permissions', { tags: ['roles'] }),
  saveRolePermissions: (permissions: any[]) => request<any>('/api/roles/permissions', { method: 'PUT', body: JSON.stringify({ permissions }), tags: ['roles'] }),
  syncStudentAccounts: () => request<any>('/api/users/sync-students', { method: 'POST', tags: ['users', 'students'] }),

  // Update & Sync API
  checkUpdate: () => request<any>('/api/system/update-check'),
  getUpdateStatus: () => request<any>('/api/system/update-status'),
  applyUpdate: () => request<any>('/api/system/update-apply', { method: 'POST' }),
  getSyncStatus: () => request<{ status: 'synced' | 'syncing' | 'offline'; last_synced_at: string | null; syncing: boolean; last_error?: string | null }>('/api/sync/status', { forceRefresh: true }),
  triggerSync: () => request<any>('/api/sync/trigger', { method: 'POST' }),
  runFullSync: () => request<any>('/api/sync/bidirectional?force_full=true', { method: 'POST' }),
};
