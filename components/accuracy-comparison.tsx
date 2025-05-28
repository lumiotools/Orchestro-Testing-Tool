"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function AccuracyComparison() {
  const [category, setCategory] = useState("eligible")
  const [isRunning, setIsRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleRunComparison = () => {
    setIsRunning(true)

    // Simulate test running
    setTimeout(() => {
      setIsRunning(false)
      setShowResults(true)
    }, 2000)
  }

  const comparisonData = [
    {
      prompt: "EligibleAccounts-v1",
      accuracy: 85.2,
      correctExtractions: 43,
      incorrectExtractions: 7,
    },
    {
      prompt: "EligibleAccounts-v2",
      accuracy: 88.7,
      correctExtractions: 44,
      incorrectExtractions: 6,
    },
    {
      prompt: "EligibleAccounts-v3",
      accuracy: 89.2,
      correctExtractions: 45,
      incorrectExtractions: 5,
    },
  ]

  const chartData = comparisonData.map((item) => ({
    name: item.prompt,
    accuracy: item.accuracy,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eligible">Eligible accounts</SelectItem>
              <SelectItem value="incentive">Incentive base discounts</SelectItem>
              <SelectItem value="tier">Tier</SelectItem>
              <SelectItem value="minimums">Minimums</SelectItem>
              <SelectItem value="service">Service adjustments</SelectItem>
              <SelectItem value="accessorials">Accessorials</SelectItem>
              <SelectItem value="epld">ePLD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Prompts to Compare</label>
          <div className="flex flex-col space-y-2 border rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="eligible-v1" defaultChecked />
              <Label htmlFor="eligible-v1">EligibleAccounts-v1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="eligible-v2" defaultChecked />
              <Label htmlFor="eligible-v2">EligibleAccounts-v2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="eligible-v3" defaultChecked />
              <Label htmlFor="eligible-v3">EligibleAccounts-v3</Label>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleRunComparison} disabled={isRunning} className="w-full">
        <Play className="mr-2 h-4 w-4" />
        {isRunning ? "Running Comparison..." : "Compare Prompts"}
      </Button>

      {showResults && (
        <div className="space-y-6">
          <div className="h-[300px]">
            <ChartContainer
              config={{
                accuracy: {
                  label: "Accuracy",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltipContent labelFormatter={(value) => `Prompt: ${value}`} />} />
                  <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="rounded-md border">
            <div className="p-4 font-medium">Comparison Results</div>
            <div className="divide-y">
              {comparisonData.map((item, index) => (
                <div key={index} className="flex items-center p-4">
                  <span className="flex-1 font-medium">{item.prompt}</span>
                  <Badge
                    variant="outline"
                    className={
                      item.accuracy >= 90
                        ? "border-emerald-500 text-emerald-500"
                        : item.accuracy >= 85
                          ? "border-amber-500 text-amber-500"
                          : "border-red-500 text-red-500"
                    }
                  >
                    {item.accuracy}%
                  </Badge>
                  <span className="ml-4 text-sm text-emerald-500">{item.correctExtractions} correct</span>
                  <span className="ml-4 text-sm text-destructive">{item.incorrectExtractions} incorrect</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-medium">Best Performing Prompt</div>
            <div className="text-2xl font-bold text-emerald-500 mt-1">EligibleAccounts-v3 (89.2%)</div>
            <p className="text-sm text-muted-foreground mt-1">This prompt outperforms others by 3.6% on average</p>
          </div>
        </div>
      )}
    </div>
  )
}
