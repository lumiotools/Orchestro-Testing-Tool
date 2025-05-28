"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    date: "Jan 1",
    "Eligible accounts": 67,
    "Incentive base discounts": 62,
    Tier: 58,
    Minimums: 45,
    "Service adjustments": 72,
    Accessorials: 80,
    ePLD: 65,
  },
  {
    date: "Feb 1",
    "Eligible accounts": 70,
    "Incentive base discounts": 65,
    Tier: 60,
    Minimums: 50,
    "Service adjustments": 75,
    Accessorials: 82,
    ePLD: 68,
  },
  {
    date: "Mar 1",
    "Eligible accounts": 75,
    "Incentive base discounts": 68,
    Tier: 65,
    Minimums: 55,
    "Service adjustments": 78,
    Accessorials: 85,
    ePLD: 72,
  },
  {
    date: "Apr 1",
    "Eligible accounts": 80,
    "Incentive base discounts": 72,
    Tier: 70,
    Minimums: 60,
    "Service adjustments": 82,
    Accessorials: 88,
    ePLD: 75,
  },
  {
    date: "May 1",
    "Eligible accounts": 85,
    "Incentive base discounts": 75,
    Tier: 75,
    Minimums: 65,
    "Service adjustments": 85,
    Accessorials: 90,
    ePLD: 78,
  },
  {
    date: "Jun 1",
    "Eligible accounts": 90,
    "Incentive base discounts": 78,
    Tier: 80,
    Minimums: 70,
    "Service adjustments": 88,
    Accessorials: 92,
    ePLD: 82,
  },
  {
    date: "Jul 1",
    "Eligible accounts": 92,
    "Incentive base discounts": 82,
    Tier: 85,
    Minimums: 75,
    "Service adjustments": 90,
    Accessorials: 94,
    ePLD: 85,
  },
]

export function OverviewChart() {
  return (
    <ChartContainer
      config={{
        eligibleAccounts: {
          label: "Eligible accounts",
          color: "hsl(var(--chart-1))",
        },
        incentiveDiscounts: {
          label: "Incentive base discounts",
          color: "hsl(var(--chart-2))",
        },
        tier: {
          label: "Tier",
          color: "hsl(var(--chart-3))",
        },
        minimums: {
          label: "Minimums",
          color: "hsl(var(--chart-4))",
        },
        serviceAdjustments: {
          label: "Service adjustments",
          color: "hsl(var(--chart-5))",
        },
        accessorials: {
          label: "Accessorials",
          color: "hsl(var(--chart-6))",
        },
        epld: {
          label: "ePLD",
          color: "hsl(var(--chart-7))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Line
            type="monotone"
            dataKey="Eligible accounts"
            stroke="var(--color-eligibleAccounts)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Incentive base discounts"
            stroke="var(--color-incentiveDiscounts)"
            strokeWidth={2}
            dot={false}
          />
          <Line type="monotone" dataKey="Tier" stroke="var(--color-tier)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Minimums" stroke="var(--color-minimums)" strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="Service adjustments"
            stroke="var(--color-serviceAdjustments)"
            strokeWidth={2}
            dot={false}
          />
          <Line type="monotone" dataKey="Accessorials" stroke="var(--color-accessorials)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ePLD" stroke="var(--color-epld)" strokeWidth={2} dot={false} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  return value
                }}
              />
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
