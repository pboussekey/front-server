
angular.module('customElements')
    .directive('coverPicture', 
        function(){
            return {
                restrict:'A',
                scope:{
                    picture:'=coverPicture',
                    callback: '=onSave',
                    name: '@coverName',
                    defaultBackground : '@',
                    editable: '='
                },
                transclude: true,
                controller: 'page_picture_controller',
                controllerAs: 'CoverPictureCtrl',
                templateUrl: 'app/shared/custom_elements/pages/cover-picture.html'
            };
        }
    );
