"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Plus, Play, BarChart3, FileText, Receipt, BookOpen, FileCheck, Folder, Settings } from "lucide-react"
import { PromptWorkspace } from "@/components/prompt-workspace"
import { PromptManager } from "@/components/prompt-manager"
import { AccuracyTester } from "@/components/accuracy-tester"
import { ResultsVisualization } from "@/components/results-visualization"
import { DocumentViewer } from "@/components/document-viewer"
import { OverviewDashboard } from "@/components/overview-dashboard"
import { NewPromptDialog } from "@/components/new-prompt-dialog"

const documentTypes = [
  {
    id: "contracts",
    name: "Contracts",
    icon: FileText,
    description: "Legal agreements and contracts",
    categories: [
      "Eligible accounts",
      "Incentive base discounts",
      "Tier",
      "Minimums",
      "Service adjustments",
      "Accessorials",
      "ePLD",
    ],
  },
  {
    id: "invoices",
    name: "Invoices",
    icon: Receipt,
    description: "Bills and payment documents",
    categories: [
      "Invoice details",
      "Line items",
      "Tax information",
      "Payment terms",
      "Vendor information",
      "Billing address",
      "Due dates",
    ],
  },
  {
    id: "service-guides",
    name: "Service Guides",
    icon: BookOpen,
    description: "Technical documentation and manuals",
    categories: [
      "Installation steps",
      "Troubleshooting",
      "Specifications",
      "Safety requirements",
      "Maintenance procedures",
      "Warranty information",
      "Contact details",
    ],
  },
  {
    id: "compliance",
    name: "Compliance Documents",
    icon: FileCheck,
    description: "Regulatory and compliance documentation",
    categories: [
      "Regulatory requirements",
      "Compliance standards",
      "Audit findings",
      "Risk assessments",
      "Certification details",
      "Expiration dates",
      "Responsible parties",
    ],
  },
]

export function PromptEngineerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDocumentType, setSelectedDocumentType] = useState("contracts")
  const [newPromptDialogOpen, setNewPromptDialogOpen] = useState(false)

  const currentDocType = documentTypes.find((dt) => dt.id === selectedDocumentType)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-header sticky top-0 z-50">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap className="h-6 w-6 text-emerald-400 glow-emerald" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Document Intelligence Centre
            </span>
            <span className="text-sm text-muted-foreground ml-2">AI-Powered Document Analysis Platform</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Document Type Selector */}
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-gray-400" />
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  {documentTypes.map((docType) => (
                    <SelectItem key={docType.id} value={docType.id} className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <docType.icon className="h-4 w-4" />
                        {docType.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-emerald-400 font-medium">Avg Accuracy: 84.2%</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                <span className="text-blue-400 font-medium">47 Active Prompts</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                <span className="text-amber-400 font-medium">1,247 Documents</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Type Info Bar */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          {currentDocType && (
            <>
              <currentDocType.icon className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="font-medium text-white">{currentDocType.name}</span>
                <span className="text-sm text-gray-400 ml-2">{currentDocType.description}</span>
              </div>
              <div className="ml-auto text-sm text-gray-400">
                {currentDocType.categories.length} extraction categories available
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="workspace" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompt Workspace
              </TabsTrigger>
              <TabsTrigger value="prompt-manager" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Prompt Manager
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Accuracy Testing
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Results & Analytics
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Library
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab !== "prompt-manager" && (
                <Button variant="outline" size="sm" onClick={() => setNewPromptDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Prompt
                </Button>
              )}
              <Button size="sm">
                <Play className="h-4 w-4 mr-2" />
                Quick Test
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <OverviewDashboard documentType={selectedDocumentType} />
          </TabsContent>

          <TabsContent value="workspace" className="space-y-6">
            <PromptWorkspace />
          </TabsContent>

          <TabsContent value="prompt-manager" className="space-y-6">
            <PromptManager documentType={selectedDocumentType} />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <AccuracyTester />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsVisualization />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentViewer documentType={selectedDocumentType} />
          </TabsContent>
        </Tabs>
      </div>

      <NewPromptDialog
        open={newPromptDialogOpen}
        onOpenChange={setNewPromptDialogOpen}
      />
    </div>
  )
}
