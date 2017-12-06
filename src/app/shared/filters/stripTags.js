angular.module('filters')
    .filter('stripTags', ['filters_functions',
        function( filters_functions ){
            return filters_functions.stripTags;
        }
    ]);