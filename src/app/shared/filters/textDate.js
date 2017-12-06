angular.module('filters')
    .filter('textDate', ['filters_functions',
        function( filters_functions ){
            return filters_functions.textDate;
        }
    ]);