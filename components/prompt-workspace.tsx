"use client"

import { useState } from "react"
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
  Plus,
  Search,
  BarChart3,
  X,
  Clock,
  Target,
  TrendingUp,
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
import { NewPromptDialog } from "@/components/new-prompt-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const promptsData = [
  {
    id: "prompt-1",
    name: "EligibleAccounts-v1",
    category: "Eligible accounts",
    accuracy: 85.2,
    status: "inactive",
    lastTested: "1 week ago",
    createdAt: "2025-03-15",
    testsRun: 45,
    content: `Extract eligible account information from the contract. Focus on account types, eligibility criteria, and restrictions.

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
  },
  {
    id: "prompt-2",
    name: "EligibleAccounts-v2",
    category: "Eligible accounts",
    accuracy: 88.7,
    status: "inactive",
    lastTested: "4 days ago",
    createdAt: "2025-04-02",
    testsRun: 38,
    content: `Extract eligible account information from the contract. Focus on account types, eligibility criteria, and restrictions.

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
  },
  {
    id: "prompt-3",
    name: "EligibleAccounts-v3",
    category: "Eligible accounts",
    accuracy: 89.2,
    status: "active",
    lastTested: "2 hours ago",
    createdAt: "2025-04-18",
    testsRun: 52,
    content: `Extract eligible account information from the contract. Focus on account types, eligibility criteria, and restrictions.

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
  },
  {
    id: "prompt-4",
    name: "IncentiveDiscounts-v1",
    category: "Incentive base discounts",
    accuracy: 74.5,
    status: "inactive",
    lastTested: "2 weeks ago",
    createdAt: "2025-03-10",
    testsRun: 32,
    content: `Extract incentive-based discount information from shipping contracts.

Return JSON format:
{
  "volumeDiscounts": [{"threshold": "string", "discount": "string"}],
  "loyaltyIncentives": [{"criteria": "string", "benefit": "string"}],
  "performanceDiscounts": [{"metric": "string", "target": "string", "discount": "string"}],
  "seasonalIncentives": [{"period": "string", "discount": "string"}]
}

Focus on volume tiers, performance metrics, loyalty programs, and conditional discounts.`,
  },
  {
    id: "prompt-5",
    name: "IncentiveDiscounts-v2",
    category: "Incentive base discounts",
    accuracy: 76.8,
    status: "active",
    lastTested: "4 hours ago",
    createdAt: "2025-04-05",
    testsRun: 41,
    content: `Extract incentive-based discount information from shipping contracts.

Return JSON format:
{
  "volumeDiscounts": [{"threshold": "string", "discount": "string"}],
  "loyaltyIncentives": [{"criteria": "string", "benefit": "string"}],
  "performanceDiscounts": [{"metric": "string", "target": "string", "discount": "string"}],
  "seasonalIncentives": [{"period": "string", "discount": "string"}]
}

Focus on volume tiers, performance metrics, loyalty programs, and conditional discounts.`,
  },
  {
    id: "prompt-6",
    name: "Tier-v1",
    category: "Tier",
    accuracy: 88.3,
    status: "inactive",
    lastTested: "1 week ago",
    createdAt: "2025-03-05",
    testsRun: 29,
    content: `Extract tier-based pricing and service level information.

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
  },
  {
    id: "prompt-7",
    name: "Tier-v2",
    category: "Tier",
    accuracy: 90.8,
    status: "inactive",
    lastTested: "3 days ago",
    createdAt: "2025-03-22",
    testsRun: 35,
    content: `Extract tier-based pricing and service level information.

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
  },
  {
    id: "prompt-8",
    name: "Tier-v3",
    category: "Tier",
    accuracy: 92.1,
    status: "active",
    lastTested: "1 day ago",
    createdAt: "2025-04-03",
    testsRun: 47,
    content: `Extract tier-based pricing and service level information.

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
  },
  {
    id: "prompt-9",
    name: "Minimums-v5",
    category: "Minimums",
    accuracy: 81.5,
    status: "active",
    lastTested: "6 hours ago",
    createdAt: "2025-04-12",
    testsRun: 43,
    content: `Extract minimum requirements and thresholds from contracts.

Return JSON format:
{
  "minimumCharges": [{"service": "string", "minimum": "string"}],
  "volumeMinimums": [{"period": "string", "minimum": "string"}],
  "orderMinimums": [{"type": "string", "minimum": "string"}],
  "serviceMinimums": [{"service": "string", "requirement": "string"}]
}

Focus on minimum charges, volume commitments, order quantities, and service requirements.`,
  },
  {
    id: "prompt-10",
    name: "ServiceAdjustments-v1",
    category: "Service adjustments",
    accuracy: 73.2,
    status: "active",
    lastTested: "2 days ago",
    createdAt: "2025-04-01",
    testsRun: 39,
    content: `Extract service adjustment clauses and fee modifications.

Return JSON format:
{
  "fuelSurcharges": [{"type": "string", "calculation": "string"}],
  "seasonalAdjustments": [{"period": "string", "adjustment": "string"}],
  "serviceModifications": [{"service": "string", "adjustment": "string", "conditions": "string"}],
  "emergencyFees": [{"scenario": "string", "fee": "string"}]
}

Look for fuel adjustments, seasonal pricing, service modifications, and emergency surcharges.`,
  },
  {
    id: "prompt-11",
    name: "Accessorials-v3",
    category: "Accessorials",
    accuracy: 87.6,
    status: "active",
    lastTested: "8 hours ago",
    createdAt: "2025-04-08",
    testsRun: 51,
    content: `Extract accessorial charges and additional service fees.

Return JSON format:
{
  "deliveryAccessorials": [{"service": "string", "fee": "string", "conditions": "string"}],
  "handlingFees": [{"type": "string", "fee": "string"}],
  "specialServices": [{"service": "string", "fee": "string", "description": "string"}],
  "equipmentFees": [{"equipment": "string", "fee": "string"}]
}

Focus on delivery fees, handling charges, special service fees, and equipment-related costs.`,
  },
  {
    id: "prompt-12",
    name: "ePLD-v2",
    category: "ePLD",
    accuracy: 94.3,
    status: "active",
    lastTested: "3 hours ago",
    createdAt: "2025-04-14",
    testsRun: 48,
    content: `Extract electronic Proof of Delivery (ePLD) requirements and specifications.

Return JSON format:
{
  "epldRequirements": {
    "mandatory": "boolean",
    "format": "string",
    "deliveryMethod": "string"
  },
  "signatureRequirements": {
    "required": "boolean",
    "type": "string",
    "authorization": "string"
  },
  "documentationNeeded": ["string"],
  "deliveryConfirmation": {
    "timeframe": "string",
    "method": "string",
    "recipients": ["string"]
  }
}

Look for ePLD requirements, signature specifications, delivery confirmation processes.`,
  },
]

const categories = [
  "Eligible accounts",
  "Incentive base discounts",
  "Tier",
  "Minimums",
  "Service adjustments",
  "Accessorials",
  "ePLD",
]

export function PromptWorkspace() {
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newPromptDialogOpen, setNewPromptDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories)

  const filteredPrompts = promptsData.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const promptsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = filteredPrompts.filter((prompt) => prompt.category === category)
      return acc
    },
    {} as Record<string, typeof promptsData>,
  )

  const handleEditPrompt = (prompt: any) => {
    setEditingPrompt({ ...prompt })
    setEditDialogOpen(true)
  }

  const handleNewPrompt = () => {
    setNewPromptDialogOpen(true)
  }

  const handlePromptClick = (prompt: any) => {
    setSelectedPrompt(prompt)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const getCategoryStats = (category: string) => {
    const categoryPrompts = promptsByCategory[category]
    const activePrompts = categoryPrompts.filter((p) => p.status === "active")
    const avgAccuracy =
      categoryPrompts.length > 0 ? categoryPrompts.reduce((sum, p) => sum + p.accuracy, 0) / categoryPrompts.length : 0

    return {
      total: categoryPrompts.length,
      active: activePrompts.length,
      avgAccuracy: avgAccuracy.toFixed(1),
    }
  }

  return (
    <div className="flex h-full">
      {/* Main Prompt Library */}
      <div className={`transition-all duration-300 ${selectedPrompt ? "w-2/3" : "w-full"}`}>
        <Card className="glass-card border-0 h-full">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">Prompt Library</CardTitle>
                <CardDescription className="text-gray-400">
                  Organize and manage prompts by extraction category
                </CardDescription>
              </div>
              <Button onClick={handleNewPrompt} className="bg-emerald-600 hover:bg-emerald-700 border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search prompts across all categories..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {categories.map((category) => {
                const stats = getCategoryStats(category)
                const isExpanded = expandedCategories.includes(category)
                const categoryPrompts = promptsByCategory[category]

                return (
                  <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                    <Card className="glass-card border-white/10">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-semibold text-white">{category}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  {stats.total} prompts
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                >
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
                            <div className="text-gray-400">{isExpanded ? "−" : "+"}</div>
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
                                        <h4 className="font-semibold text-white text-sm">{prompt.name}</h4>
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
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-white hover:bg-white/10"
                                          >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Duplicate
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-white hover:bg-white/10"
                                          >
                                            <Play className="mr-2 h-4 w-4" />
                                            Test
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-red-400 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className="flex items-center gap-1 text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        <span>{prompt.lastTested}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-gray-400">
                                        <Target className="h-3 w-3" />
                                        <span>{prompt.testsRun} tests</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-emerald-400">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>{prompt.accuracy}%</span>
                                      </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="text-xs text-gray-500 line-clamp-2">
                                      {prompt.content.substring(0, 100)}...
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
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
                  <CardTitle className="text-lg text-white">{selectedPrompt.name}</CardTitle>
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
                    <div className="text-2xl font-bold text-white">{selectedPrompt.testsRun}</div>
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
                    <span className="text-white">{selectedPrompt.lastTested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{selectedPrompt.createdAt}</span>
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
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button size="sm" className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 border-0">
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>Make changes to your prompt and test the improvements.</DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={editingPrompt.category}
                  onValueChange={(value) => setEditingPrompt({ ...editingPrompt, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  className="col-span-3 min-h-[400px] font-mono text-sm resize-y"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test Changes
            </Button>
            <Button onClick={() => setEditDialogOpen(false)}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewPromptDialog open={newPromptDialogOpen} onOpenChange={setNewPromptDialogOpen} />
    </div>
  )
}
