import { parseServiceName } from "./service-parser";

interface Service {
  service_name: string;
  base_service_name: string | null;
  package_type: string | null;
  shipment_type: string | null;
  payment_type: string | null;
  table_name?: string;
  billing?: string;
  zone?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Clean service text by removing trademark symbols, special characters, etc.
 */
function cleanServiceText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }
  
  return text
    .replace(/®/g, "")   // Remove registered trademark ®
    .replace(/™/g, "")   // Remove trademark ™
    .replace(/TM/g, "")  // Remove TM text
    .replace(/\\n/g, " ") // Replace escaped newlines
    .replace(/\n/g, " ")  // Replace newlines with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\s*-\s*/g, "-") // Normalize spaces around hyphens
    .trim();
}

/**
 * Calculate a simple similarity score between two services using rule-based matching.
 */
export function calculateRuleBasedSimilarity(service1: Service, service2: Service): number {
  // Safety check for null values
  if (!service1 || !service2) {
    return 0.0;
  }
  
  // Extract base service names
  const baseName1 = service1.base_service_name || '';
  const baseName2 = service2.base_service_name || '';
  
  // Extract service names
  const serviceName1 = service1.service_name || '';
  const serviceName2 = service2.service_name || '';
  
  // Clean the text
  const cleanBaseName1 = cleanServiceText(baseName1).toLowerCase();
  const cleanBaseName2 = cleanServiceText(baseName2).toLowerCase();
  const cleanServiceName1 = cleanServiceText(serviceName1).toLowerCase();
  const cleanServiceName2 = cleanServiceText(serviceName2).toLowerCase();
  
  // Score starts at 0
  let score = 0.0;
  
  // Check if table names match (mandatory)
  if (service1.table_name !== service2.table_name) {
    return 0.0;
  }
  
  // Check if base service names match exactly
  if (cleanBaseName1 && cleanBaseName2 && cleanBaseName1 === cleanBaseName2) {
    score += 0.7;
  } 
  // Check if base service names overlap significantly
  else if (cleanBaseName1 && cleanBaseName2 && (cleanBaseName1.includes(cleanBaseName2) || cleanBaseName2.includes(cleanBaseName1))) {
    score += 0.5;
  } 
  // Check if service names match or overlap
  else if (cleanServiceName1 && cleanServiceName2) {
    if (cleanServiceName1 === cleanServiceName2) {
      score += 0.6;
    } else if (cleanServiceName1.includes(cleanServiceName2) || cleanServiceName2.includes(cleanServiceName1)) {
      score += 0.4;
    } 
    // Check for key words like "Ground", "Express", etc.
    else if (["ground", "express", "next day", "2nd day", "priority"].some(
      keyword => cleanServiceName1.includes(keyword) && cleanServiceName2.includes(keyword)
    )) {
      score += 0.3;
    }
  }
  
  // Check additional attributes for bonus points
  const packageType1 = service1.package_type || '';
  const packageType2 = service2.package_type || '';
  if (packageType1 && packageType2 && packageType1 === packageType2) {
    score += 0.1;
  }
  
  const shipmentType1 = service1.shipment_type || '';
  const shipmentType2 = service2.shipment_type || '';
  if (shipmentType1 && shipmentType2 && shipmentType1 === shipmentType2) {
    score += 0.1;
  }
  
  // Special handling for prepaid with trailing codes
  const paymentType1 = service1.payment_type || '';
  const paymentType2 = service2.payment_type || '';
  
  if (paymentType1 && paymentType2) {
    const payment1 = paymentType1.toLowerCase();
    const payment2 = paymentType2.toLowerCase();
    if (payment1 === payment2) {
      score += 0.1;
    } else if (payment1.includes("prepaid") && payment2.includes("prepaid")) {
      score += 0.1;
    }
  }
  
  // Ensure score is between 0 and 1
  return Math.min(1.0, Math.max(0.0, score));
} 