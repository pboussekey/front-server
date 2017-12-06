
angular.module('customElements')
    .directive('postform',[
        function(){
            return {
                restrict:'E',
                scope:{
                    callback:'=onsent',
                    overload:'=overload',
                    id:'=?inputid'
                },
                controller: 'postform_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/postform/postform.html',
                link: function( scope ){
                    scope.id = scope.id || 'postUploadInput';
                }
            };
        }
    ]);