# Script para liberar puertos del backend (Windows PowerShell)
# Ejecutar cuando veas "EADDRINUSE: address already in use"
# Uso: .\scripts\liberar-puertos.ps1

$puertos = @(4300, 4200, 4201, 4202, 4203, 4204, 4205)
$liberados = 0

Write-Host "Buscando procesos en puertos del backend..."

foreach ($puerto in $puertos) {
    try {
        $conexion = Get-NetTCPConnection -LocalPort $puerto -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conexion -and $conexion.OwningProcess) {
            $pid = $conexion.OwningProcess
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "  Puerto $puerto : proceso $pid terminado"
            $liberados++
        }
    } catch {
        Write-Host "  Puerto $puerto : $($_.Exception.Message)"
    }
}

if ($liberados -eq 0) {
    Write-Host "No se encontraron procesos usando los puertos del backend."
} else {
    Write-Host "`nListo. Ejecuta 'npm run dev:backend' para reiniciar."
}
