Write-Host "🔨 Running build..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm run build failed"
  exit 1
}

Write-Host "🔐 Logging into npm..."
npm login
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm login failed"
  exit 1
}

Write-Host "📦 Publishing package to npm..."
npm publish
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm publish failed"
  exit 1
}

Write-Host "✅ Package published successfully!"