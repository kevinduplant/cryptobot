export class MeanReversionStrategy {
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
