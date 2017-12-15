angular.module('elements').directive('uiAutocomplete',['$q',function($q){

    return {
      restrict: 'A',
      transclude: true,
      scope: {
          provider: '=uiAutocomplete',
          autocompleteId : '@',
          autocompleteSearch : "=",
          autocompletePagination : "=",
          search : "=autocompleteSearch",
          items : '=autocompleteItems',
          whenBlur: '=',
          disableItem: '=',
          exactMatch: '@',
          required: '=',
          placeholder: '@',
          initialValue : "@",
          minLength : "="
      },
      templateUrl: 'app/shared/elements/autocomplete/template.html',
      controller: 'autocomplete_controller',
      controllerAs: 'autocomplete'
   };
}]);
