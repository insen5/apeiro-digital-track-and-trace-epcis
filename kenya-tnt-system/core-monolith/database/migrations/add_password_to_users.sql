-- Add password column to users table (if it doesn't exist)
-- This is for simple authentication with demo users

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update demo users with passwords (plain text for demo, use bcrypt in production)
UPDATE users SET password = 'ppp' WHERE email = 'ppp@ppp.com';
UPDATE users SET password = 'ranbaxy' WHERE email = 'ranbaxy@ranbaxy.com';
UPDATE users SET password = 'kemsa' WHERE email = 'kemsa@kemsa.com';

-- Note: For production, passwords should be hashed using bcrypt
-- Example: UPDATE users SET password = '$2b$10$...' WHERE email = 'user@example.com';
