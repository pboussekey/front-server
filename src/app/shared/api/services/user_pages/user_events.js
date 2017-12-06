angular.module('API').factory('user_events',
    ['user_pages_abstract_service', 'pages_constants','service_garbage','uea_model','uei_model','uem_model',
        function( user_pages_abstract_service, pages_constants, service_garbage, uea_model, uei_model, uem_model ){
        
            var service = new user_pages_abstract_service( 
                pages_constants.pageTypes.EVENT,
                uea_model,
                uei_model,
                uem_model
            );
            
            service_garbage.declare(function(){
                service.clear();
            });
            
            return service;
        }
    ]);