REM Creates a standalone windows executable called winOurProbes.exe
REM from the pythonprobe scripts
cd c:\temp
rmdir /S /Q "C:\temp\pythonprobe"
xcopy /S /I C:\projects\ourProbes\src\pythonprobe c:\temp\pythonprobe
cd pythonprobe
pyinstaller -F -n winOurProbe main.py
copy config.json c:\temp\pythonprobe\dist\config.json
copy roots.pem c:\temp\pythonprobe\dist\roots.pem
cd dist
winOurProbe

