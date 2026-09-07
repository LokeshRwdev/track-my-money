import { getTransactions } from '@/app/actions/transaction'
import { Badge } from '@/components/ui/badge'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Receipt } from 'lucide-react'

export const metadata = {
  title: 'Transactions | Track My Money',
  description: 'Transaction history and unified ledger',
}

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Transactions
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Unified ledger connecting income records and fixed commitment payments.
        </p>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Ledger Activity</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {transactions.length} Records
          </Badge>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-border/30">
            {transactions.map((tx) => {
              const isIncome = tx.transaction_type === 'INCOME'
              const isExpense = tx.transaction_type === 'EXPENSE'
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : isExpense ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {tx.description || tx.category || 'Transaction'}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {tx.transaction_date}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base font-bold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                      }`}
                    >
                      {isIncome ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      {tx.transaction_type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No transactions logged yet. Transactions automatically track when income and obligations are recorded.
          </div>
        )}
      </div>
    </div>
  )
}
