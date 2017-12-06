angular.module('filters')
    .filter('month', ['filters_functions',
        function( filters_functions ){
            return filters_functions.month;
        }
    ]);