export class EntryOptimusStrategy {
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
      console.log("Sell - EXIT STOP LOSS");
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
      console.log("Sell - EXIT RSI");
      return true;
    }

    // If MACD cross bearish
    if (
      previousData.macd.MACD >= previousData.macd.signal &&
      data.macd.MACD <= data.macd.signal
    ) {
      console.log("Sell - EXIT MACD CROSS");
      return true;
    }

    // If price cross upper Bollinger
    if (
      previousData.bb.upper <= previousData.price &&
      data.bb.upper >= data.price
    ) {
      console.log("Sell - EXIT BB CROSS");
      return true;
    }

    // If 1) Entry point 1, 2) profit > min_profit, then RSI=50 gives a signal for the exit.
    if (this.entryData.rsi <= 37 && data.rsi >= 50) {
      console.log("Sell - EXIT RSI 50");
      return true;
    }

    // If 1) Entry point  2, 2) profit > min_profit, then RSI=60 gives a signal for the exit.
    if (this.entryData.rsi <= 55 && data.rsi >= 60) {
      console.log("Sell - EXIT RSI 60");
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
      console.log("Buy - BB cross, MACD up");
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
      console.log("Buy - MACD cross, RSI < 60");
      return true;
    }

    // The entry range for RSI value is set from 30 to 37. Once the RSI crosses 30 from bottom to top the robot gets the entry signal.
    if (data.rsi <= 37 && data.rsi >= 30 && previousData.rsi < 30) {
      console.log("RSI cross 30");
      return true;
    }

    // The entry range for RSI value is set from 50 to 55.  Once the RSI crosses 50 from bottom to top the robot gets the entry signal.
    if (data.rsi <= 55 && data.rsi >= 50 && previousData.rsi < 50) {
      console.log("Buy - RSI cross 50");
      return true;
    }

    return false;
  }
}
