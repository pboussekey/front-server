angular.module('filters')
    .filter('userinitial', ['filters_functions',
        function(filters_functions){
            return filters_functions.userinitial;
        }
    ]);