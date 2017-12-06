angular.module('filters')
    .filter('extrapole', ['filters_functions',
        function( filters_functions ){
            return filters_functions.extrapole;
        }
    ]);