import { Spot } from "@binance/connector";
import { sleep } from "./util.js";

const BASE_ALLOCATION = 100;
const TRADE_FEE = 0.075;

async function trade(ticker, granularity, allocation) {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  const client = new Spot(apiKey, apiSecret);

  // Get account information
  const account = await client.account();

  const tradingAlgorithm = new Algorithm(
    allocation ? parseFloat(allocation) : BASE_ALLOCATION,
    TRADE_FEE
  );

  while (1) {
    const tickerPrice = await client.tickerPrice(ticker);
    const price = tickerPrice.data.price;

    await tradingAlgorithm.apply(parseFloat(price));

    // Convert granularity to ms
    await sleep();
  }
}

if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
  console.log(
    "Command $> yarn [feed|test|trade] [VETUSDT|BTCUSDC|...] [1m|5m|1h|1d|1w|...] ([allocation])"
  );
}
if (process.argv[2] === "trade") {
  trade(process.argv[3], process.argv[4]);
}
