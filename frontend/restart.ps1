Write-Host "Stopping any existing Node processes..."
taskkill /F /IM node.exe 2>$null

Write-Host "Clearing Next.js cache..."
if (Test-Path -Path ".next") {
    Remove-Item -Recurse -Force ".next"
}

Write-Host "Clearing Node modules cache..."
npm cache clean --force

Write-Host "Starting Next.js in production mode..."
npm run build
npm start -- -p 9003
