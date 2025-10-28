import React from 'react';
import { AIStatus } from '../types';

interface HeaderProps {
  status: AIStatus;
}

const statusConfig = {
    [AIStatus.INACTIVE]: { text: AIStatus.INACTIVE, color: 'bg-slate-600' },
    [AIStatus.RUNNING]: { text: AIStatus.RUNNING, color: 'bg-lime-500' },
    [AIStatus.THINKING]: { text: AIStatus.THINKING, color: 'bg-sky-500' },
    [AIStatus.ERROR]: { text: AIStatus.ERROR, color: 'bg-red-500' },
};

const Header: React.FC<HeaderProps> = ({ status }) => {
  const { text, color } = statusConfig[status];

  return (
    <header className="flex justify-between items-center pb-4 border-b border-slate-700">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-wide">
        Gemini AI 交易机器人
      </h1>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${color} ${status === AIStatus.RUNNING || status === AIStatus.THINKING ? 'animate-pulse' : ''}`}></div>
        <span className="text-sm font-medium text-slate-300">{text}</span>
      </div>
    </header>
  );
};

export default Header;
