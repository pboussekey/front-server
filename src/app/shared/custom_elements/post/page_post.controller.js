angular.module('customElements').controller('page_post_controller',
    ['$scope','notifier_service','page_model','user_model','session','filters_functions','user_events','user_groups',
        'user_courses', 'user_organizations','pages_constants','$translate',
        function( $scope, notifier_service, page_model, user_model, session, filters_functions, user_events, user_groups,
            user_courses, user_organizations, pages_constants, $translate ){

            var ctrl = this,
                post = $scope.p,
                states = {
                    invited: 'invited',
                    created: 'create',
                    member: 'member'
                };

            this.has_actions = false;
            this.loaded = false;

            var post = $scope.p,
                step = 1,
                canLoad = function(){
                    step--;
                    if( !step ){
                        build();
                    }
                };

            var user_page_state_service,
                pagetype,
                user_new_member_label,
                self_new_member_label;

            if( post.datum.data.type === pages_constants.pageTypes.COURSE ){

                pagetype = 'course';
                user_page_state_service = user_courses;
                user_new_member_label = '#1 is now enrolled in this course.';
                self_new_member_label = 'You are now enrolled in this course.';

            }else if( post.datum.data.type === pages_constants.pageTypes.EVENT ){

                pagetype = 'event';
                user_page_state_service = user_events;
                user_new_member_label = '#1 is going to this event.';
                self_new_member_label = 'You are going to this event.';

            }else if( post.datum.data.type === pages_constants.pageTypes.GROUP ){

                pagetype = 'group';
                user_page_state_service = user_groups;
                user_new_member_label = '#1 joined this group.';
                self_new_member_label = 'You joined this group.';

            }else if( post.datum.data.type === pages_constants.pageTypes.ORGANIZATION ){

                pagetype = 'organization';
                user_page_state_service = user_organizations;
                user_new_member_label = '#1 joined this organization.';
                self_new_member_label = 'You joined this organization.';
            }
            // LOAD USER PAGE STATES.
            user_page_state_service.load().then( canLoad );

            // --- ACTIONS --- \\
            this.cancelPage = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    user_page_state_service.remove( post.datum.data.page ).then(function(){
                        ctrl.requesting = false;
                        build();

                        $translate('ntf.page_unapply').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            this.declinePage = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    user_page_state_service.decline( post.datum.data.page ).then(function(){
                        ctrl.requesting = false;
                        build();

                        $translate('ntf.page_decline').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            this.joinPage = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    user_page_state_service.join( post.datum.data.page ).then(function(){
                        ctrl.requesting = false;
                        build();

                        $translate('ntf.page_join',{pagetype: pagetype } ).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            this.applyPage = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    user_page_state_service.apply( post.datum.data.page ).then(function(){
                        ctrl.requesting = false;
                        build();

                        $translate('ntf.page_apply',{pagetype: pagetype }).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            this.acceptPage = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    user_page_state_service.accept( post.datum.data.page ).then(function(){
                        ctrl.requesting = false;
                        build();

                        $translate('ntf.page_join',{pagetype: pagetype } ).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };
            // Hide post.
            this.hide = function(){
                post_model.hide( id );
            };

            // --- CLEAR PERMISSIONS --- \\
            function clear(){
                ctrl.can_cancel = false;
                ctrl.can_decline = false;
                ctrl.can_join = false;
                ctrl.can_apply = false;
                ctrl.can_accept = false;
            }

            // --- BUILD --- \\
            function build(){

                // IF POST STATE IS INVITED && USER IS ALREADY MEMBER => CHANGE POST STATE.
                if( post.datum.data.state === states.invited
                    && user_page_state_service.getUserState(post.datum.data.page) === user_page_state_service.states.MEMBER ){
                    post.datum.data.state = states.member;
                }

                // IF POST STATE IS 'CREATED'.
                if( post.datum.data.state === states.created ){
                    // SET POST TEXT.
                    if( post.datum.data.user === session.id ){
                        ctrl.text = 'you created';
                    }else if(post, post.datum.data.user){
                        ctrl.text = 'created by '+ filters_functions.username( user_model.list[post.datum.data.user].datum );
                    }
                    // ENABLE ACTIONS.
                    ctrl.has_actions = true;
                    clear();

                    if( page_model.list[post.datum.data.page].datum.admission === 'open'
                        && user_page_state_service.getUserState( post.datum.data.page ) === user_page_state_service.states.NONE ){
                        ctrl.can_apply = true;
                    }else if( page_model.list[post.datum.data.page].datum.admission === 'open'
                        && user_page_state_service.getUserState( post.datum.data.page ) === user_page_state_service.states.PENDING ){
                        ctrl.can_cancel = true;
                    }else if( page_model.list[post.datum.data.page].datum.admission === 'free'
                        && user_page_state_service.getUserState( post.datum.data.page ) === user_page_state_service.states.NONE ){
                        ctrl.can_join = true;
                    }
                }
                // IF POST STATE IS 'MEMBER'.
                else if( post.datum.data.state === states.member ){
                    // DISABLE ACTIONS
                    ctrl.has_actions = false;
                    clear();

                    // SET POST TEXT
                    if( post.datum.data.user === session.id ){
                        ctrl.text = self_new_member_label;
                    }else{
                        ctrl.text = filters_functions.extrapole(
                            user_new_member_label,
                            filters_functions.username( user_model.list[post.datum.data.user].datum )
                        );
                    }
                }
                // IF POST STATE IS 'INVITED'
                else if( post.datum.data.state === states.invited ){
                    // CLEAR & ENABLE ACTIONS
                    clear();
                    ctrl.has_actions = true;
                    ctrl.can_decline = true;
                    ctrl.can_accept = true;

                    // SET POST TEXT
                    ctrl.text = 'You are invited to join this event.';
                }

                ctrl.loaded = true;
            }

        }
    ]);
