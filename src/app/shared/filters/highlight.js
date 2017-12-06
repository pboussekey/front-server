angular.module('filters')
    .filter('highlight', ['$sce', function($sce){
        return function(text, search) {
            if (!search) {
                return $sce.trustAsHtml(text);
            }
            return $sce.trustAsHtml(text.replace(new RegExp(search, 'gi'), '<span class="highlighted">$&</span>'));
        };
    }]);