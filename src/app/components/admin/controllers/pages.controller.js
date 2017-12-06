angular.module('admin').controller('pages_controller',
    ['activities_service', 'user_model','filters_functions', 'community_service',
        function(activities_service, user_model, filters_functions, community_service){

        	var ctrl = this;
        	ctrl.dateFilter = filters_functions.dateWithoutHour;

        	ctrl.get = function()
        	{
        		 activities_service.getPages(ctrl.object_name, ctrl.count, ctrl.start_date, ctrl.end_date).then(function( pages ){
        		 	ctrl.pages = pages;
        		 })
        	}

            ctrl.get();
        }]);