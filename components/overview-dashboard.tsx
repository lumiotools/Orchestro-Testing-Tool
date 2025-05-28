"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Clock, Target, FileText, AlertTriangle, TrendingUp, Eye } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Document type specific data
const documentTypeData = {
  contracts: {
    avgExtractionTime: "2.3s",
    avgTotalAccuracy: "84.7%",
    totalDocumentsTested: 1247,
    failedTests: 89,
    categories: [
      {
        id: "eligible-accounts",
        name: "Eligible accounts",
        accuracy: 89.2,
        status: "good",
        totalTests: 156,
        bestPrompt: "EligibleAccounts-v4",
      },
      {
        id: "incentive-discounts",
        name: "Incentive base discounts",
        accuracy: 76.8,
        status: "needs-improvement",
        totalTests: 142,
        bestPrompt: "IncentiveDiscounts-v2",
      },
      { id: "tier", name: "Tier", accuracy: 92.1, status: "excellent", totalTests: 178, bestPrompt: "Tier-v3" },
      { id: "minimums", name: "Minimums", accuracy: 81.5, status: "good", totalTests: 134, bestPrompt: "Minimums-v5" },
      {
        id: "service-adjustments",
        name: "Service adjustments",
        accuracy: 73.2,
        status: "needs-improvement",
        totalTests: 167,
        bestPrompt: "ServiceAdjustments-v1",
      },
      {
        id: "accessorials",
        name: "Accessorials",
        accuracy: 87.6,
        status: "good",
        totalTests: 189,
        bestPrompt: "Accessorials-v3",
      },
      { id: "epld", name: "ePLD", accuracy: 94.3, status: "excellent", totalTests: 145, bestPrompt: "ePLD-v2" },
    ],
  },
  invoices: {
    avgExtractionTime: "1.8s",
    avgTotalAccuracy: "91.3%",
    totalDocumentsTested: 856,
    failedTests: 42,
    categories: [
      {
        id: "invoice-details",
        name: "Invoice details",
        accuracy: 95.2,
        status: "excellent",
        totalTests: 124,
        bestPrompt: "InvoiceDetails-v3",
      },
      {
        id: "line-items",
        name: "Line items",
        accuracy: 89.7,
        status: "good",
        totalTests: 118,
        bestPrompt: "LineItems-v2",
      },
      {
        id: "tax-information",
        name: "Tax information",
        accuracy: 93.1,
        status: "excellent",
        totalTests: 102,
        bestPrompt: "TaxInfo-v4",
      },
      {
        id: "payment-terms",
        name: "Payment terms",
        accuracy: 87.4,
        status: "good",
        totalTests: 95,
        bestPrompt: "PaymentTerms-v2",
      },
      {
        id: "vendor-information",
        name: "Vendor information",
        accuracy: 91.8,
        status: "excellent",
        totalTests: 108,
        bestPrompt: "VendorInfo-v3",
      },
      {
        id: "billing-address",
        name: "Billing address",
        accuracy: 88.9,
        status: "good",
        totalTests: 89,
        bestPrompt: "BillingAddress-v1",
      },
      {
        id: "due-dates",
        name: "Due dates",
        accuracy: 96.5,
        status: "excellent",
        totalTests: 76,
        bestPrompt: "DueDates-v2",
      },
    ],
  },
  "service-guides": {
    avgExtractionTime: "3.1s",
    avgTotalAccuracy: "86.9%",
    totalDocumentsTested: 423,
    failedTests: 28,
    categories: [
      {
        id: "installation-steps",
        name: "Installation steps",
        accuracy: 88.4,
        status: "good",
        totalTests: 67,
        bestPrompt: "InstallSteps-v2",
      },
      {
        id: "troubleshooting",
        name: "Troubleshooting",
        accuracy: 82.7,
        status: "good",
        totalTests: 59,
        bestPrompt: "Troubleshooting-v3",
      },
      {
        id: "specifications",
        name: "Specifications",
        accuracy: 91.2,
        status: "excellent",
        totalTests: 73,
        bestPrompt: "Specifications-v1",
      },
      {
        id: "safety-requirements",
        name: "Safety requirements",
        accuracy: 94.8,
        status: "excellent",
        totalTests: 45,
        bestPrompt: "Safety-v2",
      },
      {
        id: "maintenance-procedures",
        name: "Maintenance procedures",
        accuracy: 79.3,
        status: "needs-improvement",
        totalTests: 52,
        bestPrompt: "Maintenance-v1",
      },
      {
        id: "warranty-information",
        name: "Warranty information",
        accuracy: 87.6,
        status: "good",
        totalTests: 38,
        bestPrompt: "Warranty-v2",
      },
      {
        id: "contact-details",
        name: "Contact details",
        accuracy: 93.7,
        status: "excellent",
        totalTests: 41,
        bestPrompt: "ContactDetails-v1",
      },
    ],
  },
  compliance: {
    avgExtractionTime: "2.7s",
    avgTotalAccuracy: "89.1%",
    totalDocumentsTested: 312,
    failedTests: 19,
    categories: [
      {
        id: "regulatory-requirements",
        name: "Regulatory requirements",
        accuracy: 91.5,
        status: "excellent",
        totalTests: 48,
        bestPrompt: "RegulatoryReq-v2",
      },
      {
        id: "compliance-standards",
        name: "Compliance standards",
        accuracy: 88.9,
        status: "good",
        totalTests: 52,
        bestPrompt: "ComplianceStd-v1",
      },
      {
        id: "audit-findings",
        name: "Audit findings",
        accuracy: 85.3,
        status: "good",
        totalTests: 43,
        bestPrompt: "AuditFindings-v3",
      },
      {
        id: "risk-assessments",
        name: "Risk assessments",
        accuracy: 87.7,
        status: "good",
        totalTests: 39,
        bestPrompt: "RiskAssess-v2",
      },
      {
        id: "certification-details",
        name: "Certification details",
        accuracy: 93.2,
        status: "excellent",
        totalTests: 35,
        bestPrompt: "CertDetails-v1",
      },
      {
        id: "expiration-dates",
        name: "Expiration dates",
        accuracy: 96.1,
        status: "excellent",
        totalTests: 29,
        bestPrompt: "ExpirationDates-v1",
      },
      {
        id: "responsible-parties",
        name: "Responsible parties",
        accuracy: 84.6,
        status: "good",
        totalTests: 31,
        bestPrompt: "ResponsibleParties-v2",
      },
    ],
  },
}

interface OverviewDashboardProps {
  documentType: string
}

export function OverviewDashboard({ documentType }: OverviewDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const data = documentTypeData[documentType as keyof typeof documentTypeData] || documentTypeData.contracts
  const keyMetrics = {
    avgExtractionTime: data.avgExtractionTime,
    avgTotalAccuracy: data.avgTotalAccuracy,
    totalDocumentsTested: data.totalDocumentsTested,
    failedTests: data.failedTests,
  }
  const categoryAccuracy = data.categories

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setDialogOpen(true)
  }

  const selectedCategoryInfo = categoryAccuracy.find((cat) => cat.id === selectedCategory)

  const getStatusBadge = (status: string, accuracy: number) => {
    if (accuracy >= 90) return { variant: "default" as const, className: "bg-emerald-500", text: "Excellent" }
    if (accuracy >= 80) return { variant: "default" as const, className: "bg-blue-500", text: "Good" }
    if (accuracy >= 70) return { variant: "secondary" as const, className: "bg-amber-500", text: "Needs Improvement" }
    return { variant: "destructive" as const, className: "", text: "Poor" }
  }

  const getDocumentTypeLabel = () => {
    const typeMap = {
      contracts: "Contracts",
      invoices: "Invoices",
      "service-guides": "Service Guides",
      compliance: "Compliance Documents",
    }
    return typeMap[documentType as keyof typeof typeMap] || "Documents"
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Key Performance Indicators - {getDocumentTypeLabel()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card border-0 hover:bg-white/5 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{keyMetrics.avgExtractionTime}</div>
                  <p className="text-sm text-gray-400 mt-1">Average time to extraction</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover:bg-white/5 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{keyMetrics.avgTotalAccuracy}</div>
                  <p className="text-sm text-gray-400 mt-1">Average total accuracy</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                  <Target className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover:bg-white/5 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {keyMetrics.totalDocumentsTested.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Total documents tested</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover:bg-white/5 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{keyMetrics.failedTests}</div>
                  <p className="text-sm text-gray-400 mt-1">Number of failed tests</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Level Accuracy */}
      <div>
        <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Category Level Accuracy - {getDocumentTypeLabel()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryAccuracy.map((category) => {
            const statusBadge = getStatusBadge(category.status, category.accuracy)
            return (
              <Card
                key={category.id}
                className="glass-card border-0 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 group"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{category.name}</h4>
                      <Eye className="h-4 w-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-white">{category.accuracy}%</div>
                      <Badge
                        variant="outline"
                        className={`border-0 ${
                          category.accuracy >= 90
                            ? "bg-emerald-500/20 text-emerald-400"
                            : category.accuracy >= 80
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {statusBadge.text}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Tests run:</span>
                        <span className="font-medium text-white">{category.totalTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best prompt:</span>
                        <span className="font-medium text-emerald-400">{category.bestPrompt}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          category.accuracy >= 90
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : category.accuracy >= 80
                              ? "bg-gradient-to-r from-blue-500 to-blue-400"
                              : "bg-gradient-to-r from-amber-500 to-amber-400"
                        }`}
                        style={{ width: `${category.accuracy}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Category Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategoryInfo?.name}
              <Badge
                variant={
                  getStatusBadge(selectedCategoryInfo?.status || "", selectedCategoryInfo?.accuracy || 0).variant
                }
                className={
                  getStatusBadge(selectedCategoryInfo?.status || "", selectedCategoryInfo?.accuracy || 0).className
                }
              >
                {selectedCategoryInfo?.accuracy}%
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Prompt performance analysis for {getDocumentTypeLabel().toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedCategoryInfo && (
            <div className="space-y-6">
              {/* Performance Chart */}
              <div>
                <h4 className="text-lg font-medium mb-4">Prompt Performance Comparison</h4>
                <Card>
                  <CardContent className="pt-6">
                    <ChartContainer
                      config={{
                        accuracy: {
                          label: "Accuracy",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              promptId: `${selectedCategoryInfo.bestPrompt.split("-")[0]}-v1`,
                              accuracy: selectedCategoryInfo.accuracy - 8,
                            },
                            {
                              promptId: `${selectedCategoryInfo.bestPrompt.split("-")[0]}-v2`,
                              accuracy: selectedCategoryInfo.accuracy - 3,
                            },
                            { promptId: selectedCategoryInfo.bestPrompt, accuracy: selectedCategoryInfo.accuracy },
                          ]}
                        >
                          <XAxis
                            dataKey="promptId"
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            domain={[60, 100]}
                            tickFormatter={(value) => `${value}%`}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Best Prompt Details */}
              <div>
                <h4 className="text-lg font-medium mb-4">Best Performing Prompt</h4>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedCategoryInfo.bestPrompt}</CardTitle>
                        <CardDescription>
                          Accuracy: {selectedCategoryInfo.accuracy}% • Category: {selectedCategoryInfo.name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Best Performance
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt-content">Prompt Content</Label>
                      <Textarea
                        id="prompt-content"
                        value={`Extract ${selectedCategoryInfo.name.toLowerCase()} information from the ${getDocumentTypeLabel().toLowerCase().slice(0, -1)}. Focus on accuracy and completeness.

Return JSON format:
{
  "extractedData": "object",
  "confidence": "number",
  "source": "string"
}

Look for relevant terms and patterns specific to ${selectedCategoryInfo.name.toLowerCase()}.`}
                        readOnly
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <div className="font-medium text-lg">{selectedCategoryInfo.accuracy}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Tests Run:</span>
                        <div className="font-medium text-lg">{selectedCategoryInfo.totalTests}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={getStatusBadge(selectedCategoryInfo.status, selectedCategoryInfo.accuracy).variant}
                          className={
                            getStatusBadge(selectedCategoryInfo.status, selectedCategoryInfo.accuracy).className
                          }
                        >
                          {getStatusBadge(selectedCategoryInfo.status, selectedCategoryInfo.accuracy).text}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Duplicate Prompt
                      </Button>
                      <Button variant="outline" size="sm">
                        Test on New Documents
                      </Button>
                      <Button size="sm">Use as Template</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
