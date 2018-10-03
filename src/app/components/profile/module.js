angular.module('profile',['ui.router','API','EVENTS'])
    .config(['$stateProvider', function( $stateProvider ){
            $stateProvider.state('lms.profile', {
                url: '/profile/:id',
                templateUrl: '/app/components/profile/tpl/main.html',
                redirectTo : "lms.profile.tags",
                parent_state : 'lms.community',
                resolve: {
                    user: ['$stateParams','user_model',function($stateParams, user_model){
                        return user_model.get([$stateParams.id]).then(function(){
                            return user_model.list[$stateParams.id];
                        });
                    }]
                },
                controller: 'profile_controller as ctrl',
                global_loading : ['ctrl_loaded']
            })
            .state("lms.profile.tags", {
                url : "/resume",
                templateUrl: '/app/components/profile/tpl/tags.html',
                nested : 'lms.profile',
                controller: "tags_controller as tctrl",
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            })
            .state("lms.profile.connections", {
                url : "/connections",
                templateUrl: '/app/components/profile/tpl/connections.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            })
            .state("lms.profile.activities", {
                url : "/activities",
                templateUrl: '/app/components/profile/tpl/activities.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            }).state("lms.profile.courses", {
                url : "/courses",
                templateUrl: '/app/components/profile/tpl/courses.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            }).state("lms.profile.events", {
                url : "/events",
                templateUrl: '/app/components/profile/tpl/events.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            }).state("lms.profile.pages", {
                url : "/clubs",
                templateUrl: '/app/components/profile/tpl/pages.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            }).state("lms.profile.resources", {
                url : "/pictures",
                templateUrl: '/app/components/profile/tpl/resources.html',
                nested : 'lms.profile',
                parent_state : 'lms.community',
                global_loading : ['ctrl_loaded']
            });

        }
    ]);

ANGULAR_MODULES.push('profile');
