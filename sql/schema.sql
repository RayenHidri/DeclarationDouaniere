-- SQL Server schema (simplified)
-- Users & roles
CREATE TABLE roles (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(50) NOT NULL UNIQUE,
  label NVARCHAR(200) NOT NULL
);

CREATE TABLE users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  full_name NVARCHAR(200) NOT NULL,
  email NVARCHAR(200) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  is_active BIT DEFAULT 1
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Suppliers & customers
CREATE TABLE suppliers (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  code NVARCHAR(100) NULL,
  is_active BIT DEFAULT 1
);

CREATE TABLE customers (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  code NVARCHAR(100) NULL,
  is_active BIT DEFAULT 1
);

-- Families & articles
CREATE TABLE sa_families (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(50) NULL,
  label NVARCHAR(200) NOT NULL,
  scrap_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BIT DEFAULT 1
);

CREATE TABLE articles (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  product_ref NVARCHAR(100) NOT NULL,
  label NVARCHAR(255) NOT NULL,
  family_id BIGINT NOT NULL,
  is_active BIT DEFAULT 1,
  FOREIGN KEY (family_id) REFERENCES sa_families(id)
);

-- SA declarations
CREATE TABLE sa_declarations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  sa_number NVARCHAR(20) NOT NULL UNIQUE,
  regime_code NVARCHAR(10),
  declaration_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'OPEN',
  quantity_initial DECIMAL(18,3) NOT NULL,
  quantity_unit NVARCHAR(10) NOT NULL DEFAULT 'TONNE',
  scrap_quantity_ton DECIMAL(18,3) NULL,
  value_amount DECIMAL(18,3) NULL,
  currency_code NVARCHAR(3) NULL,
  fx_rate DECIMAL(18,6) NULL,
  amount_ds DECIMAL(18,3) NULL,
  supplier_id BIGINT NULL,
  supplier_name NVARCHAR(200) NULL,
  family_id BIGINT NULL,
  description NVARCHAR(500) NULL,
  quantity_apured DECIMAL(18,3) NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  updated_by BIGINT NULL,
  updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (family_id) REFERENCES sa_families(id)
);

-- EA declarations
CREATE TABLE ea_declarations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ea_number NVARCHAR(50) NOT NULL UNIQUE,
  regime_code NVARCHAR(10) DEFAULT '362',
  export_date DATE NOT NULL,
  status NVARCHAR(30) DEFAULT 'SUBMITTED',
  customer_name NVARCHAR(255) NOT NULL,
  destination_country NVARCHAR(100) NULL,
  product_ref NVARCHAR(100) NULL,
  product_desc NVARCHAR(MAX) NULL,
  total_quantity DECIMAL(18,3) NOT NULL,
  quantity_unit NVARCHAR(20) NOT NULL,
  created_by BIGINT NOT NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  updated_by BIGINT NULL,
  updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Allocations (apurement)
CREATE TABLE sa_ea_allocations (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  sa_id BIGINT NOT NULL,
  ea_id BIGINT NOT NULL,
  quantity DECIMAL(18,3) NOT NULL, -- quantity stored as SA-consumed (billettes)
  created_by BIGINT NOT NULL,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  FOREIGN KEY (sa_id) REFERENCES sa_declarations(id),
  FOREIGN KEY (ea_id) REFERENCES ea_declarations(id)
);
