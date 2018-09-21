angular.module('profile',['ui.router','API','EVENTS'])
    .config(['$stateProvider', function( $stateProvider ){
            $stateProvider.state('lms.profile', {
                url: '/profile/:id',
                templateUrl: '/app/components/profile/tpl/main.html',
                redirectTo : "lms.profile.tags",
                resolve: {
                    user: ['$stateParams','user_model',function($stateParams, user_model){
                        return user_model.get([$stateParams.id], true).then(function(){
                            return user_model.list[$stateParams.id];
                        });
                    }],
                    pages: ['$stateParams','page_model', 'ugm_model',function($stateParams, page_model, ugm_model){
                        return ugm_model.queue([$stateParams.id]).then(function(){
                            return page_model.queue(ugm_model.list[$stateParams.id].datum).then(function(){
                                return ugm_model.list[$stateParams.id].datum;
                            });
                        });
                    }],
                    events: ['$stateParams','page_model', 'uem_model',function($stateParams, page_model, uem_model){
                        return uem_model.queue([$stateParams.id]).then(function(){
                            return page_model.queue(uem_model.list[$stateParams.id].datum).then(function(){
                                return uem_model.list[$stateParams.id].datum;
                            });
                        });
                    }],
                    school : ['$stateParams','user_model','page_model',function($stateParams, user_model, page_model){
                         return user_model.queue([$stateParams.id]).then(function(){
                             if(!user_model.list[$stateParams.id].datum.organization_id){
                                return null;
                            }
                            else{
                                return page_model.queue([user_model.list[$stateParams.id].datum.organization_id]).then(function(){
                                    return page_model.list[user_model.list[$stateParams.id].datum.organization_id];
                                });
                            }
                        });
                    }],
                    user_connections : ['$stateParams','connection_model', 'user_model',
                        function($stateParams, connection_model, user_model){
                        return connection_model.queue([$stateParams.id]).then(function(){
                            user_model.queue(connection_model.list[$stateParams.id].datum);
                            return connection_model.list[$stateParams.id].datum;
                        });
                    }]
                },
                controller: 'profile_controller as ctrl'
            })
            .state("lms.profile.tags", {
                url : "/resume",
                templateUrl: '/app/components/profile/tpl/tags.html',
                nested : 'lms.profile',
                controller: "tags_controller as tctrl"
            })
            .state("lms.profile.connections", {
                url : "/connections",
                templateUrl: '/app/components/profile/tpl/connections.html',
                nested : 'lms.profile'
            })
            .state("lms.profile.activities", {
                url : "/activities",
                templateUrl: '/app/components/profile/tpl/activities.html',
                nested : 'lms.profile'
            }).state("lms.profile.courses", {
                url : "/courses",
                templateUrl: '/app/components/profile/tpl/courses.html',
                nested : 'lms.profile'
            }).state("lms.profile.events", {
                url : "/events",
                templateUrl: '/app/components/profile/tpl/events.html',
                nested : 'lms.profile'
            }).state("lms.profile.pages", {
                url : "/clubs",
                templateUrl: '/app/components/profile/tpl/pages.html',
                nested : 'lms.profile'
            }).state("lms.profile.resources", {
                url : "/pictures",
                templateUrl: '/app/components/profile/tpl/resources.html',
                nested : 'lms.profile'
            });

        }
    ]);

ANGULAR_MODULES.push('profile');
