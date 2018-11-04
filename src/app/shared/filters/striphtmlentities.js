angular.module('filters')
    .filter('striphtmlentities', ['filters_functions',
        function(filters_functions){
            return filters_functions.striphtmlentities;
        }
    ]);
