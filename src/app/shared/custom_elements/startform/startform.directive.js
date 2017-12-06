
angular.module('customElements')
    .directive('startform',[
        function(){
            return {
                restrict:'A',
                scope:{
                    close:'='
                },
                controller: 'startform_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/startform/startform.html'
            };
        }
    ]);