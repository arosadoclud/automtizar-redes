# Script automatizado para configurar Meta tokens
# Uso: .\scripts\setup_meta_simple.ps1 -Token "TU_TOKEN_AQUI"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

Write-Host "`n🔐 META SETUP AUTOMATIZADO" -ForegroundColor Cyan
Write-Host "=" * 60

# Obtener páginas
Write-Host "`n1️⃣  Obteniendo páginas de Facebook..." -ForegroundColor Green

$pagesUrl = "https://graph.facebook.com/v18.0/me/accounts?access_token=$Token"

try {
    $response = Invoke-RestMethod -Uri $pagesUrl -Method Get -ErrorAction Stop
    $pages = $response.data
    
    if ($pages.Count -eq 0) {
        Write-Host "❌ No se encontraron páginas" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Páginas encontradas:" -ForegroundColor Green
    $pages | ForEach-Object {
        Write-Host "   - $($_.name)" -ForegroundColor White
    }
    
    $page = $pages[0]
    $pageId = $page.id
    $pageToken = $page.access_token
    
    Write-Host "`nUsando: $($page.name) (ID: $pageId)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Obtener Instagram
Write-Host "`n2️⃣  Verificando cuenta de Instagram..." -ForegroundColor Green

$igUrl = "https://graph.facebook.com/v18.0/$pageId`?fields=instagram_business_account&access_token=$pageToken"

try {
    $igResponse = Invoke-RestMethod -Uri $igUrl -Method Get -ErrorAction Stop
    
    if ($igResponse.instagram_business_account) {
        $igId = $igResponse.instagram_business_account.id
        Write-Host "✅ Instagram Business Account encontrada: $igId" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No hay cuenta de Instagram conectada" -ForegroundColor Yellow
        $igId = $null
    }
} catch {
    Write-Host "⚠️  No se pudo verificar Instagram" -ForegroundColor Yellow
    $igId = $null
}

# Mostrar configuración
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📋 CREDENCIALES OBTENIDAS" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nFACEBOOK_PAGE_ID=$pageId" -ForegroundColor Yellow
Write-Host "FACEBOOK_ACCESS_TOKEN=$pageToken" -ForegroundColor Yellow

if ($igId) {
    Write-Host "INSTAGRAM_BUSINESS_ACCOUNT_ID=$igId" -ForegroundColor Yellow
    Write-Host "INSTAGRAM_ACCESS_TOKEN=$pageToken" -ForegroundColor Yellow
}

# Actualizar .env
Write-Host "`n3️⃣  Actualizando archivo .env..." -ForegroundColor Green

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    # Actualizar o agregar variables
    $updates = @{
        "FACEBOOK_PAGE_ID" = $pageId
        "FACEBOOK_ACCESS_TOKEN" = $pageToken
    }
    
    if ($igId) {
        $updates["INSTAGRAM_BUSINESS_ACCOUNT_ID"] = $igId
        $updates["INSTAGRAM_ACCESS_TOKEN"] = $pageToken
    }
    
    foreach ($key in $updates.Keys) {
        $value = $updates[$key]
        if ($envContent -match "$key=") {
            $envContent = $envContent -replace "$key=.*", "$key=$value"
        } else {
            $envContent += "`n$key=$value"
        }
    }
    
    Set-Content -Path ".env" -Value $envContent -NoNewline
    Write-Host "✅ Archivo .env actualizado!" -ForegroundColor Green
    
    Write-Host "`n🚀 Siguiente paso:" -ForegroundColor Cyan
    Write-Host "docker-compose up -d --build" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "Copia manualmente las credenciales arriba" -ForegroundColor Yellow
}

Write-Host "`n✨ Configuración completada!`n" -ForegroundColor Green
