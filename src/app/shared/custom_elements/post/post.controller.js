angular.module('customElements').controller('post_controller',
    ['$scope','session','post_model','user_model','feed','notifier_service','page_model','item_submission_model',
        'report','docslider_service','modal_service','user_like_ids','$translate','items_model', 'pages_config',
        '$location', '$anchorScroll', 'puadmin_model', 'notifications_service',
        function( $scope, session, post_model, user_model, feed, notifier_service, page_model, item_submission_model,
            report, docslider_service, modal_service, user_like_ids, $translate, items_model, pages_config,
            $location, $anchorScroll, puadmin_model, notifications_service ){

            // POPULATE SCOPE
            $scope.users = user_model.list;
            $scope.pages = page_model.list;
            $scope.items = items_model.list;
            $scope.pages_config = pages_config;
            $scope.me = session.id;
            var ctrl = this,
                urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
                id = $scope.id,
                options = {
                    com:{ label:'commented on this', icon:''},
                    like: { label:'liked this', icon:''},
                    tag: { label:'mentionned you', icon:''},
                    update: { label:'updated this'}
                },
                step = 1,
                canLoad = function(){
                    step--;
                    if( !step ){
                        build();
                        ctrl.loaded = true;
                    }
                };

            // LOAD
            this.loaded = false;

            function userCanBeGet(){
                return ( ctrl.post.datum.type !== 'page' || !ctrl.post.datum.subscription
                    || ( ctrl.post.datum.subscription.action !== 'invited'
                        && ctrl.post.datum.subscription.action !== 'member' ) );
            }

            // GET POST DATAS => POPULATE MODELS
            post_model.queue([id]).then(function(){
                ctrl.post = post_model.list[id];

                if( !ctrl.post || !ctrl.post.datum ){
                    if($scope.onremove){
                      $scope.onremove( id );
                    }
                    ctrl.unavailable = true;
                    ctrl.hide();
                    return;
                }
                if(ctrl.post.datum.shared_id){
                  post_model.queue([ctrl.post.datum.shared_id]).then(function(){
                      if(!post_model.list[ctrl.post.datum.shared_id]){
                          ctrl.sharing_unavailable = true;
                      }
                  });
                }

                var users = [],
                    pages = [];

                if( ctrl.post.datum.user_id && userCanBeGet() ){
                    users.push( ctrl.post.datum.user_id );
                }

                if( ctrl.post.datum.subscription && ctrl.post.datum.subscription.user_id && userCanBeGet() ){
                    users.push(ctrl.post.datum.subscription.user_id);
                }

                if( ctrl.post.datum.data ){
                    if( ctrl.post.datum.data.user ){
                        users.push(ctrl.post.datum.data.user);
                    }
                    if( ctrl.post.datum.data.contact ){
                        users.push(ctrl.post.datum.data.contact);
                    }
                    if( ctrl.post.datum.data.page ){
                        pages.push(ctrl.post.datum.data.page);
                    }
                }

                if( ctrl.post.datum.t_page_id ){
                    pages.push(ctrl.post.datum.t_page_id);
                }
                if( ctrl.post.datum.page_id ){
                    pages.push(ctrl.post.datum.page_id);
                    puadmin_model.get([ctrl.post.datum.page_id]).then(function(){
                        $scope.is_admin = puadmin_model.list[ctrl.post.datum.page_id]
                              .datum.indexOf(session.id) !== -1;
                    });
                }
                if( ctrl.post.datum.item_id ){
                    step++;
                    items_model.queue([ctrl.post.datum.item_id]).then(canLoad);

                    if( ctrl.post.datum.type === 'submission' ){
                        step++;
                        item_submission_model.get([ctrl.post.datum.item_id]).then(canLoad);
                    }
                }

                user_model.queue(users).then(function(){
                    users.forEach(function(uid){
                        if( user_model.list[uid] && user_model.list[uid].datum && user_model.list[uid].datum.organization_id){
                            pages.push( user_model.list[uid].datum.organization_id );
                        }
                    });

                    if( pages.length ){
                        page_model.queue(pages).then(function(){
                            if(ctrl.post.datum.data
                              && ctrl.post.datum.data.page
                              && page_model.list[ctrl.post.datum.data.page]){
                                $scope.page_fields = pages_config[page_model.list[ctrl.post.datum.data.page].datum.type].fields;
                            }
                            $scope.isprivate = pages.some(function(page_id){
                                return page_model.list[page_id] && page_model.list[page_id].datum.confidentiality !== 0;
                            });
                            canLoad();
                        });
                    }else{
                        canLoad();
                    }
                });
            });

            // Check if post is common post
            this.isCommon = function(){
                return ctrl.post && ctrl.post.datum && ctrl.post.datum.type === 'post';
            };

            this.isPagePost = function(){
                return ctrl.post && ctrl.post.datum && ctrl.post.datum.type === 'page';
            };

            ctrl.isSubmissionPost = function(){
                return ctrl.post && ctrl.post.datum && ctrl.post.datum.type === 'submission';
            };

            this.isOwner = function(){
                return ctrl.post && ctrl.post.datum && session.id === ctrl.post.datum.user_id;
            };

            // Check
            this.fromPage = function(){
                return ctrl.isCommon() && !ctrl.post.datum.item_id && ( ctrl.post.datum.t_page_id || ctrl.post.datum.t_organization_id );
            };

            ctrl.fromCourse = function(){
                return ctrl.isCommon() && ctrl.post.datum.item_id;
            };

            this.isAnnouncement = function(){
                return ctrl.isCommon() && !ctrl.post.datum.item_id && ctrl.post.datum.page_id ;
            };

            /*
            this.fromOrg = function(){
                return ctrl.isCommon() && ctrl.post.datum.t_organization_id;
            };*/

            // Update methods
            this.hasUpdate = function(){
                return ctrl.post.datum.subscription &&
                    ( ( ctrl.post.datum.subscription.action === 'update' && ctrl.post.datum.type !== 'user' )
                    || ctrl.post.datum.subscription.action === 'com'
                    || ctrl.post.datum.subscription.action === 'like'
                    || ctrl.post.datum.subscription.action === 'tag' );
            };

            this.getUpdateIcon = function(){
                if( ctrl.hasUpdate() ){
                    return options[ctrl.post.datum.subscription.action].icon;
                }
            };

            this.getUpdateText = function(){
                if( ctrl.hasUpdate() ){
                    return options[ctrl.post.datum.subscription.action].label;
                }
            };

            // Check if this post can be hide. // Unused for the moment, to implement later...
            this.canHide = function(){
                return ctrl.post && ctrl.post.datum &&
                    ( ['connection','user','page'].indexOf(ctrl.post.datum.type) !== -1 );
            };
            // Hide post.
            this.hide = function(){
                post_model.hide( id );
            };

            // Options methods.
            this.hasOptions = function(){
                return ctrl.isCommon();
            };

            this.edit = function( $event ){
                modal_service.open( {
                    template: 'app/shared/custom_elements/post/edit_modal.html',
                    reference: $event.target,
                    scope: {
                        post_id: id
                    },
                    label: 'Edit your post'
                });
            };

            this.share = function( $event, target ){
                modal_service.open( {
                    template: 'app/shared/custom_elements/post/share_modal.html',
                    reference: $event.target,
                    scope: {
                        shared_id : ctrl.post.datum.shared_id || id,
                        target : target,
                        onshare : $scope.onshare
                    },
                    label: 'Share this post'
                });
            };

            this.onSharingClick = function( $event ){
                $event.stopPropagation();


                var ref = document.activeElement;
                if( document.querySelector('#dktp-header').contains( $event.target ) ){
                    ref = document.querySelector('#desktopntf');
                }
                if($event.target.tagName !== 'A'){
                    modal_service.open({
                        label: '',
                        template: 'app/shared/custom_elements/post/view_modal.html',
                        scope:{
                            id: ctrl.post.datum.shared_id,
                            ntf : { event : 'post.share', source : { data : user_model.list[ctrl.post.datum.user_id].datum } },
                            notifications : notifications_service
                        },
                        reference: ref
                    });
                }

            };

            this.viewLikes = function( $event ){
                if( ctrl.post.datum.nbr_likes ){
                    modal_service.open( {
                        template: 'app/shared/custom_elements/post/user_likes/likes_modal.html',
                        reference: $event.target,
                        scope: {
                            post_id: id
                        },
                        label: 'Who liked this?'
                    });
                }
            };

            this.viewSharings = function( $event ){
                if( ctrl.post.datum.nbr_sharings ){
                    modal_service.open( {
                        template: 'app/shared/custom_elements/post/user_likes/sharings_modal.html',
                        reference: $event.target,
                        scope: {
                            post_id: id
                        },
                        label: 'Who shared this?'
                    });
                }
            };

            this.remove = function(){
                post_model.remove( id ).then(function(){

                    $translate('ntf.post_deleted').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });

                    if( $scope.onremove ){
                        $scope.onremove( id );
                    }
                });
            };

            this.report = function(){
                report.send( report.types.post, id ).then(function(){
                    $translate('ntf.post_reported').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });
                },function(){
                    $translate('ntf.err_post_reported').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });
                });
            };

            // Actions.
            this.toggleLike = function(){
                if( !ctrl.is_liking ){
                    ctrl.is_liking = true;

                    if( ctrl.post.datum.is_liked ){
                        post_model.unlike( id ).then(function(){
                            ctrl.is_liking = false;

                            if( user_like_ids.paginators[id] ){
                                delete(user_like_ids.paginators[id]);
                            }
                        });
                    }else{
                        post_model.like( id ).then(function(){
                            ctrl.is_liking = false;

                            if( user_like_ids.paginators[id] ){
                                user_like_ids.paginators[id].outdate();
                            }
                        });
                    }
                }
            };

            this.openPicAndDoc = function( index, evt ){
                var documents = {
                    images: ctrl.post.datum.images,
                    audios: ctrl.post.datum.audios,
                    videos: ctrl.post.datum.videos,
                    docs: ctrl.post.datum.docs
                };

                docslider_service.open( documents, 'View posts documents', evt.target, index );
            };

            this.scrollToPost = function(){
                $location.hash('post_' + ctrl.post.datum.id);
                $anchorScroll();
            };

            function build(){
                // IF ITS COMMON POST & POST HAVE A TOO LONG LINK DESC
                if( ctrl.isCommon() ){

                    if( ctrl.post.datum.link_desc ){
                        ctrl.link_desc = ctrl.post.datum.link_desc;

                        if( ctrl.post.datum.link_desc.length > 200 ){
                            ctrl.link_desc = ctrl.link_desc.slice(0,200).replace(/[^ ]*$/,'[...]');
                        }
                    }

                    if( ctrl.post.datum.picture && !urlRgx.exec(ctrl.post.datum.picture) ){
                        ctrl.post.datum.picture = undefined;
                    }
                }

                /*if( ctrl.post.datum.audios ){
                    ctrl.audios = [];
                    ctrl.post.datum.audios.forEach(function( doc ){
                        ctrl.audios.push( filters_functions.formatDocToMedia(doc) );
                    });
                }*/

                $scope.p = ctrl.post;
                ctrl.loaded = true;
            }

        }
    ]);
