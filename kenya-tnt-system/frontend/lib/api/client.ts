// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get user from localStorage for authentication
    let userId: string | undefined;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId;
        } catch (err) {
          console.warn('[API Client] Failed to parse user from localStorage');
        }
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Id': userId } : {}),
        ...options.headers,
      },
    };

    try {
      console.log(`[API Client] Making request to: ${url}`, options.body ? { body: options.body } : '');
      const response = await fetch(url, config);
      
      // Read response body once (can only be read once)
      const text = await response.text();
      
      if (!response.ok) {
        // Try to get error message from response body
        let errorData: any = {};
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (text && text.trim()) {
          try {
            errorData = JSON.parse(text);
            // Extract error message from various possible formats
            if (errorData.message) {
              errorMessage = errorData.statusCode 
                ? `Error ${errorData.statusCode}: ${errorData.message}` 
                : errorData.message;
            } else if (errorData.error) {
              errorMessage = typeof errorData.error === 'string' 
                ? errorData.error 
                : errorData.error.message || String(errorData.error);
            } else if (errorData.statusCode) {
              errorMessage = `Error ${errorData.statusCode}: ${errorData.message || 'Internal server error'}`;
            } else {
              // Fallback: use the text or status text
              errorMessage = text || response.statusText || errorMessage;
            }
          } catch (parseError) {
            // If parsing fails, use the text as error message or status text
            errorMessage = text || response.statusText || errorMessage;
          }
        } else {
          errorMessage = response.statusText || `HTTP ${response.status} error`;
        }
        
        // Build error details object
        const errorDetails: any = {
          status: response.status,
          statusText: response.statusText || 'Unknown',
          error: errorMessage,
        };
        
        if (Object.keys(errorData).length > 0) {
          errorDetails.errorData = errorData;
        }
        
        if (text && text.trim()) {
          errorDetails.responseBody = text.length > 500 ? text.substring(0, 500) + '...' : text;
        }
        
        console.error(`[API Client] Request failed: ${url}`, errorDetails);
        
        // Ensure we always throw a meaningful error
        const finalErrorMessage = errorMessage || `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        throw new Error(finalErrorMessage);
      }

      // Handle empty responses
      if (!text || text.trim() === '') {
        console.warn(`[API Client] Empty response from: ${url}`);
        // Return empty object for object types
        return ({} as T);
      }
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error(`[API Client] Failed to parse JSON response from: ${url}`, {
          text: text.substring(0, 200), // First 200 chars for debugging
        });
        throw new Error(`Invalid JSON response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      // Enhanced error logging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[API Client] Network error - Backend may not be running or CORS issue: ${url}`, error);
        throw new Error(`Failed to connect to backend at ${url}. Please ensure the backend server is running on ${this.baseUrl}`);
      }
      console.error(`[API Client] Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

