angular.module('filters')
    .filter('username', ['filters_functions',
        function(filters_functions){
            return filters_functions.username;
        }
    ]);