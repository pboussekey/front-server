var fs = require('fs'),
    rootPath = process.env.PWD,
    appPath = rootPath+'/src/app';
    child_process = require('child_process'),
    js_files = [],
    js_modules = [],
    reading = 0,
    buildID = (''+child_process.execSync('git rev-parse HEAD')).replace(new RegExp('\n','g'),'');


// Build library file.
if( !fs.existsSync( rootPath+'/tmp' ) ){
    fs.mkdirSync(rootPath+'/tmp');
}

console.log('Create app.js file.');
let appFile = fs.openSync(rootPath+'/tmp/app.js','w');

readDir( appPath );

function readDir( path ){
    reading ++;
    fs.stat( path, function( err, stats ){
        if( err ){
            directoryRead();
            return;
        }

        if( stats.isDirectory() ){
            fs.readdir( path, function(err, files ){
                if( err ){
                    directoryRead();
                    return;
                }

                files.forEach( name => {
                    if( name.slice(-3) === '.js' ){
                        if( name.slice( -9 ) === 'module.js' ){
                            js_modules.push( path+'/'+name );
                        }else{
                            js_files.push( path+'/'+name );
                        }
                    }else{
                        readDir( path+'/'+name );
                    }
                });

                directoryRead();
            });
        }else{
            directoryRead();
        }
    });
}

function directoryRead(){
    reading--;
    if( !reading ){
        js_modules.forEach( modulePath => {
            console.log('Writing '+modulePath+' to app.js');
            let txt = fs.readFileSync(modulePath)+'\n';
            fs.appendFileSync( appFile, new Buffer( txt.replace(/('|")\/?(app\/[^."']*\.html)("|')/g,'$1$2?v=' + buildID + '$3') ) );
        });
        // Putting app.js in last position.
        var idx = js_files.indexOf( appPath+'/app.js' );
        js_files.splice( idx, 1 );
        js_files.push( appPath+'/app.js' );
        // Writing files...
        js_files.forEach( filePath => {
            console.log('Writing '+filePath+' to app.js');
            let txt = fs.readFileSync(filePath)+'\n';
            fs.appendFileSync( appFile, new Buffer( txt.replace(/('|")\/?(app\/[^."']*\.html)("|')/g,'$1$2?v=' + buildID + '$3') ) );
        });
        fs.closeSync( appFile );
    }
}
