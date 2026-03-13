# Script para obtener y configurar tokens de Meta (Facebook/Instagram)
# PowerShell version

Write-Host "`n🔐 META TOKENS CONFIGURATOR" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Solicitar datos
Write-Host "`n📱 Ingresa los datos de tu app 'VitaGloss RD Bot':" -ForegroundColor Yellow
Write-Host "(Los encuentras en: https://developers.facebook.com/apps/ → Tu App → Configuración → Básica)`n" -ForegroundColor Gray

$appId = Read-Host "App ID"
$appSecret = Read-Host "App Secret" -AsSecureString
$appSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($appSecret))

Write-Host "`n⏱️  Token de corta duración:" -ForegroundColor Yellow
Write-Host "(El que me acabas de dar: EAAXBO8f7POY...)" -ForegroundColor Gray
$shortToken = Read-Host "Token"

Write-Host "`n⚙️  Procesando...`n" -ForegroundColor Cyan

# Paso 1: Convertir a token de larga duración
Write-Host "1️⃣  Convirtiendo a token de larga duración..." -ForegroundColor Green

$tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token"
$tokenParams = @{
    grant_type = "fb_exchange_token"
    client_id = $appId
    client_secret = $appSecretPlain
    fb_exchange_token = $shortToken
}

$queryString = ($tokenParams.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
$fullUrl = "$tokenUrl`?$queryString"

try {
    $response = Invoke-RestMethod -Uri $fullUrl -Method Get
    $longToken = $response.access_token
    Write-Host "✅ Token de larga duración obtenido (válido por ~60 días)`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Error obteniendo token de larga duración:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Paso 2: Obtener páginas
Write-Host "2️⃣  Obteniendo tus páginas de Facebook..." -ForegroundColor Green

$pagesUrl = "https://graph.facebook.com/v18.0/me/accounts?access_token=$longToken"

try {
    $pagesResponse = Invoke-RestMethod -Uri $pagesUrl -Method Get
    $pages = $pagesResponse.data
    
    if ($pages.Count -eq 0) {
        Write-Host "❌ No se encontraron páginas de Facebook" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Se encontraron $($pages.Count) página(s):`n" -ForegroundColor Green
    
    for ($i = 0; $i -lt $pages.Count; $i++) {
        Write-Host "   $($i + 1). $($pages[$i].name) (ID: $($pages[$i].id))" -ForegroundColor White
    }
    
    # Seleccionar página
    if ($pages.Count -eq 1) {
        $selectedIndex = 0
        $selectedPage = $pages[0]
        Write-Host "`n✅ Usando: $($selectedPage.name)" -ForegroundColor Green
    } else {
        Write-Host ""
        $selection = Read-Host "Selecciona el número de página"
        $selectedIndex = [int]$selection - 1
        $selectedPage = $pages[$selectedIndex]
    }
    
    $pageId = $selectedPage.id
    $pageToken = $selectedPage.access_token
    
} catch {
    Write-Host "❌ Error obteniendo páginas:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Paso 3: Obtener Instagram Business Account
Write-Host "`n3️⃣  Obteniendo cuenta de Instagram..." -ForegroundColor Green

$igUrl = "https://graph.facebook.com/v18.0/$pageId`?fields=instagram_business_account&access_token=$pageToken"

try {
    $igResponse = Invoke-RestMethod -Uri $igUrl -Method Get
    
    if ($igResponse.instagram_business_account) {
        $igAccountId = $igResponse.instagram_business_account.id
        Write-Host "✅ Instagram Business Account ID: $igAccountId`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se encontró cuenta de Instagram conectada" -ForegroundColor Yellow
        Write-Host "   Conecta tu cuenta en: Configuración de Página → Instagram`n" -ForegroundColor Gray
        $igAccountId = $null
    }
} catch {
    Write-Host "⚠️  No se pudo obtener Instagram Business Account" -ForegroundColor Yellow
    $igAccountId = $null
}

# Mostrar resumen
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 CONFIGURACIÓN COMPLETA" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`nAgrega estas variables a tu archivo .env:`n" -ForegroundColor Yellow

Write-Host "FACEBOOK_PAGE_ID=$pageId" -ForegroundColor White
Write-Host "FACEBOOK_ACCESS_TOKEN=$pageToken" -ForegroundColor White

if ($igAccountId) {
    Write-Host "INSTAGRAM_BUSINESS_ACCOUNT_ID=$igAccountId" -ForegroundColor White
    Write-Host "INSTAGRAM_ACCESS_TOKEN=$pageToken" -ForegroundColor White
}

Write-Host "`n⚠️  IMPORTANTE: El Page Access Token nunca expira si la app" -ForegroundColor Yellow
Write-Host "   está en modo producción y tiene permisos aprobados." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

# Preguntar si quiere actualizar .env automáticamente
Write-Host "`n¿Deseas actualizar el archivo .env automáticamente? (S/N): " -ForegroundColor Cyan -NoNewline
$updateEnv = Read-Host

if ($updateEnv -eq "S" -or $updateEnv -eq "s") {
    $envPath = ".env"
    
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        
        # Buscar y reemplazar o agregar variables
        if ($envContent -match "FACEBOOK_PAGE_ID=") {
            $envContent = $envContent -replace "FACEBOOK_PAGE_ID=.*", "FACEBOOK_PAGE_ID=$pageId"
        } else {
            $envContent += "`nFACEBOOK_PAGE_ID=$pageId"
        }
        
        if ($envContent -match "FACEBOOK_ACCESS_TOKEN=") {
            $envContent = $envContent -replace "FACEBOOK_ACCESS_TOKEN=.*", "FACEBOOK_ACCESS_TOKEN=$pageToken"
        } else {
            $envContent += "`nFACEBOOK_ACCESS_TOKEN=$pageToken"
        }
        
        if ($igAccountId) {
            if ($envContent -match "INSTAGRAM_BUSINESS_ACCOUNT_ID=") {
                $envContent = $envContent -replace "INSTAGRAM_BUSINESS_ACCOUNT_ID=.*", "INSTAGRAM_BUSINESS_ACCOUNT_ID=$igAccountId"
            } else {
                $envContent += "`nINSTAGRAM_BUSINESS_ACCOUNT_ID=$igAccountId"
            }
            
            if ($envContent -match "INSTAGRAM_ACCESS_TOKEN=") {
                $envContent = $envContent -replace "INSTAGRAM_ACCESS_TOKEN=.*", "INSTAGRAM_ACCESS_TOKEN=$pageToken"
            } else {
                $envContent += "`nINSTAGRAM_ACCESS_TOKEN=$pageToken"
            }
        }
        
        Set-Content -Path $envPath -Value $envContent
        Write-Host "`n✅ Archivo .env actualizado exitosamente!`n" -ForegroundColor Green
        
        Write-Host "🚀 Ahora ejecuta:" -ForegroundColor Cyan
        Write-Host "docker-compose up -d --build`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ No se encontró el archivo .env" -ForegroundColor Red
    }
}

Write-Host "`n✨ ¡Configuración completada!" -ForegroundColor Green
