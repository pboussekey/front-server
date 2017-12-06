angular.module('filters')
    .filter('day', ['filters_functions',
        function( filters_functions ){
            return filters_functions.day;
        }
    ]);