Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Users\Administrator\Desktop\VisionMate\public\logo.png"
$dstPath = "c:\Users\Administrator\Desktop\VisionMate\public\favicon.png"

$fs = New-Object System.IO.FileStream($srcPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
$img = [System.Drawing.Image]::FromStream($fs)
$fs.Close()

$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $img.Width, $img.Height)
$g.SetClip($path)

$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

$bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$path.Dispose()
$bmp.Dispose()
$img.Dispose()
