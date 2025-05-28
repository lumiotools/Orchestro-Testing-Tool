import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractsList } from "@/components/contracts-list"
import { Upload } from "lucide-react"

export default function ContractsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Contract
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contract Library</CardTitle>
          <CardDescription>Manage and view all contracts used for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <ContractsList />
        </CardContent>
      </Card>
    </div>
  )
}
