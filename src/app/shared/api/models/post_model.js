
angular.module('API')
    .factory('post_model',['abstract_model_service','api_service','events_service', 'user_model',
        function(abstract_model_service, api_service, events_service, user_model ){

            var service = new abstract_model_service({
                outdated_timeout: 1000*60*10,  // 10 minutes.

                cache_size: 60,
                cache_model_prefix: 'p.',
                cache_list_name: 'p.ids',

                _method_get: 'post.get',

                _format: function( datum ){
                    if( datum.docs ){
                        var i = datum.docs.length-1;
                        datum.images = [];
                        datum.videos = [];
                        datum.audios = [];

                        for(;i>=0;i--){
                            if( datum.docs[i].type.slice(0,6) === 'image/' ){
                                datum.images.push( datum.docs[i] );
                                datum.docs.splice(i,1);
                            }else if( datum.docs[i].type.slice(0,6) === 'video/' ){
                                datum.videos.push( datum.docs[i] );
                                datum.docs.splice(i,1);
                            }else if( datum.docs[i].type.slice(0,6) === 'audio/' ){
                                datum.audios.push( datum.docs[i] );
                                datum.docs.splice(i,1);
                            }
                        }
                        datum.picsAndDocs = (datum.images||[]).concat(datum.docs);
                    }
                    if(datum.mentions){
                        user_model.queue(datum.mentions);
                    }
                    return datum;
                },

                unlike: function( id ){
                    service.list[id].datum.is_liked = false;
                    service.list[id].datum.nbr_likes--;

                    return api_service.send('post.unlike',{id:id}).then(function(){
                        service._updateModelCache(id);
                    },function(){
                        if( !service.list[id].datum.is_liked ){
                            service.list[id].datum.is_liked = true;
                            service.list[id].datum.nbr_likes++;
                            service._updateModelCache(id);
                        }
                    });
                },
                like: function( id ){
                    service.list[id].datum.is_liked = true;
                    service.list[id].datum.nbr_likes++;

                    return api_service.send('post.like',{id:id}).then(function(){
                        service._updateModelCache(id);
                    },function(){
                        if( service.list[id].datum.is_liked ){
                            service.list[id].datum.is_liked = false;
                            service.list[id].datum.nbr_likes--;
                            service._updateModelCache(id);
                        }
                    });
                },
                remove: function( id ){
                    return api_service.send('post.delete',{id:id}).then(function(){
                        // DELETE POST IN SERVICE.
                        delete( service.list[id] );
                    });
                },
                add: function( model ){
                    if( model.id ){
                        return api_service.send('post.update', model ).then(function(){
                            return service.get([model.id], true).then(function(){ return model.id; });
                        });
                    }else{
                        return api_service.send('post.add', model );
                    }
                },
                hide: function( id ){
                    return api_service.send('post.hide',{id:id}).then(function(){
                        // Process hide post event to update post list services...
                        events_service.process('post.hidden', id );
                    });
                }
            });

            window.postMODELS = service;

            return service;
        }
    ]);
