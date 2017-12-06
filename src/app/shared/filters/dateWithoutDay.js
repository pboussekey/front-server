angular.module('filters')
    .filter('dateWithoutDay', ['filters_functions',
        function( filters_functions ){
            return filters_functions.dateWithoutDay;
        }
    ]);