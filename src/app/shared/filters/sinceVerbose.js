angular.module('filters')
    .filter('sinceVerbose', ['filters_functions',
        function( filters_functions ){
            return filters_functions.sinceVerbose;
        }
    ]);
