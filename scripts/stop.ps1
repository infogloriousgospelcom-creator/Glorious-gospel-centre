# Stop the local Next.js server on port 3000 (or $env:PORT).
# Usage: .\scripts\stop.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/site.mjs stop
