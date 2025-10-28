import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Trade, TradingAction, Kline } from '../types';

// 让 TypeScript 知道全局库的存在
declare const LightweightCharts: any;

interface ChartDataPoint extends Kline {
  smaShort: number | null;
  smaLong: number | null;
  rsi: number | null;
}

interface MarketChartProps {
  data: ChartDataPoint[];
  trades: Trade[];
}

const MarketChart: React.FC<MarketChartProps> = ({ data, trades }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<{
    chart: any;
    candlestickSeries: any;
    smaShortSeries: any;
    smaLongSeries: any;
rsiSeries: any;
  } | null>(null);

  // Effect 1: 图表的初始化、销毁和响应式调整
  useLayoutEffect(() => {
    const chartElement = chartContainerRef.current;
    if (!chartElement) return;

    const lib = (window as any).LightweightCharts;
    if (!lib || !lib.createChart) {
      console.error("LightweightCharts 库未加载或无效。");
      return;
    }

    // ResizeObserver 确保我们在容器有实际尺寸时才创建图表
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;

      if (width === 0 || height === 0) {
        return;
      }

      // 如果图表已存在，则只调整大小
      if (chartRef.current) {
        chartRef.current.chart.applyOptions({ width, height });
        return;
      }

      // 否则，创建图表和所有 series
      const chart = lib.createChart(chartElement, {
        width,
        height,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
        timeScale: { timeVisible: true, secondsVisible: true, borderColor: '#475569' },
        rightPriceScale: { borderColor: '#475569', scaleMargins: { top: 0.1, bottom: 0.25 } },
        crosshair: { mode: lib.CrosshairMode.Normal },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', borderDownColor: '#ef4444',
        borderUpColor: '#22c55e', wickDownColor: '#ef4444', wickUpColor: '#22c55e',
      });

      const smaShortSeries = chart.addLineSeries({ color: '#38bdf8', lineWidth: 2, title: 'SMA(10)', priceLineVisible: false, lastValueVisible: false });
      const smaLongSeries = chart.addLineSeries({ color: '#a78bfa', lineWidth: 2, title: 'SMA(30)', priceLineVisible: false, lastValueVisible: false });

      const rsiSeries = chart.addLineSeries({
        color: '#facc15', lineWidth: 2, title: 'RSI(14)',
        priceScaleId: 'left',
        priceLineVisible: false, lastValueVisible: false,
      });

      chart.priceScale('left').applyOptions({
        scaleMargins: { top: 0.7, bottom: 0.05 },
      });
      rsiSeries.createPriceLine({ price: 70, color: '#f87171', lineWidth: 1, lineStyle: lib.LineStyle.Dashed, axisLabelVisible: true, title: '超买' });
      rsiSeries.createPriceLine({ price: 30, color: '#4ade80', lineWidth: 1, lineStyle: lib.LineStyle.Dashed, axisLabelVisible: true, title: '超卖' });

      chartRef.current = { chart, candlestickSeries, smaShortSeries, smaLongSeries, rsiSeries };
    });

    resizeObserver.observe(chartElement);

    // 清理函数: 在组件卸载时运行
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.chart.remove();
        chartRef.current = null;
      }
    };
  }, []); // 空依赖数组确保此 Effect 仅在挂载和卸载时运行

  // Effect 2: 用于更新图表数据
  useEffect(() => {
    if (!chartRef.current || !data) return;
    const { candlestickSeries, smaShortSeries, smaLongSeries, rsiSeries } = chartRef.current;

    const chartFormattedData = data.map(d => ({
      time: d.timestamp / 1000, open: d.open, high: d.high, low: d.low, close: d.close
    }));
    const smaShortData = data.filter(d => d.smaShort !== null).map(d => ({ time: d.timestamp / 1000, value: d.smaShort! }));
    const smaLongData = data.filter(d => d.smaLong !== null).map(d => ({ time: d.timestamp / 1000, value: d.smaLong! }));
    const rsiData = data.filter(d => d.rsi !== null).map(d => ({ time: d.timestamp / 1000, value: d.rsi! }));

    candlestickSeries.setData(chartFormattedData);
    smaShortSeries.setData(smaShortData);
    smaLongSeries.setData(smaLongData);
    rsiSeries.setData(rsiData);
  }, [data]);

  // Effect 3: 用于更新交易标记
  useEffect(() => {
    if (!chartRef.current || !trades) return;
    const { candlestickSeries } = chartRef.current;
    
    const markers = trades.map(trade => ({
      time: Math.floor(trade.timestamp / 1000),
      position: trade.action === TradingAction.BUY ? 'belowBar' : 'aboveBar',
      color: trade.action === TradingAction.BUY ? '#22c55e' : '#ef4444',
      shape: trade.action === TradingAction.BUY ? 'arrowUp' : 'arrowDown',
      text: `${trade.action.charAt(0)} @ ${trade.price.toFixed(2)}`
    }));

    candlestickSeries.setMarkers(markers);
  }, [trades]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-4 pl-4 pb-2">
        <h3 className="text-lg font-semibold text-slate-200">市场图表 (TradingView)</h3>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1"><div className="w-4 h-0.5 bg-[#38bdf8]"></div><span>SMA(10)</span></div>
          <div className="flex items-center space-x-1"><div className="w-4 h-0.5 bg-[#a78bfa]"></div><span>SMA(30)</span></div>
          <div className="flex items-center space-x-1"><div className="w-4 h-0.5 bg-[#facc15]"></div><span>RSI(14)</span></div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full flex-grow" />
    </div>
  );
};

export default MarketChart;
