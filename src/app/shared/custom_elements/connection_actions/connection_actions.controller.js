angular.module('customElements').controller('connection_actions_controller',
    ['$scope','$element','connections','notifier_service','modal_service','events_service','$translate',
        function( $scope, $element, connections, notifier_service, modal_service, events_service, $translate ){
            
            // INIT => GET/LOAD CONNECTIONS DATAS
            connections.load().then(refresh);
            
            $scope.states = connections.states;
            $scope.state = connections.getUserState( $scope.user.id );
            
            // METHODS
            $scope.connect = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    connections.request( $scope.user.id ).then(function(){
                        $scope.requesting = false;
                        $translate('ntf.co_req_sent').then(function( translation ){
                            notifier_service.add({type:"message",message: translation});
                        });
                    });
                }
            };

            $scope.accept = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    connections.accept( $scope.user.id ).then(function(){
                        $scope.requesting = false;
                        $translate('ntf.is_now_connection',{username: $scope.user.firstname+' '+$scope.user.lastname}).then(function( translation ){
                            notifier_service.add({type:"message",message: translation});
                        });
                    });
                }
            };

            $scope.cancelModal = function( evt ){
                evt.stopPropagation();
                
                modal_service.open({
                    reference: evt.target,
                    label: 'Cancel your connection request',
                    template:'app/shared/custom_elements/connection_actions/cancel_modal.html',
                    is_alert: true,
                    scope: {
                        cancel: cancel
                    }
                });
            };

            $scope.removeModal = function( evt ){
                evt.stopPropagation();
                
                modal_service.open({
                    reference: evt.target,
                    label: 'Remove user from your connections',
                    template:'app/shared/custom_elements/connection_actions/remove_modal.html',
                    is_alert: true,
                    scope: {
                        remove: remove
                    }
                });
            };

            function cancel( e ){
                e.stopPropagation();
                modal_service.close();
                connections.remove( $scope.user.id ).then(function(){
                    $translate('ntf.co_req_canceled').then(function( translation ){
                        notifier_service.add({
                            type:"message",
                            message: translation
                        });
                    });
                });
            };

            function remove( e ){
                e.stopPropagation();
                modal_service.close();
                connections.remove( $scope.user.id ).then(function(){
                    $translate('ntf.co_req_removed',{username: $scope.user.firstname+' '+$scope.user.lastname }).then(function( translation ){
                        notifier_service.add({
                            type:"message",
                            message: translation
                        });
                    });
                });
            };

            function refresh(){
                var forceFocus = $element[0].contains( document.activeElement );                
                
                $scope.state = connections.getUserState( $scope.user.id );
                $scope.$evalAsync();
                
                // IF BUTTON WAS FOCUSED BEFORE REFRESHING STATE, FOCUS NEW ONE
                if( forceFocus ){
                    setTimeout(function(){
                         $element[0].querySelector('button, a').focus();
                    });
                }
            }

            var eid = events_service.on('connectionState#'+$scope.user.id, function( event ){
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