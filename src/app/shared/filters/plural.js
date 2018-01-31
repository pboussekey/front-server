angular.module('filters')
    .filter('plural', ['filters_functions',
        function( filters_functions ){
            return filters_functions.plural;
        }
    ]);