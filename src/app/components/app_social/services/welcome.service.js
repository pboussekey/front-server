angular.module('app_social')
    .factory('welcome_service',[ 'community_service', '$q',
            'session', 'modal_service', 'user_model',  'filters_functions',
            'connections', 'countries', 'profile', '$timeout', 'languages',
        function( community_service, $q,
            session, modal_service, user_model,  filters_functions,
            connections, countries, profile, $timeout, languages){
            var email_regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+$');

            function isEmail(source){
                return email_regex.test(source);
            };

            var service = {
                session : session,
                users : user_model.list,
                available_steps : {
                    keywords : {
                        title : "Tell your peers<br/> about yourself!",
                        steptitle : "About yourself",
                        hint : "Everyone has a story and it always starts with a journey!",
                        priority : 101,
                        tags : [],
                        tmp_tags : [],
                        input_tags : { expertise : { search : "" }, interest : { search : "" }, language : { search : "" }  },
                        isCompleted : function(){
                            return user_model.queue([session.id]).then(function(){
                                return user_model.list[session.id].datum.tags.length > 4;
                            });
                        },
                        onComplete : function(){
                          var removed = [], added = [];
                          // Build removed tags array
                          service.available_steps.keywords.tags.forEach(function( tag ){
                              if(service.available_steps.keywords.tmp_tags.every(function(t){
                                return t.name!==tag.name.toLowerCase() && t.category === tag.category; }) ){
                                  removed.push(tag);
                              }
                          });
                          // Build added tags array
                          service.available_steps.keywords.tmp_tags.forEach(function(tag){
                              if( service.available_steps.keywords.tags.every(function(t){ return t.name.toLowerCase()!==tag.name; }) ){
                                  added.push(tag);
                              }
                          });
                          added.forEach(function(tag){
                              profile.addTag(session.id, tag.name, tag.category);
                          });
                          removed.forEach(function(tag){
                              profile.removeTag(session.id, tag);
                          });
                          service.nextStep();
                        },
                        fill : function(){
                            return user_model.queue([session.id]).then(function(){
                                service.available_steps.keywords.tags = user_model.list[session.id].datum.tags;
                                var categories = {
                                    expertise : 0,
                                    interest : 0,
                                    language : 0
                                };
                                service.available_steps.keywords.category = 'expertise';
                                service.available_steps.keywords.tags.forEach(function(tag){
                                  categories[tag.category]++;
                                });
                                if(categories.interest < categories.expertise && categories.interest <= categories.language){
                                  service.available_steps.keywords.category = 'interest';
                                }
                                else if(categories.language < categories.expertise && categories.language <= categories.interest){
                                  service.available_steps.keywords.category = 'language';
                                }
                                return true;
                            });

                        },
                        searchTags : function(search, category){
                          return community_service.tags(
                            search,
                            category,
                            1,
                            5,
                            service.available_steps.keywords.tmp_tags.map(function(t){ return t.name;})
                          );
                        },
                        searchExpertise : function(search){
                          return service.available_steps.keywords.searchTags(search, 'expertise');
                        },
                        searchInterest : function(search){
                          return service.available_steps.keywords.searchTags(search, 'interest');
                        },
                        searchLanguages : languages.getList,
                        addTag : function( $event, tag, category){
                            if( $event && ($event.keyCode === 13) && !service.available_steps.keywords.tags_list.length){
                                $event.stopPropagation();
                                $event.preventDefault();

                                var tags = (service.available_steps.keywords.input_tags[category].search||'').match(new RegExp('[A-Za-z0-9_-]+','g'));
                                service.available_steps.keywords.input_tags[category].search = '';
                                if( tags && tags.length ){
                                    tags.forEach(function(name){
                                        if( service.available_steps.keywords.tmp_tags
                                            .filter(function(tag){ return tag.category === category; })
                                            .every(function(tag){ return tag.name!==name; }) ){
                                              $timeout(function(){
                                                service.available_steps.keywords.tmp_tags.push({name:name.toLowerCase(), category : category});
                                              });
                                        }
                                    });
                                }
                            }
                            else if(tag && service.available_steps.keywords.tmp_tags.every(function(t){ return tag.name!==t.name; })){
                                tag.category = category;
                                service.available_steps.keywords.tmp_tags.push(tag);
                                service.available_steps.keywords.input_tags[category].search = '';
                            }
                        },
                        removeTag : function(tag){
                            service.available_steps.keywords.tmp_tags.splice( service.available_steps.keywords.tmp_tags.indexOf(tag), 1);
                        },
                        addExpertise : function($event, tag){
                          service.available_steps.keywords.addTag($event, tag, 'expertise');
                        },
                        addInterest : function($event, tag){
                          service.available_steps.keywords.addTag($event, tag, 'interest');
                        },
                        addLanguage : function($event, tag){
                          tag = { name : tag.libelle.toLowerCase() };
                          service.available_steps.keywords.addTag($event, tag, 'language');
                        }

                    },
                    connections : {
                        title : "Start building your network!",
                        steptitle : "Add connections",
                        hint : "Invite people to join your network.",
                        priority : 100,
                        count : 0,
                        total : 0,
                        pagination : { n : 20, p : 1 },
                        selected : {},
                        next : function(){
                            if(!service.available_steps.connections.loading && !service.available_steps.connections.ended){
                                service.available_steps.connections.loading = true;
                                service.available_steps.connections.pagination.p++;
                                return community_service.users(
                                    null,
                                    service.available_steps.connections.pagination.p,
                                    service.available_steps.connections.pagination.n,
                                    [session.id], null, null, null, null, { type : 'affinity' },
                                    0)
                                    .then(function(users){
                                        service.available_steps.connections.suggestions = service.available_steps.connections.suggestions.concat(users.list);
                                        service.available_steps.connections.loading = false;
                                        service.available_steps.connections.ended = users.list.length < service.available_steps.connections.pagination.n;
                                });
                            }
                        },
                        isCompleted : function(){
                            return connections.load().then(function(){
                                return connections.connecteds.length + connections.requesteds.length >= 10;
                            });
                        },
                        addConnection : function(user_id){
                            if(!service.available_steps.connections.selected[user_id]){
                                service.available_steps.connections.count++;
                                service.available_steps.connections.selected[user_id] = true;
                                connections.request( user_id );
                            }
                            else{
                                service.available_steps.connections.count--;
                                service.available_steps.connections.selected[user_id] = false;
                                connections.remove( user_id );
                            }
                        },
                        fill : function(){
                            service.available_steps.connections.pagination = { n : 20, p : 1 };
                            service.available_steps.connections.count = connections.connecteds.length + connections.requesteds.length;
                            service.available_steps.connections.total = (connections.connecteds.length + connections.requesteds.length) > 10 ? 1 : 10;

                            return community_service.users(
                                service.available_steps.connections.search,
                                service.available_steps.connections.pagination.p,
                                service.available_steps.connections.pagination.n,
                                [session.id], null, null, null, null, { type : 'affinity' },
                                0)
                                .then(function(users){
                                    service.available_steps.connections.canInvite = isEmail(service.available_steps.connections.search);
                                    service.available_steps.connections.suggestions = users.list;
                            });

                        }.bind(this)
                    },
                    avatar : {
                        title : "Set profile picture",
                        hint : "Don't be a stranger! Your photo will make it easier for your teamates to recognize you.",
                        priority : 99,
                        isCompleted : function(){
                            return user_model.queue([session.id]).then(function(){
                                return user_model.list[session.id].datum.avatar;
                            });
                        },
                        onComplete : function(){
                            if(service.available_steps.avatar.avatar){
                                service.available_steps.avatar.crop().then(function(blob){
                                    profile.updateAvatar(blob, session.id);
                                });
                            }
                            else{
                                profile.updateAvatar(null, session.id);
                            }
                            service.nextStep();
                        },
                        fill : function(){
                            return user_model.queue([session.id]).then(function(){
                                if(!service.available_steps.avatar.avatar && user_model.list[session.id].datum.avatar){
                                    service.available_steps.avatar.avatar = filters_functions.dmsLink(user_model.list[session.id].datum.avatar);
                                    service.available_steps.avatar.loadCropper( service.available_steps.avatar.avatar, false, true );
                                }
                                return true;
                            });
                        },
                        onAvatarFile : function( files, input ){
                            if( files && files.length ){
                                service.available_steps.avatar.avatar =  URL.createObjectURL(files[0]);
                                $timeout(function(){
                                    service.available_steps.avatar.loadCropper( service.available_steps.avatar.avatar, false, true );
                                });

                            }
                            else{
                                service.available_steps.avatar.avatar =  null;
                                $timeout(function(){
                                    service.available_steps.avatar.loadCropper( null, false, true );
                                });
                            }
                            if(input){
                                input.value = null;
                            }
                        },
                        avatars : [
                            'assets/img/avatar1.svg',
                            'assets/img/avatar2.svg',
                            'assets/img/avatar3.svg',
                            'assets/img/avatar4.svg',
                            'assets/img/avatar5.svg',
                            'assets/img/avatar6.svg',
                            'assets/img/avatar7.svg',
                            'assets/img/avatar8.svg',
                            'assets/img/avatar9.svg',
                            'assets/img/avatar10.svg',
                            'assets/img/avatar11.svg',
                            'assets/img/avatar12.svg',
                            'assets/img/avatar13.svg',
                            'assets/img/avatar14.svg',
                            'assets/img/avatar15.svg',
                            'assets/img/avatar16.svg',
                            'assets/img/avatar17.svg',
                            'assets/img/avatar18.svg',
                            'assets/img/avatar19.svg',
                            'assets/img/avatar20.svg',
                            'assets/img/avatar21.svg',
                            'assets/img/avatar22.svg',
                            'assets/img/avatar23.svg',
                            'assets/img/avatar24.svg',
                        ]
                    },
                    address : {
                        title : "Tell your peers<br/> about yourself!",
                        steptitle : "About yourself",
                        hint : "Everyone has a story and it always starts with a journey!",
                        priority : 98,
                        isCompleted : function(){
                            return user_model.queue([session.id]).then(function(){
                                return user_model.list[session.id].datum.address || user_model.list[session.id].datum.origin;
                            });
                        },
                        onComplete : function(){
                            profile.updateAddress(service.available_steps.address.tmpAddress, session.id);
                            profile.updateOrigin(service.available_steps.address.tmpOrigin, session.id);
                            service.nextStep();
                        },
                        fill : function(){
                            return user_model.queue([session.id]).then(function(){
                                var me = user_model.list[session.id].datum;
                                if(me.origin){
                                    service.available_steps.address.tmpOrigin = me.origin.short_name;
                                }
                                if(me.address && me.address.id){
                                    service.available_steps.address.tmpAddress = filters_functions.address(me.address);
                                }
                                return true;
                            });
                        },
                        searchOrigin : function(search){
                            if(!search){
                                service.available_steps.address.tmpOrigin = null;
                                return [];
                            }
                            else{
                                return countries.getList(search);
                            }
                        },
                    }
                },
                steps : [],

                changeState : function(index){
                    if(service.steps[index] && service.steps[index].fill){
                        service.current_index = index;
                        service.current_step = service.steps[index];
                        service.loading = true;
                        return service.steps[index].fill().then(function(){
                            service.loading = false;
                            service.steps[index].initialized = true;
                            if(!modal_service.opened){
                                modal_service.open( {
                                    template: 'app/components/app_social/tpl/welcome.template.html',
                                    scope: service,
                                    blocked : true,
                                    reference: document.activeElement,
                                    onclose : service.onClose
                                });
                            }
                        });
                    }
                    else{
                        modal_service.close();
                    }
                },
                nextStep : function(){
                    service.changeState(service.current_index + 1);
                },
                init : function(){
                    service.steps = [];
                    var steps = Object.keys(service.available_steps).length;
                    angular.forEach(service.available_steps, function(step){
                        step.isCompleted().then(function(done){
                            if(!done){
                                service.steps.push(step);
                            }
                            onLoad();
                        });
                    });
                    function onLoad(){
                        steps--;
                        if((service.steps.length > 0 && steps === 0) || service.steps.length === 3){
                            service.steps.sort(function(s1, s2){
                               return s1.priority < s2.priority;
                            });
                            service.changeState(0);
                        }
                    }


                },
                onClose : function(){
                    profile.closeWelcome(service.delay);
                }
            };
            return service;
        }
    ]);
