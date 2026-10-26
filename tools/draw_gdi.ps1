param(
    [Parameter(Mandatory = $true)][string]$Dir
)

Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -Path $Dir -Filter '*.json' | Sort-Object Name
if (-not $files) { Write-Error "no json found in $Dir"; exit 1 }

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center

foreach ($file in $files) {
    $json = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $fig = $json | ConvertFrom-Json

    $bw = [int]$fig.w * [int]$fig.s
    $bh = [int]$fig.h * [int]$fig.s

    $bmp = New-Object System.Drawing.Bitmap -ArgumentList $bw, $bh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::White)

    $black = [System.Drawing.Brushes]::Black

    foreach ($ln in @($fig.lines)) {
        $pen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::Black), ([float]$ln[4])
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $g.DrawLine($pen, [float]$ln[0], [float]$ln[1], [float]$ln[2], [float]$ln[3])
        $pen.Dispose()
    }

    foreach ($dt in @($fig.dots)) {
        $r = [float]$dt[2]
        $g.FillEllipse($black, [float]$dt[0] - $r, [float]$dt[1] - $r, 2 * $r, 2 * $r)
    }

    foreach ($tx in @($fig.texts)) {
        $font = New-Object System.Drawing.Font -ArgumentList ([string]$tx[4]), ([float]$tx[3]), ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
        $g.DrawString([string]$tx[2], $font, $black, [float]$tx[0], [float]$tx[1], $fmt)
        $font.Dispose()
    }

    $out = [System.IO.Path]::ChangeExtension($file.FullName, '.png')
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output ("saved {0} ({1}x{2})" -f $out, $bw, $bh)
}
