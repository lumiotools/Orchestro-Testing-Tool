"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Plus,
  Copy,
  Wand2,
  FileText,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Play,
  Save,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ModelSelector } from "@/components/model-selector"
import { useToast } from "@/hooks/use-toast"

interface NewPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const API_BASE_URL = "http://localhost:8081/api/v1"

const categories = [
  "Eligible accounts",
  "Incentive base discounts",
  "Tier",
  "Minimums",
  "Service adjustments",
  "Accessorials",
  "ePLD",
  "DIM"
]

const promptTemplates = {
  "Eligible accounts": `Extract eligible account information from the contract. Focus on account types, eligibility criteria, and restrictions.

Return JSON format:
{
  "eligibleAccountTypes": ["string"],
  "minimumRequirements": {
    "creditScore": "number",
    "annualVolume": "string",
    "businessType": "string"
  },
  "restrictions": ["string"],
  "specialConditions": "string"
}

Look for terms like "eligible", "qualified", "approved accounts", "account requirements".`,
  "Incentive base discounts": `Extract incentive-based discount information from shipping contracts.

Return JSON format:
{
  "volumeDiscounts": [{"threshold": "string", "discount": "string"}],
  "loyaltyIncentives": [{"criteria": "string", "benefit": "string"}],
  "performanceDiscounts": [{"metric": "string", "target": "string", "discount": "string"}],
  "seasonalIncentives": [{"period": "string", "discount": "string"}]
}

Focus on volume tiers, performance metrics, loyalty programs, and conditional discounts.`,
  Tier: `Extract tier-based pricing and service level information.

Return JSON format:
{
  "serviceTiers": [
    {
      "tierName": "string",
      "level": "number",
      "features": ["string"],
      "pricing": "string",
      "requirements": "string"
    }
  ],
  "tierBenefits": [{"tier": "string", "benefits": ["string"]}],
  "upgradeCriteria": [{"fromTier": "string", "toTier": "string", "requirements": "string"}]
}

Look for tier names like "Bronze", "Silver", "Gold", "Premium", service levels, and tier-specific benefits.`,
}

export function NewPromptDialog({ open, onOpenChange }: NewPromptDialogProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    carrier: "",
    creationMethod: "",
    sourcePrompt: "",
    promptContent: "",
    systemInstructions: "",
    fewShotExamples: "",
    outputFormat: "json",
    requiredFields: [] as string[],
    validationRules: "",
    autoTest: true,
    testSampleSize: 25,
    baselineComparison: true,
    selectedModels: ["gpt-4o", "claude-3-5-sonnet"],
    primaryModel: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
    retryLogic: false,
    confidenceThreshold: 0.8,
    tags: [] as string[],
    expectedImprovement: "",
    notes: "",
  })
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [existingPrompts, setExistingPrompts] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const { toast } = useToast()


  const generatePromptName = (category: string, carrier: string) => {
    if (!category) return ""
    const categoryKey = category.replace(/\s+/g, "")
    const existingVersions = existingPrompts
      .filter((p) => p.category === category)
      .map((p) => {
        const match = p.name.match(/-v(\d+)$/)
        return match ? Number.parseInt(match[1]) : 0
      })
    const nextVersion = Math.max(...existingVersions, 0) + 1
    return `${categoryKey}_${carrier}_v${nextVersion}`
  }

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category
    })

    // Generate AI suggestions based on category
    const suggestions = [
      `Consider adding specific validation for ${category.toLowerCase()} data types`,
      `Include examples of edge cases commonly found in ${category.toLowerCase()} data`,
      `Add confidence scoring for extracted ${category.toLowerCase()} values`,
    ]
    setAiSuggestions(suggestions)
  }

  const handleCreationMethodChange = (method: string) => {
    setFormData({ ...formData, creationMethod: method })

    if (
      method === "template" &&
      formData.category &&
      promptTemplates[formData.category as keyof typeof promptTemplates]
    ) {
      setFormData({
        ...formData,
        creationMethod: method,
        promptContent: promptTemplates[formData.category as keyof typeof promptTemplates],
      })
    }
  }

  const handleSourcePromptChange = (sourceId: string) => {
    const sourcePrompt = existingPrompts.find((p) => p.id === sourceId)
    if (sourcePrompt && formData.creationMethod === "duplicate") {
      // In a real app, you'd fetch the actual prompt content
      setFormData({
        ...formData,
        sourcePrompt: sourceId,
        promptContent: `// Duplicated from ${sourcePrompt.name}\n\n${promptTemplates[sourcePrompt.category as keyof typeof promptTemplates] || ""}`,
      })
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.category) errors.push("Category must be selected")
    if (!formData.creationMethod) errors.push("Creation method must be selected")
    if (!formData.carrier) errors.push("Carrier must be selected")
    const name = generatePromptName(formData.category, formData.carrier)
    setFormData({ ...formData, name })
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateForm()) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSave = async () => {
    if (validateForm()) {
      // Here you would save the prompt
      console.log("Saving prompt:", formData)
      const response = await fetch(`${API_BASE_URL}/prompt/prompts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        console.log("Prompt saved successfully")
        toast({
          title: "Prompt saved successfully",
          description: "Your prompt has been saved successfully",
          variant: "default"
        })
        onOpenChange(false)
        // Reset form
        setFormData({
          name: "",
          category: "",
          description: "",
          carrier: "",
          creationMethod: "",
          sourcePrompt: "",
          promptContent: "",
          systemInstructions: "",
          fewShotExamples: "",
          outputFormat: "json",
          requiredFields: [],
          validationRules: "",
          autoTest: true,
          testSampleSize: 25,
          baselineComparison: true,
          selectedModels: ["gpt-4o", "claude-3-5-sonnet"],
          primaryModel: "gpt-4o",
          temperature: 0.7,
          maxTokens: 2000,
          retryLogic: false,
          confidenceThreshold: 0.8,
          tags: [],
          expectedImprovement: "",
          notes: "",
        })
      } else {
        console.log("Failed to save prompt")
        toast({
          title: "Failed to save prompt",
          description: "Please try again",
          variant: "destructive"
        })
      }
      setStep(1)
      setValidationErrors([])
    }
  }

  const handleTestAndSave = () => {
    if (validateForm()) {
      // Here you would test and then save
      console.log("Testing and saving prompt:", formData)
      onOpenChange(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  const addRequiredField = (field: string) => {
    if (field && !formData.requiredFields.includes(field)) {
      setFormData({ ...formData, requiredFields: [...formData.requiredFields, field] })
    }
  }

  const removeRequiredField = (field: string) => {
    setFormData({ ...formData, requiredFields: formData.requiredFields.filter((f) => f !== field) })
  }

  const handleCarrierChange = (value: string) => {
    setFormData({ ...formData, carrier: value })
  }

  const carriers = ["FedEx", "UPS"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gray-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5 text-emerald-400" />
            Create New Extraction Prompt
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Step {step} of 3
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 1 && "Configure basic information and creation method"}
            {step === 2 && "Define prompt content and output configuration"}
            {step === 3 && "Set testing parameters and model selection"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${stepNum <= step
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : stepNum === step + 1
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800 text-gray-500 border border-gray-700"
                    }`}
                >
                  {stepNum < step ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 3 && <div className="w-12 h-px bg-gray-700 mx-2" />}
              </div>
            ))}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Basic Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set up the fundamental details for your new prompt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">
                        Category *
                      </Label>
                      <Select value={formData.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select category" />
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description (Optional)
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief explanation of what this prompt aims to improve"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carrier" className="text-white">
                      Carrier *
                    </Label>
                    <Select value={formData.carrier} onValueChange={handleCarrierChange}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {carriers.map((carrier) => (
                          <SelectItem key={carrier} value={carrier} className="text-white hover:bg-white/10">
                            {carrier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Creation Method *</CardTitle>
                  <CardDescription className="text-gray-400">Choose how you want to create this prompt</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        id: "scratch",
                        icon: FileText,
                        title: "Start from scratch",
                        description: "Create a completely new prompt",
                      },
                      {
                        id: "template",
                        icon: Copy,
                        title: "Use template",
                        description: "Start with a pre-built category template",
                      },
                      {
                        id: "duplicate",
                        icon: Copy,
                        title: "Duplicate existing",
                        description: "Copy and modify an existing prompt",
                      },
                      {
                        id: "ai-assisted",
                        icon: Wand2,
                        title: "AI-assisted creation",
                        description: "Get AI help building your prompt",
                      },
                    ].map((method) => (
                      <Card
                        key={method.id}
                        className={`cursor-pointer transition-all ${formData.creationMethod === method.id
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        onClick={() => handleCreationMethodChange(method.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <method.icon className="h-5 w-5 text-emerald-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-sm text-white">{method.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">{method.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {formData.creationMethod === "duplicate" && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-white">Source Prompt</Label>
                      <Select value={formData.sourcePrompt} onValueChange={handleSourcePromptChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select prompt to duplicate" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {existingPrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id} className="text-white hover:bg-white/10">
                              {prompt.name} ({prompt.accuracy}% accuracy)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Prompt Content */}
          {step === 2 && (
            <div className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Prompt Content *</CardTitle>
                  <CardDescription className="text-gray-400">
                    Define the main prompt instructions and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-content" className="text-white">
                      Main Prompt Text
                    </Label>
                    <Textarea
                      id="prompt-content"
                      value={formData.promptContent}
                      onChange={(e) => setFormData({ ...formData, promptContent: e.target.value })}
                      className="min-h-[200px] font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Enter your prompt instructions here..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system-instructions" className="text-white">
                      System Instructions (Optional)
                    </Label>
                    <Textarea
                      id="system-instructions"
                      value={formData.systemInstructions}
                      onChange={(e) => setFormData({ ...formData, systemInstructions: e.target.value })}
                      className="min-h-[100px] font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Model behavior guidelines..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="few-shot" className="text-white">
                      Few-shot Examples (Optional)
                    </Label>
                    <Textarea
                      id="few-shot"
                      value={formData.fewShotExamples}
                      onChange={(e) => setFormData({ ...formData, fewShotExamples: e.target.value })}
                      className="min-h-[100px] font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      placeholder="Input/output examples for better performance..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Output Configuration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Define the expected output format and validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Expected Output Format</Label>
                    <Select
                      value={formData.outputFormat}
                      onValueChange={(value) => setFormData({ ...formData, outputFormat: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="json" className="text-white hover:bg-white/10">
                          JSON
                        </SelectItem>
                        <SelectItem value="structured" className="text-white hover:bg-white/10">
                          Structured Data
                        </SelectItem>
                        <SelectItem value="text" className="text-white hover:bg-white/10">
                          Plain Text
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Required Fields</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.requiredFields.map((field) => (
                        <Badge
                          key={field}
                          variant="secondary"
                          className="flex items-center gap-1 bg-gray-800 text-gray-300"
                        >
                          {field}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeRequiredField(field)} />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add required field"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            addRequiredField(e.currentTarget.value)
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addRequiredField(input.value)
                          input.value = ""
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validation" className="text-white">
                      Validation Rules (Optional)
                    </Label>
                    <Textarea
                      id="validation"
                      value={formData.validationRules}
                      onChange={(e) => setFormData({ ...formData, validationRules: e.target.value })}
                      placeholder="Data type validation, format requirements..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Testing & Model Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Testing Configuration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how this prompt should be tested
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-test"
                      checked={formData.autoTest}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoTest: checked as boolean })}
                    />
                    <Label htmlFor="auto-test" className="text-white">
                      Auto-test on creation
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-white">Test sample size</Label>
                      <span className="text-sm text-gray-400">{formData.testSampleSize} contracts</span>
                    </div>
                    <Slider
                      value={[formData.testSampleSize]}
                      min={10}
                      max={100}
                      step={5}
                      onValueChange={(value) => setFormData({ ...formData, testSampleSize: value[0] })}
                      className="[&_[role=slider]]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="baseline"
                      checked={formData.baselineComparison}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, baselineComparison: checked as boolean })
                      }
                    />
                    <Label htmlFor="baseline" className="text-white">
                      Compare against current best prompt in category
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Model Selection</CardTitle>
                  <CardDescription className="text-gray-400">Choose AI models for testing this prompt</CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelSelector
                    selectedModels={formData.selectedModels}
                    onModelChange={(models) => setFormData({ ...formData, selectedModels: models })}
                    primaryModel={formData.primaryModel}
                    onPrimaryModelChange={(model) => setFormData({ ...formData, primaryModel: model })}
                  />
                </CardContent>
              </Card>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between text-white">
                        Advanced Settings
                        {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="glass-card border-white/10">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Temperature</Label>
                          <Slider
                            value={[formData.temperature]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={(value) => setFormData({ ...formData, temperature: value[0] })}
                            className="[&_[role=slider]]:bg-emerald-500"
                          />
                          <span className="text-xs text-gray-400">{formData.temperature}</span>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Max Tokens</Label>
                          <Input
                            type="number"
                            value={formData.maxTokens}
                            onChange={(e) => setFormData({ ...formData, maxTokens: Number.parseInt(e.target.value) })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Confidence Threshold</Label>
                        <Slider
                          value={[formData.confidenceThreshold]}
                          min={0.5}
                          max={1}
                          step={0.05}
                          onValueChange={(value) => setFormData({ ...formData, confidenceThreshold: value[0] })}
                          className="[&_[role=slider]]:bg-emerald-500"
                        />
                        <span className="text-xs text-gray-400">{formData.confidenceThreshold}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retry"
                          checked={formData.retryLogic}
                          onCheckedChange={(checked) => setFormData({ ...formData, retryLogic: checked as boolean })}
                        />
                        <Label htmlFor="retry" className="text-white">
                          Enable retry logic for failed extractions
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Metadata & Tracking</CardTitle>
                  <CardDescription className="text-gray-400">Add tags and notes for organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1 bg-gray-800 text-gray-300"
                        >
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag (e.g., experimental, production-ready)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            addTag(e.currentTarget.value)
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addTag(input.value)
                          input.value = ""
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="improvement" className="text-white">
                      Expected Improvement
                    </Label>
                    <Input
                      id="improvement"
                      value={formData.expectedImprovement}
                      onChange={(e) => setFormData({ ...formData, expectedImprovement: e.target.value })}
                      placeholder="e.g., +5% accuracy improvement"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Hypothesis, changes made, etc."
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} className="border-white/20 text-white hover:bg-white/10">
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 border-0">
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleTestAndSave} className="bg-emerald-600 hover:bg-emerald-700 border-0">
                    <Play className="h-4 w-4 mr-2" />
                    Test & Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
