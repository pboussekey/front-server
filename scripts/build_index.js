
var fs = require('fs'),
    rootPath = process.env.PWD,
    assign = require('recursive-object-assign'),
    configuration = require(rootPath+'/envs/default.js'),
    env_files = process.argv.slice(2);

env_files.forEach( name => {
    if( fs.existsSync( rootPath+'/envs/'+name+'.js' ) ){
        assign( configuration, require(rootPath+'/envs/'+name+'.js') );
    }else{
        throw new Error('Env with name:'+name+' does not exists !');
    }
});

let indexFile = fs.openSync(rootPath+'/tmp/index.html','w'),
    indexContent = fs.readFileSync(rootPath+'/src/app.html')+'';

// Replace index html KEYS with configuration VALUES.
Object.keys( configuration ).forEach( key => {
    indexContent = indexContent.replace( new RegExp(key,'g') , configuration[key] );
});

fs.appendFileSync( indexFile, new Buffer( indexContent ) );
