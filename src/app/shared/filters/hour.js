angular.module('filters')
    .filter('hour', ['filters_functions',
        function( filters_functions ){
            return filters_functions.hour;
        }
    ]);