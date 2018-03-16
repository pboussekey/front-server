angular.module('filters')
    .filter('titlecase', ['filters_functions',
        function( filters_functions ){
            return filters_functions.titlecase;
        }
    ]);