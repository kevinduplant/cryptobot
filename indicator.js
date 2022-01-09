import technicalindicators from "technicalindicators";

export async function sma(period, values) {
  const sma = technicalindicators.sma({ period, values });
  return sma[sma.length - 1];
}

export async function ema(period, values) {
  const ema = technicalindicators.ema({ period, values });
  return ema[ema.length - 1];
}

export async function rsi(period, values) {
  const rsi = technicalindicators.rsi({ period, values });
  return rsi[rsi.length - 1];
}

export async function bb(period, values) {
  const bb = technicalindicators.bollingerbands({
    period,
    stdDev: 2,
    values,
  });
  return bb[bb.length - 1];
}

export async function ichimoku(parameters, high, low) {
  const ichimoku = technicalindicators.ichimokucloud({
    high,
    low,
    ...parameters,
  });
  return ichimoku[ichimoku.length - 1];
}

export async function vp(period, high, low, open, close, volume) {
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

export async function macd(parameters, values) {
  const macd = technicalindicators.macd({
    values,
    ...parameters,
  });

  return macd[macd.length - 1];
}

export async function stochastic(parameters, low, high, close) {
  const stochastic = technicalindicators.stochastic({
    ...parameters,
    low,
    high,
    close,
  });

  return stochastic[stochastic.length - 1];
}

export async function heikinashi(low, high, open, close, volume, timestamp) {
  const heikinashi = technicalindicators.heikinashi({
    low,
    open,
    volume,
    high,
    close,
    timestamp,
  });

  return {
    open: heikinashi.open[heikinashi.open.length - 1],
    close: heikinashi.close[heikinashi.close.length - 1],
    high: heikinashi.high[heikinashi.high.length - 1],
    low: heikinashi.low[heikinashi.low.length - 1],
    volume: heikinashi.volume[heikinashi.volume.length - 1],
  };
}

export async function roc(period, values) {
  const roc = technicalindicators.roc({
    values,
    period,
  });

  return roc[roc.length - 1];
}

export async function atr(period, low, high, close) {
  const atr = technicalindicators.atr({
    low,
    high,
    close,
    period,
  });

  return atr[atr.length - 1];
}
