var fs = require('fs'),
    opt = 'imported_styles',
    rootPath = process.env.PWD,
    cssPath = rootPath+'/src/assets/css',
    appPath = rootPath+'/src/app',
    child_process = require('child_process'),
    pkg = require( rootPath+'/package.json' ),
    step = 2;

// Create tmp directory if not existing
if( !fs.existsSync( rootPath+'/tmp' ) ){
    fs.mkdirSync(rootPath+'/tmp');
}

buildLess( buildStyle );
buildCss( buildStyle );

function buildStyle(){
    step--;
    if( !step ){
        // Add app.css & lib.css to main.css
        console.log('Append app.css & lib.css => main.css');
        let styleFile = fs.openSync(rootPath+'/tmp/main.css','w');
        fs.appendFileSync( styleFile, Buffer.concat([fs.readFileSync(rootPath+'/tmp/lib.css'),fs.readFileSync(rootPath+'/tmp/app.css')]) );
    }
}
// BUILD LIBRARIES CSS FILE
function buildCss( nextStep ){
    let cssFile = fs.openSync(rootPath+'/tmp/lib.css','w'),
        librariesPaths = [],
        reading = 0;

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
            console.log('lib.css builded !');
            nextStep();
        }
    }
}
// BUILD APP CSS FILE
function buildLess( nextStep ){
    let lessBuildFile = fs.openSync(rootPath+'/tmp/build.less','w'),
        mainLess = (fs.readFileSync(rootPath+'/src/assets/less/main.less')+'').replace( new RegExp('@import "([^"]*)"','g'), '@import "../src/assets/less/$1"' ),
        files = [],
        scaning = 0;

    findLess( appPath, files, next );

    function next(){
        scaning--;
        if( !scaning ){
            files.forEach( function(path){
                mainLess += '\n@import "'+path+'";';
            });
            fs.appendFileSync( lessBuildFile, mainLess );
            // Building App style from LESS files.
            console.log('Building app.css from less files');
            child_process.execSync( 'npx lessc '+rootPath+'/tmp/build.less '+rootPath+'/tmp/app.css' );
            nextStep();
        }
    }

    function findLess( path, lessFiles, next ){
        scaning++;
        fs.stat( path, function( err, stats ){
            if( err ){
                next();
                return;
            }

            if( stats.isDirectory() ){
                fs.readdir( path, function(err, files ){
                    if( err ){
                        next();
                        return;
                    }

                    files.forEach( name => {
                        if( name.slice(-5) === '.less' ){
                            lessFiles.push( path+'/'+name );
                        }else{
                            findLess( path+'/'+name, lessFiles, next );
                        }
                    });

                    next();
                });
            }else{
                next();
            }
        });
    }
}
