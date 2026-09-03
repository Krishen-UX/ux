/** Kapitalwert einer Zahlungsreihe. cashflows[0] fällt heute an. */
export function npv(cashflows: number[], diskontsatzProzent: number): number {
  const r = diskontsatzProzent / 100;
  let summe = 0;
  for (let t = 0; t < cashflows.length; t++) summe += cashflows[t] / Math.pow(1 + r, t);
  return summe;
}

/**
 * Diskontierte Amortisation in Jahren ab heute. Zwischen den Stützjahren wird
 * linear interpoliert. Null, wenn sich die Investition im Betrachtungszeitraum
 * nicht zurückverdient.
 */
export function amortisation(cashflows: number[], diskontsatzProzent: number): number | null {
  const r = diskontsatzProzent / 100;
  let kumuliert = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const barwert = cashflows[t] / Math.pow(1 + r, t);
    const vorher = kumuliert;
    kumuliert += barwert;
    if (vorher < 0 && kumuliert >= 0 && barwert > 0) return t - 1 + -vorher / barwert;
  }
  return null;
}

/** Stromgestehungskosten aus diskontierten Kosten und diskontierter Arbeit. */
export function lcoe(
  kosten: number[],
  mengenMWh: number[],
  diskontsatzProzent: number,
): number | null {
  const r = diskontsatzProzent / 100;
  let barwertKosten = 0;
  let barwertMenge = 0;
  for (let t = 0; t < kosten.length; t++) {
    barwertKosten += kosten[t] / Math.pow(1 + r, t);
    barwertMenge += (mengenMWh[t] ?? 0) / Math.pow(1 + r, t);
  }
  return barwertMenge > 0 ? barwertKosten / barwertMenge : null;
}
