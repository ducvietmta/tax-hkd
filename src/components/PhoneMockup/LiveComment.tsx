import React from 'react';

export interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
  isHost?: boolean;
}

interface LiveCommentProps {
  comment: CommentItem;
}

export const LiveComment: React.FC<LiveCommentProps> = ({ comment }) => {
  return (
    <div className="flex items-start gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full max-w-[88%] text-[11px] leading-tight text-white border border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <img
        src={comment.avatar}
        alt={comment.user}
        className="w-4 h-4 rounded-full object-cover flex-shrink-0 mt-0.5 border border-white/20"
      />
      <div className="flex-1 truncate">
        <span className="font-semibold text-white/80 mr-1.5">
          {comment.user}
          {comment.isHost && (
            <span className="ml-1 text-[9px] bg-[#FE2C55] text-white px-1 py-0.2 rounded">
              Host
            </span>
          )}
          :
        </span>
        <span className="text-white/95">{comment.text}</span>
      </div>
    </div>
  );
};
