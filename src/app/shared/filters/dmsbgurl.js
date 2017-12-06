angular.module('filters')
    .filter('dmsbgurl',['filters_functions',
        function( filters_functions ){
            return filters_functions.dmsBgUrl;
        }    
    ]);