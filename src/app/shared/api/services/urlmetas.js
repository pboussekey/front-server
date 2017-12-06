angular.module('API')
    .factory('urlmetas_service',
        ['api_service',
            function( api_service){                
                var service = {                    
                    get: function( url ){                        
                        return api_service.send('post.linkPreview',{ url: url}).then(function( data ){
                            var meta = {};
                            
                            if( data.open_graph ){
                                meta.title = data.open_graph.title || data.open_graph.site_name;
                                meta.description = data.open_graph.description;
                                meta.picture = data.open_graph.image;
                            }
                            
                            if( data.meta ){
                                meta.title = meta.title || data.meta['twitter:title'] || data.meta.title;
                                meta.description = meta.description || data.meta['twitter:description'] || data.meta.description;
                                meta.picture = meta.picture || data.meta['twitter:image'] || data.meta.image;
                            }
                            
                            if( !meta.picture && data.images && data.images.length ){
                                data.images.some(function( image ){
                                    if( image ){
                                        meta.picture = image;
                                        return true;
                                    }
                                });
                            }
                            
                            return meta;
                        });
                    }
                };
                return service;
            }
        ]);