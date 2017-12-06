angular.module('API').factory('user_groups',
    ['user_pages_abstract_service', 'pages_constants','service_garbage','uga_model','ugi_model','ugm_model',
        function( user_pages_abstract_service, pages_constants, service_garbage, uga_model, ugi_model, ugm_model ){
        
            var service = new user_pages_abstract_service( 
                pages_constants.pageTypes.GROUP,
                uga_model,
                ugi_model,
                ugm_model
            );
            
            service_garbage.declare(function(){
                service.clear();
            });
            
            return service;
        }
    ]);