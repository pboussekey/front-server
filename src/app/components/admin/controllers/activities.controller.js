angular.module('admin').controller('activities_controller',
    ['activities_service','user_model','filters_functions', 'community_service',
        function(activities_service, user_model, filters_functions, community){

        	var ctrl = this;

            // INIT

            ctrl.dateFilter = filters_functions.dateWithHour;
            ctrl.page_number = 10;
            ctrl.current_page = 1;
            ctrl.total;
            ctrl.date;
            ctrl.nb_pages;
            ctrl.model_search;
            ctrl.user_id = null;

            ctrl.next = function()
            {
                if (ctrl.current_page < ctrl.nb_pages)
                {
                    ctrl.current_page ++;
                    ctrl.get();
                }
            };

            ctrl.previous = function()
            {
                if (ctrl.current_page > 1)
                {
                    ctrl.current_page --;
                    ctrl.get();
                }
            };

            ctrl.search = function()
            {
                ctrl.current_page = 1;
                ctrl.get();
            };

            ctrl.onCurrentPageChange = function()
            {
                if (ctrl.current_page < 1)
                    ctrl.current_page = 1;
                else if (ctrl.current_page > ctrl.nb_pages)
                    ctrl.current_page = ctrl.nb_pages;
                ctrl.get();
            };

            ctrl.searchUsers = function(search, filter){
                  return community.users(search, filter.p, filter.n).then(function(r){
                        return user_model.queue(r.list).then(function(){
                           
                            return r.list.map(function(u){ return user_model.list[u].datum; }); 
                        });
                  });
            };

            ctrl.get = function()
            {
                activities_service.get( ctrl.start_date, ctrl.end_date, ctrl.current_page, ctrl.page_number, ctrl.model_search, ctrl.user_id).then(function( activities ){
                    // activities = { list: [], count: TOTAL }
                    ctrl.list = activities.list;
                    ctrl.total = activities.count;
                    ctrl.nb_pages = Math.ceil( ctrl.total / ctrl.page_number );
                    if (ctrl.nb_pages == 0){
                        ctrl.nb_pages = 1;
                    }
                });
            };

            // INIT => GET FIRST PAGE ACTIVITIES
            ctrl.get();
	    }
	]);