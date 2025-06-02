/**
 * Service name parser utility
 * 
 * This implements the same functionality as the service_name_parser.py script
 * but in TypeScript for integration with the accuracy calculator.
 */

/**
 * Clean a text component by removing trademark symbols, special characters, and encoding artifacts.
 * Returns null if the component is empty after cleaning.
 */
export function cleanComponent(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  
  // Remove trademark symbols and other special characters
  let cleaned = text
    .replace(/®/g, '')
    .replace(/™/g, '')
    .replace(/TM/g, '')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ');
  
  // Remove the Â character and other encoding artifacts
  cleaned = cleaned
    .replace(/Â/g, '')
    .replace(/\u00A0/g, ' ');
  
  // Remove various special characters that might appear
  cleaned = cleaned.replace(/[^\x00-\x7F]+/g, '');  // Remove non-ASCII characters
  
  // Remove escape sequences
  cleaned = cleaned.replace(/\\[nrt]/g, ' ');
  
  // Clean extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned ? cleaned : null;
}

/**
 * Parse a service name into its components:
 * - base service name
 * - package type
 * - shipment type
 * - payment type
 */
export function parseServiceName(serviceName: string): {
  service_name: string;
  base_service_name: string | null;
  package_type: string | null;
  shipment_type: string | null;
  payment_type: string | null;
} {
  // First clean the entire service name
  const cleanName = cleanComponent(serviceName);
  if (!cleanName) {
    return {
      service_name: serviceName,
      base_service_name: null,
      package_type: null,
      shipment_type: null,
      payment_type: null
    };
  }
  
  // Check if "import" or "export" is mentioned anywhere in the name
  let originalShipmentType: string | null = null;
  const lowerName = cleanName.toLowerCase();
  
  if (lowerName.includes("import")) {
    originalShipmentType = "Import";
  } else if (lowerName.includes("export")) {
    originalShipmentType = "Export";
  }
  
  // Check for "Freight Midday" as payment type
  let originalPaymentType: string | null = null;
  if (lowerName.includes("freight midday")) {
    originalPaymentType = "Freight Midday";
  } else if (lowerName.includes("freight")) {
    originalPaymentType = "Freight";
  }
  
  // Split the service name by dashes
  const parts = cleanName.split('-')
    .map(part => cleanComponent(part))
    .filter(p => p !== null) as string[];  // Remove empty parts
  
  // Default values
  let baseName = parts.length > 0 ? parts[0] : null;
  let shipmentType: string | null = null;
  let packageType: string | null = null;
  let paymentType: string | null = null;
  
  // Check if we have enough parts to extract all components
  if (parts.length >= 4) {
    baseName = parts[0];
    shipmentType = parts[1];
    packageType = parts[2];
    paymentType = parts[3];
  } else if (parts.length === 3) {
    baseName = parts[0];
    shipmentType = parts[1];
    packageType = parts[2];
  } else if (parts.length === 2) {
    baseName = parts[0];
    shipmentType = parts[1];
  }
  
  // If we found Import/Export in the full name but not in the designated part, prioritize that
  if (originalShipmentType && (!shipmentType || !shipmentType.toLowerCase().includes(originalShipmentType.toLowerCase()))) {
    shipmentType = originalShipmentType;
    
    // Remove the found shipment type from base_name if it's there
    if (baseName) {
      const baseNameLower = baseName.toLowerCase();
      if (baseNameLower.includes("import") && originalShipmentType.toLowerCase() === "import") {
        baseName = baseName.replace(/\bimport\b/i, '').trim();
      } else if (baseNameLower.includes("export") && originalShipmentType.toLowerCase() === "export") {
        baseName = baseName.replace(/\bexport\b/i, '').trim();
      }
      
      // Clean up any resulting double spaces
      baseName = baseName.replace(/\s+/g, ' ').trim();
    }
  }
  
  // If we found Freight Midday in the full name, use it as payment type
  if (originalPaymentType && (!paymentType || !paymentType.toLowerCase().includes(originalPaymentType.toLowerCase()))) {
    paymentType = originalPaymentType;
    
    // Remove the found payment type from base_name if it's there
    if (baseName) {
      const baseNameLower = baseName.toLowerCase();
      if (baseNameLower.includes("freight midday") && originalPaymentType.toLowerCase().includes("freight midday")) {
        baseName = baseName.replace(/\bfreight\s+midday\b/i, '').trim();
      } else if (baseNameLower.includes("freight") && originalPaymentType.toLowerCase().includes("freight")) {
        baseName = baseName.replace(/\bfreight\b/i, '').trim();
      }
      
      // Clean up any resulting double spaces
      baseName = baseName.replace(/\s+/g, ' ').trim();
    }
  }
  
  return {
    service_name: serviceName,
    base_service_name: baseName,
    package_type: packageType,
    shipment_type: shipmentType,
    payment_type: paymentType
  };
} 