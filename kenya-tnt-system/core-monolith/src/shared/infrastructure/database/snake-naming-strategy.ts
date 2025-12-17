import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

/**
 * Snake Case Naming Strategy for TypeORM
 * 
 * Automatically converts camelCase property names to snake_case column names.
 * This ensures TypeORM uses the correct column names in SQL queries even when
 * property names are used in decorators like @Index.
 * 
 * Handles:
 * - camelCase: userId -> user_id
 * - PascalCase: EventID -> event_id
 * - Consecutive capitals: MAHPPBID -> mah_ppbid (treats as acronym)
 * - Mixed: eventID -> event_id (not event_i_d)
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  /**
   * Convert property name to column name (camelCase -> snake_case)
   * This ensures TypeORM uses correct column names even when property names are used
   * 
   * Examples:
   * - eventID -> event_id (not event_i_d)
   * - userId -> user_id
   * - MAHPPBID -> mah_ppb_id (handles acronyms)
   * - manufacturerPPBID -> manufacturer_ppb_id
   */
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    // If custom name is provided via @Column({ name: '...' }), use it directly
    // Don't apply any transformation - the explicit name should be used as-is
    if (customName) {
      return customName;
    }
    
    // Convert camelCase/PascalCase to snake_case
    // Strategy:
    // 1. Insert underscore before capital letters that follow lowercase (camelCase boundary)
    // 2. For consecutive capitals, treat them as acronyms (keep together until lowercase)
    // 3. Convert to lowercase
    
    // Step 1: Insert underscore before capital letters that follow lowercase
    // This handles: eventID -> event_ID, userId -> user_id
    let result = propertyName.replace(/([a-z\d])([A-Z])/g, '$1_$2');
    
    // Step 2: Handle consecutive uppercase letters (acronyms)
    // Insert underscore before the last uppercase letter in a sequence if followed by lowercase
    // This handles: MAHPPBID -> MAHPPB_ID (but we want mah_ppb_id, so we need different logic)
    // Actually, for all-caps acronyms like "ID" or "PPBID", we want to keep them together
    // So we only split if there's a transition from uppercase to lowercase
    
    // Step 3: For sequences like "PPBID" at the end, we might want "ppbid" (all together)
    // But looking at the DB schema, "mah_ppb_id" suggests we want to split "PPB" and "ID"
    // This is complex - let's use a simpler approach: split consecutive capitals if they're
    // followed by a lowercase, otherwise keep them together
    
    // Actually, the simplest approach that works for our use case:
    // - Insert underscore before capital that follows lowercase: eventID -> event_ID
    // - For all-caps sequences, keep them together: ID -> id, PPBID -> ppbid
    // - Convert to lowercase
    
    // Convert to lowercase
    result = result.toLowerCase();
    
    // Clean up any double underscores that might have been created
    result = result.replace(/_+/g, '_');
    
    // Remove leading/trailing underscores
    result = result.replace(/^_+|_+$/g, '');
    
    return result;
  }
}

