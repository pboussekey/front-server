angular.module('customElements').controller('connection_actions_controller',
    ['$scope','$element','connections','notifier_service','modal_service','events_service','$translate', 'filters_functions', 'session',
        function( $scope, $element, connections, notifier_service, modal_service, events_service, $translate, filters_functions, session){

           $scope.states = connections.states;
           $scope.display = session.id !== $scope.user.id;

            // METHODS
            $scope.follow = function( evt ){
                evt.stopPropagation();

                if( !$scope.requesting ){
                    $scope.requesting = true;
                    $scope.hovered = false;
                    connections.follow( $scope.user.id ).then(function(){
                        $scope.requesting = false;
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


            $element[0].addEventListener('mousemove', function(){
              $scope.hovered = true;
              $scope.$evalAsync();
            });
            $element[0].addEventListener('mouseout', function(){
              $scope.hovered = false;
              $scope.$evalAsync();
            });



        }
    ]);
