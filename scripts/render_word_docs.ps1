param([Parameter(Mandatory=$true)][string]$DocumentDirectory, [switch]$UseActiveWord)
$ErrorActionPreference = 'Stop'
$docDirectory = (Resolve-Path -LiteralPath $DocumentDirectory).Path
$workspaceDirectory = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if (-not $docDirectory.StartsWith($workspaceDirectory + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'The render target must be inside the project workspace.'
}
$qaDirectory = Join-Path $workspaceDirectory 'documentation\qa\corrected'
New-Item -ItemType Directory -Path $qaDirectory -Force | Out-Null
$wordRenderer = $null
try {
  if ($UseActiveWord) {
    $wordRenderer = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
  } else {
    $wordRenderer = New-Object -ComObject Word.Application
    if ($wordRenderer.Documents.Count -ne 0) { throw 'Refusing to use a Word instance containing other open documents.' }
    $wordRenderer.Visible = $false
    $wordRenderer.DisplayAlerts = 0
  }
  $initialDocumentCount = $wordRenderer.Documents.Count
  $missing = [Type]::Missing
  foreach ($docName in @('Petty Cash App - Database Schema.docx', 'Petty Cash Request System - Project Overview.docx', 'Configuration document.docx')) {
    $docPath = Join-Path $docDirectory $docName
    $renderDirectory = Join-Path $qaDirectory ([System.IO.Path]::GetFileNameWithoutExtension($docName))
    New-Item -ItemType Directory -Path $renderDirectory -Force | Out-Null
    $pdfPath = Join-Path $renderDirectory 'document.pdf'
    $wordDocument = $null
    $ownsDocument = $false
    foreach ($existingDocument in $wordRenderer.Documents) {
      if ($existingDocument.FullName -eq $docPath) {
        if (-not $existingDocument.Saved) { throw ('The open corrected candidate has unsaved changes. Save or close this candidate before rendering: ' + $docName) }
        $wordDocument = $existingDocument
      }
    }
    if (-not $wordDocument) {
      # Visible=false applies only to our new document; do not hide the user's Word window.
      $wordDocument = $wordRenderer.Documents.Open($docPath, $false, $true, $false,
        $missing, $missing, $false, $missing, $missing, $missing, $missing, $false)
      $ownsDocument = $true
    }
    try {
      $wordDocument.ExportAsFixedFormat($pdfPath, 17)
    } finally { if ($ownsDocument) { $wordDocument.Close(0) } }
    & 'C:\Users\numan\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -scale-to 1500 -png $pdfPath (Join-Path $renderDirectory 'page')
    if ($LASTEXITCODE -ne 0) { throw 'PDF rasterization failed.' }
    Write-Output ('Rendered ' + $docName)
  }
} finally {
  if ($wordRenderer) {
    if (-not $UseActiveWord -and $wordRenderer.Documents.Count -eq 0) { $wordRenderer.Quit() }
    if ($UseActiveWord -and $wordRenderer.Documents.Count -ne $initialDocumentCount) {
      Write-Warning 'The Word document count changed during rendering; no existing documents were closed.'
    }
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordRenderer)
  }
}
