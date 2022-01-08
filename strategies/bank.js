export class BankStrategy {
  constructor(_history, _entryData, wallet) {
    this.wallet = wallet;
    this.name = "bank";
  }

  save(allocation) {
    // We SHAD here, implement risk reward factor
    if (this.wallet.stable >= allocation * 2) {
      return allocation;
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
