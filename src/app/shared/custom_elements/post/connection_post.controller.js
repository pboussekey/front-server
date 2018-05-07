angular.module('customElements').controller('connection_post_controller',
    ['$scope','notifier_service','connections','user_model','session','filters_functions','feed','events_service','$translate',
        function( $scope, notifier_service, connections, user_model, session, filters_functions, feed, events_service, $translate ){

            this.has_actions = false;
            this.loaded = false;

            var ctrl = this,
                post = $scope.p,
                step = 1,
                canBuild = function(){
                    step--;
                    if( !step ){
                        build();
                    }
                },
                states = {
                    requested: 'request',
                    accepted: 'accept'
                };

            /* IF CONTACT NOT LOADED => WAIT CONTACT LOADING
            if( user_model.list[post.datum.data.contact].promise ){
                step++;
                user_model.list[post.datum.data.contact].promise.then( canBuild );
            }
            // IF USER NOT LOADED => WAIT USER LOADING
            if( user_model.list[post.datum.data.user].promise ){
                step++;
                user_model.list[post.datum.data.user].promise.then( canBuild );
            }*/
            connections.load().then( canBuild );

            // --- ACTIONS --- \\
            ctrl.acceptRequest = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    connections.accept( ctrl.contact ).then(function(){
                        ctrl.requesting = false;
                        //build();
                        var model = user_model.list[ctrl.contact].datum;
                        $translate('ntf.is_now_connection',{username:model.nickname || (model.firstname+' '+model.lastname)}).then(function( translation ){
                            notifier_service.add({ type:'message', message: translation });
                        });
                    });
                }
            };

            ctrl.declineRequest = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    connections.decline( ctrl.contact ).then(function(){
                        ctrl.requesting = false;
                        //feed.unset( post.datum.id );

                        var model = user_model.list[ctrl.contact].datum;
                        $translate('ntf.co_req_refused',{username:model.nickname || (model.firstname+' '+model.lastname)}).then(function( translation ){
                            notifier_service.add({ type:'message', message: translation });
                        });
                    });
                }
            };
            // Hide post.
            this.hide = function(){
                post_model.hide( id );
            };

            // UPD STATE
            function updateState(){
                if( ctrl.contact ){
                    var state = connections.getUserState( ctrl.contact );

                    if( state === connections.states.unconnected ){
                        feed.unset( post.datum.id );
                    }else if( state === connections.states.connected ){
                        build();
                    }
                }
            }

            // --- BUILD --- \\
            function build(){
                ctrl.has_actions = false;

                // IF STATE IS REQUESTED AND USER & CONTACT ALREADY IN CONTACT -> SET STATE TO ACCEPTED.
                if( post.datum.data.state === states.requested ){
                    var contact_id = session.id === post.datum.data.contact ? post.datum.data.user : post.datum.data.contact;

                    if( connections.getUserState(contact_id) === connections.states.connected ){
                        post.datum.data.state = states.accepted;
                    }
                }

                // IF STATE IS ACCEPTED.
                if( post.datum.data.state === states.accepted ){
                    // IF WE'RE POST USER OR CONTACT
                    if( session.id === post.datum.data.contact || session.id === post.datum.data.user ){
                        ctrl.contact = session.id === post.datum.data.contact? post.datum.data.user:post.datum.data.contact;
                        ctrl.text = 'is now connected to you';
                    }
                    // IF NOT ...
                    else{
                        ctrl.contact = post.datum.data.user;
                        ctrl.text = filters_functions.extrapole(
                            'is now connected to #1',
                            filters_functions.username( user_model.list[post.datum.data.contact].datum )
                        );
                    }
                }
                // IF STATE IS REQUESTED.
                else if( post.datum.data.state === states.requested ){
                    if( session.id === post.datum.data.user ){
                        ctrl.contact = post.datum.data.contact;
                        ctrl.text = 'Contact request sent';
                    }else{
                        ctrl.has_actions = true;
                        ctrl.contact = post.datum.data.user;
                        ctrl.text = 'Sent you a connection request';

                        events_service.on('connectionState#'+ctrl.contact, updateState);
                    }
                }

                ctrl.loaded = false;
            }

            $scope.$on('$destroy',function(){
                if( ctrl.contact ){
                    events_service.off('connectionState#'+ctrl.contact, updateState);
                }
            });

        }
    ]);
