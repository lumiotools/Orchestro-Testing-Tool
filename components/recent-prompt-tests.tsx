import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

const recentTests = [
  {
    id: "PT-001",
    promptName: "EligibleAccounts-v4",
    category: "Eligible accounts",
    accuracy: 89.2,
    contracts: 50,
    date: new Date(2025, 4, 22, 14, 30),
  },
  {
    id: "PT-002",
    promptName: "IncentiveDiscounts-v2",
    category: "Incentive base discounts",
    accuracy: 76.8,
    contracts: 50,
    date: new Date(2025, 4, 22, 12, 15),
  },
  {
    id: "PT-003",
    promptName: "Tier-v3",
    category: "Tier",
    accuracy: 92.1,
    contracts: 50,
    date: new Date(2025, 4, 22, 10, 45),
  },
  {
    id: "PT-004",
    promptName: "Minimums-v5",
    category: "Minimums",
    accuracy: 81.5,
    contracts: 50,
    date: new Date(2025, 4, 21, 16, 30),
  },
  {
    id: "PT-005",
    promptName: "ServiceAdjustments-v1",
    category: "Service adjustments",
    accuracy: 73.2,
    contracts: 50,
    date: new Date(2025, 4, 21, 14, 0),
  },
]

export function RecentPromptTests() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Prompt</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Accuracy</TableHead>
          <TableHead>Contracts</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentTests.map((test) => (
          <TableRow key={test.id}>
            <TableCell className="font-medium">{test.id}</TableCell>
            <TableCell>{test.promptName}</TableCell>
            <TableCell>{test.category}</TableCell>
            <TableCell>
              <Badge
                variant={test.accuracy >= 90 ? "default" : test.accuracy >= 80 ? "secondary" : "destructive"}
                className={test.accuracy >= 90 ? "bg-emerald-500" : test.accuracy >= 80 ? "bg-amber-500" : ""}
              >
                {test.accuracy}%
              </Badge>
            </TableCell>
            <TableCell>{test.contracts}</TableCell>
            <TableCell>{formatDistanceToNow(test.date, { addSuffix: true })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
