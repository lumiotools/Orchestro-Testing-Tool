"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Download, Upload, Zap, Brain, Globe, Sparkles, Cpu, FileJson, Key, AlertCircle, Search, ChevronLeft, X, Loader2, CheckCircle, XCircle, Trash2, Eye, EyeOff, Calendar, Clock, BarChart3, Table as TableIcon, FileText, Timer } from "lucide-react"
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelSelector, availableModels } from "@/components/model-selector"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"

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

// Add interface for test history item with accuracy
interface TestHistoryItem {
  test_id: number
  created_at: string
  status: string
  prompt_count: number
  contract_name: string
  ground_truth_name: string
  test_type: string
  extraction_time?: string | number
  accuracy?: number
  total_similarity?: number
  [key: string]: any
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
  const [category, setCategory] = useState("select")
  const [prompt, setPrompt] = useState<any>(null)
  const [contracts, setContracts] = useState<any>([])
  const [groundTruth, setGroundTruth] = useState<any>([])
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [selectedContractVersion, setSelectedContractVersion] = useState<any>(null)
  const [selectedGroundTruth, setSelectedGroundTruth] = useState<any>(null)
  const [selectedGroundTruthVersion, setSelectedGroundTruthVersion] = useState<any>(null)
  const [selectedPrompts, setSelectedPrompts] = useState<any>({})
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [selectedModels, setSelectedModels] = useState(["gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash"])
  const [primaryModel, setPrimaryModel] = useState("gpt-4o")
  const [testMode, setTestMode] = useState<"single" | "comparison">("single")
  const [loading, setLoading] = useState(false)
  const [isContractLoading, setIsContractLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [contractSearchTerm, setContractSearchTerm] = useState("")
  const [groundTruthSearchTerm, setGroundTruthSearchTerm] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([])
  const [activeTestId, setActiveTestId] = useState<number | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedTestDetails, setSelectedTestDetails] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [loadingTestId, setLoadingTestId] = useState<number | null>(null)
  const [loadingAccuracyForTest, setLoadingAccuracyForTest] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Hardcoded member_ids for now - will be replaced with proper auth later
  const MEMBER_ID_REGULAR = 100695 // For regular contracts
  const MEMBER_ID_GROUND_TRUTH = 100000 // For ground truth contracts

  const handleRunTest = async () => {
    // Validation
    if (Object.keys(selectedPrompts).length === 0) {
      toast({
        title: "No prompts selected",
        description: "Please select at least one prompt to test",
        variant: "destructive",
      })
      return
    }

    if (!selectedGroundTruth) {
      toast({
        title: "No ground truth selected",
        description: "Please select a ground truth for comparison",
        variant: "destructive",
      })
      return
    }

    if (!uploadedFile && !selectedContract) {
      toast({
        title: "No contract selected",
        description: "Please select a contract or upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    
    try {
      const promptIds = Object.values(selectedPrompts).filter(id => id) as string[]
      
      if (uploadedFile) {
        // Use test-upload endpoint when PDF is uploaded
        const formData = new FormData()
        formData.append('file', uploadedFile)
        
        const params = new URLSearchParams({
          prompt_ids: promptIds.join(','),
          contract_name: uploadedFile.name.replace('.pdf', ''),
          ground_truth_id: selectedGroundTruth,
          ground_truth_version_id: selectedGroundTruthVersion?.toString() || '',
          ground_truth_member_id: MEMBER_ID_GROUND_TRUTH.toString(),
          save: 'true'
        })

        const response = await fetch(`${API_BASE_URL}/prompt/prompts/test-upload?${params}`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload test failed: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("🚀 Upload test started:", result)
        
        // Add to test history and start polling
        const testData = addTestToHistory({
          test_id: result.test_id || Date.now(),
          ...result
        })
        
        if (result.test_id) {
          startPolling(result.test_id)
        }
        
        toast({
          title: "Test started successfully",
          description: `Testing with uploaded file: ${uploadedFile.name}`,
          variant: "default",
        })
        
      } else {
        // Use test endpoint when contract is selected from dropdown
        const selectedContractData = contracts.find((contract: any) => contract.contract_id === selectedContract)
        
        const testData = {
          prompt_ids: promptIds,
          contract_id: parseInt(selectedContract),
          contract_name: selectedContractData?.contract_file_name || '',
          ground_truth_id: parseInt(selectedGroundTruth),
          version_id: parseInt(selectedContractVersion),
          ground_truth_version_id: parseInt(selectedGroundTruthVersion),
          contract_member_id: MEMBER_ID_REGULAR,
          ground_truth_member_id: MEMBER_ID_GROUND_TRUTH,
          save: true
        }

        const response = await fetch(`${API_BASE_URL}/prompt/prompts/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testData),
        })

        if (!response.ok) {
          throw new Error(`Test failed: ${response.statusText}`)
        }

        const result = await response.json()
        console.log("🚀 Contract test started:", result)
        
        // Add to test history and start polling
        const historyData = addTestToHistory({
          test_id: result.test_id || Date.now(),
          ...result
        })
        
        if (result.test_id) {
          startPolling(result.test_id)
        }
        
        toast({
          title: "Test started successfully",
          description: `Testing contract: ${selectedContractData?.contract_file_name}`,
          variant: "default",
        })
      }

    } catch (error) {
      console.error("Error running test:", error)
      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/prompt/prompts`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      const data = await response.json()
      const segregatedPrompts = segregatePrompts(data.prompts)
      console.log(segregatedPrompts)
      setPrompt(segregatedPrompts)
      setCategory(Object.keys(segregatedPrompts)[0])
      setSelectedPrompt(segregatedPrompts[Object.keys(segregatedPrompts)[0] as keyof typeof segregatedPrompts][0])
    } catch (error) {
      toast({
        title: "Error fetching prompts",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getContracts = async () => {
    try {
      setIsContractLoading(true)
      
      // Fetch regular contracts (member_id = 1)
      const regularResponse = await fetch(`${API_BASE_URL}/contract/list?member_id=${MEMBER_ID_REGULAR}&timestamp=${new Date().getTime()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      // Fetch ground truth contracts (member_id = 2)
      const groundTruthResponse = await fetch(`${API_BASE_URL}/contract/list?member_id=${MEMBER_ID_GROUND_TRUTH}&timestamp=${new Date().getTime()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!regularResponse.ok || !groundTruthResponse.ok) {
        throw new Error(`HTTP error! Regular: ${regularResponse.status}, Ground Truth: ${groundTruthResponse.status}`)
      }
      
      const regularData = await regularResponse.json()
      const groundTruthData = await groundTruthResponse.json()
      
      // Process regular contracts
      if (regularData.success && regularData.data && regularData.data.contracts) {
        const nonGroundTruthContracts = regularData.data.contracts.filter((contract: any) => 
          contract.status === "Active"
        )
        setContracts(nonGroundTruthContracts)
      } else {
        setContracts([])
      }
      
      // Process ground truth contracts
      if (groundTruthData.success && groundTruthData.data && groundTruthData.data.contracts) {
        const groundTruthContracts = groundTruthData.data.contracts.filter((contract: any) => 
          contract.status === "Completed"
        )
        setGroundTruth(groundTruthContracts)
      } else {
        setGroundTruth([])
      }
      
    } catch (error) {
      console.error("Error fetching contracts:", error)
      toast({
        title: "Error fetching contracts",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
      // Set empty arrays on error
      setContracts([])
      setGroundTruth([])
    } finally {
      setIsContractLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      
      // Store the uploaded file for testing
      setUploadedFile(file)
      
      // Clear any selected contract since we're using uploaded file
      setSelectedContract(null)
      setSelectedContractVersion(null)
      
      toast({
        title: "PDF file ready for testing",
        description: `File: ${file.name} is ready to be tested`,
        variant: "default",
      })

      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error("Error handling file:", error)
      toast({
        title: "File handling failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
  }

  const segregatePrompts = (prompts: any) => {
    const eligiblePrompts = prompts.filter((prompt: any) => prompt.category === "Eligible_accounts")
    const incentivePrompts = prompts.filter((prompt: any) => prompt.category === "Incentive_base_discounts")
    const tierPrompts = prompts.filter((prompt: any) => prompt.category === "Tier")
    const minimumsPrompts = prompts.filter((prompt: any) => prompt.category === "Minimums")
    const servicePrompts = prompts.filter((prompt: any) => prompt.category === "Service_adjustments")
    const accessorialsPrompts = prompts.filter((prompt: any) => prompt.category === "Accessorials")
    const ePLDPrompts = prompts.filter((prompt: any) => prompt.category === "ePLD")
    const dimPrompts = prompts.filter((prompt: any) => prompt.category === "DIM")

    return {
      "Eligible Accounts": eligiblePrompts,
      "Incentive Base Discounts": incentivePrompts,
      "Tier": tierPrompts,
      "Minimums": minimumsPrompts,
      "Service Adjustments": servicePrompts,
      "Accessorials": accessorialsPrompts,
      "ePLD": ePLDPrompts,
      "DIM": dimPrompts,
    }
  }

  // Filter contracts based on search term
  const filterContracts = (contractsList: any[], searchTerm: string) => {
    if (!searchTerm) return contractsList
    
    return contractsList.filter((contract: any) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        contract.contract_file_name?.toLowerCase().includes(searchLower) ||
        contract.carrier?.toLowerCase().includes(searchLower) ||
        contract.contract_id?.toString().includes(searchTerm) ||
        contract.current_version_id?.toString().includes(searchTerm)
      )
    })
  }

  const filteredContracts = filterContracts(contracts, contractSearchTerm)
  const filteredGroundTruth = filterContracts(groundTruth, groundTruthSearchTerm)

  // Poll test status for active tests
  const pollTestStatus = async (testId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/test/${testId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get test status: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update test history
      setTestHistory(prev => prev.map(test => 
        test.test_id === testId ? { ...test, ...result.data } : test
      ))

      // If test is completed, stop polling
      if (result.data?.status === 'completed' || result.data?.status === 'failed') {
        setActiveTestId(null)
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
        
        toast({
          title: result.data?.status === 'completed' ? "Test completed!" : "Test failed",
          description: `Test ID: ${testId} has ${result.data?.status}`,
          variant: result.data?.status === 'completed' ? "default" : "destructive",
        })
        
        return true // Indicate test is finished
      }

      return false // Test still running
    } catch (error) {
      console.error("Error polling test status:", error)
      return false
    }
  }

  // Start polling for a test
  const startPolling = (testId: number) => {
    setActiveTestId(testId)
    
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    // Start new interval
    const interval = setInterval(async () => {
      const isFinished = await pollTestStatus(testId)
      if (isFinished) {
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds
    
    setPollingInterval(interval)
  }

  // Get test history from backend
  const getTestHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/test-history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.tests) {
          // Merge with local history, avoiding duplicates
          setTestHistory(prev => {
            const serverTests = result.tests || []
            const existingIds = new Set(prev.map(test => test.test_id))
            const newTests = serverTests.filter((test: any) => !existingIds.has(test.test_id))
            const mergedTests = [...prev, ...newTests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            
            // Fetch accuracy for completed tests that don't have it yet
            mergedTests.forEach(test => {
              if (test.status === 'completed' && !test.total_similarity && !loadingAccuracyForTest.has(test.test_id)) {
                fetchTestAccuracy(test.test_id)
              }
            })
            
            return mergedTests
          })
        }
      }
    } catch (error) {
      console.error("Error fetching test history:", error)
    }
  }

  // Fetch accuracy data for a specific test
  const fetchTestAccuracy = async (testId: number) => {
    if (loadingAccuracyForTest.has(testId)) return
    
    setLoadingAccuracyForTest(prev => new Set(prev).add(testId))
    
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/test/${testId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.accuracy_metrics?.total_similarity !== undefined) {
          // Update the test history with accuracy data
          setTestHistory(prev => prev.map(test => 
            test.test_id === testId 
              ? { 
                  ...test, 
                  total_similarity: result.accuracy_metrics.total_similarity,
                  accuracy: result.accuracy_metrics.total_similarity / 100 // Convert to 0-1 range for compatibility
                }
              : test
          ))
        }
      }
    } catch (error) {
      console.error(`Error fetching accuracy for test ${testId}:`, error)
    } finally {
      setLoadingAccuracyForTest(prev => {
        const newSet = new Set(prev)
        newSet.delete(testId)
        return newSet
      })
    }
  }

  // Add new test to history
  const addTestToHistory = (testData: any) => {
    const newTest = {
      test_id: testData.test_id,
      created_at: new Date().toISOString(),
      status: 'processing',
      prompt_count: Object.keys(selectedPrompts).length,
      contract_name: uploadedFile ? uploadedFile.name : contracts.find((c: any) => c.contract_id === selectedContract)?.contract_file_name,
      ground_truth_name: groundTruth.find((gt: any) => gt.contract_id === selectedGroundTruth)?.contract_file_name,
      test_type: uploadedFile ? 'upload' : 'contract',
      ...testData
    }
    
    setTestHistory(prev => [newTest, ...prev])
    return newTest
  }

  useEffect(() => {
    getPrompts();
    getContracts();
    getTestHistory(); // Load test history on mount
  }, [])

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case 'processing':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case 'failed':
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const fetchTestDetails = async (testId: number) => {
    setLoadingTestId(testId)
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/test/${testId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch test details: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Full API Response:", JSON.stringify(result, null, 2))
      setSelectedTestDetails(result)
      setIsDetailsModalOpen(true)
    } catch (error) {
      console.error("Error fetching test details:", error)
      toast({
        title: "Error fetching test details",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoadingTestId(null)
    }
  }

  const formatExtractionTime = (timeInSeconds: number | undefined | null | string) => {
    // Handle various data types and null/undefined values
    if (timeInSeconds === null || timeInSeconds === undefined || timeInSeconds === "") return "N/A"
    
    // Convert to number if it's a string
    const numTime = typeof timeInSeconds === 'string' ? parseFloat(timeInSeconds) : timeInSeconds
    
    // Check if it's a valid number
    if (isNaN(numTime) || numTime <= 0) return "N/A"
    
    if (numTime < 1) {
      return `${(numTime * 1000).toFixed(0)}ms`
    }
    return `${numTime.toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      {/* Processing Indicator */}
      {activeTestId && (
        <Card className="glass-card border-0 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <div>
                <p className="text-white font-medium">Test in Progress</p>
                <p className="text-gray-400 text-sm">Test ID: {activeTestId} is being processed...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    if (prompt && prompt[value] && prompt[value].length > 0) {
                      setSelectedPrompt(prompt[value][0].id || prompt[value][0].name);
                      setSelectedPrompts({ ...selectedPrompts, [value]: prompt[value][0].id || prompt[value][0].name })
                    }
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {loading ? (
                      <div className="text-white px-4 py-2">Loading...</div>
                    ) : (
                      <>
                        {prompt && Object.keys(prompt).map((category: any) => (
                          <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                            {category}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Prompt</label>
                <Select value={selectedPrompt} onValueChange={(value) => {
                  setSelectedPrompts({ ...selectedPrompts, [category]: value })
                  setSelectedPrompt(value)
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {loading ? (
                      <div className="text-white px-4 py-2">Loading...</div>
                    ) : (
                      <>
                        {prompt && prompt[category].map((promptItem: any) => (
                          <SelectItem
                            key={promptItem.id || promptItem.name}
                            value={promptItem.id || promptItem.name}
                            className="text-white hover:bg-white/10 cursor-pointer transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between w-full py-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {promptItem.name || promptItem.id}
                                </p>
                              </div>
                              <div className="flex-shrink-0 ml-3">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${promptItem.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                    }`}
                                >
                                  {promptItem.status}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Choose Contracts</label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('contract-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Loading..." : "Upload PDF"}
                </Button>
                <input
                  id="contract-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {/* Show uploaded file status */}
              {uploadedFile && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">
                        Uploaded: {uploadedFile.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedFile}
                      className="h-6 px-2 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Contract selection dropdown - only show if no file uploaded */}
              {!uploadedFile && (
                <Select value={selectedContract} onValueChange={(value) => {
                  setSelectedContract(value)
                  const contract = contracts.find((contract: any) => contract.contract_id === value)
                  setSelectedContractVersion(contract?.current_version_id)
                }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a contract..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {isContractLoading ? (
                      <div className="text-white px-4 py-2">Loading...</div>
                    ) : (
                      <>
                        {contracts.length > 5 && (
                          <div className="px-3 py-2 border-b border-white/10">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search contracts..."
                                value={contractSearchTerm}
                                onChange={(e) => setContractSearchTerm(e.target.value)}
                                className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-emerald-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                        {filteredContracts.length > 0 ? filteredContracts.map((contract: any) => (
                          <SelectItem
                            key={contract.contract_id}
                            value={contract.contract_id}
                            className="text-white hover:bg-white/10"
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{contract.contract_file_name}</span>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                <span>ID: {contract.contract_id}</span>
                                <span>•</span>
                                <span>Version: {contract.current_version_id}</span>
                                {contract.carrier && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400">{contract.carrier}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-contracts" disabled className="text-white hover:bg-white/10">
                            {contractSearchTerm ? "No contracts match your search" : "No contracts found"}
                          </SelectItem>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
              
              {/* Show alternative message when file is uploaded */}
              {uploadedFile && (
                <div className="text-center py-4 text-gray-400 text-sm border border-white/10 rounded-lg bg-white/5">
                  Using uploaded PDF file for testing
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Choose Ground Truth</label>
              <Select value={selectedGroundTruth} onValueChange={(value) => {
                setSelectedGroundTruth(value)
                const groundTruthItem = groundTruth.find((gt: any) => gt.contract_id === value)
                setSelectedGroundTruthVersion(groundTruthItem?.current_version_id)
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select ground truth..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {isContractLoading ? (
                    <div className="text-white px-4 py-2">Loading...</div>
                  ) : (
                    <>
                      {groundTruth.length > 5 && (
                        <div className="px-3 py-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search ground truth..."
                              value={groundTruthSearchTerm}
                              onChange={(e) => setGroundTruthSearchTerm(e.target.value)}
                              className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-emerald-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}
                      {filteredGroundTruth.length > 0 ? filteredGroundTruth.map((groundTruthItem: any) => (
                        <SelectItem
                          key={groundTruthItem.contract_id}
                          value={groundTruthItem.contract_id}
                          className="text-white hover:bg-white/10"
                        >
                          <div className="flex flex-col">
                            <span>{groundTruthItem.contract_file_name}</span>
                            {groundTruthItem.carrier && (
                              <span className="text-xs text-gray-400">{groundTruthItem.carrier}</span>
                            )}
                          </div>
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-ground-truth" disabled className="text-white hover:bg-white/10">
                          {groundTruthSearchTerm ? "No ground truth matches your search" : "No ground truth found"}
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
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

            {/* {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">Running accuracy test...</span>
                  <span className="text-emerald-400">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="bg-gray-800" />
              </div>
            )} */}
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

      {/* Selection Summary */}
      {Object.keys(selectedPrompts).length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-white">Selection Summary</CardTitle>
            <CardDescription className="text-gray-400">Current test configuration</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Selected Prompts by Category */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Selected Prompts</label>
                  <div className="mt-2 space-y-3">
                    {Object.entries(selectedPrompts).reverse().map(([categoryName, promptId]) => {
                      if (!promptId || !prompt || !prompt[categoryName]) return null;
                      const selectedPromptData = prompt[categoryName].find((p: any) => (p.id || p.name) === promptId);
                      return (
                        <div key={categoryName} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                {categoryName}
                              </Badge>
                            </div>
                            {selectedPromptData ? (
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white">{selectedPromptData.name || selectedPromptData.id}</p>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${selectedPromptData.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                    }`}
                                >
                                  {selectedPromptData.status}
                                </Badge>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">Prompt not found</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected Contract & Ground Truth */}
              <div className="space-y-4">
                {/* Selected Contract */}
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Selected Contract</label>
                  <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    {uploadedFile ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileJson className="h-4 w-4 text-emerald-400" />
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                            Uploaded PDF
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-400">Ready for testing</p>
                      </div>
                    ) : selectedContract && contracts.length > 0 ? (() => {
                      const selectedContractData = contracts.find((c: any) => c.contract_id === selectedContract);
                      return selectedContractData ? (
                        <div>
                          <p className="text-sm font-medium text-white">{selectedContractData.contract_file_name}</p>
                          {selectedContractData.carrier && (
                            <p className="text-xs text-gray-400">{selectedContractData.carrier}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Contract not found</p>
                      );
                    })() : (
                      <p className="text-sm text-gray-400">No contract selected</p>
                    )}
                  </div>
                </div>

                {/* Selected Ground Truth */}
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Selected Ground Truth</label>
                  <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    {selectedGroundTruth && groundTruth.length > 0 ? (() => {
                      const selectedGroundTruthData = groundTruth.find((gt: any) => gt.contract_id === selectedGroundTruth);
                      return selectedGroundTruthData ? (
                        <div>
                          <p className="text-sm font-medium text-white">{selectedGroundTruthData.contract_file_name}</p>
                          {selectedGroundTruthData.carrier && (
                            <p className="text-xs text-gray-400">{selectedGroundTruthData.carrier}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Ground truth not found</p>
                      );
                    })() : (
                      <p className="text-sm text-gray-400">No ground truth selected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Run History - Always visible */}
      <Card className="glass-card border-0">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-lg text-white">Test Run History</CardTitle>
          <CardDescription className="text-gray-400">
            {testHistory.length > 0 ? "Recent test executions and their status" : "No test history available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {testHistory.length > 0 ? (
            <div className="space-y-3">
              {testHistory.slice(0, 10).map((test, index) => {
                const { date, time } = formatDateTime(test.created_at)
                const isLoadingAccuracy = loadingAccuracyForTest.has(test.test_id)
                const hasAccuracy = test.total_similarity !== undefined && test.total_similarity !== null
                
                // Helper function to get accuracy label
                const getAccuracyLabel = (score: number) => {
                  if (score >= 90) return "Excellent"
                  if (score >= 80) return "Good"
                  if (score >= 70) return "Fair"
                  return "Poor"
                }
                
                return (
                  <div key={test.test_id || index} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`border-0 ${getStatusBadge(test.status)}`}
                          >
                            {test.status === 'processing' && (
                              <div className="animate-pulse mr-1 h-2 w-2 rounded-full bg-current"></div>
                            )}
                            {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {test.test_type === 'upload' ? 'PDF Upload' : 'Contract Selection'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Test ID</label>
                            <p className="text-white font-mono">{test.test_id}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Date & Time</label>
                            <p className="text-white">{date}</p>
                            <p className="text-gray-400 text-xs">{time}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Timer className="h-3 w-3 text-gray-400" />
                              <p className="text-gray-400 text-xs">{formatExtractionTime(test.extraction_time)}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Contract</label>
                            <p className="text-white truncate" title={test.contract_name}>
                              {test.contract_name || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Prompts</label>
                            <p className="text-white">{test.prompt_count} selected</p>
                          </div>
                        </div>
                        {test.ground_truth_name && (
                          <div className="mt-2 text-sm">
                            <label className="text-xs text-gray-400 uppercase tracking-wider">Ground Truth</label>
                            <p className="text-gray-300 truncate" title={test.ground_truth_name}>
                              {test.ground_truth_name}
                            </p>
                          </div>
                        )}
                        
                        {/* Accuracy Score Section */}
                        {test.status === 'completed' && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Accuracy Score</label>
                                {isLoadingAccuracy ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    <p className="text-gray-400">Loading accuracy...</p>
                                  </div>
                                ) : hasAccuracy && test.total_similarity !== undefined ? (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xl font-bold text-white">
                                      {test.total_similarity.toFixed(1)}%
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`border-0 ${
                                        test.total_similarity >= 90
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                          : test.total_similarity >= 80
                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                            : test.total_similarity >= 70
                                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                                      }`}
                                    >
                                      {getAccuracyLabel(test.total_similarity)}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-7 px-2 text-sm text-blue-400 hover:bg-blue-500/20"
                                    onClick={() => fetchTestAccuracy(test.test_id)}
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    Load Accuracy
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {test.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => fetchTestDetails(test.test_id)}
                            disabled={loadingTestId === test.test_id}
                          >
                            {loadingTestId === test.test_id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </>
                            )}
                          </Button>
                        )}
                        {test.status === 'processing' && activeTestId === test.test_id && (
                          <div className="flex items-center gap-2 text-blue-400">
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            <span className="text-sm">Processing...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {testHistory.length > 10 && (
                <div className="text-center pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      // TODO: Implement show all history
                      toast({
                        title: "View All History",
                        description: "Full history view will be implemented soon",
                        variant: "default",
                      })
                    }}
                  >
                    View All ({testHistory.length} tests)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-2">
                <Brain className="mx-auto h-10 w-10 opacity-50" />
              </div>
              <p className="text-gray-400">No tests have been run yet</p>
              <p className="text-gray-500 text-sm">Start your first accuracy test to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>

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
              <TableComponent>
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
                          className={`border-0 ${detail.status === 'excellent' ? "bg-emerald-500/20 text-emerald-400" :
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
              </TableComponent>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={(open) => {
        setIsDetailsModalOpen(open)
        if (!open) {
          setSelectedTestDetails(null)
          setLoadingTestId(null)
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Test Results Details
              {selectedTestDetails && (
                <Badge variant="outline" className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Test ID: {selectedTestDetails.test_id}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Category-wise analysis and detailed comparison results
            </DialogDescription>
          </DialogHeader>
          
          {selectedTestDetails && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Overall Results */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          {selectedTestDetails.accuracy_metrics?.overall_similarity 
                            ? `${selectedTestDetails.accuracy_metrics.overall_similarity.toFixed(1)}%`
                            : 'N/A'}
                        </div>
                        <p className="text-sm text-gray-400">Overall Accuracy</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {formatExtractionTime(selectedTestDetails.extraction_time)}
                        </div>
                        <p className="text-sm text-gray-400">Extraction Time</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {selectedTestDetails.extraction_results?.total_tables || 0}
                        </div>
                        <p className="text-sm text-gray-400">Tables Extracted</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">
                          {selectedTestDetails.extraction_results?.carrier || 'N/A'}
                        </div>
                        <p className="text-sm text-gray-400">Carrier</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Test Information */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Test Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Contract Name</label>
                          <p className="text-white mt-1">{selectedTestDetails.contract_name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Created At</label>
                          <p className="text-white mt-1">
                            {selectedTestDetails.created_at 
                              ? new Date(selectedTestDetails.created_at).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Test Status</label>
                          <div className="mt-1">
                            <Badge variant="outline" className={`border-0 ${getStatusBadge(selectedTestDetails.status)}`}>
                              {selectedTestDetails.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Upload Mode</label>
                          <p className="text-white mt-1">{selectedTestDetails.upload_mode ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category-wise Results - Enhanced UI */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <TableIcon className="h-5 w-5" />
                      Category-wise Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const accuracy = selectedTestDetails.accuracy_metrics;
                      const categoryResults = accuracy?.category_similarities;
                      
                      if (categoryResults && typeof categoryResults === 'object') {
                        const categories = Object.entries(categoryResults);
                        const totalCategories = categories.length;
                        
                        return (
                          <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="bg-gray-800/50 border-gray-700/50">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">{totalCategories}</div>
                                    <p className="text-sm text-gray-400">Total Categories</p>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card className="bg-emerald-500/10 border-emerald-500/30">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-emerald-400">
                                      {categories.filter(([_, result]: [string, any]) => (result as any).similarity_score >= 90).length}
                                    </div>
                                    <p className="text-sm text-emerald-300">Excellent (≥90%)</p>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card className="bg-amber-500/10 border-amber-500/30">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-amber-400">
                                      {categories.filter(([_, result]: [string, any]) => (result as any).similarity_score < 90).length}
                                    </div>
                                    <p className="text-sm text-amber-300">Needs Review (&lt;90%)</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Category Results */}
                            <div className="space-y-4">
                              {categories.map(([category, results]: [string, any]) => {
                                const similarityScore = results.similarity_score || 0;
                                const actualRows = results.actual_rows || 0;
                                const expectedRows = results.expected_rows || 0;
                                const missingRows = results.missing_rows || 0;
                                const extraRows = results.extra_rows || 0;
                                const extraRowDetails = results.extra_row_details || [];
                                
                                // Calculate matched rows
                                const matchedRows = actualRows - extraRows;
                                
                                return (
                                  <Card key={category} className="bg-gray-800/30 border-gray-700/50">
                                    <CardContent className="pt-4">
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-white font-medium text-lg">
                                          {CATEGORY_DISPLAY_NAMES[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </h4>
                                        <Badge 
                                          variant="outline" 
                                          className={`border-0 text-sm px-3 py-1 ${
                                            similarityScore >= 95 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                            similarityScore >= 90 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                            similarityScore >= 75 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                            'bg-red-500/20 text-red-300 border-red-500/30'
                                          }`}
                                        >
                                          {similarityScore.toFixed(1)}%
                                        </Badge>
                                      </div>
                                      
                                      {/* Metrics Grid */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                          <div className="text-xl font-bold text-emerald-400">
                                            {matchedRows}
                                          </div>
                                          <p className="text-xs text-emerald-300">Rows Matched</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                          <div className="text-xl font-bold text-blue-400">
                                            {expectedRows}
                                          </div>
                                          <p className="text-xs text-blue-300">Expected Rows</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                          <div className="text-xl font-bold text-red-400">
                                            {missingRows}
                                          </div>
                                          <p className="text-xs text-red-300">Missing Rows</p>
                                        </div>
                                        <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                          <div className="text-xl font-bold text-amber-400">
                                            {extraRows}
                                          </div>
                                          <p className="text-xs text-amber-300">Extra Rows</p>
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">Similarity Score</span>
                                          <span className="text-white font-medium">{similarityScore.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                              similarityScore >= 90 ? 'bg-emerald-500' :
                                              similarityScore >= 75 ? 'bg-amber-500' :
                                              'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min(similarityScore, 100)}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Row Details and Extra Row Information */}
                                      {(missingRows > 0 || extraRows > 0) && (
                                        <div className="space-y-3">
                                          {/* Data Discrepancies Summary */}
                                          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                              <AlertCircle className="h-4 w-4 text-amber-400" />
                                              <span className="text-sm font-medium text-amber-400">Data Discrepancies</span>
                                            </div>
                                            <div className="text-sm text-gray-300 space-y-1">
                                              {missingRows > 0 && (
                                                <p>• {missingRows} row(s) missing from extraction</p>
                                              )}
                                              {extraRows > 0 && (
                                                <p>• {extraRows} extra row(s) found in extraction</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Extra Row Details */}
                                          {extraRows > 0 && extraRowDetails.length > 0 && (
                                            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
                                              <h5 className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Extra Row Details ({extraRowDetails.length} items)
                                              </h5>
                                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {extraRowDetails.slice(0, 5).map((detail: any, index: number) => (
                                                  <div key={index} className="p-2 bg-gray-700/50 rounded text-xs border border-gray-600/30">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                      {detail.name && (
                                                        <div>
                                                          <span className="text-gray-400">Name:</span>
                                                          <span className="text-white ml-1">{detail.name}</span>
                                                        </div>
                                                      )}
                                                      {detail.term && (
                                                        <div>
                                                          <span className="text-gray-400">Term:</span>
                                                          <span className="text-white ml-1">{detail.term}</span>
                                                        </div>
                                                      )}
                                                      {detail.discount && (
                                                        <div>
                                                          <span className="text-gray-400">Discount:</span>
                                                          <span className="text-white ml-1">{detail.discount}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                                {extraRowDetails.length > 5 && (
                                                  <p className="text-xs text-gray-400 text-center">
                                                    ... and {extraRowDetails.length - 5} more items
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Success Message */}
                                      {results.message && (
                                        <div className={`mt-3 p-2 rounded text-sm border ${
                                          results.message.toLowerCase().includes('success') 
                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            : results.message.toLowerCase().includes('missing')
                                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                        }`}>
                                          <span className="font-medium">Status:</span> {results.message}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      // If no category results, show helpful message
                      return (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-400">No category-wise results available</p>
                          <p className="text-gray-500 text-sm mb-4">This test may not have completed successfully or accuracy analysis was not performed.</p>
                          {selectedTestDetails.accuracy_metrics && (
                            <Card className="text-left mt-4 bg-gray-800/30 border-gray-700/50">
                              <CardContent className="pt-3">
                                <p className="text-xs text-gray-400 mb-2">Available accuracy data:</p>
                                <div className="text-xs text-gray-300 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Overall Similarity:</span>
                                    <span>{selectedTestDetails.accuracy_metrics.overall_similarity?.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Rows:</span>
                                    <span>{selectedTestDetails.accuracy_metrics.total_rows}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Missing Rows:</span>
                                    <span>{selectedTestDetails.accuracy_metrics.missing_rows}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Extra Rows:</span>
                                    <span>{selectedTestDetails.accuracy_metrics.extra_rows}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}