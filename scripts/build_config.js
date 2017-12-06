
var fs = require('fs'),
    child_process = require('child_process'),
    assign = require('recursive-object-assign'),
    rootPath = process.env.PWD,
    configuration = require( rootPath+'/envs/default.js'),
    env_files = process.argv.slice(2),
    buildID = (''+child_process.execSync('git rev-parse HEAD')).replace(new RegExp('\n','g'),'');

console.log('Building configuration ('+buildID+') from', env_files );

env_files.forEach( name => {
    if( fs.existsSync( rootPath+'/envs/'+name+'.js' ) ){
        assign( configuration, require( rootPath+'/envs/'+name+'.js') );
    }else{
        throw new Error('Env with name:'+name+' does not exists !');
    }
});
// SET BUILD ID IN CONFIGURATION.
assign(configuration,{ BUILD_ID: buildID });

let configContent = fs.readFileSync(rootPath+'/src/config.js')+'';

Object.keys( configuration ).forEach( key => {
    configContent = configContent.replace( new RegExp(key,'g') , JSON.stringify(configuration[key]) );
});

if( !fs.existsSync( rootPath+'/tmp' ) ){
    fs.mkdirSync(rootPath+'/tmp');
}

let finalConfigFile = fs.openSync(rootPath+'/tmp/configuration.js','w');
fs.appendFileSync( finalConfigFile, new Buffer( configContent ) );
