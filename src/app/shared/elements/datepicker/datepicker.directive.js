angular.module('elements').directive('datepicker',function(){
    return {

        controller: 'datepicker_controller',
        controllerAs: 'datepicker',
        scope : {
            selected_date : "=datepicker",
            name : "@datepickerName",
            callback : "=onDateChange",
            required : "=",
            mindate : "=",
            maxdate : "=",
            datepickerStates : '=',
            datepickerState : '=',
            datepickerFormat : '=',
            datepickerBuild : "=",
            initialState : "@"
        },
        templateUrl:'app/shared/elements/datepicker/datepicker.html',
        restrict: 'A'
   };
});
