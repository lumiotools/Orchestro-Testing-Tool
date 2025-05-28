import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccuracyTester } from "@/components/accuracy-tester"
import { AccuracyComparison } from "@/components/accuracy-comparison"
import { Play } from "lucide-react"

export default function AccuracyPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Accuracy Testing</h2>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run New Test
        </Button>
      </div>
      <Tabs defaultValue="tester" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tester">Accuracy Tester</TabsTrigger>
          <TabsTrigger value="comparison">Prompt Comparison</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>
        <TabsContent value="tester" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Prompt Accuracy</CardTitle>
              <CardDescription>Select a prompt and category to test accuracy against ground truth data</CardDescription>
            </CardHeader>
            <CardContent>
              <AccuracyTester />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Prompt Performance</CardTitle>
              <CardDescription>Compare accuracy of different prompts for the same category</CardDescription>
            </CardHeader>
            <CardContent>
              <AccuracyComparison />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
