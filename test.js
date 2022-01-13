import fs from "fs";
import path from "path";
import csv from "fast-csv";
import { BaseStrategy } from "./strategies/base.js";

const BASE_ALLOCATION = 100;
const TRADE_FEE = 0.075;

async function test(name, market, ticker, granularity, allocation) {
  const stable = allocation ? parseFloat(allocation) : BASE_ALLOCATION;
  const strategy = new BaseStrategy(name, market, stable, TRADE_FEE);
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

  if (strategy.wallet.token || strategy.wallet.short || strategy.wallet.long) {
    await strategy.sellSpot("none");
  }

  const loose = strategy.analysis.loose.map((e) => parseFloat(e));
  const win = strategy.analysis.win.map((e) => parseFloat(e));
  const longWin = strategy.analysis.long.win.map((e) => parseFloat(e));
  const longLoose = strategy.analysis.long.loose.map((e) => parseFloat(e));
  const shortWin = strategy.analysis.short.win.map((e) => parseFloat(e));
  const shortLoose = strategy.analysis.short.loose.map((e) => parseFloat(e));

  console.log("🎉 End", {
    benefice: (strategy.wallet.stable - stable + strategy.wallet.bank).toFixed(
      2
    ),
    fees: strategy.fees.toFixed(2),
    loose: {
      count: loose.length,
      average: parseFloat(
        loose.reduce((a, b) => a + b, 0) / loose.length
      ).toFixed(2),
      max: Math.min(...loose),
      min: Math.max(...loose),
      total: loose.reduce((a, b) => a + b, 0).toFixed(2),
    },
    win: {
      count: win.length,
      agerage: parseFloat(win.reduce((a, b) => a + b, 0) / win.length).toFixed(
        2
      ),
      max: Math.max(...win),
      min: Math.min(...win),
      total: win.reduce((a, b) => a + b).toFixed(2),
    },
    long: {
      win: {
        average: parseFloat(
          longWin.reduce((a, b) => a + b, 0) / longWin.length
        ).toFixed(2),
        max: Math.max(...longWin),
        min: Math.min(...longWin),
      },
      loose: {
        average: parseFloat(
          longLoose.reduce((a, b) => a + b, 0) / longLoose.length
        ).toFixed(2),
        max: Math.max(...longLoose),
        min: Math.min(...longLoose),
      },
    },
    short: {
      win: {
        average: parseFloat(
          shortWin.reduce((a, b) => a + b, 0) / shortWin.length ?? 0
        ).toFixed(2),
        max: Math.max(...shortWin),
        min: Math.min(...shortWin),
      },
      loose: {
        average: parseFloat(
          shortLoose.reduce((a, b) => a + b, 0) / shortLoose.length
        ).toFixed(2),
        max: Math.max(...shortLoose),
        min: Math.min(...shortLoose),
      },
    },
  });
}

if (
  !process.argv[2] ||
  !process.argv[3] ||
  !process.argv[4] ||
  !process.argv[5]
) {
  console.log(
    "Command $> yarn test [lambo] [spot|margin] [VETUSDT|BTCUSDC|...] [1m|5m|1h|1d|1w|...] ([allocation])"
  );
}

await test(
  process.argv[2],
  process.argv[3],
  process.argv[4],
  process.argv[5],
  process.argv[6]
);
