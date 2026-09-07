import { getAccounts } from '@/app/actions/account'
import { Badge } from '@/components/ui/badge'
import { Wallet, Building, CreditCard } from 'lucide-react'

export const metadata = {
  title: 'Accounts | Track My Money',
  description: 'Manage personal bank accounts, cards, and wallets',
}

export default async function AccountsPage() {
  const accounts = await getAccounts()

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'BANK':
        return <Building className="h-4 w-4 text-primary" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4 text-rose-500" />
      default:
        return <Wallet className="h-4 w-4 text-emerald-500" />
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Accounts
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Your financial institutions, banks, and payment accounts.
        </p>
      </div>

      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl shadow-xs transition-all hover:border-border"
            >
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                    {getAccountIcon(acc.account_type)}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {acc.account_type}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-foreground">{acc.name}</h3>
                <p className="text-xs text-muted-foreground">{acc.institution || 'Primary Account'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/30">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Current Balance
                </span>
                <span className="text-xl font-extrabold text-foreground tracking-tight">
                  ₹{Number(acc.current_balance).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No accounts configured</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Accounts help you track where money flows in and out.
          </p>
        </div>
      )}
    </div>
  )
}
