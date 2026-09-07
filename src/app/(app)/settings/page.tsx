'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Sliders } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Personalize your preferences and journal configuration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs">Full Name</Label>
            <Input id="name" placeholder="John Doe" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" disabled className="rounded-xl opacity-60" />
            <p className="text-[11px] text-muted-foreground">Managed via authentication provider.</p>
          </div>
          <Button size="sm" className="rounded-full px-5">Save Profile</Button>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <Sliders className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Preferences</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs">Default Currency</Label>
            <select 
              id="currency" 
              defaultValue="INR"
              className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>
          <Button size="sm" variant="outline" className="rounded-full px-5">Update Preferences</Button>
        </div>
      </div>
    </div>
  )
}
