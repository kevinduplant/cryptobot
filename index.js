import { Spot } from "@binance/connector";
import fs from "fs";
import path from "path";
import { Console } from "console";
import { exit } from "process";
import csv from "fast-csv";
import https from "https";
import technicalindicators from "technicalindicators";

const TIME_INTERVAL = 1 * 60 * 1000; // 1min
const BASE_ALLOCATION = 100;
const TRADE_FEE = 0.075;
const GRANULARITY = "5m";
const GRANULARITIES = ["1m", "5m", "30m", "1h", "2h", "4h", "12h", "1d"];
// const TICKER = "VETUSDT"; // BTCUSDC AVAXUSDT  VETUSDT BNBUSDC  ETHUSDT

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class MeanReversionStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.buyStrategy = "spot";
    this.name = "meanReversion";
  }

  save() {
    return 0;
  }

  exit() {
    const len = this.history.length;
    const data = this.history[len - 1];

    if (!this.wallet.token || this.entryData.algo !== "meanReversion") {
      return false;
    }

    // If RSI > 70 or price cross upper bollinger band from bottom to top
    if (data.rsi >= 70 && data.price >= data.bb.upper) {
      return true;
    }

    return false;
  }

  entry() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    if (!this.wallet.stable) {
      return false;
    }

    // RSI < 30 and price cross lower bollinger band from top to bottom
    if (
      // data.rsi <= 30 &&
      previousData.price < previousData.bb.lower &&
      data.price >= data.bb.lower
    ) {
      return true;
    }

    // RSI < 70 and RSI is growing and price cross lower bollinger band from top to bottom
    if (
      previousData.rsi < data.rsi &&
      data.rsi <= 70 &&
      data.price <= data.bb.lower
    ) {
      return true;
    }

    return false;
  }
}

class CyberbotStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.buyStrategy = "spot";
    this.name = "cyberbot";
  }

  save() {
    return 0;
  }

  exit() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    if (!this.wallet.token || this.entryData.algo !== "cyberbot") {
      return false;
    }

    // If MA4 crosses MA9 top-to-bottom
    if (previousData.ema4 >= previousData.ema9 && data.ema4 < data.ema9) {
      return true;
    }

    return false;
  }

  entry() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    if (!this.wallet.stable) {
      return false;
    }

    // If MA4 crosses both MA9 and MA20 from bottom to top (double-crossing)
    if (
      previousData.ema4 < previousData.ema9 &&
      previousData.ema4 < previousData.ema20 &&
      data.ema4 >= data.ema9 &&
      data.ema4 >= data.ema20
    ) {
      return true;
    }

    // 1) If MA4 crosses MA20 from bottom to top  and 2) RSI increases
    if (
      previousData.ema4 < previousData.ema20 &&
      data.ema4 >= data.ema20 &&
      previousData.rsi < data.rsi
    ) {
      return true;
    }

    // If 1) MA4 crosses MA9 from bottom to top, 2) RSI =50, 3) MA4 and MA9 > MA20
    if (
      previousData.ema4 < previousData.ema9 &&
      data.ema4 >= data.ema9 &&
      data.rsi >= 50 &&
      data.ema4 >= data.ema20 &&
      data.ema9 >= data.ema20
    ) {
      return true;
    }

    return false;
  }
}

class BankStrategy {
  constructor(_history, _entryData, wallet) {
    this.wallet = wallet;
    this.name = "bank";
  }

  save() {
    // if (this.wallet.stable > BASE_ALLOCATION) {
    //   return this.wallet.stable - BASE_ALLOCATION;
    // }

    if (this.wallet.stable >= BASE_ALLOCATION * 5) {
      return BASE_ALLOCATION * 4;
    }

    return 0;
  }

  exit() {
    return false;
  }

  entry() {
    return false;
  }
}

class EntryOptimusStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.buyStrategy = "spot";
    this.name = "entryOptimus";
  }

  save() {
    return 0;
  }

  exit() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    if (!this.wallet.token && !this.wallet.long) {
      return false;
    }

    if (this.entryData.algo !== "entryOptimus") {
      return false;
    }

    // stop loss (set to 10%)
    const stopLoss = 10;
    if (
      ((this.wallet.token || this.wallet.long) &&
        data.price <
          this.entryData.price - this.entryData.price * (stopLoss / 100)) ||
      (this.wallet.short &&
        data.price >
          this.entryData.price - this.entryData.price * (stopLoss / 100))
    ) {
      console.log("EXIT STOP LOSS");
      return true;
    }

    // profit > min_profit (set to 3%)
    const minProfit = 3;
    if (
      ((this.wallet.token || this.wallet.long) &&
        data.price <
          this.entryData.price + this.entryData.price * (minProfit / 100)) ||
      (this.wallet.short &&
        data.price >
          this.entryData.price + this.entryData.price * (minProfit / 100))
    ) {
      return false;
    }

    // 75 seems better than 70 here
    if (previousData.rsi < 75 && data.rsi >= 75) {
      // Entry point 1 and entry point 2 is checking here. If RSI>70 then there is a signal for the exit when RSI crosses 70 from the top to bottom.
      console.log("EXIT RSI");
      return true;
    }

    // If MACD cross bearish
    if (
      previousData.macd.MACD >= previousData.macd.signal &&
      data.macd.MACD <= data.macd.signal
    ) {
      console.log("EXIT MACD CROSS");
      return true;
    }

    // If price cross upper Bollinger
    if (
      previousData.bb.upper <= previousData.price &&
      data.bb.upper >= data.price
    ) {
      console.log("EXIT BB CROSS");
      return true;
    }

    // If 1) Entry point 1, 2) profit > min_profit, then RSI=50 gives a signal for the exit.
    if (this.entryData.rsi <= 37 && data.rsi >= 50) {
      console.log("EXIT RSI 50");
      return true;
    }

    // If 1) Entry point  2, 2) profit > min_profit, then RSI=60 gives a signal for the exit.
    if (this.entryData.rsi <= 55 && data.rsi >= 60) {
      console.log("EXIT RSI 60");
      return true;
    }

    return false;
  }

  entry() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    if (!this.wallet.stable && !this.wallet.short) {
      return false;
    }

    // If price cross lower Bollinger
    if (
      previousData.bb.lower >= previousData.price &&
      data.bb.lower < data.price &&
      data.macd.MACD > previousData.macd.MACD &&
      data.macd.MACD > data.macd.signal
    ) {
      console.log("BB cross, MACD up");
      return true;
    }

    if (
      data.macd.MACD <= data.macd.signal ||
      (data.macd.MACD >= data.macd.signal &&
        previousData.macd.MACD > data.macd.MACD)
    ) {
      return false;
    }

    // The MACD cross bullish or is bullish, RSI < 60 and price is under Bollinger top
    if (
      ((previousData.macd.MACD <= previousData.macd.signal &&
        data.macd.MACD >= data.macd.signal) ||
        data.macd.MACD >= data.macd.signal) &&
      data.bb.upper > data.price &&
      data.rsi <= 60 &&
      data.price > previousData.price
    ) {
      console.log("MACD cross, RSI < 60");
      return true;
    }

    // The entry range for RSI value is set from 30 to 37. Once the RSI crosses 30 from bottom to top the robot gets the entry signal.
    if (data.rsi <= 37 && data.rsi >= 30 && previousData.rsi < 30) {
      console.log("RSI cross 30");
      return true;
    }

    // The entry range for RSI value is set from 50 to 55.  Once the RSI crosses 50 from bottom to top the robot gets the entry signal.
    if (data.rsi <= 55 && data.rsi >= 50 && previousData.rsi < 50) {
      console.log("RSI cross 50");
      return true;
    }

    return false;
  }
}

class LamboStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.buyStrategy = "spot";
    this.name = "lambo";
  }

  save() {
    return 0;
  }

  exit() {
    return false;
  }

  entry() {
    return false;
  }
}

class Algorithm {
  constructor(wallet, tradeFee) {
    this.wallet = {
      stable: wallet,
      token: 0,
      bank: 0,
      long: 0,
      short: 0,
    };
    this.tradeFee = tradeFee;

    this.fees = 0;
    this.entryData = {};
    this.history = [];
  }

  async ema(period, values) {
    const ema = technicalindicators.ema({ period, values });
    return ema[ema.length - 1];
  }

  async rsi(period, values) {
    const rsi = technicalindicators.rsi({ period, values });
    return rsi[rsi.length - 1];
  }

  async bb(period, values) {
    const bb = technicalindicators.bollingerbands({
      period,
      stdDev: 2,
      values,
    });
    return bb[bb.length - 1];
  }

  async ichimoku(parameters, high, low) {
    const ichimoku = technicalindicators.ichimokucloud({
      high,
      low,
      ...parameters,
    });
    return ichimoku[ichimoku.length - 1];
  }

  async vp(period, high, low, open, close, volume) {
    const vp = technicalindicators.volumeprofile({
      high,
      open,
      low,
      close,
      volume,
      noOfBars: period,
    });
    return vp[vp.length - 1];
  }

  async macd(parameters, values) {
    const macd = technicalindicators.macd({
      values,
      ...parameters,
    });

    return macd[macd.length - 1];
  }

  async save(stategy) {
    const amount = stategy.save();

    this.wallet.stable -= amount;
    this.wallet.bank += amount;

    console.log("💵 SAVE", { amount, bank: this.wallet.bank });
  }

  async buy(strategy) {
    const data = this.history[this.history.length - 1];

    const fee = (this.wallet.stable * this.tradeFee) / 100;

    this.wallet.token = (this.wallet.stable - fee) / data.price;
    this.wallet.stable = 0;

    this.fees += fee;

    console.log("✅ BUY ");
    // , {
    //   wallet: this.wallet,
    //   fee,
    //   benefice:
    //     this.wallet.token * data.price - BASE_ALLOCATION + this.wallet.bank,
    //   strategy: strategy.name,
    //   ...data,
    // });

    this.entryData = {
      ...data,
      wallet: this.wallet,
      fee,
      benefice: this.wallet.stable - BASE_ALLOCATION + this.wallet.bank,
      algo: strategy.name,
    };
  }

  async sell(strategy) {
    const data = this.history[this.history.length - 1];

    const token = this.wallet.token
      ? this.wallet.token
      : this.wallet.short
      ? this.wallet.short
      : this.wallet.long
      ? this.wallet.long
      : 0;

    this.wallet.stable = token * data.price;
    this.wallet.token = 0;

    const fee = (this.wallet.stable * this.tradeFee) / 100;

    this.wallet.stable -= fee;

    this.fees += fee;

    if (this.entryData.price >= data.price) {
      console.log("😱 LOOSE", {
        buy: token * this.entryData.price,
        sell: token * data.price,
        loose: token * this.entryData.price - token * data.price,
      });
    } else {
      console.log("🥳 WIN", {
        buy: token * this.entryData.price,
        sell: token * data.price,
        win: token * data.price - token * this.entryData.price,
      });
    }

    console.log("🔴 SELL", {
      entry: this.entryData,
      exit: data.price,
      wallet: this.wallet,
      fee,
      benefice: this.wallet.stable - BASE_ALLOCATION + this.wallet.bank,
      strategy: strategy.name,
      ...data,
    });
  }

  async long(strategy) {
    const data = this.history[this.history.length - 1];

    const fee =
      ((this.wallet.stable
        ? this.wallet.stable
        : this.wallet.short * data.price) *
        this.tradeFee) /
      100;

    this.wallet.long = this.wallet.short
      ? (this.wallet.short * data.price - fee) /
        (this.entryData.price + (this.entryData.price - data.price))
      : (this.wallet.stable - fee) / data.price;
    this.wallet.stable = 0;
    this.wallet.short = 0;

    // We close short + open long
    this.fees += fee;
    this.fees += fee;

    if (this.entryData.price >= data.price) {
      console.log("😱 LOOSE");
    } else {
      console.log("🥳 WIN");
    }

    console.log("👉 CLOSE SHORT");
    console.log("🛫 LONG", {
      entry: this.entryData.price,
      exit: data.price,
      wallet: this.wallet,
      fee,
      benefice:
        this.wallet.long * data.price - BASE_ALLOCATION + this.wallet.bank,
      strategy: strategy.name,
      ...data,
    });

    this.entryData = {
      ...data,
      algo: strategy.name,
    };
  }

  async short(strategy) {
    const data = this.history[this.history.length - 1];

    this.wallet.short = this.wallet.long;
    this.wallet.stable = 0;
    this.wallet.long = 0;

    const fee = (this.wallet.token * data.price * this.tradeFee) / 100;

    // We close long + open short
    this.fees += fee;
    this.fees += fee;

    if (this.entryData.price <= data.price) {
      console.log("😱 LOOSE");
    } else {
      console.log("🥳 WIN");
    }

    console.log("👉 CLOSE LONG");
    console.log("🛬 SHORT", {
      entry: this.entryData,
      exit: data.price,
      wallet: this.wallet,
      fee,
      benefice:
        this.wallet.short * data.price - BASE_ALLOCATION + this.wallet.bank,
      strategy: strategy.name,
      ...data,
    });

    this.entryData = {
      ...data,
      algo: strategy.name,
    };
  }

  async technicalIndicators(data) {
    // Keep only what is needed for technical indicators
    if (this.history.length >= 200) {
      this.history = this.history.slice(50, this.history.length);
    }

    const price = [...this.history.map((el) => el.price), data.price];
    const high = [...this.history.map((el) => el.high), data.high];
    const low = [...this.history.map((el) => el.low), data.low];
    const open = [...this.history.map((el) => el.open), data.open];
    const close = [...this.history.map((el) => el.close), data.close];
    const volume = [...this.history.map((el) => el.volume), data.volume];

    const [ema4, ema9, ema12, ema20, ema50, rsi, bb, ichimoku, vp, macd] =
      await Promise.all([
        this.ema(4, price),
        this.ema(9, price),
        this.ema(12, price),
        this.ema(20, price),
        this.ema(50, price),
        this.rsi(14, price),
        this.bb(14, price),
        this.ichimoku(
          {
            conversionPeriod: 9,
            basePeriod: 26,
            spanPeriod: 52,
            displacement: 26,
          },
          high,
          low
        ),
        this.vp(14, high, low, open, close, volume),
        this.macd(
          {
            fastPeriod: 5,
            slowPeriod: 8,
            signalPeriod: 3,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
          },
          price
        ),
      ]);

    this.history.push({
      ...data,
      ema4,
      ema9,
      ema12,
      ema20,
      ema50,
      rsi,
      bb,
      ichimoku,
      vp,
      macd,
    });
  }

  printData() {
    const data = this.history[this.history.length - 1];
    // console.log(data.date);
    console.log({
      ...data,
      benefice: this.wallet.stable
        ? this.wallet.stable - BASE_ALLOCATION + this.wallet.bank
        : this.wallet.token * data.price,
    });
  }

  async apply(data) {
    await this.technicalIndicators(data);

    const len = this.history.length;

    // this.printData();

    if (len <= 50) {
      return;
    }

    const strategies = [
      new BankStrategy(this.history, this.entryData, this.wallet),
      // new CyberbotStrategy(this.history, this.entryData, this.wallet),
      // new MeanReversionStrategy(this.history, this.entryData, this.wallet),
      new EntryOptimusStrategy(this.history, this.entryData, this.wallet),
      // new LamboStrategy(this.history, this.entryData, this.wallet),
    ];

    const exitStrategy = strategies.find((strategy) => strategy.exit());
    if (exitStrategy) {
      if (exitStrategy.buyStrategy === "spot") {
        await this.sell(exitStrategy);
      } else {
        await this.short(exitStrategy);
      }
    }

    const entryStrategy = strategies.find((strategy) => strategy.entry());
    if (entryStrategy) {
      if (entryStrategy.buyStrategy === "spot") {
        await this.buy(entryStrategy);
      } else {
        await this.long(entryStrategy);
      }
    }

    const saveStrategy = strategies.find((strategy) => strategy.save());
    if (saveStrategy) {
      await this.save(saveStrategy);
    }
  }
}

async function main() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  // const output = fs.createWriteStream("./logs/stdout.log");
  // const errorOutput = fs.createWriteStream("./logs/stderr.log");

  // const logger = new Console({ stdout: output, stderr: errorOutput });
  const client = new Spot(apiKey, apiSecret); //, { logger: logger });

  // Get account information
  const account = await client.account();

  const tradingAlgorithm = new Algorithm(BASE_ALLOCATION, TRADE_FEE);

  while (1) {
    const tickerPrice = await client.tickerPrice(ticker);
    const price = tickerPrice.data.price;

    await tradingAlgorithm.apply(parseFloat(price));

    await sleep(TIME_INTERVAL);
  }
}

async function test(ticker) {
  const tradingAlgorithm = new Algorithm(BASE_ALLOCATION, TRADE_FEE);
  const historicalPrices = [];
  const dataDirectory = "./data/";

  const files = fs.readdirSync(dataDirectory);

  for (const file of files) {
    if (file.startsWith(`${ticker}-${GRANULARITY}`) && file.endsWith(`.csv`)) {
      await new Promise((resolve) => {
        fs.createReadStream(path.resolve(dataDirectory, file))
          .pipe(csv.parse())
          .on("error", (error) => console.error(error))
          .on("data", (row) =>
            historicalPrices.push({
              date: row[0],
              open: row[1],
              high: row[2],
              low: row[3],
              close: row[4],
              price: row[4],
              volume: row[5],
            })
          )
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
    await tradingAlgorithm.apply({
      price: parseFloat(price),
      date: new Date(parseFloat(date)),
      low: parseFloat(low),
      high: parseFloat(high),
      volume: parseFloat(volume),
      open: parseFloat(open),
      close: parseFloat(close),
    });
  }

  if (tradingAlgorithm.wallet.token) {
    await tradingAlgorithm.sell("none");
  }

  console.log("🎉 End", {
    benefice:
      tradingAlgorithm.wallet.stable -
      BASE_ALLOCATION +
      tradingAlgorithm.wallet.bank,
    fees: tradingAlgorithm.fees,
  });
}

async function feed(ticker) {
  const dataDirectory = "./data/";
  let date = new Date("2021-03-01");
  const now = new Date();
  const end = new Date(now.setTime(now.getTime() - 1 * 86400000));

  while (date < end) {
    var dd = String(date.getDate()).padStart(2, "0");
    var mm = String(date.getMonth() + 1).padStart(2, "0");
    var yyyy = date.getFullYear();

    for (const granularity of GRANULARITIES) {
      const filename = `${ticker}-${granularity}-${yyyy}-${mm}-${dd}`;
      const out = fs.createWriteStream(
        path.resolve(dataDirectory, `${filename}.zip`)
      );

      try {
        await https.get(
          `https://data.binance.vision/data/spot/daily/klines/${ticker}/${GRANULARITY}/${filename}.zip`,
          (response) => {
            //.pipe(zlib.createUnzip())
            response.pipe(out);
          }
        );
      } catch (error) {
        console.log(error);
      }
    }

    date = new Date(date.setTime(date.getTime() + 1 * 86400000));
  }

  console.log(
    "🤷‍♂️ Not able to unzip them, please use (cd ./data && unzip *.zip)"
  );
}

if (!process.argv[2] || !process.argv[3]) {
  console.log("Command $> yarn start [feed|test|trade] [VETUSDT|BTCUSDC|...]");
}
if (process.argv[2] === "trade") {
  main(process.argv[1]);
}

if (process.argv[2] === "feed") {
  feed(process.argv[1]);
}

if (process.argv[2] === "test") {
  test(process.argv[1]).then(exit);
}
