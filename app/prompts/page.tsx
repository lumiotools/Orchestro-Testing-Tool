import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PromptLibrary } from "@/components/prompt-library"
import { Plus } from "lucide-react"

export default function PromptsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Prompt Library</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Categories</TabsTrigger>
          <TabsTrigger value="eligible">Eligible accounts</TabsTrigger>
          <TabsTrigger value="incentive">Incentive discounts</TabsTrigger>
          <TabsTrigger value="tier">Tier</TabsTrigger>
          <TabsTrigger value="minimums">Minimums</TabsTrigger>
          <TabsTrigger value="service">Service adjustments</TabsTrigger>
          <TabsTrigger value="accessorials">Accessorials</TabsTrigger>
          <TabsTrigger value="epld">ePLD</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Prompts</CardTitle>
              <CardDescription>Manage and test prompts for all extraction categories</CardDescription>
            </CardHeader>
            <CardContent>
              <PromptLibrary />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
