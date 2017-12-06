angular.module('filters')
    .filter('timerSince', ['filters_functions',
        function( filters_functions ){
            return filters_functions.timerSince;
        }
    ]);