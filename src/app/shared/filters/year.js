angular.module('filters')
    .filter('year', ['filters_functions',
        function( filters_functions ){
            return filters_functions.year;
        }
    ]);