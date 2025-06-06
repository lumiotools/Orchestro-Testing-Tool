import { parseServiceName } from "./service-parser";
import { calculateRuleBasedSimilarity } from "./service-mapper";
// Weights for different fields based on the Python file
const FIELD_WEIGHTS = {
  service: 1.0, // Service is the most important
  billing: 0.9, // Billing is very important
  zone: 0.9, // Zone is very important
  weight: 0.9, // Weight is very important
  weightUnit: 0.8, // Weight unit is important
  discount: 0.9, // Discount is very important
  destination: 0.8, // Destination is important
  tags: 0.3, // Tags have lower weight
  incentive_base_discount: 1.0, // Highest importance
  tier_discount: 1.0, // Highest importance
  grace_earn_discount: 1.0, // Highest importance
  minimum_adjustment: 1.0, // Highest importance
  service_adjustment: 1.0, // Highest importance
}
// Table categories to specifically track
const TABLE_CATEGORIES = [
  "incentive_base_discount",
  "tier_discount",
  "grace_earn_discount",
  "minimum_adjustment",
  "service_adjustment",
  "accessorials",
  "electronic_pld",
  "eligible_accounts",
]
// Default weight for fields not in the list
const DEFAULT_WEIGHT = 0.5
// Calculate similarity between two values
function calculateValueSimilarity(actualValue: any, expectedValue: any): number {
  // Special handling for string "null" vs actual null values - CHECK THIS FIRST
  const isActualNull = actualValue === null || actualValue === "null" || actualValue === undefined;
  const isExpectedNull = expectedValue === null || expectedValue === "null" || expectedValue === undefined;
  if (isActualNull && isExpectedNull) {
    return 1.0;
  }
  // Handle remaining undefined cases (only if one is null/undefined and the other isn't)
  if (actualValue === undefined || actualValue === null || expectedValue === undefined || expectedValue === null) {
    return actualValue === expectedValue ? 1.0 : 0.0;
  }
  // Normalize strings for comparison
  const normalizeValue = (val: any) => {
    const str = String(val).trim();
    return str
      .replace(/\u00ae/g, "")  // Remove registered trademark ®
      .replace(/®/g, "")       // Remove registered trademark ® (alternative encoding)
      .replace(/\u2122/g, "")  // Remove trademark ™ (Unicode)
      .replace(/™/g, "")       // Remove trademark ™ 
      .replace(/TM/g, "")      // Remove TM text
      .replace(/\\n/g, " ")    // Replace escaped newlines
      .replace(/\n/g, " ")     // Replace newlines with spaces
      .replace(/\s+/g, " ")    // Normalize whitespace
      .replace(/\s*-\s*/g, "-") // Normalize spaces around hyphens
      .trim();
  };
  // Convert to strings for comparison
  const actualStr = normalizeValue(actualValue);
  const expectedStr = normalizeValue(expectedValue);
  // If they're exactly the same, return 1.0
  if (actualStr === expectedStr) {
    return 1.0
  }
  // For numeric values, try to parse and compare
  try {
    // Remove commas and percentage signs for numeric comparison
    const actualClean = actualStr.replace(/,/g, "").replace(/%/g, "")
    const expectedClean = expectedStr.replace(/,/g, "").replace(/%/g, "")
    // Check if they're numeric values
    const actualNum = Number.parseFloat(actualClean)
    const expectedNum = Number.parseFloat(expectedClean)
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      // If they're very close, consider them a match
      if (Math.abs(actualNum - expectedNum) < 0.01) {
        return 0.95
      }
      // Otherwise, calculate percentage difference
      if (expectedNum !== 0) {
        const diffPercent = Math.abs(actualNum - expectedNum) / Math.abs(expectedNum)
        // If within 5%, consider it a good match
        if (diffPercent < 0.05) {
          return 0.9
        }
        // If within 10%, consider it a moderate match
        else if (diffPercent < 0.1) {
          return 0.8
        }
        // If within 20%, consider it a weak match
        else if (diffPercent < 0.2) {
          return 0.6
        } else {
          return 0.3
        }
      }
      return 0.0
    }
  } catch (e) {
    // Not numeric, continue to string comparison
  }
  // Use string similarity for text
  return calculateStringSimilarity(actualStr, expectedStr)
}
// Calculate string similarity (similar to SequenceMatcher in Python)
function calculateStringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0
  if (a.length === 0 || b.length === 0) return 0.0
  // Normalize strings by removing special characters and converting to lowercase
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[®™©]/g, '') // Remove special characters
      .replace(/tm/gi, '')   // Remove TM regardless of case
      .replace(/\\n/g, ' ')  // Replace escaped newlines
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\s*-\s*/g, '-') // Normalize spaces around hyphens
      .trim()
  }
  const normalizedA = normalizeString(a)
  const normalizedB = normalizeString(b)
  if (normalizedA === normalizedB) return 1.0
  // Use Levenshtein distance for more accurate string similarity
  const longer = normalizedA.length > normalizedB.length ? normalizedA : normalizedB
  const shorter = normalizedA.length > normalizedB.length ? normalizedB : normalizedA
  // If the shorter string is empty, return 0
  if (shorter.length === 0) return 0.0
  // Calculate Levenshtein distance
  const matrix = Array(shorter.length + 1).fill(null).map(() => Array(longer.length + 1).fill(null))
  for (let i = 0; i <= shorter.length; i++) matrix[i][0] = i
  for (let j = 0; j <= longer.length; j++) matrix[0][j] = j
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  const distance = matrix[shorter.length][longer.length]
  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  // Calculate similarity score (1 - normalized distance)
  return 1 - distance / maxLength
}
// Get weight for a specific field
function getFieldWeight(fieldName: string): number {
  return FIELD_WEIGHTS[fieldName as keyof typeof FIELD_WEIGHTS] || DEFAULT_WEIGHT
}
// Compare row similarity with weighted fields and identify differences
function compareRowSimilarity(
  actualRow: any,
  expectedRow: any,
  tableName: string = ""
): {
  similarity: number
  fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }>
} {
  // Initialize field differences array
  const fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }> = []
  // Special handling for eligible_accounts
  if (tableName === "eligible_accounts") {
    // For eligible_accounts, use account_number as the key field
    if ("account_number" in actualRow && "account_number" in expectedRow) {
      const accountNumberSimilarity = calculateValueSimilarity(actualRow.account_number, expectedRow.account_number);
      // If account numbers match exactly, consider it a high match
      if (accountNumberSimilarity >= 0.9) {
        // Compare all fields and collect differences
        let totalWeight = 0.0;
        let totalWeightedSimilarity = 0.0;
        // Fields to compare in eligible_accounts
        const fieldsToCompare = ["account_number", "name", "address", "zip", "commodity_tier"];
        for (const field of fieldsToCompare) {
          const weight = 1.0; // Equal weight for all eligible_accounts fields
          totalWeight += weight;
          const actualValue = field in actualRow ? actualRow[field] : undefined;
          const expectedValue = field in expectedRow ? expectedRow[field] : undefined;
          const similarity = calculateValueSimilarity(actualValue, expectedValue);
          if (similarity < 0.8) {
            fieldDifferences.push({
              field,
              actual: actualValue,
              expected: expectedValue,
              similarity,
            });
          }
          totalWeightedSimilarity += similarity * weight;
        }
        const finalSimilarity = totalWeight > 0 ? totalWeightedSimilarity / totalWeight : 0.0;
        return { similarity: finalSimilarity, fieldDifferences };
      } else {
        // If account numbers don't match well, check if names match
        const nameSimilarity = "name" in actualRow && "name" in expectedRow ? 
          calculateValueSimilarity(actualRow.name, expectedRow.name) : 0;
        if (nameSimilarity >= 0.8) {
          // Similar logic as above but based on name match
          let totalWeight = 0.0;
          let totalWeightedSimilarity = 0.0;
          const fieldsToCompare = ["account_number", "name", "address", "zip", "commodity_tier"];
          for (const field of fieldsToCompare) {
            const weight = 1.0;
            totalWeight += weight;
            const actualValue = field in actualRow ? actualRow[field] : undefined;
            const expectedValue = field in expectedRow ? expectedRow[field] : undefined;
            const similarity = calculateValueSimilarity(actualValue, expectedValue);
            if (similarity < 0.8) {
              fieldDifferences.push({
                field,
                actual: actualValue,
                expected: expectedValue,
                similarity,
              });
            }
            totalWeightedSimilarity += similarity * weight;
          }
          const finalSimilarity = totalWeight > 0 ? totalWeightedSimilarity / totalWeight : 0.0;
          return { similarity: finalSimilarity, fieldDifferences };
        } else {
          // Neither account_number nor name match well
          fieldDifferences.push({
            field: "account_number",
            actual: actualRow.account_number,
            expected: expectedRow.account_number,
            similarity: accountNumberSimilarity,
          });
          if ("name" in actualRow && "name" in expectedRow) {
            fieldDifferences.push({
              field: "name",
              actual: actualRow.name,
              expected: expectedRow.name,
              similarity: nameSimilarity,
            });
          }
          return { similarity: 0.3, fieldDifferences }; // Low similarity if neither key field matches
        }
      }
    }
    // If we don't have account_number, fall back to generic comparison
    let totalWeight = 0.0;
    let totalWeightedSimilarity = 0.0;
    const allFields = [...new Set([...Object.keys(actualRow), ...Object.keys(expectedRow)])];
    for (const field of allFields) {
      const weight = 1.0;
      totalWeight += weight;
      const actualValue = field in actualRow ? actualRow[field] : undefined;
      const expectedValue = field in expectedRow ? expectedRow[field] : undefined;
      const similarity = calculateValueSimilarity(actualValue, expectedValue);
      if (similarity < 0.8) {
        fieldDifferences.push({
          field,
          actual: actualValue,
          expected: expectedValue,
          similarity,
        });
      }
      totalWeightedSimilarity += similarity * weight;
    }
    const finalSimilarity = totalWeight > 0 ? totalWeightedSimilarity / totalWeight : 0.0;
    return { similarity: finalSimilarity, fieldDifferences };
  }
  // Always use hybrid service mapping for service fields internally 
  if ("service" in actualRow && "service" in expectedRow) {
    // Parse service components for both rows
    const actualService = {
      ...parseServiceName(actualRow.service),
      table_name: tableName,
      billing: actualRow.billing || '',
      zone: actualRow.zone || '',
      tags: actualRow.tags || []
    };
    const expectedService = {
      ...parseServiceName(expectedRow.service),
      table_name: tableName,
      billing: expectedRow.billing || '',
      zone: expectedRow.zone || '',
      tags: expectedRow.tags || []
    };
    // Use rule-based similarity calculation directly
    const serviceSimilarity = calculateRuleBasedSimilarity(actualService, expectedService);
    if (serviceSimilarity < 0.8) {
      fieldDifferences.push({
        field: "service",
        actual: actualRow.service,
        expected: expectedRow.service,
        similarity: serviceSimilarity,
      });
    }
    // Return the service comparison result
    return {
      similarity: serviceSimilarity,
      fieldDifferences
    };
  }
  // Standard weighted field comparison (original algorithm)
  let totalWeight = 0.0
  let totalWeightedSimilarity = 0.0
  // Compare each field in the rows
  const allFields = new Set([
    ...Object.keys(actualRow || {}),
    ...Object.keys(expectedRow || {})
  ])
  for (const field of allFields) {
    // Special handling for table categories
    if (TABLE_CATEGORIES.includes(field)) {
      // Skip table categories in row comparison, will be handled separately
      continue
    }
    // Skip fields that are null in both rows
    if (
      (actualRow === null || actualRow[field] === null || actualRow[field] === undefined) &&
      (expectedRow === null || expectedRow[field] === null || expectedRow[field] === undefined)
    ) {
      continue
    }
    // Get the weight for this field
    const weight = getFieldWeight(field)
    totalWeight += weight
    // Get values to compare
    const actualValue = actualRow !== null && field in actualRow ? actualRow[field] : undefined
    const expectedValue = expectedRow !== null && field in expectedRow ? expectedRow[field] : undefined
    // Calculate similarity for this field
    const similarity = calculateValueSimilarity(actualValue, expectedValue)
    // Add weighted similarity to total
    totalWeightedSimilarity += similarity * weight
    // If similarity is low, add to differences
    if (similarity < 0.8) {
      fieldDifferences.push({
        field,
        actual: actualValue,
        expected: expectedValue,
        similarity,
      })
    }
  }
  // Calculate weighted average similarity
  const finalSimilarity = totalWeight > 0 ? totalWeightedSimilarity / totalWeight : 0.0
  return { similarity: finalSimilarity, fieldDifferences }
}
// Helper function to check if two services are equivalent based on their names and tags
function areServicesEquivalent(actualRow: any, expectedRow: any): boolean {
  // Parse service names using our new service parser
  const actualParsed = parseServiceName(actualRow.service);
  const expectedParsed = parseServiceName(expectedRow.service);
  // If base names are the same after parsing, it's a strong match
  if (actualParsed.base_service_name === expectedParsed.base_service_name && 
      actualParsed.base_service_name !== null) {
    return true;
  }
  // Check if shipment types match
  const shipmentTypeMatch = 
    actualParsed.shipment_type && 
    expectedParsed.shipment_type && 
    actualParsed.shipment_type === expectedParsed.shipment_type;
  // Check if package types match
  const packageTypeMatch = 
    actualParsed.package_type && 
    expectedParsed.package_type && 
    actualParsed.package_type === expectedParsed.package_type;
  // Check if payment types match
  const paymentTypeMatch = 
    actualParsed.payment_type && 
    expectedParsed.payment_type && 
    actualParsed.payment_type === expectedParsed.payment_type;
  // If all components match where available, consider it a match
  if (shipmentTypeMatch && packageTypeMatch && paymentTypeMatch) {
    return true;
  }
  // Fall back to basic normalization for comparison
  const normalizeServiceName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[®™©]/g, '')
      .replace(/tm/gi, '') // Remove TM regardless of case
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*-\s*/g, '-') // Normalize spaces around hyphens
      .replace(/\s*\(\s*/g, '(') // Normalize spaces before parentheses
      .replace(/\s*\)\s*/g, ')') // Normalize spaces after parentheses
      .replace(/express\s+freight/gi, 'expressfreight') // Normalize express freight variations
      .replace(/freight\s+tm/gi, 'freight') // Normalize freight TM variations
      .replace(/worldwide/gi, 'worldwide') // Normalize Worldwide casing
      .replace(/\bups\b/gi, 'ups') // Normalize UPS casing
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ')
      .trim()
  }
  const actualService = normalizeServiceName(actualRow.service)
  const expectedService = normalizeServiceName(expectedRow.service)
  // If service names are identical after normalization, they match
  if (actualService === expectedService) {
    return true
  }
  // Check for UPS freight services which might have variations in naming
  const isFreightService = 
    actualService.includes('freight') || 
    expectedService.includes('freight') ||
    actualService.includes('pallet') || 
    expectedService.includes('pallet') ||
    actualParsed.payment_type?.toLowerCase().includes('freight') || 
    expectedParsed.payment_type?.toLowerCase().includes('freight');
  // For freight services, be more lenient in matching
  if (isFreightService) {
    // Extract key components - if both have these key parts, consider them a match
    const getKeyComponents = (svc: string) => {
      const parts = [];
      if (svc.includes('worldwide')) parts.push('worldwide');
      if (svc.includes('import')) parts.push('import');
      if (svc.includes('export')) parts.push('export');
      if (svc.includes('express')) parts.push('express');
      if (svc.includes('freight')) parts.push('freight');
      if (svc.includes('pallet')) parts.push('pallet');
      return parts;
    }
    const actualComponents = getKeyComponents(actualService);
    const expectedComponents = getKeyComponents(expectedService);
    // If they share at least 2 important components and both are freight services, consider them a match
    if (actualComponents.length >= 2 && 
        expectedComponents.length >= 2 &&
        actualComponents.filter(c => expectedComponents.includes(c)).length >= 2) {
      return true;
    }
  }
  // Check if one is a subset of the other (to handle partial name matching)
  if (actualService.includes(expectedService) || expectedService.includes(actualService)) {
    // Check if they have compatible tags
    const actualTags = actualRow.tags || []
    const expectedTags = expectedRow.tags || []
    // Simple tag compatibility check - if they share at least one tag, they might be related
    const hasCommonTag = actualTags.some((tag: string) => 
      expectedTags.includes(tag)
    )
    // More specific checks for common UPS service components
    const serviceComponents = ["export", "import", "prepaid", "freight collect", "letter", "package", "document", "pak"]
    // Check if they share important service components
    const hasConflictingComponents = serviceComponents.some(component => {
      const inActual = actualService.includes(component)
      const inExpected = expectedService.includes(component)
      // If both have the component keyword but in different forms, they're different services
      return inActual && inExpected && 
             actualService.indexOf(component) !== expectedService.indexOf(component)
    })
    return hasCommonTag && !hasConflictingComponents
  }
  return false
}
// Compare two objects with weighted similarity
function compareObjectSimilarity(
  actual: any,
  expected: any,
  path = "",
): {
  similarity: number
  categoryMetrics: Record<string, { totalSimilarity: number; count: number; averageSimilarity: number }>
} {
  // Initialize category metrics
  const categoryMetrics: Record<string, { totalSimilarity: number; count: number; averageSimilarity: number }> = {}
  Object.keys(FIELD_WEIGHTS).forEach((category) => {
    categoryMetrics[category] = {
      totalSimilarity: 0,
      count: 0,
      averageSimilarity: 0,
    }
  })
  // Handle null or undefined values
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return {
      similarity: actual === expected ? 1.0 : 0.0,
      categoryMetrics,
    }
  }
  // Handle different types
  if (typeof actual !== typeof expected) {
    return {
      similarity: 0.2, // Different types have low similarity
      categoryMetrics,
    }
  }
  // Handle arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length === 0 && expected.length === 0) {
      return {
        similarity: 1.0,
        categoryMetrics,
      }
    }
    let totalSimilarity = 0
    const maxLength = Math.max(actual.length, expected.length)
    // Compare each item in the arrays
    for (let i = 0; i < maxLength; i++) {
      if (i < actual.length && i < expected.length) {
        const itemResult = compareObjectSimilarity(actual[i], expected[i], `${path}[${i}]`)
        totalSimilarity += itemResult.similarity
        // Merge category metrics
        Object.keys(itemResult.categoryMetrics).forEach((category) => {
          if (itemResult.categoryMetrics[category].count > 0) {
            categoryMetrics[category].totalSimilarity += itemResult.categoryMetrics[category].totalSimilarity
            categoryMetrics[category].count += itemResult.categoryMetrics[category].count
          }
        })
      }
    }
    return {
      similarity: totalSimilarity / maxLength,
      categoryMetrics,
    }
  }
  // Handle objects
  if (typeof actual === "object" && typeof expected === "object") {
    const allKeys = new Set([...Object.keys(actual), ...Object.keys(expected)])
    if (allKeys.size === 0) {
      return {
        similarity: 1.0,
        categoryMetrics,
      }
    }
    let totalSimilarity = 0
    let totalWeight = 0
    // Compare each property in the objects
    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key
      const weight = getFieldWeight(key)
      totalWeight += weight
      if (key in actual && key in expected) {
        const propResult = compareObjectSimilarity(actual[key], expected[key], keyPath)
        totalSimilarity += propResult.similarity * weight
        // Update category metrics if this is a weighted field
        if (key in FIELD_WEIGHTS) {
          categoryMetrics[key].totalSimilarity += propResult.similarity
          categoryMetrics[key].count += 1
        }
        // Merge nested category metrics
        Object.keys(propResult.categoryMetrics).forEach((category) => {
          const itemResult = propResult
          if (itemResult.categoryMetrics[category].count > 0) {
            categoryMetrics[category].totalSimilarity += propResult.categoryMetrics[category].totalSimilarity
            categoryMetrics[category].count += itemResult.categoryMetrics[category].count
          }
        })
      } else {
        // Key exists in only one object
        totalSimilarity += 0 // Missing keys contribute 0 to similarity
      }
    }
    return {
      similarity: totalWeight > 0 ? totalSimilarity / totalWeight : 0,
      categoryMetrics,
    }
  }
  // Handle primitive values
  const similarity = calculateValueSimilarity(actual, expected)
  // Check if the path ends with a category we're tracking
  const pathParts = path.split(".")
  const lastPart = pathParts[pathParts.length - 1]
  if (lastPart in FIELD_WEIGHTS) {
    categoryMetrics[lastPart].totalSimilarity += similarity
    categoryMetrics[lastPart].count += 1
  }
  return {
    similarity,
    categoryMetrics,
  }
}
// Helper function to deduplicate an array
function deduplicateArray<T>(array: T[]): T[] {
  return [...new Set(array)]
}

// Enhanced deduplication function for service objects
function deduplicateServices(services: Array<{ service: string; [key: string]: any }>): Array<{ service: string; [key: string]: any }> {
  const seen = new Set<string>();
  const result: Array<{ service: string; [key: string]: any }> = [];
  
  for (const serviceObj of services) {
    if (!serviceObj.service) continue;
    
    // Normalize service name for comparison
    const normalizedService = serviceObj.service
      .replace(/\\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    
    if (!seen.has(normalizedService)) {
      seen.add(normalizedService);
      result.push(serviceObj);
    }
  }
  
  return result;
}
// Helper function to format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word
    .trim()
}
// Add this new function to show parsed service components in the comparison results
function addParsedServiceComponents(
  tableCategorySimilarities: Record<string, any>, 
  tableCategory: string
) {
  if (!tableCategorySimilarities[tableCategory]) return;
  const category = tableCategorySimilarities[tableCategory];
  // Only process if service comparison information exists
  if (!category.serviceComparison) return;
  // Process missing services
  if (category.serviceComparison.missing && category.serviceComparison.missing.length > 0) {
    category.serviceComparison.missing = category.serviceComparison.missing.map((item: any) => {
      if (item.service) {
        const parsed = parseServiceName(item.service);
        return {
          ...item,
          base_service_name: parsed.base_service_name,
          package_type: parsed.package_type,
          shipment_type: parsed.shipment_type,
          payment_type: parsed.payment_type
        };
      }
      return item;
    });
  }
  // Process extra services
  if (category.serviceComparison.extra && category.serviceComparison.extra.length > 0) {
    category.serviceComparison.extra = category.serviceComparison.extra.map((item: any) => {
      if (item.service) {
        const parsed = parseServiceName(item.service);
        return {
          ...item,
          base_service_name: parsed.base_service_name,
          package_type: parsed.package_type,
          shipment_type: parsed.shipment_type,
          payment_type: parsed.payment_type
        };
      }
      return item;
    });
  }
  // Process differences
  if (category.serviceComparison.differences && category.serviceComparison.differences.length > 0) {
    category.serviceComparison.differences = category.serviceComparison.differences.map((item: any) => {
      if (item.service) {
        const parsed = parseServiceName(item.service);
        return {
          ...item,
          base_service_name: parsed.base_service_name,
          package_type: parsed.package_type,
          shipment_type: parsed.shipment_type,
          payment_type: parsed.payment_type
        };
      }
      return item;
    });
  }
}
// Calculate table category similarity
function calculateTableCategorySimilarity(
  groundTruthTables: any,
  extractedTables: any
): {
  categorySimilarities: Record<
    string,
    {
      similarityScore: number
      message: string
      actualRows: number
      expectedRows: number
      missingRows: number
      extraRows: number
      missingRowDetails: any[] // Missing row details
      extraRowDetails: any[] // Extra row details
      lowSimilarityDetails: any[] // Low similarity row details
      serviceComparison?: {
        missing: Array<{ 
          service: string
          account_number?: string
          name?: string 
        }> // Missing services
        extra: Array<{ 
          service: string
          account_number?: string
          name?: string 
        }> // Extra services
        differences: Array<{
          service: string
          account_number?: string
          name?: string
          differences: Array<{
            field: string
            actual: any
            expected: any
            similarity: number
          }>
        }> // Differences in low similarity rows
      }
    }
  >
  overallSimilarity: number
  totalSimilarity: number
  totalRows: number
  totalExpectedRows: number
  missingRows: number
  extraRows: number
} {
  const categorySimilarities: Record<
    string,
    {
      similarityScore: number
      message: string
      actualRows: number
      expectedRows: number
      missingRows: number
      extraRows: number
      missingRowDetails: any[] // Missing row details
      extraRowDetails: any[] // Extra row details
      lowSimilarityDetails: any[] // Low similarity row details
      serviceComparison?: {
        missing: Array<{ 
          service: string
          account_number?: string
          name?: string 
        }> // Missing services
        extra: Array<{ 
          service: string
          account_number?: string
          name?: string 
        }> // Extra services
        differences: Array<{
          service: string
          account_number?: string
          name?: string
          differences: Array<{
            field: string
            actual: any
            expected: any
            similarity: number
          }>
        }> // Differences in low similarity rows
      }
    }
  > = {}
  let totalSimilarity = 0.0
  let totalRows = 0
  let totalExpectedRows = 0
  let missingRows = 0
  let extraRows = 0
  let totalMatchedGroundTruthRows = 0 // Add this to track actual matched rows
  // Calculate the total expected rows across all tables
  const totalExpectedRowsAllTables = Object.entries(extractedTables).reduce((sum: number, [tableName, table]: [string, any]) => {
    if (tableName === "eligible_accounts" && Array.isArray(table)) {
      return sum + table.length;
    }
    if (table && table.tableData && table.tableData.rows) {
      return sum + table.tableData.rows.length
    }
    return sum
  }, 0)
  // Calculate the total actual rows across all tables
  const totalActualRowsAllTables = Object.entries(groundTruthTables).reduce((sum: number, [tableName, table]: [string, any]) => {
    if (tableName === "eligible_accounts" && Array.isArray(table)) {
      return sum + table.length;
    }
    if (table && table.tableData && table.tableData.rows) {
      return sum + table.tableData.rows.length
    }
    return sum
  }, 0)
  // Compare each table category
  // Make sure to include all table categories from the expected results
  const allTableNames = [
    ...new Set([...Object.keys(groundTruthTables), ...Object.keys(extractedTables), ...TABLE_CATEGORIES]),
  ]
  for (const tableName of allTableNames) {
    const actualTable = groundTruthTables[tableName];
    const expectedTable = extractedTables[tableName];
    // Skip if either table is None
    if (!actualTable || !expectedTable) {
      categorySimilarities[tableName] = {
        similarityScore: 0.0,
        message: "Missing table in one of the responses",
        actualRows: 0,
        expectedRows: 0,
        missingRows: 0,
        extraRows: 0,
        missingRowDetails: [], // Empty array for missing rows
        extraRowDetails: [], // Empty array for extra rows
        lowSimilarityDetails: [], // Empty array for low similarity rows
        serviceComparison: {
          missing: [],
          extra: [],
          differences: [],
        },
      }
      continue
    }
    // Special handling for eligible_accounts which is directly an array instead of having tableData.rows
    let groundTruthRows: any[] = [];
    let extractedRows: any[] = [];
    if (tableName === "eligible_accounts") {
      // For eligible_accounts, the entire object is the array of rows
      groundTruthRows = Array.isArray(actualTable) ? actualTable : [];
      extractedRows = Array.isArray(expectedTable) ? expectedTable : [];
      // Use specialized comparison for eligible_accounts
      const eligibleAccountsResult = compareEligibleAccounts(groundTruthRows, extractedRows);
      // Convert the specialized result to the standard format
      const tableSimilarity = eligibleAccountsResult.similarity * groundTruthRows.length;
      const matchedGroundTruthCount = eligibleAccountsResult.matchedRows;
      // Calculate category metrics using the same formula as other tables
      const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0;
      const completeness = groundTruthRows.length > 0 ? matchedGroundTruthCount / groundTruthRows.length : 0.0;
      // Calculate base category similarity
      let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100;
      // Apply completeness bonus if applicable
      if (completeness >= 0.95) {
        categorySimilarity = Math.min(100, categorySimilarity * 1.02);
              }
      // Convert missing/extra accounts to the standard format
      const missingRowDetails = eligibleAccountsResult.missingAccounts.map((account, index) => ({
        ...account,
        rowIndex: index + 1
      }));
      const extraRowDetails = eligibleAccountsResult.extraAccounts.map((account, index) => ({
        ...account,
        rowIndex: index + 1
      }));
      const lowSimilarityDetails = eligibleAccountsResult.lowSimilarityAccounts.map((account) => ({
        account_number: account.account_number,
        similarity: account.similarity,
        fieldDifferences: account.fieldDifferences,
        rowIndex: groundTruthRows.findIndex(row => row.account_number === account.account_number) + 1
      }));
      categorySimilarities[tableName] = {
        similarityScore: Math.round(categorySimilarity * 100) / 100,
        message: categorySimilarity >= 80 ? "Success" : "Low similarity",
        actualRows: groundTruthRows.length,
        expectedRows: extractedRows.length,
        missingRows: eligibleAccountsResult.missingAccounts.length,
        extraRows: eligibleAccountsResult.extraAccounts.length,
        missingRowDetails,
        extraRowDetails,
        lowSimilarityDetails,
        serviceComparison: {
          missing: eligibleAccountsResult.missingAccounts.map(account => ({
            service: account.name || "Unknown",
            account_number: account.account_number,
            name: account.name
          })),
          extra: eligibleAccountsResult.extraAccounts.map(account => ({
            service: account.name || "Unknown",
            account_number: account.account_number,
            name: account.name
          })),
          differences: eligibleAccountsResult.lowSimilarityAccounts.map(account => ({
            service: account.account_number,
            account_number: account.account_number,
            name: groundTruthRows.find(row => row.account_number === account.account_number)?.name || "",
            differences: account.fieldDifferences
          }))
        }
      };
      totalSimilarity += tableSimilarity;
      totalExpectedRows += extractedRows.length;
      missingRows += eligibleAccountsResult.missingAccounts.length;
      extraRows += eligibleAccountsResult.extraAccounts.length;
      totalMatchedGroundTruthRows += matchedGroundTruthCount;
      continue; // Skip the standard comparison logic for eligible_accounts
    } else {
      // Check if both tables have tableData
      if (!actualTable.tableData || !expectedTable.tableData) {
        categorySimilarities[tableName] = {
          similarityScore: 0.0,
          message: "Missing tableData in one of the responses",
          actualRows: 0,
          expectedRows: 0,
          missingRows: 0,
          extraRows: 0,
          missingRowDetails: [], // Empty array for missing rows
          extraRowDetails: [], // Extra array for extra rows
          lowSimilarityDetails: [], // Empty array for low similarity rows
          serviceComparison: {
            missing: [],
            extra: [],
            differences: [],
          },
        }
        continue
      }
      // Check if both tables have rows
      if (!actualTable.tableData.rows || !expectedTable.tableData.rows) {
        categorySimilarities[tableName] = {
          similarityScore: 0.0,
          message: "Missing rows in one of the responses",
          actualRows: 0,
          expectedRows: 0,
          missingRows: 0,
          extraRows: 0,
          missingRowDetails: [], // Empty array for missing rows
          extraRowDetails: [], // Extra array for extra rows
          lowSimilarityDetails: [], // Empty array for low similarity rows
          serviceComparison: {
            missing: [],
            extra: [],
            differences: [],
          },
        }
        continue
      }
      groundTruthRows = actualTable.tableData.rows;
      extractedRows = expectedTable.tableData.rows;
    }
    // Calculate row similarities
    // Use specialized comparison functions for specific tables
    if (tableName === "electronic_pld") {
      // Use specialized comparison for electronic_pld
      const electronicPldResult = compareElectronicPld(groundTruthRows, extractedRows);
      // Convert the specialized result to the standard format
      const tableSimilarity = electronicPldResult.similarity * groundTruthRows.length;
      const matchedGroundTruthCount = electronicPldResult.matchedRows;
      // Calculate category metrics using the same formula as other tables
      const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0;
      const completeness = groundTruthRows.length > 0 ? matchedGroundTruthCount / groundTruthRows.length : 0.0;
      // Calculate base category similarity
      let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100;
      // Apply completeness bonus if applicable
      if (completeness >= 0.95) {
        categorySimilarity = Math.min(100, categorySimilarity * 1.02);
              }
      // Convert missing/extra services to the standard format
      const missingRowDetails = electronicPldResult.missingServices.map((service, index) => ({
        ...service,
        rowIndex: index + 1
      }));
      const extraRowDetails = electronicPldResult.extraServices.map((service, index) => ({
        ...service,
        rowIndex: index + 1
      }));
      const lowSimilarityDetails = electronicPldResult.lowSimilarityServices.map((service) => ({
        service: service.service,
        similarity: service.similarity,
        fieldDifferences: service.fieldDifferences,
        rowIndex: groundTruthRows.findIndex(row => row.service === service.service) + 1
      }));
      categorySimilarities[tableName] = {
        similarityScore: Math.round(categorySimilarity * 100) / 100,
        message: categorySimilarity >= 80 ? "Success" : "Low similarity",
        actualRows: groundTruthRows.length,
        expectedRows: extractedRows.length,
        missingRows: electronicPldResult.missingServices.length,
        extraRows: electronicPldResult.extraServices.length,
        missingRowDetails,
        extraRowDetails,
        lowSimilarityDetails,
        serviceComparison: {
          missing: electronicPldResult.missingServices.map(service => ({
            service: service.service
          })),
          extra: electronicPldResult.extraServices.map(service => ({
            service: service.service
          })),
          differences: electronicPldResult.lowSimilarityServices.map(service => ({
            service: service.service,
            differences: service.fieldDifferences
          }))
        }
      };
      totalSimilarity += tableSimilarity;
      totalExpectedRows += extractedRows.length;
      missingRows += electronicPldResult.missingServices.length;
      extraRows += electronicPldResult.extraServices.length;
      totalMatchedGroundTruthRows += matchedGroundTruthCount;
      continue; // Skip the standard comparison logic for electronic_pld
    }
    // Use specialized comparison for accessorials
    if (tableName === "accessorials") {
      const accessorialsResult = compareAccessorials(groundTruthRows, extractedRows);
      // Convert the specialized result to the standard format
      const tableSimilarity = accessorialsResult.similarity * groundTruthRows.length;
      const matchedGroundTruthCount = accessorialsResult.matchedRows;
      // Calculate category metrics using the same formula as other tables
      const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0;
      const completeness = groundTruthRows.length > 0 ? matchedGroundTruthCount / groundTruthRows.length : 0.0;
      // Calculate base category similarity
      let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100;
      // Apply completeness bonus if applicable
      if (completeness >= 0.95) {
        categorySimilarity = Math.min(100, categorySimilarity * 1.02);
              }
      // Convert missing/extra accessorials to the standard format
      const missingRowDetails = accessorialsResult.missingAccessorials.map((accessorial, index) => ({
        ...accessorial,
        rowIndex: index + 1
      }));
      const extraRowDetails = accessorialsResult.extraAccessorials.map((accessorial, index) => ({
        ...accessorial,
        rowIndex: index + 1
      }));
      const lowSimilarityDetails = accessorialsResult.lowSimilarityAccessorials.map((accessorial) => ({
        name: accessorial.name,
        similarity: accessorial.similarity,
        fieldDifferences: accessorial.fieldDifferences,
        rowIndex: groundTruthRows.findIndex(row => row.name === accessorial.name) + 1
      }));
      categorySimilarities[tableName] = {
        similarityScore: Math.round(categorySimilarity * 100) / 100,
        message: categorySimilarity >= 80 ? "Success" : "Low similarity",
        actualRows: groundTruthRows.length,
        expectedRows: extractedRows.length,
        missingRows: accessorialsResult.missingAccessorials.length,
        extraRows: accessorialsResult.extraAccessorials.length,
        missingRowDetails,
        extraRowDetails,
        lowSimilarityDetails,
        serviceComparison: {
          missing: accessorialsResult.missingAccessorials.map(accessorial => ({
            service: accessorial.name
          })),
          extra: accessorialsResult.extraAccessorials.map(accessorial => ({
            service: accessorial.name
          })),
          differences: accessorialsResult.lowSimilarityAccessorials.map(accessorial => ({
            service: accessorial.name,
            differences: accessorial.fieldDifferences
          }))
        }
      };
      totalSimilarity += tableSimilarity;
      totalExpectedRows += extractedRows.length;
      missingRows += accessorialsResult.missingAccessorials.length;
      extraRows += accessorialsResult.extraAccessorials.length;
      totalMatchedGroundTruthRows += matchedGroundTruthCount;
      continue; // Skip the standard comparison logic for accessorials
    }
    // Use specialized comparison for tier_discount
    if (tableName === "tier_discount") {
      const tierDiscountResult = compareTierDiscount(groundTruthRows, extractedRows);
      // Convert the specialized result to the standard format
      const tableSimilarity = tierDiscountResult.similarity * groundTruthRows.length;
      const matchedGroundTruthCount = tierDiscountResult.matchedRows;
      // Calculate category metrics using the same formula as other tables
      const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0;
      const completeness = groundTruthRows.length > 0 ? matchedGroundTruthCount / groundTruthRows.length : 0.0;
      // Calculate base category similarity
      let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100;
      // Apply completeness bonus if applicable
      if (completeness >= 0.95) {
        categorySimilarity = Math.min(100, categorySimilarity * 1.02);
              }
      // Convert missing/extra tier discounts to the standard format
      const missingRowDetails = tierDiscountResult.missingTierDiscounts.map((tierDiscount, index) => ({
        ...tierDiscount,
        rowIndex: index + 1
      }));
      const extraRowDetails = tierDiscountResult.extraTierDiscounts.map((tierDiscount, index) => ({
        ...tierDiscount,
        rowIndex: index + 1
      }));
      const lowSimilarityDetails = tierDiscountResult.lowSimilarityTierDiscounts.map((tierDiscount) => ({
        service: tierDiscount.service,
        similarity: tierDiscount.similarity,
        fieldDifferences: tierDiscount.fieldDifferences,
        rowIndex: groundTruthRows.findIndex(row => row.service === tierDiscount.service) + 1
      }));
      categorySimilarities[tableName] = {
        similarityScore: Math.round(categorySimilarity * 100) / 100,
        message: categorySimilarity >= 80 ? "Success" : "Low similarity",
        actualRows: groundTruthRows.length,
        expectedRows: extractedRows.length,
        missingRows: tierDiscountResult.missingTierDiscounts.length,
        extraRows: tierDiscountResult.extraTierDiscounts.length,
        missingRowDetails,
        extraRowDetails,
        lowSimilarityDetails,
        serviceComparison: {
          missing: tierDiscountResult.missingTierDiscounts.map(tierDiscount => ({
            service: tierDiscount.service
          })),
          extra: tierDiscountResult.extraTierDiscounts.map(tierDiscount => ({
            service: tierDiscount.service
          })),
          differences: tierDiscountResult.lowSimilarityTierDiscounts.map(tierDiscount => ({
            service: tierDiscount.service,
            differences: tierDiscount.fieldDifferences
          }))
        }
      };
      totalSimilarity += tableSimilarity;
      totalExpectedRows += extractedRows.length;
      missingRows += tierDiscountResult.missingTierDiscounts.length;
      extraRows += tierDiscountResult.extraTierDiscounts.length;
      totalMatchedGroundTruthRows += matchedGroundTruthCount;
      continue; // Skip the standard comparison logic for tier_discount
    }
    // Use specialized comparison for incentive_base_discount
    if (tableName === "incentive_base_discount") {
      const incentiveBaseDiscountResult = compareIncentiveBaseDiscount(groundTruthRows, extractedRows);
      // Convert the specialized result to the standard format
      const tableSimilarity = incentiveBaseDiscountResult.similarity * groundTruthRows.length;
      const matchedGroundTruthCount = incentiveBaseDiscountResult.matchedRows;
      // Calculate category metrics using the same formula as other tables
      const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0;
      const completeness = groundTruthRows.length > 0 ? matchedGroundTruthCount / groundTruthRows.length : 0.0;
      // Calculate base category similarity
      let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100;
      // Apply completeness bonus if applicable
      if (completeness >= 0.95) {
        categorySimilarity = Math.min(100, categorySimilarity * 1.02);
              }
      // Convert missing/extra incentive base discounts to the standard format
      const missingRowDetails = incentiveBaseDiscountResult.missingIncentiveBaseDiscounts.map((incentiveBaseDiscount, index) => ({
        ...incentiveBaseDiscount,
        rowIndex: index + 1
      }));
      const extraRowDetails = incentiveBaseDiscountResult.extraIncentiveBaseDiscounts.map((incentiveBaseDiscount, index) => ({
        ...incentiveBaseDiscount,
        rowIndex: index + 1
      }));
      const lowSimilarityDetails = incentiveBaseDiscountResult.lowSimilarityIncentiveBaseDiscounts.map((incentiveBaseDiscount) => ({
        service: incentiveBaseDiscount.service,
        similarity: incentiveBaseDiscount.similarity,
        fieldDifferences: incentiveBaseDiscount.fieldDifferences,
        rowIndex: groundTruthRows.findIndex(row => row.service === incentiveBaseDiscount.service) + 1
      }));
      categorySimilarities[tableName] = {
        similarityScore: Math.round(categorySimilarity * 100) / 100,
        message: categorySimilarity >= 80 ? "Success" : "Low similarity",
        actualRows: groundTruthRows.length,
        expectedRows: extractedRows.length,
        missingRows: incentiveBaseDiscountResult.missingIncentiveBaseDiscounts.length,
        extraRows: incentiveBaseDiscountResult.extraIncentiveBaseDiscounts.length,
        missingRowDetails,
        extraRowDetails,
        lowSimilarityDetails,
        serviceComparison: {
          missing: incentiveBaseDiscountResult.missingIncentiveBaseDiscounts.map(incentiveBaseDiscount => ({
            service: incentiveBaseDiscount.service
          })),
          extra: incentiveBaseDiscountResult.extraIncentiveBaseDiscounts.map(incentiveBaseDiscount => ({
            service: incentiveBaseDiscount.service
          })),
          differences: incentiveBaseDiscountResult.lowSimilarityIncentiveBaseDiscounts.map(incentiveBaseDiscount => ({
            service: incentiveBaseDiscount.service,
            differences: incentiveBaseDiscount.fieldDifferences
          }))
        }
      };
      totalSimilarity += tableSimilarity;
      totalExpectedRows += extractedRows.length;
      missingRows += incentiveBaseDiscountResult.missingIncentiveBaseDiscounts.length;
      extraRows += incentiveBaseDiscountResult.extraIncentiveBaseDiscounts.length;
      totalMatchedGroundTruthRows += matchedGroundTruthCount;
      continue; // Skip the standard comparison logic for incentive_base_discount
    }
    // Standard comparison logic for other tables
    let tableSimilarity = 0.0
    const matchedExpectedRows = Array(extractedRows.length).fill(false)
    const matchedActualRows = Array(groundTruthRows.length).fill(false)
    const missingRowDetails: any[] = []
    const extraRowDetails: any[] = []
    const lowSimilarityDetails: any[] = []
    const missingServices: Array<{ 
      service: string
      account_number?: string
      name?: string 
    }> = []
    const extraServices: Array<{ 
      service: string
      account_number?: string
      name?: string
    }> = []
    const rowDifferences: Array<{
      service: string
      account_number?: string
      name?: string
      differences: Array<{
        field: string
        actual: any
        expected: any
        similarity: number
      }>
    }> = []
    // For each actual row, find the best matching expected row
    for (let i = 0; i < groundTruthRows.length; i++) {
      const actualRow = groundTruthRows[i]
      let bestSimilarity = 0.0
      let bestExpectedIdx = -1
      let bestFieldDifferences: Array<{
        field: string
        actual: any
        expected: any
        similarity: number
      }> = []
      
      // Find the best matching expected row for this actual row
      for (let j = 0; j < extractedRows.length; j++) {
        if (!matchedExpectedRows[j]) {
          const { similarity, fieldDifferences } = compareRowSimilarity(actualRow, extractedRows[j], tableName)
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestExpectedIdx = j
            bestFieldDifferences = fieldDifferences
          }
        }
      }
      
      // If we found a match, mark it and add to total similarity
      if (bestExpectedIdx !== -1) {
        matchedExpectedRows[bestExpectedIdx] = true
        matchedActualRows[i] = true
        tableSimilarity += bestSimilarity
        // Check if this is a low similarity match
        if (bestSimilarity < 0.5) {
          lowSimilarityDetails.push({
            ...actualRow,
            expectedRow: extractedRows[bestExpectedIdx],
            similarity: bestSimilarity * 100,
            fieldDifferences: bestFieldDifferences,
            rowIndex: i + 1,
          })
          // Add to row differences if service exists
          if (actualRow.service) {
            rowDifferences.push({
              service: actualRow.service,
              differences: bestFieldDifferences,
            })
          } else if (tableName === "eligible_accounts") {
            // For eligible accounts, use name and account_number
            rowDifferences.push({
              service: actualRow.name || "Unknown", 
              account_number: actualRow.account_number || "",
              name: actualRow.name || "",
              differences: bestFieldDifferences,
            })
          }
        }
      }
    }
    // Collect unmatched expected rows as missing rows
    for (let i = 0; i < extractedRows.length; i++) {
      if (!matchedExpectedRows[i]) {
        extraRowDetails.push({
          ...extractedRows[i],
          rowIndex: i + 1, // 1-based index for display
        })
        if (tableName === "eligible_accounts") {
          extraServices.push({
            service: extractedRows[i].name || "Unknown",
            account_number: extractedRows[i].account_number || "",
            name: extractedRows[i].name || "",
          })
        } else if (extractedRows[i].service) {
          extraServices.push({
            service: extractedRows[i].service,
          })
        }
      }
    }
    // Collect unmatched actual rows as extra rows
    for (let i = 0; i < groundTruthRows.length; i++) {
      if (!matchedActualRows[i]) {
        missingRowDetails.push({
          ...groundTruthRows[i],
          rowIndex: i + 1, // 1-based index for display
        })
        if (tableName === "eligible_accounts") {
          missingServices.push({
            service: groundTruthRows[i].name || "Unknown",
            account_number: groundTruthRows[i].account_number || "",
            name: groundTruthRows[i].name || "",
          })
        } else if (groundTruthRows[i].service) {
          missingServices.push({
            service: groundTruthRows[i].service,
          })
        }
      }
    }
    // Deduplicate services with improved normalization
    const normalizeServiceForDisplay = (service: string) => {
      if (!service) return "Unknown";
      return service
        .replace(/\\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase(); // Add lowercase for better matching
    };
    
    // Use Set for more efficient deduplication
    const uniqueMissingServicesSet = new Set<string>();
    const uniqueExtraServicesSet = new Set<string>();
    
    // Process missing services
    missingServices.forEach((item) => {
      if (tableName === "eligible_accounts") {
        const key = `${item.account_number || ""}-${item.name || ""}`;
        uniqueMissingServicesSet.add(key);
      } else if (item.service) {
        const normalizedService = normalizeServiceForDisplay(item.service);
        uniqueMissingServicesSet.add(normalizedService);
      }
    });
    
    // Process extra services
    extraServices.forEach((item) => {
      if (tableName === "eligible_accounts") {
        const key = `${item.account_number || ""}-${item.name || ""}`;
        uniqueExtraServicesSet.add(key);
      } else if (item.service) {
        const normalizedService = normalizeServiceForDisplay(item.service);
        uniqueExtraServicesSet.add(normalizedService);
      }
    });
    
    // Convert back to arrays with proper structure
    const uniqueMissingServices = Array.from(uniqueMissingServicesSet).map((serviceKey) => {
      if (tableName === "eligible_accounts") {
        const [accountNumber, ...nameParts] = serviceKey.split("-");
        const name = nameParts.join("-");
        return {
          service: name || "Unknown",
          account_number: accountNumber || "",
          name
        };
      }
      return { service: serviceKey };
    });
    
    const uniqueExtraServices = Array.from(uniqueExtraServicesSet).map((serviceKey) => {
      if (tableName === "eligible_accounts") {
        const [accountNumber, ...nameParts] = serviceKey.split("-");
        const name = nameParts.join("-");
        return {
          service: name || "Unknown",
          account_number: accountNumber || "",
          name
        };
      }
      return { service: serviceKey };
    });
    // Deduplicate row differences by service with improved normalization
    const uniqueRowDifferencesMap = new Map<
      string,
      {
        service: string
        account_number?: string
        name?: string
        differences: Array<{
          field: string
          actual: any
          expected: any
          similarity: number
        }>
      }
    >()
    
    rowDifferences.forEach((item) => {
      // Create a unique key for the item based on tableName with better normalization
      let itemKey: string;
      if (tableName === "eligible_accounts" && item.account_number) {
        itemKey = `${item.account_number}-${item.name || ""}`;
      } else if (item.service) {
        itemKey = normalizeServiceForDisplay(item.service);
      } else {
        return; // Skip items without proper identifiers
      }
      
      if (!uniqueRowDifferencesMap.has(itemKey)) {
        if (tableName === "eligible_accounts") {
          uniqueRowDifferencesMap.set(itemKey, {
            ...item,
            service: item.service || "Unknown",
            account_number: item.account_number,
            name: item.name
          });
        } else {
          uniqueRowDifferencesMap.set(itemKey, {
            ...item,
            service: item.service || "Unknown"
          });
        }
      } else {
        // Merge differences if service already exists
        const existing = uniqueRowDifferencesMap.get(itemKey)!
        const existingFields = new Set(existing.differences.map((diff) => diff.field))
        // Add new differences that don't already exist
        item.differences.forEach((diff) => {
          if (!existingFields.has(diff.field)) {
            existing.differences.push(diff)
          }
        })
      }
    })
    
    const uniqueRowDifferences = Array.from(uniqueRowDifferencesMap.values())
    // Calculate category metrics
    // Row similarity: how well the rows that were matched actually match
    const rowSimilarity = groundTruthRows.length > 0 ? tableSimilarity / groundTruthRows.length : 0.0
    // Completeness: how many ground truth rows were successfully found in extracted
    // This should be: matched_ground_truth_rows / total_ground_truth_rows
    const matchedGroundTruthCount = matchedActualRows.filter(Boolean).length;
    const completeness = groundTruthRows.length > 0
      ? matchedGroundTruthCount / groundTruthRows.length
      : 0.0
    if (groundTruthRows.length === extractedRows.length && completeness < 1.0) {
      // Show which ground truth rows weren't matched
      // Show which extracted rows weren't matched
    }
    // Calculate base category similarity
    let categorySimilarity = (rowSimilarity * 0.7 + completeness * 0.3) * 100
    // No penalty for extra services - they should never negatively impact the score
    // If completeness is high, give a small bonus for thoroughness (but cap at 100%)
    if (completeness >= 0.95) {
      categorySimilarity = Math.min(100, categorySimilarity * 1.02);
    }
    // Add similarity score distribution analysis
    if (groundTruthRows.length > 0) {
      let similarityScores: number[] = [];
      for (let i = 0; i < groundTruthRows.length; i++) {
        if (matchedActualRows[i]) {
          // Find the similarity score for this matched row
          let rowSimilarity = 0;
          for (let j = 0; j < extractedRows.length; j++) {
            if (matchedExpectedRows[j]) {
              const { similarity } = compareRowSimilarity(groundTruthRows[i], extractedRows[j], tableName);
              if (similarity > rowSimilarity) {
                rowSimilarity = similarity;
              }
            }
          }
          similarityScores.push(rowSimilarity);
        } else {
          similarityScores.push(0); // Unmatched row
        }
      }
      const avgSimilarity = similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length;
      const minSimilarity = Math.min(...similarityScores);
      const maxSimilarity = Math.max(...similarityScores);
          }
    categorySimilarities[tableName] = {
      similarityScore: Math.round(categorySimilarity * 100) / 100, // Round to 2 decimal places
      message: categorySimilarity >= 80 ? "Success" : "Low similarity",
      actualRows: groundTruthRows.length,
      expectedRows: extractedRows.length,
      missingRows: Math.max(0, groundTruthRows.length - matchedGroundTruthCount), // Rows in ground truth but not found in extracted
      extraRows: Math.max(0, extractedRows.length - matchedExpectedRows.filter(Boolean).length), // Rows in extracted but not in ground truth
      missingRowDetails: missingRowDetails, // Store the missing row details
      extraRowDetails: extraRowDetails, // Store the extra row details
      lowSimilarityDetails: lowSimilarityDetails, // Store the low similarity row details
      serviceComparison: {
        missing: uniqueMissingServices,
        extra: uniqueExtraServices,
        differences: uniqueRowDifferences,
      },
    }
    totalSimilarity += tableSimilarity
    totalExpectedRows += extractedRows.length
    missingRows += Math.max(0, groundTruthRows.length - matchedGroundTruthCount)
    extraRows += Math.max(0, extractedRows.length - matchedExpectedRows.filter(Boolean).length)
    totalMatchedGroundTruthRows += matchedGroundTruthCount
  }
  // Process electronic_pld table to add parsed service components
  if (categorySimilarities["electronic_pld"]) {
    addParsedServiceComponents(categorySimilarities, "electronic_pld");
  }
  // Also process other tables that might have service names
  if (categorySimilarities["accessorials"]) {
    addParsedServiceComponents(categorySimilarities, "accessorials");
  }
  if (categorySimilarities["tier_discount"]) {
    addParsedServiceComponents(categorySimilarities, "tier_discount");
  }
  if (categorySimilarities["incentive_base_discount"]) {
    addParsedServiceComponents(categorySimilarities, "incentive_base_discount");
  }
  // Calculate overall similarity using the original weighted approach
  let overallSimilarity = 0.0
  if (totalExpectedRowsAllTables > 0) {
    // Calculate row similarity (how well the rows that exist match)
    const rowSimilarity = totalExpectedRows > 0 ? totalSimilarity / totalExpectedRows : 0.0
    // Calculate completeness (how many expected rows are present) - using corrected formula
    // This should be: how many ground truth rows were found / total ground truth rows
    const totalGroundTruthRows = totalActualRowsAllTables;
    const completeness = totalGroundTruthRows > 0
      ? totalMatchedGroundTruthRows / totalGroundTruthRows
      : 0.0
    // Calculate table presence ratio (how many expected tables are present)
    const expectedTableCount = Object.keys(extractedTables).length
    const presentTableCount = Object.keys(extractedTables).filter(
      (key) =>
        key in groundTruthTables && groundTruthTables[key] &&
        (
          (groundTruthTables[key].tableData && groundTruthTables[key].tableData.rows) ||
          (key === "eligible_accounts" && Array.isArray(groundTruthTables[key]))
        ),
    ).length
    const tablePresenceRatio = expectedTableCount > 0 ? presentTableCount / expectedTableCount : 0
    // Weight the components as in the Python code
    const rowSimilarityWeight = 0.4
    const completenessWeight = 0.3
    const tablePresenceWeight = 0.3
    // Calculate weighted similarity
    let baseSimilarity =
      (rowSimilarity * rowSimilarityWeight +
        completeness * completenessWeight +
        tablePresenceRatio * tablePresenceWeight) *
      100 // Convert to percentage
        // No penalty for extra services - they should never negatively impact the score
    // If completeness is high, give a small bonus for thoroughness (but cap at 100%)
    if (completeness >= 0.95) {
      overallSimilarity = Math.min(100, baseSimilarity * 1.02);
          } else {
      overallSimilarity = baseSimilarity;
    }
  }
  return {
    categorySimilarities,
    overallSimilarity: Math.round(overallSimilarity * 100) / 100, // Round to 2 decimal places
    totalSimilarity,
    totalRows,
    totalExpectedRows,
    missingRows,
    extraRows,
  }
}
// Special pattern matching for UPS services that were having matching issues
function matchUpsService(service1: string, service2: string): boolean {
  // Parse both services with our service parser
  const parsed1 = parseServiceName(service1);
  const parsed2 = parseServiceName(service2);
  // Base name must match first - this is a requirement
  if (parsed1.base_service_name !== parsed2.base_service_name ||
      parsed1.base_service_name === null) {
    return false;
  }
  // Now that base names match, check if the other components match
  const shipmentTypeMatch = 
    parsed1.shipment_type && 
    parsed2.shipment_type && 
    parsed1.shipment_type === parsed2.shipment_type;
  const packageTypeMatch = 
    parsed1.package_type && 
    parsed2.package_type && 
    parsed1.package_type === parsed2.package_type;
  const paymentTypeMatch = 
    parsed1.payment_type && 
    parsed2.payment_type && 
    parsed1.payment_type === parsed2.payment_type;
  // If all available components match (or are undefined), consider it a match
  if ((shipmentTypeMatch || !parsed1.shipment_type || !parsed2.shipment_type) &&
      (packageTypeMatch || !parsed1.package_type || !parsed2.package_type) &&
      (paymentTypeMatch || !parsed1.payment_type || !parsed2.payment_type)) {
    // If there are no specific components to match, just the base name match is sufficient
    if (!parsed1.shipment_type && !parsed2.shipment_type &&
        !parsed1.package_type && !parsed2.package_type &&
        !parsed1.payment_type && !parsed2.payment_type) {
      return true;
    }
    // If there are components, at least one should match positively
    if (shipmentTypeMatch || packageTypeMatch || paymentTypeMatch) {
      return true;
    }
  }
  // Normalize both services first (fallback to original logic)
  const normalize = (s: string) => s
    .replace(/®/g, "")
    .replace(/\u00ae/g, "")
    .replace(/™/g, "")
    .replace(/\u2122/g, "")
    .replace(/TM/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
  const s1 = normalize(service1);
  const s2 = normalize(service2);
  // Exact match after normalization
  if (s1 === s2) return true;
  return false;
}
// Hybrid service matching for tier_discount - try 4-component matching first, then fallback to string similarity
function matchTierDiscountService(service1: string, service2: string): boolean {
  // Parse both services with our service parser
  const parsed1 = parseServiceName(service1);
  const parsed2 = parseServiceName(service2);
  // Check if both services have clear components (base service name is required)
  const hasComponents1 = parsed1.base_service_name && parsed1.base_service_name.trim() !== '';
  const hasComponents2 = parsed2.base_service_name && parsed2.base_service_name.trim() !== '';
  if (hasComponents1 && hasComponents2) {
    // Both services have components - use strict 4-component matching
    const baseMatch = parsed1.base_service_name!.toLowerCase().trim() === parsed2.base_service_name!.toLowerCase().trim();
    if (!baseMatch) return false;
    const shipmentMatch = (parsed1.shipment_type || '').toLowerCase().trim() === (parsed2.shipment_type || '').toLowerCase().trim();
    if (!shipmentMatch) return false;
    const paymentMatch = (parsed1.payment_type || '').toLowerCase().trim() === (parsed2.payment_type || '').toLowerCase().trim();
    if (!paymentMatch) return false;
    const packageMatch = (parsed1.package_type || '').toLowerCase().trim() === (parsed2.package_type || '').toLowerCase().trim();
    if (!packageMatch) return false;
    return true;
  } else {
    // Services don't have clear components - use string similarity matching
    const threshold = 0.8; // 80% similarity threshold for fallback
    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/[®™©]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const s1 = normalize(service1);
    const s2 = normalize(service2);
    // Check for exact match first
    if (s1 === s2) return true;
    // Calculate string similarity
    const similarity = calculateStringSimilarity(s1, s2);
    // Return true if similarity meets threshold
    return similarity >= threshold;
  }
}
// Main function to compare JSON files
// groundTruthJson is the ground truth, extractedJson is the extracted data
export async function compareJsonFiles(
  groundTruthJson: any,
  extractedJson: any,
  progressCallback: (progress: number) => void
): Promise<any> {
  // Extract contract service tables from both files
  // Handle different JSON structures
  // Ground truth is the reference (what we expect to find)
  const groundTruthTables = groundTruthJson?.tables || {}
  // For extracted JSON, check if tables are nested under data.tables
  // Extracted is what we're testing against the ground truth
  let extractedTables;
  if (extractedJson?.data?.tables) {
    extractedTables = extractedJson.data.tables;
      } else if (extractedJson?.tables) {
    extractedTables = extractedJson.tables;
      } else {
    extractedTables = {};
      }
  // Calculate similarity between tables
  const result = calculateTableCategorySimilarity(groundTruthTables, extractedTables)
  const finalResult = {
    ...result,
    tableCategories: result.categorySimilarities,
    similarityIndex: result.overallSimilarity,
    success: result.overallSimilarity >= 80,
    message: result.overallSimilarity >= 80 ? "High accuracy achieved" :
             Object.keys(result.categorySimilarities).length === 0 ? "No matching tables found" :
             "Low accuracy - check individual table comparisons",
    rowSimilarity: result.totalExpectedRows > 0 ? (result.totalSimilarity / result.totalExpectedRows) * 100 : 0,
    completeness: result.totalExpectedRows > 0 ? Math.min(100, (result.totalRows / result.totalExpectedRows) * 100) : 0,
    categoryMetrics: {}
  }
  // Call progress callback with 100%
  progressCallback(100)
  return finalResult
}
// Specialized function for comparing eligible_accounts
function compareEligibleAccounts(
  groundTruthAccounts: any[],
  extractedAccounts: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingAccounts: Array<{
    account_number: string
    name: string
    address: string
    zip: string
    commodity_tier: string
  }>
  extraAccounts: Array<{
    account_number: string
    name: string
    address: string
    zip: string
    commodity_tier: string
  }>
  lowSimilarityAccounts: Array<{
    account_number: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
  const matchedExtractedIndices = new Set<number>();
  const matchedGroundTruthIndices = new Set<number>();
  const missingAccounts: any[] = [];
  const extraAccounts: any[] = [];
  const lowSimilarityAccounts: any[] = [];
  let totalSimilarity = 0;
  let matchedRows = 0;
  // Fields to compare for eligible_accounts (excluding pages which is metadata)
  const fieldsToCompare = ['name', 'address', 'zip', 'commodity_tier'];
  const fieldWeights = {
    name: 1.0,           // Name is very important
    address: 0.8,        // Address is important
    zip: 0.9,           // ZIP is very important for location matching
    commodity_tier: 1.0  // Commodity tier is critical for business rules
  };
  // Step 1: For each ground truth account, try to find matching extracted account by account_number
  for (let i = 0; i < groundTruthAccounts.length; i++) {
    const groundTruthAccount = groundTruthAccounts[i];
    const gtAccountNumber = groundTruthAccount.account_number;
    if (!gtAccountNumber) {
      continue;
    }
    // Find extracted account with matching account_number
    let foundMatch = false;
    for (let j = 0; j < extractedAccounts.length; j++) {
      if (matchedExtractedIndices.has(j)) continue; // Already matched
      const extractedAccount = extractedAccounts[j];
      const extractedAccountNumber = extractedAccount.account_number;
      if (gtAccountNumber === extractedAccountNumber) {
        // Account numbers match - now compare other fields
        let totalFieldWeight = 0;
        let totalWeightedSimilarity = 0;
        const fieldDifferences: Array<{
          field: string
          actual: any
          expected: any
          similarity: number
        }> = [];
        // Compare each field
        for (const field of fieldsToCompare) {
          const gtValue = groundTruthAccount[field];
          const extractedValue = extractedAccount[field];
          const weight = fieldWeights[field as keyof typeof fieldWeights] || 1.0;
          const fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
          totalFieldWeight += weight;
          totalWeightedSimilarity += fieldSimilarity * weight;
          if (fieldSimilarity < 0.8) {
            fieldDifferences.push({
              field,
              actual: gtValue,
              expected: extractedValue,
              similarity: fieldSimilarity
            });
          }
        }
        // Calculate overall account similarity
        const accountSimilarity = totalFieldWeight > 0 ? totalWeightedSimilarity / totalFieldWeight : 0;
        // Mark as matched
        matchedExtractedIndices.add(j);
        matchedGroundTruthIndices.add(i);
        totalSimilarity += accountSimilarity;
        matchedRows++;
        foundMatch = true;
        // Track low similarity accounts
        if (accountSimilarity < 0.8) {
          lowSimilarityAccounts.push({
            account_number: gtAccountNumber,
            similarity: accountSimilarity * 100,
            fieldDifferences
          });
        }
        break; // Found the match, no need to continue
      }
    }
    if (!foundMatch) {
      missingAccounts.push({
        account_number: gtAccountNumber,
        name: groundTruthAccount.name || '',
        address: groundTruthAccount.address || '',
        zip: groundTruthAccount.zip || '',
        commodity_tier: groundTruthAccount.commodity_tier || ''
      });
    }
  }
  // Step 2: Find extra accounts in extracted data (not in ground truth)
  for (let j = 0; j < extractedAccounts.length; j++) {
    if (!matchedExtractedIndices.has(j)) {
      const extractedAccount = extractedAccounts[j];
      extraAccounts.push({
        account_number: extractedAccount.account_number || '',
        name: extractedAccount.name || '',
        address: extractedAccount.address || '',
        zip: extractedAccount.zip || '',
        commodity_tier: extractedAccount.commodity_tier || ''
      });
    }
  }
  // Calculate final metrics
  const overallSimilarity = groundTruthAccounts.length > 0 ? totalSimilarity / groundTruthAccounts.length : 0;
  return {
    similarity: overallSimilarity,
    matchedRows,
    totalGroundTruthRows: groundTruthAccounts.length,
    totalExtractedRows: extractedAccounts.length,
    missingAccounts,
    extraAccounts,
    lowSimilarityAccounts
  };
}
// Specialized function for comparing electronic_pld
function compareElectronicPld(
  groundTruthPld: any[],
  extractedPld: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingServices: Array<{
    service: string
    bonus: string
    tags: string[]
  }>
  extraServices: Array<{
    service: string
    bonus: string
    tags: string[]
  }>
  lowSimilarityServices: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
  const matchedExtractedIndices = new Set<number>();
  const matchedGroundTruthIndices = new Set<number>();
  const missingServices: any[] = [];
  const extraServices: any[] = [];
  const lowSimilarityServices: any[] = [];
  let totalSimilarity = 0;
  let matchedRows = 0;
  // Fields to compare for electronic_pld (excluding pages and tags which are metadata)
  const fieldsToCompare = ['bonus'];
  const fieldWeights = {
    bonus: 1.0    // Bonus must match exactly - very critical
  };
  // Step 1: For each ground truth service, try to find matching extracted service by service name
  for (let i = 0; i < groundTruthPld.length; i++) {
    const groundTruthService = groundTruthPld[i];
    const gtServiceName = groundTruthService.service;
    if (!gtServiceName) {
      continue;
    }
    // Find extracted service with matching service name
    let foundMatch = false;
    let bestMatchIdx = -1;
    let bestServiceSimilarity = 0;
    // First try to find exact or very close service name matches
    for (let j = 0; j < extractedPld.length; j++) {
      if (matchedExtractedIndices.has(j)) continue; // Already matched
      const extractedService = extractedPld[j];
      const extractedServiceName = extractedService.service;
      if (!extractedServiceName) continue;
      // Use existing service matching logic
      let serviceSimilarity = 0;
      // Try exact match first
      if (gtServiceName === extractedServiceName) {
        serviceSimilarity = 1.0;
      } else {
        // Check if they're visually identical but different character codes
        const gtNormalized = gtServiceName.trim();
        const extractedNormalized = extractedServiceName.trim();
        if (gtNormalized === extractedNormalized) {
          serviceSimilarity = 1.0;
        } else {
          // For electronic_pld, use strict string similarity only
          // Don't use UPS service matching as it's too permissive for this table
          serviceSimilarity = calculateStringSimilarity(gtServiceName, extractedServiceName);
        }
      }
      // Consider it a match if similarity is >= 95%
      if (serviceSimilarity >= 0.95 && serviceSimilarity > bestServiceSimilarity) {
        bestServiceSimilarity = serviceSimilarity;
        bestMatchIdx = j;
      }
    }
    if (bestMatchIdx !== -1) {
      const extractedService = extractedPld[bestMatchIdx];
      // Service names match well enough - now compare other fields
      let totalFieldWeight = 0;
      let totalWeightedSimilarity = 0;
      const fieldDifferences: Array<{
        field: string
        actual: any
        expected: any
        similarity: number
      }> = [];
      // Compare each field
      for (const field of fieldsToCompare) {
        const gtValue = groundTruthService[field];
        const extractedValue = extractedService[field];
        const weight = fieldWeights[field as keyof typeof fieldWeights] || 1.0;
        let fieldSimilarity = 0;
        if (field === 'bonus') {
          // For bonus, we need exact match since it's a percentage
          if (gtValue === extractedValue) {
            fieldSimilarity = 1.0;
          } else {
            // Try to normalize percentage values
            const normalizePercentage = (val: any) => {
              if (!val) return '';
              return String(val).replace(/\s+/g, '').toLowerCase();
            };
            const normalizedGt = normalizePercentage(gtValue);
            const normalizedExtracted = normalizePercentage(extractedValue);
            if (normalizedGt === normalizedExtracted) {
              fieldSimilarity = 1.0;
            } else {
              // Try numeric comparison for percentages
              fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
            }
          }
        } else {
          fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
        }
        totalFieldWeight += weight;
        totalWeightedSimilarity += fieldSimilarity * weight;
        if (fieldSimilarity < 0.9) {
          fieldDifferences.push({
            field,
            actual: gtValue,
            expected: extractedValue,
            similarity: fieldSimilarity
          });
        }
      }
      // Include service similarity in the overall calculation
      const serviceWeight = 1.0; // Service matching is critical
      totalFieldWeight += serviceWeight;
      totalWeightedSimilarity += bestServiceSimilarity * serviceWeight;
      // Calculate overall service similarity
      const serviceSimilarity = totalFieldWeight > 0 ? totalWeightedSimilarity / totalFieldWeight : 0;
      // Mark as matched
      matchedExtractedIndices.add(bestMatchIdx);
      matchedGroundTruthIndices.add(i);
      totalSimilarity += serviceSimilarity;
      matchedRows++;
      foundMatch = true;
      // Track low similarity services
      if (serviceSimilarity < 0.8) {
        lowSimilarityServices.push({
          service: gtServiceName,
          similarity: serviceSimilarity * 100,
          fieldDifferences
        });
      }
    }
    if (!foundMatch) {
      missingServices.push({
        service: gtServiceName,
        bonus: groundTruthService.bonus || '',
        tags: groundTruthService.tags || []
      });
    }
  }
  // Step 2: Find extra services in extracted data (not in ground truth)
  for (let j = 0; j < extractedPld.length; j++) {
    if (!matchedExtractedIndices.has(j)) {
      const extractedService = extractedPld[j];
      extraServices.push({
        service: extractedService.service || '',
        bonus: extractedService.bonus || '',
        tags: extractedService.tags || []
      });
    }
  }
  // Calculate final metrics
  const overallSimilarity = groundTruthPld.length > 0 ? totalSimilarity / groundTruthPld.length : 0;
  
  // Deduplicate services to avoid showing the same service multiple times
  const seenMissing = new Set<string>();
  const uniqueMissingServices = missingServices.filter(service => {
    const normalizedService = service.service?.toLowerCase().trim() || '';
    if (seenMissing.has(normalizedService)) return false;
    seenMissing.add(normalizedService);
    return true;
  });
  
  const seenExtra = new Set<string>();
  const uniqueExtraServices = extraServices.filter(service => {
    const normalizedService = service.service?.toLowerCase().trim() || '';
    if (seenExtra.has(normalizedService)) return false;
    seenExtra.add(normalizedService);
    return true;
  });
  
  const seenLowSimilarity = new Set<string>();
  const uniqueLowSimilarityServices = lowSimilarityServices.filter(service => {
    const normalizedService = service.service?.toLowerCase().trim() || '';
    if (seenLowSimilarity.has(normalizedService)) return false;
    seenLowSimilarity.add(normalizedService);
    return true;
  });
  
  return {
    similarity: overallSimilarity,
    matchedRows,
    totalGroundTruthRows: groundTruthPld.length,
    totalExtractedRows: extractedPld.length,
    missingServices: uniqueMissingServices,
    extraServices: uniqueExtraServices,
    lowSimilarityServices: uniqueLowSimilarityServices
  };
}
// Specialized function for comparing accessorials
function compareAccessorials(
  groundTruthAccessorials: any[],
  extractedAccessorials: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingAccessorials: Array<{
    name: string
    term: string
    discount: string
  }>
  extraAccessorials: Array<{
    name: string
    term: string
    discount: string
  }>
  lowSimilarityAccessorials: Array<{
    name: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
  const matchedExtractedIndices = new Set<number>();
  const matchedGroundTruthIndices = new Set<number>();
  const missingAccessorials: any[] = [];
  const extraAccessorials: any[] = [];
  const lowSimilarityAccessorials: any[] = [];
  let totalSimilarity = 0;
  let matchedRows = 0;
  // Fields to compare for accessorials (excluding pages and qualifier which are metadata)
  const fieldsToCompare = ['term', 'discount'];
  const fieldWeights = {
    term: 1.0,      // Term is very important for accessorial classification
    discount: 1.0   // Discount is critical for financial accuracy
  };
  // Step 1: For each ground truth accessorial, try to find matching extracted accessorial by name
  for (let i = 0; i < groundTruthAccessorials.length; i++) {
    const groundTruthAccessorial = groundTruthAccessorials[i];
    const gtAccessorialName = groundTruthAccessorial.name;
    if (!gtAccessorialName) {
      continue;
    }
    // Find extracted accessorial with matching name
    let foundMatch = false;
    let bestMatchIdx = -1;
    let bestNameSimilarity = 0;
    // First try to find exact or very close name matches using fuzzy logic
    for (let j = 0; j < extractedAccessorials.length; j++) {
      if (matchedExtractedIndices.has(j)) continue; // Already matched
      const extractedAccessorial = extractedAccessorials[j];
      const extractedAccessorialName = extractedAccessorial.name;
      if (!extractedAccessorialName) continue;
      // Use fuzzy string matching for accessorial names
      let nameSimilarity = 0;
      // Try exact match first
      if (gtAccessorialName === extractedAccessorialName) {
        nameSimilarity = 1.0;
      } else {
        // Check if they're visually identical but different character codes
        const gtNormalized = gtAccessorialName.trim();
        const extractedNormalized = extractedAccessorialName.trim();
        if (gtNormalized === extractedNormalized) {
          nameSimilarity = 1.0;
        } else {
          // Use fuzzy string similarity for accessorial names
          nameSimilarity = calculateStringSimilarity(gtAccessorialName, extractedAccessorialName);
          // Special handling for common accessorial name variations
          if (nameSimilarity < 0.8) {
            // Normalize common variations in accessorial names
            const normalizeAccessorialName = (name: string) => {
              return name
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/\s*-\s*/g, ' ')   // Normalize dashes
                .trim();
            };
            const normalizedGt = normalizeAccessorialName(gtAccessorialName);
            const normalizedExtracted = normalizeAccessorialName(extractedAccessorialName);
            // Re-calculate similarity with normalized names
            const normalizedSimilarity = calculateStringSimilarity(normalizedGt, normalizedExtracted);
            if (normalizedSimilarity > nameSimilarity) {
              nameSimilarity = normalizedSimilarity;
            }
            // Special subset matching: Check if most words from ground truth are present in extracted
            if (nameSimilarity < 0.8) {
              const gtWords = normalizedGt.split(/\s+/).filter(word => word.length > 2); // Ignore very short words
              const extractedWords = normalizedExtracted.split(/\s+/).filter(word => word.length > 2);
              if (gtWords.length > 0) {
                // Count how many GT words are found in extracted words
                let matchedWords = 0;
                const matchedWordsList: string[] = [];
                for (const gtWord of gtWords) {
                  // Check if this GT word exists in any of the extracted words (with fuzzy matching)
                  const wordFound = extractedWords.some(extractedWord => {
                    const wordSimilarity = calculateStringSimilarity(gtWord, extractedWord);
                    return wordSimilarity >= 0.8; // Allow some variation in individual words
                  });
                  if (wordFound) {
                    matchedWords++;
                    matchedWordsList.push(gtWord);
                  }
                }
                const wordMatchRatio = matchedWords / gtWords.length;
                // If 70% or more of the meaningful words match, consider it a good match
                // This allows for 1-2 words to be missing from shorter names, or 2-3 from longer names
                if (wordMatchRatio >= 0.7) {
                  nameSimilarity = Math.max(nameSimilarity, 0.85); // Give it a high similarity score
                }
              }
            }
          }
        }
      }
      // Consider it a match if name similarity is >= 80%
      if (nameSimilarity >= 0.8 && nameSimilarity > bestNameSimilarity) {
        bestNameSimilarity = nameSimilarity;
        bestMatchIdx = j;
      }
    }
    if (bestMatchIdx !== -1) {
      const extractedAccessorial = extractedAccessorials[bestMatchIdx];
      // Accessorial names match well enough - now compare other fields
      let totalFieldWeight = 0;
      let totalWeightedSimilarity = 0;
      const fieldDifferences: Array<{
        field: string
        actual: any
        expected: any
        similarity: number
      }> = [];
      // Compare each field
      for (const field of fieldsToCompare) {
        const gtValue = groundTruthAccessorial[field];
        const extractedValue = extractedAccessorial[field];
        const weight = fieldWeights[field as keyof typeof fieldWeights] || 1.0;
        let fieldSimilarity = 0;
        if (field === 'term') {
          // Use fuzzy matching for term field as well
          if (gtValue === extractedValue) {
            fieldSimilarity = 1.0;
          } else if (gtValue && extractedValue) {
            fieldSimilarity = calculateStringSimilarity(String(gtValue), String(extractedValue));
            // Special handling for common term variations
            if (fieldSimilarity < 0.8) {
              const normalizeTerm = (term: string) => {
                return String(term)
                  .toLowerCase()
                  .replace(/\s+/g, ' ')
                  .trim();
              };
              const normalizedGt = normalizeTerm(gtValue);
              const normalizedExtracted = normalizeTerm(extractedValue);
              const normalizedSimilarity = calculateStringSimilarity(normalizedGt, normalizedExtracted);
              if (normalizedSimilarity > fieldSimilarity) {
                fieldSimilarity = normalizedSimilarity;
              }
            }
          } else {
            fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
          }
        } else if (field === 'discount') {
          // For discount, we need exact or very close match since it's a percentage
          fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
        } else {
          fieldSimilarity = calculateValueSimilarity(gtValue, extractedValue);
        }
        totalFieldWeight += weight;
        totalWeightedSimilarity += fieldSimilarity * weight;
        if (fieldSimilarity < 0.8) {
          fieldDifferences.push({
            field,
            actual: gtValue,
            expected: extractedValue,
            similarity: fieldSimilarity
          });
        }
      }
      // Include name similarity in the overall calculation
      const nameWeight = 1.0; // Name matching is critical
      totalFieldWeight += nameWeight;
      totalWeightedSimilarity += bestNameSimilarity * nameWeight;
      // Calculate overall accessorial similarity
      const accessorialSimilarity = totalFieldWeight > 0 ? totalWeightedSimilarity / totalFieldWeight : 0;
      // Mark as matched
      matchedExtractedIndices.add(bestMatchIdx);
      matchedGroundTruthIndices.add(i);
      totalSimilarity += accessorialSimilarity;
      matchedRows++;
      foundMatch = true;
      // Track low similarity accessorials
      if (accessorialSimilarity < 0.8) {
        lowSimilarityAccessorials.push({
          name: gtAccessorialName,
          similarity: accessorialSimilarity * 100,
          fieldDifferences
        });
      }
    }
    if (!foundMatch) {
      missingAccessorials.push({
        name: gtAccessorialName,
        term: groundTruthAccessorial.term || '',
        discount: groundTruthAccessorial.discount || ''
      });
    }
  }
  // Step 2: Find extra accessorials in extracted data (not in ground truth)
  for (let j = 0; j < extractedAccessorials.length; j++) {
    if (!matchedExtractedIndices.has(j)) {
      const extractedAccessorial = extractedAccessorials[j];
      extraAccessorials.push({
        name: extractedAccessorial.name || '',
        term: extractedAccessorial.term || '',
        discount: extractedAccessorial.discount || ''
      });
    }
  }
  // Calculate final metrics
  const overallSimilarity = groundTruthAccessorials.length > 0 ? totalSimilarity / groundTruthAccessorials.length : 0;
  
  // Deduplicate accessorials to avoid showing the same accessorial multiple times
  const seenMissingAccessorials = new Set<string>();
  const uniqueMissingAccessorials = missingAccessorials.filter(accessorial => {
    const normalizedName = accessorial.name?.toLowerCase().trim() || '';
    if (seenMissingAccessorials.has(normalizedName)) return false;
    seenMissingAccessorials.add(normalizedName);
    return true;
  });
  
  const seenExtraAccessorials = new Set<string>();
  const uniqueExtraAccessorials = extraAccessorials.filter(accessorial => {
    const normalizedName = accessorial.name?.toLowerCase().trim() || '';
    if (seenExtraAccessorials.has(normalizedName)) return false;
    seenExtraAccessorials.add(normalizedName);
    return true;
  });
  
  const seenLowSimilarityAccessorials = new Set<string>();
  const uniqueLowSimilarityAccessorials = lowSimilarityAccessorials.filter(accessorial => {
    const normalizedName = accessorial.name?.toLowerCase().trim() || '';
    if (seenLowSimilarityAccessorials.has(normalizedName)) return false;
    seenLowSimilarityAccessorials.add(normalizedName);
    return true;
  });
  
  return {
    similarity: overallSimilarity,
    matchedRows,
    totalGroundTruthRows: groundTruthAccessorials.length,
    totalExtractedRows: extractedAccessorials.length,
    missingAccessorials: uniqueMissingAccessorials,
    extraAccessorials: uniqueExtraAccessorials,
    lowSimilarityAccessorials: uniqueLowSimilarityAccessorials
  };
}
function compareTierDiscount(
  groundTruthTierDiscount: any[],
  extractedTierDiscount: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingTierDiscounts: Array<{
    service: string
    discount: string
    weeklySpendMax: string
    weeklySpendMin: string
  }>
  extraTierDiscounts: Array<{
    service: string
    discount: string
    weeklySpendMax: string
    weeklySpendMin: string
  }>
  lowSimilarityTierDiscounts: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
  if (groundTruthTierDiscount.length === 0 && extractedTierDiscount.length === 0) {
    return {
      similarity: 1.0,
      matchedRows: 0,
      totalGroundTruthRows: 0,
      totalExtractedRows: 0,
      missingTierDiscounts: [],
      extraTierDiscounts: [],
      lowSimilarityTierDiscounts: []
    }
  }
  // Track current assignments: extracted index -> {gt index, similarity score, field differences}
  const currentAssignments: Map<number, {
    gtIndex: number;
    similarity: number;
    fieldDifferences: Array<{
      field: string;
      actual: any;
      expected: any;
      similarity: number;
    }>;
  }> = new Map();
  // Track services that need to be re-matched due to reassignment
  const needsRematching: Set<number> = new Set();
  // Function to find best match for a GT service
  const findBestMatch = (gtIndex: number, excludeAssigned: boolean = false): {
    exIndex: number;
    similarity: number;
    fieldDifferences: Array<{
      field: string;
      actual: any;
      expected: any;
      similarity: number;
    }>;
  } | null => {
    const groundTruthRow = groundTruthTierDiscount[gtIndex];
    const gtService = groundTruthRow.service || "";
    if (!gtService) return null;
    let bestSimilarity = 0.0;
    let bestMatchIndex = -1;
    let bestFieldDifferences: Array<{
      field: string;
      actual: any;
      expected: any;
      similarity: number;
    }> = [];
    for (let j = 0; j < extractedTierDiscount.length; j++) {
      // Skip if we're excluding assigned services and this one is assigned
      if (excludeAssigned && currentAssignments.has(j)) continue;
      const extractedRow = extractedTierDiscount[j];
      const extractedService = extractedRow.service || "";
      if (extractedService && matchTierDiscountService(gtService, extractedService)) {
        const similarity = calculateTierDiscountSimilarity(groundTruthRow, extractedRow);
        if (similarity.similarity > bestSimilarity) {
          bestSimilarity = similarity.similarity;
          bestMatchIndex = j;
          bestFieldDifferences = similarity.fieldDifferences;
        }
      }
    }
    if (bestMatchIndex !== -1 && bestSimilarity >= 0.75) {
      return {
        exIndex: bestMatchIndex,
        similarity: bestSimilarity,
        fieldDifferences: bestFieldDifferences
      };
    }
    return null;
  };
  // Process each GT service
  for (let i = 0; i < groundTruthTierDiscount.length; i++) {
    // Skip if this service needs to be re-matched later
    if (needsRematching.has(i)) continue;
    const groundTruthRow = groundTruthTierDiscount[i];
    const gtService = groundTruthRow.service || "";
    if (!gtService) continue;
    // Find the best match for this service (including already assigned ones)
    const bestMatch = findBestMatch(i, false);
    if (!bestMatch) continue;
    // Check if this extracted service is already assigned
    if (currentAssignments.has(bestMatch.exIndex)) {
      const currentAssignment = currentAssignments.get(bestMatch.exIndex)!;
      if (bestMatch.similarity > currentAssignment.similarity) {
        // Mark the displaced service for re-matching
        needsRematching.add(currentAssignment.gtIndex);
        // Update assignment
        currentAssignments.set(bestMatch.exIndex, {
          gtIndex: i,
          similarity: bestMatch.similarity,
          fieldDifferences: bestMatch.fieldDifferences
        });
      } else {
        // Try to find an alternative match excluding already assigned services
        const altMatch = findBestMatch(i, true);
        if (altMatch) {
          currentAssignments.set(altMatch.exIndex, {
            gtIndex: i,
            similarity: altMatch.similarity,
            fieldDifferences: altMatch.fieldDifferences
          });
        }
      }
    } else {
      // Service is not assigned, assign it
      currentAssignments.set(bestMatch.exIndex, {
        gtIndex: i,
        similarity: bestMatch.similarity,
        fieldDifferences: bestMatch.fieldDifferences
      });
    }
  }
  // Process services that need re-matching
  for (const gtIndex of needsRematching) {
    // Find best available match (excluding assigned services)
    const rematch = findBestMatch(gtIndex, true);
    if (rematch) {
      currentAssignments.set(rematch.exIndex, {
        gtIndex: gtIndex,
        similarity: rematch.similarity,
        fieldDifferences: rematch.fieldDifferences
      });
    }
  }
  // Calculate final results
  let totalSimilarity = 0.0;
  let matchedRows = 0;
  const missingTierDiscounts: Array<{
    service: string;
    discount: string;
    weeklySpendMax: string;
    weeklySpendMin: string;
  }> = [];
  const lowSimilarityTierDiscounts: Array<{
    service: string;
    similarity: number;
    fieldDifferences: Array<{
      field: string;
      actual: any;
      expected: any;
      similarity: number;
    }>;
  }> = [];
  // Track which GT services got matched
  const matchedGtServices = new Set<number>();
  for (const [exIndex, assignment] of currentAssignments) {
    matchedGtServices.add(assignment.gtIndex);
    totalSimilarity += assignment.similarity;
    matchedRows++;
    if (assignment.similarity < 0.9) {
      const gtRow = groundTruthTierDiscount[assignment.gtIndex];
      lowSimilarityTierDiscounts.push({
        service: gtRow.service || "Unknown",
        similarity: assignment.similarity * 100,
        fieldDifferences: assignment.fieldDifferences
      });
    }
  }
  // Add unmatched GT services to missing
  for (let i = 0; i < groundTruthTierDiscount.length; i++) {
    if (!matchedGtServices.has(i)) {
      const gtRow = groundTruthTierDiscount[i];
      missingTierDiscounts.push({
        service: gtRow.service || "Unknown",
        discount: gtRow.discount || "",
        weeklySpendMax: gtRow.weeklySpendMax || "",
        weeklySpendMin: gtRow.weeklySpendMin || ""
      });
    }
  }
  // Add unmatched EX services to extra
  const extraTierDiscounts: Array<{
    service: string;
    discount: string;
    weeklySpendMax: string;
    weeklySpendMin: string;
  }> = [];
  for (let j = 0; j < extractedTierDiscount.length; j++) {
    if (!currentAssignments.has(j)) {
      const exRow = extractedTierDiscount[j];
      extraTierDiscounts.push({
        service: exRow.service || "Unknown",
        discount: exRow.discount || "",
        weeklySpendMax: exRow.weeklySpendMax || "",
        weeklySpendMin: exRow.weeklySpendMin || ""
      });
    }
  }
  const totalGroundTruthRows = groundTruthTierDiscount.length;
  const finalSimilarity = totalGroundTruthRows > 0 ? totalSimilarity / totalGroundTruthRows : 1.0;
  
  // Deduplicate tier discounts to avoid showing the same service multiple times
  const seenMissingTierDiscounts = new Set<string>();
  const uniqueMissingTierDiscounts = missingTierDiscounts.filter(tierDiscount => {
    const normalizedService = tierDiscount.service?.toLowerCase().trim() || '';
    if (seenMissingTierDiscounts.has(normalizedService)) return false;
    seenMissingTierDiscounts.add(normalizedService);
    return true;
  });
  
  const seenExtraTierDiscounts = new Set<string>();
  const uniqueExtraTierDiscounts = extraTierDiscounts.filter(tierDiscount => {
    const normalizedService = tierDiscount.service?.toLowerCase().trim() || '';
    if (seenExtraTierDiscounts.has(normalizedService)) return false;
    seenExtraTierDiscounts.add(normalizedService);
    return true;
  });
  
  const seenLowSimilarityTierDiscounts = new Set<string>();
  const uniqueLowSimilarityTierDiscounts = lowSimilarityTierDiscounts.filter(tierDiscount => {
    const normalizedService = tierDiscount.service?.toLowerCase().trim() || '';
    if (seenLowSimilarityTierDiscounts.has(normalizedService)) return false;
    seenLowSimilarityTierDiscounts.add(normalizedService);
    return true;
  });
  
  return {
    similarity: finalSimilarity,
    matchedRows,
    totalGroundTruthRows,
    totalExtractedRows: extractedTierDiscount.length,
    missingTierDiscounts: uniqueMissingTierDiscounts,
    extraTierDiscounts: uniqueExtraTierDiscounts,
    lowSimilarityTierDiscounts: uniqueLowSimilarityTierDiscounts
  }
}
function calculateTierDiscountSimilarity(
  groundTruthRow: any,
  extractedRow: any
): {
  similarity: number
  fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }>
} {
  const fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }> = []
  // Primary matching on service name (60% weight) - use UPS-specific matching
  let serviceSimilarity = 0;
  let upsServiceMatch = false;
  const gtService = groundTruthRow.service || "";
  const extractedService = extractedRow.service || "";
  // Normalize service names first to handle encoding/whitespace issues
  const normalizeForMatching = (service: string) => {
    return service
      .replace(/\\n/g, " ")   // Replace escaped newlines
      .replace(/\n/g, " ")    // Replace actual newlines
      .replace(/\s+/g, " ")   // Normalize whitespace
      .trim();
  };
  const normalizedGtService = normalizeForMatching(gtService);
  const normalizedExtractedService = normalizeForMatching(extractedService);
  // Try strict tier discount service matching - all components must match exactly
  if (normalizedGtService && normalizedExtractedService && matchTierDiscountService(normalizedGtService, normalizedExtractedService)) {
    serviceSimilarity = 1.0; // Perfect match when all components match exactly
    upsServiceMatch = true;
  } else {
    // No partial matching for tier_discount - either all components match or it's 0
    serviceSimilarity = 0.0;
  }
  fieldDifferences.push({
    field: "service",
    actual: groundTruthRow.service,
    expected: extractedRow.service,
    similarity: serviceSimilarity
  })
  // Compare discount (15% weight)
  const discountSimilarity = calculateValueSimilarity(
    groundTruthRow.discount,
    extractedRow.discount
  )
  fieldDifferences.push({
    field: "discount",
    actual: groundTruthRow.discount,
    expected: extractedRow.discount,
    similarity: discountSimilarity
  })
  // Compare weeklySpendMax (12.5% weight)
  const weeklySpendMaxSimilarity = calculateValueSimilarity(
    groundTruthRow.weeklySpendMax,
    extractedRow.weeklySpendMax
  )
  fieldDifferences.push({
    field: "weeklySpendMax",
    actual: groundTruthRow.weeklySpendMax,
    expected: extractedRow.weeklySpendMax,
    similarity: weeklySpendMaxSimilarity
  })
  // Compare weeklySpendMin (12.5% weight)
  const weeklySpendMinSimilarity = calculateValueSimilarity(
    groundTruthRow.weeklySpendMin,
    extractedRow.weeklySpendMin
  )
  fieldDifferences.push({
    field: "weeklySpendMin",
    actual: groundTruthRow.weeklySpendMin,
    expected: extractedRow.weeklySpendMin,
    similarity: weeklySpendMinSimilarity
  })
  // Calculate weighted similarity
  let overallSimilarity =
    serviceSimilarity * 0.6 +
    discountSimilarity * 0.15 +
    weeklySpendMaxSimilarity * 0.125 +
    weeklySpendMinSimilarity * 0.125
  // IMPROVED: If we have a strong UPS service match (>= 90%) or high string similarity (>= 85%),
  // be more lenient with overall scoring to avoid false negatives
  if (serviceSimilarity >= 0.9) {
    // Boost the overall similarity when service matches well
    const serviceBonus = Math.min(0.15, (serviceSimilarity - 0.85) * 0.5);
    overallSimilarity += serviceBonus;
  }
  return {
    similarity: Math.min(1.0, overallSimilarity), // Cap at 100%
    fieldDifferences
  }
}
function compareIncentiveBaseDiscount(
  groundTruthIncentiveBaseDiscount: any[],
  extractedIncentiveBaseDiscount: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingIncentiveBaseDiscounts: Array<{
    service: string
    zone: string
    weight: string
    discount: string
    destination: string | null
  }>
  extraIncentiveBaseDiscounts: Array<{
    service: string
    zone: string
    weight: string
    discount: string
    destination: string | null
  }>
  lowSimilarityIncentiveBaseDiscounts: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
        if (groundTruthIncentiveBaseDiscount.length === 0 && extractedIncentiveBaseDiscount.length === 0) {
        return {
      similarity: 1.0,
      matchedRows: 0,
      totalGroundTruthRows: 0,
      totalExtractedRows: 0,
      missingIncentiveBaseDiscounts: [],
      extraIncentiveBaseDiscounts: [],
      lowSimilarityIncentiveBaseDiscounts: []
    }
  }
  let totalSimilarity = 0.0
  let matchedRows = 0
  const missingIncentiveBaseDiscounts: Array<{
    service: string
    zone: string
    weight: string
    discount: string
    destination: string | null
  }> = []
  const extraIncentiveBaseDiscounts: Array<{
    service: string
    zone: string
    weight: string
    discount: string
    destination: string | null
  }> = []
  const lowSimilarityIncentiveBaseDiscounts: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }> = []
  // Track which extracted rows have been matched
  const matchedExtractedRows = new Array(extractedIncentiveBaseDiscount.length).fill(false)
  // For each ground truth incentive base discount, find the best match in extracted
  for (let i = 0; i < groundTruthIncentiveBaseDiscount.length; i++) {
    const groundTruthRow = groundTruthIncentiveBaseDiscount[i]
    let bestSimilarity = 0.0
    let bestMatchIndex = -1
    let bestFieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }> = []
                            // Try to find the best match
    for (let j = 0; j < extractedIncentiveBaseDiscount.length; j++) {
      if (!matchedExtractedRows[j]) {
        const extractedRow = extractedIncentiveBaseDiscount[j]
        // Calculate similarity for this pair
        const similarity = calculateIncentiveBaseDiscountSimilarity(groundTruthRow, extractedRow)
        if (similarity.similarity > bestSimilarity) {
          bestSimilarity = similarity.similarity
          bestMatchIndex = j
          bestFieldDifferences = similarity.fieldDifferences
        }
      }
    }
    // If we found a good match
    if (bestMatchIndex !== -1 && bestSimilarity >= 0.75) {
            matchedExtractedRows[bestMatchIndex] = true
      totalSimilarity += bestSimilarity
      matchedRows++
      // Check if this is a low similarity match
      if (bestSimilarity < 0.9) {
                lowSimilarityIncentiveBaseDiscounts.push({
          service: groundTruthRow.service || "Unknown",
          similarity: bestSimilarity * 100,
          fieldDifferences: bestFieldDifferences
        })
      }
    } else {
      // Second pass: Try subset matching for missing services
      // Check if most of the service name is present but last 1-2 words are missing
      const gtService = groundTruthRow.service || "";
      if (gtService) {
        let bestSubsetMatchIdx = -1;
        let bestSubsetSimilarity = 0;
        let bestSubsetFieldDifferences: Array<{
          field: string
          actual: any
          expected: any
          similarity: number
        }> = [];
        // Extract meaningful words (filter out short words)
        const gtWords = gtService.toLowerCase()
          .replace(/[®™©]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .split(/\s+/)
          .filter((word: string) => word.length > 2);
        if (gtWords.length >= 3) { // Only try subset matching if we have enough words
          for (let j = 0; j < extractedIncentiveBaseDiscount.length; j++) {
            if (!matchedExtractedRows[j]) {
              const extractedRow = extractedIncentiveBaseDiscount[j];
              const extractedService = extractedRow.service || "";
              if (extractedService) {
                const extractedWords = extractedService.toLowerCase()
                  .replace(/[®™©]/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .split(/\s+/)
                  .filter((word: string) => word.length > 2);
                // Count how many GT words are found in extracted words
                let matchedWords = 0;
                for (const gtWord of gtWords) {
                  const wordFound = extractedWords.some((extractedWord: string) => {
                    const wordSimilarity = calculateStringSimilarity(gtWord, extractedWord);
                    return wordSimilarity >= 0.8;
                  });
                  if (wordFound) matchedWords++;
                }
                const wordMatchRatio = matchedWords / gtWords.length;
                // If 70% or more words match, consider it a subset match
                if (wordMatchRatio >= 0.7) {
                  const subsetSimilarity = calculateIncentiveBaseDiscountSimilarity(groundTruthRow, extractedRow);
                  if (subsetSimilarity.similarity > bestSubsetSimilarity) {
                    bestSubsetSimilarity = subsetSimilarity.similarity;
                    bestSubsetMatchIdx = j;
                    bestSubsetFieldDifferences = subsetSimilarity.fieldDifferences;
                                      }
                }
              }
            }
          }
        }
        // If we found a good subset match, use it
        if (bestSubsetMatchIdx !== -1 && bestSubsetSimilarity >= 0.75) {
                    matchedExtractedRows[bestSubsetMatchIdx] = true;
          // Use the actual calculated similarity, but ensure it's at least 85% for word-based matches
          const finalSimilarity = bestSubsetSimilarity < 0.85 ? 0.85 : bestSubsetSimilarity;
          totalSimilarity += finalSimilarity;
          matchedRows++;
          // Track as low similarity for review
          lowSimilarityIncentiveBaseDiscounts.push({
            service: groundTruthRow.service || "Unknown",
            similarity: bestSubsetSimilarity * 100,
            fieldDifferences: bestSubsetFieldDifferences
          });
        } else {
          // Third pass: Try superset matching for missing services
          // Check if all ground truth words are present in extracted (which may have additional words)
          let bestSupersetMatchIdx = -1;
          let bestSupersetSimilarity = 0;
          let bestSupersetFieldDifferences: Array<{
            field: string
            actual: any
            expected: any
            similarity: number
          }> = [];
          if (gtWords.length >= 2) { // Only try superset matching if we have at least 2 words
            for (let j = 0; j < extractedIncentiveBaseDiscount.length; j++) {
              if (!matchedExtractedRows[j]) {
                const extractedRow = extractedIncentiveBaseDiscount[j];
                const extractedService = extractedRow.service || "";
                if (extractedService) {
                  const extractedWords = extractedService.toLowerCase()
                    .replace(/[®™©]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .split(/\s+/)
                    .filter((word: string) => word.length > 2);
                  // Check if ALL ground truth words are found in extracted words
                  let allGtWordsFound = true;
                  let matchedGtWords = 0;
                  for (const gtWord of gtWords) {
                    const wordFound = extractedWords.some((extractedWord: string) => {
                      const wordSimilarity = calculateStringSimilarity(gtWord, extractedWord);
                      return wordSimilarity >= 0.8;
                    });
                    if (wordFound) {
                      matchedGtWords++;
                    } else {
                      allGtWordsFound = false;
                      break;
                    }
                  }
                  // If ALL ground truth words are found (superset match)
                  if (allGtWordsFound && extractedWords.length >= gtWords.length) {
                    const supersetSimilarity = calculateIncentiveBaseDiscountSimilarity(groundTruthRow, extractedRow);
                    if (supersetSimilarity.similarity > bestSupersetSimilarity) {
                      bestSupersetSimilarity = supersetSimilarity.similarity;
                      bestSupersetMatchIdx = j;
                      bestSupersetFieldDifferences = supersetSimilarity.fieldDifferences;
                                          }
                  }
                }
              }
            }
          }
          // If we found a good superset match, use it
          if (bestSupersetMatchIdx !== -1 && bestSupersetSimilarity >= 0.75) {
                        matchedExtractedRows[bestSupersetMatchIdx] = true;
            // Use the actual calculated similarity, but ensure it's at least 85% for word-based matches
            const finalSimilarity = bestSupersetSimilarity < 0.85 ? 0.85 : bestSupersetSimilarity;
            totalSimilarity += finalSimilarity;
            matchedRows++;
            // Track as low similarity for review
            lowSimilarityIncentiveBaseDiscounts.push({
              service: groundTruthRow.service || "Unknown",
              similarity: bestSupersetSimilarity * 100,
              fieldDifferences: bestSupersetFieldDifferences
            });
          } else {
            // No subset or superset match found - add to missing
            missingIncentiveBaseDiscounts.push({
              service: groundTruthRow.service || "Unknown",
              zone: groundTruthRow.zone || "",
              weight: groundTruthRow.weight || "",
              discount: groundTruthRow.discount || "",
              destination: groundTruthRow.destination || null
            });
          }
        }
      } else {
        // No service name to match
        missingIncentiveBaseDiscounts.push({
          service: groundTruthRow.service || "Unknown",
          zone: groundTruthRow.zone || "",
          weight: groundTruthRow.weight || "",
          discount: groundTruthRow.discount || "",
          destination: groundTruthRow.destination || null
        });
      }
    }
  }
  // Collect unmatched extracted rows as extra
  for (let j = 0; j < extractedIncentiveBaseDiscount.length; j++) {
    if (!matchedExtractedRows[j]) {
      const extractedRow = extractedIncentiveBaseDiscount[j]
      extraIncentiveBaseDiscounts.push({
        service: extractedRow.service || "Unknown",
        zone: extractedRow.zone || "",
        weight: extractedRow.weight || "",
        discount: extractedRow.discount || "",
        destination: extractedRow.destination || null
      })
    }
  }
  const totalGroundTruthRows = groundTruthIncentiveBaseDiscount.length
  const finalSimilarity = totalGroundTruthRows > 0 ? totalSimilarity / totalGroundTruthRows : 1.0
  // Deduplicate missing and extra incentive base discounts by service name with improved normalization
  const seenMissingIncentiveBaseDiscounts = new Set<string>();
  const uniqueMissingIncentiveBaseDiscounts = missingIncentiveBaseDiscounts.filter(item => {
    const normalizedService = item.service?.toLowerCase().trim() || '';
    if (seenMissingIncentiveBaseDiscounts.has(normalizedService)) return false;
    seenMissingIncentiveBaseDiscounts.add(normalizedService);
    return true;
  });
  
  const seenExtraIncentiveBaseDiscounts = new Set<string>();
  const uniqueExtraIncentiveBaseDiscounts = extraIncentiveBaseDiscounts.filter(item => {
    const normalizedService = item.service?.toLowerCase().trim() || '';
    if (seenExtraIncentiveBaseDiscounts.has(normalizedService)) return false;
    seenExtraIncentiveBaseDiscounts.add(normalizedService);
    return true;
  });
                  return {
    similarity: finalSimilarity,
    matchedRows,
    totalGroundTruthRows,
    totalExtractedRows: extractedIncentiveBaseDiscount.length,
    missingIncentiveBaseDiscounts: uniqueMissingIncentiveBaseDiscounts,
    extraIncentiveBaseDiscounts: uniqueExtraIncentiveBaseDiscounts,
    lowSimilarityIncentiveBaseDiscounts
  }
}
function calculateIncentiveBaseDiscountSimilarity(
  groundTruthRow: any,
  extractedRow: any
): {
  similarity: number
  fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }>
} {
  const fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }> = []
  // Primary matching on service name (50% weight) - use UPS-specific matching
  let serviceSimilarity = 0;
  const gtService = groundTruthRow.service || "";
  const extractedService = extractedRow.service || "";
  // Try UPS-specific matching first
  if (gtService && extractedService && matchUpsService(gtService, extractedService)) {
    serviceSimilarity = 0.95; // High similarity for UPS match
  } else {
    // Fall back to string similarity
    serviceSimilarity = calculateStringSimilarity(gtService, extractedService);
  }
  fieldDifferences.push({
    field: "service",
    actual: groundTruthRow.service,
    expected: extractedRow.service,
    similarity: serviceSimilarity
  })
  // Only proceed with other fields if service similarity is reasonable
  if (serviceSimilarity < 0.7) {
    return {
      similarity: serviceSimilarity * 0.5, // Service name is primary
      fieldDifferences
    }
  }
  // Compare zone (15% weight)
  const zoneSimilarity = calculateValueSimilarity(
    groundTruthRow.zone,
    extractedRow.zone
  )
  fieldDifferences.push({
    field: "zone",
    actual: groundTruthRow.zone,
    expected: extractedRow.zone,
    similarity: zoneSimilarity
  })
  // Compare weight (15% weight)
  const weightSimilarity = calculateValueSimilarity(
    groundTruthRow.weight,
    extractedRow.weight
  )
  fieldDifferences.push({
    field: "weight",
    actual: groundTruthRow.weight,
    expected: extractedRow.weight,
    similarity: weightSimilarity
  })
  // Compare discount (15% weight)
  const discountSimilarity = calculateValueSimilarity(
    groundTruthRow.discount,
    extractedRow.discount
  )
  fieldDifferences.push({
    field: "discount",
    actual: groundTruthRow.discount,
    expected: extractedRow.discount,
    similarity: discountSimilarity
  })
  // Compare destination (5% weight) - handle null values properly
  const destinationSimilarity = calculateValueSimilarity(
    groundTruthRow.destination,
    extractedRow.destination
  )
  fieldDifferences.push({
    field: "destination",
    actual: groundTruthRow.destination,
    expected: extractedRow.destination,
    similarity: destinationSimilarity
  })
  // Calculate weighted similarity
  const overallSimilarity =
    serviceSimilarity * 0.5 +
    zoneSimilarity * 0.15 +
    weightSimilarity * 0.15 +
    discountSimilarity * 0.15 +
    destinationSimilarity * 0.05
  return {
    similarity: overallSimilarity,
    fieldDifferences
  }
}
function compareMinimumAdjustment(
  groundTruthMinimumAdjustment: any[],
  extractedMinimumAdjustment: any[]
): {
  similarity: number
  matchedRows: number
  totalGroundTruthRows: number
  totalExtractedRows: number
  missingMinimumAdjustments: Array<{
    service: string
    zone: string
    adjustmentDiscount: string
  }>
  extraMinimumAdjustments: Array<{
    service: string
    zone: string
    adjustmentDiscount: string
  }>
  lowSimilarityMinimumAdjustments: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }>
} {
        let totalSimilarity = 0;
  let matchedRows = 0;
  const missingMinimumAdjustments: Array<{
    service: string
    zone: string
    adjustmentDiscount: string
  }> = [];
  const extraMinimumAdjustments: Array<{
    service: string
    zone: string
    adjustmentDiscount: string
  }> = [];
  const lowSimilarityMinimumAdjustments: Array<{
    service: string
    similarity: number
    fieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }>
  }> = [];
  // Track which extracted rows have been matched
  const matchedExtractedRows: boolean[] = new Array(extractedMinimumAdjustment.length).fill(false);
  // Compare each ground truth row
  for (let i = 0; i < groundTruthMinimumAdjustment.length; i++) {
    const groundTruthRow = groundTruthMinimumAdjustment[i];
        let bestMatch = -1;
    let bestSimilarity = 0;
    let bestFieldDifferences: Array<{
      field: string
      actual: any
      expected: any
      similarity: number
    }> = [];
    // Try to find the best matching extracted row
    for (let j = 0; j < extractedMinimumAdjustment.length; j++) {
      if (matchedExtractedRows[j]) continue; // Skip already matched rows
      const extractedRow = extractedMinimumAdjustment[j];
      // First check if services match using UPS service matching
      const groundTruthService = groundTruthRow.service || "";
      const extractedService = extractedRow.service || "";
      if (groundTruthService && extractedService) {
        const servicesMatch = matchUpsService(groundTruthService, extractedService);
        if (servicesMatch) {
          // Calculate similarity for this row (only zone and adjustmentDiscount)
          const rowSimilarity = calculateMinimumAdjustmentSimilarity(groundTruthRow, extractedRow);
          if (rowSimilarity.similarity > bestSimilarity) {
            bestMatch = j;
            bestSimilarity = rowSimilarity.similarity;
            bestFieldDifferences = rowSimilarity.fieldDifferences;
          }
        }
      }
    }
    if (bestMatch !== -1) {
      matchedExtractedRows[bestMatch] = true;
      totalSimilarity += bestSimilarity;
      matchedRows++;
      // If similarity is low, add to low similarity list for review
      if (bestSimilarity < 0.8) {
        lowSimilarityMinimumAdjustments.push({
          service: groundTruthRow.service || "Unknown",
          similarity: bestSimilarity * 100,
          fieldDifferences: bestFieldDifferences
        });
      }
    } else {
            // No match found - add to missing
      missingMinimumAdjustments.push({
        service: groundTruthRow.service || "Unknown",
        zone: groundTruthRow.zone || "",
        adjustmentDiscount: groundTruthRow.adjustmentDiscount || ""
      });
    }
  }
  // Collect unmatched extracted rows as extra
  for (let j = 0; j < extractedMinimumAdjustment.length; j++) {
    if (!matchedExtractedRows[j]) {
      const extractedRow = extractedMinimumAdjustment[j];
      extraMinimumAdjustments.push({
        service: extractedRow.service || "Unknown",
        zone: extractedRow.zone || "",
        adjustmentDiscount: extractedRow.adjustmentDiscount || ""
      });
    }
  }
  const totalGroundTruthRows = groundTruthMinimumAdjustment.length;
  const finalSimilarity = totalGroundTruthRows > 0 ? totalSimilarity / totalGroundTruthRows : 1.0;
  // Deduplicate missing and extra minimum adjustments by service name with improved normalization
  const seenMissingMinimumAdjustments = new Set<string>();
  const uniqueMissingMinimumAdjustments = missingMinimumAdjustments.filter(item => {
    const normalizedService = item.service?.toLowerCase().trim() || '';
    if (seenMissingMinimumAdjustments.has(normalizedService)) return false;
    seenMissingMinimumAdjustments.add(normalizedService);
    return true;
  });
  
  const seenExtraMinimumAdjustments = new Set<string>();
  const uniqueExtraMinimumAdjustments = extraMinimumAdjustments.filter(item => {
    const normalizedService = item.service?.toLowerCase().trim() || '';
    if (seenExtraMinimumAdjustments.has(normalizedService)) return false;
    seenExtraMinimumAdjustments.add(normalizedService);
    return true;
  });
  
  // Also deduplicate low similarity minimum adjustments
  const seenLowSimilarityMinimumAdjustments = new Set<string>();
  const uniqueLowSimilarityMinimumAdjustments = lowSimilarityMinimumAdjustments.filter(item => {
    const normalizedService = item.service?.toLowerCase().trim() || '';
    if (seenLowSimilarityMinimumAdjustments.has(normalizedService)) return false;
    seenLowSimilarityMinimumAdjustments.add(normalizedService);
    return true;
  });
  return {
    similarity: finalSimilarity,
    matchedRows,
    totalGroundTruthRows,
    totalExtractedRows: extractedMinimumAdjustment.length,
    missingMinimumAdjustments: uniqueMissingMinimumAdjustments,
    extraMinimumAdjustments: uniqueExtraMinimumAdjustments,
    lowSimilarityMinimumAdjustments: uniqueLowSimilarityMinimumAdjustments
  };
}
function calculateMinimumAdjustmentSimilarity(
  groundTruthRow: any,
  extractedRow: any
): {
  similarity: number
  fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }>
} {
  const fieldDifferences: Array<{
    field: string
    actual: any
    expected: any
    similarity: number
  }> = [];
  // For minimum_adjustment, we only compare zone and adjustmentDiscount
  // Service matching is done before calling this function
  // billing, tags, and pages are considered metadata
  // Compare zone (50% weight)
  const zoneSimilarity = calculateValueSimilarity(
    groundTruthRow.zone,
    extractedRow.zone
  );
  fieldDifferences.push({
    field: "zone",
    actual: groundTruthRow.zone,
    expected: extractedRow.zone,
    similarity: zoneSimilarity
  });
  // Compare adjustmentDiscount (50% weight)
  const adjustmentDiscountSimilarity = calculateValueSimilarity(
    groundTruthRow.adjustmentDiscount,
    extractedRow.adjustmentDiscount
  );
  fieldDifferences.push({
    field: "adjustmentDiscount",
    actual: groundTruthRow.adjustmentDiscount,
    expected: extractedRow.adjustmentDiscount,
    similarity: adjustmentDiscountSimilarity
  });
  // Calculate weighted similarity (equal weight for zone and adjustmentDiscount)
  const overallSimilarity = (zoneSimilarity * 0.5) + (adjustmentDiscountSimilarity * 0.5);
  return {
    similarity: overallSimilarity,
    fieldDifferences
  };
}