angular.module('courses').controller('courses_controller',
    ["courses", "page_model",function(courses, page_model){
        var ctrl = this;
        document.title = 'TWIC - My Courses';
        ctrl.courses = courses;
        ctrl.page_model = page_model;
    }
]);
