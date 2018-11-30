angular.module('customElements').controller('connection_actions_controller',
    ['$scope','$element','connections','notifier_service','modal_service','events_service','$translate', 'filters_functions',
        function( $scope, $element, connections, notifier_service, modal_service, events_service, $translate, filters_functions ){

            // INIT => GET/LOAD CONNECTIONS DATAS
            connections.load().then(refresh);

            $scope.states = connections.states;
            $scope.state = connections.getUserState( $scope.user.id );


            // METHODS
            $scope.follow = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    $scope.hovered = false;
                    connections.follow( $scope.user.id ).then(function(){
                        $scope.requesting = false;
                        console.log($scope.state);
                        $translate($scope.state === $scope.states.connected ? 'ntf.is_now_connection' : 'ntf.co_follow',{username: filters_functions.username($scope.user) }).then(function( translation ){
                            notifier_service.add({type:"message",message: translation});
                        });
                    });
                }
            };


            $scope.unfollowModal = function( evt ){
                evt.stopPropagation();

                modal_service.open({
                    reference: evt.target,
                    label: 'Unfollow ' + filters_functions.username($scope.user),
                    template:'app/shared/custom_elements/connection_actions/unfollow_modal.html',
                    is_alert: true,
                    scope: {
                        unfollow: unfollow
                    }
                });
            };

            function unfollow( e ){
                e.stopPropagation();
                modal_service.close();
                $scope.hovered = false;
                connections.unfollow( $scope.user.id ).then(function(){
                    $translate('ntf.co_unfollow',{username: filters_functions.username($scope.user) }).then(function( translation ){
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
            $element[0].addEventListener('mousemove', function(){
              $scope.hovered = true;
              $scope.$evalAsync();
            });
            $element[0].addEventListener('mouseout', function(){
              $scope.hovered = false;
              $scope.$evalAsync();
            });
            $scope.$on('$destroy',function(){
                events_service.off( null, eid);
            });

        }
    ]);
