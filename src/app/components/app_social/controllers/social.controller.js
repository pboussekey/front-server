angular.module('app_social').controller('social_controller',
    ['$scope', 'social_service',
        function( $scope, social_service ){
            var ctrl = this;            
            ctrl.social = social_service;
            
            
        }
    ]);