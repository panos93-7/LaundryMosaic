# Path to your components folder
$componentsPath = ".\components"

# Get all TSX component files
$components = Get-ChildItem -Path $componentsPath -Recurse -Filter *.tsx

Write-Host ""
Write-Host "Checking for orphaned components..."
Write-Host ""

foreach ($file in $components) {
    $name = $file.BaseName
    $path = $file.FullName

    # Search for imports of this component in the entire project
    $results = Select-String -Path ".\**\*.tsx" -Pattern $name | Where-Object { $_.Path -ne $path }

    if ($results.Count -eq 0) {
        Write-Host "ORPHAN: $name.tsx"
    } else {
        Write-Host "USED:   $name.tsx"
    }
}

Write-Host ""
Write-Host "Done."
Write-Host ""