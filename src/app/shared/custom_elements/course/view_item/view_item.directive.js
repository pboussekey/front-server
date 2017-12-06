
angular.module('customElements')
    .directive('viewItem',[
        function(){
            return {
                restrict:'E',
                scope:{
                    id: '=itemid',
                    haschild:'=haschild',
                    last: '=?',
                    isStudent: '=',
                    render: '=?',
                },
                controller: 'view_item_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/view_item/view_item.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);
