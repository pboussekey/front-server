angular.module('MAJ',['WEBSOCKET','SESSION','elements'])
    .run(['maj_service',
        function( maj_service ){
            maj_service.listen();
        }
    ]);
    
ANGULAR_MODULES.push('MAJ');
