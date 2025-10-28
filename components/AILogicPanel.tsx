import React from 'react';
import { AILogic, TradingAction } from '../types';
import { Bot, Lightbulb } from 'lucide-react';

interface AILogicPanelProps {
  aiLogics: AILogic[];
}

const AILogicPanel: React.FC<AILogicPanelProps> = ({ aiLogics }) => {
  return (
    <div className="bg-slate-800/50 rounded-md p-6 shadow-lg border border-slate-700 h-96 flex flex-col">
      <h3 className="flex items-center space-x-2 text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-4">
        <Bot size={20} />
        <span>AI 推理日志</span>
      </h3>
      <div className="overflow-y-auto flex-grow pr-2 space-y-4">
        {aiLogics.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            等待AI的第一个决策...
          </div>
        ) : (
          aiLogics.map((logic) => {
            const decisionColor = logic.decision === TradingAction.BUY ? 'text-lime-400' :
                                  logic.decision === TradingAction.SELL ? 'text-red-500' :
                                  'text-slate-400';
            const time = new Date(logic.timestamp).toLocaleTimeString();

            return (
              <div key={logic.id} className="text-sm bg-slate-900 p-3 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className={`font-bold font-mono ${decisionColor}`}>决策: {logic.decision}</span>
                    <span className="text-xs text-slate-500">{time}</span>
                </div>
                <div className="flex items-start space-x-2 text-slate-300">
                    <Lightbulb size={16} className="text-sky-400 mt-0.5 flex-shrink-0"/>
                    <p className="italic">"{logic.reasoning}"</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AILogicPanel;
