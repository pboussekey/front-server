
angular.module('customElements')
    .directive('summaryBox',['user_model', 'page_model', 'session','user_courses',
        'user_events','user_groups','connections','page_modal_service','oadmin_model',
        function( user_model, page_model, session, user_courses, user_events,
            user_groups, connections, page_modal_service, oadmin_model ){

            return {
                restrict:'E',
                scope:{

                },
                link: function( scope ){
                    var loadingStep = 6;

                    scope.loading = true;
                    scope.pages = page_model.list;

                    // Get user & school data
                    user_model.queue([session.id]).then(function(){
                        scope.user = user_model.list[session.id];
                        if( user_model.list[session.id].datum.organization_id){
                            loadingStep++;
                            page_model.queue([user_model.list[session.id].datum.organization_id]).finally(load);
                        }
                        load();
                    }, load);
                    // Load user pages.
                    user_events.load().then(function(){
                        scope.user_events = user_events;
                        load();
                    }, load);
                    user_groups.load().then(function(){
                        scope.user_groups = user_groups;
                        load();
                    }, load);
                    user_courses.load().then(function(){
                        scope.user_courses = user_courses;
                        load();
                    }, load);
                    // Load user connections.
                    connections.load().then(function(){
                        scope.connections = connections;
                        load();
                    }, load );

                    oadmin_model.queue([session.id]).then(function(){
                        console.log('OADMIN?', oadmin_model.list[session.id].datum );
                        load();
                    });

                    // Expose adding page method.
                    scope.openPageModal = function($event, type ){
                        page_modal_service.open( $event, type );
                    };
                    // Expose course rights checker
                    scope.canCreateCourse = function(){
                        return session.id && ( session.roles[1] || oadmin_model.list[session.id].datum.length );
                    }

                    function load(){
                        loadingStep--;
                        if( !loadingStep ){
                            scope.loading = false;
                        }
                    }
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/summary_box/summary_box.html'
            };
        }
    ]);
