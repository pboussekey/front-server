angular.module('filters')
    .filter('address', ['filters_functions',
        function( filters_functions ){
            return filters_functions.address;
        }
    ]);