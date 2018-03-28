angular.module('page',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider){
            $stateProvider.state('lms.page', {
                url: '/page/:type/:id',
                templateUrl: '/app/components/page/tpl/main.html',
                redirectTo : "lms.page.timeline",
                resolve: {
                    page: ['$stateParams','page_model',function($stateParams, page_model){
                        return page_model.get([$stateParams.id], true).then(function(){
                            return page_model.list[$stateParams.id];
                        });
                    }],
                    parents: ['page', 'pages_constants','pparent_model',function(page, pages_constants, pparent_model){
                        if(page.datum.type === pages_constants.pageTypes.ORGANIZATION){
                            return pparent_model.queue([page.datum.id]).then(function(){
                                return pparent_model.list[page.datum.id].datum;
                            });
                        }
                        else{
                            return [];
                        }
                    }],
                    children: ['page', 'pages_constants', 'pchildren_model',function(page, pages_constants, pchildren_model){
                        if(page.datum.type === pages_constants.pageTypes.ORGANIZATION){
                            return pchildren_model.queue([page.datum.id]).then(function(){
                                return pchildren_model.list[page.datum.id].datum;
                            });
                        }
                        else{
                            return [];
                        }
                    }],
                    conversation: ['$stateParams','page_model', 'cvn_model',
                        function($stateParams, page_model, conversation_model){
                            return page_model.queue([$stateParams.id], true).then(function(){
                                if(page_model.list[$stateParams.id].datum.conversation_id){
                                    return conversation_model.queue([page_model.list[$stateParams.id].datum.conversation_id])
                                    .then(function(){
                                        return conversation_model.list[page_model.list[$stateParams.id].datum.conversation_id];
                                    });
                                }
                                else{
                                    return null;
                                }

                            });
                    }],
                    users : ['$stateParams','page_users', 'user_model',function($stateParams, page_users, user_model){
                        return page_users.load($stateParams.id, true).then(function(){
                            var users = page_users.pages[$stateParams.id];
                            user_model.queue(users.members.concat(users.administrators).slice(0,12).concat(users.pinned));
                            return users;
                        });
                    }],
                    followers : ['page','children', 'pages_constants', '$stateParams','community_service', function(page, children, pages_constants, $stateParams, community){
                        if(page.datum.type === pages_constants.pageTypes.ORGANIZATION && children.length){
                            return community.subscriptions($stateParams.id, 1, 24).then(function(r){
                                return r;
                            });
                        }
                        else{
                            return { count : 0, list : [] };
                        }
                    }]
                },
                controller: 'page_controller as PageCtrl'
            })
            .state("lms.page.timeline", {
                url : "/timeline",
                templateUrl: '/app/components/page/tpl/timeline.html',
                nested : 'lms.page'
            })
            .state("lms.page.users", {
                templateUrl: '/app/components/page/tpl/users.html',
                redirectTo : 'lms.page.users.all',
                nested : 'lms.page'
            })
            .state("lms.page.users.all", {
                url : "/everyone",
                templateUrl: '/app/components/page/tpl/all.html',
                nested : 'lms.page'
            })
            .state("lms.page.users.admin", {
                url : "/administrators",
                templateUrl: '/app/components/page/tpl/administrators.html',
                nested : 'lms.page'
            }).state("lms.page.users.attendees", {
                url : "/attendees",
                templateUrl: '/app/components/page/tpl/attendees.html',
                nested : 'lms.page'
            }).state("lms.page.events", {
                url : "/events",
                templateUrl: '/app/components/page/tpl/events.html',
                nested : 'lms.page'
            }).state("lms.page.resources", {
                url : "/resources",
                templateUrl: '/app/components/page/tpl/resources.html',
                nested : 'lms.page'
            }).state('lms.page.members', {
                url : "/members",
                templateUrl: '/app/components/page/tpl/members.html',
                nested : 'lms.page'
            }).state('lms.page.community', {
                url : "/community",
                templateUrl: '/app/components/page/tpl/community.html',
                nested : 'lms.page'
            }).state('lms.page.membership', {
                url : "/membership",
                templateUrl: '/app/components/page/tpl/membership.html',
                nested : 'lms.page'
            }).state('lms.page.content', {
                url : "/content/:item_id",
                templateUrl: '/app/components/page/tpl/course_content.html',
                controller: 'course_content_controller as ctrl',
                nested : 'lms.page'
            }).state('lms.page.grades', {
                url : "/grades",
                templateUrl: '/app/components/page/tpl/organization_grades.html',
                controller: 'organization_grades_controller as ctrl',
                nested : 'lms.page',
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
                nested : 'lms.page'
            }).state('lms.page.custom', {
                url : "/custom",
                templateUrl: '/app/components/page/tpl/custom.html',
                nested : 'lms.page'
            });
        }
    ]).run([
        function(){



        }
    ]);

ANGULAR_MODULES.push('page');
