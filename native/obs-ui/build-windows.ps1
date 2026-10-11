param([string]$QtRoot = $env:OBS_UI_QT_ROOT, [string]$CMake = 'cmake')
$ErrorActionPreference = 'Stop'
if (-not $QtRoot) { throw 'Indica -QtRoot con la carpeta del SDK Qt 6 MSVC x64 o configura OBS_UI_QT_ROOT.' }
$QtRoot = (Resolve-Path -LiteralPath $QtRoot).Path
$buildRoot = Join-Path $PSScriptRoot 'build'
& $CMake -S $PSScriptRoot -B $buildRoot -G 'Visual Studio 17 2022' -A x64 "-DCMAKE_PREFIX_PATH=$QtRoot"
if ($LASTEXITCODE -ne 0) { throw 'Falló la configuración CMake.' }
& $CMake --build $buildRoot --config Release
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación.' }
$bin = Join-Path $buildRoot 'Release'
foreach ($module in @('Qt6Core.dll', 'Qt6Gui.dll', 'Qt6Widgets.dll')) {
    Copy-Item -LiteralPath (Join-Path $QtRoot "bin/$module") -Destination $bin -Force
}
$platforms = Join-Path $bin 'platforms'
New-Item -ItemType Directory -Force -Path $platforms | Out-Null
foreach ($plugin in @('qwindows.dll', 'qminimal.dll')) {
    Copy-Item -LiteralPath (Join-Path $QtRoot "plugins/platforms/$plugin") -Destination $platforms -Force
}
$licenses = Join-Path $QtRoot 'licenses'
if (Test-Path -LiteralPath $licenses) { Copy-Item -LiteralPath $licenses -Destination $bin -Recurse -Force }
# Both executables share the deployed Qt runtime and platform plugins.
& (Join-Path $bin 'obs-ui-tests.exe') -platform minimal
if ($LASTEXITCODE -ne 0) { throw 'Fallaron las pruebas de componentes.' }
Write-Output "Galería: $(Join-Path $bin 'obs-ui-gallery.exe')"
