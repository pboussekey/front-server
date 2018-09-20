angular.module('filters')
    .filter('graduation', ['filters_functions',
        function( filters_functions ){
            return filters_functions.graduation;
        }
    ]);
