# Start the local server (if needed) and open the public church site.
# Usage: .\scripts\start-client.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/site.mjs client
