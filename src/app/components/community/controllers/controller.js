angular.module('community').controller('community_controller',
    [ 'community_categories', 'state_service', 'global_search',
        function( community_categories, state_service, global_search){

        var ctrl = this;
        ctrl.categories = community_categories;
        ctrl.state_service = state_service;
        ctrl.breadcrumb = [{ text : 'Discover' }];
        ctrl.search = "";
        if(global_search.search && global_search.search.length){
            ctrl.search = global_search.search;
            global_search.search = "";
        }

    }
]);
