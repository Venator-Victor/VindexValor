export function calculateNextDate(currentDateStr: string, frequency: string): string {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  // Noon UTC avoids DST day-boundary shifts
  const workDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  switch (frequency.toLowerCase()) {
    case 'daily':
      workDate.setUTCDate(workDate.getUTCDate() + 1);
      break;
    case 'weekly':
      workDate.setUTCDate(workDate.getUTCDate() + 7);
      break;
    case 'biweekly':
      workDate.setUTCDate(workDate.getUTCDate() + 15);
      break;
    case 'monthly': {
      const day = workDate.getUTCDate();
      workDate.setUTCMonth(workDate.getUTCMonth() + 1);
      // Jan 31 + 1 month overflows to Mar — clamp to last day of Feb instead
      if (workDate.getUTCDate() !== day) workDate.setUTCDate(0);
      break;
    }
    case 'quarterly': {
      const day = workDate.getUTCDate();
      workDate.setUTCMonth(workDate.getUTCMonth() + 3);
      if (workDate.getUTCDate() !== day) workDate.setUTCDate(0);
      break;
    }
    case 'semiannual': {
      const day = workDate.getUTCDate();
      workDate.setUTCMonth(workDate.getUTCMonth() + 6);
      if (workDate.getUTCDate() !== day) workDate.setUTCDate(0);
      break;
    }
    case 'yearly': {
      const day = workDate.getUTCDate();
      workDate.setUTCFullYear(workDate.getUTCFullYear() + 1);
      // Feb 29 in a non-leap year clamps to Feb 28
      if (workDate.getUTCDate() !== day) workDate.setUTCDate(0);
      break;
    }
    default: {
      // fallback: monthly
      const day = workDate.getUTCDate();
      workDate.setUTCMonth(workDate.getUTCMonth() + 1);
      if (workDate.getUTCDate() !== day) workDate.setUTCDate(0);
    }
  }

  return workDate.toISOString().split('T')[0];
}

// Advance by multiple steps (used for installment due-date generation)
export function advanceDate(dateStr: string, frequency: string, steps = 1): string {
  let result = dateStr;
  for (let i = 0; i < steps; i++) {
    result = calculateNextDate(result, frequency);
  }
  return result;
}