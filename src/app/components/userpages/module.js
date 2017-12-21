angular.module('userpages',['ui.router','API','EVENTS'])
    .config(['$stateProvider', function( $stateProvider ){
            $stateProvider.state('lms.user_events', {
                url: '/my-events/',
                templateUrl: '/app/components/userpages/tpl/main.html',
                resolve: {
                    pagetype: function(){ return 'event'; },
                    user_pages_service: ['user_events',function( user_events ){
                        return user_events;
                    }]
                },
                controller: 'userpages_controller as ctrl'
            })
            .state('lms.user_groups', {
                url: '/my-groups/',
                templateUrl: '/app/components/userpages/tpl/main.html',
                resolve: {
                    pagetype: function(){ return 'group'; },
                    user_pages_service: ['user_groups',function( user_groups ){
                        return user_groups;
                    }]
                },
                controller: 'userpages_controller as ctrl'
            })
            .state('lms.user_courses', {
                url: '/my-courses/',
                templateUrl: '/app/components/userpages/tpl/main.html',
                resolve: {
                    pagetype: function(){ return 'course'; },
                    user_pages_service: ['user_courses',function( user_courses ){
                        return user_courses;
                    }]
                },
                controller: 'userpages_controller as ctrl'
            });

        }
    ]);

ANGULAR_MODULES.push('userpages');
