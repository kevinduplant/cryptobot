import * as indicator from "../indicator.js";
import { EntryOptimusStrategy } from "./entryOptimus.js";
import { BankStrategy } from "./bank.js";
import { CyberbotStrategy } from "./cyberbot.js";
import { MeanReversionStrategy } from "./meanReversion.js";
import { LamboStrategy } from "./lambo.js";

// TODO: Implement Risk/Reward (with leverage ?)
// TODO: Exit strategy based on entry score ?
// TODO: Play with entry/exit score to have something more and more relevant
// TODO: "Machine learning" about results (we might need to split lambo strategy into sub-strategies)

const strategyFactory = {
  entryOptimus: EntryOptimusStrategy,
  bank: BankStrategy,
  cyberbot: CyberbotStrategy,
  meanReversion: MeanReversionStrategy,
  lambo: LamboStrategy,
};

const TRUST_LEVEL = 4;
export class BaseStrategy {
  constructor(strategy, market, allocation, tradeFee) {
    if (!strategyFactory[strategy]) {
      throw new Error("🚨 Unknown strategy", {
        strategy,
        strategies: Object.keys(strategyFactory),
      });
    }

    if (!["margin", "spot"].includes(market)) {
      throw new Error("🚨 Unknown market", { market });
    }

    this.allocation = allocation;
    this.strategy = strategy;
    this.wallet = {
      stable: allocation,
      bank: 0,
      long: 0,
      short: 0,
    };
    this.tradeFee = tradeFee;
    this.market = market;

    this.fees = 0;
    this.entryData = {};
    this.history = [];

    this.analysis = {
      loose: [],
      win: [],
      long: {
        win: [],
        loose: [],
      },
      short: {
        win: [],
        loose: [],
      },
    };

    this.learn = {
      win: [],
      loose: [],
    };
  }

  async trust(object, state) {
    return (
      object.filter(
        (e) =>
          e === Buffer.from(JSON.stringify(state), "utf-8").toString("base64")
      ).length >= TRUST_LEVEL
    );
  }

  async encode(object) {
    return Buffer.from(JSON.stringify(object), "utf-8").toString("base64");
  }

  async save(strategy) {
    const amount = await strategy.save(this.allocation);

    if (amount <= 0) {
      return;
    }

    this.wallet.stable -= amount;
    this.wallet.bank += amount;

    console.log("💵 SAVE", { amount, bank: this.wallet.bank });
  }

  async buySpot(strategy) {
    const data = this.history[this.history.length - 1];

    const fee = (this.wallet.stable * this.tradeFee) / 100;

    this.wallet.long = (this.wallet.stable - fee) / data.price;
    this.wallet.stable = 0;

    this.fees += fee;

    console.log("🛫 BUY", data.date);

    this.entryData = {
      ...data,
      wallet: this.wallet,
      fee,
      benefice: this.wallet.stable - this.allocation + this.wallet.bank,
      algo: strategy.name,
    };
  }

  async sellSpot() {
    const data = this.history[this.history.length - 1];
    const fee = (this.wallet.stable * this.tradeFee) / 100;

    if (this.wallet.short) {
      this.closeShort();
      return;
    }

    const benefice = (
      this.wallet.long * data.price -
      this.wallet.long * this.entryData.price
    ).toFixed(2);
    if (this.entryData.price >= data.price) {
      this.analysis.loose.push(benefice);
      this.analysis.long.loose.push(this.entryData.long.score);
      this.learn.loose.push(this.encode(this.entryData.long.state));

      console.log("❌ LOOSE", {
        buy: (this.wallet.long * this.entryData.price).toFixed(5),
        sell: (this.wallet.long * data.price).toFixed(5),
        loose: benefice,
      });
    } else {
      this.analysis.win.push(benefice);
      this.analysis.long.win.push(this.entryData.long.score);
      this.learn.win.push(this.encode(this.entryData.long.state));

      console.log("✅ WIN", {
        buy: (this.wallet.long * this.entryData.price).toFixed(5),
        sell: (this.wallet.long * data.price).toFixed(5),
        win: benefice,
      });
    }

    this.wallet.stable = this.wallet.long * data.price - fee;
    this.wallet.long = 0;
    this.fees += fee;

    console.log("🔴 EXIT POSITION", {
      buy: this.entryData.price,
      sell: data.price,
    });
  }

  async openLong(strategy) {
    const data = this.history[this.history.length - 1];
    const fee = (this.wallet.stable * data.price * this.tradeFee) / 100;

    this.wallet.long = (this.wallet.stable - fee) / data.price;
    this.wallet.stable = 0;

    this.fees += fee;

    console.log("🛫 OPEN LONG", data.date);

    this.entryData = {
      ...data,
      wallet: this.wallet,
      algo: strategy.name,
    };
  }

  async closeLong() {
    if (!this.wallet.long) {
      return;
    }
    const data = this.history[this.history.length - 1];
    const fee = (this.wallet.long * data.price * this.tradeFee) / 100;

    this.fees += fee;

    console.log("🚪 CLOSE LONG", { date: data.date, price: data.price });

    const buy = this.entryData.wallet.long * this.entryData.price;
    const sell = this.wallet.long * data.price - fee;

    const benefice = (sell - buy).toFixed(2);
    if (this.entryData.price >= data.price) {
      this.analysis.loose.push(benefice);
      this.analysis.long.loose.push(this.entryData.long.score);
      this.learn.loose.push(this.encode(this.entryData.long.state));

      console.log("❌ LOOSE", {
        buy: buy.toFixed(5),
        sell: sell.toFixed(5),
        loose: benefice,
      });
    } else if (this.entryData.wallet) {
      this.analysis.win.push(benefice);
      this.analysis.long.win.push(this.entryData.long.score);
      this.learn.win.push(this.encode(this.entryData.long.state));

      console.log("✅ WIN", {
        buy: buy.toFixed(5),
        sell: sell.toFixed(5),
        win: benefice,
      });
    }

    this.wallet.stable = sell;
    this.wallet.long = 0;
  }

  async openShort(strategy) {
    const data = this.history[this.history.length - 1];
    const fee = (this.wallet.stable * data.price * this.tradeFee) / 100;

    this.wallet.short = (this.wallet.stable - fee) / data.price;
    this.wallet.stable = 0;

    this.fees += fee;

    console.log("🛬 OPEN SHORT", data.date);

    this.entryData = {
      ...data,
      wallet: this.wallet,
      algo: strategy.name,
    };
  }

  async closeShort() {
    if (!this.wallet.short) {
      return;
    }

    const data = this.history[this.history.length - 1];
    const fee = (this.wallet.short * data.price * this.tradeFee) / 100;

    this.fees += fee;

    console.log("🚪 CLOSE SHORT", { date: data.date, price: data.price });

    const buy = this.wallet.short * this.entryData.price;
    const sell =
      this.wallet.short * data.price +
      (this.entryData.price + (this.entryData.price - data.price)) -
      fee;

    const benefice = (buy - sell).toFixed(2);
    if (this.entryData.price <= data.price) {
      this.analysis.loose.push(benefice);
      this.analysis.short.loose.push(this.entryData.short.score);
      this.learn.loose.push(this.encode(this.entryData.short.state));
      console.log("❌ LOOSE", {
        buy: buy.toFixed(5),
        sell: sell.toFixed(5),
        loose: benefice,
      });
    } else if (this.entryData.wallet) {
      this.analysis.win.push(benefice);
      this.analysis.short.win.push(this.entryData.short.score);
      this.learn.win.push(this.encode(this.entryData.short.state));
      console.log("✅ WIN", {
        buy: buy.toFixed(5),
        sell: sell.toFixed(5),
        win: benefice,
      });
    }

    this.wallet.stable = sell;
    this.wallet.short = 0;
  }

  async indicators(data) {
    // Keep only what is needed for technical indicators
    if (this.history.length >= 120) {
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
      // Momentum Indicator
      // ------------------------------------
      ao,
      adx,
      mfi,
      rsi,
      ichimoku,
      vp,
      macd,
      stochastic,
      roc,
      atr,
      // Overlap Studies
      // ------------------------------------
      psar,
      sma4,
      sma7,
      sma9,
      sma12,
      sma14,
      sma20,
      sma50,
      ema4,
      ema7,
      ema9,
      ema12,
      ema14,
      ema18,
      ema20,
      ema50,
      bb,
      // Chart type
      // ------------------------------------
      // Heikinashi stategy
      heikinashi,
      // Pattern Recognition - Bullish/Bearish candlestick patterns
      // ------------------------------------
      spinningTop,
      engulfingPattern,
      harami,
      marubozu,
      // Pattern Recognition - Bearish candlestick patterns
      // ------------------------------------
      abandonedBaby,
      hangingMan,
      shootingStar,
      gravestoneDoji,
      darkCloudCover,
      eveningDojiStar,
      eveningStar,
      threeBlackCrows,
      // Pattern Recognition - Bullish candlestick patterns
      // ------------------------------------
      hammer,
      invertedHammer,
      dragonflyDoji,
      piercingLine,
      morningDojiStar,
      morningStar,
      threeWhiteSoldiers,
    ] = await Promise.all([
      indicator.ao(
        {
          fastPeriod: 5,
          slowPeriod: 34,
        },
        low,
        high
      ),
      indicator.adx(14, close, high, low),
      indicator.mfi(14, close, high, low, volume),
      indicator.rsi(14, price),
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
      indicator.roc(14, price),
      indicator.atr(14, low, high, close),
      // ----
      indicator.psar(0.02, 0.2, high, low),
      indicator.sma(4, price),
      indicator.sma(7, price),
      indicator.sma(9, price),
      indicator.sma(12, price),
      indicator.sma(14, price),
      indicator.sma(20, price),
      indicator.sma(50, price),
      indicator.ema(4, price),
      indicator.ema(7, price),
      indicator.ema(9, price),
      indicator.ema(12, price),
      indicator.ema(14, price),
      indicator.ema(18, price),
      indicator.ema(20, price),
      indicator.ema(50, price),
      indicator.bb(14, price),
      // ----
      indicator.heikinashi(low, high, open, close, volume, date),
      // ----
      indicator.spinningTop(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      indicator.engulfingPattern(
        open.slice(-2),
        close.slice(-2),
        high.slice(-2),
        low.slice(-2)
      ),
      indicator.harami(
        open.slice(-2),
        close.slice(-2),
        high.slice(-2),
        low.slice(-2)
      ),
      indicator.marubozu(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      // ----
      indicator.abandonedBaby(
        open.slice(-5),
        close.slice(-5),
        high.slice(-5),
        low.slice(-5)
      ),
      indicator.hangingMan(
        open.slice(-5),
        close.slice(-5),
        high.slice(-5),
        low.slice(-5)
      ),
      indicator.shootingStar(
        open.slice(-5),
        close.slice(-5),
        high.slice(-5),
        low.slice(-5)
      ),
      indicator.gravestoneDoji(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      indicator.darkCloudCover(
        open.slice(-2),
        close.slice(-2),
        high.slice(-2),
        low.slice(-2)
      ),
      indicator.eveningDojiStar(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
      indicator.eveningStar(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
      indicator.threeBlackCrows(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
      // ----
      indicator.hammer(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      indicator.invertedHammer(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      indicator.dragonflyDoji(
        open.slice(-1),
        close.slice(-1),
        high.slice(-1),
        low.slice(-1)
      ),
      indicator.piercingLine(
        open.slice(-2),
        close.slice(-2),
        high.slice(-2),
        low.slice(-2)
      ),
      indicator.morningDojiStar(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
      indicator.morningStar(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
      indicator.threeWhiteSoldiers(
        open.slice(-3),
        close.slice(-3),
        high.slice(-3),
        low.slice(-3)
      ),
    ]);

    this.history.push({
      ...data,
      ao,
      adx,
      mfi,
      sma4,
      sma7,
      sma9,
      sma12,
      sma14,
      sma20,
      sma50,
      ema4,
      ema7,
      ema9,
      ema12,
      ema14,
      ema18,
      ema20,
      ema50,
      rsi,
      bb,
      ichimoku,
      vp,
      macd,
      stochastic,
      heikinashi,
      roc,
      atr,
      psar,
      spinningTop,
      engulfingPattern,
      harami,
      marubozu,
      abandonedBaby,
      hangingMan,
      shootingStar,
      gravestoneDoji,
      darkCloudCover,
      eveningDojiStar,
      eveningStar,
      threeBlackCrows,
      hammer,
      invertedHammer,
      dragonflyDoji,
      piercingLine,
      morningStar,
      threeWhiteSoldiers,
    });
  }

  printData() {
    const data = this.history[this.history.length - 1];
    console.log(data);
  }

  async apply(data) {
    await this.indicators(data);

    const len = this.history.length;

    // this.printData();

    // We need 52 period for Ichimoku
    if (len < 53) {
      return;
    }

    const strategy = new strategyFactory[this.strategy](
      this.history,
      this.entryData,
      this.wallet
    );

    const short = await strategy.short();
    const long = await strategy.long();

    if (
      (!this.wallet.long && long.openLong) ||
      (this.wallet.long && (long.closeLong || long.stopLoss))
    ) {
      console.log("📈📈 ", { long, price: data.price });
    }
    if (
      (!this.wallet.short && short.openShort) ||
      (this.wallet.short && (short.closeShort || short.stopLoss))
    ) {
      console.log("📉📉 ", { short, price: data.price });
    }

    if (this.market === "spot") {
      // Sell signal && Take profit
      if (
        this.wallet.long &&
        (short.stopLoss || short.openShort || long.closeLong)
      ) {
        this.history[this.history.length - 1].short = short;
        await this.sellSpot(strategy);
        await this.save(strategy);
      }

      // Buy signal
      if (this.wallet.stable && long.openLong) {
        this.history[this.history.length - 1].long = long;
        await this.buySpot(strategy);
      }
    }

    if (this.market === "margin") {
      // Sell signal && Take profit
      if (
        this.wallet.long &&
        (short.stopLoss || short.openShort || long.closeLong)
      ) {
        // if (
        //   this.trust(this.learn.loose, short.state) ||
        //   this.trust(this.learn.loose, short.long)
        // ) {
        //   console.log(
        //     `😱 ----------- We already loose ${TRUST_LEVEL} times, skip`
        //   );
        // } else {
        await this.closeLong(strategy);
        await this.save(strategy);
        // }
      }

      // Sell signal && Take profit
      if (
        this.wallet.short &&
        (long.stopLoss || long.openLong || short.closeShort)
      ) {
        // if (
        //   this.trust(this.learn.loose, short.state) ||
        //   this.trust(this.learn.loose, short.long)
        // ) {
        //   console.log(
        //     `😱 ----------- We already loose ${TRUST_LEVEL} times, skip`
        //   );
        // } else {
        await this.closeShort(strategy);
        await this.save(strategy);
        // }
      }

      // Buy signal
      if (this.wallet.stable && short.openShort) {
        // if (this.trust(this.learn.loose, short.state)) {
        //   console.log(
        //     `😱 ----------- We already loose ${TRUST_LEVEL} times, skip`
        //   );
        // } else {
        this.history[this.history.length - 1].short = short;
        await this.openShort(strategy);
        // }
      }

      if (this.wallet.stable && long.openLong) {
        // if (this.trust(this.learn.loose, long.state)) {
        //   console.log(
        //     `😱 ----------- We already loose ${TRUST_LEVEL} times, skip`
        //   );
        // } else {
        this.history[this.history.length - 1].long = long;
        await this.openLong(strategy);
        // }
      }
    }
  }
}
