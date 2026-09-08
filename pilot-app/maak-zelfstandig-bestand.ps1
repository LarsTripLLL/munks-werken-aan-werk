$ErrorActionPreference = 'Stop'

$appMap = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Get-Content -LiteralPath (Join-Path $appMap 'index.html') -Raw -Encoding UTF8
$css = Get-Content -LiteralPath (Join-Path $appMap 'styles.css') -Raw -Encoding UTF8
$javascript = Get-Content -LiteralPath (Join-Path $appMap 'app.js') -Raw -Encoding UTF8
$logoPad = Join-Path $appMap 'assets\Munks-Werkt-logo.png'
$logoBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($logoPad))
$bergPad = Join-Path $appMap 'assets\Munks-Werkt-bergachtergrond.png'
$bergBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($bergPad))
$privacyPad = Join-Path $appMap 'assets\Munks-Werkt-privacyverklaring.html'
$privacyBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($privacyPad))
$toestemmingPad = Join-Path $appMap 'assets\Munks-Werkt-toestemming-concept.html'
$toestemmingBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($toestemmingPad))

$html = $html.Replace('<link rel="stylesheet" href="styles.css">', "<style>`r`n$css`r`n</style>")
$html = $html.Replace('assets/Munks-Werkt-logo.png', "data:image/png;base64,$logoBase64")
$javascript = $javascript.Replace('assets/Munks-Werkt-bergachtergrond.png', "data:image/png;base64,$bergBase64")
$javascript = $javascript.Replace('assets/Munks-Werkt-privacyverklaring.html', "data:text/html;base64,$privacyBase64")
$javascript = $javascript.Replace('assets/Munks-Werkt-toestemming-concept.html', "data:text/html;base64,$toestemmingBase64")
$html = $html.Replace('<script src="app.js"></script>', "<script>`r`n$javascript`r`n</script>")

$uitvoer = Join-Path $appMap 'Munks-Werkt-pilot-accountroute-zelfstandig.html'
[IO.File]::WriteAllText($uitvoer, $html, [Text.UTF8Encoding]::new($false))
Write-Output $uitvoer
