# Quick script to fix Prisma schema for PostgreSQL
$schemaPath = "genfity-backend\prisma\schema.prisma"

# Read the file
$content = Get-Content $schemaPath -Raw

# Fix remaining LongText issues
$content = $content -replace '@db\.LongText', '@db.Text'

# Fix index length syntax
$content = $content -replace '\[token\(length: 255\)\]', '[token]'

# Fix foreign key naming conflicts by removing existing index map names that conflict
$content = $content -replace '@@index\(\[userId\], map: "([^"]+)_userId_fkey"\)', '@@index([userId])'
$content = $content -replace '@@index\(\[transactionId\], map: "([^"]+)_transactionId_fkey"\)', '@@index([transactionId])'
$content = $content -replace '@@index\(\[packageId\], map: "([^"]+)_packageId_fkey"\)', '@@index([packageId])'
$content = $content -replace '@@index\(\[whatsappPackageId\], map: "([^"]+)_whatsappPackageId_fkey"\)', '@@index([whatsappPackageId])'

# Write back to file
Set-Content -Path $schemaPath -Value $content

Write-Host "Schema fixed for PostgreSQL compatibility" -ForegroundColor Green
