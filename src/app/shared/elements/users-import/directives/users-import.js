angular.module('users-import').directive('usersImport',[function(){
    return {
        scope: {
            callback : "=usersImport",
            exclude: "=",
            canCreateAccount : "=",
            labels : '=',
            close : '='
        },
        templateUrl: 'app/shared/elements/users-import/tpl/users-import.html',
        restrict: 'A',
        transclude: true,
        controllerAs: 'ctrl',
        controller: 'users-import-controller'
    };
}]);

