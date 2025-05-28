import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const categories = [
  {
    name: "Eligible accounts",
    accuracy: 89.2,
    status: "good",
    bestPrompt: "EligibleAccounts-v4",
  },
  {
    name: "Incentive base discounts",
    accuracy: 76.8,
    status: "medium",
    bestPrompt: "IncentiveDiscounts-v2",
  },
  {
    name: "Tier",
    accuracy: 92.1,
    status: "good",
    bestPrompt: "Tier-v3",
  },
  {
    name: "Minimums",
    accuracy: 81.5,
    status: "good",
    bestPrompt: "Minimums-v5",
  },
  {
    name: "Service adjustments",
    accuracy: 73.2,
    status: "medium",
    bestPrompt: "ServiceAdjustments-v1",
  },
  {
    name: "Accessorials",
    accuracy: 87.6,
    status: "good",
    bestPrompt: "Accessorials-v3",
  },
  {
    name: "ePLD",
    accuracy: 94.3,
    status: "good",
    bestPrompt: "ePLD-v2",
  },
]

export function CategoryAccuracyTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Accuracy</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Best Prompt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.name}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>{category.accuracy}%</TableCell>
            <TableCell>
              <Badge
                variant={
                  category.status === "good" ? "default" : category.status === "medium" ? "secondary" : "destructive"
                }
                className={
                  category.status === "good" ? "bg-emerald-500" : category.status === "medium" ? "bg-amber-500" : ""
                }
              >
                {category.status === "good" ? "Good" : category.status === "medium" ? "Needs Improvement" : "Poor"}
              </Badge>
            </TableCell>
            <TableCell>{category.bestPrompt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
