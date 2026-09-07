import type { Database } from '@/types/database'
import { addMonths, format, parseISO } from 'date-fns'

type IncomeSource = Database['public']['Tables']['income_sources']['Row']
type FixedObligation = Database['public']['Tables']['fixed_obligations']['Row']

export interface ProjectedMonth {
  month: string
  cashIn: number
  cashOut: number
  net: number
}

export function generateProjections(
  monthsToProject: number,
  incomeSources: IncomeSource[],
  obligations: FixedObligation[],
  currentDate: Date = new Date()
): ProjectedMonth[] {
  const projections: ProjectedMonth[] = []

  for (let i = 0; i < monthsToProject; i++) {
    const targetDate = addMonths(currentDate, i)
    const monthKey = format(targetDate, 'yyyy-MM')
    
    // Calculate expected cash in for this month
    let cashIn = 0
    incomeSources.forEach(source => {
      if (source.is_active && source.is_recurring) {
        cashIn += Number(source.expected_amount)
      }
    })

    // Calculate expected cash out for this month
    let cashOut = 0
    obligations.forEach(obs => {
      if (!obs.is_active) return

      let applies = true
      
      // Check start date
      if (obs.start_date) {
        if (targetDate < parseISO(obs.start_date)) applies = false
      }
      
      // Check end date or installments
      if (obs.end_date) {
        if (targetDate > parseISO(obs.end_date)) applies = false
      }
      
      if (applies) {
        cashOut += Number(obs.current_amount)
      }
    })

    projections.push({
      month: monthKey,
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    })
  }

  return projections
}
