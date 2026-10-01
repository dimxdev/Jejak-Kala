<#
Takes the image you just downloaded from Gemini and files it away.

  0. removes empty Gemini_Generated_Image_* leftovers from earlier downloads
  1. starts accept-save-dialog.ps1 in the background (it presses Save in the browser's Save dialog,
     and Yes if Windows asks to replace an existing file)
  2. waits until a finished Gemini_Generated_Image_* file shows up in Downloads
  3. moves it to -Destination (an extension is added from the downloaded file if you leave it out)

Usage (Windows PowerShell):
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/gemini/ingest-download.ps1 `
      -Destination assets-src/style-test/a-flat/raw/banner

Prints the final path. Exit code 0 = filed, 1 = nothing arrived before the timeout.
#>
param(
    [Parameter(Mandatory = $true)][string]$Destination,
    [int]$TimeoutSec = 120,
    [string]$DownloadsDir = (Join-Path $env:USERPROFILE 'Downloads'),
    [int]$MinKB = 200
)

# Every Save leaves an empty (0-byte) Gemini_Generated_Image_* file behind, next to the real download.
# A stale one makes Windows ask "already exists, replace?" when the same name comes up again (the image
# editor always suggests the same name), so empty ones are removed before and after.
function Remove-EmptyStubs {
    Get-ChildItem -LiteralPath $DownloadsDir -Filter 'Gemini_Generated_Image_*' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -eq 0 } |
        ForEach-Object { [IO.File]::Delete($_.FullName) }
}
Remove-EmptyStubs

$started = Get-Date
# Start-Process does not quote array elements, and this repo's path contains spaces: build one quoted string
$acceptorScript = Join-Path $PSScriptRoot 'accept-save-dialog.ps1'
$acceptor = Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -PassThru `
    -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$acceptorScript`" -TimeoutSec $TimeoutSec"

$file = $null
$deadline = $started.AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
    # a finished download has its final name and size; browsers first write a *.tmp or a 0-byte stub
    $file = Get-ChildItem -LiteralPath $DownloadsDir -Filter 'Gemini_Generated_Image_*' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt ($MinKB * 1KB) -and $_.LastWriteTime -ge $started.AddSeconds(-2) } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($file) { break }
    Start-Sleep -Milliseconds 500
}

if ($acceptor -and -not $acceptor.HasExited) { Stop-Process -Id $acceptor.Id -Force -ErrorAction SilentlyContinue }

if (-not $file) {
    Write-Output "No download arrived within $TimeoutSec s"
    exit 1
}

if (-not [IO.Path]::GetExtension($Destination)) { $Destination += $file.Extension }
$dir = Split-Path -Parent $Destination
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
Move-Item -LiteralPath $file.FullName -Destination $Destination -Force
Remove-EmptyStubs
Write-Output ("{0} ({1:N0} KB)" -f (Resolve-Path -LiteralPath $Destination), ((Get-Item -LiteralPath $Destination).Length / 1KB))
exit 0
