import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, valueClassName = 'text-slate-100' }) => {
  return (
    <div className="bg-slate-800/50 rounded-md p-4 shadow-md border border-slate-700 flex items-center space-x-4">
      <div className="p-1">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className={`text-2xl font-semibold font-mono ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;