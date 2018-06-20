angular.module('filters')
    .filter('usertag', ['filters_functions',
        function(filters_functions){
            return filters_functions.usertag;
        }
    ]);