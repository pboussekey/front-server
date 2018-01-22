var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process'),
    sourcemap_app_opts = "includeSources,url='app.js.map'",
    sourcemap_lib_opts = "includeSources,url='lib.js.map'";

if( fs.existsSync(rootPath+'/tmp/lib.js') ){
    console.log('Minify + SourceMaps lib.js...');
    child_process.execSync('npx uglifyjs '+rootPath+'/tmp/lib.js --source-map "'+sourcemap_lib_opts+'" -o '+rootPath+'/tmp/lib.min.js' );
}
if( fs.existsSync(rootPath+'/tmp/app.js') ){
    console.log('Minify + SourceMaps app.js...');
    child_process.execSync('npx uglifyjs '+rootPath+'/tmp/app.js --source-map "'+sourcemap_app_opts+'" -o '+rootPath+'/tmp/app.min.js' );
}
