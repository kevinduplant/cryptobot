import * as indicator from "../indicator.js";
import { EntryOptimusStrategy } from "./entryOptimus.js";
import { BankStrategy } from "./bank.js";
import { CyberbotStrategy } from "./cyberbot.js";
import { MeanReversionStrategy } from "./meanReversion.js";
import { LamboStrategy } from "./lambo.js";

const BASE_ALLOCATION = 100;

export class BaseStrategy {
  constructor(allocation, tradeFee) {
    this.allocation = allocation;
    this.wallet = {
      stable: allocation,
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

  async save(stategy, allocation) {
    const amount = stategy.save(allocation);

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
        buy: (token * this.entryData.price).toFixed(5),
        sell: (token * data.price).toFixed(5),
        loose: (token * this.entryData.price - token * data.price).toFixed(2),
      });
    } else {
      console.log("🥳 WIN", {
        buy: (token * this.entryData.price).toFixed(5),
        sell: (token * data.price).toFixed(5),
        win: (token * data.price - token * this.entryData.price).toFixed(2),
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

  async indicators(data) {
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
    const date = [
      ...this.history.map((el) => el.date.getTime()),
      data.date.getTime(),
    ];

    const [
      sma4,
      sma9,
      sma12,
      sma20,
      sma50,
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
      stochastic,
      heikinashi,
    ] = await Promise.all([
      indicator.sma(4, price),
      indicator.sma(9, price),
      indicator.sma(12, price),
      indicator.sma(20, price),
      indicator.sma(50, price),
      indicator.ema(4, price),
      indicator.ema(9, price),
      indicator.ema(12, price),
      indicator.ema(20, price),
      indicator.ema(50, price),
      indicator.rsi(14, price),
      indicator.bb(14, price),
      indicator.ichimoku(
        {
          conversionPeriod: 9,
          basePeriod: 26,
          spanPeriod: 52,
          displacement: 26,
        },
        high,
        low
      ),
      indicator.vp(14, high, low, open, close, volume),
      indicator.macd(
        {
          fastPeriod: 5,
          slowPeriod: 8,
          signalPeriod: 3,
          SimpleMAOscillator: false,
          SimpleMASignal: false,
        },
        price
      ),
      indicator.stochastic(
        {
          period: 14,
          signalPeriod: 3,
        },
        low,
        high,
        close
      ),
      indicator.heikinashi(low, high, open, close, volume, date),
    ]);

    this.history.push({
      ...data,
      sma4,
      sma9,
      sma12,
      sma20,
      sma50,
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
      stochastic,
      heikinashi,
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
    await this.indicators(data);

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