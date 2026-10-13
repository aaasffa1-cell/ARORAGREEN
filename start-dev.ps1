# ARORA ESPORTS — Windows PowerShell Dual Server Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching ARORA ESPORTS Full-Stack Development Platform" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$CurrentDir = Get-Location

# Start Backend in a new PowerShell window
Write-Host "Starting Backend API Server (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\backend'; npm run dev"

# Start Frontend in a new PowerShell window
Write-Host "Starting Frontend Vite App (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$CurrentDir\frontend'; npm run dev"

Write-Host "`nBoth services are booting up in separate consoles:" -ForegroundColor Green
Write-Host "  📡 Backend API:  http://localhost:4000/api" -ForegroundColor White
Write-Host "  🎮 Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host "`nPress any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
