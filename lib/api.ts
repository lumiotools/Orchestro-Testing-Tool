const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Prompt {
  id: string;
  name: string;
  category: string;
  carrier: string;
  content: string;
  description?: string;
  version: string;
  status: string;
  accuracy: number;
  tests_run: number;
  created_at?: string;
  updated_at?: string;
  last_tested?: string;
  is_default: boolean;
  tags?: string[];
}

export interface CreatePromptRequest {
  name: string;
  category: string;
  carrier: string;
  content: string;
  description?: string;
  tags?: string[];
  base_prompt_name?: string;
}

export interface UpdatePromptRequest {
  name?: string;
  category?: string;
  carrier?: string;
  content?: string;
  description?: string;
  status?: string;
  tags?: string[];
}

export interface TestPromptRequest {
  sample_size?: number;
  model?: string;
  contracts?: string[];
  test_data?: any;
}

export interface TestResult {
  prompt_id: string;
  accuracy: number;
  total_tests: number;
  correct_extractions: number;
  incorrect_extractions: number;
  avg_confidence: number;
  model_used: string;
  test_results: any[];
  tested_at: string;
}

export interface PromptStatistics {
  total_prompts: number;
  active_prompts: number;
  average_accuracy: number;
  category_counts: Record<string, number>;
  accuracy_distribution: Record<string, number>;
  recent_prompts: any[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Prompt CRUD operations
  async getPrompts(params?: {
    carrier?: string;
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ prompts: Prompt[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/prompt/prompts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<{ prompts: Prompt[]; total: number }>(endpoint);
  }

  async getPrompt(id: string): Promise<Prompt> {
    return this.request<Prompt>(`/prompt/prompts/${id}`);
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    return this.request<Prompt>('/prompt/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    return this.request<Prompt>(`/prompt/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePrompt(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/prompt/prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicatePrompt(id: string, newName?: string): Promise<Prompt> {
    return this.request<Prompt>(`/prompt/prompts/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    });
  }

  async activatePrompt(id: string): Promise<{ success: boolean; message: string; prompt: Prompt }> {
    return this.request<{ success: boolean; message: string; prompt: Prompt }>(`/prompt/prompts/${id}/activate`, {
      method: 'POST',
    });
  }

  // Testing operations
  async testPrompt(id: string, testConfig: TestPromptRequest): Promise<TestResult> {
    return this.request<TestResult>(`/prompt/prompts/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(testConfig),
    });
  }

  async comparePrompts(promptIds: string[], testConfig: TestPromptRequest): Promise<any> {
    return this.request<any>('/prompt/prompts/compare', {
      method: 'POST',
      body: JSON.stringify({
        prompt_ids: promptIds,
        test_config: testConfig,
      }),
    });
  }

  // Utility operations
  async getActivePrompt(category: string, carrier: string): Promise<Prompt> {
    return this.request<Prompt>(`/prompt/prompts/active/${category}/${carrier}`);
  }

  async getPromptStatistics(): Promise<PromptStatistics> {
    return this.request<PromptStatistics>('/prompt/prompts/statistics');
  }

  async getCategories(): Promise<{ categories: string[] }> {
    return this.request<{ categories: string[] }>('/prompt/prompts/categories');
  }

  async getCarriers(): Promise<{ carriers: string[] }> {
    return this.request<{ carriers: string[] }>('/prompt/prompts/carriers');
  }

  // Health check
  async healthCheck(): Promise<{ service: string; status: string; version: string }> {
    return this.request<{ service: string; status: string; version: string }>('/prompt/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;