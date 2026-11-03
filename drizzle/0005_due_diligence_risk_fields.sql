ALTER TABLE "deal_tasks" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "deal_tasks" ADD COLUMN IF NOT EXISTS "severity" text;
ALTER TABLE "deal_tasks" ADD COLUMN IF NOT EXISTS "problem_description" text;
ALTER TABLE "deal_tasks" ADD COLUMN IF NOT EXISTS "document_reference" text;

