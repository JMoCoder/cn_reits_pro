
/**
 * Market Data Calculation Utilities
 * 
 * Formulas:
 * 1. Intraday Drawdown = (High - Low) / High * 100%
 * 2. Turnover Change = (Current Amount - Previous Amount) / Previous Amount * 100%
 */

/**
 * Calculates Intraday Drawdown
 * Formula: (High - Low) / High
 * Note: Returns decimal value (e.g. 0.05 for 5%). Multiply by 100 for percentage display.
 */
export const calculateIntradayDrawdown = (high: number, low: number): number => {
  if (!high || high === 0) return 0;
  return (high - low) / high;
};

/**
 * Calculates Turnover Change (Amount Change)
 * Formula: (Current Amount - Previous Amount) / Previous Amount
 * Note: Returns decimal value.
 */
export const calculateTurnoverChange = (currentAmount: number, prevAmount: number): number => {
  if (!prevAmount || prevAmount === 0) return 0;
  return (currentAmount - prevAmount) / prevAmount;
};
