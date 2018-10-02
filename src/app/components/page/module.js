angular.module('page',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider){
            $stateProvider.state('lms.page', {
                url: '/page/:type/:id',
                templateUrl: '/app/components/page/tpl/main.html',
                redirectTo : "lms.page.timeline",
                parent_state : 'lms.community',
                global_loading : ['post'],
                resolve: {
                    page: ['$stateParams','page_model',function($stateParams, page_model){
                        return page_model.get([$stateParams.id], true).then(function(){
                            return page_model.list[$stateParams.id];
                        });
                    }]
                },
                controller: 'page_controller as PageCtrl'
            })
            .state("lms.page.timeline", {
                url : "/timeline",
                templateUrl: '/app/components/page/tpl/timeline.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            })
            .state("lms.page.users", {
                templateUrl: '/app/components/page/tpl/users.html',
                controller: 'page_users_controller as ctrl',
                redirectTo : 'lms.page.users.all',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            })
            .state("lms.page.users.all", {
                url : "/everyone",
                templateUrl: '/app/components/page/tpl/all.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            })
            .state("lms.page.users.admin", {
                url : "/administrators",
                templateUrl: '/app/components/page/tpl/administrators.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state("lms.page.users.attendees", {
                url : "/attendees",
                templateUrl: '/app/components/page/tpl/attendees.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state("lms.page.users.alumni", {
                url : "/alumni",
                templateUrl: '/app/components/page/tpl/alumni.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state('lms.page.users.community', {
                url : "/community",
                templateUrl: '/app/components/page/tpl/community.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state("lms.page.events", {
                url : "/events",
                templateUrl: '/app/components/page/tpl/events.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state("lms.page.resources", {
                url : "/resources",
                templateUrl: '/app/components/page/tpl/resources.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state('lms.page.relationship', {
                url : "/relationship",
                templateUrl: '/app/components/page/tpl/relationship.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state('lms.page.content', {
                url : "/content/:item_id",
                templateUrl: '/app/components/page/tpl/course_content.html',
                controller: 'course_content_controller as ctrl',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state('lms.page.grades', {
                url : "/grades",
                templateUrl: '/app/components/page/tpl/organization_grades.html',
                controller: 'organization_grades_controller as ctrl',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post'],
                resolve: {
                    grades: ['$stateParams','orggrades_model',function($stateParams, orggrades_model){
                        return orggrades_model.queue([$stateParams.id]).then(function(){
                            return orggrades_model.list[$stateParams.id].datum;
                        });
                    }]
                }
            }).state('lms.page.analytics', {
                url : "/analytics",
                templateUrl: '/app/components/page/tpl/analytics.html',
                controller: 'organization_analytics_controller as ctrl',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            }).state('lms.page.custom', {
                url : "/custom",
                templateUrl: '/app/components/page/tpl/custom.html',
                nested : 'lms.page',
                parent_state : 'lms.community',
                global_loading : ['post']
            });
        }
    ]).run([
        function(){



        }
    ]);

ANGULAR_MODULES.push('page');
