$ErrorActionPreference = 'Stop'
$taskFolder = Join-Path $PSScriptRoot '../outputs/website-policies-2026-10-23'
$taskFolder = (Resolve-Path -LiteralPath $taskFolder).Path
$qaFolder = Join-Path $taskFolder 'word-render'
New-Item -ItemType Directory -Force -Path $qaFolder | Out-Null
$wordApp = New-Object -ComObject Word.Application
$wordApp.Visible = $false
$wordApp.DisplayAlerts = 0
try {
    foreach ($taskFile in Get-ChildItem -LiteralPath $taskFolder -Filter '*.docx') {
        $document = $null
        try {
            $document = $wordApp.Documents.Open($taskFile.FullName, $false, $true)
            $document.ExportAsFixedFormat((Join-Path $qaFolder ($taskFile.BaseName + '.pdf')), 17)
            Write-Output ($taskFile.Name + ': rendered')
        } finally { if ($document) { $document.Close(0) } }
    }
} finally { $wordApp.Quit() }
