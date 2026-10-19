# ====================================================================
# Movix TV - Script de packaging IPK pour LG webOS
# Compatible avec webOS Dev Manager et Homebrew Channel
# ====================================================================

param (
    [string]$OutputDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Packaging Movix TV pour LG webOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$appId = "com.movix.client"
$version = "1.0.0"
$ipkName = "${appId}_${version}_all.ipk"
$ipkPath = Join-Path $OutputDir $ipkName

# 1. Vérifier si ares-package officiel est disponible
$aresPackage = Get-Command ares-package -ErrorAction SilentlyContinue

if ($aresPackage) {
    Write-Host "[+] Outil officiel ares-package détecté. Compilation en cours..." -ForegroundColor Green
    & ares-package $PSScriptRoot -o $OutputDir
} else {
    Write-Host "[i] ares-package non présent, utilisation de tar.exe..." -ForegroundColor Yellow
    $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
    if (-not $tar) {
        Write-Error "tar.exe introuvable dans System32. Impossible de générer le paquet IPK."
        exit 1
    }

    $staging = Join-Path $PSScriptRoot ".ipk_staging"
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }

    try {
        New-Item -ItemType Directory -Path "$staging\control" | Out-Null
        $appDest = "$staging\data\usr\palm\applications\$appId"
        New-Item -ItemType Directory -Path $appDest | Out-Null

        Set-Content -Path "$staging\debian-binary" -Value "2.0`n" -NoNewline

        $controlText = @"
Package: $appId
Version: $version
Section: misc
Priority: optional
Architecture: all
Maintainer: Movix Community
Description: Movix TV streaming client for webOS
"@
        Set-Content -Path "$staging\control\control" -Value $controlText

        $appFiles = @(
            "appinfo.json",
            "index.html",
            "app.js",
            "style.css",
            "tv-styles.css",
            "tv-adapter.js",
            "icon.png",
            "largeIcon.png",
            "movix.svg"
        )

        foreach ($file in $appFiles) {
            $source = Join-Path $PSScriptRoot $file
            if (Test-Path $source) {
                Copy-Item $source -Destination $appDest
            }
        }

        & tar.exe -czf "$staging\control.tar.gz" -C "$staging\control" control
        & tar.exe -czf "$staging\data.tar.gz" -C "$staging\data" usr
        & tar.exe -czf $ipkPath -C "$staging" debian-binary control.tar.gz data.tar.gz
    } finally {
        if (Test-Path $staging) {
            Remove-Item -Recurse -Force $staging
        }
    }
}

# 2. Calcul du SHA256 pour Homebrew Channel
$sha256 = (Get-FileHash -Algorithm SHA256 $ipkPath).Hash.ToLower()

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "[OK] Paquet généré avec succès !" -ForegroundColor Green
Write-Host "     Fichier : $ipkName" -ForegroundColor White
Write-Host "     SHA256  : $sha256" -ForegroundColor Gray
Write-Host "----------------------------------------" -ForegroundColor Cyan

# 3. Mise à jour automatique des flux de repository locaux
$manifestFile = Join-Path $PSScriptRoot "manifest.json"
$appsFile = Join-Path $PSScriptRoot "apps.json"

if (Test-Path $manifestFile) {
    (Get-Content $manifestFile) -replace '"sha256":\s*"[^"]*"', "`"sha256`": `"$sha256`"" | Set-Content $manifestFile
}
if (Test-Path $appsFile) {
    (Get-Content $appsFile) -replace '"sha256":\s*"[^"]*"', "`"sha256`": `"$sha256`"" | Set-Content $appsFile
}
