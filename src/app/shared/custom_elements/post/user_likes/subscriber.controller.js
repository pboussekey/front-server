angular.module('customElements').controller('subscribers_controller',
    ['$scope','subscribers_ids',
        function( $scope, subscribers_ids ){

            var ctrl = this,
                paginator = subscribers_ids.get( $scope.id );

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
