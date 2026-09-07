'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CashFlowChartProps {
  data: {
    month: string
    cashIn: number
    cashOut: number
    net: number
  }[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Your net cash flow over the selected period.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
            <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']} />
            <Legend iconType="circle" />
            <Bar dataKey="cashIn" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="cashOut" name="Cash Out" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="net" name="Net" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
