angular.module('API').factory('user_grades',
    ['abstract_model_service','service_garbage',
        function( abstract_model_service, service_garbage ){    
        
        var service = {            
            models: {},
            
            // CLEAR SERVICES.
            clear: function(){
                service.models = {};
            },
            
            getModel: function( parent_page_id ){
                
                if( service.models[parent_page_id] ){
                    return service.models[parent_page_id];
                }
                
                return createModel( parent_page_id );
            }
        };
         
        service_garbage.declare(function(){
            service.clear();
        });
        
        return service;
            
        // CREATE A PAGINATOR SERVICE.            
        function createModel( page_id ){            
            service.models[ page_id ] = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'ug'+page_id+'.',
            cache_list_name: 'usrgrades'+ page_id +'.ids',
            
            _method_get: 'page.getUserGrades',
            _buildGetParams : function(ids){
                return { id : page_id, user_id : ids } 
            }
        });
            
            return service.models[ page_id ];
        }
    }
]);
