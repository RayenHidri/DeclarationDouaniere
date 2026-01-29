/* ===============================
   4. AJOUT DES COLONNES SUR SA
   =============================== */

-- Vérifie que la table existe
IF OBJECT_ID('dbo.sa_declarations', 'U') IS NULL
BEGIN
    RAISERROR('Table dbo.sa_declarations introuvable. Vérifie le nom.', 16, 1);
    RETURN;
END
GO

/* 4.1. Lien fournisseur */
IF COL_LENGTH('dbo.sa_declarations', 'supplier_id') IS NULL
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD supplier_id BIGINT NULL;
END
GO

/* 4.2. Lien famille */
IF COL_LENGTH('dbo.sa_declarations', 'family_id') IS NULL
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD family_id BIGINT NULL;
END
GO

/* 4.3. Quantité droit de déchet (en Tonne) */
IF COL_LENGTH('dbo.sa_declarations', 'scrap_quantity_ton') IS NULL
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD scrap_quantity_ton DECIMAL(18,3) NULL;  -- ex: 250.000 T
END
GO

/* 4.4. Taux de change */
IF COL_LENGTH('dbo.sa_declarations', 'fx_rate') IS NULL
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD fx_rate DECIMAL(18,6) NULL;             -- ex: 3.300000
END
GO

/* 4.5. Montant en devise société (DS) */
IF COL_LENGTH('dbo.sa_declarations', 'amount_ds') IS NULL
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD amount_ds DECIMAL(18,3) NULL;           -- ex: 330000.000
END
GO
