angular.module('dashboard',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.dashboard',{
                url:'/dashboard',
                controller:'dashboard_controller as ctrl',
                templateUrl:'app/components/dashboard/tpl/main.html',
                title : 'Dashboard',
                global_loading : ['post'],
                resolve: {
                    posts: ['feed',function(feed){
                        return feed.get();
                    }]
                }
            }).state('lms.timeline',{
                url:'/todo',
                controller:'dashboard_controller as ctrl',
                templateUrl:'app/components/dashboard/tpl/timeline.html',
                parent_state : 'lms.dashboard'
            });
        }
    ]);

ANGULAR_MODULES.push('dashboard');
