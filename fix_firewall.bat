@echo off
netsh advfirewall firewall delete rule name=all program="C:\okul\kursumbe\webapi\bin\debug\net10.0\webapi.exe"
netsh advfirewall firewall add rule name="KursumBE_Allow" dir=in action=allow program="C:\okul\kursumbe\webapi\bin\debug\net10.0\webapi.exe" enable=yes
netsh advfirewall firewall add rule name="KursumBE_Port5000" dir=in action=allow protocol=TCP localport=5000 enable=yes
