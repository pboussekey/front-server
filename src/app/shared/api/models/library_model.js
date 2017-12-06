
angular.module('API')
    .factory('library_model',['abstract_model_service','api_service',function(abstract_model_service, api_service ){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            cache_size: 60,
            cache_model_prefix: 'library.',
            cache_list_name: 'library.ids',

            _method_get: 'library.get',
            _buildGetParams: function( ids ){
                return { id: ids };
            },
            
            update: function( id, name, link, token, type, text ){
                return api_service.send('library.update',{id: id, name:name,link:link, token:token, type:type, text: text})
                    .then(function( model ){
                        service._setModel( model, model.id );
                        return model.id;
                    });
            },
            add: function( name, link, token, type, global, text ){
                return api_service.send('library.add',{name:name,link:link, token:token, type:type, global:global, text:text })
                    .then(function( model ){
                        service._setModel( model, model.id );
                        return model.id;
                    });
            }
        });
        
        return service;
    }]);