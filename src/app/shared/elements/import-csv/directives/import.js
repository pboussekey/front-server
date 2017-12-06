angular.module('import-csv').directive('importcsv',[function(){
    return {
        scope: {
            required: "=required",
            optional : "=optional",
            import: '=import',
            check: '=check',
            parsed : "="
        },
        templateUrl: 'app/shared/elements/import-csv/tpl/import.html',
        restrict: 'E',
        transclude: true,
        controllerAs: 'ictrl',
        controller: 'import-controller',
        link: function ($scope, element, attributes, controller) {}
    };
}]);

