"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Zap, Brain, Sparkles, Globe, Cpu, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

export interface ModelConfig {
  id: string
  name: string
  provider: string
  version: string
  contextLength: number
  costPer1kTokens: number
  speed: "fast" | "medium" | "slow"
  capabilities: string[]
  recommended?: boolean
}

export const availableModels: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    version: "2024-11-20",
    contextLength: 128000,
    costPer1kTokens: 0.0025,
    speed: "fast",
    capabilities: ["text", "vision", "function-calling"],
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    version: "2024-07-18",
    contextLength: 128000,
    costPer1kTokens: 0.00015,
    speed: "fast",
    capabilities: ["text", "vision", "function-calling"],
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    version: "2024-04-09",
    contextLength: 128000,
    costPer1kTokens: 0.01,
    speed: "medium",
    capabilities: ["text", "vision", "function-calling"],
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    version: "0613",
    contextLength: 8192,
    costPer1kTokens: 0.03,
    speed: "medium",
    capabilities: ["text", "function-calling"],
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    version: "0125",
    contextLength: 16385,
    costPer1kTokens: 0.0005,
    speed: "fast",
    capabilities: ["text", "function-calling"],
  },
  {
    id: "o1-preview",
    name: "o1-preview",
    provider: "OpenAI",
    version: "2024-09-12",
    contextLength: 128000,
    costPer1kTokens: 0.015,
    speed: "slow",
    capabilities: ["reasoning", "complex-analysis"],
    recommended: true,
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    provider: "OpenAI",
    version: "2024-09-12",
    contextLength: 128000,
    costPer1kTokens: 0.003,
    speed: "medium",
    capabilities: ["reasoning", "math", "coding"],
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    provider: "OpenAI",
    version: "2024-12-17",
    contextLength: 128000,
    costPer1kTokens: 0.004,
    speed: "medium",
    capabilities: ["reasoning", "advanced-analysis"],
  },
  // Anthropic Models
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    version: "20241022",
    contextLength: 200000,
    costPer1kTokens: 0.003,
    speed: "fast",
    capabilities: ["text", "vision", "analysis", "coding"],
    recommended: true,
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    version: "20241022",
    contextLength: 200000,
    costPer1kTokens: 0.00025,
    speed: "fast",
    capabilities: ["text", "vision", "speed"],
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    version: "20240229",
    contextLength: 200000,
    costPer1kTokens: 0.015,
    speed: "slow",
    capabilities: ["text", "vision", "complex-reasoning"],
  },
  // Google Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    version: "exp-1219",
    contextLength: 1000000,
    costPer1kTokens: 0.000075,
    speed: "fast",
    capabilities: ["text", "vision", "audio", "multimodal"],
    recommended: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    version: "002",
    contextLength: 2000000,
    costPer1kTokens: 0.00125,
    speed: "medium",
    capabilities: ["text", "vision", "audio", "long-context"],
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    version: "002",
    contextLength: 1000000,
    costPer1kTokens: 0.000075,
    speed: "fast",
    capabilities: ["text", "vision", "speed"],
  },
  // xAI Models
  {
    id: "grok-2",
    name: "Grok-2",
    provider: "xAI",
    version: "1212",
    contextLength: 131072,
    costPer1kTokens: 0.002,
    speed: "fast",
    capabilities: ["text", "real-time", "web-search"],
  },
  {
    id: "grok-2-mini",
    name: "Grok-2 Mini",
    provider: "xAI",
    version: "1212",
    contextLength: 131072,
    costPer1kTokens: 0.0002,
    speed: "fast",
    capabilities: ["text", "speed", "efficiency"],
  },
  // DeepSeek Models
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    provider: "DeepSeek",
    version: "2024-12",
    contextLength: 64000,
    costPer1kTokens: 0.00014,
    speed: "fast",
    capabilities: ["text", "coding", "reasoning"],
  },
  {
    id: "deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    provider: "DeepSeek",
    version: "0724",
    contextLength: 128000,
    costPer1kTokens: 0.00014,
    speed: "fast",
    capabilities: ["coding", "text", "analysis"],
  },
]

interface ModelSelectorProps {
  selectedModels: string[]
  onModelChange: (models: string[]) => void
  primaryModel: string
  onPrimaryModelChange: (model: string) => void
}

export function ModelSelector({
  selectedModels,
  onModelChange,
  primaryModel,
  onPrimaryModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedProviders, setExpandedProviders] = useState<string[]>(["OpenAI", "Anthropic"])

  const providers = Array.from(new Set(availableModels.map((m) => m.provider)))

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

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "fast":
        return "text-emerald-400"
      case "medium":
        return "text-amber-400"
      case "slow":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelChange(selectedModels.filter((id) => id !== modelId))
    } else {
      onModelChange([...selectedModels, modelId])
    }
  }

  const toggleProvider = (provider: string) => {
    if (expandedProviders.includes(provider)) {
      setExpandedProviders(expandedProviders.filter((p) => p !== provider))
    } else {
      setExpandedProviders([...expandedProviders, provider])
    }
  }

  const selectAllFromProvider = (provider: string) => {
    const providerModels = availableModels.filter((m) => m.provider === provider).map((m) => m.id)
    const newSelected = [...new Set([...selectedModels, ...providerModels])]
    onModelChange(newSelected)
  }

  const deselectAllFromProvider = (provider: string) => {
    const providerModels = availableModels.filter((m) => m.provider === provider).map((m) => m.id)
    onModelChange(selectedModels.filter((id) => !providerModels.includes(id)))
  }

  return (
    <div className="space-y-4">
      {/* Primary Model Selection */}
      <div className="space-y-2">
        <Label className="text-white">Primary Model</Label>
        <Select value={primaryModel} onValueChange={onPrimaryModelChange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select primary model" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/20">
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-white hover:bg-white/10">
                <div className="flex items-center gap-2">
                  {getProviderIcon(model.provider)}
                  <span>{model.name}</span>
                  {model.recommended && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                    >
                      Recommended
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Comparison Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-white">Models for Comparison</Label>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Configure Models ({selectedModels.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-gray-900 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Select Models for Testing</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Choose which AI models to include in your prompt testing and comparison
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {providers.map((provider) => {
                  const providerModels = availableModels.filter((m) => m.provider === provider)
                  const selectedFromProvider = providerModels.filter((m) => selectedModels.includes(m.id)).length
                  const isExpanded = expandedProviders.includes(provider)

                  return (
                    <Card key={provider} className="glass-card border-white/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProvider(provider)}
                              className="p-0 h-auto text-white hover:bg-transparent"
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                              />
                            </Button>
                            {getProviderIcon(provider)}
                            <CardTitle className="text-lg text-white">{provider}</CardTitle>
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {selectedFromProvider}/{providerModels.length} selected
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllFromProvider(provider)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deselectAllFromProvider(provider)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Deselect All
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <Collapsible open={isExpanded} onOpenChange={() => toggleProvider(provider)}>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="grid gap-3">
                              {providerModels.map((model) => (
                                <div
                                  key={model.id}
                                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                    selectedModels.includes(model.id)
                                      ? "border-emerald-500 bg-emerald-500/10"
                                      : "border-white/10 bg-white/5 hover:bg-white/10"
                                  }`}
                                  onClick={() => toggleModel(model.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={selectedModels.includes(model.id)}
                                        onChange={() => toggleModel(model.id)}
                                        className="mt-1"
                                      />
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-white">{model.name}</h4>
                                          {model.recommended && (
                                            <Badge
                                              variant="outline"
                                              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                                            >
                                              Recommended
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                          <span>Version: {model.version}</span>
                                          <span>Context: {model.contextLength.toLocaleString()} tokens</span>
                                          <span className={getSpeedColor(model.speed)}>Speed: {model.speed}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {model.capabilities.map((capability) => (
                                            <Badge
                                              key={capability}
                                              variant="outline"
                                              className="bg-gray-800 text-gray-300 border-gray-600 text-xs"
                                            >
                                              {capability}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-400">
                                      <div>${model.costPer1kTokens.toFixed(4)}</div>
                                      <div>per 1K tokens</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="text-sm text-gray-400">{selectedModels.length} models selected for comparison</div>
                <Button onClick={() => setIsOpen(false)}>Done</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Models Preview */}
        <div className="flex flex-wrap gap-2">
          {selectedModels.slice(0, 3).map((modelId) => {
            const model = availableModels.find((m) => m.id === modelId)
            if (!model) return null
            return (
              <Badge key={modelId} variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {model.name}
              </Badge>
            )
          })}
          {selectedModels.length > 3 && (
            <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
              +{selectedModels.length - 3} more
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
