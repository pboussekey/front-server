angular.module('customElements').controller('postform_controller',
    ['$scope','session','user_model','post_model','api_service','upload_service',
         'page_model', 'filters_functions', 'resume_model', 'pages_config',
        'user_resumes_model', 'filters_functions', 'pages_constants', 'community_service',
        '$timeout', 'puadmin_model', 'modal_service',
        function( $scope, session, user_model, post_model, api_service, upload_service,
        page_model, filters_functions, resume_model, pages_config,
        user_resumes_model, filters_functions, pages_constants, community_service, $timeout, puadmin_model,
        modal_service){

            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                pageRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/page/([A-Za-z]*)/([0-9]*)'),
                profileRgx = new RegExp('^(https?://)?(www)?' + window.location.hostname + '/profile/([0-9]*)');

            user_model.get([session.id]).then(function(){
                ctrl.user = user_model.list[session.id];
                ctrl.hashtags = [];
                if(ctrl.user.datum.address && ctrl.user.datum.address.city){
                    ctrl.hashtags.push(filters_functions.hashtag(ctrl.user.datum.address.city.name));
                }
                if(ctrl.user.datum.tags && ctrl.user.datum.tags.length){
                    var tags = ctrl.user.datum.tags.sort(function(tag1, tag2){
                        return tag2.weight - tag1.weight;
                    });
                    tags.forEach(function(tag){
                        ctrl.hashtags.push(filters_functions.hashtag(tag.name));
                    });
                }
            });
            ctrl.pages_list = page_model.list;
            ctrl.admins = puadmin_model.list;
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
                ctrl.content = ctrl.getContent();
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
                    if(ctrl.target && ctrl.target.type !== 'user'){
                        post.t_page_id = ctrl.target.id;
                        if(ctrl.is_announcement && ctrl.admins[ctrl.target.id].datum.indexOf(session.id) !== -1){
                          post.page_id = post.t_page_id;
                        }
                    }

                    post_model.add( post ).then(function(){
                        if( $scope.callback ){
                            $scope.callback();
                        }

                        /*$translate('ntf.post_published').then(function( translation ){
                            notifier_service.add({type:'message',message: translation});
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


            this.onContentPaste = function( node, delta ){

                urlRgx.lastIndex = 0;
                var text = node.data,
                    matches = urlRgx.exec( text );
                urlRgx.lastIndex = 0;

                if( matches && ( !ctrl.link || ctrl.link && matches[0] !== ctrl.link.url ) ){
                    var link = { url: matches[0] };
                    ctrl.link = {};
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
                return delta;
            };

            ctrl.onBlur = function(){
                $timeout(function(){
                    if(ctrl.target && !ctrl.target.id){
                        ctrl.selectTarget(null, ctrl.target.type);
                    }
                },200);
            };

            ctrl.insertHashtag = function(hashtag){
                ctrl.focus();
                ctrl.insertText(" #" + hashtag);
                ctrl.hashtags.splice(ctrl.hashtags.indexOf(hashtag), 1);
            };

            function getHint(id){
                var page = page_model.list[id].datum;
                var label = pages_config[page.type].label;
                if(page.type === 'course'){
                    return "Your post will only be visible to course participants.";
                }
                else if(page.confidentiality === 0){
                    return "Your post will be visible to everyone on this "+label+".";
                }
                else if(page.confidentiality === 1){
                    return "Your post will only be visible to "+label+" participants.";
                }
                else{
                    return "Your post will only be visible to "+label+" participants.";
                }
            };

            if($scope.overload && $scope.overload.t_page_id){
                page_model.queue([$scope.overload.t_page_id]).then(function(){
                    var page = page_model.list[$scope.overload.t_page_id].datum;
                    puadmin_model.queue([$scope.overload.t_page_id]);
                    ctrl.target = { type : page.type, id : page.id };
                    ctrl.target.confidentiality =  pages_constants.pageConfidentiality[page.confidentiality];
                    ctrl.target.hint = getHint($scope.overload.t_page_id);
                });
            }

          ctrl.getTitle = function(limit){
                if($scope.placeholder){
                    return $scope.placeholder;
                }
                if(!ctrl.target || ctrl.target.type === 'user'){
                    return 'Post <span class="clear-bold">on</span> your profile';
                }
                var title = 'Post <span class="clear-bold">on</span>' + (ctrl.target.type !== 'organization' ? ctrl.pages_config[ctrl.target.type].label : '');

                return title + ' ' + filters_functions.limit(page_model.list[ctrl.pages[ctrl.target.type]].datum.title, limit ? 40 : false);

            };

            ctrl.searchAt = function(search){
                return community_service.users(search, 1, 5, [session.id], null, null, null, null, { type : 'affinity' }, null, null, true).then(function(users){
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

            // INITIALIZE FORM FIELDS.
            function initFields(){
                ctrl.attachments = [];
                ctrl.content = '';
                ctrl.link = undefined;
            }



        }
    ]);
