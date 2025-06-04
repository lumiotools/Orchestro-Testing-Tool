"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Play, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { compareJsonFiles } from "@/lib/compare-json"
import { 
  loadGroundTruthContract, 
  getAvailableContracts, 
  validateGroundTruthContract,
  type GroundTruthContract,
  type ContractOption 
} from "@/lib/ground-truth-loader"

interface PromptResult {
  prompt: string
  accuracy: number
  correctExtractions: number
  incorrectExtractions: number
  categoryBreakdown: Record<string, {
    similarityScore: number
    totalRows: number
    missingRows: number
    extraRows: number
  }>
}

interface ExtractedDataSet {
  name: string
  data: any[]
}

interface TableComparisonResult {
  category: string
  similarityScore: number
  totalRows: number
  missingRows: number
  extraRows: number
  details: any
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'eligible_accounts': 'Eligible Accounts',
  'incentive_base_discount': 'Incentive Base Discounts',
  'tier_discount': 'Tier Discounts',
  'grace_earn_discount': 'Grace Earn Discounts',
  'minimum_adjustment': 'Minimum Adjustments',
  'service_adjustment': 'Service Adjustments',
  'accessorials': 'Accessorials',
  'electronic_pld': 'Electronic PLD'
}

const TABLE_CATEGORIES = [
  'eligible_accounts',
  'incentive_base_discount', 
  'tier_discount',
  'grace_earn_discount',
  'minimum_adjustment',
  'service_adjustment',
  'accessorials',
  'electronic_pld'
]

export function AccuracyComparison() {
  const [category, setCategory] = useState("all")
  const [selectedContract, setSelectedContract] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<PromptResult[]>([])
  const [groundTruthData, setGroundTruthData] = useState<GroundTruthContract | null>(null)
  
  // Data management
  const [extractedDataSets, setExtractedDataSets] = useState<ExtractedDataSet[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])
  
  // Get available contracts
  const availableContracts = getAvailableContracts()

  const handleFileUpload = async (file: File, promptName: string) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const extractedData = Array.isArray(data) ? data : [data]
      setExtractedDataSets(prev => {
        const existing = prev.find(p => p.name === promptName)
        if (existing) {
          existing.data = extractedData
          return [...prev]
        } else {
          return [...prev, { name: promptName, data: extractedData }]
        }
      })
      
      // Auto-select the prompt
      setSelectedPrompts(prev => 
        prev.includes(promptName) ? prev : [...prev, promptName]
      )
    } catch (error) {
      console.error(`Error parsing extracted file:`, error)
      alert(`Error parsing extracted file. Please check the JSON format.`)
    }
  }

  const handlePromptToggle = (promptName: string, checked: boolean) => {
    if (checked) {
      setSelectedPrompts(prev => [...prev, promptName])
    } else {
      setSelectedPrompts(prev => prev.filter(p => p !== promptName))
    }
  }

  const compareTableCategory = async (
    groundTruthTable: any,
    extractedTable: any,
    categoryName: string
  ): Promise<TableComparisonResult> => {
    try {
      // Create a mock structure for the comparison function
      const mockGroundTruth = {
        tables: {
          [categoryName]: groundTruthTable
        }
      }
      
      const mockExtracted = {
        tables: {
          [categoryName]: extractedTable
        }
      }

      const comparisonResult = await compareJsonFiles(
        mockGroundTruth,
        mockExtracted,
        () => {}
      )

      const categoryResult = comparisonResult.tableCategories?.[categoryName]
      
      return {
        category: categoryName,
        similarityScore: categoryResult?.similarityScore || 0,
        totalRows: categoryResult?.expectedRows || 0,
        missingRows: categoryResult?.missingRows || 0,
        extraRows: categoryResult?.extraRows || 0,
        details: categoryResult
      }
    } catch (error) {
      console.error(`Error comparing ${categoryName}:`, error)
      return {
        category: categoryName,
        similarityScore: 0,
        totalRows: 0,
        missingRows: 0,
        extraRows: 0,
        details: null
      }
    }
  }

  // Load ground truth data when contract is selected
  const handleContractChange = async (contractId: string) => {
    setSelectedContract(contractId)
    if (contractId) {
      try {
        const contractData = await loadGroundTruthContract(contractId)
        if (contractData && validateGroundTruthContract(contractData)) {
          setGroundTruthData(contractData)
        } else {
          console.error("Invalid ground truth contract data")
          setGroundTruthData(null)
        }
      } catch (error) {
        console.error("Error loading ground truth contract:", error)
        setGroundTruthData(null)
      }
    } else {
      setGroundTruthData(null)
    }
  }

  const runTableWiseComparison = async (): Promise<PromptResult[]> => {
    if (!selectedContract || !groundTruthData || extractedDataSets.length === 0 || selectedPrompts.length === 0) {
      throw new Error("Please select a contract and at least one extracted dataset")
    }

    const results: PromptResult[] = []
    
    for (let promptIndex = 0; promptIndex < selectedPrompts.length; promptIndex++) {
      const promptName = selectedPrompts[promptIndex]
      const extractedDataSet = extractedDataSets.find(p => p.name === promptName)
      
      if (!extractedDataSet) continue

      setProgress((promptIndex / selectedPrompts.length) * 80)

      // Get the first extracted contract (assuming single contract comparison)
      const extractedContract = extractedDataSet.data[0]
      if (!extractedContract) continue

      const categoryBreakdown: Record<string, {
        similarityScore: number
        totalRows: number
        missingRows: number
        extraRows: number
      }> = {}

      let totalSimilarity = 0
      let totalCategories = 0
      let correctCategories = 0

      // Determine which categories to compare
      const categoriesToCompare = category === "all" 
        ? TABLE_CATEGORIES 
        : [category]

      for (const categoryName of categoriesToCompare) {
        const groundTruthTable = groundTruthData.tables[categoryName as keyof typeof groundTruthData.tables]
        const extractedTable = extractedContract.tables?.[categoryName] || extractedContract[categoryName]

        if (!groundTruthTable && !extractedTable) {
          continue // Skip if neither has this category
        }

        const comparisonResult = await compareTableCategory(
          groundTruthTable,
          extractedTable,
          categoryName
        )

        categoryBreakdown[categoryName] = {
          similarityScore: comparisonResult.similarityScore,
          totalRows: comparisonResult.totalRows,
          missingRows: comparisonResult.missingRows,
          extraRows: comparisonResult.extraRows
        }

        totalSimilarity += comparisonResult.similarityScore
        totalCategories++

        if (comparisonResult.similarityScore >= 80) {
          correctCategories++
        }
      }

      const overallAccuracy = totalCategories > 0 ? totalSimilarity / totalCategories : 0

      results.push({
        prompt: promptName,
        accuracy: overallAccuracy,
        correctExtractions: correctCategories,
        incorrectExtractions: totalCategories - correctCategories,
        categoryBreakdown
      })
    }

    return results
  }

  const handleRunComparison = async () => {
    setIsRunning(true)
    setProgress(0)
    setShowResults(false)

    try {
      if (selectedContract && extractedDataSets.length > 0 && selectedPrompts.length > 0) {
        // Run real table-wise comparison
        const comparisonResults = await runTableWiseComparison()
        setResults(comparisonResults)
      } else {
        // Simulate for demo
        await new Promise(resolve => setTimeout(resolve, 2000))
        setResults([
          {
            prompt: "EligibleAccounts-v1",
            accuracy: 85.2,
            correctExtractions: 6,
            incorrectExtractions: 2,
            categoryBreakdown: {
              'eligible_accounts': { similarityScore: 87.1, totalRows: 2, missingRows: 0, extraRows: 0 },
              'incentive_base_discount': { similarityScore: 83.3, totalRows: 2, missingRows: 1, extraRows: 0 }
            }
          },
          {
            prompt: "EligibleAccounts-v2",
            accuracy: 88.7,
            correctExtractions: 7,
            incorrectExtractions: 1,
            categoryBreakdown: {
              'eligible_accounts': { similarityScore: 90.5, totalRows: 2, missingRows: 0, extraRows: 0 },
              'incentive_base_discount': { similarityScore: 86.9, totalRows: 2, missingRows: 0, extraRows: 1 }
            }
          },
        ])
      }
      
      setProgress(100)
      setShowResults(true)
    } catch (error) {
      console.error("Comparison error:", error)
      alert(error instanceof Error ? error.message : "An error occurred during comparison")
    } finally {
      setIsRunning(false)
    }
  }

  const chartData = results.map((item) => ({
    name: item.prompt,
    accuracy: item.accuracy,
  }))

  const bestPrompt = results.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  , results[0] || { prompt: "N/A", accuracy: 0 })

  return (
    <div className="space-y-6">
      {/* Contract Selection */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ground Truth Contract</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Contract</label>
            <Select value={selectedContract} onValueChange={handleContractChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contract for ground truth comparison" />
              </SelectTrigger>
              <SelectContent>
                {availableContracts.map((contract: ContractOption) => (
                  <SelectItem key={contract.value} value={contract.value}>
                    {contract.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContract && groundTruthData && (
              <Badge className="bg-emerald-500/20 text-emerald-400">
                {groundTruthData.basic_details.carrier} - {groundTruthData.basic_details.shipper} loaded
              </Badge>
            )}
            {selectedContract && !groundTruthData && (
              <Badge className="bg-amber-500/20 text-amber-400">
                Loading ground truth data...
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="eligible_accounts">Eligible accounts</SelectItem>
              <SelectItem value="incentive_base_discount">Incentive base discounts</SelectItem>
              <SelectItem value="tier_discount">Tier discounts</SelectItem>
              <SelectItem value="minimum_adjustment">Minimum adjustments</SelectItem>
              <SelectItem value="service_adjustment">Service adjustments</SelectItem>
              <SelectItem value="accessorials">Accessorials</SelectItem>
              <SelectItem value="electronic_pld">Electronic PLD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Extracted Data to Compare</label>
          <div className="border rounded-md p-3 space-y-3">
            {extractedDataSets.length === 0 ? (
              <div className="text-gray-500 text-sm">No extracted datasets uploaded yet</div>
            ) : (
              extractedDataSets.map((dataSet) => (
                <div key={dataSet.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={dataSet.name}
                    checked={selectedPrompts.includes(dataSet.name)}
                    onCheckedChange={(checked) => handlePromptToggle(dataSet.name, checked as boolean)}
                  />
                  <Label htmlFor={dataSet.name}>{dataSet.name}</Label>
                  <Badge variant="outline" className="ml-auto">
                    {dataSet.data.length} contracts
                  </Badge>
                </div>
              ))
            )}
            
            {/* Upload new extracted datasets */}
            <div className="border-t pt-3">
              <div className="grid grid-cols-3 gap-2">
                {['Prompt-v1', 'Prompt-v2', 'Prompt-v3'].map((promptName) => (
                  <div key={promptName} className="text-center">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, promptName)
                      }}
                      className="hidden"
                      id={`upload-${promptName}`}
                    />
                    <label
                      htmlFor={`upload-${promptName}`}
                      className="block px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors"
                    >
                      Upload {promptName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleRunComparison} 
        disabled={isRunning || !selectedContract || selectedPrompts.length === 0} 
        className="w-full"
      >
        <Play className="mr-2 h-4 w-4" />
        {isRunning ? "Running Table-wise Comparison..." : "Compare Extracted Data"}
      </Button>

      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {selectedContract && extractedDataSets.length > 0 
                ? `Comparing tables for ${selectedContract}...` 
                : "Running simulated comparison..."}
            </span>
            <span className="text-emerald-400">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {showResults && results.length > 0 && (
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
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltipContent labelFormatter={(value) => `Prompt: ${value}`} />} />
                  <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="rounded-md border">
            <div className="p-4 font-medium">Table-wise Comparison Results</div>
            <div className="divide-y">
              {results.map((item, index) => (
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
                    {item.accuracy.toFixed(1)}%
                  </Badge>
                  <span className="ml-4 text-sm text-emerald-500">{item.correctExtractions} correct tables</span>
                  <span className="ml-4 text-sm text-destructive">{item.incorrectExtractions} incorrect tables</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category-wise breakdown */}
          {results.length > 0 && Object.keys(results[0].categoryBreakdown).length > 0 && (
            <div className="rounded-md border">
              <div className="p-4 font-medium">
                {category === "all" ? "All Categories Performance" : `${CATEGORY_DISPLAY_NAMES[category]} Performance`}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Category</th>
                      {results.map(result => (
                        <th key={result.prompt} className="text-center p-4">{result.prompt}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(results[0].categoryBreakdown).map(categoryName => (
                      <tr key={categoryName} className="border-b">
                        <td className="p-4 font-medium">
                          {CATEGORY_DISPLAY_NAMES[categoryName] || categoryName.replace(/_/g, ' ')}
                        </td>
                        {results.map(result => {
                          const categoryData = result.categoryBreakdown[categoryName]
                          return (
                            <td key={`${result.prompt}-${categoryName}`} className="p-4 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  categoryData.similarityScore >= 90
                                    ? "border-emerald-500 text-emerald-500"
                                    : categoryData.similarityScore >= 80
                                      ? "border-blue-500 text-blue-500"
                                      : categoryData.similarityScore >= 70
                                        ? "border-amber-500 text-amber-500"
                                        : "border-red-500 text-red-500"
                                }
                              >
                                {categoryData.similarityScore.toFixed(1)}%
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {categoryData.totalRows} rows
                                {categoryData.missingRows > 0 && (
                                  <span className="text-red-500"> -{categoryData.missingRows}</span>
                                )}
                                {categoryData.extraRows > 0 && (
                                  <span className="text-blue-500"> +{categoryData.extraRows}</span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="text-lg font-medium">Best Performing Extraction</div>
            <div className="text-2xl font-bold text-emerald-500 mt-1">
              {bestPrompt.prompt} ({bestPrompt.accuracy.toFixed(1)}%)
            </div>
            {results.length > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                This extraction outperforms others by{' '}
                {(bestPrompt.accuracy - results.filter(r => r !== bestPrompt).reduce((min, r) => Math.min(min, r.accuracy), 100)).toFixed(1)}%{' '}
                on average
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}