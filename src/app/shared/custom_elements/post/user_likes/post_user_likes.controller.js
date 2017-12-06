angular.module('customElements').controller('post_user_likes_controller',
    ['$scope','user_like_ids',
        function( $scope, user_like_ids ){
            
            var ctrl = this,
                paginator = user_like_ids.get( $scope.id );
            
            ctrl.user_likes = paginator.indexes;
            
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