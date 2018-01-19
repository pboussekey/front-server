
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
copyFileSync( rootPath+'/tmp/configuration.js', rootPath+'/src/configuration.js' );
copyFileSync( rootPath+'/tmp/index.html', rootPath+'/src/index.html' );
copyFileSync( rootPath+'/tmp/'+(haveToMinify?'main.min.css':'main.css'), rootPath+'/src/main.css' );

if( haveToMinify ){
    copyFileSync( rootPath+'/tmp/lib.min.js', rootPath+'/src/lib.js' );
    copyFileSync( rootPath+'/tmp/app.min.js', rootPath+'/src/app.js' );
    copyFileSync( rootPath+'/tmp/lib.min.js.map', rootPath+'/src/lib.js.map' );
    copyFileSync( rootPath+'/tmp/app.min.js.map', rootPath+'/src/app.js.map' );
}else{
    copyFileSync( rootPath+'/tmp/lib.js', rootPath+'/src/lib.js' );
    copyFileSync( rootPath+'/tmp/app.js', rootPath+'/src/app.js' );
}

function copyFileSync( p1, p2 ){
    let output = fs.openSync( p2,'w');
    fs.appendFileSync( output, fs.readFileSync(p1) );
}

console.log('App files deployed...'+(haveToMinify?'(Minified)':'') );
