/* ===============================
   1. TABLE FOURNISSEURS
   =============================== */
IF OBJECT_ID('dbo.suppliers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.suppliers (
        id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        code        NVARCHAR(50) NULL,
        name        NVARCHAR(200) NOT NULL,
        is_active   BIT NOT NULL DEFAULT(1),
        created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX IX_suppliers_name ON dbo.suppliers(name);
END
GO

/* ===============================
   2. TABLE CLIENTS (POUR EA)
   =============================== */
IF OBJECT_ID('dbo.customers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customers (
        id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        code        NVARCHAR(50) NULL,
        name        NVARCHAR(200) NOT NULL,
        is_active   BIT NOT NULL DEFAULT(1),
        created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX IX_customers_name ON dbo.customers(name);
END
GO

/* ===============================
   3. TABLE FAMILLES SA
      (Rond à béton, Fils machine, Fer carré)
   =============================== */
IF OBJECT_ID('dbo.sa_families', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sa_families (
        id             BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        label          NVARCHAR(100) NOT NULL,   -- ex: 'Rond à béton'
        scrap_percent  DECIMAL(5,2) NOT NULL,    -- ex: 5.00 (pour 5 %)
        is_active      BIT NOT NULL DEFAULT(1),
        created_at     DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at     DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX IX_sa_families_label ON dbo.sa_families(label);

    /* Seed initial des 3 familles */
    INSERT INTO dbo.sa_families (label, scrap_percent)
    VALUES
        (N'Rond à béton', 5.00),
        (N'Fils machine', 6.00),
        (N'Fer carré',    8.00);
END
GO
