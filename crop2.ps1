Add-Type -AssemblyName System.Drawing
$path = "c:\Users\Administrator\Desktop\VisionMate\public\logo.png"
$tempPath = "c:\Users\Administrator\Desktop\VisionMate\public\logo_temp.png"
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$brush = New-Object System.Drawing.TextureBrush($img)
$g.FillEllipse($brush, 0, 0, $img.Width, $img.Height)
$g.Dispose()
$brush.Dispose()
$img.Dispose()
$bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Move-Item -Path $tempPath -Destination $path -Force
