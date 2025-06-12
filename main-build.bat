rmdir .next /s /q
rmdir dist /s /q
mkdir dist
copy "package.json" "dist/"
copy "build.bat" "dist/"
copy "server.js" "dist/"
copy "web.config" "dist/"
xcopy /i /s public dist\public
npm run build:iis