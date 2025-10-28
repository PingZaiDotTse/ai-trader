// This service manages the WebSocket connection to a live market data feed.
// If the Finnhub API key is not provided, it falls back to a simulated data stream.
// IMPORTANT: For live data, you will need a free API key from Finnhub.io.
// Add it to your environment variables as FINNHUB_API_KEY.

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const WEBSOCKET_URL = `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`;

let socket: WebSocket | null = null;
let lastPrice: number | null = null;
let reconnectTimeout: number | null = null;

// For mock data fallback
let mockDataIntervalId: number | null = null;
let mockPrice = 68500.00;

const startMockDataStream = (onPriceUpdate: (price: number) => void) => {
  console.warn("Finnhub API key not found. Falling back to simulated market data stream.");
  if (mockDataIntervalId) {
    clearInterval(mockDataIntervalId);
  }
  mockDataIntervalId = window.setInterval(() => {
    // Simulate some price volatility
    const change = (Math.random() - 0.495) * (mockPrice * 0.001);
    mockPrice += change;
    if (mockPrice < 5000) mockPrice = 5000; // Reset if it goes too low
    onPriceUpdate(mockPrice);
  }, 2000); // Update every 2 seconds
};

const stopMockDataStream = () => {
  if (mockDataIntervalId) {
    clearInterval(mockDataIntervalId);
    mockDataIntervalId = null;
    console.log("Stopped mock data stream.");
  }
};

export type DataSource = 'live' | 'mock';

const connect = (onPriceUpdate: (price: number) => void): DataSource => {
  if (!FINNHUB_API_KEY) {
    startMockDataStream(onPriceUpdate);
    return 'mock';
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("WebSocket connection already open.");
    return 'live';
  }

  console.log("Connecting to Finnhub WebSocket for live data...");
  socket = new WebSocket(WEBSOCKET_URL);

  socket.addEventListener('open', () => {
    console.log("WebSocket connection opened. Subscribing to BTC/USDT trades.");
    socket?.send(JSON.stringify({ 'type': 'subscribe', 'symbol': 'BINANCE:BTCUSDT' }));
    if(reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  });

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'trade' && message.data && message.data.length > 0) {
        const latestTrade = message.data[message.data.length - 1];
        const price = latestTrade.p;
        if (price !== lastPrice) {
          lastPrice = price;
          onPriceUpdate(price);
        }
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  socket.addEventListener('error', (error) => {
    console.error("WebSocket error:", error);
  });

  socket.addEventListener('close', () => {
    console.log("WebSocket connection closed.");
    // Only reconnect if disconnect was not called intentionally
    if (reconnectTimeout !== -1) {
      console.log("Attempting to reconnect in 5 seconds...");
      reconnectTimeout = window.setTimeout(() => connect(onPriceUpdate), 5000);
    }
  });

  return 'live';
};

const disconnect = () => {
  // Stop mock data if it's running
  stopMockDataStream();

  // Stop live data connection
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = -1; // Flag for intentional disconnect

  if (socket) {
    console.log("Disconnecting from Finnhub WebSocket.");
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': 'BINANCE:BTCUSDT' }));
    }
    socket.close();
    socket = null;
  }
};

export const marketDataService = {
  connect,
  disconnect,
};
