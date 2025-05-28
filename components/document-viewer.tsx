"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Download, MoreHorizontal, FileText, Upload, Receipt, BookOpen, FileCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const documentData = {
  contracts: [
    {
      id: "C-001",
      name: "Supply Agreement - ABC Corp",
      type: "Supply Contract",
      status: "Processed",
      pages: 12,
      uploadedAt: "2025-04-15",
      accuracy: { pricing: 95, delivery: 88, payment: 92 },
    },
    {
      id: "C-002",
      name: "Distribution Contract - XYZ Inc",
      type: "Distribution Contract",
      status: "Processed",
      pages: 18,
      uploadedAt: "2025-04-14",
      accuracy: { pricing: 87, delivery: 94, payment: 89 },
    },
  ],
  invoices: [
    {
      id: "I-001",
      name: "Invoice #INV-2024-001",
      type: "Service Invoice",
      status: "Processed",
      pages: 2,
      uploadedAt: "2025-04-20",
      accuracy: { details: 98, lineItems: 95, tax: 92 },
    },
    {
      id: "I-002",
      name: "Invoice #INV-2024-002",
      type: "Product Invoice",
      status: "Processed",
      pages: 3,
      uploadedAt: "2025-04-19",
      accuracy: { details: 94, lineItems: 89, tax: 96 },
    },
  ],
  "service-guides": [
    {
      id: "SG-001",
      name: "Installation Guide - Model X200",
      type: "Installation Manual",
      status: "Processed",
      pages: 24,
      uploadedAt: "2025-04-18",
      accuracy: { steps: 91, specs: 88, safety: 95 },
    },
    {
      id: "SG-002",
      name: "Troubleshooting Guide - Series Y",
      type: "Technical Manual",
      status: "Processed",
      pages: 16,
      uploadedAt: "2025-04-17",
      accuracy: { steps: 87, specs: 92, safety: 89 },
    },
  ],
  compliance: [
    {
      id: "CD-001",
      name: "ISO 9001 Audit Report",
      type: "Audit Document",
      status: "Processed",
      pages: 8,
      uploadedAt: "2025-04-16",
      accuracy: { requirements: 93, findings: 89, dates: 97 },
    },
  ],
}

interface DocumentViewerProps {
  documentType: string
}

export function DocumentViewer({ documentType }: DocumentViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  const documents = documentData[documentType as keyof typeof documentData] || []

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
    setViewDialogOpen(true)
  }

  const getDocumentIcon = (docType: string) => {
    if (documentType === "contracts") return <FileText className="h-16 w-16 text-muted-foreground" />
    if (documentType === "invoices") return <Receipt className="h-16 w-16 text-muted-foreground" />
    if (documentType === "service-guides") return <BookOpen className="h-16 w-16 text-muted-foreground" />
    if (documentType === "compliance") return <FileCheck className="h-16 w-16 text-muted-foreground" />
    return <FileText className="h-16 w-16 text-muted-foreground" />
  }

  const getDocumentTypeLabel = () => {
    const typeMap = {
      contracts: "Contracts",
      invoices: "Invoices",
      "service-guides": "Service Guides",
      compliance: "Compliance Documents",
    }
    return typeMap[documentType as keyof typeof typeMap] || "Documents"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Document Library - {getDocumentTypeLabel()}</h3>
          <p className="text-sm text-muted-foreground">Manage documents used for prompt testing and validation</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search ${getDocumentTypeLabel().toLowerCase()}...`}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredDocuments.length} documents</span>
              <span>•</span>
              <span>{filteredDocuments.reduce((acc, c) => acc + c.pages, 0)} total pages</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getDocumentTypeLabel()}</CardTitle>
          <CardDescription>View and manage your document collection</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Accuracy Scores</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.name}</div>
                      <div className="text-sm text-muted-foreground">{document.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.type}</Badge>
                  </TableCell>
                  <TableCell>{document.pages}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {Object.entries(document.accuracy).map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className={`text-xs ${
                            value >= 90 ? "border-emerald-500 text-emerald-500" : "border-amber-500 text-amber-500"
                          }`}
                        >
                          {key.substring(0, 3)}: {value}%
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{document.uploadedAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
            <DialogDescription>Document ID: {selectedDocument?.id}</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="extractions">Extractions</TabsTrigger>
                <TabsTrigger value="testing">Test History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-60 bg-muted rounded-md">
                      {getDocumentIcon(documentType)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{selectedDocument.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pages:</span>
                        <span className="font-medium">{selectedDocument.pages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span className="font-medium">{selectedDocument.uploadedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                          {selectedDocument.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Accuracy Scores</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedDocument.accuracy).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <Badge
                            variant="outline"
                            className={
                              value >= 90 ? "border-emerald-500 text-emerald-500" : "border-amber-500 text-amber-500"
                            }
                          >
                            {value}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="extractions" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Extracted Data</h4>
                    <div className="rounded-md bg-muted p-4 text-sm">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(
                          documentType === "invoices"
                            ? {
                                invoiceNumber: "INV-2024-001",
                                date: "2024-04-20",
                                vendor: "ABC Services Inc",
                                amount: "$2,500.00",
                                lineItems: [
                                  { description: "Consulting Services", amount: "$2,000.00" },
                                  { description: "Travel Expenses", amount: "$500.00" },
                                ],
                                tax: "$250.00",
                                total: "$2,750.00",
                              }
                            : documentType === "service-guides"
                              ? {
                                  title: "Installation Guide - Model X200",
                                  version: "v2.1",
                                  steps: ["Unpack components", "Connect power supply", "Configure network settings"],
                                  specifications: {
                                    power: "120V AC",
                                    dimensions: "24x18x6 inches",
                                    weight: "15 lbs",
                                  },
                                  safetyRequirements: ["Wear protective equipment", "Ensure proper ventilation"],
                                }
                              : {
                                  basePrice: "$10,000",
                                  currency: "USD",
                                  discounts: [
                                    { type: "Volume", amount: "5%" },
                                    { type: "Early Payment", amount: "2%" },
                                  ],
                                  paymentSchedule: [
                                    { date: "2025-05-01", amount: "$5,000" },
                                    { date: "2025-06-01", amount: "$5,000" },
                                  ],
                                },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="testing" className="space-y-4">
                <div className="space-y-3">
                  {[
                    { prompt: `${getDocumentTypeLabel()}-v3`, accuracy: 95, date: "2 hours ago" },
                    { prompt: `${getDocumentTypeLabel()}-v2`, accuracy: 87, date: "1 day ago" },
                    { prompt: `${getDocumentTypeLabel()}-v1`, accuracy: 82, date: "3 days ago" },
                  ].map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{test.prompt}</span>
                        <span className="text-xs text-muted-foreground">{test.date}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          test.accuracy >= 90
                            ? "border-emerald-500 text-emerald-500"
                            : "border-amber-500 text-amber-500"
                        }
                      >
                        {test.accuracy}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
