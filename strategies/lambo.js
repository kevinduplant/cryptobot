export class LamboStrategy {
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
