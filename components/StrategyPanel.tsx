import React from 'react';
import { RiskLevel, AIStatus } from '../types';
import { DataSource } from '../services/marketDataService';
import { Power, PowerOff, Shield, Banknote, Bitcoin, Info } from 'lucide-react';

interface StrategyPanelProps {
  status: AIStatus;
  riskLevel: RiskLevel;
  onRiskChange: (level: RiskLevel) => void;
  onStart: () => void;
  onStop: () => void;
  cash: number;
  assetAmount: number;
  assetName: string;
  dataSource: DataSource | null;
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({
  status,
  riskLevel,
  onRiskChange,
  onStart,
  onStop,
  cash,
  assetAmount,
  assetName,
  dataSource,
}) => {
  const isRunning = status === AIStatus.RUNNING || status === AIStatus.THINKING;

  const getInfoBox = () => {
    if (dataSource === 'live') {
      return (
        <p>
          <span className="font-bold text-slate-300">实时数据 / 模拟交易:</span> 此机器人使用来自 Finnhub 的实时价格。但是，所有交易都是 <span className="underline decoration-sky-400 font-semibold">模拟的</span>，不涉及真实资金。
        </p>
      );
    }
    if (dataSource === 'mock') {
       return (
        <p>
          <span className="font-bold text-slate-300">模拟数据 / 模拟交易:</span> Finnhub API 密钥缺失。机器人正在使用 <span className="underline decoration-amber-400 font-semibold">内部模拟</span> 市场数据。所有交易也是模拟的。
        </p>
      );
    }
    return (
      <p>
        <span className="font-bold text-slate-300">数据源 / 模拟交易:</span> 机器人启动后将连接到市场数据源。所有交易都是 <span className="underline decoration-sky-400 font-semibold">模拟的</span>。
      </p>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-md p-6 shadow-lg border border-slate-700 space-y-6">
      <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">策略与控制</h3>
      
      <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-sm border border-slate-700 flex items-start space-x-2">
          <Info size={28} className="text-sky-400 flex-shrink-0" />
          {getInfoBox()}
      </div>

      <div className="space-y-4">
         <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2 text-slate-300">
                <Banknote size={18} />
                <span>现金余额</span>
            </div>
            <span className="font-mono text-slate-100">${cash.toFixed(2)}</span>
         </div>
         <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2 text-slate-300">
                <Bitcoin size={18}/>
                <span>{assetName} 持有量</span>
            </div>
            <span className="font-mono text-slate-100">{assetAmount.toFixed(6)}</span>
         </div>
      </div>
      
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-slate-300 mb-2">
            <Shield size={16}/>
            <span>风险配置</span>
        </label>
        <div className="flex space-x-2">
          {(Object.values(RiskLevel) as RiskLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onRiskChange(level)}
              disabled={isRunning}
              className={`w-full py-2 text-sm font-semibold rounded-sm transition-colors duration-200
                ${riskLevel === level ? 'bg-lime-600 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}
                ${isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="w-full flex items-center justify-center space-x-2 bg-lime-600 hover:bg-lime-700 text-slate-900 font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          <Power size={18} />
          <span>启动机器人</span>
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <PowerOff size={18} />
          <span>停止机器人</span>
        </button>
      </div>
    </div>
  );
};

export default StrategyPanel;
