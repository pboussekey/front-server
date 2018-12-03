
angular.module('API')
    .factory('followers_search',['abstract_search_service', 'user_model', function(abstract_search_service, user_model){

        var list = {};
        var service = {
            get : function(user_id){
                if(!list[user_id]){
                    list[user_id] = new abstract_search_service({
                          _method_get: 'contact.getListFollowersId',
                          _buildSearchParams: function( search, filter ){
                              return { user_id : user_id, search : search, filter : filter };
                          },
                          _filter : { n : 36, p : 0, order : 'popularity'},
                          _model : user_model
                      });
                }
                return list[user_id];

            }
        };

        return service;
    }]);
