$ErrorActionPreference = 'Stop'
$sdkVersion = '10.0.26100.0'
$sdk = Join-Path ${env:ProgramFiles(x86)} "Windows Kits/10/Include/$sdkVersion"
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$installations = @(& $vswhere -all -products '*' -format json | ConvertFrom-Json)
$os = Get-CimInstance Win32_OperatingSystem
$registry = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
$volume = Get-Volume -DriveLetter (Get-Location).Drive.Name
$nativeArm = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString() -eq 'Arm64'
$vsVersion = if ($nativeArm) { '17.14.37614.0' } else { '18.9.12112.369' }
$targetArchitecture = if ($nativeArm) { 'arm64' } else { 'x64' }
$hostArchitecture = if ($nativeArm) { 'Hostarm64' } else { 'Hostx64' }
$vs = $installations | Where-Object { $_.installationVersion -eq $vsVersion } | Select-Object -First 1
$metadata = [ordered]@{
  imageVersion = $env:ImageVersion; imageOS = $env:ImageOS
  architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
  caption = $os.Caption; version = $os.Version; build = $os.BuildNumber
  ubr = $registry.UBR; displayVersion = $registry.DisplayVersion
  filesystem = $volume.FileSystemType.ToString()
  visualStudio = @($installations | Select-Object installationVersion, installationPath)
  sdkVersion = $sdkVersion; msvcVersion = '14.44.35207'; targetArchitecture = $targetArchitecture
}
New-Item -ItemType Directory -Force windows-preflight | Out-Null
$metadata | ConvertTo-Json -Depth 5 | Tee-Object -FilePath windows-preflight/environment.json
if (!$vs) { throw 'Approved Visual Studio installation missing' }
$compiler = Join-Path $vs.installationPath "VC/Tools/MSVC/14.44.35207/bin/$hostArchitecture/$targetArchitecture/cl.exe"
if (!(Test-Path $compiler)) { throw 'Approved native target compiler missing' }
$metadata.visualStudioPath = $vs.installationPath
$metadata.compiler = $compiler
$metadata.compilerFileVersion = (Get-Item $compiler).VersionInfo.FileVersion
$metadata.compilerSHA256 = (Get-FileHash $compiler -Algorithm SHA256).Hash.ToLowerInvariant()
$metadata.headers = @()
foreach ($relative in @('um/winternl.h', 'um/WinBase.h', 'um/fileapi.h')) {
  $header = Join-Path $sdk $relative
  if (!(Test-Path $header)) { throw "Missing SDK header $header" }
  $metadata.headers += @{ path = $relative; sha256 = (Get-FileHash $header -Algorithm SHA256).Hash.ToLowerInvariant() }
  $lines = Get-Content $header
  $patterns = 'NtCreateFile|NtSetInformationFile|_OBJECT_ATTRIBUTES|_FILE_RENAME_INFO|_FILE_DISPOSITION_INFO|_FILE_ID_INFO|FILE_OPEN_REPARSE_POINT|FILE_SYNCHRONOUS_IO_NONALERT|FILE_OPEN_IF|FileRenameInformation|FILE_RENAME_FLAG|FileRenameInfoEx|GetVolumeInformationByHandleW'
  $matches = Select-String -Path $header -Pattern $patterns
  foreach ($match in $matches) {
    "--- $relative line $($match.LineNumber) ---" | Add-Content windows-preflight/sdk-declarations.txt
    $start = [Math]::Max(0, $match.LineNumber - 2)
    $end = [Math]::Min($lines.Count - 1, $match.LineNumber + 28)
    $lines[$start..$end] | Add-Content windows-preflight/sdk-declarations.txt
  }
}
$metadata | ConvertTo-Json -Depth 5 | Set-Content windows-preflight/environment.json
Get-Content windows-preflight/sdk-declarations.txt
if ($nativeArm) {
  if ($env:ImageVersion -ne '20260823.149.1' -or $metadata.architecture -ne 'Arm64' -or $os.BuildNumber -ne '26200' -or $os.Caption -notmatch 'Windows 11 Enterprise' -or $metadata.filesystem -ne 'NTFS') { throw 'Approved Windows ARM64 runner pin drift; inspection retained, execution stopped' }
} elseif ($env:ImageVersion -notin @('20260818.207.1', '20260824.214.3') -or $env:ImageOS -ne 'win25-vs2026' -or $metadata.architecture -ne 'X64' -or $os.BuildNumber -ne '26100' -or $os.Caption -notmatch 'Server 2025 Datacenter' -or $metadata.filesystem -ne 'NTFS') { throw 'Approved Windows x64 runner pin drift; inspection retained, execution stopped' }
