angular.module('customElements').controller('post_user_views_controller',
    ['$scope','user_view_ids',
        function( $scope, user_view_ids ){
            var ctrl = this,
                paginator = user_view_ids.get( $scope.id );

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
