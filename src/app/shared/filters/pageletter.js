angular.module('filters')
    .filter('pageletter', ['filters_functions',
        function(filters_functions){
            return filters_functions.pageletter;
        }
    ]);