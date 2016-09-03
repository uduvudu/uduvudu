require('shelljs/global')

mkdir('-p','dist')
exec('browserify src/uduvudu.js -o dist/uduvudu.js')
exec('browserify src/uduvudu-edit.js -o dist/uduvudu-edit.js')
