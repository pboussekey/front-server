angular.module('page').controller('organization_grades_controller',
    [ 'users', 'grades', 'user_model', 'pages_grades', 'page', 'user_grades', 'modal_service', 'page_model',
        function(users, grades, user_model, pages_grades, page, user_grades, modal_service, page_model){
            var ctrl = this;
            ctrl.users = users.members;
            ctrl.org_grades = grades;
            ctrl.users = user_model.list;
            ctrl.loading_grades = {};
            ctrl.grades = pages_grades.getPaginator(page.datum.id);
            ctrl.user_grades = user_grades.getModel(page.datum.id);
            window.user_grades = ctrl.user_grades;
            ctrl.grades.get().then(function(){
                user_model.queue(ctrl.grades.list.map(function(g){ return g.user_id; }));
                ctrl.loading = false;
                ctrl.ended = ctrl.grades.count === ctrl.grades.list.length;
                ctrl.grades.page_number++;
            });
            ctrl.next = function(){
                if(ctrl.loading || ctrl.ended){
                    return;
                }
                ctrl.loading = true;
                return ctrl.grades.next().then(function(){
                    user_model.queue(ctrl.grades.list.map(function(g){ return g.user_id; }));
                    ctrl.loading = false;
                    ctrl.ended = ctrl.grades.count === ctrl.grades.list.length;
                    ctrl.grades.page_number++;
                });
            };

            ctrl.openGradesDetails = function($event, user_id){
                if(!ctrl.loading_grades[user_id]){
                    ctrl.loading_grades[user_id] = true;
                    ctrl.user_grades.get([user_id]).then(function(){
                        page_model.queue([ctrl.user_grades.list[user_id].datum.map(function(g){ return g.id; })]).then(function(){
                            ctrl.loading_grades[user_id] = false;
                            modal_service.open({
                                reference: $event.target,
                                scope : {
                                    user : user_id,
                                    grades : ctrl.user_grades.list[user_id].datum,
                                    pages : page_model.list
                                },
                                template:'app/components/page/tpl/grades_modal.html'
                            });
                        }, function(){
                        ctrl.loading_grades[user_id] = false;
                    });
                    }, function(){
                        ctrl.loading_grades[user_id] = false;
                    });
                }
            };



        }
    ]
);
