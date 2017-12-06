
var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process'),
    argv = process.argv.slice(2);

// PARSE CMD ARGUMENTS
let haveToMinify = argv.includes('--minify');
if( haveToMinify ){
    argv.splice( argv.indexOf('--minify'), 1);
}

// MOVE FILE TO SRC ...
fs.copyFileSync( rootPath+'/tmp/configuration.js', rootPath+'/src/configuration.js' );
fs.copyFileSync( rootPath+'/tmp/index.html', rootPath+'/src/index.html' );
fs.copyFileSync( rootPath+'/tmp/'+(haveToMinify?'main.min.css':'main.css'), rootPath+'/src/main.css' );

if( haveToMinify ){
    fs.copyFileSync( rootPath+'/tmp/lib.min.js', rootPath+'/src/lib.js' );
    fs.copyFileSync( rootPath+'/tmp/app.min.js', rootPath+'/src/app.js' );
    fs.copyFileSync( rootPath+'/tmp/lib.min.js.map', rootPath+'/src/lib.js.map' );
    fs.copyFileSync( rootPath+'/tmp/app.min.js.map', rootPath+'/src/app.js.map' );
}else{
    fs.copyFileSync( rootPath+'/tmp/lib.js', rootPath+'/src/lib.js' );
    fs.copyFileSync( rootPath+'/tmp/app.js', rootPath+'/src/app.js' );
}

console.log('App files deployed...');
