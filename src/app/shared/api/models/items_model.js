
angular.module('API')
    .factory('items_model',['abstract_model_service','api_service','items_childs_model',
    'course_sections_model','course_view_sections_model','items_view_childs_model','events_service',
        function(abstract_model_service, api_service, items_childs_model,
            course_sections_model, course_view_sections_model, items_view_childs_model, events_service ){

            var service = new abstract_model_service({
                outdated_timeout: 1000*60*2,//*60*2,  // 2 hours.

                cache_size: 40,
                cache_model_prefix: 'itm.',
                cache_list_name: 'itm.ids',

                _method_get: 'item.get',
                _format: function( datum ){
                    if( datum.start_date ){
                        datum.start_date = new Date(datum.start_date);
                    }
                    if( datum.end_date ){
                        datum.end_date = new Date(datum.end_date);
                    }
                    return datum;
                },

                update: function( data, must_notify ){
                    return api_service.queue('item.update',Object.assign({notify:must_notify},data) ).then(function(){
                        if( service.list[data.id].datum ){
                            Object.keys(data).forEach(function(k){
                                if( data[k] !== undefined ){
                                    service.list[data.id].datum[k] = data[k];
                                }
                            });
                            service._updateModelCache( data.id );

                            if( data.is_published !== undefined ){
                                if( service.list[data.id].datum.parent_id ){
                                    return items_view_childs_model.get([service.list[data.id].datum.parent_id], true).then(process);
                                }else{
                                    return course_view_sections_model.get([service.list[data.id].datum.page_id], true).then(process);
                                }
                            }
                        }
                        process();
                    });

                    function process(){
                        if( service.list[data.id].datum.page_id || data.page_id ){
                            events_service.process('page.'+(service.list[data.id].datum.page_id || data.page_id)+'.item.updated', data.id);
                        }
                    }
                },

                remove: function( id ){
                    return api_service.queue('item.delete', {id: id}).then(function(){

                        if( service.list[id].datum.page_id ){
                            events_service.process('page.'+service.list[id].datum.page_id+'.item.updated', id);
                        }

                        if( service.list[id].datum ){
                            if( service.list[id].datum.parent_id ){
                                service.list[service.list[id].datum.parent_id ].datum.nb_children--;
                                service._updateModelCache( service.list[id].datum.parent_id  );
                                items_view_childs_model.get([service.list[id].datum.parent_id],true);
                                return items_childs_model.get([service.list[id].datum.parent_id],true)
                                    .then(function(){
                                        service._deleteModel( id );
                                    });
                            }else{
                                course_view_sections_model.get([service.list[id].datum.page_id],true);
                                return course_sections_model.get([service.list[id].datum.page_id],true)
                                    .then(function(){
                                        service._deleteModel( id );
                                    });
                            }
                        }
                    });
                },

                move: function( id, order, parent ){
                    var oldParentId;
                    if( service.list[id].datum ){
                        oldParentId = service.list[id].datum.parent_id;
                    }

                    return api_service.send('item.move',{ id: id, order_id: order, parent_id: parent }).then(function(){
                        if( service.list[id].datum ){
                            if( parent ){
                                service.list[id].datum.parent_id = parseInt( parent );
                                service.list[parent].datum.nb_children++;
                                service._updateModelCache( parent );
                            }

                            if( service.list[id].datum.type === 'SCT' ){
                                course_view_sections_model.get([service.list[id].datum.page_id],true);
                                return course_sections_model.get([service.list[id].datum.page_id],true);
                            }else{
                                var ids = [];

                                if( oldParentId ){
                                    ids.push(oldParentId);
                                    service.list[oldParentId].datum.nb_children--;
                                    service._updateModelCache( oldParentId );
                                }
                                if( parent && ids.indexOf(parent) === -1 ){
                                    ids.push( parent );
                                }

                                items_view_childs_model.get(ids, true);
                                return items_childs_model.get(ids, true);
                            }
                        }
                    });
                },

                create: function( data ){
                    return api_service.queue('item.add',data).then(function(itemId){
                        if( data.parent_id ){
                            items_view_childs_model.get([data.parent_id], true);
                            service.list[data.parent_id].datum.nb_children++;
                            service._updateModelCache( data.parent_id );
                        }else if( data.page_id ){
                            course_view_sections_model.get([data.page_id], true);
                        }
                        return itemId;
                    });
                },
                /*publish : function(id, publish){
                    api_service.queue('item.publish',{ id : id, publish : !!publish }).then(function(){
                       service.list[id].datum.is_published = !!publish;
                       service._updateModelCache( id );
                    });
                },*/
                publish_grades : function(id, publish){
                    api_service.queue('item.update',{ id : id, is_grade_published : !!publish }).then(function(){
                       service.list[id].datum.is_grade_published = !!publish;
                       service._updateModelCache( id );
                    });
                }

            });

            window.items_model = service;

            return service;
        }
    ]);
