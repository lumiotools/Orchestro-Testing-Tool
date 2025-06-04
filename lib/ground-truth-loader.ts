// Ground truth data loader utility

export interface GroundTruthContract {
  contract_id: string;
  basic_details: {
    carrier: string;
    shipper: string;
    effective_date: string;
    end_date: string | null;
    payment_terms: string;
  };
  tables: {
    [key: string]: {
      tableData: {
        rows: any[];
      };
    };
  };
}

export interface ContractOption {
  value: string;
  label: string;
  fileName: string;
}

// Available contracts configuration
export const AVAILABLE_CONTRACTS: ContractOption[] = [
  { 
    value: "contract_001", 
    label: "Contract 001 - UPS Momentum", 
    fileName: "contract_001.json" 
  },
  { 
    value: "contract_002", 
    label: "Contract 002 - FedEx Global Logistics", 
    fileName: "contract_002.json" 
  },
  { 
    value: "contract_003", 
    label: "Contract 003 - UPS Tech Solutions", 
    fileName: "contract_003.json" 
  }
];

/**
 * Load ground truth contract data from JSON file
 * @param contractId - The contract ID to load
 * @returns Promise<GroundTruthContract | null>
 */
export async function loadGroundTruthContract(contractId: string): Promise<GroundTruthContract | null> {
  try {
    const contractConfig = AVAILABLE_CONTRACTS.find(c => c.value === contractId);
    if (!contractConfig) {
      console.error(`Contract configuration not found for: ${contractId}`);
      return null;
    }

    // In a real application, this would fetch from an API or file system
    // For now, we'll use dynamic imports to load the JSON files
    const response = await fetch(`/data/ground-truth/${contractConfig.fileName}`);
    
    if (!response.ok) {
      console.error(`Failed to load ground truth file: ${contractConfig.fileName}`);
      return null;
    }

    const contractData: GroundTruthContract = await response.json();
    return contractData;
  } catch (error) {
    console.error(`Error loading ground truth contract ${contractId}:`, error);
    return null;
  }
}

/**
 * Get available contract options for dropdown
 * @returns ContractOption[]
 */
export function getAvailableContracts(): ContractOption[] {
  return AVAILABLE_CONTRACTS;
}

/**
 * Validate ground truth contract data structure
 * @param data - The contract data to validate
 * @returns boolean
 */
export function validateGroundTruthContract(data: any): data is GroundTruthContract {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.contract_id === 'string' &&
    data.basic_details &&
    typeof data.basic_details === 'object' &&
    data.tables &&
    typeof data.tables === 'object'
  );
} 