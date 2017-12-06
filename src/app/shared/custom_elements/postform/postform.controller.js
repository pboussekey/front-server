angular.module('customElements').controller('postform_controller',
    ['$scope','session','user_model','post_model','api_service','upload_service',
        'notifier_service','$translate', 'page_model', 'filters_functions', 'resume_model',
        'user_resumes_model',
        function( $scope, session, user_model, post_model, api_service, upload_service, 
        notifier_service, $translate, page_model, filters_functions, resume_model,
        user_resumes_model){
        
            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                pageRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/page/([A-Za-z]*)/([0-9]*)'),
                profileRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/profile/([0-9]*)');
            
            user_model.get([session.id]).then(function(){                
                ctrl.user = user_model.list[session.id];
            });
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
                return !ctrl.sending && ( !ctrl.attachments.length || ctrl.attachments.every(function(a){ return a.token; }) );
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
        
            // INITIALIZE FORM FIELDS.
            function initFields(){
                ctrl.attachments = [];
                ctrl.content = '';
                ctrl.link = undefined;
            }
        }
    ]);
     