angular.module('API').factory('user_organizations',
    ['user_pages_abstract_service', 'pages_constants','service_garbage','uoa_model','uoi_model','uom_model',
        function( user_pages_abstract_service, pages_constants, service_garbage, uoa_model, uoi_model, uom_model ){
        
            var service = new user_pages_abstract_service( 
                pages_constants.pageTypes.ORGANIZATION,
                uoa_model,
                uoi_model,
                uom_model
            );
            
            service_garbage.declare(function(){
                service.clear();
            });
            
            return service;
        }
    ]);