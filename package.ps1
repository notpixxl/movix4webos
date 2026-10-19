# ====================================================================
# Movix TV - Script de packaging IPK pour LG webOS
# Produit une archive Unix ar (Debian standard) requise par webOS
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
    Write-Host "[i] Assemblage de l'archive Debian ar autonome..." -ForegroundColor Yellow
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

        # debian-binary (2.0\n)
        Set-Content -Path "$staging\debian-binary" -Value "2.0`n" -NoNewline

        # control
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

        # Fichiers de l'application
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

        # 1. Compression control.tar.gz
        & tar.exe -czf "$staging\control.tar.gz" -C "$staging\control" control
        # 2. Compression data.tar.gz
        & tar.exe -czf "$staging\data.tar.gz" -C "$staging\data" usr

        # 3. Assemblage du conteneur Unix "ar" (standard Debian requis par webOS Busybox ar)
        $stream = [System.IO.File]::Create($ipkPath)
        $writer = New-Object System.IO.BinaryWriter($stream)

        # En-tête global ar
        $globalHeader = [System.Text.Encoding]::ASCII.GetBytes("!<arch>`n")
        $writer.Write($globalHeader, 0, $globalHeader.Length)

        $memberFiles = @(
            (Join-Path $staging "debian-binary"),
            (Join-Path $staging "control.tar.gz"),
            (Join-Path $staging "data.tar.gz")
        )

        foreach ($filePath in $memberFiles) {
            $info = Get-Item $filePath
            $nameWithSlash = $info.Name + "/"
            $nameField = $nameWithSlash.PadRight(16)
            $dateField = ("0").PadRight(12)
            $uidField  = ("0").PadRight(6)
            $gidField  = ("0").PadRight(6)
            $modeField = ("100644").PadRight(8)
            
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $sizeField = ($fileBytes.Length.ToString()).PadRight(10)
            $endMagic = [byte[]]@(0x60, 0x0A) # `\n

            $headerText = "$nameField$dateField$uidField$gidField$modeField$sizeField"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
            
            $writer.Write($headerBytes, 0, $headerBytes.Length)
            $writer.Write($endMagic, 0, 2)
            $writer.Write($fileBytes, 0, $fileBytes.Length)

            # Alignement pair obligatoire dans le format ar
            if ($fileBytes.Length % 2 -ne 0) {
                $writer.Write([byte]0x0A)
            }
        }

        $writer.Close()
        $stream.Close()
    } finally {
        if (Test-Path $staging) {
            Remove-Item -Recurse -Force $staging
        }
    }
}

# 2. Calcul du SHA256 pour Homebrew Channel
$sha256 = (Get-FileHash -Algorithm SHA256 $ipkPath).Hash.ToLower()

Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "[OK] Paquet ar IPK généré avec succès !" -ForegroundColor Green
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
