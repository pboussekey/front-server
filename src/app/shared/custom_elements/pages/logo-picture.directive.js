angular.module('customElements')
    .directive('logoPicture',
        function(  ){
            return {
                restrict:'A',
                scope:{
                    picture:'=logoPicture',
                    callback: '=onSave',
                    name: '@logoName',
                    defaultText: '@',
                    cropperTitle: '@',
                    modalTitle: '@',
                    editable: '=',
                    icon : '='
                },
                controller: 'page_picture_controller',
                controllerAs: 'LogoPictureCtrl',
                transclude: true,
                templateUrl: 'app/shared/custom_elements/pages/logo-picture.html'
            };
        }
    );