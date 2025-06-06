"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TableCategory {
  similarityScore: number
  message: string
  actualRows: number
  expectedRows: number
  missingRows: number
  extraRows: number
  missingRowDetails?: any[]
  extraRowDetails?: any[]
  lowSimilarityDetails?: any[]
  serviceComparison?: {
    missing: Array<{ 
      service: string
      account_number?: string
      name?: string
      base_service_name?: string | null
      package_type?: string | null
      shipment_type?: string | null
      payment_type?: string | null
    }> 
    extra: Array<{ 
      service: string
      account_number?: string
      name?: string
      base_service_name?: string | null
      package_type?: string | null
      shipment_type?: string | null
      payment_type?: string | null
    }>
    differences: Array<{
      service: string
      account_number?: string
      name?: string
      base_service_name?: string | null
      package_type?: string | null
      shipment_type?: string | null
      payment_type?: string | null
      differences: Array<{
        field: string
        actual: any
        expected: any
        similarity: number
      }>
    }>
  }
}

interface TableCategoryMetricsProps {
  tableCategories?: Record<string, TableCategory>
  similarityIndex: number
  rowSimilarity: number
  completeness: number
}

export function TableCategoryMetrics({
  tableCategories,
  similarityIndex,
  rowSimilarity,
  completeness,
}: TableCategoryMetricsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  if (!tableCategories || typeof tableCategories !== 'object') {
    return (
      <div className="space-y-6">
        <div className="bg-muted rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">Overall Table Category Similarity</span>
            <span className="text-xl font-medium">{(similarityIndex ?? 0).toFixed(2)}%</span>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-sm">
            <p className="text-yellow-800 dark:text-yellow-300">No table category data available for comparison.</p>
            <p className="text-yellow-700 dark:text-yellow-200 text-xs mt-2">
              This usually means one or both files don't have a 'tables' property, or the tables are empty.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const tableKeys = Object.keys(tableCategories);
  const hasData = tableKeys.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="bg-muted rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg">Overall Table Category Similarity</span>
            <span className="text-xl font-medium">{(similarityIndex ?? 0).toFixed(2)}%</span>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded p-3 text-sm">
            <p className="text-yellow-800 dark:text-yellow-300">Table categories object exists but is empty.</p>
            <p className="text-yellow-700 dark:text-yellow-200 text-xs mt-2">
              This means the comparison ran but found no matching table categories between the files.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const toggleExpansion = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const sortedCategories = Object.keys(tableCategories).sort((a, b) => {
    return (tableCategories[b]?.similarityScore ?? 0) - (tableCategories[a]?.similarityScore ?? 0)
  })

  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  }

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return "null"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="space-y-6">
      {/* Overall Table Category Similarity */}
      <div className="bg-muted rounded p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg">Overall Table Category Similarity</span>
          <span className="text-xl font-medium">{(similarityIndex ?? 0).toFixed(2)}%</span>
        </div>
        <Progress
          value={similarityIndex ?? 0}
          className="h-2 mb-2"
        />
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">Row Similarity (40%): </span>
            <span>{(rowSimilarity ?? 0).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Completeness (30%): </span>
            <span>{(completeness ?? 0).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Table Presence (30%): </span>
            <span>
              {Object.values(tableCategories).filter((cat) => cat.actualRows > 0).length} of {sortedCategories.length}{" "}
              tables
            </span>
          </div>
        </div>
      </div>

      {/* Explanation of comparison */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 dark:text-blue-300 mb-1">Comparison Methodology:</p>
          <ul className="list-disc pl-5 text-xs space-y-1 text-blue-700 dark:text-blue-200">
            <li>
              <strong>Missing Services</strong>: Services present in Ground Truth but missing in Extracted JSON
            </li>
            <li>
              <strong>Extra Services</strong>: Services present in Extracted JSON but not in Ground Truth
            </li>
            <li>
              <strong>Differences</strong>: Services present in both files but with different field values
            </li>
          </ul>
        </div>
      </div>

      {/* Individual Table Categories */}
      <div className="grid grid-cols-1 gap-4">
        {sortedCategories.map((category) => {
          const { similarityScore, message, actualRows, expectedRows, missingRows, extraRows, serviceComparison } =
            tableCategories[category]

          const formattedCategory = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          const isExpanded = expandedCategories[category] || false

          const hasMissingServices = serviceComparison?.missing && serviceComparison.missing.length > 0
          const hasExtraServices = serviceComparison?.extra && serviceComparison.extra.length > 0
          const hasDifferences = serviceComparison?.differences && serviceComparison.differences.length > 0
          const hasDetails = hasMissingServices || hasExtraServices || hasDifferences

          const issueCount =
            (serviceComparison?.missing?.length || 0) +
            (serviceComparison?.extra?.length || 0) +
            (serviceComparison?.differences?.length || 0)

          return (
            <div key={category} className="bg-muted rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-md">{formattedCategory}</span>
                <span className="text-lg font-medium">{(similarityScore ?? 0).toFixed(2)}%</span>
              </div>
              <Progress
                value={similarityScore ?? 0}
                className="h-2 mb-2"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <div className="text-xs">
                  <span className="text-muted-foreground">Status: </span>
                  <span className={message === "Success" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>{message}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Ground Truth Rows: </span>
                  <span>{actualRows}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Extracted Rows: </span>
                  <span>{expectedRows}</span>
                </div>
                {missingRows > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Missing Rows: </span>
                    <span className="text-red-600 dark:text-red-400">{missingRows}</span>
                  </div>
                )}
                {extraRows > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Extra Rows: </span>
                    <span className="text-yellow-600 dark:text-yellow-400">{extraRows}</span>
                  </div>
                )}
                {issueCount > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Issues Found: </span>
                    <span className="text-amber-600 dark:text-amber-400">{issueCount}</span>
                  </div>
                )}
              </div>

              {/* Service Comparison Dropdown */}
              {hasDetails && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex justify-between items-center text-xs"
                    onClick={() => toggleExpansion(category)}
                  >
                    <span>
                      {isExpanded ? "Hide" : "Show"} Comparison Details
                      {!isExpanded && issueCount > 0 && (
                        <span className="ml-2 bg-amber-600 text-white px-1.5 py-0.5 rounded-full text-xs">
                          {issueCount}
                        </span>
                      )}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {isExpanded && (
                    <div className="mt-2 border rounded overflow-hidden">
                      <div className="p-3 bg-muted text-sm font-medium">Comparison Details</div>
                      <div className="p-3 space-y-4">
                        {/* Missing Services */}
                        {hasMissingServices && (
                          <div>
                            <h6 className="text-xs text-muted-foreground mb-2 flex items-center">
                              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                              {category === "eligible_accounts" ? "Missing Accounts" : "Missing Services"} ({serviceComparison?.missing.length})
                              <span className="ml-2 text-red-600 dark:text-red-400 font-normal">
                                (In Ground Truth but missing in Extracted)
                              </span>
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {serviceComparison?.missing.map((item, idx) => (
                                <div key={`missing-${idx}`} className="p-2 bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded text-xs">
                                  {category === "eligible_accounts" 
                                    ? `${item.account_number || "N/A"} - ${item.name || "N/A"}`
                                    : (
                                      <>
                                        <div className="font-medium">{item.service || "N/A"}</div>
                                      </>
                                    )
                                  }
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extra Services */}
                        {hasExtraServices && (
                          <div>
                            <h6 className="text-xs text-muted-foreground mb-2 flex items-center">
                              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                              {category === "eligible_accounts" ? "Extra Accounts" : "Extra Services"} ({serviceComparison?.extra.length})
                              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-normal">
                                (In Extracted but not in Ground Truth)
                              </span>
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {serviceComparison?.extra.map((item, idx) => (
                                <div
                                  key={`extra-${idx}`}
                                  className="p-2 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded text-xs"
                                >
                                  {category === "eligible_accounts" 
                                    ? `${item.account_number || "N/A"} - ${item.name || "N/A"}`
                                    : (
                                      <>
                                        <div className="font-medium">{item.service || "N/A"}</div>
                                      </>
                                    )
                                  }
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Low Similarity Services with Field Differences */}
                        {hasDifferences && (
                          <div>
                            <h6 className="text-xs text-muted-foreground mb-2 flex items-center">
                              <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                              {category === "eligible_accounts" ? "Accounts with Differences" : "Services with Differences"} ({serviceComparison?.differences.length})
                              <span className="ml-2 text-amber-600 dark:text-amber-400 font-normal">
                                (Present in both but with different values)
                              </span>
                            </h6>
                            <div className="space-y-3">
                              {serviceComparison?.differences.map((item, idx) => (
                                <div key={`diff-${idx}`} className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded text-xs">
                                  <div className="font-medium mb-2">
                                    {category === "eligible_accounts" 
                                      ? `Account: ${item.account_number || item.service || "N/A"} - ${item.name || "N/A"}`
                                      : (
                                        <>
                                          <div className="font-medium">Service: {item.service || "N/A"}</div>
                                        </>
                                      )
                                    }
                                  </div>
                                  <div className="space-y-2">
                                    {item.differences.map((diff, diffIdx) => (
                                      <div
                                        key={`field-${diffIdx}`}
                                        className="grid grid-cols-3 gap-2 border-t border-amber-200 dark:border-amber-900/50 pt-2"
                                      >
                                        <div className="font-medium">{formatFieldName(diff.field)}:</div>
                                        <div>
                                          <span className="text-muted-foreground">Extracted:</span>{" "}
                                          <span className="text-green-700 dark:text-green-300">{formatValue(diff.expected)}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Ground Truth:</span>{" "}
                                          <span className="text-red-700 dark:text-red-300">{formatValue(diff.actual)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No issues message */}
                        {!hasMissingServices && !hasExtraServices && !hasDifferences && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            No comparison issues found. All services match correctly.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 