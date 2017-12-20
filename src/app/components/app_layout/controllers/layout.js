angular.module('app_layout').controller('layout_controller',
    ['$scope','session','user_model', 'page_model', 'user_courses',
        'connections','account','notifier_service','users_status', '$translate',
        'modal_service', 'page_modal_service','social_service','events_service',
        'global_search', 'notifications_service','conversations','events', 'filters_functions',
        function( $scope, session, user_model, page_model, user_courses,
        connections, account, notifier_service, users_status, $translate,
        modal_service, page_modal_service, social_service, events_service,
        global_search, notifications_service, conversations, events, filters_functions ){

            var ctrl = this;
            ctrl.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
            this.tpl = {
                aside: 'app/components/app_layout/tpl/aside.html',
                header: 'app/components/app_layout/tpl/header.html',
                mobile_header: 'app/components/app_layout/tpl/mobile_header.html',
                desktop_header: 'app/components/app_layout/tpl/desktop_header.html',
                confirm: 'app/shared/elements/confirm/modal.html'
            };

            this.notifications = notifications_service;
            this.isStudnetAdmin = session.roles[1];

            user_model.queue([session.id]).then(function(){
                // CHECK IF WE HAVE TO OPEN 'STARTFORM'
                var u = user_model.list[session.id].datum;
                if( !u.avatar || !u.firstname || !u.lastname ){
                    openStartForm();
                }
            });

            function openStartForm(){
                modal_service.open({
                    label: 'Tell us about yourself',
                    template: 'app/shared/custom_elements/startform/modal.html',
                    reference: document.activeElement
                });
            }

            this.openSF = function(){
                openStartForm();
                $scope.$evalAsync();
            };

            if(session.organization_id){
                page_model.queue([session.organization_id]);
            }

            connections.load();

            user_courses.load([session.id], true).then(function(){
                this.courses  = user_courses;
            }.bind(this));

            this.session = session;
            this.users = user_model.list;
            this.pages = page_model.list;

            this.connecteds = connections.connecteds;
            this.awaitings = connections.awaitings;
            this.status = users_status.status;
            this.global_search = global_search;

            this.openPageModal = function($event, type, page){
                page_modal_service.open( $event, type, page);
            };

            this.logout = function(){
                account.logout();
            };

            ctrl.closeFullCVN = function(){
                if( social_service.current ){
                    social_service.closeConversation(social_service.current);
                }
            };

            ctrl.notifAction = function( ntf, $event ){
                $event.stopPropagation();
                ntf.read = true;

                var ref = document.activeElement;
                if( document.querySelector('#desktopheader').contains( $event.target ) ){
                    ref = document.querySelector('#desktopntf');
                }

                modal_service.open({
                    label: '',
                    template: 'app/shared/custom_elements/post/view_modal.html',
                    scope:{
                        id: ntf.object.origin_id || ntf.object.id,
                        ntf: ntf,
                        notifications: notifications_service
                    },
                    reference: ref
                });
            };

            ctrl.messagesUnread = function(){
                return conversations.channel_unreads.length
                    + conversations.conversation_unreads.length
                    + Object.keys(conversations.connection_unreads).length;
            };

            ctrl.openMobileConversations = function(){
                social_service.openMobile();
            };

            ctrl.friendRequestModal = function(){
                modal_service.open({
                    label: 'Friend request(s)',
                    template: 'app/components/app_layout/tpl/friendrequestmodal.html',
                    scope:{
                        declineRequest: ctrl.declineRequest,
                        acceptRequest: ctrl.acceptRequest,
                        awaitings: ctrl.awaitings
                    },
                    reference: document.activeElement
                });
            };

            ctrl.notificationsModal = function(){
                modal_service.open({
                    label: 'Your notifications',
                    template: 'app/components/app_layout/tpl/notificationmodal.html',
                    scope:{
                        notifications: ctrl.notifications,
                        notifAction: ctrl.notifAction
                    },
                    reference: document.activeElement
                });
            };

            this.declineRequest = function( id ){
                connections.decline(id).then(function(){
                    var model = user_model.list[id].datum;
                    $translate('ntf.co_req_refused',{username: model.nickname||( model.firstname+' '+model.lastname)}).then(function( translation ){
                        notifier_service.add({type:'message',title: translation});
                    });
                });
            };

            this.acceptRequest = function( id ){
                connections.accept(id).then(function(){
                    var model = user_model.list[id].datum;
                    $translate('ntf.is_now_connection',{username: model.nickname||( model.firstname+' '+model.lastname)}).then(function( translation ){
                        notifier_service.add({type:'message',title: translation});
                    });
                });
            };

            this.support = function(){

                user_model.get([session.id]).then(function(){
                    var user = user_model.list[session.id].datum;

                    linkedchat.name =  user.firstname + ' ' + user.lastname + ' (' + filters_functions.username(user) +')';
                    linkedchat.email = user.email;
                    if(user.avatar){
                        linkedchat.avatar = filters_functions.dmsLink(user.avatar);
                    }
                    linkedchat.titleOpened = "Ask us everything";
                    linkedchat.updateInfo();
                    linkedchat.openChat();

                });
            };

            this.openPageModal = function($event, type, page){
                page_modal_service.open( $event, type, page);
            };

            this.confirm = function($event, question, onsubmit, params, context){
                modal_service.open({
                    template : this.tpl.confirm,
                    reference : $event.target,
                    scope : {
                        question : question,
                        confirm : function(){
                           return onsubmit.apply(context || this, params);
                        }
                    },
                    is_alert : true
                });
            };

            this.backToTop = function(){
                document.body.scrollTop = document.documentElement.scrollTop = 0;
                this.scrolled = false;
            };

            window.addEventListener('scroll', function(){
                this.scrolled = window.scrollY > 200;
                $scope.$evalAsync();
            }.bind(this));


            // SOCIAL COLUMN STUFF: Expose social service & eval scope on state change.
            this.social = social_service;

            events_service.on('social.column_state_change', evalAsync);
            events_service.on(events.notification_received, evalAsync);

            $scope.$on('$destroy', function(){
                events_service.off('social.column_state_change', evalAsync);
            });

            function evalAsync(){ $scope.$evalAsync(); }
        }
    ]);
