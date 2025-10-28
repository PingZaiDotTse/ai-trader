import React from 'react';
import { Trade, TradingAction } from '../types';

interface TradeLogProps {
  trades: Trade[];
}

const TradeLog: React.FC<TradeLogProps> = ({ trades }) => {
  return (
    <div className="bg-slate-800/50 rounded-md p-6 shadow-lg border border-slate-700 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-4">最近交易</h3>
      <div className="overflow-y-auto flex-grow pr-2">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            尚无交易记录。
          </div>
        ) : (
          <ul className="space-y-3">
            {trades.map((trade) => {
              const isBuy = trade.action === TradingAction.BUY;
              const actionColor = isBuy ? 'text-lime-400' : 'text-red-500';
              const time = new Date(trade.timestamp).toLocaleTimeString();

              return (
                <li key={trade.id} className="flex justify-between items-center text-sm font-mono bg-slate-900 p-2 rounded-sm">
                  <div>
                    <span className={`font-bold ${actionColor}`}>{trade.action}</span>
                    <span className="text-slate-300"> {trade.amount.toFixed(4)} {trade.asset}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300">@ ${trade.price.toFixed(2)}</span>
                    <span className="text-slate-500 block text-xs">{time}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TradeLog;