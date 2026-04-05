/**
 * Parse fractional inch strings to decimal
 * Handles: "1 3/4", "3/4", "1.75", "96"
 */
export function parseFraction(str) {
  if (str === null || str === undefined) return 0;
  str = String(str).trim();
  if (!str) return 0;

  // Pure decimal
  if (!str.includes('/')) return parseFloat(str) || 0;

  // Mixed number: "1 3/4"
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);

  // Simple fraction: "3/4"
  const simple = str.match(/^(\d+)\/(\d+)$/);
  if (simple) return parseInt(simple[1]) / parseInt(simple[2]);

  return 0;
}

/**
 * Format decimal inches to a readable fraction string
 * e.g. 1.75 → "1 3/4", 0.75 → "3/4", 2.0 → "2"
 */
export function formatFraction(decimal, denominator = 16) {
  if (isNaN(decimal) || decimal === null || decimal === undefined) return '0';
  const whole = Math.floor(decimal);
  const remainder = decimal - whole;
  const numerator = Math.round(remainder * denominator);

  if (numerator === 0) return whole.toString();
  if (numerator === denominator) return (whole + 1).toString();

  // Reduce fraction
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(numerator, denominator);
  const fracStr = `${numerator / g}/${denominator / g}`;
  return whole > 0 ? `${whole} ${fracStr}` : fracStr;
}
