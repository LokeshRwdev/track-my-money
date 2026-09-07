import { getIncomeSources } from '@/app/actions/income'
import { getFixedObligations } from '@/app/actions/obligation'
import { generateProjections } from '@/lib/projection'
import { Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export const metadata = {
  title: 'Projection | Track My Money',
  description: 'Future cash flow forecast based on recurring income and commitments',
}

export default async function ProjectionPage() {
  const incomeSources = await getIncomeSources()
  const obligations = await getFixedObligations()
  const projections = generateProjections(6, incomeSources, obligations)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Future Projections
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          6-month cash flow outlook projected from active recurring streams and commitments.
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Projected Cash Flow</h2>
          </div>
          <span className="text-xs text-muted-foreground">Expected & Projected</span>
        </div>

        {projections.length > 0 ? (
          <div className="divide-y divide-border/30">
            {projections.map((p) => {
              const formattedDate = (() => {
                try {
                  const [y, m] = p.month.split('-').map(Number)
                  return format(new Date(y, m - 1, 1), 'MMMM yyyy')
                } catch {
                  return p.month
                }
              })()
              const isPositive = p.net >= 0

              return (
                <div
                  key={p.month}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors gap-3"
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">{formattedDate}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                      <span>In: <strong className="text-emerald-600">₹{p.cashIn.toLocaleString('en-IN')}</strong></span>
                      <span>•</span>
                      <span>Out: <strong className="text-rose-500">₹{p.cashOut.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Projected Retained
                    </span>
                    <span className={`text-base font-bold ${isPositive ? 'text-foreground' : 'text-rose-500'}`}>
                      ₹{p.net.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No recurring streams or obligations configured to project from yet.
          </div>
        )}
      </div>
    </div>
  )
}
