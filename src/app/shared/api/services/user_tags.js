angular.module('API')
    .factory('user_tags',
        ['user_model','user_resumes_model', 'resume_model', 'api_service','upload_service','$q', 'tags_constants',
            function( user_model, user_resumes_model, resume_model,  api_service, upload_service, $q, tags_constants){

                var service = {
                    list : {},
                    getList : function(user_id){
                          return user_model.queue([user_id]).then(function(){
                              var list = {};
                              angular.forEach(tags_constants.categories, function(category){
                                  list[category] = [];
                              });
                              user_model.list[user_id].datum.tags.forEach(function(tag){
                                  list[tag.category].push(tag.name);
                              });
                              service.list[user_id] = list;
                              return service.list[user_id];
                          });
                    },
                    add : function(user_id, name, category ){
                        var tag = { name : name, category : category };
                        user_model.list[user_id].datum.tags.push(tag);
                        service.list[user_id][category].push(name);
                        return api_service.send('user.addTag',{id : user_id,  tag:tag.name, category : tag.category}).then(function(id){
                            tag.id = id;
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.splice(user_model.list[user_id].datum.tags.indexOf(tag),1);
                            service.list[user_id][category].splice(service.list[user_id][category].indexOf(tag),1);
                        });
                    },
                    remove: function(user_id, name, category ){
                        var tag = user_model.list[user_id].datum.tags.find(function(t){
                            return t.name === name && t.category === category;
                        });
                        if(!tag){
                            return;
                        }
                        user_model.list[user_id].datum.tags.splice(user_model.list[user_id].datum.tags.indexOf(tag),1);
                        service.list[user_id][category].splice(service.list[user_id][category].indexOf(name),1);
                        return api_service.send('user.removeTag',{id : user_id, tag_id:tag.id}).then(function(){
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.push(tag);
                            service.list[user_id][tcategory].push(name);
                        });
                    }
                };
                return service;
            }
        ]);
