-- =============================================================================
-- Migration: init_db.sql
-- Runs schema creation followed by seed data insertion
-- Usage: psql -U motomec -d motomec17gb -f init_db.sql
-- =============================================================================

\echo '>>> Running schema.sql...'
\i schema.sql

\echo '>>> Running seeds.sql...'
\i seeds.sql

\echo '>>> Database initialised successfully.'
