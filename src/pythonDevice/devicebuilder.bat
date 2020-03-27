REM Creates a standalone windows executable called winOurProbes.exe
REM from the pythonDevice scripts
cd c:\temp
rmdir /S /Q "C:\temp\pythonDevice"
xcopy /S /I C:\projects\ourProbes\src\pythonDevice c:\temp\pythonDevice
cd pythonDevice
pyinstaller -F -n winOurProbe main.py
copy config.json c:\temp\pythonDevice\dist\config.json
copy roots.pem c:\temp\pythonDevice\dist\roots.pem
cd dist
winOurProbe

