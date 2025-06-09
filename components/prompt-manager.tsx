"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Copy,
  Edit,
  MoreHorizontal,
  Play,
  Save,
  Trash2,
  Search,
  BarChart3,
  X,
  Clock,
  Target,
  TrendingUp,
  Truck,
  Upload,
  FileText,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface Prompt {
  id: string
  name: string
  category: string
  carrier: string
  content: string
  description: string
  version: string
  status: string
  accuracy: number
  tests_run: number
  created_at: string
  updated_at: string
  last_tested: string
  is_default: boolean
  tags: string[]
}

interface PromptManagerProps {
  documentType: string
}

export function PromptManager({ documentType }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editModeDialogOpen, setEditModeDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState<'duplicate' | 'edit' | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [carriers, setCarriers] = useState<string[]>(["UPS", "FedEx"]) // Default carriers
  const [statistics, setStatistics] = useState<any>(null)
  
  // Test dialog state
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testingPrompt, setTestingPrompt] = useState<Prompt | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // Fetch prompts from backend
  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCarrier !== "all") params.append('carrier', selectedCarrier)
      if (selectedCategory) params.append('category', selectedCategory)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`${API_BASE_URL}/prompt/prompts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts || [])
      } else {
        console.error('Failed to fetch prompts')
        setPrompts([])
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/categories`)
      if (response.ok) {
        const data = await response.json()
        const uniqueCategories = [...new Set(data.categories || [])] as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Set default categories if backend is not available
      setCategories([
        "Eligible_accounts",
        "Incentive_base_discounts", 
        "Tier",
        "Minimums",
        "Service_adjustments",
        "Accessorials",
        "ePLD",
        "DIM"
      ])
    }
  }

  // Fetch carriers
  const fetchCarriers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/carriers`)
      if (response.ok) {
        const data = await response.json()
        const fetchedCarriers = data.carriers || []
        // Ensure UPS and FedEx are always available
        const allCarriers = [...new Set([...fetchedCarriers, "UPS", "FedEx"])]
        setCarriers(allCarriers)
      }
    } catch (error) {
      console.error('Error fetching carriers:', error)
      // Keep default carriers if backend is not available
      setCarriers(["UPS", "FedEx"])
    }
  }

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/statistics`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchCarriers()
    fetchStatistics()
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [selectedCarrier, selectedCategory, searchTerm])


  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setEditModeDialogOpen(true)
  }

  const handleEditModeSelect = (mode: 'duplicate' | 'edit') => {
    setEditMode(mode)
    setEditModeDialogOpen(false)
    setEditDialogOpen(true)
  }

  const handleSavePrompt = async () => {
    if (!editingPrompt || !editMode) return

    try {
      if (editMode === 'duplicate') {
        // Create new version using the new endpoint
        const response = await fetch(`${API_BASE_URL}/prompt/prompts/${editingPrompt.id}/new-version`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingPrompt.name,
            category: editingPrompt.category,
            content: editingPrompt.content,
            tags: editingPrompt.tags
          })
        })
        
        if (response.ok) {
          console.log('New version created successfully')
          fetchPrompts()
        } else {
          console.error('Failed to create new version')
        }
      } else {
        // Update existing prompt
        const response = await fetch(`${API_BASE_URL}/prompt/prompts/${editingPrompt.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingPrompt.name,
            category: editingPrompt.category,
            content: editingPrompt.content,
            tags: editingPrompt.tags
          })
        })
        
        if (response.ok) {
          console.log('Prompt updated successfully')
          fetchPrompts()
        } else {
          console.error('Failed to update prompt')
        }
      }
      
      setEditDialogOpen(false)
      setEditMode(null)
      setEditingPrompt(null)
    } catch (error) {
      console.error('Error saving prompt:', error)
    }
  }

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
  }

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  const getCategoryStats = (category: string) => {
    const categoryPrompts = prompts.filter(p => p.category === category)
    const activePrompts = categoryPrompts.filter(p => p.status === 'active')
    const avgAccuracy = categoryPrompts.length > 0 
      ? categoryPrompts.reduce((sum, p) => sum + p.accuracy, 0) / categoryPrompts.length 
      : 0

    return {
      total: categoryPrompts.length,
      active: activePrompts.length,
      avgAccuracy: avgAccuracy.toFixed(1)
    }
  }

  const handleTestPrompt = (prompt: Prompt) => {
    setTestingPrompt(prompt)
    setTestDialogOpen(true)
    setTestResult(null)
    setSelectedFile(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const runExtractionTest = async () => {
    if (!testingPrompt || !selectedFile) {
      alert('Please select a PDF file')
      return
    }

    setTestRunning(true)
    setTestResult(null)

    try {
      // First, activate the testing prompt to make it the active one for its category/carrier
      await fetch(`${API_BASE_URL}/prompt/prompts/${testingPrompt.id}/activate`, {
        method: 'POST'
      })

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Upload the contract using the existing upload API (no auth token needed)
      const uploadResponse = await fetch(`${API_BASE_URL}/contract/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('Upload result:', uploadResult)

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed')
      }

      const contractId = uploadResult.data.contract_id

      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 5 minutes with 5-second intervals
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        try {
          // Check contract status (no auth token needed)
          const statusResponse = await fetch(`${API_BASE_URL}/contract/details/${contractId}`)

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            console.log('Contract status:', statusData)

            if (statusData.success && statusData.data) {
              const contract = statusData.data
              
              if (contract.status === 'Pending Review') {
                // Extraction completed successfully
                setTestResult({
                  success: true,
                  message: 'Extraction completed successfully!',
                  data: contract,
                  contractId: contractId
                })
                break
              } else if (contract.status === 'Failed') {
                // Extraction failed
                setTestResult({
                  success: false,
                  message: 'Extraction failed',
                  error: contract.error_description || 'Unknown error occurred',
                  contractId: contractId
                })
                break
              }
              // If status is still "Processing", continue polling
            }
          }
        } catch (pollError) {
          console.error('Error polling status:', pollError)
        }
        
        attempts++
      }

      if (attempts >= maxAttempts) {
        setTestResult({
          success: false,
          message: 'Test timed out',
          error: 'Extraction took longer than expected',
          contractId: contractId
        })
      }

    } catch (error) {
      console.error('Test execution error:', error)
      setTestResult({
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setTestRunning(false)
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/${promptId}/activate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Refresh prompts to get updated status
        fetchPrompts()
      }
    } catch (error) {
      console.error('Error activating prompt:', error)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/${promptId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh prompts
        fetchPrompts()
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const handleDuplicatePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/${promptId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        // Refresh prompts
        fetchPrompts()
      }
    } catch (error) {
      console.error('Error duplicating prompt:', error)
    }
  }

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchTerm === "" || 
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === null || prompt.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = []
    }
    acc[prompt.category].push(prompt)
    return acc
  }, {} as Record<string, Prompt[]>)

  return (
    <div className="flex h-full">
      {/* Main Prompt Manager */}
      <div className={`transition-all duration-300 ${selectedPrompt ? "w-2/3" : "w-full"}`}>
        <Card className="glass-card border-0 h-full">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">Prompt Manager</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and configure prompts from database by carrier and category
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Carrier:</span>
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Carriers</SelectItem>
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier} value={carrier} className="text-white hover:bg-white/10">
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">Category:</span>
                  <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Prompts</CardTitle>
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{statistics?.total_prompts || 'NULL'}</div>
                  <p className="text-xs text-gray-400">
                    {selectedCarrier} carrier
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Active Prompts</CardTitle>
                  <Target className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{statistics?.active_prompts || 'NULL'}</div>
                  <p className="text-xs text-gray-400">
                    Currently in use
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Avg Accuracy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{statistics?.avg_accuracy ?? 'NULL'}%</div>
                  <p className="text-xs text-gray-400">
                    Across all prompts
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Tests Run</CardTitle>
                  <Clock className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{statistics?.total_tests ?? 'NULL'}</div>
                  <p className="text-xs text-gray-400">
                    Total executions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Prompts List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading prompts...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => {
                  const stats = getCategoryStats(category)
                  const isCollapsed = collapsedCategories.has(category)

                  return (
                    <Card key={category} className="glass-card border-white/10">
                      <Collapsible open={!isCollapsed} onOpenChange={() => toggleCategory(category)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-semibold text-white">{category}</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    {stats.total} prompts
                                  </Badge>
                                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {stats.active} active
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`border-0 ${
                                      Number(stats.avgAccuracy) >= 90
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : Number(stats.avgAccuracy) >= 80
                                          ? "bg-blue-500/20 text-blue-400"
                                          : "bg-amber-500/20 text-amber-400"
                                    }`}
                                  >
                                    {stats.avgAccuracy}% avg
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-gray-400">{isCollapsed ? "+" : "−"}</div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {categoryPrompts.map((prompt) => (
                                <Card 
                                  key={prompt.id} 
                                  className={`cursor-pointer transition-all duration-200 border ${
                                    selectedPrompt?.id === prompt.id
                                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                  }`}
                                  onClick={() => handlePromptClick(prompt)}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Header */}
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-white text-sm">
                                            {prompt.name} v{prompt.version}
                                          </h4>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                              variant="outline"
                                              className={`text-xs border-0 ${
                                                prompt.status === "active"
                                                  ? "bg-emerald-500/20 text-emerald-400"
                                                  : "bg-gray-500/20 text-gray-400"
                                              }`}
                                            >
                                              {prompt.status}
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className={`text-xs border-0 ${
                                                prompt.accuracy >= 90
                                                  ? "bg-emerald-500/20 text-emerald-400"
                                                  : prompt.accuracy >= 80
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-amber-500/20 text-amber-400"
                                              }`}
                                            >
                                              {prompt.accuracy}%
                                            </Badge>
                                            {prompt.is_default && (
                                              <Badge variant="outline" className="text-xs border-0 bg-purple-500/20 text-purple-400">
                                                Default
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleEditPrompt(prompt)
                                              }}
                                              className="text-white hover:bg-white/10"
                                            >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleTestPrompt(prompt)
                                              }}
                                              className="text-white hover:bg-white/10"
                                            >
                                              <Play className="mr-2 h-4 w-4" />
                                              Test
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDuplicatePrompt(prompt.id)
                                              }}
                                              className="text-white hover:bg-white/10"
                                            >
                                              <Copy className="mr-2 h-4 w-4" />
                                              Duplicate
                                            </DropdownMenuItem>
                                            {prompt.status !== 'active' && (
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleActivatePrompt(prompt.id)
                                                }}
                                                className="text-white hover:bg-white/10"
                                              >
                                                <Target className="mr-2 h-4 w-4" />
                                                Activate
                                              </DropdownMenuItem>
                                            )}
                                            {!prompt.is_default && (
                                              <DropdownMenuItem 
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleDeletePrompt(prompt.id)
                                                }}
                                                className="text-red-400 hover:bg-red-500/10"
                                              >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      {/* Stats */}
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="flex items-center gap-1 text-gray-400">
                                          <Clock className="h-3 w-3" />
                                          <span>{prompt.last_tested || 'Never'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400">
                                          <Target className="h-3 w-3" />
                                          <span>{prompt.tests_run} tests</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-400">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>{prompt.accuracy}%</span>
                                        </div>
                                      </div>

                                      {/* Preview */}
                                      <div className="text-xs text-gray-500 line-clamp-2">
                                        {prompt.content ? prompt.content.substring(0, 100) + '...' : prompt.description}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Prompt Details */}
      {selectedPrompt && (
        <div className="w-1/3 border-l border-white/10">
          <Card className="glass-card border-0 h-full rounded-l-none">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">{selectedPrompt.name} v{selectedPrompt.version}</CardTitle>
                  <CardDescription className="text-gray-400">Category: {selectedPrompt.category}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPrompt(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-emerald-400">{selectedPrompt.accuracy}%</div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-white">{selectedPrompt.tests_run}</div>
                    <div className="text-xs text-gray-400">Tests Run</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge
                      variant="outline"
                      className={`border-0 ${
                        selectedPrompt.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {selectedPrompt.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Tested:</span>
                    <span className="text-white">{selectedPrompt.last_tested || 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{selectedPrompt.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">{selectedPrompt.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Carrier:</span>
                    <span className="text-white">{selectedPrompt.carrier}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => handleEditPrompt(selectedPrompt)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Prompt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                    onClick={() => handleDuplicatePrompt(selectedPrompt.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 border-0"
                    onClick={() => handleTestPrompt(selectedPrompt)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  {selectedPrompt.status !== 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                      onClick={() => handleActivatePrompt(selectedPrompt.id)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Activate Prompt
                    </Button>
                  )}
                </div>
              </div>

              {/* Prompt Content */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Prompt Content</h4>
                <Textarea
                  value={selectedPrompt.content}
                  readOnly
                  className="min-h-[200px] font-mono text-xs bg-gray-900/50 border-white/10 text-gray-300 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Mode Selection Dialog */}
      <Dialog open={editModeDialogOpen} onOpenChange={setEditModeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-white/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Options</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose how you want to edit this prompt.
            </DialogDescription>
          </DialogHeader>
          
          {editingPrompt && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-300 mb-4">
                Editing: <span className="font-semibold text-white">{editingPrompt.name} v{editingPrompt.version}</span>
              </div>
              
              <div className="space-y-3">
                <div 
                  className="w-full p-4 border border-emerald-500/50 bg-emerald-500/10 rounded-lg cursor-pointer hover:bg-emerald-500/20 transition-colors"
                  onClick={() => handleEditModeSelect('duplicate')}
                >
                  <div className="text-left">
                    <div className="font-semibold text-emerald-400">Create New Version</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Create a new version (v{(parseFloat(editingPrompt.version) + 0.1).toFixed(1)}) with your changes. Original prompt remains unchanged.
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`w-full p-4 border border-white/20 rounded-lg transition-colors ${
                    editingPrompt.version === '1.0' 
                      ? 'opacity-50 cursor-not-allowed bg-gray-800/50' 
                      : 'cursor-pointer hover:bg-white/10 bg-gray-800/30'
                  }`}
                  onClick={() => editingPrompt.version !== '1.0' && handleEditModeSelect('edit')}
                >
                  <div className="text-left">
                    <div className="font-semibold text-white">Edit This Version</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {editingPrompt.version === '1.0' 
                        ? 'Cannot edit v1.0 prompts directly. Create a new version instead.'
                        : 'Modify the current version directly. This will overwrite the existing prompt.'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditModeDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editMode === 'duplicate' ? 'Create New Version' : 'Edit Prompt'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editMode === 'duplicate' 
                ? 'Create a new version of this prompt with your changes.' 
                : 'Make changes to your prompt and test the improvements.'
              }
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-white">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="col-span-3 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right text-white">
                  Category
                </Label>
                <Select
                  value={editingPrompt.category}
                  onValueChange={(value) => setEditingPrompt({ ...editingPrompt, category: value })}
                >
                  <SelectTrigger className="col-span-3 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2 text-white">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  className="col-span-3 min-h-[400px] font-mono text-sm resize-y bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Play className="h-4 w-4 mr-2" />
              Test Changes
            </Button>
            <Button onClick={handleSavePrompt} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-2" />
              {editMode === 'duplicate' ? 'Create New Version' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Test Prompt</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a PDF and run the extraction pipeline with the selected prompt.
            </DialogDescription>
          </DialogHeader>
          
          {testingPrompt && (
            <div className="space-y-6 py-4">
              <div className="text-sm text-gray-300 mb-4">
                Testing: <span className="font-semibold text-white">{testingPrompt.name} v{testingPrompt.version}</span>
              </div>
              
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="pdfFile" className="text-white">Upload PDF Contract</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="bg-white/5 border-white/10 text-white file:bg-emerald-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                  />
                  {selectedFile && (
                    <div className="flex items-center text-emerald-400 text-sm">
                      <FileText className="h-4 w-4 mr-1" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Test Results */}
              {testResult && (
                <div className="space-y-3">
                  <Label className="text-white">Test Results</Label>
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-900/20 border-red-500/30 text-red-300'
                  }`}>
                    <div className="font-semibold mb-2">{testResult.message}</div>
                    {testResult.error && (
                      <div className="text-sm opacity-80">Error: {testResult.error}</div>
                    )}
                    {testResult.contractId && (
                      <div className="text-sm opacity-80 mt-2">Contract ID: {testResult.contractId}</div>
                    )}
                    {testResult.success && testResult.data && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">Extraction Results:</div>
                        <pre className="text-xs bg-black/30 p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Processing Status */}
              {testRunning && (
                <div className="flex items-center justify-center space-x-2 text-emerald-400 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Running extraction pipeline...</span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setTestDialogOpen(false)
                setTestResult(null)
                setSelectedFile(null)
              }} 
              className="border-white/20 text-white hover:bg-white/10"
              disabled={testRunning}
            >
              {testRunning ? 'Running...' : 'Cancel'}
            </Button>
            <Button 
              onClick={runExtractionTest}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedFile || testRunning}
            >
              {testRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 