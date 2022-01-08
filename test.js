import fs from "fs";
import path from "path";
import csv from "fast-csv";
import { BaseStrategy } from "./strategies/base.js";

const BASE_ALLOCATION = 100;
const TRADE_FEE = 0.075;

async function test(ticker, granularity, allocation) {
  const strategy = new BaseStrategy(
    allocation ? parseFloat(allocation) : BASE_ALLOCATION,
    TRADE_FEE
  );
  const historicalPrices = [];
  const dataDirectory = `./data/${ticker}/${granularity}`;

  const files = fs.readdirSync(dataDirectory);

  for (const file of files) {
    if (file.startsWith(`${ticker}-${granularity}`) && file.endsWith(`.csv`)) {
      await new Promise((resolve) => {
        fs.createReadStream(path.resolve(dataDirectory, file))
          .pipe(csv.parse())
          .on("error", (error) => console.error(error))
          .on("data", (row) => {
            historicalPrices.push({
              date: row[0],
              open: row[1],
              high: row[2],
              low: row[3],
              close: row[4],
              price: row[4],
              volume: row[5],
            });
          })
          .on("end", async () => {
            resolve();
          });
      });
    }
  }

  for (const {
    date,
    price,
    low,
    high,
    volume,
    open,
    close,
  } of historicalPrices) {
    await strategy.apply({
      price: parseFloat(price),
      date: new Date(parseFloat(date)),
      low: parseFloat(low),
      high: parseFloat(high),
      volume: parseFloat(volume),
      open: parseFloat(open),
      close: parseFloat(close),
    });
  }

  if (strategy.wallet.token) {
    await strategy.sell("none");
  }

  console.log("🎉 End", {
    benefice: strategy.wallet.stable - BASE_ALLOCATION + strategy.wallet.bank,
    fees: strategy.fees,
  });
}

if (!process.argv[2] || !process.argv[3]) {
  console.log(
    "Command $> yarn test [VETUSDT|BTCUSDC|...] [1m|5m|1h|1d|1w|...] ([allocation])"
  );
}

await test(process.argv[2], process.argv[3], process.argv[4]);
