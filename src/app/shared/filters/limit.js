angular.module('filters')
    .filter('limit', ['filters_functions',
        function( filters_functions ){
            return filters_functions.limit;
        }
    ]);