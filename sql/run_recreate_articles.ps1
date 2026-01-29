Param(
  [string]$Server = "",
  [string]$Database = "",
  [switch]$UseIntegratedAuth
)

if (-not $Server) {
  $Server = Read-Host "SQL Server instance (ex: APPNAVBC\\DEV)"
}
if (-not $Database) {
  $Database = Read-Host "Database name"
}

$scriptPath = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath 'recreate_articles_view_and_triggers.sql'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Script not found: $scriptPath"
  exit 1
}

$authPart = if ($UseIntegratedAuth) { "-E" } else {
  $user = Read-Host "SQL username (leave blank for integrated auth)"
  if (-not $user) { $UseIntegratedAuth = $true; "-E" } else {
    $pwd = Read-Host -AsSecureString "SQL password"
    # Convert securestring to plain for sqlcmd -P (there is no safe standard, so we ask the user to confirm)
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwd)
    $unpwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    "-U `"$user`" -P `"$unpwd`""
  }
}

Write-Host "Running recreate script on $Server,$Database using auth: $($UseIntegratedAuth ? 'Integrated' : 'SQL')"

$cmd = "sqlcmd -S `"$Server`" -d `"$Database`" $authPart -i `"$scriptPath`""
Write-Host "Executing: $cmd"

$proc = Start-Process -FilePath sqlcmd -ArgumentList "-S", $Server, "-d", $Database, $authPart, "-i", $scriptPath -NoNewWindow -PassThru -Wait
if ($proc.ExitCode -ne 0) {
  Write-Error "sqlcmd returned exit code $($proc.ExitCode). Check connection and permissions."
  exit $proc.ExitCode
}

Write-Host "Script executed. Running verification queries..."

# Check view returns rows
Write-Host "SELECT TOP 5 * FROM dbo.articles;"
Start-Process -FilePath sqlcmd -ArgumentList "-S", $Server, "-d", $Database, $authPart, "-Q", "SELECT TOP 5 * FROM dbo.articles;" -NoNewWindow -Wait

# Check triggers existence
Write-Host "SELECT OBJECT_NAME(object_id) AS name, type_desc FROM sys.objects WHERE name LIKE 'tr_articles_%' OR name = 'articles';"
Start-Process -FilePath sqlcmd -ArgumentList "-S", $Server, "-d", $Database, $authPart, "-Q", "SELECT OBJECT_NAME(object_id) AS name, type_desc FROM sys.objects WHERE name LIKE 'tr_articles_%' OR name = 'articles';" -NoNewWindow -Wait

# Ask to run transactional test
$runTest = Read-Host "Run transactional insert/update/delete test via the view? (y/N)"
if ($runTest -eq 'y' -or $runTest -eq 'Y') {
  $testSql = @"
BEGIN TRANSACTION;
DECLARE @fid BIGINT = (SELECT TOP 1 id FROM sa_families);
INSERT INTO dbo.articles (family_id, product_ref, label, description) VALUES (@fid, 'TST-REF', 'TEST LABEL', 'test description');
SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
UPDATE dbo.articles SET label = 'UPDATED LABEL' WHERE code = 'TST-REF';
SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
DELETE dbo.articles WHERE code = 'TST-REF';
SELECT TOP 5 * FROM sa_articles WHERE code = 'TST-REF';
ROLLBACK;
"@

  $tmp = [System.IO.Path]::GetTempFileName() + '.sql'
  Set-Content -Path $tmp -Value $testSql -Encoding UTF8
  Write-Host "Executing transactional test (will ROLLBACK): $tmp"
  Start-Process -FilePath sqlcmd -ArgumentList "-S", $Server, "-d", $Database, $authPart, "-i", $tmp -NoNewWindow -Wait
  Remove-Item $tmp -Force
}

Write-Host "Done. If everything is OK, restart the backend and test the UI (EA/new)."