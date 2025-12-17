/**
 * Script to fix GLN check digits in seed data
 * 
 * This script calculates proper GS1 check digits for all GLNs in the seed data
 * based on their company prefixes.
 * 
 * Usage: ts-node scripts/fix-gln-check-digits.ts
 */

/**
 * Calculate GS1 check digit for a 12-digit number (for GLN/GTIN-13)
 */
function calculateGLNCheckDigit(number: string): string {
  if (number.length !== 12) {
    throw new Error('GLN base number must be exactly 12 digits');
  }

  const digits = number.split('').map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    // For GTIN-13/GLN: odd positions (from right, 0-indexed) multiply by 1, even by 3
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const mod = sum % 10;
  return mod === 0 ? '0' : (10 - mod).toString();
}

/**
 * Generate GLN from company prefix and location reference
 */
function generateGLN(companyPrefix: string, locationRef: number): string {
  const prefixLength = companyPrefix.length;
  const locationRefLength = 12 - prefixLength;
  const locationRefStr = locationRef.toString().padStart(locationRefLength, '0');
  const base = companyPrefix + locationRefStr;
  const checkDigit = calculateGLNCheckDigit(base);
  return base + checkDigit;
}

// Test the function with the seed data
const testCases = [
  { prefix: '73510020', location: 0, expected: 'legal_entity_gln' },
  { prefix: '73510020', location: 0, expected: 'hq_gln' },
  { prefix: '61640010', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640010', location: 0, expected: 'hq_gln' },
  { prefix: '61640020', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640020', location: 0, expected: 'hq_gln' },
  { prefix: '61640030', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640030', location: 0, expected: 'hq_gln' },
  { prefix: '61640040', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640040', location: 0, expected: 'hq_gln' },
  { prefix: '61640050', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640050', location: 0, expected: 'hq_gln' },
  { prefix: '61640060', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640060', location: 0, expected: 'hq_gln' },
  { prefix: '61640070', location: 0, expected: 'legal_entity_gln' },
  { prefix: '61640070', location: 0, expected: 'hq_gln' },
  { prefix: '61640080', location: 0, expected: 'gln' },
  { prefix: '61640090', location: 0, expected: 'gln' },
  { prefix: '61640100', location: 0, expected: 'gln' },
];

console.log('GLN Check Digit Calculator\n');
console.log('Company Prefix | Location Ref | Generated GLN');
console.log('---------------|--------------|---------------');

testCases.forEach((test) => {
  const gln = generateGLN(test.prefix, test.location);
  console.log(
    `${test.prefix.padEnd(13)} | ${test.location.toString().padEnd(12)} | ${gln}`,
  );
});

// Premise GLNs (using location references 1, 2, 3, etc.)
console.log('\n\nPremise GLNs:');
const premiseGLNs = [
  { prefix: '73510020', location: 1 }, // SUP-001-WH1
  { prefix: '73510020', location: 2 }, // SUP-001-WH2
  { prefix: '61640010', location: 1 }, // SUP-002-WH1
  { prefix: '61640020', location: 1 }, // SUP-003-WH1
  { prefix: '61640030', location: 1 }, // SUP-004-HQ
  { prefix: '61640030', location: 2 }, // SUP-004-ELD
  { prefix: '61640030', location: 3 }, // SUP-004-MSA
  { prefix: '61640030', location: 4 }, // SUP-004-KSM
  { prefix: '61640030', location: 5 }, // SUP-004-NKR
];

premiseGLNs.forEach((premise, index) => {
  const gln = generateGLN(premise.prefix, premise.location);
  console.log(`Premise ${index + 1}: ${gln}`);
});

