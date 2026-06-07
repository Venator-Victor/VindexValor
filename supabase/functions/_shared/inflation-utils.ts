import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface InflationRecord {
    period: string;
    inflation_value: number;
}

export async function getInflationData(
    supabase: SupabaseClient, 
    startPeriod: string, 
    endPeriod: string
): Promise<InflationRecord[]> {
    const { data, error } = await supabase
        .from('inflation_data')
        .select('period, inflation_value')
        .gte('period', startPeriod)
        .lte('period', endPeriod)
        .order('period', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function calculateInflationAdjustment(
    amount: number,
    records: InflationRecord[]
): Promise<{ adjustedAmount: number; totalPercentage: number }> {
    let factor = 1;
    
    for (const record of records) {
        // inflation_value is percentage (e.g., 0.5 for 0.5%)
        factor *= (1 + (Number(record.inflation_value) / 100));
    }
    
    const adjustedAmount = amount * factor;
    const totalPercentage = (factor - 1) * 100;
    
    return { adjustedAmount, totalPercentage };
}