Add-Type -AssemblyName System.Drawing

# Create 192x192 icon
$bitmap192 = New-Object System.Drawing.Bitmap(192, 192)
$graphics192 = [System.Drawing.Graphics]::FromImage($bitmap192)
$graphics192.Clear([System.Drawing.Color]::FromArgb(59, 130, 246))

# Add a simple circle
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics192.FillEllipse($brush, 48, 48, 96, 96)

# Save
$bitmap192.Save("c:\Users\USer\OneDrive\Tangtao\frontend\public\icon-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create 512x512 icon
$bitmap512 = New-Object System.Drawing.Bitmap(512, 512)
$graphics512 = [System.Drawing.Graphics]::FromImage($bitmap512)
$graphics512.Clear([System.Drawing.Color]::FromArgb(59, 130, 246))

# Add a simple circle
$graphics512.FillEllipse($brush, 128, 128, 256, 256)

# Save
$bitmap512.Save("c:\Users\USer\OneDrive\Tangtao\frontend\public\icon-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics192.Dispose()
$graphics512.Dispose()
$bitmap192.Dispose()
$bitmap512.Dispose()
$brush.Dispose()

Write-Host "Icons created successfully!"
