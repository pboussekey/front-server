angular.module('admin',['ui.router','API','EVENTS', 'chart.js'])
    .config(['$stateProvider',
        function( $stateProvider ){
            $stateProvider.state('lms.admin',{
                url:'/admin',
                controller:'admin_controller as ctrl',
                templateUrl:'app/components/admin/tpl/main.html',
                redirectTo : 'lms.admin.activities',
                title : 'TWIC - Administration'
            }).state("lms.admin.mails", {
                url : '/mail',
                templateUrl: '/app/components/admin/tpl/mails.html',
                nested : 'lms.admin'
            }).state("lms.admin.users", {
                url : '/users',
                templateUrl: '/app/components/admin/tpl/users.html',
                nested : 'lms.admin'
            }).state("lms.admin.circles", {
                url : '/circle',
                templateUrl: '/app/components/admin/tpl/circles.html',
                nested : 'lms.admin',
            }).state("lms.admin.activities", {
            	url : '/activities',
            	controller:'activities_controller as ctrl',
            	templateUrl: '/app/components/admin/tpl/activities.html',
                nested : 'lms.admin'
            }).state("lms.admin.analytics", {
                url : '/analytics',
            	controller:'analytics_controller as ctrl',
                templateUrl: '/app/components/admin/tpl/analytics.html',
                nested : 'lms.admin'
            }).state("lms.admin.pages", {
                url : '/pages',
                controller:'pages_controller as ctrl',
                templateUrl: '/app/components/admin/tpl/pages.html',
                nested : 'lms.admin'
            });
        }
    ]).run([
        function(){



        }
    ]);

ANGULAR_MODULES.push('admin');
