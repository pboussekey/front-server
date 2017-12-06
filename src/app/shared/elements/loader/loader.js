angular.module('elements')
    .directive('loader',function(){
        return {
            template:'<div class="loader"><div class="inner-loader"></div></div><div class="loader-progression" ng-if="progression">{{ progression| number : 0 }}%</div>',
            scope : {
                progression : "="
            }
        };
    });