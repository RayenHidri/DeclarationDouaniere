-- Drop view and triggers created for articles compatibility
IF OBJECT_ID('dbo.tr_articles_delete','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_delete;
IF OBJECT_ID('dbo.tr_articles_update','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_update;
IF OBJECT_ID('dbo.tr_articles_insert','TR') IS NOT NULL
  DROP TRIGGER dbo.tr_articles_insert;
IF OBJECT_ID('dbo.articles','V') IS NOT NULL
  DROP VIEW dbo.articles;

-- End of rollback script