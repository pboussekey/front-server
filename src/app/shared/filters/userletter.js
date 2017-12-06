angular.module('filters')
    .filter('userletter', ['filters_functions',
        function(filters_functions){
            return filters_functions.userletter;
        }
    ]);