var fs = require('fs'),
    opt = 'dependencies-build-options';
    rootPath = process.env.PWD,
    child_process = require('child_process'),
    pkg = require( rootPath+'/package.json' ),
    dependencies = {};

// Build library file.
if( !fs.existsSync( rootPath+'/tmp' ) ){
    fs.mkdirSync(rootPath+'/tmp');
}

console.log('Create lib.js file.');
let libFile = fs.openSync(rootPath+'/tmp/lib.js','w');

if( pkg.dependencies ){
    console.log('Create libraries list.');
    // List app libraries & their dependencies.
    Object.keys( pkg.dependencies ).forEach( name =>{
        let libPkg = require( rootPath+'/node_modules/'+name+'/package.json'),
            srcPath = libPkg.main,
            bowerUsed = false;

        // Declare dependency.
        dependencies[name] = {
            dependingOf: pkg[opt]&&pkg[opt][name]&&pkg[opt][name].dependencies?pkg[opt][name].dependencies:[]
        };

        // Try to get bower.json to have front-end file & avoid to browserify.
        if( fs.existsSync(rootPath+'/node_modules/'+name+'/bower.json') ){
            bowerUsed = true;
            bowerPkg = require( rootPath+'/node_modules/'+name+'/bower.json');

            // Add bower dependencies...
            if( bowerPkg.dependencies ){
                Object.keys( bowerPkg.dependencies ).forEach( key => dependencies[name].dependingOf.push(key) );
            }

            if( typeof bowerPkg.main === 'string' ){
                srcPath = bowerPkg.main;
            }else if( bowerPkg.main ){
                bowerPkg.main.some( filePath => {
                    if( filePath.slice(-3) === '.js' ){
                        srcPath = filePath;
                        return true;
                    }
                });
            }
        }

        srcPath = srcPath.replace(/^\.\//,'');
        if( srcPath.slice(-3) !== '.js' ){
            srcPath = srcPath+'.js';
        }
        dependencies[name].src =  rootPath+'/node_modules/'+name+'/'+srcPath;

        if( libPkg.peerDependencies ){
            Object.keys( libPkg.peerDependencies ).forEach( key => {
                if( !dependencies[name].dependingOf.includes(key) ){
                    dependencies[name].dependingOf.push(key);
                }
            });
        }
        if( libPkg.dependencies ){
            Object.keys( libPkg.dependencies ).forEach( key => {
                if( !dependencies[name].dependingOf.includes(key) ){
                    dependencies[name].dependingOf.push(key);
                }
            });
        }

        console.log( name+' library added'+(bowerUsed?' (Bower)':'')+
            '\n   - src => '+dependencies[name].src +
            (dependencies[name].dependingOf.length?'\n   - dependencies => '+dependencies[name].dependingOf:'')+'\n' );
    });
    // Filter libraries dependencies
    let dependenciesList = Object.keys(dependencies);
    dependenciesList.forEach( key => {
        let i = dependencies[key].dependingOf.length-1;
        for(;i>=0;i--){
            if( !dependenciesList.includes(dependencies[key].dependingOf[i]) ){
                dependencies[key].dependingOf.splice( i, 1 );
            }
        }
    });

    console.log('Order libraries list (depending of their dependencies).');
    // Order libraries.
    let orderedLibraries = [];
    while( dependenciesList.length ){
        let i = originalLength = dependenciesList.length-1;
        for(;i>=0;i--){
            let name = dependenciesList[i],
                j = dependencies[name].dependingOf.length - 1;

            for(;j>=0;j--){
                if( orderedLibraries.includes(dependencies[name].dependingOf[j]) ){
                    dependencies[name].dependingOf.splice(j,1);
                }
            }

            if( !dependencies[name].dependingOf.length ){
                orderedLibraries.push( name );
                dependenciesList.splice(i,1);
            }
        }

        if( originalLength == dependenciesList.length-1 ){
            throw new Error('Cant order dependencies !', dependenciesList );
        }
    }
    // Write files into lib.js
    console.log('Writing libaries in lib.js.\n');
    let tempFiles = [];
    orderedLibraries.forEach( library => {
        let finalPath = dependencies[library].src;
        // Check if content must be browserified.
        if( pkg[opt] && pkg[opt][library] && pkg[opt][library].browserify ){
            let alias = undefined;
            if( typeof pkg[opt][library].browserify === 'object' ){
                alias = pkg[opt][library].browserify.alias;
            }
            console.log('Browserify '+library+'...');
            finalPath = rootPath+'/tmp/'+library+'.js';
            child_process.execSync( 'npx browserify -r '+library+(alias?' -s '+alias:'')+' -o '+finalPath );
            tempFiles.push( finalPath );
        }
        // Check if library must be babelified.
        if( pkg[opt] && pkg[opt][library] && pkg[opt][library].babel ){
            console.log('Babelify '+library+'...');
            let inputPath = finalPath;
            finalPath = rootPath+'/tmp/babeled_'+library+'.js';
            child_process.execSync('npx babel '+inputPath+' --out-file '+finalPath+' --presets=es2015');
            tempFiles.push( finalPath );
        }

        console.log('Append '+library+' to lib.js...\n');
        fs.appendFileSync( libFile, Buffer.concat([fs.readFileSync(finalPath),new Buffer('\n')]) );
    });

    // Deleting browserified files...
    console.log('Deleting building files...');
    tempFiles.forEach( path => fs.unlinkSync(path) );
}

fs.closeSync( libFile );
