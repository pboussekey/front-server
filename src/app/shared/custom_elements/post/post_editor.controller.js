angular.module('customElements').controller('post_editor_controller',
    ['$scope','post_model','notifier_service','upload_service','api_service',
    '$translate', 'filters_functions', 'community_service', 'user_model',
    'session', 'page_model', 'pages_config', 'puadmin_model',
        function( $scope, post_model, notifier_service, upload_service, api_service,
          $translate, filters_functions, community_service, user_model,
          session, page_model, pages_config, puadmin_model ){

            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                id = $scope.id,
                post = post_model.list[id || $scope.sharedId].datum;

            ctrl.pages = page_model.list;
            ctrl.pages_config = pages_config;
            ctrl.me = user_model.list[session.id];
            ctrl.icons = {
                event : pages_config.event.fields.logo.icon,
                group : pages_config.group.fields.logo.icon,
                course : pages_config.course.fields.logo.icon,
                organization : pages_config.organization.fields.logo.icon
            };

            var loading = 2;
            function load(){
                loading--;
                if(!loading && ctrl.targets.length){
                   ctrl.setTarget(ctrl.targets[0]);
                }
            }
            if($scope.sharingType === 'page'){
                ctrl.targets = [];
                community_service.pages( null, null, null,
                   ['event','group', 'course'], null, null, null, null,
                   null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id).then(function(pages){
                   if(pages.count > 0){
                       page_model.queue(pages.list);
                       ctrl.targets = ctrl.targets.concat(pages.list);
                   }
                   load();

               });
               community_service.pages( null, null, null,
                   'organization', null, null, null, null,
                   null, {"page$last_post":"DESC", "page$id" : "DESC"}, session.id, true).then(function(pages){
                   if(pages.count > 0){
                       page_model.queue(pages.list);
                       ctrl.targets = pages.list.concat(ctrl.targets);
                   }
                   load();
               });

            }
            ctrl.editedPost =  {
                id: $scope.sharedId ? "" : id,
                content: $scope.sharedId ? "" : post.content,
                link: $scope.sharedId ? "" : post.link,
                link_title: $scope.sharedId ? "" : post.link_title,
                link_desc: $scope.sharedId ? "" : post.link_desc,
                picture: $scope.sharedId ? "" : post.picture,
                shared_id: $scope.sharedId ? $scope.sharedId : ""
            };

            ctrl.attachments = post.docs ? post.docs.concat(post.images||[], post.audios||[], post.videos||[]):[];

            ctrl.closeModal = function(e){
                e.preventDefault();
                $scope.close();
            };
            this.setTarget = function(id){
                ctrl.editedPost.t_page_id = id;
                ctrl.loading = true;
                puadmin_model.get([id]).then(function(){
                    if(puadmin_model.list[id].datum.indexOf(session.id) === -1){
                          ctrl.is_announcement = false;
                          ctrl.is_target_admin = false;
                      }
                      else{
                          ctrl.is_target_admin = true;
                      }
                      ctrl.loading = false;
                });
            };

            this.update = function(){
                // Check if post not empty & not already sending
                if( ctrl.canSend() &&
                    (ctrl.editedPost.link || ctrl.getContent().trim() || ctrl.attachments.length) ){

                    ctrl.sending = true;

                    var post = Object.assign({},ctrl.editedPost);
                    post.content = ctrl.getContent().trim();

                    // SET ATTACHMENTS DATAS
                    post.docs = [];
                    if( ctrl.attachments.length ){
                        ctrl.attachments.forEach(function( a ){
                            post.docs.push({token:a.token,name:a.name,type:a.type});
                        });
                    }
                    if(ctrl.is_announcement){
                       post.page_id = post.t_page_id;
                    }
                    post_model.add( post ).then(function(){
                        $translate($scope.sharedId ? 'ntf.post_shared':'ntf.post_updated').then(function( translation ){
                            notifier_service.add({type:'message',message: translation});
                        });

                        ctrl.sending = false;
                        $scope.close();
                        if($scope.onvalidation){
                            $scope.onvalidation();
                        }
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
                return !ctrl.loading && !ctrl.sending && ( !ctrl.attachments.length || ctrl.attachments.every(function(a){ return a.token; }) );
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
                return community_service.users(search, 1, 3, [session.id], null, null, null, null, { type : 'affinity' }, null, null, true).then(function(users){
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
