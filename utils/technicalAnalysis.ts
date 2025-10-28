// utils/technicalAnalysis.ts

/**
 * 计算简单移动平均线 (SMA)
 * @param data - 价格数据点数组
 * @param period - SMA 的周期
 * @returns SMA 值，如果数据不足则返回 null
 */
export const calculateSMA = (data: number[], period: number): number | null => {
  if (data.length < period) {
    return null;
  }
  const sum = data.slice(-period).reduce((acc, val) => acc + val, 0);
  return sum / period;
};

/**
 * 计算相对强弱指数 (RSI)
 * @param data - 价格数据点数组
 * @param period - RSI 的周期 (通常为 14)
 * @returns RSI 值，如果数据不足则返回 null
 */
export const calculateRSI = (data: number[], period: number = 14): number | null => {
  if (data.length <= period) {
    return null;
  }

  const prices = data.slice(-period -1); // 需要 period+1 个价格来计算 period 个变化
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => (c > 0 ? c : 0));
  const losses = changes.map(c => (c < 0 ? -c : 0));

  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  if (avgLoss === 0) {
    return 100; // 如果没有损失，RSI 为 100
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};
