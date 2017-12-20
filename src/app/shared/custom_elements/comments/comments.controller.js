angular.module('customElements').controller('comments_controller',
    ['$scope','session','post_model','user_model','comments_posts','events_service','$translate',
        'notifier_service','$element','report','modal_service','user_like_ids', '$parse', '$attrs',
        function( $scope, session, post_model, user_model, comments_posts, events_service, $translate,
            notifier_service, $element, report, modal_service, user_like_ids, $parse, $attrs ){

            var ctrl = this,parent_id, paginator;
            ctrl.secondLvl = $scope.secondLvl !== false;


            this.toggleLike = function( id ){
                if( !ctrl.isliking[id] ){
                    ctrl.isliking[id] = true;

                    if( post_model.list[id].datum.is_liked ){
                        post_model.unlike( id ).then(function(){
                            ctrl.isliking[id] = false;

                            if( user_like_ids.paginators[id] ){
                                delete(user_like_ids.paginators[id]);
                            }
                        });
                    }else{
                        post_model.like( id ).then(function(){
                            ctrl.isliking[id] = false;

                            if( user_like_ids.paginators[id] ){
                                user_like_ids.paginators[id].outdate();
                            }
                        });
                    }
                }
            };

            this.viewLikes = function( $event, id ){
                if( post_model.list[id].datum.nbr_likes ){
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

            this.isOwner = function( id ){
                return post_model.list[id] && post_model.list[id].datum && session.id === post_model.list[id].datum.user_id;
            };

            this.remove = function( id ){
                var index = ctrl.list.indexOf(id);
                if( index !== -1 ){
                    ctrl.list.splice( index, 1 );
                }

                post_model.remove( id ).then(function(){
                    paginator.unset( id );
                });
            };

            this.edit = function( $event, id ){
                modal_service.open( {
                    template: 'app/shared/custom_elements/post/edit_modal.html',
                    reference: $event.target,
                    scope: {
                        post_id: id,
                        comment: true
                    },
                    label: 'Edit your comment'
                });
            };

            this.report = function( id ){
                report.send( report.types.post, id ).then(function(){
                    $translate('ntf.post_reported').then(function( translation ){
                        notifier_service.add({
                            type:'message',
                            title: translation
                        });
                    });
                },function(){
                    $translate('ntf.err_post_reported').then(function( translation ){
                        notifier_service.add({
                            type:'error',
                            title: translation
                        });
                    });
                });
            };

            this.getTotal = function(){
                return post_model.list[parent_id] && post_model.list[parent_id].datum && post_model.list[parent_id].datum.nbr_comments;
            };

            this.getRemaining = function(){
                return post_model.list[parent_id] && post_model.list[parent_id].datum ?
                    post_model.list[parent_id].datum.nbr_comments - this.list.length:0;
            };

            this.sendComment = function(){
                if( ctrl.newcomment ){
                    var text = ctrl.newcomment;
                    ctrl.newcomment = '';

                    ctrl.addingcmt = true;

                    // IF LISTENING -> CLEAR BLOCKERS IF USER ADD A COMMENT.
                    if( ctrl.listening ){
                        ctrl.streamblockers = 0;
                    }

                    comments_posts.addComment( parent_id, text ).then(function( cid ){
                        /*$translate('ntf.post_commented').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });*/
                        if( ctrl.list.length ){
                            ctrl.list = paginator.indexes.slice( 0, ctrl.list.length < 3 ? ctrl.list.length+1: ctrl.list.length );
                        }else{
                            var idx = paginator.indexes.indexOf( parseInt(cid) );
                            ctrl.list = paginator.indexes.slice( 0, idx+1 );
                            listenToNotification();
                        }

                        ctrl.addingcmt = false;
                    },function(){
                        ctrl.addingcmt = false;
                    });
                }
            }

            this.onAddCommentKeydown = function( evt ){
                // On ENTER => Send comment.
                if( !evt.shiftKey && evt.keyCode === 13 ){
                    evt.preventDefault();
                    ctrl.sendComment();
                }
            };

            function focusReply(){
                ctrl.replying = true;
                setTimeout(function(){
                    $element[0].querySelector('#reply'+parent_id).focus();
                });
            };

            this.refresh = function(){
                ctrl.new_comments = 0;

                paginator.refresh().then(function(ids){
                    ctrl.list = paginator.indexes.slice(0, ctrl.list.length+ids.length );
                });
            };

            ctrl.next = function(){
                if( !ctrl.list.length ){
                    paginator.refresh().then(function(){
                        listenToNotification();
                        ctrl.list = paginator.indexes.slice( 0, 5 );
                    });
                }else{
                    var futureSize = ctrl.list.length + 5;

                    if( paginator.indexes.length >= futureSize ){
                        ctrl.list = paginator.indexes.slice( 0, futureSize );
                    }else{
                        paginator.next().then(function(){
                            ctrl.list = paginator.indexes.slice( 0, futureSize );
                        });
                    }
                }
            };

            this.hideAll = function(){
                ctrl.list=[];
                ctrl.new_comments = 0;
                ctrl.streamblockers = 0;
                stopListening();
            };

            ctrl.stream = function(){
                if( ctrl.streamblockers > 0 ){
                    ctrl.streamblockers--;
                }

                if( ctrl.streamblockers === 0 ){
                    ctrl.new_comments = 0;
                    stream();
                }
            };

            ctrl.unstream = function(){
                ctrl.streamblockers++;
            };

            ctrl.init = function(){
                parent_id = $scope.parent_id,
                paginator = comments_posts.getPaginator( parent_id );
                this.list = [];
                this.loaded = false;
                this.replyer = {};
                this.isliking = {};
                this.streamblockers = 0;
                this.new_comments = 0;

                if( $scope.showlast ){
                    ctrl.next();
                }
            }.bind(this);

            if($parse($attrs.init).assign){
                $scope.init = ctrl.init;
            }

            // POPULATE SCOPE
            $scope.users = user_model.list;
            $scope.posts = post_model.list;
            $scope.session = session;

            // SET REPLY SCOPE FUNCTION
            $scope.reply = focusReply;

            // LOAD
            this.init();

            // REMOVE EVENT LISTENERS ON DESTROY
            $scope.$on('$destroy', function(){
                stopListening();
            });

            // LISTENING FUNCTIONS
            function listenToNotification(){
                if( $scope.unstream ){
                    $scope.unstream();
                }
                if( !ctrl.listening ){
                    ctrl.listening = events_service.on('post.com', onPostCom );
                }
            }

            function stopListening(){
                if( ctrl.listening ){
                    if( $scope.stream ){
                        $scope.stream();
                    }
                    events_service.off('post.com', ctrl.listening );
                    ctrl.listening = undefined;
                }
            }

            // WHEN A NEW COMMENT NTF IS RECEIVED
            function onPostCom( evt ){
                var ntf_post = evt.datas[0].object;

                console.log('ON POST COM', ntf_post );

                if( ntf_post.data.parent_id === parent_id ){
                    if( ctrl.streamblockers === 0 ){
                        stream();
                    }else{
                        ctrl.new_comments++;
                        $scope.$evalAsync();
                    }
                }
            }

            function stream(){
                if( !ctrl.addingcmt ){
                    paginator.refresh().then(function(){
                        ctrl.list = paginator.indexes.slice( 0, ctrl.list.length < 3 ? ctrl.list.length+1: ctrl.list.length );
                    });
                }
            }
        }
    ]);
