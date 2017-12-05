var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process'),
    argv = process.argv.slice(2),
    cmd_options = { cwd: rootPath };

// PARSE CMD ARGUMENTS
let haveToMinify = argv.includes('--minify');
if( haveToMinify ){
    argv.splice( argv.indexOf('--minify'), 1);
}
let build_config_args = '';
argv.some( arg => {
    if( arg.slice(0,6) === '--env=' ){
        build_config_args = ' '+arg.slice(6).replace(/,/g,' ');
    }
});
// BUILD CONFIGURATION.
console.log(''+child_process.execSync('node '+rootPath+'/scripts/build_config.js'+build_config_args) );
// BUILD STYLES.
console.log(''+child_process.execSync('node '+rootPath+'/scripts/build_styles.js') );
// BUILD JS LIB FILE.
console.log(''+child_process.execSync('node '+rootPath+'/scripts/build_libraries.js') );
// BUILD JS APP FILE.
console.log(''+child_process.execSync('node '+rootPath+'/scripts/build_app.js') );
// BUILD INDEX HTML FILE.
console.log(''+child_process.execSync('node '+rootPath+'/scripts/build_index.js') );

if( haveToMinify ){
    // MINIFY JS FILES
    console.log(''+child_process.execSync('node '+rootPath+'/scripts/minifyjs.js') );
    // MINIFY CSS FILES
    console.log(''+child_process.execSync('node '+rootPath+'/scripts/minifycss.js') );
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
