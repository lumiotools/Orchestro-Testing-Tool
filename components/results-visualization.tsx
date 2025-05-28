"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Target } from "lucide-react"

const categoryComparisonData = [
  { category: "ePLD", accuracy: 94.3, improvement: 7.1 },
  { category: "Tier", accuracy: 92.1, improvement: 4.2 },
  { category: "Eligible accounts", accuracy: 89.2, improvement: 5.8 },
  { category: "Accessorials", accuracy: 87.6, improvement: 3.2 },
  { category: "Minimums", accuracy: 81.5, improvement: 6.9 },
  { category: "Incentive base discounts", accuracy: 76.8, improvement: 4.6 },
  { category: "Service adjustments", accuracy: 73.2, improvement: 10.1 },
]

const accuracyTrendData = [
  { date: "Jan 1", "EligibleAccounts-v1": 67, "EligibleAccounts-v2": 0, "EligibleAccounts-v3": 0 },
  { date: "Feb 1", "EligibleAccounts-v1": 70, "EligibleAccounts-v2": 0, "EligibleAccounts-v3": 0 },
  { date: "Mar 1", "EligibleAccounts-v1": 75, "EligibleAccounts-v2": 72, "EligibleAccounts-v3": 0 },
  { date: "Apr 1", "EligibleAccounts-v1": 80, "EligibleAccounts-v2": 78, "EligibleAccounts-v3": 0 },
  { date: "May 1", "EligibleAccounts-v1": 85, "EligibleAccounts-v2": 85, "EligibleAccounts-v3": 88 },
  { date: "Jun 1", "EligibleAccounts-v1": 85, "EligibleAccounts-v2": 88, "EligibleAccounts-v3": 89 },
]

export function ResultsVisualization() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">87.2%</div>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
              </div>
              <div className="flex items-center text-emerald-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+5.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">24</div>
                <p className="text-sm text-muted-foreground">Active Prompts</p>
              </div>
              <div className="flex items-center text-blue-500">
                <Target className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">7 Categories</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-sm text-muted-foreground">Tests Run</p>
              </div>
              <div className="flex items-center text-amber-500">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+18%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Accuracy Trends */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Accuracy Trends</CardTitle>
                <CardDescription>Prompt performance over time</CardDescription>
              </div>
              <Select defaultValue="eligible">
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eligible">Eligible accounts</SelectItem>
                  <SelectItem value="incentive">Incentive discounts</SelectItem>
                  <SelectItem value="tier">Tier</SelectItem>
                  <SelectItem value="minimums">Minimums</SelectItem>
                  <SelectItem value="service">Service adjustments</SelectItem>
                  <SelectItem value="accessorials">Accessorials</SelectItem>
                  <SelectItem value="epld">ePLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <ChartContainer
              config={{
                "eligible-v1": { label: "EligibleAccounts-v1", color: "hsl(var(--chart-1))" },
                "eligible-v2": { label: "EligibleAccounts-v2", color: "hsl(var(--chart-2))" },
                "eligible-v3": { label: "EligibleAccounts-v3", color: "hsl(var(--chart-3))" },
              }}
              className="h-[350px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis domain={[60, 100]} tickFormatter={(value) => `${value}%`} />
                  <Line
                    type="monotone"
                    dataKey="EligibleAccounts-v1"
                    stroke="var(--color-eligible-v1)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="EligibleAccounts-v2"
                    stroke="var(--color-eligible-v2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="EligibleAccounts-v3"
                    stroke="var(--color-eligible-v3)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Category Performance</CardTitle>
            <CardDescription>Current accuracy by extraction category</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-4 h-[350px] overflow-y-auto pr-2">
              {categoryComparisonData.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          category.accuracy >= 90 ? "default" : category.accuracy >= 80 ? "secondary" : "destructive"
                        }
                        className={
                          category.accuracy >= 90 ? "bg-emerald-500" : category.accuracy >= 80 ? "bg-amber-500" : ""
                        }
                      >
                        {category.accuracy}%
                      </Badge>
                      <div className="flex items-center text-emerald-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">+{category.improvement}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          category.accuracy >= 90
                            ? "bg-emerald-500"
                            : category.accuracy >= 80
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${category.accuracy}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white mix-blend-difference">{category.accuracy}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Breakdown</CardTitle>
          <CardDescription>Detailed accuracy metrics for each category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryComparisonData.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <span className="font-medium min-w-[120px]">{category.category}</span>
                  <Badge
                    variant={
                      category.accuracy >= 90 ? "default" : category.accuracy >= 80 ? "secondary" : "destructive"
                    }
                    className={
                      category.accuracy >= 90 ? "bg-emerald-500" : category.accuracy >= 80 ? "bg-amber-500" : ""
                    }
                  >
                    {category.accuracy}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-emerald-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+{category.improvement}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">vs baseline</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
