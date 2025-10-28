// types.ts

export enum AIStatus {
  INACTIVE = '未激活',
  RUNNING = '运行中',
  THINKING = '思考中',
  ERROR = '错误',
}

export enum RiskLevel {
  LOW = '低风险',
  MEDIUM = '中风险',
  HIGH = '高风险',
}

export enum TradingAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export interface Trade {
  id: string;
  timestamp: number;
  action: TradingAction;
  asset: string;
  amount: number;
  price: number;
}

export interface AILogic {
  id: string;
  timestamp: number;
  reasoning: string;
  decision: TradingAction;
}

export interface Kline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
