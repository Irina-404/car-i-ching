@echo off
cd /d "%~dp0"
echo Open http://127.0.0.1:8765 in your browser.
node serve-gallery.cjs
pause
