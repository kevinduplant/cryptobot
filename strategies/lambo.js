export class LamboStrategy {
  constructor(history, entryData, wallet) {
    this.wallet = wallet;
    this.entryData = entryData;
    this.history = history;
    this.name = "lambo";
  }

  save(allocation) {
    // We SHAD here, implement risk reward factor
    if (this.wallet.stable >= allocation * 2) {
      return allocation;
    }

    return 0;
  }

  short() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];
    const state = {};

    if (this.entryData.price === undefined) {
      this.entryData = previousData;
    }

    let score = 0;

    // Stop loss (set to 5 ATR under bought price) - Only if we do not short the market
    if (
      (this.wallet.long || this.wallet.token) &&
      data.heikinashi.close <=
        this.entryData.heikinashi.close - this.entryData.atr * 5
    ) {
      console.log("💀 LONG STOP LOSS", {
        entry: this.entryData.price,
        stopLoss: this.entryData.heikinashi.close - this.entryData.atr * 5,
      });
      state.stopLoss = 5;
      score += 5;
    }

    // Take profit (set to 2 ATR over bought price)
    if (
      data.heikinashi.close >=
      this.entryData.heikinashi.close + this.entryData.atr * 2
    ) {
      state.takeProfit = 1;
      score += 1;
    }

    // If MACD cross bearish (MACD < signal)
    if (
      (previousData.macd.MACD >= previousData.macd.signal &&
        data.macd.MACD <= data.macd.signal) ||
      data.macd.MACD <= data.macd.signal
    ) {
      state.macdCrossBearish = 1;
      score += 1;
    }

    // TODO: WTF here
    // If ROC cross bearish (ROC < 0)
    if (previousData.roc >= 0 && data.roc < 0) {
      state.rocCrossBearish = 1;
      score += 1;
    }

    // ROC cross bearish (ROC >= 0)
    if (previousData.roc < 0 && data.roc >= 0) {
      state.rocCrossBearish = 1;
      score += 1;
    }

    // ROC divergence with price
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price > data.price && previousData.roc < data.roc) {
      state.rocDivergence = 0.5;
      score += 0.5;
    }

    // RSI is overbought (>= 75)
    if (data.rsi >= 75) {
      state.rsiOverbought = 1;
      score += 1;
    }

    // TODO: More RSI check

    // TODO: WTF EMA/SMA
    // EMA 7 cross 14 from top to bottom
    if (previousData.ema7 >= previousData.ema14 && data.ema7 < data.ema14) {
      state.ema7crossEma14 = 1;
      score += 1;
    }

    // SMA 7 cross 14 from top to bottom
    if (previousData.sma7 >= previousData.sma14 && data.sma7 < data.sma14) {
      state.sma7crossSma14 = 1;
      score += 1;
    }

    // Price go down
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price > data.price) {
      state.priceDown = 1;
      score += 1;
    }

    // Price cross lower Bollinger from top to bottom
    if (
      previousData.bb.lower < previousData.price &&
      data.bb.lower >= data.price
    ) {
      state.lowerBollingerCross = 1;
      score += 1;
    }

    // Price cross upper Bollinger from top to bottom
    if (
      previousData.bb.upper < previousData.price &&
      data.bb.upper >= data.price
    ) {
      state.upperBollingerCross = 1;
      score += 1;
    }

    // Stochastic K line cross below D line (K < D)
    if (
      (previousData.stochastic.k >= previousData.stochastic.d &&
        data.stochastic.k < data.stochastic.d) ||
      data.stochastic.k < data.stochastic.d
    ) {
      state.stochasticCross = 1;
      score += 1;
    }

    // Stochastic K line is above 80
    if (data.stochastic.k > 80) {
      state.stochasticAbove80 = 1;
      score += 1;
    }

    // Ichimoku cloud cross bearish (Span A < Span B)
    if (
      (previousData.ichimoku.spanA >= previousData.ichimoku.spanB &&
        data.ichimoku.spanA < data.ichimoku.spanB) ||
      data.ichimoku.spanA < data.ichimoku.spanB
    ) {
      state.ichimokuCloudBearish = 1;
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
      state.ichimokuConversionLineCross = 1;
      score += 1;
    }

    // Ichimoku price cross bellow base line
    if (
      previousData.price >= previousData.ichimoku.base &&
      data.price < data.ichimoku.base
    ) {
      state.ichimokuPriceCross = 1;
      score += 1;
    }

    // If Stop and Reverse is bellow the current price
    if (data.psar <= data.price) {
      state.psarBellowPrice = 1;
      score += 1;
    }

    if ((previousData.ao >= 0 && data.ao < 0) || data.ao < 0) {
      state.awesomeOscillatorCrossBearish = 1;
      score += 1;
    }

    if (data.spinningTop.bearish) {
      state.spinningTopBearish = 1;
      score += 1;
    }

    if (data.engulfingPattern.bearish) {
      state.engulfingPatternBearish = 1;
      score += 1;
    }

    if (data.harami.bearish) {
      state.haramiBearish = 1;
      score += 1;
    }

    if (data.marubozu.bearish) {
      state.marubozuBearish = 1;
      score += 1;
    }

    if (data.abandonedBaby) {
      state.abandonedBaby = 1;
      score += 1;
    }

    if (data.hangingMan) {
      state.hangingMan = 1;
      score += 1;
    }

    if (data.shootingStar) {
      state.shootingStar = 1;
      score += 1;
    }

    if (data.gravestoneDoji) {
      state.gravestoneDoji = 1;
      score += 1;
    }

    if (data.darkCloudCover) {
      state.darkCloudCover = 1;
      score += 1;
    }

    if (data.eveningDojiStar) {
      state.eveningDojiStar = 0.5;
      score += 0.5;
    }

    if (data.eveningStar) {
      state.eveningStar = 1;
      score += 1;
    }

    if (data.threeBlackCrows) {
      state.threeBlackCrows = 1;
      score += 1;
    }

    return {
      score,
      openShort: score >= 13,
      closeShort: score <= 6,
      state,
    };
  }

  long() {
    const len = this.history.length;
    const data = this.history[len - 1];
    const previousData = this.history[len - 2];
    const state = {};

    if (this.entryData.price) {
      this.entryData = previousData;
    }

    let score = 0;

    // Stop loss (set to 5 ATR under bought price) - Only if we do not short the market
    if (
      this.wallet.short &&
      data.heikinashi.close >=
        this.entryData.heikinashi.close + this.entryData.atr * 8
    ) {
      console.log("💀 SHORT STOP LOSS", {
        entry: this.entryData.price,
        price: data.price,
        stopLoss: this.entryData.heikinashi.close - this.entryData.atr * 8,
      });
      state.stopLoss = 5;
      score += 5;
    }

    // MACD cross bullish - Or is already bullish
    if (
      (previousData.macd.MACD <= previousData.macd.signal &&
        data.macd.MACD >= data.macd.signal) ||
      data.macd.MACD >= data.macd.signal
    ) {
      state.macdCrossBullish = 1;
      score += 1;
    }

    // MACD histogram cross bullish - Or is already bullish
    if (
      (previousData.macd.histogram < 0 && data.macd.histogram >= 0) ||
      data.macd.histogram >= 0
    ) {
      state.macdHistogramCrossBullish = 0.5;
      score += 0.5;
    }

    // ROC cross bullish (ROC >= 0) - Or is already bullish
    if ((previousData.roc < 0 && data.roc >= 0) || data.roc >= 0) {
      state.rocCrossBullish = 1;
      score += 1;
    }

    // ROC divergence
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price < data.price && previousData.roc > data.roc) {
      state.rocDivergence = 0.5;
      score += 0.5;
    }

    // RSI is not overbought (<= 70)
    if (data.rsi < 70) {
      state.rsiNotOverbought = 1;
      score += 1;
    }

    // RSI underbought cross 30 (<= 30) - Or is already over 30
    if ((previousData.rsi < 30 && data.rsi >= 30) || data.rsi >= 30) {
      state.rsiUnderbought30 = 1;
      score += 1;
    }

    // RSI underbought cross 50 (<= 50) - Or is already over 50
    if ((previousData.rsi < 50 && data.rsi >= 50) || data.rsi >= 50) {
      state.rsiUnderbought50 = 1;
      score += 1;
    }

    // EMA 7 cross 14 from bottom to top - Or is already over 14
    if (
      (previousData.ema7 <= previousData.ema14 && data.ema7 > data.ema14) ||
      data.ema7 > data.ema14
    ) {
      state.ema7crossEma14 = 1;
      score += 1;
    }

    // Price cross EMA 7 from bottom to top - Or is already Over EMA 6
    if (
      (previousData.price < previousData.ema7 && data.price > data.ema7) ||
      data.price > data.ema7
    ) {
      state.priceCrossEma7 = 1;
      score += 1;
    }

    // Price go up
    // TODO: Find a better way to calculate it (take last 4 period ?)
    if (previousData.price < data.price) {
      state.priceUp = 0.5;
      score += 0.5;
    }

    // Price cross lower Bollinger from bottom to top - Or is already over
    if (
      (previousData.bb.lower >= previousData.price &&
        data.bb.lower < data.price) ||
      data.bb.lower < data.price
    ) {
      state.lowerBollingerCross = 1;
      score += 1;
    }

    // Price cross upper Bollinger from bottom to top
    if (
      (previousData.bb.upper >= previousData.price &&
        data.bb.upper < data.price) ||
      data.bb.upper < data.price
    ) {
      state.upperBollingerCross = 0.5;
      score += 0.5;
    }

    // Stochastic K line cross below D line (K < D)
    if (
      (previousData.stochastic.k <= previousData.stochastic.d &&
        data.stochastic.k > data.stochastic.d) ||
      data.stochastic.k > data.stochastic.d
    ) {
      state.stochasticCross = 1;
      score += 1;
    }

    // Stochastic K line is below 20
    if (data.stochastic.k < 20) {
      state.stochasticBellow20 = 1;
      score += 1;
    }

    // Ichimoku cloud cross bullish (Span A > Span B)
    if (
      (previousData.ichimoku.spanA <= previousData.ichimoku.spanB &&
        data.ichimoku.spanA > data.ichimoku.spanB) ||
      data.ichimoku.spanA > data.ichimoku.spanB
    ) {
      state.ichimokuCloudBullish = 1;
      score += 1;
    }

    // Price closed above Ichimoku cloud
    if (
      previousData.close > data.ichimoku.spanA ||
      previousData.close > data.ichimoku.spanB
    ) {
      state.ichimokuPriceCross = 1;
      score += 1;
    }

    // Ichimoku conversion line cross above base line and price is above conversion line
    if (
      data.price >= data.ichimoku.conversion &&
      data.ichimoku.conversion > data.ichimoku.base
    ) {
      state.ichimokuConversionLineCross = 1;
      score += 1;
    }

    // Ichimoku price cross above base line
    if (
      (previousData.price <= previousData.ichimoku.base &&
        data.price > data.ichimoku.base) ||
      data.price > data.ichimoku.base
    ) {
      state.ichimokuPriceCross = 1;
      score += 1;
    }

    // If Stop and Reverse is above the price
    if (data.psar >= data.price) {
      state.psarAbovePrice = 1;
      score += 1;
    }

    if ((previousData.ao <= 0 && data.ao > 0) || data.ao > 0) {
      state.awesomeOscillatorCrossBullish = 1;
      score += 1;
    }

    if (data.spinningTop.bullish) {
      state.spinningTopBullish = 1;
      score += 1;
    }

    if (data.engulfingPattern.bullish) {
      state.engulfingPatternBullish = 1;
      score += 1;
    }

    if (data.harami.bullish) {
      state.haramiBullish = 1;
      score += 1;
    }

    if (data.marubozu.bullish) {
      state.marubozuBullish = 1;
      score += 1;
    }

    if (data.hammer) {
      state.hammer = 1;
      score += 1;
    }

    if (data.invertedHammer) {
      state.invertedHammer = 1;
      score += 1;
    }

    if (data.dragonflyDoji) {
      state.dragonflyDoji = 1;
      score += 1;
    }

    if (data.piercingLine) {
      state.piercingLine = 1;
      score += 1;
    }

    if (data.morningDojiStar) {
      state.morningDojiStar = 0.5;
      score += 0.5;
    }

    if (data.morningStar) {
      state.morningStar = 1;
      score += 1;
    }

    if (data.threeWhiteSoldiers) {
      state.threeWhiteSoldiers = 1;
      score += 1;
    }

    return {
      score,
      openLong: score >= 14,
      closeLong: score <= 6,
      state,
    };
  }
}
