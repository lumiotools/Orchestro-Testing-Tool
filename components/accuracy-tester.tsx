"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Download, Zap, Brain, Globe, Sparkles, Cpu } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ModelSelector, availableModels } from "@/components/model-selector"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "http://localhost:8081/api/v1"

export function AccuracyTester() {
  const [category, setCategory] = useState("select")
  const [prompt, setPrompt] = useState<any>(null)
  const [contracts, setContracts] = useState<any>([])
  const [groundTruth, setGroundTruth] = useState<any>([])
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [selectedGroundTruth, setSelectedGroundTruth] = useState<any>(null)
  const [selectedPrompts, setSelectedPrompts] = useState<any>({})
  const [sampleSize, setSampleSize] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [selectedModels, setSelectedModels] = useState(["gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash"])
  const [primaryModel, setPrimaryModel] = useState("gpt-4o")
  const [testMode, setTestMode] = useState<"single" | "comparison">("single")
  const [loading, setLoading] = useState(false)
  const [isContractLoading, setIsContractLoading] = useState(false)
  const [isGroundTruthLoading, setIsGroundTruthLoading] = useState(false)
  const { toast } = useToast()

  const handleRunTest = async () => {
    setIsRunning(true)
    const data = {
      prompt_ids: Object.values(selectedPrompts),
      contract_id: selectedContract,
      ground_truth_id: selectedGroundTruth,
      save_results: false,
      contract_file_source: contracts.find((contract: any) => contract.contract_id === selectedContract)?.contract_file_url,
      contract_name: contracts.find((contract: any) => contract.contract_id === selectedContract)?.contract_file_name
    };
    try {
      const response = await fetch(`${API_BASE_URL}/prompt/prompts/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      console.log("🚀 => responseData:", responseData);
    } catch (error) {
      toast({
        title: "Error fetching prompts",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

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
      const response = await fetch(`${API_BASE_URL}/contract/list?timestamp=${new Date().getTime()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("accessToken") || "",
        },
      })
      const data = await response.json()
      const nonGroundTruthContracts = data.data.contracts.filter((contract: any) => !contract.ground_truth)
      console.log("🚀 => nonGroundTruthContracts:", nonGroundTruthContracts);
      setContracts(nonGroundTruthContracts)
      const groundTruthContracts = data.data.contracts.filter((contract: any) => contract.ground_truth)
      console.log("🚀 => data.data.contracts:", data.data.contracts);
      console.log("🚀 => groundTruthContracts:", groundTruthContracts);
      setGroundTruth(groundTruthContracts)
    } catch (error) {
      toast({
        title: "Error fetching contracts",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsContractLoading(false)
    }
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


  useEffect(() => {
    getPrompts();
    getContracts();
  }, [])

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
                        <SelectItem value="select" className="text-white hover:bg-white/10">
                          Select Category
                        </SelectItem>
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
              <label className="text-sm font-medium text-white">Choose Contracts</label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {isContractLoading ? (
                    <div className="text-white px-4 py-2">Loading...</div>
                  ) : (
                    contracts.length > 0 ? contracts.map((contract: any) => (
                      <SelectItem
                        key={contract.contract_id}
                        value={contract.contract_id}
                        className="text-white hover:bg-white/10"
                      >
                        {contract.contract_file_name} - {contract?.carrier}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-contracts" className="text-white hover:bg-white/10">
                        No contracts found
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Choose Ground Truth</label>
              <Select value={selectedGroundTruth} onValueChange={setSelectedGroundTruth}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {isGroundTruthLoading ? (
                    <div className="text-white px-4 py-2">Loading...</div>
                  ) : (
                    <>
                      {groundTruth.length > 0 ? groundTruth.map((groundTruthItem: any) => (
                        <SelectItem
                          key={groundTruthItem.contract_id}
                          value={groundTruthItem.contract_id}
                          className="text-white hover:bg-white/10"
                        >
                          {groundTruthItem.contract_file_name} - {groundTruthItem?.carrier}
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-ground-truth" className="text-white hover:bg-white/10">
                          No ground truth found
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

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">Testing in progress...</span>
                  <span className="text-emerald-400">{progress}%</span>
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
                    {selectedContract && contracts.length > 0 ? (() => {
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

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {testMode === "single" ? (
            // Single Model Results
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-card border-0">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{results.accuracy}%</div>
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

              <Card className="glass-card border-0">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">Detailed Results</CardTitle>
                      <CardDescription className="text-gray-400">
                        Individual contract extraction results
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
                        <TableHead className="text-gray-400">Contract ID</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Extracted Value</TableHead>
                        <TableHead className="text-gray-400">Expected Value</TableHead>
                        <TableHead className="text-gray-400">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.details.map((detail: any, index: number) => (
                        <TableRow key={index} className="border-white/10">
                          <TableCell className="font-medium text-white">{detail.contractId}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${detail.correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                }`}
                            >
                              {detail.correct ? "Correct" : "Incorrect"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-white">{detail.extractedValue}</TableCell>
                          <TableCell className="font-mono text-gray-400">{detail.expectedValue}</TableCell>
                          <TableCell className="text-white">{(detail.confidence * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            // Model Comparison Results
            <Card className="glass-card border-0">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">Model Comparison Results</CardTitle>
                    <CardDescription className="text-gray-400">
                      Performance comparison across selected models
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <Download className="h-4 w-4 mr-2" />
                    Export Comparison
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Model</TableHead>
                      <TableHead className="text-gray-400">Accuracy</TableHead>
                      <TableHead className="text-gray-400">Avg Confidence</TableHead>
                      <TableHead className="text-gray-400">Response Time</TableHead>
                      <TableHead className="text-gray-400">Cost</TableHead>
                      <TableHead className="text-gray-400">Correct/Incorrect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.modelComparison
                      .sort((a: any, b: any) => b.accuracy - a.accuracy)
                      .map((model: any, index: number) => (
                        <TableRow key={model.modelId} className="border-white/10">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(model.provider)}
                              <div>
                                <div className="font-medium text-white">{model.modelName}</div>
                                <div className="text-xs text-gray-400">{model.provider}</div>
                              </div>
                              {index === 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                                >
                                  Best
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-0 ${model.accuracy >= 90
                                ? "bg-emerald-500/20 text-emerald-400"
                                : model.accuracy >= 80
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-amber-500/20 text-amber-400"
                                }`}
                            >
                              {model.accuracy}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{(model.avgConfidence * 100).toFixed(1)}%</TableCell>
                          <TableCell className="text-white">{model.avgResponseTime.toFixed(1)}s</TableCell>
                          <TableCell className="text-white">${model.cost.toFixed(4)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <span className="text-emerald-400">{model.correctExtractions}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-red-400">{model.incorrectExtractions}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
