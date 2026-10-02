#Requires -Version 5.1
<#
.SYNOPSIS
    Générateur de clé de licence MoveTodata Platform

.DESCRIPTION
    Lit license-config.json, génère et affiche la clé de licence chiffrée.
    Peut aussi déchiffrer une clé existante.

.EXAMPLE
    .\generate-license.ps1
    .\generate-license.ps1 -ConfigFile ".\license-config.json"
    .\generate-license.ps1 -Decrypt "HdLUVZE3EXq1Ig..."
#>

param(
    [string] $ConfigFile = "$PSScriptRoot\license-config.json",
    [string] $Decrypt    = ""
)

# ── Encodage console UTF-8 ────────────────────────────────────────────────────
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding            = [System.Text.Encoding]::UTF8

# ── Clés AES (hardcodées dans PlatformConfigService.java) ────────────────────
$SECRET_KEY = [System.Text.Encoding]::UTF8.GetBytes("0720e7f10718fd5bbef379bccf3e5871")
$SECRET_IV  = [System.Text.Encoding]::UTF8.GetBytes("fc586c88ecf66614")

# ─────────────────────────────────────────────────────────────────────────────
function Invoke-AesEncrypt([string]$PlainText) {
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode    = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key     = $SECRET_KEY
    $aes.IV      = $SECRET_IV

    $bytes     = [System.Text.Encoding]::UTF8.GetBytes($PlainText)
    $encryptor = $aes.CreateEncryptor()
    $encrypted = $encryptor.TransformFinalBlock($bytes, 0, $bytes.Length)
    $aes.Dispose()
    return [Convert]::ToBase64String($encrypted)
}

function Invoke-AesDecrypt([string]$Base64Text) {
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode    = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key     = $SECRET_KEY
    $aes.IV      = $SECRET_IV

    $bytes     = [Convert]::FromBase64String($Base64Text)
    $decryptor = $aes.CreateDecryptor()
    $decrypted = $decryptor.TransformFinalBlock($bytes, 0, $bytes.Length)
    $aes.Dispose()
    return [System.Text.Encoding]::UTF8.GetString($decrypted)
}

function Format-Limit([int]$val) {
    if ($val -eq -1) { return "illimite" } else { return "$val" }
}

function Get-ProductLabel([string]$product) {
    switch ($product) {
        "DATA_PLATFORM" { return "Acces complet (pipelines + dataviz + catalogue)" }
        "DATA_HUB"      { return "Data Hub uniquement (sans Kepler)" }
        "DATA_VIZ"      { return "Data Viz uniquement (sans Fractal)" }
        default         { return $product }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Orphea Platform -- Generateur de licence" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Mode dechiffrement ────────────────────────────────────────────────────────
if ($Decrypt -ne "") {
    Write-Host "  Mode : dechiffrement d'une cle existante" -ForegroundColor Yellow
    Write-Host ""
    try {
        $json   = Invoke-AesDecrypt $Decrypt
        $data   = $json | ConvertFrom-Json
        $expMs  = [long]$data.expiresOn
        $expDt  = [DateTimeOffset]::FromUnixTimeMilliseconds($expMs).LocalDateTime
        $expired = $expDt -lt (Get-Date)

        Write-Host "  Client       : $($data.client)"
        Write-Host "  Produit      : $($data.product)  -->  $(Get-ProductLabel $data.product)"
        Write-Host "  URLs         : $($data.baseUrl)"
        if ($expired) {
            Write-Host "  Expiration   : $($expDt.ToString('dd/MM/yyyy'))  [EXPIREE]" -ForegroundColor Red
        } else {
            Write-Host "  Expiration   : $($expDt.ToString('dd/MM/yyyy'))  [valide]" -ForegroundColor Green
        }
        Write-Host "  Utilisateurs : $(Format-Limit $data.maximumUsers)"
        Write-Host "  Datasets     : $(Format-Limit $data.maximumDatasets)"
        Write-Host "  Dashboards   : $(Format-Limit $data.maximumDashboards)"
        Write-Host "  Charts       : $(Format-Limit $data.maximumCharts)"
        Write-Host "  Repositories : $(Format-Limit $data.maximumRepositories)"
        Write-Host "  Builds/jour  : $(Format-Limit $data.maximumBuildsPerDay)"
        Write-Host "  Bloque affiché : $($data.displayBlockedFeatures)"
    } catch {
        Write-Host "  ERREUR : cle invalide ou corrompue" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    exit 0
}

# ── Lecture de la configuration ───────────────────────────────────────────────
if (-not (Test-Path $ConfigFile)) {
    Write-Host "  ERREUR : fichier de configuration introuvable :" -ForegroundColor Red
    Write-Host "  $ConfigFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Creez le fichier license-config.json dans le meme repertoire." -ForegroundColor Yellow
    exit 1
}

Write-Host "  Lecture de : $ConfigFile" -ForegroundColor Gray

try {
    $cfg = Get-Content $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host "  ERREUR : JSON invalide dans $ConfigFile" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ── Validation ────────────────────────────────────────────────────────────────
$errors = @()

if ([string]::IsNullOrWhiteSpace($cfg.client))  { $errors += "  - 'client' est vide" }
if ([string]::IsNullOrWhiteSpace($cfg.product)) { $errors += "  - 'product' est vide" }
if ($cfg.product -notin @("DATA_PLATFORM","DATA_HUB","DATA_VIZ")) {
    $errors += "  - 'product' invalide : '$($cfg.product)' (valeurs : DATA_PLATFORM | DATA_HUB | DATA_VIZ)"
}
if ([string]::IsNullOrWhiteSpace($cfg.expiresOn)) { $errors += "  - 'expiresOn' est vide" }

try {
    $expDate = [datetime]::ParseExact($cfg.expiresOn, "yyyy-MM-dd", $null)
} catch {
    $errors += "  - 'expiresOn' format invalide : '$($cfg.expiresOn)' (attendu : YYYY-MM-DD)"
}

if ($errors.Count -gt 0) {
    Write-Host "  ERREUR de configuration :" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host ""
    Write-Host "  Corrigez license-config.json et relancez." -ForegroundColor Yellow
    exit 1
}

# ── Construction du payload JSON ──────────────────────────────────────────────
$expMs = [long]([DateTimeOffset]::new(
    $expDate.Year, $expDate.Month, $expDate.Day, 23, 59, 59,
    [TimeSpan]::Zero
)).ToUnixTimeMilliseconds()

# URLs : tableau -> chaine avec ;
if ($cfg.baseUrls -is [array]) {
    $baseUrl = ($cfg.baseUrls | Where-Object { $_ -ne "" }) -join ";"
} else {
    $baseUrl = [string]$cfg.baseUrls
}

$payload = [ordered]@{
    client                 = $cfg.client
    product                = $cfg.product
    baseUrl                = $baseUrl
    displayBlockedFeatures = [bool]$cfg.displayBlockedFeatures
    maximumUsers           = [int]$cfg.maximumUsers
    maximumBuildsPerDay    = [int]$cfg.maximumBuildsPerDay
    maximumDatasets        = [int]$cfg.maximumDatasets
    maximumDashboards      = [int]$cfg.maximumDashboards
    maximumCharts          = [int]$cfg.maximumCharts
    maximumRepositories    = [int]$cfg.maximumRepositories
    expiresOn              = $expMs
}

$jsonStr = $payload | ConvertTo-Json -Compress -Depth 5

# ── Chiffrement ───────────────────────────────────────────────────────────────
$licenseKey = Invoke-AesEncrypt $jsonStr

# ── Affichage ─────────────────────────────────────────────────────────────────
Write-Host "  CLIENT      : $($cfg.client)"
Write-Host "  PRODUIT     : $($cfg.product)  -->  $(Get-ProductLabel $cfg.product)"
Write-Host "  EXPIRATION  : $($expDate.ToString('dd/MM/yyyy'))"
Write-Host "  URLS        : $baseUrl"
Write-Host ""
Write-Host "  Utilisateurs   : $(Format-Limit $cfg.maximumUsers)"
Write-Host "  Datasets       : $(Format-Limit $cfg.maximumDatasets)"
Write-Host "  Dashboards     : $(Format-Limit $cfg.maximumDashboards)"
Write-Host "  Charts         : $(Format-Limit $cfg.maximumCharts)"
Write-Host "  Repositories   : $(Format-Limit $cfg.maximumRepositories)"
Write-Host "  Builds/jour    : $(Format-Limit $cfg.maximumBuildsPerDay)"
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  CLE DE LICENCE :" -ForegroundColor Green
Write-Host ""
Write-Host $licenseKey -ForegroundColor Yellow
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Copiez cette cle dans :" -ForegroundColor Gray
Write-Host "  Settings --> Platform Config --> License Key" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Copie dans le presse-papier (optionnel) ───────────────────────────────────
try {
    $licenseKey | Set-Clipboard
    Write-Host "  [OK] Cle copiee dans le presse-papier (Ctrl+V pour coller)" -ForegroundColor Green
} catch {
    Write-Host "  [INFO] Copiez manuellement la cle ci-dessus" -ForegroundColor Gray
}
Write-Host ""
