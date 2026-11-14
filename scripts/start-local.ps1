param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 3000,
    [switch]$Production
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDirectory

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required. Install Node.js 22.9 or newer, then run this script again.'
}

if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'node_modules/next/package.json'))) {
    Write-Host 'Installing Sententia dependencies...'
    & npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}

if ($Production) {
    Write-Host 'Building Sententia for local production use...'
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
    Write-Host "Open http://127.0.0.1:$Port in your browser. Press Ctrl+C to stop."
    & npm.cmd run start -- --port $Port
} else {
    Write-Host "Open http://127.0.0.1:$Port in your browser. Press Ctrl+C to stop."
    & npm.cmd run dev -- --port $Port
}

if ($LASTEXITCODE -ne 0) { throw "Sententia exited with code $LASTEXITCODE." }
