angular.module('filters')
    .filter('dateWithoutHour', ['filters_functions',
        function( filters_functions ){
            return filters_functions.dateWithoutHour;
        }
    ]);