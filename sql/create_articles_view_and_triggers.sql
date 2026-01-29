-- Create view `articles` mapped to legacy `sa_articles` (SQL Server)
-- This provides compatibility for the application which expects an `articles` table
-- Note: `sa_articles` has columns: id, family_id, code, label, description

IF OBJECT_ID('dbo.articles', 'V') IS NULL
BEGIN
    EXEC('CREATE VIEW dbo.articles AS
    SELECT id,
           family_id,
           code AS product_ref,
           label,
           description,
           NULL AS is_active
    FROM sa_articles;');
END
GO

-- INSTEAD OF INSERT trigger: forward inserts on the view to sa_articles
IF OBJECT_ID('dbo.tr_articles_insert', 'TR') IS NULL
BEGIN
    EXEC('CREATE TRIGGER dbo.tr_articles_insert
    ON dbo.articles
    INSTEAD OF INSERT
    AS
    BEGIN
        INSERT INTO sa_articles (family_id, code, label, description)
        SELECT i.family_id, i.product_ref, i.label, i.description
        FROM inserted i;
    END');
END
GO

-- INSTEAD OF UPDATE trigger: forward updates
IF OBJECT_ID('dbo.tr_articles_update', 'TR') IS NULL
BEGIN
    EXEC('CREATE TRIGGER dbo.tr_articles_update
    ON dbo.articles
    INSTEAD OF UPDATE
    AS
    BEGIN
        UPDATE s
        SET s.code = i.product_ref,
            s.label = i.label,
            s.description = COALESCE(i.description, s.description)
        FROM sa_articles s
        INNER JOIN inserted i ON s.id = i.id;
    END');
END
GO

-- INSTEAD OF DELETE trigger: forward deletes
IF OBJECT_ID('dbo.tr_articles_delete', 'TR') IS NULL
BEGIN
    EXEC('CREATE TRIGGER dbo.tr_articles_delete
    ON dbo.articles
    INSTEAD OF DELETE
    AS
    BEGIN
        DELETE s
        FROM sa_articles s
        INNER JOIN deleted d ON s.id = d.id;
    END');
END
GO

-- Rollback helpers (safe drop statements)
-- Execute the following to remove the view and triggers if needed:
-- IF OBJECT_ID('dbo.tr_articles_delete','TR') IS NOT NULL DROP TRIGGER dbo.tr_articles_delete;
-- IF OBJECT_ID('dbo.tr_articles_update','TR') IS NOT NULL DROP TRIGGER dbo.tr_articles_update;
-- IF OBJECT_ID('dbo.tr_articles_insert','TR') IS NOT NULL DROP TRIGGER dbo.tr_articles_insert;
-- IF OBJECT_ID('dbo.articles','V') IS NOT NULL DROP VIEW dbo.articles;

-- End of script
