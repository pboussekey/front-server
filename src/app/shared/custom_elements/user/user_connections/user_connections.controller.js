angular.module('customElements').controller('user_connections_controller',
    ['$scope','connection_model', 'user_model', 'session', 'social_service',
        function( $scope, connection_model, user_model, session, social_service ){
            
            var ctrl = this;
            ctrl.me = session.id;
            ctrl.user_model = user_model;
            connection_model.get([$scope.id]).then(function(){
                ctrl.connections = connection_model.list[$scope.id].datum;
            });
           
            ctrl.closeModal = function(e){
                e.preventDefault();
                $scope.close();
            };
            ctrl.openConversation= function(user){
                social_service.openConversation(null, [user], null);
            };


            
        }
    ]);