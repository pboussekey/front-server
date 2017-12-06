angular.module('app_social').controller('conversation_panels_controller',
    ['$scope','$element','events_service','upload_service','social_service','session','filters_functions','user_model','conversations',
        function( $scope, $element, events_service, upload_service, social_service, session, filters_functions, user_model, conversations ){
            var ctrl = this,
                cvnWidth = 325,
                panWidth = 225;
            
            ctrl.reduced = true;
            ctrl.displayed_conversations = [];
            ctrl.minified_conversations = [];
            ctrl.hasUnreads = function(){
                return ctrl.minified_conversations.some(function( cvn ){
                    if( cvn.id ){
                        if( cvn.type === 1 && conversations.channel_unreads.indexOf(cvn.id) !== -1 ){
                            return true;
                        }else if( cvn.type === 2 && conversations.conversation_unreads.indexOf( cvn.id ) !== -1 ){
                            return true;
                        }else if( cvn.type === 2 ){
                            return Object.keys( conversations.connection_unreads ).some(function(uid){
                                return conversations.connection_unreads[uid]+'' === cvn.id+'';
                            });
                        }
                    }
                })?true:undefined;
            };
            
            ctrl.isUnread = function( cvn ){
                if( cvn.id ){
                    if( cvn.type === 1 && conversations.channel_unreads.indexOf(cvn.id) !== -1 ){
                        return true;
                    }else if( cvn.type === 2 && conversations.conversation_unreads.indexOf( cvn.id ) !== -1 ){
                        return true;
                    }else if( cvn.type === 2 ){
                        return Object.keys( conversations.connection_unreads ).some(function(uid){
                            return conversations.connection_unreads[uid]+'' === cvn.id+'';
                        })?true:undefined;
                    }
                }
            };
            
            ctrl.openConversation = function( cvn ){
                social_service.openConversation( cvn );
            };
            
            ctrl.printName = function( cvn ){
                var name = '';

                (cvn.users || []).forEach(function(id){
                    if( session.id !== id ){
                        name += filters_functions.username( user_model.list[id].datum )+', ';
                    }
                });

                return name.slice(0,-2);
            };
            
            ctrl.avatarStyle = function( cvn ){
                if( cvn.type === 2 && cvn.users.length === 2 ){
                    var connection;
                    
                    cvn.users.some(function(id){
                        if( id !== session.id ){
                            connection = user_model.list[id];
                            return true;
                        }
                    });

                    return filters_functions.dmsBgUrl( connection.datum.avatar, [80,'m',80] );
                }
            };
            
            ctrl.avatarLetter = function( cvn ){
                if( cvn.type === 2 && cvn.users.length === 2 ){
                    var connection;
                    
                    cvn.users.some(function(id){
                        if( id !== session.id ){
                            connection = user_model.list[id];
                            return true;
                        }
                    });

                    return filters_functions.userletter( connection.datum );
                }
            };            
            
            ctrl.getCvnPositionStyle = function( index ){
                return { right: (index*cvnWidth)+'px' };
            };
            
            build();            
            
            events_service.on('social.conversation.open', onConversationOpen);            
            events_service.on('social.conversation.close', onConversationClose);            
            events_service.on('social.column_state_change', onColumnStateChange);
            
            window.addEventListener('resize', onresize);
            
            // ON DESTROY REMOVE EVENTS LISTENERS !
            $scope.$on('$destroy', function(){
                window.removeEventListener('resize', onresize);
                events_service.on('social.column_state_change', onColumnStateChange );
                events_service.off('social.conversation.close', onConversationClose);
                events_service.off('social.conversation.open', onConversationOpen);
            });
            
            function onColumnStateChange(){
                setTimeout( function(){ 
                    build(); 
                    $scope.$evalAsync();
                }, 350 ); 
            }
            
            function onConversationOpen(e){
                var cvn = e.datas[0],
                    idx = ctrl.displayed_conversations.indexOf( cvn );
                    
                if( idx !== -1 ){    
                    ctrl.displayed_conversations.splice(idx,1);
                }
                
                ctrl.displayed_conversations.unshift( cvn );
                
                build();
                $scope.$evalAsync();
            }
            
            function onConversationClose(e){
                var cvn = e.datas[0],
                    idx = ctrl.displayed_conversations.indexOf( cvn );
                    
                if( idx !== -1 ){
                    ctrl.displayed_conversations.splice( idx, 1);
                }
                
                build();
            }
            
            function onresize(){
                build();
                $scope.$evalAsync();
            }
            
            function build(){
                var total_width = $element[0].querySelector('#cvn-panels').getBoundingClientRect().width,
                    nbVisible = social_service.list.length+1;
                    
                // CHECK IF WE HAVE TO MINIFY SOME CONVERSATIONS
                if( total_width < cvnWidth*social_service.list.length ){
                    nbVisible = Math.floor( ( total_width - panWidth ) / cvnWidth );
                    
                    if( ctrl.displayed_conversations.length > nbVisible ){
                        ctrl.displayed_conversations.splice( nbVisible, ctrl.displayed_conversations.length-nbVisible );
                    }
                }
                
                ctrl.minified_conversations = [];
                
                social_service.list.forEach(function( cvn ){
                    var idx = ctrl.displayed_conversations.indexOf(cvn);
                    
                    if( ctrl.displayed_conversations.length < nbVisible && idx === -1 ){
                        ctrl.displayed_conversations.push(cvn);
                    }else if( idx === -1 ){
                        ctrl.minified_conversations.push(cvn);
                    }
                });
            }
            
        }
    ]);