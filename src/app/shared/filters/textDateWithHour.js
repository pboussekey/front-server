angular.module('filters')
    .filter('textDateWithHour', ['filters_functions',
        function( filters_functions ){
            return filters_functions.textDateWithHour;
        }
    ]);
