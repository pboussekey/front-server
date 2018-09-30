angular.module('elements').directive('autocompleteResult',[function(){

    return {
        restrict: 'A',
        template: '\<div class="result-logo" ng-if="initial && !img">{{ text.substring(0,1) }}</div>\n\
                  <div class="result-img" ng-if="img" image-size="[80,\'m\',80]" image-onload="{{img}}" ></div>\n\
                  <div class="result-texts">\n\
                        <div class="result-text" ng-class="{ \'with-subtext\' : subtext }" ng-bind-html="text | highlight : search"></div>\n\
                        <div class="result-subtext" ng-bind-html="subtext |trustHtml"></div>\n\
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
