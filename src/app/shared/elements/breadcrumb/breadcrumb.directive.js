angular.module('elements').directive('breadcrumb',[function(){

    return {
        restrict: 'A',
        template:   '<a ui-sref="lms.dashboard">Home</a> \n\
                    <span ng-repeat-start="element in elements" class="i1 i-right"> </span>\n\
                    <span ng-class="{ current : $last }" ng-if="!element.href">{{ element.text }}</span>\n\
                    <a ng-repeat-end ng-class="{ current : $last }" ng-if="element.href" ui-sref="{{ element.href }}">{{ element.text }}</a>',
        scope: {
            elements: '=breadcrumb'
        },
        link : function(scope, element){
            element[0].setAttribute("role", "navigation");
            element[0].setAttribute("aria-label", "Breadcrumb");
            if(navigator.userAgent.indexOf('twicapp') !== -1){
                element[0].innerHTML = "";
                element[0].classList.add('empty');
            }
        }
   };
}]);
