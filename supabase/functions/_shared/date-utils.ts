export function calculateNextDate(currentDateStr: string, frequency: string): string {
    const date = new Date(currentDateStr);
    // Adjust for timezone offset to ensure we work with the "visual" date
    // (Simple approach: treat input string as UTC date parts)
    const [y, m, d] = currentDateStr.split('-').map(Number);
    
    // Work with a date object set to noon to avoid DST shifts causing day jumps
    const workDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    switch (frequency.toLowerCase()) {
        case 'diario':
        case 'diário':
            workDate.setUTCDate(workDate.getUTCDate() + 1);
            break;
        case 'semanal':
        case 'toda semana':
            workDate.setUTCDate(workDate.getUTCDate() + 7);
            break;
        case 'quinzenal':
        case 'a cada 2 semanas':
            workDate.setUTCDate(workDate.getUTCDate() + 15); // Or 14? Traditionally 15 days or 2 weeks (14). 
            // Previous code used 14 for 'A cada 2 semanas' and 15 logic for 'quinzenal' is often 15 days.
            // Let's stick to simple addition. 'Quinzenal' often implies half-month, but +15 days is safer for simple logic.
            // However, the previous frontend logic for 'quinzenal' was specific (1st or 16th). 
            // If the user selected specific day logic, we should respect it.
            // For now, let's standarize to +15 days for simplicity in backend unless specifically 'bi-weekly' (14).
            // Based on frontend options: "Quinzenal" was an option.
            workDate.setUTCDate(workDate.getUTCDate() + 15);
            break;
        case 'mensal':
        case 'todo mês':
            // Handle month overflow (e.g., Jan 31 -> Feb 28)
            const currentDay = workDate.getUTCDate();
            workDate.setUTCMonth(workDate.getUTCMonth() + 1);
            
            // Check if day changed (meaning we overflowed, e.g., Feb 28 -> Mar 2 or similar)
            // Actually JS setMonth tries to keep day, but if not exists, it goes to next month.
            // e.g. Jan 31 + 1 month -> March 3 (non-leap) or March 2.
            // We usually want the last day of the month in that case.
            if (workDate.getUTCDate() !== currentDay) {
                // We overflowed. Go back to last day of previous month (which is the intended month)
                workDate.setUTCDate(0); 
            }
            break;
        case 'trimestral':
            const dayT = workDate.getUTCDate();
            workDate.setUTCMonth(workDate.getUTCMonth() + 3);
            if (workDate.getUTCDate() !== dayT) workDate.setUTCDate(0);
            break;
        case 'semestral':
            const dayS = workDate.getUTCDate();
            workDate.setUTCMonth(workDate.getUTCMonth() + 6);
            if (workDate.getUTCDate() !== dayS) workDate.setUTCDate(0);
            break;
        case 'anual':
             const dayA = workDate.getUTCDate();
             workDate.setUTCFullYear(workDate.getUTCFullYear() + 1);
             // Leap year check (Feb 29 -> Feb 28 next year)
             if (workDate.getUTCDate() !== dayA) workDate.setUTCDate(0);
             break;
        default:
             // Default to monthly if unknown
             const dayD = workDate.getUTCDate();
             workDate.setUTCMonth(workDate.getUTCMonth() + 1);
             if (workDate.getUTCDate() !== dayD) workDate.setUTCDate(0);
    }

    return workDate.toISOString().split('T')[0];
}