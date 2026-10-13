import React, { useState, useEffect } from 'react';
import { Heart, MoreHorizontal, Eye } from 'lucide-react';

export interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
}

export interface LiveOverlayProps {
  viewerCount?: string;
  comments?: CommentItem[];
}

export interface FloatingHeart {
  id: number;
  x: number;
  color: string;
  size: number;
}

const DEFAULT_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    user: 'Linh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&auto=format&fit=crop&q=80',
    text: 'Sản phẩm này tốt quá!',
  },
  {
    id: 'c2',
    user: 'Mai',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&auto=format&fit=crop&q=80',
    text: 'Mua ở đâu vậy ạ?',
  },
  {
    id: 'c3',
    user: 'Thu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&auto=format&fit=crop&q=80',
    text: 'Đã chốt đơn!',
  },
];

const HEART_COLORS = ['#FE2C55', '#FF4D6D', '#25F4EE', '#FFFFFF'];

export const LiveOverlay: React.FC<LiveOverlayProps> = ({
  viewerCount = '12.4K',
  comments: customComments,
}) => {
  const commentList = customComments || DEFAULT_COMMENTS;
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  // Periodic automatic floating heart spawn
  useEffect(() => {
    const heartInterval = setInterval(() => {
      spawnHeart();
    }, 1400);

    return () => clearInterval(heartInterval);
  }, []);

  const spawnHeart = (customX?: number) => {
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: customX !== undefined ? customX : Math.random() * 35 + 40,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      size: Math.floor(Math.random() * 6) + 14,
    };
    setHearts((prev) => [...prev.slice(-10), newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2800);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 40 + 35;
    spawnHeart(x);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5 text-white pointer-events-none select-none">
      {/* Top Header: LIVE badge & Viewer Count */}
      <div className="flex items-center gap-1.5 pt-1.5 pl-0.5 pointer-events-auto">
        <span className="bg-[#FE2C55] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider shadow-sm">
          LIVE
        </span>
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md text-white/90 text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* Floating Hearts Container */}
      <div className="absolute right-4 bottom-20 w-20 h-48 pointer-events-none overflow-hidden">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-0 animate-float-up pointer-events-none"
            style={{
              left: `${heart.x}%`,
              color: heart.color,
            }}
          >
            <Heart
              style={{
                width: `${heart.size}px`,
                height: `${heart.size}px`,
                fill: heart.color,
                stroke: 'transparent',
                filter: `drop-shadow(0 2px 4px ${heart.color}80)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom Area: Comments + Input Bar */}
      <div className="space-y-2.5 pointer-events-auto max-w-[90%]">
        {/* Comment Bubbles */}
        <div className="space-y-1.5">
          {commentList.map((comment) => (
            <div
              key={comment.id}
              className="inline-flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] text-white border border-white/10 shadow-sm"
            >
              <img
                src={comment.avatar}
                alt={comment.user}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover border border-white/20 flex-shrink-0"
              />
              <span className="text-white/95 font-medium leading-tight truncate">{comment.text}</span>
            </div>
          ))}
        </div>

        {/* Live Bottom Bar */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex-1 bg-black/45 backdrop-blur-md border border-white/15 rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] text-white/60 truncate">
            Thêm bình luận...
          </div>

          {/* Red Heart Button */}
          <button
            onClick={handleLikeClick}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FE2C55] flex items-center justify-center text-white transition-transform active:scale-90 shadow-md flex-shrink-0"
            title="Thả tim"
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
          </button>

          {/* Three Dots Button */}
          <button
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 transition-transform active:scale-90 flex-shrink-0"
            title="Thêm"
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
