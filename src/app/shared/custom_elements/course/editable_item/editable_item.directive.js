
angular.module('customElements')
    .directive('editableItem',[
        function(){
            return {
                restrict:'E',
                scope:{
                    id: '=itemid',
                    haschild:'=haschild'
                },
                controller: 'editable_item_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/editable_item/editable_item.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);
