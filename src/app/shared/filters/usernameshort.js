angular.module('filters')
    .filter('usernameshort', ['filters_functions',
        function(filters_functions){
            return filters_functions.usernameshort;
        }
    ]);