import React from 'react';

interface BotAvatarProps {
  className?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({ className = '' }) => {
  return (
    <div className={`robot-avatar group relative h-20 w-20 shrink-0 ${className}`}>
      <div className="absolute inset-[-18%] rounded-full bg-violet-500/25 blur-2xl transition duration-300 group-hover:bg-cyan-400/35" />
      <img
        src="/robot-chat-avatar-idle.png"
        alt="Kapruka AI robot chat icon"
        className="relative h-20 w-20 object-contain drop-shadow-[0_0_24px_rgba(124,58,237,0.72)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-110"
      />
      <div className="pointer-events-none absolute -left-4 -top-5 h-11 w-11 opacity-0 transition duration-200 group-hover:opacity-100">
        <img
          src="/robot-wave-hand.png"
          alt=""
          aria-hidden="true"
          className="h-11 w-11 object-contain drop-shadow-[0_0_10px_rgba(103,232,249,0.6)]"
        />
        <img
          src="/robot-wave-hand.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-11 w-11 object-contain [clip-path:inset(0_0_45%_0)] group-hover:[animation:avatarHandWave_1.45s_ease-in-out_infinite]"
        />
      </div>
    </div>
  );
};

export default BotAvatar;
