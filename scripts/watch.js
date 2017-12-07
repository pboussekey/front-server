var fs = require('fs'),
    rootPath = process.env.PWD,
    child_process = require('child_process'),
    watchRecursivly = require('watch-recursivly'),
    argv = process.argv.slice(2),
    pkg = require( rootPath+'/package.json' ),
    env_files = [];

// PARSE CMD ARGUMENTS
let haveToMinify = argv.includes('--minify');
if( haveToMinify ){
    argv.splice( argv.indexOf('--minify'), 1);
}
let build_config_args = '';
argv.some( arg => {
    if( arg.slice(0,6) === '--env=' ){
        build_config_args = ' '+arg.slice(6).replace(/,/g,' ');
        Array.prototype.push.apply( env_files, arg.slice(6).split(',') );
    }
});

// DEFINE COMMANDS
let deploy_cmd = 'node '+rootPath+'/scripts/deploy.js'+(haveToMinify?' --minify':''),
    watch_conf_cmd = 'node '+rootPath+'/scripts/build_config.js'+build_config_args+' && '+deploy_cmd,
    watch_html_cmd = 'node '+rootPath+'/scripts/build_index.js'+build_config_args+' && '+deploy_cmd,
    watch_libjs_cmd = 'node '+rootPath+'/scripts/build_libraries.js && '+deploy_cmd,
    watch_appjs_cmd = 'node '+rootPath+'/scripts/build_app.js && '+deploy_cmd,
    watch_style_cmd = 'node '+rootPath+'/scripts/build_styles.js && '+deploy_cmd;

// BEFORE WATCHING => BUILD APP ONE TIME.
console.log( 'node '+rootPath+'/scripts/build.js '+argv.join(' ') );
console.log( child_process.execSync( 'node '+rootPath+'/scripts/build.js '+argv.join(' ')) + '' );

// WATCH CONFIGURATION BASE.
fs.watchFile( rootPath+'/src/config.js', buildConfiguration );
// WATCH CURRENT ENV FILES.
watchRecursivly( rootPath+'/envs', {recursive:true}, function( evt, name ){
    if( env_files.includes( name.slice(-3) ) || name === 'default.js' ){
        buildConfiguration();
    }
});
// WATCH APP.HTML
fs.watchFile( rootPath+'/src/app.html', buildIndex );
// WATCH CSS FILES
watchRecursivly( rootPath+'/src/assets/less',{recursive:true}, buildStyle );
// WATCH LESS FILES
watchRecursivly( rootPath+'/src/assets/css',{recursive:true}, buildStyle );
// WATCH JS APP FILES
watchRecursivly( rootPath+'/src/app',{recursive:true}, function( evt, name ){
    console.log('name', name, name.slice(-3) );
    if( name.slice(-3) === '.js' ){
        buildAppJs();
    }
});
// WATCH PACKAGE.JSON TO CHECK NEW DEPENDENCIES OR DEP. OPTIONS CHANGES.
var dependencies = JSON.stringify(pkg.dependencies),
    options = JSON.stringify(pkg['dependencies-build-options']),
    style_options = JSON.stringify(pkg['imported_styles']);

fs.watchFile( rootPath+'/package.json', function(){
    try{
        let cpkg = JSON.parse( fs.readFileSync(rootPath+'/package.json')+'' ),
            dep = JSON.stringify(cpkg.dependencies),
            opt = JSON.stringify(cpkg['dependencies-build-options']),
            s_opt = JSON.stringify(cpkg['imported_styles']);

        if( dep !== dependencies || opt !== options ){
            dependencies = dep;
            options = opt;
            buildLibJs();
        }
        if( s_opt !== style_options ){
            style_options = s_opt;
            buildStyle();
        }
    }catch( e ){
        console.log('Error parsing package.json', e);
    }
});

var buildingConfiguration = false, hasToConfigure = false;
function buildConfiguration(){
    if( !buildingConfiguration ){
        buildingConfiguration = Date.now();
        child_process.exec( watch_conf_cmd , function( err, stdout ){
            console.log( stdout );
            buildingConfiguration = false;
            if( hasToConfigure ){
                hasToConfigure = false;
                buildConfiguration();
            }
        });
    }else if( buildingConfiguration !== Date.now() ){
        hasToConfigure = true;
    }
}

var buildingIndex = false, hasToIndex = false;
function buildIndex(){
    if( !buildingIndex ){
        buildingIndex = Date.now();
        child_process.exec( watch_html_cmd, function( err, stdout ){
            console.log( stdout );
            buildingIndex = false;
            if( hasToIndex ){
                hasToIndex = false;
                buildIndex();
            }
        });
    }else if( buildingIndex !== Date.now() ){
        hasToIndex = true;
    }
}

var buildingStyle = false, hasToStyle = false;
function buildStyle(){
    if( !buildingStyle ){
        buildingStyle = Date.now();
        child_process.exec( watch_style_cmd, function( err, stdout ){
            console.log( stdout );
            buildingStyle = false;
            if( hasToStyle ){
                hasToStyle = false;
                buildStyle();
            }
        });
    }else if( buildingStyle !== Date.now() ){
        hasToStyle = true;
    }
}

var buildingAppJs = false, hasToAppJs = false;
function buildAppJs(){
    if( !buildingAppJs ){
        buildingAppJs = Date.now();
        child_process.exec( watch_appjs_cmd, function( err, stdout ){
            console.log( stdout );
            buildingAppJs = false;
            if( hasToAppJs ){
                hasToAppJs = false;
                buildAppJs();
            }
        });
    }else if( buildingAppJs !== Date.now() ){
        hasToAppJs = true;
    }
}

function buildLibJs(){
    child_process.exec( watch_libjs_cmd, function( err, stdout ){console.log( stdout );});
}
