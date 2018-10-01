angular.module('community',['ui.router','API','EVENTS'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.community',{
                url:'/community',
                templateUrl:'app/components/community/tpl/main.html',
                controller:'community_controller as pctrl',
                nested : 'lms.community',
                title : 'TWIC - Discover',
                redirectTo : 'lms.community.all'
            }).state('lms.community.all',{
                url:'/all',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/all.html',
                nested : 'lms.community',
                title : 'TWIC - Discover',
                resolve: {
                    category: [function(){
                        return 'all';
                    }]
                }
            }).state('lms.community.people',{
                url:'/people',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/category.html',
                nested : 'lms.community',
                title : 'TWIC - Discover people',
                resolve: {
                    category: [function(){
                        return 'people';
                    }]
                }
            }).state('lms.community.clubs',{
                url:'/clubs',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/category.html',
                nested : 'lms.community',
                title : 'TWIC - Discover clubs',
                resolve: {
                    category: [function(){
                        return 'clubs';
                    }]
                }
            }).state('lms.community.events',{
                url:'/events',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/category.html',
                nested : 'lms.community',
                title : 'TWIC - Discover events',
                resolve: {
                    category: [function(){
                        return 'events';
                    }]
                }
            }).state('lms.community.institutions',{
                url:'/institutions',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/category.html',
                nested : 'lms.community',
                title : 'TWIC - Discover institutions',
                resolve: {
                    category: [function(){
                        return 'events';
                    }]
                }
            }).state('lms.community.courses',{
                url:'/courses',
                controller:'category_controller as ctrl',
                templateUrl:'app/components/community/tpl/category.html',
                nested : 'lms.community',
                title : 'TWIC - Discover courses',
                resolve: {
                    category: [function(){
                        return 'courses';
                    }]
                }
            });
        }
    ]);

ANGULAR_MODULES.push('community');
