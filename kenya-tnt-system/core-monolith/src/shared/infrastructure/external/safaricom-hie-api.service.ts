import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Safaricom HIE API Service
 *
 * Client for calling Safaricom Health Information Exchange (HIE) Facility Registry API
 * to sync facility master data for the Kenya Track & Trace System.
 *
 * Authentication: OAuth2 Client Credentials flow
 * Sync Method: Incremental sync using lastUpdated parameter
 */
@Injectable()
export class SafaricomHieApiService {
  private readonly logger = new Logger(SafaricomHieApiService.name);
  
  // OAuth2 Configuration
  private readonly authUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  
  // Facility API Configuration
  private readonly facilityApiUrl: string;
  private readonly prodFacilityApiUrl: string;
  private readonly prodFacilityToken: string;
  
  // Token caching
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // OAuth2 endpoints for UAT
    this.authUrl =
      this.configService.get<string>('SAFARICOM_HIE_AUTH_URL') ||
      'https://apistg.safaricom.co.ke/oauth2/v1/generate';
    
    this.clientId =
      this.configService.get<string>('SAFARICOM_HIE_CLIENT_ID') ||
      '89eJgGbQ5nqZdKCcr6q3kG0tOVjLw7GRe29yYPKsvqjY1uGG';
    
    this.clientSecret =
      this.configService.get<string>('SAFARICOM_HIE_CLIENT_SECRET') ||
      'NWZETuQnDhxmwCo6TzIsEWUopuEZaFU4rhcvtIt89N4ImOZBA8aBnRH5SFwYjrxA';
    
    // UAT Facility Registry API
    this.facilityApiUrl =
      this.configService.get<string>('SAFARICOM_HIE_FACILITY_API_URL') ||
      'https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync';
    
    // Production Facility Registry API - DIRECT SAFARICOM API
    this.prodFacilityApiUrl =
      this.configService.get<string>('SAFARICOM_HIE_PROD_FACILITY_API_URL') ||
      'https://api.safaricom.co.ke/hie/api/v1/fr/facility/sync';
    
    // Production OAuth2 credentials - DIRECT SAFARICOM
    this.prodFacilityToken =
      this.configService.get<string>('SAFARICOM_HIE_PROD_FACILITY_TOKEN') ||
      'ts8uomWv7g3fMbzJQvODDozzTN6zjpFDl7GBeBPCAThkvUEE:lWxUuqNbjG5sDKuQWRd8QPLVrOGXxaDKJjjmAaHDNeUG8cCHesnPAUAaYxrU2l1G';
  }

  /**
   * Authenticate with Safaricom HIE OAuth2 API
   * Uses Client Credentials grant type with Basic Auth
   * 
   * @returns Access token valid for 3600 seconds (1 hour)
   */
  async authenticate(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry) {
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (this.tokenExpiry.getTime() - now.getTime() > bufferTime) {
        this.logger.debug('Using cached access token');
        return this.accessToken;
      }
    }

    try {
      // Create Basic Auth header
      const basicAuth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64');

      this.logger.log('Requesting new access token from Safaricom HIE');

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authUrl}?grant_type=client_credentials`,
          {},
          {
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      this.logger.log(
        `Successfully authenticated. Token expires at ${this.tokenExpiry.toISOString()}`,
      );

      return this.accessToken;
    } catch (error) {
      this.handleError('Failed to authenticate with Safaricom HIE', error);
    }
  }

  /**
   * Get facilities from Safaricom HIE Facility Registry API
   * Supports incremental sync using lastUpdated parameter with pagination
   * 
   * API Response Structure (expected):
   * {
   *   "facilities": [ { facilityCode, name, ... } ],
   *   "pageable": { pageNumber, pageSize },
   *   "totalElements": number,
   *   "totalPages": number
   * }
   * 
   * @param lastUpdated - ISO timestamp or formatted string (YYYY-MM-DD HH:mm:ss)
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 1000)
   * @returns Array of facility objects
   */
  async getFacilities(params: {
    lastUpdated: string | Date;
    page?: number;
    size?: number;
  }): Promise<any[]> {
    try {
      // Get valid access token
      const token = await this.authenticate();

      // Format timestamp for API
      const lastUpdatedStr = this.formatTimestamp(params.lastUpdated);
      const page = params.page || 0;
      const size = params.size || 1000; // Fetch 1000 facilities per page (increased from 50)

      this.logger.log(
        `Fetching UAT facilities updated since ${lastUpdatedStr} (page ${page}, size ${size})`,
      );

      let allFacilities: any[] = [];
      let currentPage = page;
      let hasMore = true;
      let consecutiveEmptyPages = 0;

      // Fetch all pages until no more data
      while (hasMore) {
        const response = await firstValueFrom(
          this.httpService.get(this.facilityApiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            params: {
              lastUpdated: lastUpdatedStr,
              page: currentPage,
              size: size,
            },
            timeout: 60000, // 60 second timeout
          }),
        );

        // Handle different response formats
        let facilities = [];
        if (response.data.collectionResult && Array.isArray(response.data.collectionResult)) {
          // Safaricom HIE paginated response format
          facilities = response.data.collectionResult;
        } else if (response.data.facilities && Array.isArray(response.data.facilities)) {
          facilities = response.data.facilities;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          facilities = response.data.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          facilities = response.data.content;
        } else if (Array.isArray(response.data)) {
          facilities = response.data;
        } else {
          facilities = [response.data];
        }

        allFacilities = allFacilities.concat(facilities);

        // Track empty pages to detect end of data
        if (facilities.length === 0) {
          consecutiveEmptyPages++;
        } else {
          consecutiveEmptyPages = 0;
        }

        // Stop if we get 3 consecutive empty pages (indicates end of data)
        if (consecutiveEmptyPages >= 3) {
          this.logger.log('Detected end of data (3 consecutive empty pages), stopping pagination');
          hasMore = false;
          break;
        }

        // Check if there are more pages
        if (response.data.totalPages !== undefined && response.data.currentPage !== undefined) {
          // Safaricom HIE pagination structure: { totalPages, currentPage, nextPage, ... }
          const totalPages = response.data.totalPages;
          const apiCurrentPage = response.data.currentPage;
          currentPage++;
          hasMore = currentPage < totalPages && response.data.nextPage !== null;
          
          // Log progress every 10 pages for better visibility
          if (currentPage % 10 === 0 || !hasMore) {
            this.logger.log(
              `Fetched UAT facilities page ${apiCurrentPage + 1}/${totalPages} (${facilities.length} facilities, total: ${allFacilities.length})`,
            );
          }
        } else if (response.data.totalPages && response.data.pageable) {
          // Spring Data pagination structure
          const totalPages = response.data.totalPages;
          currentPage++;
          hasMore = currentPage < totalPages;
          
          if (currentPage % 10 === 0 || !hasMore) {
            this.logger.log(
              `Fetched UAT facilities page ${currentPage}/${totalPages} (${facilities.length} facilities, total: ${allFacilities.length})`,
            );
          }
        } else {
          // No pagination info, assume single page or check if we got fewer results than requested
          hasMore = facilities.length >= size;
          if (hasMore) {
            currentPage++;
            this.logger.log(
              `Fetched ${facilities.length} facilities, checking page ${currentPage + 1} for more...`,
            );
          }
        }
      }

      this.logger.log(
        `Successfully fetched ${allFacilities.length} UAT facilities across ${currentPage} page(s)`,
      );

      return allFacilities;
    } catch (error) {
      this.handleError('Failed to fetch facilities from Safaricom HIE', error);
    }
  }

  /**
   * Get a single facility by facility code
   * 
   * @param facilityCode - Unique facility identifier
   * @returns Facility object
   */
  async getFacilityByCode(facilityCode: string): Promise<any> {
    try {
      const token = await this.authenticate();

      this.logger.log(`Fetching facility: ${facilityCode}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.facilityApiUrl}/${facilityCode}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleError(
        `Failed to fetch facility ${facilityCode}`,
        error,
      );
    }
  }

  /**
   * Get facilities from Safaricom HIE Production Facility Registry API
   * Uses OAuth2 Client Credentials authentication (direct Safaricom API)
   * 
   * @param params - Pagination and filter parameters
   * @returns Array of facility objects
   */
  async getProdFacilities(params?: {
    page?: number;
    size?: number;
    lastUpdated?: string | Date;
  }): Promise<any[]> {
    try {
      const page = params?.page || 0;
      const size = params?.size || 1000;
      
      // Get production OAuth token (credentials stored as clientId:clientSecret format)
      const [prodClientId, prodClientSecret] = this.prodFacilityToken.split(':');
      const basicAuth = Buffer.from(`${prodClientId}:${prodClientSecret}`).toString('base64');
      
      this.logger.log('Requesting production access token from Safaricom HIE');
      
      const authResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.safaricom.co.ke/oauth2/v1/generate?grant_type=client_credentials',
          {},
          {
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      
      const prodToken = authResponse.data.access_token;
      
      // Format lastUpdated timestamp
      let lastUpdatedStr = '2025-06-30 19:00:00'; // Default lookback
      if (params?.lastUpdated) {
        lastUpdatedStr = this.formatTimestamp(params.lastUpdated);
      }

      this.logger.log(
        `Fetching production facilities updated since ${lastUpdatedStr} (page ${page}, size ${size})`,
      );

      let allFacilities: any[] = [];
      let currentPage = page;
      let hasMore = true;
      let consecutiveEmptyPages = 0;

      // Fetch all pages until no more data
      while (hasMore) {
        const response = await firstValueFrom(
          this.httpService.get(this.prodFacilityApiUrl, {
            headers: {
              'Authorization': `Bearer ${prodToken}`,
              'Content-Type': 'application/json',
            },
            params: {
              lastUpdated: lastUpdatedStr,
              page: currentPage,
              size: size,
            },
            timeout: 60000,
          }),
        );

        // Production API returns direct array (not paginated wrapper)
        let facilities = Array.isArray(response.data) ? response.data : [];
        
        allFacilities = allFacilities.concat(facilities);

        // Track empty pages to detect end of data
        if (facilities.length === 0) {
          consecutiveEmptyPages++;
        } else {
          consecutiveEmptyPages = 0;
        }

        // Stop if we get 3 consecutive empty pages
        if (consecutiveEmptyPages >= 3) {
          this.logger.log('Detected end of data (3 consecutive empty pages), stopping pagination');
          hasMore = false;
          break;
        }

        // Production API returns fixed 50 facilities per page (ignores size parameter)
        // Check if we got fewer than 50 (indicates last page)
        if (facilities.length < 50) {
          this.logger.log(
            `Fetched production facilities page ${currentPage + 1} (${facilities.length} facilities, total: ${allFacilities.length}) - LAST PAGE`,
          );
          hasMore = false;
        } else {
          currentPage++;
          
          // Log progress every 10 pages
          if (currentPage % 10 === 0) {
            this.logger.log(
              `Fetched production facilities page ${currentPage} (${facilities.length} facilities, total: ${allFacilities.length})`,
            );
          }
        }
      }

      this.logger.log(
        `Successfully fetched ${allFacilities.length} production facilities across ${currentPage + 1} page(s)`,
      );

      return allFacilities;
    } catch (error) {
      this.handleError(
        'Failed to fetch production facilities from Safaricom HIE',
        error,
      );
    }
  }

  /**
   * Test API connection and authentication
   * Useful for health checks and configuration validation
   * 
   * @returns Boolean indicating connection success
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      this.logger.log('✅ Safaricom HIE API connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Safaricom HIE API connection test failed');
      return false;
    }
  }

  /**
   * Test production API connection
   * 
   * @returns Boolean indicating connection success
   */
  async testProdConnection(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.prodFacilityApiUrl, {
          headers: {
            'Authorization': `Bearer ${this.prodFacilityToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            page: 0,
            size: 1,
          },
          timeout: 10000,
        }),
      );
      
      this.logger.log('✅ Safaricom HIE Production API connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Safaricom HIE Production API connection test failed');
      return false;
    }
  }

  /**
   * Format timestamp for Safaricom HIE API
   * Expected format: "YYYY-MM-DD HH:mm:ss"
   * 
   * @param date - Date object or ISO string
   * @returns Formatted timestamp string
   */
  private formatTimestamp(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format: "2025-12-14 10:30:00"
    return dateObj
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleError(message: string, error: any): never {
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      this.logger.error(
        `${message}: HTTP ${status}`,
        JSON.stringify(data, null, 2),
      );

      if (status === 401) {
        // Clear cached token on authentication failure
        this.accessToken = null;
        this.tokenExpiry = null;
        throw new Error(
          'Safaricom HIE authentication failed. Check CLIENT_ID and CLIENT_SECRET.',
        );
      } else if (status === 429) {
        throw new Error('Safaricom HIE rate limit exceeded. Please retry later.');
      } else if (status >= 500) {
        throw new Error('Safaricom HIE server error. Please retry later.');
      }

      throw new Error(
        `${message}: ${data?.message || data?.error || 'Unknown error'}`,
      );
    } else if (error.request) {
      // Network error (no response received)
      this.logger.error(`${message}: Network error`, error.message);
      throw new Error(
        `Network error connecting to Safaricom HIE: ${error.message}`,
      );
    } else {
      // Other errors
      this.logger.error(`${message}`, error.message);
      throw new Error(`${message}: ${error.message}`);
    }
  }

  /**
   * Clear cached authentication token
   * Useful for forcing re-authentication
   */
  clearAuthCache(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.logger.log('Authentication cache cleared');
  }

  /**
   * Get current token expiry time
   * Useful for monitoring and debugging
   */
  getTokenExpiry(): Date | null {
    return this.tokenExpiry;
  }
}
