angular.module('elements').directive('autocompleteResult',[function(){
    
    return {
        restrict: 'A',
        template: '\<div class="result-logo" ng-if="initial && !img">{{ text.substring(0,1) }}</div>\n\
                  <img class="result-img" ng-if="img" src="{{ img }}" image-onload="{{img}}" />\n\
                  <div class="result-texts">\n\
                        <div class="result-text" ng-class="{ \'with-subtext\' : subtext }" ng-bind-html="text | highlight : search"></div>\n\
                        <div class="result-subtext">{{ subtext }}</div>\n\
                   </div>\n\
                  <div class="result-label" ng-if="label">{{ label }}</div>',
        scope: {
            text: '@autocompleteResult',
            subtext: '@resultSubtext',
            img : '@resultImage',
            label : '@resultLabel',
            search : '=resultSearch',
            initial : "="
        }
   };
}]);