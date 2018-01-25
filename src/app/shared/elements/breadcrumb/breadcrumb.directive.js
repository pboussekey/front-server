angular.module('elements').directive('breadcrumb',[function(){

    return {
        restrict: 'A',
        template:   '<a ui-sref="lms.dashboard" title="Home">Home</a> \n\
                    <span ng-repeat-start="element in elements" class="i1 i-right"> </span>\n\
                    <span title="{{element.text }}" ng-class="{ current : $last }" ng-if="!element.href">{{ element.text | limit }}</span>\n\
                    <a title="{{element.text }}" ng-repeat-end ng-class="{ current : $last }" ng-if="element.href" href="{{ element.href }}">{{ element.text| limit }}</a>',
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
