import React from 'react';
import { Music, Video, X } from 'lucide-react';

interface MediaPlayerPopupProps {
  player: { url: string; type: 'audio' | 'video'; name: string } | null;
  onClose: () => void;
}

export const MediaPlayerPopup: React.FC<MediaPlayerPopupProps> = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-96 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 truncate">
          {player.type === 'audio' ? (
            <Music size={14} className="text-blue-500" />
          ) : (
            <Video size={14} className="text-purple-500" />
          )}
          <span className="text-[10px] font-bold text-slate-800 truncate">{player.name}</span>
        </div>
        <button onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
          <X size={14} />
        </button>
      </div>

      {player.type === 'audio' ? (
        <audio src={player.url} controls className="w-full" autoPlay />
      ) : (
        <video src={player.url} controls className="w-full rounded-lg" autoPlay />
      )}
    </div>
  );
};
