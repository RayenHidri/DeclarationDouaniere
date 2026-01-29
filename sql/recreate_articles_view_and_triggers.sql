-- Recreate articles view and INSTEAD OF triggers (safe): DROP then CREATE
-- Usage: run this script in SSMS or sqlcmd. It drops existing triggers/view then recreates them.

-- Drop triggers if they exist
IF OBJECT_ID('dbo.tr_articles_delete','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_delete;
IF OBJECT_ID('dbo.tr_articles_update','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_update;
IF OBJECT_ID('dbo.tr_articles_insert','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_insert;
GO

-- Drop view if exists
IF OBJECT_ID('dbo.articles','V') IS NOT NULL
  DROP VIEW dbo.articles;
GO

-- Create view (must be first statement in its batch)
CREATE VIEW dbo.articles AS
SELECT id,
       family_id,
       code AS product_ref,
       label,
       description,
       NULL AS is_active
FROM sa_articles;
GO

-- Create INSTEAD OF INSERT trigger
CREATE TRIGGER dbo.tr_articles_insert
ON dbo.articles
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO sa_articles (family_id, code, label, description)
    SELECT i.family_id, i.product_ref, i.label, i.description
    FROM inserted i;
END;
GO

-- Create INSTEAD OF UPDATE trigger
CREATE TRIGGER dbo.tr_articles_update
ON dbo.articles
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE s
    SET s.code = i.product_ref,
        s.label = i.label,
        s.description = COALESCE(i.description, s.description)
    FROM sa_articles s
    INNER JOIN inserted i ON s.id = i.id;
END;
GO

-- Create INSTEAD OF DELETE trigger
CREATE TRIGGER dbo.tr_articles_delete
ON dbo.articles
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DELETE s
    FROM sa_articles s
    INNER JOIN deleted d ON s.id = d.id;
END;
GO

-- Verification queries (run separately to check results):
-- 1) Check view returns rows
--    SELECT TOP 10 * FROM dbo.articles;
-- 2) Check triggers exist
--    SELECT OBJECT_NAME(object_id) AS name, type_desc FROM sys.objects WHERE name LIKE 'tr_articles_%' OR name = 'articles';

-- 3) Transactional test for insert/update/delete via view (safe: wraps in transaction and rollbacks)
-- BEGIN TRANSACTION;
-- INSERT INTO dbo.articles (family_id, product_ref, label, description) VALUES ( (SELECT TOP 1 id FROM sa_families), 'TST-REF', 'TEST LABEL', 'test description');
-- SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
-- UPDATE dbo.articles SET label = 'UPDATED LABEL' WHERE code = 'TST-REF';
-- SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
-- DELETE dbo.articles WHERE code = 'TST-REF';
-- SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
-- ROLLBACK;

-- End of script