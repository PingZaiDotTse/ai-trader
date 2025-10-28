import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DollarSign, Bitcoin, Activity, TrendingUp } from 'lucide-react';

import Header from './Header';
import StatCard from './StatCard';
import MarketChart from './MarketChart';
import StrategyPanel from './StrategyPanel';
import TradeLog from './TradeLog';
import AILogicPanel from './AILogicPanel';
import { marketDataService, DataSource } from '../services/marketDataService';
import { getAIDecision } from '../services/geminiService';
import { calculateRSI, calculateSMA } from '../utils/technicalAnalysis';
import { AIStatus, RiskLevel, Trade, TradingAction, AILogic, Kline } from '../types';

export const ASSET_NAME = 'BTC';
const TICK_INTERVAL_MS = 15000; // 15 seconds
const INITIAL_CASH = 10000;
const SMA_SHORT_PERIOD = 10;
const SMA_LONG_PERIOD = 30;
const RSI_PERIOD = 14;
const MAX_KLINE_HISTORY = 100;

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<AIStatus>(AIStatus.INACTIVE);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.MEDIUM);
  const [cash, setCash] = useState(INITIAL_CASH);
  const [assetAmount, setAssetAmount] = useState(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [klineHistory, setKlineHistory] = useState<Kline[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [aiLogics, setAiLogics] = useState<AILogic[]>([]);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  
  const intervalRef = useRef<number | null>(null);

  const portfolioValue = currentPrice ? cash + assetAmount * currentPrice : cash;
  const profitLoss = portfolioValue - INITIAL_CASH;
  const profitLossPercent = (profitLoss / INITIAL_CASH) * 100;

  // Calculate latest technical indicators for AI decision
  const latestTechnicalIndicators = useMemo(() => {
    const closingPrices = klineHistory.map(k => k.close);
    if (closingPrices.length === 0) {
      return { smaShort: null, smaLong: null, rsi: null };
    }
    return {
      smaShort: calculateSMA(closingPrices, SMA_SHORT_PERIOD),
      smaLong: calculateSMA(closingPrices, SMA_LONG_PERIOD),
      rsi: calculateRSI(closingPrices, RSI_PERIOD),
    };
  }, [klineHistory]);
  
  // Prepare historical data for the chart
  const chartData = useMemo(() => {
     return klineHistory.map((kline, index) => {
        const historySlice = klineHistory.slice(0, index + 1).map(k => k.close);
        return {
            ...kline,
            smaShort: calculateSMA(historySlice, SMA_SHORT_PERIOD),
            smaLong: calculateSMA(historySlice, SMA_LONG_PERIOD),
            rsi: calculateRSI(historySlice, RSI_PERIOD),
        };
     });
  }, [klineHistory]);


  const handlePriceUpdate = useCallback((price: number) => {
    setCurrentPrice(price);
    
    setKlineHistory(prev => {
        const now = Date.now();
        const barTimestamp = Math.floor(now / TICK_INTERVAL_MS) * TICK_INTERVAL_MS;
        
        const lastBar = prev.length > 0 ? prev[prev.length - 1] : null;

        if (lastBar && lastBar.timestamp === barTimestamp) {
            // Update the current bar
            const updatedLastBar = {
                ...lastBar,
                high: Math.max(lastBar.high, price),
                low: Math.min(lastBar.low, price),
                close: price,
            };
            return [...prev.slice(0, -1), updatedLastBar];
        } else {
            // Start a new bar
            const newBar: Kline = {
                timestamp: barTimestamp,
                open: price,
                high: price,
                low: price,
                close: price,
            };
            // Keep history length in check
            const newHistory = [...prev, newBar];
            if (newHistory.length > MAX_KLINE_HISTORY) {
                return newHistory.slice(1);
            }
            return newHistory;
        }
    });
  }, []);

  const runAILogic = useCallback(async () => {
    if (!currentPrice || klineHistory.length < SMA_LONG_PERIOD) {
      console.log("Not enough data to run AI logic yet.");
      return;
    }
    
    setStatus(AIStatus.THINKING);
    
    try {
      const decisionData = await getAIDecision(riskLevel, cash, assetAmount, ASSET_NAME, klineHistory, latestTechnicalIndicators);
      const { decision, reasoning, tradePercentage } = decisionData;

      const newLogic: AILogic = {
        id: `logic-${Date.now()}`,
        timestamp: Date.now(),
        reasoning,
        decision,
      };
      setAiLogics(prev => [newLogic, ...prev.slice(0, 49)]);

      let newTrade: Trade | null = null;
      let amountToTrade = 0;

      if (decision === TradingAction.BUY && cash > 10) {
        const cashToUse = cash * tradePercentage;
        amountToTrade = cashToUse / currentPrice;
        if (cashToUse > 0) {
           setCash(prev => prev - cashToUse);
           setAssetAmount(prev => prev + amountToTrade);
           newTrade = {
             id: `trade-${Date.now()}`,
             timestamp: Date.now(),
             action: TradingAction.BUY,
             asset: ASSET_NAME,
             amount: amountToTrade,
             price: currentPrice,
           };
        }
      } else if (decision === TradingAction.SELL && assetAmount > 0) {
        amountToTrade = assetAmount * tradePercentage;
        if (amountToTrade > 0) {
            const cashGained = amountToTrade * currentPrice;
            setAssetAmount(prev => prev - amountToTrade);
            setCash(prev => prev + cashGained);
            newTrade = {
                id: `trade-${Date.now()}`,
                timestamp: Date.now(),
                action: TradingAction.SELL,
                asset: ASSET_NAME,
                amount: amountToTrade,
                price: currentPrice,
            };
        }
      }

      if (newTrade) {
        setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
      }

    } catch (error) {
        console.error("Error in AI logic cycle:", error);
        setStatus(AIStatus.ERROR);
    } finally {
        // Only set back to running if it hasn't been stopped
        setStatus(prevStatus => prevStatus === AIStatus.THINKING ? AIStatus.RUNNING : prevStatus);
    }
  }, [cash, assetAmount, currentPrice, klineHistory, riskLevel, latestTechnicalIndicators]);

  // Use a ref to hold the latest runAILogic callback to avoid stale closures in setInterval
  const runAILogicRef = useRef(runAILogic);
  useEffect(() => {
    runAILogicRef.current = runAILogic;
  }, [runAILogic]);


  const startBot = () => {
    console.log("Starting bot...");
    const source = marketDataService.connect(handlePriceUpdate);
    setDataSource(source);
    setStatus(AIStatus.RUNNING);
    
    // The AI logic will now be triggered by the creation of a new k-line bar.
    // We can use the interval to ensure it runs even if there are no trades for a while.
    const tick = () => runAILogicRef.current();

    // Initial run after a short delay
    setTimeout(() => {
        tick(); 
        intervalRef.current = window.setInterval(tick, TICK_INTERVAL_MS);
    }, 2100); 
  };

  const stopBot = () => {
    console.log("Stopping bot...");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    marketDataService.disconnect();
    setStatus(AIStatus.INACTIVE);
    setDataSource(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBot();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <Header status={status} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="投资组合价值" 
            value={`$${portfolioValue.toFixed(2)}`}
            icon={<DollarSign className="text-lime-400" />} />
          <StatCard 
            title={`当前 ${ASSET_NAME} 价格`} 
            value={currentPrice ? `$${currentPrice.toFixed(2)}` : '...'}
            icon={<Bitcoin className="text-orange-400" />} />
          <StatCard 
            title="总损益" 
            value={`${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`}
            icon={<TrendingUp className={profitLoss >= 0 ? 'text-lime-400' : 'text-red-500'} />}
            valueClassName={profitLoss >= 0 ? 'text-lime-400' : 'text-red-500'}
             />
          <StatCard 
            title="总交易数" 
            value={trades.length.toString()}
            icon={<Activity className="text-sky-400" />} />
      </div>

      <div className="bg-slate-800/50 rounded-md shadow-lg border border-slate-700 h-[450px] p-4">
        <MarketChart data={chartData} trades={trades} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StrategyPanel 
            status={status}
            riskLevel={riskLevel}
            onRiskChange={setRiskLevel}
            onStart={startBot}
            onStop={stopBot}
            cash={cash}
            assetAmount={assetAmount}
            assetName={ASSET_NAME}
            dataSource={dataSource}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <TradeLog trades={trades} />
            <AILogicPanel aiLogics={aiLogics} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
