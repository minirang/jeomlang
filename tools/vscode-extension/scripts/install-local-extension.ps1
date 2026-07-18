param(
  [string[]]$InstallRoots = @(
    (Join-Path $env:USERPROFILE ".vscode\extensions"),
    (Join-Path $env:USERPROFILE ".cursor\extensions")
  ),
  [string]$ExtensionId = "local.jeom-vscode-runner-0.2.1"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$version = (Get-Content (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json).version
if ($ExtensionId -notmatch [regex]::Escape($version)) {
  $ExtensionId = "local.jeom-vscode-runner-$version"
}

$files = @(
  "package.json",
  "extension.js",
  "language-configuration.json",
  "README.md",
  "COMPATIBILITY.md"
)

$dirs = @(
  "official",
  "snippets",
  "syntaxes"
)

$externalIcon = Join-Path $repoRoot "..\..\assets\img\icon.png"

foreach ($installRoot in $InstallRoots) {
  if (-not (Test-Path $installRoot)) {
    Write-Host "Skip (folder missing): $installRoot"
    continue
  }

  Get-ChildItem $installRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "local.jeom-vscode-runner-*" -and $_.Name -ne $ExtensionId } |
    ForEach-Object {
      Write-Host "Remove old extension: $($_.FullName)"
      Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

  $target = Join-Path $installRoot $ExtensionId
  New-Item -ItemType Directory -Force $target | Out-Null

  foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination (Join-Path $target $file) -Force
  }

  foreach ($dir in $dirs) {
    $sourceDir = Join-Path $repoRoot $dir
    $targetDir = Join-Path $target $dir
    New-Item -ItemType Directory -Force $targetDir | Out-Null
    Copy-Item -Path (Join-Path $sourceDir "*") -Destination $targetDir -Recurse -Force
  }

  $iconTargetDir = Join-Path $target "assets"
  New-Item -ItemType Directory -Force $iconTargetDir | Out-Null
  if (Test-Path $externalIcon) {
    Copy-Item -LiteralPath $externalIcon -Destination (Join-Path $iconTargetDir "icon.png") -Force
  } else {
    Write-Host "Warning: external icon not found: $externalIcon"
  }

  $bundledCli = Join-Path $target "official\cli.js"
  if (-not (Test-Path $bundledCli)) {
    throw "Install failed: official\cli.js not found in $target (run npm run update-jeom if missing)"
  }

  Write-Host "Installed JEOM VS Code Runner to:"
  Write-Host "  $target"
}

Write-Host ""
Write-Host "Reload VS Code / Cursor (Developer: Reload Window), then open a .jeom file."
Write-Host "You should see JEOM syntax colors, Run JEOM CodeLens, and the editor title Run button."
