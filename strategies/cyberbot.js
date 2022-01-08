export class CyberbotStrategy {
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
