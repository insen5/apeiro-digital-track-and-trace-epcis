import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * PPB API Service
 *
 * Client for calling PPB Terminology API to get product catalog.
 * PPB publishes the product catalog via terminology-api.liviaapp.net
 *
 * Products are synced from PPB Terminology API and stored in local DB.
 */
@Injectable()
export class PPBApiService {
  private readonly logger = new Logger(PPBApiService.name);
  private readonly ppbBaseUrl: string;
  private readonly terminologyApiUrl: string;
  private readonly terminologyApiToken: string;
  private readonly ppbCatalogueUrl: string;
  private readonly ppbCatalogueEmail: string;
  private readonly ppbCataloguePassword: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ppbBaseUrl =
      this.configService.get<string>('PPB_API_URL') ||
      'http://localhost:4000/api/regulator';
    
    this.terminologyApiUrl =
      this.configService.get<string>('PPB_TERMINOLOGY_API_URL') ||
      'https://terminology-api.liviaapp.net/terminology/v1';
    
    this.terminologyApiToken =
      this.configService.get<string>('PPB_TERMINOLOGY_API_TOKEN') ||
      'KUxQ6heclTEtZOiB8rJwhtwmfoW9OUDYawov0t8xzjeTF6oahc3BKpBHHDoGtfwq';
    
    // PPB Catalogue API for premises and practitioners data
    // Default: https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000
    // Note: Base URL is shared for all catalogue endpoints (premises, practitioners, etc.)
    this.ppbCatalogueUrl =
      this.configService.get<string>('PPB_CATALOGUE_API_URL') ||
      'https://catalogue.ppb.go.ke/catalogue-0.0.1/view/premisecatalogue?limit=15000';
    
    this.ppbCatalogueEmail =
      this.configService.get<string>('PPB_CATALOGUE_EMAIL') ||
      'rishi.sen@apeiro.digital';
    
    this.ppbCataloguePassword =
      this.configService.get<string>('PPB_CATALOGUE_PASSWORD') ||
      'patrickkent';
  }

  /**
   * Get product by ID from PPB API
   */
  async getProductById(token: string, productId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ppbBaseUrl}/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch product ${productId} from PPB API`,
        error?.response?.data || error?.message,
      );
      throw new Error(
        `Failed to fetch product from PPB API: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get all products for a user from PPB API
   */
  async getAllProducts(token: string, userId?: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.ppbBaseUrl}/products/all`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch products from PPB API',
        error?.response?.data || error?.message,
      );
      throw new Error(
        `Failed to fetch products from PPB API: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get products from PPB Terminology API with pagination
   * @param page Page number (1-indexed)
   * @param limit Number of products per page
   * @param search Optional search term
   */
  async getTerminologyProducts(
    page: number = 1,
    limit: number = 100,
    search?: string,
  ): Promise<{ products: any[]; total?: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      // Add pagination if API supports it
      // Note: Adjust based on actual API pagination format
      params.append('page', String(page));
      params.append('limit', String(limit));

      const url = `${this.terminologyApiUrl}/product?${params.toString()}`;
      
      this.logger.debug(`Fetching products from PPB Terminology API: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: this.terminologyApiToken,
            Accept: 'application/json',
          },
        }),
      );

      const data = response.data;
      
      // Handle PPB Terminology API response format:
      // { IsSuccess: true, Message: "Success", Data: { products: [...], pages: X, count: Y }, Errors: [] }
      if (data.IsSuccess && data.Data) {
        const products = data.Data.products || [];
        const total = data.Data.count || 0;
        const totalPages = data.Data.pages || 1;
        
        return {
          products,
          total,
          hasMore: page < totalPages,
        };
      }
      
      // Handle array response directly
      if (Array.isArray(data)) {
        return {
          products: data,
          hasMore: data.length === limit,
        };
      }
      
      // Handle other object formats
      if (data.products || data.data || data.items) {
        const products = data.products || data.data || data.items || [];
        return {
          products,
          total: data.total || data.count,
          hasMore: products.length === limit || (data.total && page * limit < data.total),
        };
      }

      // Fallback: return empty
      this.logger.warn('Unexpected API response format', JSON.stringify(data).substring(0, 200));
      return { products: [], hasMore: false };
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch products from PPB Terminology API: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `Failed to fetch products from PPB Terminology API: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Fetch all products from PPB Terminology API (handles pagination automatically)
   * @param search Optional search term
   */
  async getAllTerminologyProducts(search?: string): Promise<any[]> {
    const allProducts: any[] = [];
    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        this.logger.log(`Fetching page ${page} from PPB Terminology API...`);
        
        const result = await this.getTerminologyProducts(page, limit, search);
        allProducts.push(...result.products);
        
        hasMore = result.hasMore;
        page++;

        // Safety limit to prevent infinite loops
        if (page > 1000) {
          this.logger.warn('Reached maximum page limit (1000), stopping fetch');
          break;
        }

        // Small delay to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        this.logger.error(`Error fetching page ${page}:`, error);
        throw error;
      }
    }

    this.logger.log(`Fetched ${allProducts.length} total products from PPB Terminology API`);
    return allProducts;
  }

  /**
   * Sync products from PPB API to local database (optional caching)
   * This can be called periodically to keep local DB in sync
   */
  async syncProductsToLocal(
    token: string,
    productRepo: any,
  ): Promise<void> {
    try {
      const products = await this.getAllProducts(token);
      this.logger.log(`Syncing ${products.length} products from PPB API`);

      for (const product of products) {
        // Check if product exists
        const existing = await productRepo.findOne({
          where: { gtin: product.gtin },
        });

        if (existing) {
          // Update existing
          await productRepo.update(existing.id, {
            productName: product.productName,
            brandName: product.brandName,
            isEnabled: product.is_enabled,
          });
        } else {
          // Create new
          await productRepo.save({
            productName: product.productName,
            brandName: product.brandName,
            gtin: product.gtin,
            userId: product.user_id,
            isEnabled: product.is_enabled,
          });
        }
      }

      this.logger.log('Products synced successfully');
    } catch (error: any) {
      this.logger.error('Failed to sync products', error?.message);
      throw error;
    }
  }

  /**
   * Login to PPB Catalogue API to get access token
   * Returns: { access_token: string, ... }
   */
  private async loginToPPBCatalogue(email: string, password: string): Promise<string> {
    try {
      // Extract base URL from full endpoint URL
      const baseUrl = this.ppbCatalogueUrl.split('/catalogue-')[0];
      const loginUrl = `${baseUrl}/catalogue-0.0.1/login`;
      
      this.logger.log(`Logging in to PPB Catalogue API: ${loginUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(
          loginUrl,
          {
            useremail: email,
            userpassword: password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data;
      if (!data.access_token) {
        throw new Error('No access token in login response');
      }

      this.logger.log('Successfully authenticated with PPB Catalogue API');
      return data.access_token;
    } catch (error: any) {
      this.logger.error(
        `Failed to login to PPB Catalogue API: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `PPB Catalogue login failed: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get all premises from PPB Catalogue API
   * Authentication: Login first to get token, then GET with Bearer token
   */
  async getAllPremisesFromCatalogue(): Promise<any[]> {
    try {
      // Step 1: Login to get access token
      const token = await this.loginToPPBCatalogue(
        this.ppbCatalogueEmail,
        this.ppbCataloguePassword,
      );

      // Step 2: Fetch premises with token
      this.logger.log(`Fetching premises from PPB Catalogue API: ${this.ppbCatalogueUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(
          this.ppbCatalogueUrl,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          },
        ),
      );

      const data = response.data;

      // Handle HAL format response: { _embedded: { vwApiCurrentPremiseList: [...] } }
      if (data._embedded && data._embedded.vwApiCurrentPremiseList) {
        const premises = data._embedded.vwApiCurrentPremiseList;
        this.logger.log(`Fetched ${premises.length} premises from PPB Catalogue API`);
        return premises;
      }

      // Handle direct array response
      if (Array.isArray(data)) {
        this.logger.log(`Fetched ${data.length} premises from PPB Catalogue API`);
        return data;
      }

      // Fallback: return empty
      this.logger.warn('Unexpected API response format for premises', JSON.stringify(data).substring(0, 200));
      return [];
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch premises from PPB Catalogue API: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `Failed to fetch premises from PPB Catalogue API: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get premises with custom credentials (for testing or different users)
   */
  async getPremisesWithCredentials(
    email: string,
    password: string,
  ): Promise<any[]> {
    try {
      // Step 1: Login to get access token
      const token = await this.loginToPPBCatalogue(email, password);

      // Step 2: Fetch premises with token
      this.logger.log(`Fetching premises from PPB Catalogue API with custom credentials`);

      const response = await firstValueFrom(
        this.httpService.get(
          this.ppbCatalogueUrl,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          },
        ),
      );

      const data = response.data;

      // Handle HAL format response
      if (data._embedded && data._embedded.vwApiCurrentPremiseList) {
        const premises = data._embedded.vwApiCurrentPremiseList;
        this.logger.log(`Fetched ${premises.length} premises`);
        return premises;
      }

      // Handle direct array response
      if (Array.isArray(data)) {
        return data;
      }

      return [];
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch premises with custom credentials: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `Failed to fetch premises: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get all practitioners from PPB Practitioner Catalogue API
   * Authentication: Login first to get Bearer token (same as premises)
   * Endpoint: https://catalogue.ppb.go.ke/catalogue-0.0.1/view/practionercatalogue
   */
  async getAllPractitionersFromCatalogue(): Promise<any[]> {
    try {
      // Step 1: Login to get access token (same as premises)
      const token = await this.loginToPPBCatalogue(
        this.ppbCatalogueEmail,
        this.ppbCataloguePassword,
      );

      // Step 2: Fetch all practitioners with large limit (PPB API supports this)
      const baseUrl = this.ppbCatalogueUrl.split('/catalogue-')[0];
      const practitionerUrl = `${baseUrl}/catalogue-0.0.1/view/practionercatalogue?limit=50000`;
      
      this.logger.log(`Fetching practitioners from PPB Catalogue API: ${practitionerUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(
          practitionerUrl,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            timeout: 120000, // 2 minute timeout for large datasets
          },
        ),
      );

      const data = response.data;

      // Handle HAL format response: { _embedded: { vwPpbapipracticelicenceList: [...] } }
      if (data._embedded && data._embedded.vwPpbapipracticelicenceList) {
        const practitioners = data._embedded.vwPpbapipracticelicenceList;
        this.logger.log(`Fetched ${practitioners.length} practitioners from PPB Catalogue API`);
        return practitioners;
      }

      // Handle direct array response
      if (Array.isArray(data)) {
        this.logger.log(`Fetched ${data.length} practitioners from PPB Catalogue API`);
        return data;
      }

      // Fallback: return empty
      this.logger.warn('Unexpected API response format for practitioners', JSON.stringify(data).substring(0, 500));
      return [];

    } catch (error: any) {
      this.logger.error(
        `Failed to fetch practitioners from PPB Catalogue API: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `Failed to fetch practitioners from PPB Catalogue API: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  /**
   * Get practitioners with custom credentials (for testing or different users)
   */
  async getPractitionersWithCredentials(
    email: string,
    password: string,
  ): Promise<any[]> {
    try {
      // Step 1: Login to get access token
      const token = await this.loginToPPBCatalogue(email, password);

      // Step 2: Fetch all practitioners with large limit
      const baseUrl = this.ppbCatalogueUrl.split('/catalogue-')[0];
      const practitionerUrl = `${baseUrl}/catalogue-0.0.1/view/practionercatalogue?limit=50000`;
      
      this.logger.log(`Fetching practitioners from PPB Catalogue API with custom credentials`);

      const response = await firstValueFrom(
        this.httpService.get(
          practitionerUrl,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            timeout: 120000, // 2 minute timeout
          },
        ),
      );

      const data = response.data;

      // Handle HAL format response
      if (data._embedded && data._embedded.vwPpbapipracticelicenceList) {
        const practitioners = data._embedded.vwPpbapipracticelicenceList;
        this.logger.log(`Fetched ${practitioners.length} practitioners`);
        return practitioners;
      }

      // Handle direct array response
      if (Array.isArray(data)) {
        this.logger.log(`Fetched ${data.length} practitioners (direct array)`);
        return data;
      }

      this.logger.warn('Unexpected API response format', JSON.stringify(data).substring(0, 500));
      return [];

    } catch (error: any) {
      this.logger.error(
        `Failed to fetch practitioners with custom credentials: ${error?.response?.data || error?.message}`,
      );
      throw new Error(
        `Failed to fetch practitioners: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }
}

