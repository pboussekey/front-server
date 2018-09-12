angular.module('dashboard',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.dashboard',{
                url:'/dashboard',
                controller:'dashboard_controller as ctrl',
                templateUrl:'app/components/dashboard/tpl/main.html'
            });
        }
    ]);

ANGULAR_MODULES.push('dashboard');
