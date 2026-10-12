# PowerShell script to install npm packages for D&O Intelligence frontend
$frontendDir = "d:/Projectos/I2A2/Labs/DO Insight Policy Analysis/do-intelligence/frontend"

Write-Host "Changing to frontend directory: $frontendDir"
Set-Location $frontendDir

Write-Host "Initializing npm..."
npm init -y | Out-Null

Write-Host "Installing Vite..."
npm install vite | Out-Null

Write-Host "Installing React, TypeScript and plugins..."
npm install react react-dom @types/react @types/node --save-dev | Out-Null

npx tsc --init --target ES2020 --module bundling:modules --strict --esModuleInterop --moduleResolution bundling --outDir dist --rootDir src 2>&1 | Out-Null

Write-Host "Installing MUI..."
npm install @mui/material @emotion/react @emotion/styled | Out-Null

Write-Host "Installing React Router..."
npm install react-router-dom | Out-Null

Write-Host "Installing TanStack Query..."
npm install @tanstack/react-query | Out-Null

Write-Host "Installing React Hook Form..."
npm install react-hook-form | Out-Null

Write-Host "Installing Recharts..."
npm install recharts | Out-Null

Write-Host "Installing Lucide React..."
npm install @lucide/react | Out-Null

Write-Host "Installing MUI icons..."
npm install @mui/icons-material | Out-Null

Write-Host "Installing Playwright for E2E testing..."
npm install -D playwright | Out-Null

Write-Host "Installing Axios..."
npm install axios | Out-Null

Write-Host "All packages installed successfully!"