"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Download, MoreHorizontal, FileText, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const contractsData = [
  {
    id: "C-001",
    name: "Supply Agreement - ABC Corp",
    type: "Supply",
    status: "Processed",
    pages: 12,
    uploadedAt: "2025-04-15",
    accuracy: { pricing: 95, delivery: 88, payment: 92 },
  },
  {
    id: "C-002",
    name: "Distribution Contract - XYZ Inc",
    type: "Distribution",
    status: "Processed",
    pages: 18,
    uploadedAt: "2025-04-14",
    accuracy: { pricing: 87, delivery: 94, payment: 89 },
  },
  {
    id: "C-003",
    name: "Service Agreement - 123 Services",
    type: "Service",
    status: "Processed",
    pages: 8,
    uploadedAt: "2025-04-12",
    accuracy: { pricing: 92, delivery: 85, payment: 91 },
  },
  {
    id: "C-004",
    name: "Purchase Order - Acme Supplies",
    type: "Purchase",
    status: "Processed",
    pages: 5,
    uploadedAt: "2025-04-10",
    accuracy: { pricing: 98, delivery: 92, payment: 95 },
  },
]

export function ContractViewer() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)

  const filteredContracts = contractsData.filter(
    (contract) =>
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract)
    setViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Test Contract Library</h3>
          <p className="text-sm text-muted-foreground">Manage contracts used for prompt testing and validation</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Contract
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
                placeholder="Search contracts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredContracts.length} contracts</span>
              <span>•</span>
              <span>{filteredContracts.reduce((acc, c) => acc + c.pages, 0)} total pages</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contracts</CardTitle>
          <CardDescription>View and manage your test contract collection</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Accuracy Scores</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contract.name}</div>
                      <div className="text-sm text-muted-foreground">{contract.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{contract.type}</Badge>
                  </TableCell>
                  <TableCell>{contract.pages}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          contract.accuracy.pricing >= 90
                            ? "border-emerald-500 text-emerald-500"
                            : "border-amber-500 text-amber-500"
                        }`}
                      >
                        P: {contract.accuracy.pricing}%
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          contract.accuracy.delivery >= 90
                            ? "border-emerald-500 text-emerald-500"
                            : "border-amber-500 text-amber-500"
                        }`}
                      >
                        D: {contract.accuracy.delivery}%
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          contract.accuracy.payment >= 90
                            ? "border-emerald-500 text-emerald-500"
                            : "border-amber-500 text-amber-500"
                        }`}
                      >
                        Pay: {contract.accuracy.payment}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{contract.uploadedAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewContract(contract)}>
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

      {/* Contract Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContract?.name}</DialogTitle>
            <DialogDescription>Contract ID: {selectedContract?.id}</DialogDescription>
          </DialogHeader>
          {selectedContract && (
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
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{selectedContract.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pages:</span>
                        <span className="font-medium">{selectedContract.pages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span className="font-medium">{selectedContract.uploadedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                          {selectedContract.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Accuracy Scores</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Pricing Extraction</span>
                        <Badge
                          variant="outline"
                          className={
                            selectedContract.accuracy.pricing >= 90
                              ? "border-emerald-500 text-emerald-500"
                              : "border-amber-500 text-amber-500"
                          }
                        >
                          {selectedContract.accuracy.pricing}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Delivery Terms</span>
                        <Badge
                          variant="outline"
                          className={
                            selectedContract.accuracy.delivery >= 90
                              ? "border-emerald-500 text-emerald-500"
                              : "border-amber-500 text-amber-500"
                          }
                        >
                          {selectedContract.accuracy.delivery}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm">Payment Terms</span>
                        <Badge
                          variant="outline"
                          className={
                            selectedContract.accuracy.payment >= 90
                              ? "border-emerald-500 text-emerald-500"
                              : "border-amber-500 text-amber-500"
                          }
                        >
                          {selectedContract.accuracy.payment}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="extractions" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Pricing Information</h4>
                    <div className="rounded-md bg-muted p-4 text-sm">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(
                          {
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
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Delivery Terms</h4>
                    <div className="rounded-md bg-muted p-4 text-sm">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(
                          {
                            deliveryMethod: "Ground Shipping",
                            timeframe: "30 days",
                            shippingTerms: "FOB Origin",
                            specialInstructions: "Deliver to loading dock only",
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
                    { prompt: "Pricing-v3", accuracy: 95, date: "2 hours ago" },
                    { prompt: "Pricing-v2", accuracy: 87, date: "1 day ago" },
                    { prompt: "Pricing-v1", accuracy: 82, date: "3 days ago" },
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
