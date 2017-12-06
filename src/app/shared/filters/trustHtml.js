angular.module('filters')
    .filter('trustHtml', ['$sce', function($sce){
        return function(text) {
            return $sce.getTrustedHtml(text);//$sce.trustAsHtml(text);
        };
    }]);
