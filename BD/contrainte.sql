/* ===============================
   5. FOREIGN KEYS
   =============================== */

-- SA → Fournisseur
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_sa_declarations_suppliers'
      AND parent_object_id = OBJECT_ID('dbo.sa_declarations')
)
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD CONSTRAINT FK_sa_declarations_suppliers
        FOREIGN KEY (supplier_id) REFERENCES dbo.suppliers(id);
END
GO

-- SA → Famille
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_sa_declarations_sa_families'
      AND parent_object_id = OBJECT_ID('dbo.sa_declarations')
)
BEGIN
    ALTER TABLE dbo.sa_declarations
    ADD CONSTRAINT FK_sa_declarations_sa_families
        FOREIGN KEY (family_id) REFERENCES dbo.sa_families(id);
END
GO
