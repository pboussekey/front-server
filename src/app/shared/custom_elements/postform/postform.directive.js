
angular.module('customElements')
    .directive('postform',[
        function(){
            return {
                restrict:'E',
                scope:{
                    callback:'=onsent',
                    overload:'=overload',
                    id:'=?inputid',
                    placeholder: '@'
                },
                controller: 'postform_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/postform/postform.html',
                link: function( scope ){
                    scope.id = scope.id || 'postUploadInput';
                    scope.placeholder = scope.placeholder || "What's on your mind?";
                }
            };
        }
    ]);