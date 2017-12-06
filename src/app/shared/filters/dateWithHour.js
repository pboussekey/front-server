angular.module('filters')
    .filter('dateWithHour', ['filters_functions',
        function( filters_functions ){
            return filters_functions.dateWithHour;
        }
    ]);