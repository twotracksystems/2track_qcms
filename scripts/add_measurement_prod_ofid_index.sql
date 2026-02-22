-- Run this in Supabase SQL Editor to optimize order deletion.
-- Index on ofid avoids full table scan when deleting measurements by OFID.
CREATE INDEX IF NOT EXISTS idx_tbl_measurement_prod_ofid ON tbl_measurement_prod (ofid);
