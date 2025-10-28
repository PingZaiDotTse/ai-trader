import { GoogleGenAI, Type } from "@google/genai";
import { Kline, RiskLevel, TradingAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const getSystemInstruction = (riskLevel: RiskLevel, cash: number, assetAmount: number, assetName: string): string => {
  return `你是一个专业的 ${assetName} 交易机器人，通过分析15秒周期的K线图（OHLC数据）来做出决策，目标是实现利润最大化。
K线图解读指南：
- 绿色K线 (收盘价 > 开盘价) 表示买方力量强。实体越长，买方力量越强。
- 红色K线 (收盘价 < 开盘价) 表示卖方力量强。实体越长，卖方力量越强。
- 上影线表示价格上涨后回落，代表上方有卖压。
- 下影线表示价格下跌后反弹，代表下方有支撑。
- 小实体和长影线可能表示市场犹豫或趋势反转的信号。

你当前拥有现金 ${cash.toFixed(2)} 美元和 ${assetAmount.toFixed(6)} ${assetName}。
你目前的风险配置为：${riskLevel}。
- ${riskLevel === RiskLevel.LOW ? '优先保护资本。寻找非常明确的、低风险的K线形态。倾向于持有（HOLD）。' : ''}
- ${riskLevel === RiskLevel.MEDIUM ? '平衡风险与回报。基于K线形态和技术指标的组合信号进行交易。' : ''}
- ${riskLevel === RiskLevel.HIGH ? '优先考虑高增长。利用强烈的K线动量形态（如长实体K线）进行激进交易。' : ''}

你将收到最新的市场数据，包括最近的K线数据和技术指标：
- SMA (简单移动平均线): 用于识别市场趋势。
- RSI (相对强弱指数): 一个动量指标。RSI > 70 表明市场可能超买，RSI < 30 表明市场可能超卖。

根据对K线形态、技术指标的综合分析、你的风险配置和当前持仓，你必须在三个动作中选择一个：买入（BUY）、卖出（SELL）或持有（HOLD）。
你必须为你的决策提供一个简短（1-2句话）的理由，并提及你所依据的关键K线特征或指标。
交易量应该是可用资产的一个百分比（买入时基于现金，卖出时基于 ${assetName}）。
- 低风险：0.1-0.25
- 中风险：0.25-0.5
- 高风险：0.5-0.75

请仅以JSON对象格式回应。不要包含像 \`\`\`json 这样的 markdown 格式。`;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    decision: { type: Type.STRING, description: '交易决策：BUY, SELL, 或 HOLD' },
    reasoning: { type: Type.STRING, description: '对决策的简要解释。' },
    tradePercentage: { type: Type.NUMBER, description: '要交易的资产百分比（0到1之间）。' }
  },
  required: ['decision', 'reasoning', 'tradePercentage']
};

export interface GeminiDecision {
  decision: TradingAction;
  reasoning: string;
  tradePercentage: number;
}

export interface TechnicalIndicators {
    smaShort: number | null;
    smaLong: number | null;
    rsi: number | null;
}

export const getAIDecision = async (
  riskLevel: RiskLevel,
  cash: number,
  assetAmount: number,
  assetName: string,
  klineHistory: Kline[],
  indicators: TechnicalIndicators
): Promise<GeminiDecision> => {

  if (!klineHistory || klineHistory.length === 0) {
     return {
      decision: TradingAction.HOLD,
      reasoning: "正在等待市场数据...",
      tradePercentage: 0,
    };
  }
  
  const lastKline = klineHistory[klineHistory.length - 1];
  const recentKlines = klineHistory.slice(-5); // Provide last 5 k-lines for context

  const prompt = `
    当前市场状况:
    - 最新收盘价: $${lastKline.close.toFixed(2)}
    - 技术指标:
      - 10周期 SMA: ${indicators.smaShort ? `$${indicators.smaShort.toFixed(2)}` : '数据不足'}
      - 30周期 SMA: ${indicators.smaLong ? `$${indicators.smaLong.toFixed(2)}` : '数据不足'}
      - 14周期 RSI: ${indicators.rsi ? indicators.rsi.toFixed(2) : '数据不足'}
    
    最近5个15秒周期的K线数据 (OHLC):
    ${recentKlines.map(k => `- ${new Date(k.timestamp).toLocaleTimeString()}: O:${k.open.toFixed(2)} H:${k.high.toFixed(2)} L:${k.low.toFixed(2)} C:${k.close.toFixed(2)}`).join('\n')}

    分析所有数据，特别是K线形态，并做出决策。
  `;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: getSystemInstruction(riskLevel, cash, assetAmount, assetName),
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    
    if (
      !result.decision ||
      !Object.values(TradingAction).includes(result.decision) ||
      !result.reasoning ||
      typeof result.tradePercentage !== 'number' ||
      result.tradePercentage < 0 ||
      result.tradePercentage > 1
    ) {
      console.error("来自AI的无效响应结构:", result);
      throw new Error("来自AI的无效响应结构");
    }

    return result;

  } catch (error) {
    console.error("获取AI决策时出错:", error);
    return {
      decision: TradingAction.HOLD,
      reasoning: "分析市场数据时发生错误。为安全起见，保持仓位。",
      tradePercentage: 0,
    };
  }
};
