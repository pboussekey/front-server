angular.module('customElements')
    .directive('classmatesBox',[function(){

            return {
                restrict:'E',
                scope:{

                },
                link: function( scope ){
                      scope.list = [1,3,4,5,6];
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/classmates-box/classmates_box.html'
            };
        }
    ]);
