angular.module('filters')
    .filter('mediatime', ['filters_functions',
        function( filters_functions ){
            return filters_functions.formatMediaTime;
        }    
    ]);