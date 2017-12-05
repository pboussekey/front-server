var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process');


if( fs.existsSync(rootPath+'/tmp/lib.js') ){
    console.log('Minify + SourceMaps lib.js...');
    child_process.execSync('npx uglifyjs '+rootPath+'/tmp/lib.js --source-map -o '+rootPath+'/tmp/lib.min.js' );
}
if( fs.existsSync(rootPath+'/tmp/app.js') ){
    console.log('Minify + SourceMaps app.js...');
    child_process.execSync('npx uglifyjs '+rootPath+'/tmp/app.js --source-map -o '+rootPath+'/tmp/app.min.js' );
}
