"use client"

import { useState } from "react"
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

export function AccuracyTester() {
  const [category, setCategory] = useState("eligible")
  const [prompt, setPrompt] = useState("eligible-v1")
  const [sampleSize, setSampleSize] = useState(50)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [selectedModels, setSelectedModels] = useState(["gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash"])
  const [primaryModel, setPrimaryModel] = useState("gpt-4o")
  const [testMode, setTestMode] = useState<"single" | "comparison">("single")

  const handleRunTest = () => {
    setIsRunning(true)
    setProgress(0)
    setResults(null)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsRunning(false)

          if (testMode === "single") {
            setResults({
              accuracy: 92.3,
              totalContracts: sampleSize,
              correctExtractions: Math.floor(sampleSize * 0.923),
              incorrectExtractions: sampleSize - Math.floor(sampleSize * 0.923),
              avgConfidence: 0.89,
              model: primaryModel,
              details: Array.from({ length: 10 }, (_, i) => ({
                contractId: `C-${String(i + 1).padStart(3, "0")}`,
                correct: Math.random() > 0.1,
                confidence: 0.7 + Math.random() * 0.3,
                extractedValue: i % 3 === 0 ? "$10,000" : i % 3 === 1 ? "$25,500" : "$8,750",
                expectedValue: i % 3 === 0 ? "$10,000" : i % 3 === 1 ? "$25,000" : "$8,750",
              })),
            })
          } else {
            // Generate comparison results for multiple models
            setResults({
              modelComparison: selectedModels.map((modelId) => {
                const model = availableModels.find((m) => m.id === modelId)
                const baseAccuracy = 85 + Math.random() * 15
                return {
                  modelId,
                  modelName: model?.name || modelId,
                  provider: model?.provider || "Unknown",
                  accuracy: Number(baseAccuracy.toFixed(1)),
                  avgConfidence: 0.8 + Math.random() * 0.2,
                  avgResponseTime: 1.2 + Math.random() * 2.8,
                  cost: (model?.costPer1kTokens || 0.001) * sampleSize * 2.5,
                  correctExtractions: Math.floor(sampleSize * (baseAccuracy / 100)),
                  incorrectExtractions: sampleSize - Math.floor(sampleSize * (baseAccuracy / 100)),
                }
              }),
              totalContracts: sampleSize,
            })
          }
          return 100
        }
        return newProgress
      })
    }, 100)
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
                    <SelectItem value="eligible" className="text-white hover:bg-white/10">
                      Eligible accounts
                    </SelectItem>
                    <SelectItem value="incentive" className="text-white hover:bg-white/10">
                      Incentive base discounts
                    </SelectItem>
                    <SelectItem value="tier" className="text-white hover:bg-white/10">
                      Tier
                    </SelectItem>
                    <SelectItem value="minimums" className="text-white hover:bg-white/10">
                      Minimums
                    </SelectItem>
                    <SelectItem value="service" className="text-white hover:bg-white/10">
                      Service adjustments
                    </SelectItem>
                    <SelectItem value="accessorials" className="text-white hover:bg-white/10">
                      Accessorials
                    </SelectItem>
                    <SelectItem value="epld" className="text-white hover:bg-white/10">
                      ePLD
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
                              className={`border-0 ${
                                detail.correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
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
                              className={`border-0 ${
                                model.accuracy >= 90
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
