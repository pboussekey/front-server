angular.module('customElements').controller('post_editor_controller',
    ['$scope','post_model','notifier_service','upload_service','api_service','$translate', 'filters_functions', 'community_service', 'user_model', 'session',
        function( $scope, post_model, notifier_service, upload_service, api_service, $translate, filters_functions, community_service, user_model, session ){
            
            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                id = $scope.id, 
                post = post_model.list[id].datum;
            
            ctrl.editedPost = {
                id: id,
                content: post.content,
                link: post.link,
                link_title: post.link_title,
                link_desc: post.link_desc,
                picture: post.picture
            };
            
            ctrl.attachments = post.docs ? post.docs.concat(post.images||[], post.audios||[], post.videos||[]):[];
            
            ctrl.closeModal = function(e){
                e.preventDefault();
                $scope.close();
            };
            
            this.update = function(){
                // Check if post not empty & not already sending
                if( ctrl.canSend() && 
                    (ctrl.editedPost.link || ctrl.editedPost.content.trim() || ctrl.attachments.length) ){
                    
                    ctrl.sending = true;
                    
                    var post = Object.assign({},ctrl.editedPost);
                    post.content = post.content.trim();
                    
                    // SET ATTACHMENTS DATAS
                    if( ctrl.attachments.length ){
                        post.docs = [];
                        ctrl.attachments.forEach(function( a ){
                            post.docs.push({token:a.token,name:a.name,type:a.type});
                        });
                    }
                    
                    post_model.add( post ).then(function(){
                        $translate('ntf.post_updated').then(function( translation ){
                            notifier_service.add({type:'message',message: translation});
                        });
                        
                        ctrl.sending = false;
                        $scope.close();
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
                ctrl.editedPost.link = '';
                ctrl.editedPost.link_title = '';
                ctrl.editedPost.link_desc = '';
                ctrl.editedPost.picture = '';
            };       
            
            this.onContentPaste = function( e ){
                
                if( !$scope.comment ){
                    urlRgx.lastIndex = 0;
                    
                    var text = e.clipboardData.getData('text/plain'),
                        matches = urlRgx.exec( text );

                    urlRgx.lastIndex = 0;

                    if( matches && ( !ctrl.editedPost.link || ctrl.editedPost.link && matches[0] !== ctrl.editedPost.link ) ){
                        var link = { url: matches[0] };

                        ctrl.loadingLink = true;

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
                                ctrl.editedPost.link = link.url;
                                ctrl.editedPost.link_title = link.metatitle || link.url;
                                ctrl.editedPost.link_desc = link.metadesc;
                                ctrl.editedPost.picture = link.metapicture;
                            }

                            // UNSET LINK LOADING
                            ctrl.loadingLink = false;   
                        });                    
                    }
                }
            };
            
             ctrl.searchAt = function(search){
                return community_service.users(search, 1, 5, [session.id], null, null, null, null, { type : 'affinity' }).then(function(users){
                    if(users.count){
                        return user_model.queue(users.list).then(function(){
                            return users.list.map(function(user){
                                var user = user_model.list[user];
                                return { 
                                    image : user.datum.avatar ? filters_functions.dmsLink(user.datum.avatar, [40,'m' ,40]) : '',
                                    label : filters_functions.usertag(user.datum), 
                                    text : filters_functions.username(user.datum), 
                                    id : '@{user:' + user.datum.id + '}' }
                            }); 
                        });
                    }
                    return []
                });
            };
            
            
            
            
            
        }
    ]);