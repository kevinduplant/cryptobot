export class LamboStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.buyStrategy = "margin";
    this.name = "lambo";
  }

  save(allocation) {
    // We SHAD here, implement risk reward factor
    if (this.wallet.stable >= allocation * 2) {
      return allocation;
    }

    return 0;
  }

  exit() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    let score = 0;

    if (!this.wallet.token && !this.wallet.long) {
      return false;
    }

    if (this.entryData.algo !== "lambo") {
      return false;
    }

    // Stop loss (set to 5 ATR under bought price) - Only if we do not short the market
    if (
      this.wallet.long &&
      data.heikinashi.close <=
        this.entryData.heikinashi.close - this.entryData.atr * 5
    ) {
      console.log("💀 LONG STOP LOSS", {
        entry: this.entryData.price,
        stopLoss: this.entryData.heikinashi.close - this.entryData.atr * 5,
      });
      return true;
    }

    if (
      this.wallet.short &&
      data.heikinashi.close >=
        this.entryData.heikinashi.close - this.entryData.atr * 5
    ) {
      console.log("💀 SHORT STOP LOSS", {
        entry: this.entryData.price,
        stopLoss: this.entryData.heikinashi.close - this.entryData.atr * 5,
      });
      return true;
    }

    // Take profit (set to 2 ATR over bought price)
    if (
      data.heikinashi.close >=
      this.entryData.heikinashi.close + this.entryData.atr * 2
    ) {
      score += 1;
    }

    // If MACD cross bearish (MACD < signal)
    if (
      (previousData.macd.MACD >= previousData.macd.signal &&
        data.macd.MACD <= data.macd.signal) ||
      data.macd.MACD <= data.macd.signal
    ) {
      score += 1;
    }

    // If ROC cross bearish (ROC < 0)
    if (previousData.roc >= 0 && data.roc < 0) {
      score += 1;
    }

    // ROC cross bearish (ROC >= 0)
    if (previousData.roc < 0 && data.roc >= 0) {
      score += 1;
    }

    // ROC divergence with price
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price > data.price && previousData.roc < data.roc) {
      score += 0.5;
    }

    // RSI is overbought (>= 75)
    if (data.rsi >= 75) {
      score += 1;
    }

    // TODO: More RSI check

    // EMA 7 cross 14 from top to bottom
    if (previousData.ema7 >= previousData.ema14 && data.ema7 < data.ema14) {
      score += 1;
    }

    // SMA 7 cross 14 from top to bottom
    if (previousData.sma7 >= previousData.sma14 && data.sma7 < data.sma14) {
      score += 1;
    }

    // Price go down
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price > data.price) {
      score += 1;
    }

    // Price cross lower Bollinger from top to bottom
    if (
      previousData.bb.lower < previousData.price &&
      data.bb.lower >= data.price
    ) {
      score += 1;
    }

    // Price cross upper Bollinger from top to bottom
    if (
      previousData.bb.upper < previousData.price &&
      data.bb.upper >= data.price
    ) {
      score += 1;
    }

    // Stochastic K line cross below D line (K < D)
    if (
      (previousData.stochastic.k >= previousData.stochastic.d &&
        data.stochastic.k < data.stochastic.d) ||
      data.stochastic.k < data.stochastic.d
    ) {
      score += 1;
    }

    // Stochastic K line is above 80
    if (data.stochastic.k > 80) {
      score += 1;
    }

    // Ichimoku cloud cross bearish (Span A < Span B)
    if (
      (previousData.ichimoku.spanA >= previousData.ichimoku.spanB &&
        data.ichimoku.spanA < data.ichimoku.spanB) ||
      data.ichimoku.spanA < data.ichimoku.spanB
    ) {
      score += 1;
    }

    // Price closed below Ichimoku cloud
    if (
      previousData.close < data.ichimoku.spanA ||
      previousData.close < data.ichimoku.spanB
    ) {
      score += 1;
    }

    // Ichimoku conversion line cross below base line
    if (
      previousData.ichimoku.conversion >= data.ichimoku.base &&
      data.ichimoku.conversion < data.ichimoku.base
    ) {
      score += 1;
    }

    // Ichimoku price cross bellow base line
    if (
      previousData.price >= previousData.ichimoku.base &&
      data.price < data.ichimoku.base
    ) {
      score += 1;
    }

    // If Stop and Reverse is bellow the current price
    if (data.psar <= data.price) {
      score += 1;
    }

    if (score >= 11) {
      console.log("📉📉 ", { score });
    }

    return score >= 11;
  }

  entry() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];

    let score = 0;

    if (!this.wallet.stable && !this.wallet.short) {
      return false;
    }

    // MACD cross bullish - Or is already bullish
    if (
      (previousData.macd.MACD <= previousData.macd.signal &&
        data.macd.MACD >= data.macd.signal) ||
      data.macd.MACD >= data.macd.signal
    ) {
      score += 1;
    }

    // MACD histogram cross bullish - Or is already bullish
    if (
      (previousData.macd.histogram < 0 && data.macd.histogram >= 0) ||
      data.macd.histogram >= 0
    ) {
      score += 0.5;
    }

    // ROC cross bullish (ROC >= 0) - Or is already bullish
    if ((previousData.roc < 0 && data.roc >= 0) || data.roc >= 0) {
      score += 1;
    }

    // ROC divergence
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price < data.price && previousData.roc > data.roc) {
      score += 0.5;
    }

    // RSI is not overbought (<= 70)
    if (data.rsi < 70) {
      score += 1;
    }

    // RSI underbought cross 30 (<= 30) - Or is already over 30
    if ((previousData.rsi < 30 && data.rsi >= 30) || data.rsi >= 30) {
      score += 1;
    }

    // RSI underbought cross 50 (<= 50) - Or is already over 50
    if ((previousData.rsi < 50 && data.rsi >= 50) || data.rsi >= 50) {
      score += 1;
    }

    // EMA 7 cross 14 from bottom to top - Or is already over 14
    if (
      (previousData.ema7 <= previousData.ema14 && data.ema7 > data.ema14) ||
      data.ema7 > data.ema14
    ) {
      score += 1;
    }

    // Price cross EMA 7 from bottom to top - Or is already Over EMA 6
    if (
      (previousData.price < previousData.ema7 && data.price > data.ema7) ||
      data.price > data.ema7
    ) {
      score += 1;
    }

    // Price go up
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price < data.price) {
      score += 0.5;
    }

    // Price cross lower Bollinger from bottom to top - Or is already over
    if (
      (previousData.bb.lower >= previousData.price &&
        data.bb.lower < data.price) ||
      data.bb.lower < data.price
    ) {
      score += 1;
    }

    // Price cross upper Bollinger from bottom to top
    if (
      (previousData.bb.upper >= previousData.price &&
        data.bb.upper < data.price) ||
      data.bb.upper < data.price
    ) {
      score += 0.5;
    }

    // Stochastic K line cross below D line (K < D)
    if (
      (previousData.stochastic.k <= previousData.stochastic.d &&
        data.stochastic.k > data.stochastic.d) ||
      data.stochastic.k > data.stochastic.d
    ) {
      score += 1;
    }

    // Stochastic K line is below 20
    if (data.stochastic.k < 20) {
      score += 1;
    }

    // Ichimoku cloud cross bullish (Span A > Span B)
    if (
      (previousData.ichimoku.spanA <= previousData.ichimoku.spanB &&
        data.ichimoku.spanA > data.ichimoku.spanB) ||
      data.ichimoku.spanA > data.ichimoku.spanB
    ) {
      score += 1;
    }

    // Price closed above Ichimoku cloud
    if (
      previousData.close > data.ichimoku.spanA ||
      previousData.close > data.ichimoku.spanB
    ) {
      score += 1;
    }

    // Ichimoku conversion line cross above base line and price is above conversion line
    if (
      data.price >= data.ichimoku.conversion &&
      data.ichimoku.conversion > data.ichimoku.base
    ) {
      score += 1;
    }

    // Ichimoku price cross above base line
    if (
      (previousData.price <= previousData.ichimoku.base &&
        data.price > data.ichimoku.base) ||
      data.price > data.ichimoku.base
    ) {
      score += 1;
    }

    // If Stop and Reverse is above the price
    if (data.psar >= data.price) {
      score += 1;
    }

    if (score >= 13) {
      console.log("📈📈 ", { score });
    }

    return score >= 13;
  }
}
