angular.module('customElements').controller('postform_controller',
    ['$scope','session','user_model','post_model','api_service','upload_service',
         'page_model', 'filters_functions', 'resume_model', 'pages_config', 
        'user_resumes_model', 'filters_functions', 'pages_constants', 'community_service',
        function( $scope, session, user_model, post_model, api_service, upload_service, 
        page_model, filters_functions, resume_model, pages_config, 
        user_resumes_model, filters_functions, pages_constants, community_service){
        
            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                pageRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/page/([A-Za-z]*)/([0-9]*)'),
                profileRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/profile/([0-9]*)');
            
            user_model.get([session.id]).then(function(){                
                ctrl.user = user_model.list[session.id];
            });
            ctrl.pages_config = pages_config;
            ctrl.icons = {
                event : pages_config.event.fields.logo.icon,
                group : pages_config.group.fields.logo.icon,
                course : pages_config.course.fields.logo.icon,
                organization : pages_config.organization.fields.logo.icon
            };
              // Function to check if src is an internal url.
            function isPageLink( source ){
                return pageRgx.test(source);
            }
              // Function to check if src is an internal url.
            function isProfileLink( source ){
                return profileRgx.test(source);
            }
            this.sendPost = function(){
                // Check if post not empty & not already sending
                if( ctrl.canSend() && 
                    (ctrl.link || ctrl.content.trim() || ctrl.attachments.length) ){
                    
                    ctrl.sending = true;
                    
                    var post = {
                        content: ctrl.content.trim()
                    };
                    
                    // SET LINK DATAS
                    if( ctrl.link ){
                        post.link = ctrl.link.url;
                        post.picture = ctrl.link.metapicture;
                        post.link_title = ctrl.link.metatitle;
                        post.link_desc = ctrl.link.metadesc;
                    }
                    
                    // SET ATTACHMENTS DATAS
                    if( ctrl.attachments.length ){
                        post.docs = [];
                        ctrl.attachments.forEach(function( a ){
                            post.docs.push({token:a.token,name:a.name,type:a.type});
                        });
                    }
                    
                    // SET SPECIFIC REQUEST DATAS
                    if( $scope.overload ){
                        Object.keys( $scope.overload ).forEach(function(k){
                            post[k] = $scope.overload[k];
                        });
                    }
                    else if(ctrl.target && ctrl.target.type !== 'user'){
                        post.t_page_id = ctrl.target.id;
                    }
                    
                    post_model.add( post ).then(function(){
                        if( $scope.callback ){
                            $scope.callback();
                        }
                        
                        /*$translate('ntf.post_published').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });*/
                        
                        ctrl.sending = false;
                        initFields();
                    });
                }
            };
            
            this.addAttachment = function( files ){
                if( files.length ){                    
                    var upload = upload_service.upload('token', files[0], files[0].name),
                        attachment = {
                            progression: 0,
                            file: files[0],
                            upload: upload,
                            name: files[0].name,
                            type: files[0].type
                        };
                
                    upload.promise.then(function(d){
                        attachment.token = d.token;
                    },function(){
                        attachment.upload_error = true;
                    },function( evt ){  
                        attachment.progression = Math.round(1000 * evt.loaded / evt.total) / 10;
                    });
                    
                    ctrl.attachments.push( attachment );
                    $scope.$evalAsync();
                }
            };
            
            this.removeAttachment = function( attachment ){
                var idx = ctrl.attachments.indexOf( attachment );
                if( idx !== -1 ){
                    ctrl.attachments.splice( idx, 1);
                }
            };
            
            this.canSend = function(){
                return !ctrl.sending 
                        && ( !ctrl.attachments.length || ctrl.attachments.every(function(a){ return a.token; }) )
                        && (!ctrl.target || ctrl.target.type === 'user' || !!ctrl.target.id);
            };
            
            this.printAttachmentCount = function(){
                var l = ctrl.attachments.length;
                return l+' File'+(l>1?'s':'')+' attached';
            };
            
            this.removeLink = function(){
                ctrl.link = undefined;
            };
            
            initFields();   
            
            
            this.onContentPaste = function( e ){
                urlRgx.lastIndex = 0;
                
                var text = e.clipboardData.getData('text/plain'),
                    matches = urlRgx.exec( text );
                
                urlRgx.lastIndex = 0;
                if( matches && ( !ctrl.link || ctrl.link && matches[0] !== ctrl.link.url ) ){
                    var link = { url: matches[0] };
                    
                    ctrl.loadingLink = true;
                    if(isPageLink(matches[0])){
                        matches = pageRgx.exec( matches[0] );
                        var page_id = matches[4];
                        page_model.get([page_id]).then(function(){
                            var page = page_model.list[page_id].datum;
                            link.url = matches[0];
                            link.metapicture = filters_functions.dmsLink(page.logo || page.background);
                            var type = page.type.charAt(0).toUpperCase() + page.type.substr(1);
                            link.metatitle = page.title + " (" + type + ")";
                            var description = filters_functions.stripTags(page.description);
                            link.metadesc = description.substr(0,160) + (description.length > 160 ? '...' : '');
                            ctrl.link = link;
                        });
                    }
                    else if(isProfileLink(matches[0])){
                        matches = profileRgx.exec( matches[0] );
                        var user_id = matches[3];
                        user_model.get([user_id]).then(function(){
                            var user = user_model.list[user_id].datum;
                            link.url = matches[0];
                            link.metapicture = filters_functions.dmsLink(user.avatar || user.background);
                            link.metatitle = filters_functions.username(user);
                            ctrl.link = link;
                            if(user.organization_id){
                                page_model.queue([user.organization_id]).then(function(){
                                    link.metatitle += " (" + page_model.list[user.organization_id].datum.title + ")";
                                });
                            }
                            user_resumes_model.queue([user.id]).then(function(){
                                resume_model.queue(user_resumes_model.list[user.id].datum).then(function(){
                                    user_resumes_model.list[user.id].datum.map(function(id){
                                        return resume_model.list[id].datum;
                                    }).forEach(function(r){
                                        if(r.type === 0){
                                            var description = r.description;
                                            link.metadesc = description.substr(0,160) + (description.length > 160 ? '...' : '');
                                        }
                                    });
                                });
                            });
                        });
                    }
                    else{
                        api_service.send('post.linkPreview',{ url: matches[0] }).then( function(metas){
                            if( Object.keys(metas.open_graph).length > 0 ){
                                link.metapicture = metas.open_graph.image;
                                link.metatitle = metas.open_graph.title;
                                link.metadesc = metas.open_graph.description;
                            }
                            else if( metas.meta["twitter:image"] ){
                                link.metapicture = metas.meta["twitter:image"];
                                link.metatitle = metas.meta["twitter:title"];
                                link.metadesc = metas.meta["twitter:description"];
                            }
                            else if( metas.meta["description"] ){
                                link.metapicture = metas.meta["image"];
                                link.metatitle = metas.meta["title"];
                                link.metadesc = metas.meta["description"];
                            }

                            if( link.metapicture && !urlRgx.exec(link.metapicture) ){
                                link.metapicture = undefined;
                            }

                            // IF LINK IS POPULATED
                            if( link.metadesc || link.metatitle || link.metapicture ){
                                ctrl.link = link;
                                ctrl.link.metatitle = link.metatitle || link.url;
                            }

                            // UNSET LINK LOADING
                            ctrl.loadingLink = false;   
                        });  
                    }
                                      
                }
            };
            
            ctrl.onBlur = function(){
                if(ctrl.target && !ctrl.target.id){
                    ctrl.selectTarget(null, ctrl.target.type);
                }
            };
            
            ctrl.selectTarget = function(id, type){
                if(type){
                    ctrl.target = { type : type };
                }
                if(id){
                    ctrl.target.id = id;
                    ctrl.autocomplete.search = page_model.list[id].datum.title;
                }
                else if(ctrl.pages[type]){
                    ctrl.target.id = ctrl.pages[type];
                    ctrl.autocomplete.search = page_model.list[ctrl.target.id].datum.title;
                }
                
                if(ctrl.target.id){
                    var page = page_model.list[ctrl.target.id].datum;
                    var label = pages_config[page.type].label;
                    ctrl.target.confidentiality = pages_constants.pageConfidentiality[page.confidentiality];
                    if(ctrl.target.type === 'course'){
                        ctrl.target.hint = "Your post will only be visible to course participants."
                    }
                    else if(page.confidentiality === 0){
                        ctrl.target.hint = "Your post will be visible to everyone on this "+label+".";
                    }
                    else if(page.confidentiality === 1){
                        ctrl.target.hint = "Your post will only be visible to "+label+" participants.";
                    }
                    else{
                        ctrl.target.hint = "Your post will only be visible to "+label+" participants.";
                    }
                }
            };
            console.log($scope.overload);
            
            ctrl.pages = {};
            ctrl.counts = {};
            ctrl.pages_list = page_model.list;
            if(!$scope.overload){
                ctrl.target = null;
                ctrl.pages = {};
                ctrl.counts = {};
                ctrl.titles = {
                    'user' : 'Publish on your profile',
                }
                ctrl.loading = true;
                var loadingStep = 4;
                function load(){
                    loadingStep--;
                    if( !loadingStep ){
                        ctrl.loading = false;
                    }
                }
                community_service.pages( null, 1, 1, 
                    'event', null, null, null, null, 
                    null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id).then(function(pages){
                    ctrl.counts.event = pages.count;
                    if(pages.count > 0){
                        page_model.queue(pages.list);
                        ctrl.pages.event = pages.list[0];
                    }
                    load();
                });
                
                community_service.pages( null, 1, 1, 
                    'group', null, null, null, null, 
                    null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id).then(function(pages){
                    ctrl.counts.group = pages.count;
                    if(pages.count > 0){
                        page_model.queue(pages.list);
                        ctrl.pages.group = pages.list[0];
                    }
                    load();
                });
                
                community_service.pages( null, 1, 1, 
                    'course', null, null, null, null, 
                    null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id).then(function(pages){
                    ctrl.counts.course = pages.count;
                    if(pages.count > 0){
                        page_model.queue(pages.list);
                        ctrl.pages.course = pages.list[0];
                    }
                    load();
                });
                
                community_service.pages( null, 1, 1, 
                    'organization', null, null, null, null, 
                    null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id, true).then(function(pages){
                    ctrl.counts.organization = pages.count;
                    if(pages.count > 0){
                        page_model.queue(pages.list);
                        ctrl.pages.organization = pages.list[0];
                    }
                    load();
                });
            }
            else if($scope.overload.t_page_id){
                page_model.queue([$scope.overload.t_page_id]).then(function(){
                    var page = page_model.list[$scope.overload.t_page_id].datum;
                    var label = pages_config[page.type].label;
                    ctrl.pages[page.type] = page.id;
                    ctrl.counts[page.type] = 1;
                    ctrl.target = { type : page.type, id : page.id };
                    
                    ctrl.target.confidentiality = pages_constants.pageConfidentiality[page.confidentiality];
                    if(ctrl.target.type === 'course'){
                        ctrl.target.hint = "Your post will only be visible to course participants."
                    }
                    else if(page.confidentiality === 0){
                        ctrl.target.hint = "Your post will be visible to everyone on this "+label+".";
                    }
                    else if(page.confidentiality === 1){
                        ctrl.target.hint = "Your post will only be visible to "+label+" participants.";
                    }
                    else{
                        ctrl.target.hint = "Your post will only be visible to "+label+" participants.";
                    }
                });
            }
            ctrl.clearTarget = function(){
                ctrl.target.id = null;
                ctrl.autocomplete.search='';
            };
            ctrl.searchTarget = function(search,filter){
                ctrl.searching = true;
                return community_service.pages( search, filter.p, filter.n, 
                    ctrl.target.type, null, null, null, null, 
                    null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id,
                    ctrl.target.type === 'organization').then(function(r){
                    ctrl.loading = false;
                    return page_model.queue(r.list).then(function(){
                        return r.list;
                    });
                });
            };
            
            ctrl.getTitle = function(limit){
                if($scope.placeholder){
                    return $scope.placeholder;
                }
                if(!ctrl.target || ctrl.target.type === 'user'){
                    return 'Post <span class="clear-bold"> on </span> your profile';
                }
                var title = 'Post <span class="clear-bold"> on </span>' + (ctrl.target.type !== 'organization' ? ctrl.pages_config[ctrl.target.type].label : '');
                if(ctrl.counts[ctrl.target.type] === 1){
                    return title + ' ' + filters_functions.limit(page_model.list[ctrl.pages[ctrl.target.type]].datum.title, limit ? 40 : false);
                }
                return  title ;
            }; 
        
            // INITIALIZE FORM FIELDS.
            function initFields(){
                ctrl.attachments = [];
                ctrl.content = '';
                ctrl.link = undefined;
            }
        }
    ]);
     