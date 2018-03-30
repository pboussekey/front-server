angular.module('customElements').controller('page_actions_controller',
    ['$scope','$element','user_events','user_groups','user_organizations', 'user_courses', 'session', 'pages', '$state',
         'notifier_service', 'pages_constants', 'modal_service', 'events_service', 'social_service', 'puadmin_model','$translate',
         'pages_config',
        function( $scope, $element, user_events, user_groups, user_organizations, user_courses, session, pages, $state,
         notifier_service, pages_constants, modal_service, events_service, social_service, puadmin_model, $translate,
         pages_config){
            
            var page_state_service;
            if( $scope.page.type === pages_constants.pageTypes.EVENT ){
                
                page_state_service = user_events;
                
            }else if( $scope.page.type === pages_constants.pageTypes.GROUP ){
                
                page_state_service = user_groups;
                
            }else if( $scope.page.type === pages_constants.pageTypes.ORGANIZATION ){
                
                page_state_service = user_organizations;
                
            }else if( $scope.page.type === pages_constants.pageTypes.COURSE ){
                
                page_state_service = user_courses;
                
            }
            
            $scope.states = pages_constants.pageStates;
            $scope.roles = pages_constants.pageRoles;
            $scope.admissions = pages_constants.pageAdmission;
            $scope.label = pages_config[$scope.page.type].label;
            // LOAD USER PAGE STATES.
            page_state_service.load().then(function(){
                $scope.state = page_state_service.getUserState( $scope.page.id );
            });
            
            function updateRole(){
                if(session.roles[1]){
                    $scope.role = pages_constants.pageRoles.ADMIN;
                }
                else{
                    puadmin_model.queue([$scope.page.id], true).then(function(){ 
                        $scope.role = 
                            puadmin_model.list[$scope.page.id].datum.indexOf(session.id) !== -1 ? 
                                pages_constants.pageRoles.ADMIN : 
                                pages_constants.pageRoles.USER;
                        $scope.admins = puadmin_model.list[$scope.page.id].datum;
                    });
                }
            }           
            
            updateRole();
            // METHODS
            $scope.join = function( evt ){
                evt.stopPropagation();
                if( !$scope.requesting ){
                    $scope.requesting = true;
                    page_state_service.join( $scope.page.id ).then(function(){
                        $scope.requesting = false;
                        updateRole();
                        $translate('ntf.page_join',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({ type:"message", message: translation });
                        });
                    });
                }
            };

            $scope.accept = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    page_state_service.accept( $scope.page.id ).then(function(){
                        $scope.requesting = false;
                        updateRole();
                        $translate('ntf.page_join',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({type:"message",message:translation});
                        });
                    });
                }
            };

            $scope.apply = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    page_state_service.apply( $scope.page.id ).then(function(){
                        $scope.requesting = false;
                        updateRole();
                        $translate('ntf.page_apply',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({type:"message",message:translation});
                        });
                    });
                }
            };
            
            $scope.cancel = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    page_state_service.remove( $scope.page.id ).then(function(){
                        $scope.requesting = false;
                        updateRole();
                        $translate('ntf.page_cancel_apply',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({ type:"message",message:translation});
                        });
                    });
                }
            };
            
            $scope.leave = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    page_state_service.remove( $scope.page.id ).then(function(){
                        $scope.requesting = false;     
                        updateRole();
                        $translate('ntf.page_leave',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({ type:"message",message:translation});
                        });
                    });
                }
            };
            
                
            $scope.delete = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    pages.delete( $scope.page.id ).then(function(){
                        $scope.requesting = false;   
                        updateRole(); 
                        $state.go("lms.dashboard");
                        $translate('ntf.page_delete',{pagetype: $scope.page.type }).then(function( translation ){
                            notifier_service.add({ type:"message",message:translation});
                        });
                    });
                }
            };
            
            $scope.openConversation= function(){
                if($scope.page.conversation_id){
                    social_service.openConversation(null, null, $scope.page.conversation_id);
                }
            };

            $scope.cancelModal = function( evt ){
                evt.stopPropagation();
                 modal_service.open({
                    template : 'app/shared/elements/confirm/modal.html',
                    reference : evt.target,
                    scope : {
                        question : "Do you really want to cancel your application?",
                        confirm : function(){
                            $scope.cancel(evt);
                        }
                    },
                    is_alert : true
                });
            };

            $scope.leaveModal = function( evt ){
                evt.stopPropagation();
                 modal_service.open({
                    template : 'app/shared/elements/confirm/modal.html',
                    reference : evt.target,
                    scope : {
                        question : "Do you really want to leave this " + $scope.label + " ?",
                        confirm : function(){
                            $scope.leave(evt);
                        }
                    },
                    is_alert : true
                });
            };
            
             $scope.deleteModal = function( evt ){
                evt.stopPropagation();
                 modal_service.open({
                    template : 'app/shared/elements/confirm/modal.html',
                    reference : evt.target,
                    scope : {
                        question : "Do you really want to delete this " + $scope.label + " ?",
                        confirm : function(){
                            $scope.delete(evt);
                        }
                    },
                    is_alert : true
                });
            };


            function refresh(){
                var forceFocus = $element[0].contains( document.activeElement );                
                
                $scope.state = page_state_service.getUserState( $scope.page.id );
                $scope.$evalAsync();
                
                // IF BUTTON WAS FOCUSED BEFORE REFRESHING STATE, FOCUS NEW ONE
                if( forceFocus ){
                    setTimeout(function(){
                         $element[0].querySelector('button').focus();
                    });
                }
            }

            var eid = events_service.on('user'+$scope.page.type+'State#'+$scope.page.id, function( event ){
                refresh();
                if( $scope.onstatechange ){
                    $scope.onstatechange();
                }
            });

            $scope.$on('$destroy',function(){
                events_service.off( null, eid);
            });
          
            
        }
    ]);