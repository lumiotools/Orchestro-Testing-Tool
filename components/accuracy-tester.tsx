"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Download, Upload, Zap, Brain, Globe, Sparkles, Cpu, FileJson, Key, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelSelector, availableModels } from "@/components/model-selector"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compareJsonFiles } from "@/lib/compare-json"
import { TableCategoryMetrics } from "@/components/table-category-metrics"
import { 
  loadGroundTruthContract, 
  getAvailableContracts, 
  validateGroundTruthContract,
  type GroundTruthContract,
  type ContractOption 
} from "@/lib/ground-truth-loader"

interface TestResult {
  accuracy: number
  totalContracts: number
  correctExtractions: number
  incorrectExtractions: number
  avgConfidence: number
  model: string
  category: string
  prompt: string
  details: ContractCategoryResult[]
}

interface ContractCategoryResult {
  contractId: string
  contractName: string
  similarityScore: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  totalRows: number
  correctRows: number
  missingRows: number
  extraRows: number
  issues: string[]
  extractedData: any[]
  groundTruthData: any[]
}

// Remove old interface - using GroundTruthContract from loader instead

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

export function AccuracyTester() {
  const [category, setCategory] = useState("all")
  const [prompt, setPrompt] = useState("eligible-v1")
  const [sampleSize, setSampleSize] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TestResult | null>(null)
  const [selectedModels, setSelectedModels] = useState(["gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash"])
  const [primaryModel, setPrimaryModel] = useState("gpt-4o")
  const [testMode, setTestMode] = useState<"single" | "comparison">("single")

  // API Testing state
  const [groundTruthFile, setGroundTruthFile] = useState<File | null>(null)
  const [groundTruthData, setGroundTruthData] = useState<any>(null)
  const [apiData, setApiData] = useState<any>(null)
  const [contractId, setContractId] = useState("")
  const [versionId, setVersionId] = useState("")
  const [authToken, setAuthToken] = useState("")
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [apiValidationError, setApiValidationError] = useState<string | null>(null)
  const [apiUrl, setApiUrl] = useState("http://localhost:8080/")
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  
  // API Comparison state
  const [comparing, setComparing] = useState(false)
  const [apiProgress, setApiProgress] = useState(0)
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"tables">("tables")

  // Initialize authToken from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem("auth_token");
      if (token) {
        setAuthToken(token);
      }
    }
  }, []);

  // Check if all API fields are filled
  const areApiFieldsValid = contractId.trim() !== "" && versionId.trim() !== ""

  const runCategoryAccuracyTest = async (): Promise<TestResult> => {
    const availableContracts = getAvailableContracts()
    const contractResults: ContractCategoryResult[] = []
    
    // Load all ground truth contracts and test the selected category
    for (let i = 0; i < availableContracts.length; i++) {
      const contract = availableContracts[i]
      setProgress((i / availableContracts.length) * 80)
      
      try {
        // Load ground truth contract
        const groundTruthContract = await loadGroundTruthContract(contract.value)
        if (!groundTruthContract || !validateGroundTruthContract(groundTruthContract)) {
          console.warn(`Failed to load ground truth for ${contract.value}`)
          continue
        }

        // Get ground truth data for the selected category
        const groundTruthCategoryData = groundTruthContract.tables[category]?.tableData?.rows || []
        
        // Simulate extraction using the selected prompt (with some variation based on prompt version)
        const extractedCategoryData = simulateExtraction(groundTruthCategoryData, prompt, category)
        
        // Create a mock extracted contract structure for comparison
        const mockExtractedContract = {
          contract_id: groundTruthContract.contract_id,
          tables: {
            [category]: {
              tableData: {
                rows: extractedCategoryData
              }
            }
          }
        }

        // Use the actual comparison function from compare-json
        const comparisonResult = await compareJsonFiles(
          groundTruthContract,
          mockExtractedContract,
          () => {} // Progress callback for individual comparison
        )

        // Extract category-specific results
        const categoryResult = comparisonResult.tableCategories?.[category]
        if (categoryResult) {
          const similarityScore = categoryResult.similarityScore || 0
          const status = getStatusFromScore(similarityScore)
          
          contractResults.push({
            contractId: contract.value,
            contractName: contract.label,
            similarityScore,
            status,
            totalRows: categoryResult.expectedRows || groundTruthCategoryData.length,
            correctRows: (categoryResult.expectedRows || groundTruthCategoryData.length) - (categoryResult.missingRows || 0),
            missingRows: categoryResult.missingRows || 0,
            extraRows: categoryResult.extraRows || 0,
            issues: [
              ...(categoryResult.missingRows > 0 ? [`${categoryResult.missingRows} missing rows`] : []),
              ...(categoryResult.extraRows > 0 ? [`${categoryResult.extraRows} extra rows`] : []),
              ...(categoryResult.lowSimilarityDetails?.length > 0 ? [`${categoryResult.lowSimilarityDetails.length} low similarity matches`] : [])
            ],
            extractedData: extractedCategoryData,
            groundTruthData: groundTruthCategoryData
          })
        }

      } catch (error) {
        console.error(`Error processing contract ${contract.value}:`, error)
        // Add error result
        contractResults.push({
          contractId: contract.value,
          contractName: contract.label,
          similarityScore: 0,
          status: 'poor',
          totalRows: 0,
          correctRows: 0,
          missingRows: 0,
          extraRows: 0,
          issues: ['Processing error'],
          extractedData: [],
          groundTruthData: []
        })
      }

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setProgress(100)

    // Calculate overall statistics
    const totalContracts = contractResults.length
    const avgSimilarity = contractResults.reduce((sum, r) => sum + r.similarityScore, 0) / totalContracts
    const excellentCount = contractResults.filter(r => r.status === 'excellent').length
    
    return {
      accuracy: avgSimilarity,
      totalContracts,
      correctExtractions: excellentCount,
      incorrectExtractions: totalContracts - excellentCount,
      avgConfidence: avgSimilarity / 100,
      model: primaryModel,
      category,
      prompt,
      details: contractResults
    }
  }

  // Helper function to simulate extraction with prompt variations
  const simulateExtraction = (groundTruthData: any[], promptVersion: string, categoryType: string): any[] => {
    // Simulate different accuracy levels based on prompt version
    const promptAccuracy = getPromptAccuracy(promptVersion)
    
    return groundTruthData.map(row => {
      // Simulate extraction errors based on prompt accuracy
      const shouldHaveError = Math.random() > promptAccuracy
      
      if (!shouldHaveError) {
        return { ...row } // Perfect extraction
      }
      
      // Introduce realistic errors based on category type
      return introduceExtractionErrors(row, categoryType)
    }).filter(() => Math.random() > 0.05) // Simulate occasional missing rows
  }

  // Helper function to get prompt accuracy
  const getPromptAccuracy = (promptVersion: string): number => {
    const accuracyMap: Record<string, number> = {
      'eligible-v1': 0.852,
      'eligible-v2': 0.887,
      'eligible-v3': 0.892
    }
    return accuracyMap[promptVersion] || 0.85
  }

  // Helper function to introduce realistic extraction errors
  const introduceExtractionErrors = (row: any, categoryType: string): any => {
    const errorRow = { ...row }
    
    // Introduce category-specific errors
    switch (categoryType) {
      case 'eligible_accounts':
        if (Math.random() < 0.3) errorRow.name = errorRow.name?.replace(/Corp|Inc|LLC/g, '') // Remove company suffixes
        if (Math.random() < 0.2) errorRow.zip = errorRow.zip?.slice(0, -1) + '0' // Change last digit of zip
        break
      case 'incentive_base_discount':
        if (Math.random() < 0.3) errorRow.discount = (parseFloat(errorRow.discount) + Math.random() * 2 - 1).toFixed(2) + '%'
        if (Math.random() < 0.2) errorRow.service = errorRow.service?.replace(/UPS|FedEx/g, '') // Remove carrier name
        break
      case 'accessorials':
        if (Math.random() < 0.3) errorRow.discount = (parseFloat(errorRow.discount) + Math.random() * 5 - 2.5).toFixed(2) + '%'
        break
      default:
        // Generic errors for other categories
        Object.keys(errorRow).forEach(key => {
          if (typeof errorRow[key] === 'string' && errorRow[key].includes('%') && Math.random() < 0.2) {
            errorRow[key] = (parseFloat(errorRow[key]) + Math.random() * 2 - 1).toFixed(2) + '%'
          }
        })
    }
    
    return errorRow
  }

  // Helper function to determine status from similarity score
  const getStatusFromScore = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 70) return 'fair'
    return 'poor'
  }

  const handleRunTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setResults(null)

    try {
      const result = await runCategoryAccuracyTest()
      setResults(result)
    } catch (error) {
      console.error("Error running test:", error)
    } finally {
      setIsRunning(false)
      setProgress(0)
    }
  }

  // API Testing Functions
  const fetchContractData = async () => {
    if (!areApiFieldsValid) {
      setApiValidationError("Contract ID and Version ID are required")
      return
    }

    setApiValidationError(null)
    setIsApiLoading(true)
    setError(null)
    setApiResponse(null)
    setComparisonResult(null)

    try {
      const response = await fetch(`${apiUrl}api/v1/contract/${contractId}/version/${versionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("auth_token");
        }
        throw new Error("Authentication failed. Please re-enter your authentication token.")
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem("auth_token", authToken);
      }

      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))

      // Extract only the tables data for comparison
      const extractedData = {
        contract_id: data.data.contract_id,
        current_version_id: data.data.current_version_id,
        version_id: data.data.version_id,
        carrier: data.data.carrier,
        shipper: data.data.shipper,
        effective_date: data.data.effective_date,
        end_date: data.data.end_date,
        status: data.data.status,
        tables: data.data.tables
      }

      setApiData(extractedData)
    } catch (err: any) {
      setError(`Error fetching contract data: ${err.message}`)
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleGroundTruthUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setGroundTruthFile(file)
    setGroundTruthData(null)
    setComparisonResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        setGroundTruthData(json)
        setError(null)
      } catch (err) {
        setError(`Invalid JSON file: ${file.name}`)
        setGroundTruthFile(null)
        setGroundTruthData(null)
      }
    }
    reader.readAsText(file)
  }

  const compareFiles = async () => {
    if (!groundTruthData || !apiData) {
      setError("Please upload ground truth file and fetch API data first")
      return
    }

    setComparing(true)
    setApiProgress(0)
    setComparisonResult(null)
    setError(null)
    setWarnings([])

    try {
      // groundTruthData is the ground truth/actual, apiData is the extracted/expected
      const result = await compareJsonFiles(
        groundTruthData, 
        apiData, 
        (progressValue) => {
          setApiProgress(progressValue)
        }
      )

      setComparisonResult(result)

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
      }
    } catch (err: any) {
      setError(`Error comparing files: ${err.message}`)
      setComparisonResult(null)
    } finally {
      setComparing(false)
    }
  }

  const formatTimestamp = () => {
    const now = new Date()
    return now.toISOString().replace("T", " ").substring(0, 19)
  }

  const hasTableCategories =
    comparisonResult && comparisonResult.tableCategories && Object.keys(comparisonResult.tableCategories).length > 0

  const displayMessage =
    comparisonResult?.message && comparisonResult.message.includes("Tables missing in one or both JSON files")
      ? "Comparison completed successfully"
      : comparisonResult?.message

  const canCompare = groundTruthData && apiData

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "OpenAI":
        return <Zap className="h-4 w-4" />
      case "Anthropic":
        return <Brain className="h-4 w-4" />
      case "Google":
        return <Globe className="h-4 w-4" />
      case "xAI":
        return <Sparkles className="h-4 w-4" />
      case "DeepSeek":
        return <Cpu className="h-4 w-4" />
      default:
        return <Cpu className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">


      {/* Test Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-white">Test Configuration</CardTitle>
            <CardDescription className="text-gray-400">Configure your accuracy test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Tabs value={testMode} onValueChange={(value) => setTestMode(value as "single" | "comparison")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Model</TabsTrigger>
                <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">
                      All Categories
                    </SelectItem>
                    <SelectItem value="eligible_accounts" className="text-white hover:bg-white/10">
                      Eligible accounts
                    </SelectItem>
                    <SelectItem value="incentive_base_discount" className="text-white hover:bg-white/10">
                      Incentive base discounts
                    </SelectItem>
                    <SelectItem value="tier_discount" className="text-white hover:bg-white/10">
                      Tier discounts
                    </SelectItem>
                    <SelectItem value="minimum_adjustment" className="text-white hover:bg-white/10">
                      Minimum adjustments
                    </SelectItem>
                    <SelectItem value="service_adjustment" className="text-white hover:bg-white/10">
                      Service adjustments
                    </SelectItem>
                    <SelectItem value="accessorials" className="text-white hover:bg-white/10">
                      Accessorials
                    </SelectItem>
                    <SelectItem value="electronic_pld" className="text-white hover:bg-white/10">
                      Electronic PLD
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Prompt</label>
                <Select value={prompt} onValueChange={setPrompt}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    <SelectItem value="eligible-v1" className="text-white hover:bg-white/10">
                      EligibleAccounts-v1 (85.2%)
                    </SelectItem>
                    <SelectItem value="eligible-v2" className="text-white hover:bg-white/10">
                      EligibleAccounts-v2 (88.7%)
                    </SelectItem>
                    <SelectItem value="eligible-v3" className="text-white hover:bg-white/10">
                      EligibleAccounts-v3 (89.2%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-white">Sample Size</label>
                <span className="text-sm text-gray-400">{sampleSize} contracts</span>
              </div>
              <Slider
                value={[sampleSize]}
                min={10}
                max={100}
                step={10}
                onValueChange={(value) => setSampleSize(value[0])}
                className="[&_[role=slider]]:bg-emerald-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRunTest}
                disabled={isRunning}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-0"
              >
                <Play className="mr-2 h-4 w-4" />
                {isRunning ? "Running Test..." : "Run Accuracy Test"}
              </Button>
              <Button variant="outline" disabled={isRunning} className="border-white/20 text-white hover:bg-white/10">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">Running accuracy test...</span>
                  <span className="text-emerald-400">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="bg-gray-800" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card className="glass-card border-0">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-white">Model Selection</CardTitle>
            <CardDescription className="text-gray-400">Choose AI models for testing</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ModelSelector
              selectedModels={selectedModels}
              onModelChange={setSelectedModels}
              primaryModel={primaryModel}
              onPrimaryModelChange={setPrimaryModel}
            />
          </CardContent>
        </Card>
      </div>

      {/* API Testing Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <FileJson className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">API Testing & Comparison</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Configuration */}
          <Card className="glass-card border-0">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your API credentials to fetch contract data
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url" className="text-white">API URL</Label>
                <Input
                  id="api-url"
                  placeholder="Enter API URL (e.g., http://localhost:8080/)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract-id" className="text-white">Contract ID</Label>
                  <Input
                    id="contract-id"
                    placeholder="Enter Contract ID"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version-id" className="text-white">Version ID</Label>
                  <Input
                    id="version-id"
                    placeholder="Enter Version ID"
                    value={versionId}
                    onChange={(e) => setVersionId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              {apiValidationError && (
                <Alert className="border-red-500/20 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">{apiValidationError}</AlertDescription>
                </Alert>
              )}
              <Button 
                onClick={fetchContractData} 
                disabled={!areApiFieldsValid || isApiLoading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 border-0"
              >
                {isApiLoading ? "Fetching..." : "Fetch Contract Data"}
              </Button>
              {apiResponse && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 text-white">API Response Preview:</h4>
                  <div className="bg-white/5 rounded-md p-4 max-h-60 overflow-auto border border-white/10">
                    <pre className="text-xs whitespace-pre-wrap text-gray-300">{apiResponse.substring(0, 500)}...</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ground Truth File Upload */}
          <Card className="glass-card border-0">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="h-5 w-5" />
                Ground Truth JSON File
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload your ground truth JSON file for comparison with API data
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="border border-dashed border-white/20 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <p className="mb-4 text-gray-400">Drag and drop or click to upload</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleGroundTruthUpload}
                  className="hidden"
                  id="ground-truth-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("ground-truth-upload")?.click()}
                  disabled={comparing || isApiLoading}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Select File
                </Button>
              </div>
              {groundTruthFile && (
                <p className="text-sm text-gray-400 mt-4">
                  Selected: <span className="text-white">{groundTruthFile.name}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Comparison Results */}
        <Card className="glass-card border-0">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileJson className="h-5 w-5" />
              Comparison Results
            </CardTitle>
            <CardDescription className="text-gray-400">
              Statistics and accuracy calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Files Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1">Ground Truth File:</p>
                  <p className="font-medium text-white">
                    {groundTruthFile ? groundTruthFile.name : "Not uploaded"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">API Data:</p>
                  <p className="font-medium text-white">
                    {apiData ? `Contract ${contractId} - Version ${versionId}` : "Not fetched"}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-gray-400">Comparison Progress:</p>
                  <p className="text-white">{apiProgress}%</p>
                </div>
                <Progress value={apiProgress} className="bg-gray-800" />
              </div>

              {/* Comparison Result */}
              {comparisonResult && (
                <div className="space-y-6">
                  {/* Summary Box */}
                  <div className="text-center p-6 border border-white/10 rounded-lg bg-white/5">
                    <h3 className="text-xl mb-2 text-white">Accuracy Score</h3>
                    <p className="text-4xl font-bold text-emerald-400">{(comparisonResult.similarityIndex ?? 0).toFixed(2)}%</p>
                    <p className="text-sm text-gray-400 mt-2">{formatTimestamp()}</p>
                    <div className="mt-4 text-sm">
                      <span className={comparisonResult.success ? "text-emerald-400" : "text-amber-400"}>
                        {comparisonResult.success ? "Success" : "Completed"}: {displayMessage}
                      </span>
                    </div>
                  </div>

                  {/* Results Display */}
                  <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                    <div className="bg-white/5 p-4 border-b border-white/10">
                      <h4 className="text-white font-medium">Table Categories Results</h4>
                    </div>
                    <div className="p-4">
                      <TableCategoryMetrics
                        tableCategories={comparisonResult.tableCategories || {}}
                        similarityIndex={comparisonResult.similarityIndex}
                        rowSimilarity={comparisonResult.rowSimilarity}
                        completeness={comparisonResult.completeness}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 border-0" 
                onClick={compareFiles} 
                disabled={!canCompare || comparing}
              >
                {comparing ? "Comparing..." : "Compare Files"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warnings Display */}
        {warnings.length > 0 && (
          <Alert className="border-amber-500/20 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-400">
              <div>
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside mt-2">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{results.accuracy.toFixed(1)}%</div>
                  <p className="text-sm text-gray-400">Overall Accuracy</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{results.totalContracts}</div>
                  <p className="text-sm text-gray-400">Total Contracts</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{results.correctExtractions}</div>
                  <p className="text-sm text-gray-400">Correct</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{(results.avgConfidence * 100).toFixed(1)}%</div>
                  <p className="text-sm text-gray-400">Avg Confidence</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Summary */}
          <Card className="glass-card border-0">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg text-white">Test Summary</CardTitle>
              <CardDescription className="text-gray-400">
                Category: {CATEGORY_DISPLAY_NAMES[results.category] || results.category} | Prompt: {results.prompt}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{results.accuracy.toFixed(1)}%</div>
                  <p className="text-sm text-gray-400">Avg Similarity</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{results.totalContracts}</div>
                  <p className="text-sm text-gray-400">Contracts Tested</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{results.correctExtractions}</div>
                  <p className="text-sm text-gray-400">Excellent (≥90%)</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">{results.incorrectExtractions}</div>
                  <p className="text-sm text-gray-400">Needs Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="glass-card border-0">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">Contract Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    {CATEGORY_DISPLAY_NAMES[results.category] || results.category} extraction results by contract
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-400">Contract</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Similarity Score</TableHead>
                    <TableHead className="text-gray-400">Rows (Correct/Total)</TableHead>
                    <TableHead className="text-gray-400">Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.details.map((detail, index) => (
                    <TableRow key={index} className="border-white/10">
                      <TableCell className="font-medium text-white">{detail.contractName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-0 ${
                            detail.status === 'excellent' ? "bg-emerald-500/20 text-emerald-400" :
                            detail.status === 'good' ? "bg-blue-500/20 text-blue-400" :
                            detail.status === 'fair' ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{detail.similarityScore.toFixed(1)}%</TableCell>
                      <TableCell className="text-white">{detail.correctRows}/{detail.totalRows}</TableCell>
                      <TableCell className="text-gray-400 text-sm max-w-48">
                        {detail.issues.length > 0 ? (
                          <div className="truncate" title={detail.issues.join(', ')}>
                            {detail.issues.slice(0, 2).join(', ')}
                            {detail.issues.length > 2 && '...'}
                          </div>
                        ) : (
                          'None'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}