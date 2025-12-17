-- Add importer and destination party fields to consignments table
ALTER TABLE consignments 
ADD COLUMN IF NOT EXISTS "importerPartyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "importerPartyGLN" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "importerPartyCountry" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "destinationPartyName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "destinationPartyGLN" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "destinationLocationLabel" VARCHAR(500);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_consignments_importer_gln ON consignments("importerPartyGLN");
CREATE INDEX IF NOT EXISTS idx_consignments_destination_gln ON consignments("destinationPartyGLN");

-- Add comments for documentation
COMMENT ON COLUMN consignments."importerPartyName" IS 'Name of the importing party/organization';
COMMENT ON COLUMN consignments."importerPartyGLN" IS 'GLN of the importing party';
COMMENT ON COLUMN consignments."importerPartyCountry" IS 'Country code of the importing party';
COMMENT ON COLUMN consignments."destinationPartyName" IS 'Name of the final destination party';
COMMENT ON COLUMN consignments."destinationPartyGLN" IS 'GLN of the final destination party';
COMMENT ON COLUMN consignments."destinationLocationLabel" IS 'Human-readable label for destination location (e.g., warehouse name)';
