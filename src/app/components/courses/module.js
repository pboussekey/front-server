angular.module('courses',['ui.router','API','EVENTS'])
    .config(['$stateProvider', function( $stateProvider ){
            $stateProvider.state('lms.courses', {
                url: '/courses/',
                templateUrl: '/app/components/courses/tpl/main.html',
                resolve: {
                    courses: ['$stateParams', 'user_courses',function($stateParams, user_courses){
                        return user_courses.load([$stateParams.id], true).then(function(){
                            return user_courses.memberof;
                        });
                    }]
                },
                controller: 'courses_controller as CoursesCtrl'
            });
            
        }
    ]);
    
ANGULAR_MODULES.push('courses');