angular.module('page').controller('item_panel_submissions_controller',
    [ '$scope','items_model', 'item_submission_model', 'user_model', '$q',
        'courseConfiguration','filters_functions', 'social_service',
        function( $scope, items_model, item_submission_model, user_model, $q,
            courseConfiguration, filters_functions, social_service ){

            var ctrl = this;

            // --- OPTIONS --- //
            var types = courseConfiguration.typeOptions;
            ctrl.view = 'list';
            ctrl.submission_order = { field : "group_name", reverse : false };
            ctrl.users = user_model.list;

            // --- Expose methods --- //
            // Return icon class depending on item 'type'.
            ctrl.itemIconClass = function(){ return types[ ctrl.item.datum.type ].sm_icon; };
            // Return label depending on item 'type'.
            ctrl.getTypeLabel = function(){ return types[ ctrl.item.datum.type ].name; };
            // Select order field
            ctrl.selectOrder = function(field){
                if(ctrl.submission_order.field !== field){
                    ctrl.submission_order = { field : field, reverse : false }
                }
                else{
                    ctrl.submission_order.reverse = !ctrl.submission_order.reverse;
                }
            };
            // Go to detail submission view.
            ctrl.goToDetail = function( submission ){
                ctrl.view = 'detail';
                ctrl.submission = submission;
            };
            // Publish item grades & comments
            ctrl.publishGrades = function(){
                items_model.publish_grades( ctrl.item.datum.id, !ctrl.item.datum.is_grade_published);
            };

            // --- SETTING SCOPE REFERENCES --- //
            $scope.onChange = load;

            // LOAD
            load();

            // LOADING COMPONENT.
            function load( id ){
                var id = id || $scope.itemId,
                    openStep = 2;

                ctrl.view = 'list';
                ctrl.item = undefined;
                ctrl.loading = true;

                // Get item
                items_model.get([id]).then(function(){
                    ctrl.item = items_model.list[id];
                    loaded();
                });


                // Open conversation
                ctrl.openChat = function( user_ids ){
                    social_service.openConversation( undefined, angular.copy(user_ids) );
                };

                // Get submissions for item
                item_submission_model.get([id], true).then(function(){
                    ctrl.submissions = item_submission_model.list[id];

                    var users = [];
                    if( ctrl.submissions.datum && ctrl.submissions.datum.length ){
                        ctrl.submissions.datum.forEach(function( sbm ){
                            sbm.users.forEach(function( user_id ){
                                if( users.indexOf(user_id) === -1 ){
                                    users.push( user_id );
                                }
                            });
                        });
                        user_model.queue(users).then(function(){
                            if(ctrl.item.datum.participants !== 'group'){
                                ctrl.submissions.datum.forEach(function(sbm){
                                        var user = sbm.users[0];
                                        sbm.group_name = filters_functions.username(ctrl.users[user].datum, false, true);
                                });
                            }
                        }).then(loaded);
                    }else{
                        loaded();
                    }
                });

                function loaded(){
                    openStep--;
                    if( !openStep ){
                        ctrl.loading = false;
                    }
                }
            }

        }
    ]
);
