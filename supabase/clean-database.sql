-- Clean Database Script
-- WARNING: This will delete ALL data and users from your database
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/josjxncyzdaxchgvzelh/sql

-- Delete all data from tables (in correct order due to foreign keys)
DELETE FROM transaction_allocations;
DELETE FROM transactions;
DELETE FROM profit_distributions;
DELETE FROM bank_accounts;
DELETE FROM accounts;
DELETE FROM profiles;

-- Note: To delete users from auth.users, you need to do it through the Supabase Dashboard
-- Go to Authentication > Users and delete them manually
-- Or use the Supabase Management API

-- Reset sequences (optional - if you want IDs to start from 1 again)
-- ALTER SEQUENCE IF EXISTS accounts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'accounts' as table_name, COUNT(*) as row_count FROM accounts
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'transaction_allocations', COUNT(*) FROM transaction_allocations
UNION ALL
SELECT 'profit_distributions', COUNT(*) FROM profit_distributions
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
