angular.module('customElements').controller('post_user_sharings_controller',
    ['$scope','user_sharing_ids',
        function( $scope, user_sharing_ids ){
            var ctrl = this,
                paginator = user_sharing_ids.get( $scope.id );

            ctrl.users = paginator.indexes;

            ctrl.next = function(){
                paginator.next();
            };

            ctrl.closeModal = function(e){
                e.preventDefault();
                $scope.close();
            };

            paginator.get();
        }
    ]);
