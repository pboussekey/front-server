angular.module('filters')
    .filter('usermention', ['filters_functions',
        function(filters_functions){
            return filters_functions.usermention;
        }
    ]);