/**
 * Parses duration strings like "15m", "2h", "30d", "60s" into a future Date object.
 * If unrecognized or missing, defaults to 30 days from now.
 */
export function calculateExpiryDate(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(
    Date.now() + value * (multipliers[unit] ?? 24 * 60 * 60 * 1000),
  );
}

