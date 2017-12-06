angular.module('API').factory('user_courses',
    ['user_pages_abstract_service', 'pages_constants','service_garbage','uca_model','uci_model','ucm_model',
        function( user_pages_abstract_service, pages_constants, service_garbage, uca_model, uci_model, ucm_model ){
        
            var service = new user_pages_abstract_service( 
                pages_constants.pageTypes.COURSE,
                uca_model,
                uci_model,
                ucm_model
            );
            
            service_garbage.declare(function(){
                service.clear();
            });
            
            return service;
        }
    ]);