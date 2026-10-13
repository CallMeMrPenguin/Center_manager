import React from 'react';
import { FileText, Archive, FileImage, Music, Video, FileCode } from 'lucide-react';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(type: string, size = 24): React.ReactNode {
  const t = (type || '').toLowerCase();
  if (['docx', 'doc'].includes(t)) return <FileText className="text-blue-500" size={size} />;
  if (['xlsx', 'xls', 'csv'].includes(t)) return <FileText className="text-emerald-500" size={size} />;
  if (t === 'pdf') return <FileText className="text-red-500" size={size} />;
  if (t === 'zip') return <Archive className="text-amber-500" size={size} />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(t)) return <FileImage className="text-pink-500" size={size} />;
  if (['mp3', 'wav', 'ogg'].includes(t)) return <Music className="text-indigo-500" size={size} />;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(t)) return <Video className="text-purple-500" size={size} />;
  return <FileCode className="text-slate-400" size={size} />;
}
