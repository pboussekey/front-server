angular.module('community',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.community',{
                url:'/community/:category',
                controller:'community_controller as ctrl',
                templateUrl:'app/components/community/tpl/main.html'
                /*onEnter : ['global_search',function(global_search){
                    global_search.hide = true;
                }],
                onExit : ['global_search',function(global_search){
                    global_search.hide = false;
                }]*/
            });
        }
    ]);

ANGULAR_MODULES.push('community');
