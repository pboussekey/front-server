var fs = require('fs'),
    opt = 'imported_styles',
    rootPath = process.env.PWD,
    cssPath = rootPath+'/src/assets/css',
    child_process = require('child_process'),
    pkg = require( rootPath+'/package.json' ),
    librariesPaths = [];

// Build library file.
if( !fs.existsSync( rootPath+'/tmp' ) ){
    fs.mkdirSync(rootPath+'/tmp');
}
let cssFile = fs.openSync(rootPath+'/tmp/lib.css','w');

// Add css files from package.json dependencies.
if( pkg[opt] && typeof pkg[opt] === "object" ){
    Object.keys(pkg[opt]).forEach( dependency => {
        let basePath = rootPath+'/node_modules/'+dependency+'/';
        if( Array.isArray(pkg[opt][dependency]) ){
            pkg[opt][dependency].forEach( pathEnd => {
                if( fs.existsSync( basePath+pathEnd ) ){
                    librariesPaths.push( basePath+pathEnd );
                }
            });
        }
    });
}

var reading = 0;
readDir( cssPath );

function readDir( path ){
    reading ++;
    fs.stat( path, function( err, stats ){
        if( err ){
            concatLibraries();
            return;
        }

        if( stats.isDirectory() ){
            fs.readdir( path, function(err, files ){
                if( err ){
                    concatLibraries();
                    return;
                }

                files.forEach( name => {
                    if( name.slice(-4) === '.css' ){
                        librariesPaths.unshift( path+'/'+name );
                    }else{
                        readDir( path+'/'+name );
                    }
                });

                concatLibraries();
            });
        }else{
            concatLibraries();
        }
    });
}

function concatLibraries(){
    reading--;
    if( !reading ){
        // Adding CSS libraries.
        librariesPaths.forEach( path => {
            console.log('Writing '+path+' to lib.css');
            fs.appendFileSync( cssFile, fs.readFileSync(path)+'\n' );
        });
        fs.closeSync( cssFile );
        // Building App style from LESS files.
        console.log('Building app.css from less files');
        child_process.execSync( 'npx lessc '+rootPath+'/src/assets/less/main.less '+rootPath+'/tmp/app.css' );
        // Add app.css to lib.css.
        console.log('Append app.css & lib.css => main.css');
        fs.appendFileSync( rootPath+'/tmp/main.css', Buffer.concat([fs.readFileSync(rootPath+'/tmp/lib.css'),fs.readFileSync(rootPath+'/tmp/app.css')]) );
    }
}
