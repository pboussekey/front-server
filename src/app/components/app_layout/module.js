angular.module('app_layout',['ui.router','API','EVENTS','filters'])
    .config(['$stateProvider', function( $stateProvider ){
        $stateProvider.state('lms',{
            controller:'layout_controller as app',
            templateUrl:'app/components/app_layout/tpl/main.html'
        });
    }]);
    
ANGULAR_MODULES.push('app_layout');
