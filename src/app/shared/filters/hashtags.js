angular.module('filters')
    .filter('hashtags', ['filters_functions',
        function(filters_functions){
            return filters_functions.hashtags;
        }
    ]);
