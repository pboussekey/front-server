angular.module('community',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.community',{
                url:'/community/:category',
                controller:'community_controller as ctrl',
                templateUrl:'app/components/community/tpl/main.html',
                nested : 'lms.community'
            });
        }
    ]);

ANGULAR_MODULES.push('community');
