angular.module('filters')
    .filter('since', ['filters_functions',
        function( filters_functions ){
            return filters_functions.since;
        }
    ]);