call npm init -y
call npm install @actions/core
call npm install -D @vercel/ncc
call npx ncc build index.js -o dist
pause