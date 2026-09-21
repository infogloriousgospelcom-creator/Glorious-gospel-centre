# Start the local server (if needed) and open the admin sign-in page.
# Usage: .\scripts\start-admin.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/site.mjs admin
