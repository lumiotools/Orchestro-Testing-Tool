"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, MoreHorizontal, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const contractsData = [
  {
    id: "C-001",
    name: "Supply Agreement - ABC Corp",
    type: "Supply",
    status: "Processed",
    pages: 12,
    uploadedAt: "2025-04-15",
  },
  {
    id: "C-002",
    name: "Distribution Contract - XYZ Inc",
    type: "Distribution",
    status: "Processed",
    pages: 18,
    uploadedAt: "2025-04-14",
  },
  {
    id: "C-003",
    name: "Service Agreement - 123 Services",
    type: "Service",
    status: "Processed",
    pages: 8,
    uploadedAt: "2025-04-12",
  },
  {
    id: "C-004",
    name: "Purchase Order - Acme Supplies",
    type: "Purchase",
    status: "Processed",
    pages: 5,
    uploadedAt: "2025-04-10",
  },
  {
    id: "C-005",
    name: "Vendor Agreement - Global Vendors",
    type: "Vendor",
    status: "Processed",
    pages: 15,
    uploadedAt: "2025-04-08",
  },
  {
    id: "C-006",
    name: "Logistics Contract - Fast Shipping",
    type: "Logistics",
    status: "Processed",
    pages: 10,
    uploadedAt: "2025-04-05",
  },
  {
    id: "C-007",
    name: "Manufacturing Agreement - Factory Inc",
    type: "Manufacturing",
    status: "Processed",
    pages: 22,
    uploadedAt: "2025-04-03",
  },
  {
    id: "C-008",
    name: "Retail Distribution - Stores Ltd",
    type: "Distribution",
    status: "Processed",
    pages: 14,
    uploadedAt: "2025-04-01",
  },
]

export function ContractsList() {
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">{contract.id}</TableCell>
              <TableCell>{contract.name}</TableCell>
              <TableCell>{contract.type}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                  {contract.status}
                </Badge>
              </TableCell>
              <TableCell>{contract.pages}</TableCell>
              <TableCell>{contract.uploadedAt}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>{selectedContract?.name}</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center h-80 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-medium">{selectedContract.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{selectedContract.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="font-medium">{selectedContract.pages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span className="font-medium">{selectedContract.uploadedAt}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Extracted Data</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Pricing</h4>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
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
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Delivery Terms</h4>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            deliveryMethod: "Ground Shipping",
                            deliveryTimeframe: "30 days",
                            shippingTerms: "FOB Origin",
                            specialInstructions: "Deliver to loading dock only",
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Payment Terms</h4>
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            paymentMethod: "Wire Transfer",
                            paymentDue: "Net 30",
                            latePaymentPenalty: "1.5% per month",
                            earlyPaymentDiscount: "2% if paid within 10 days",
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
