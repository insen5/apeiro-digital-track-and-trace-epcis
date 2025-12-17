-- Update demo users with new credentials
-- All demo accounts now use password: 'password'

-- Update existing demo users or insert if they don't exist
INSERT INTO users (id, email, password, role, "roleId", "glnNumber", organization, "isDeleted", "createdAt", "updatedAt")
VALUES
  -- PPB (Regulator)
  ('550e8400-e29b-41d4-a716-446655440010', 'ppp@ppp.com', 'password', 'dha', 1, '9999999999999', 'PPB', false, NOW(), NOW()),
  
  -- Test Manufacturer
  ('550e8400-e29b-41d4-a716-446655440011', 'test-manufacturer@pharma.ke', 'password', 'manufacturer', 2, '6164003000000', 'Test Manufacturer', false, NOW(), NOW()),
  
  -- KEMSA (Supplier/Distributor)
  ('550e8400-e29b-41d4-a716-446655440012', 'kemsa@health.ke', 'password', 'cpa', 3, '0614141000013', 'KEMSA', false, NOW(), NOW()),
  
  -- Facility (Kenyatta National Hospital)
  ('550e8400-e29b-41d4-a716-446655440013', 'facility1@health.ke', 'password', 'user_facility', 4, '0614141000020', 'Kenyatta National Hospital', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "roleId" = EXCLUDED."roleId",
  "glnNumber" = EXCLUDED."glnNumber",
  organization = EXCLUDED.organization,
  "updatedAt" = NOW();

-- Delete old demo users if they exist (optional - only run if you want to clean up)
-- DELETE FROM users WHERE email IN ('ranbaxy@ranbaxy.com', 'kemsa@kemsa.com');

-- Verify demo users
SELECT 
  email, 
  organization, 
  role, 
  "glnNumber",
  CASE WHEN password IS NOT NULL THEN '✓ Set' ELSE '✗ Not Set' END as password_status
FROM users 
WHERE email IN (
  'ppp@ppp.com',
  'test-manufacturer@pharma.ke',
  'kemsa@health.ke',
  'facility1@health.ke'
)
ORDER BY role;
