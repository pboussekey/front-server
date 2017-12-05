var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process');

if( fs.existsSync(rootPath+'/tmp/main.css') ){
    console.log('Minify main.css...');
    child_process.execSync('npx cleancss -01 --debug -o '+rootPath+'/tmp/main.min.css '+rootPath+'/tmp/main.css');
}
