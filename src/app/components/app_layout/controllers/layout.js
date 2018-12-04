angular.module('app_layout').controller('layout_controller',
    ['$scope','session','user_model', 'page_model', 'user_courses',
        'connections','account','notifier_service', '$translate', 'welcome_service',
        'modal_service', 'page_modal_service','social_service','events_service',
        'global_search', 'notifications_service','conversations','events', 'filters_functions',
        'state_service', 'oadmin_model', 'pages_config', 'global_loader',
        function( $scope, session, user_model, page_model, user_courses,
        connections, account, notifier_service, $translate, welcome_service,
        modal_service, page_modal_service, social_service, events_service,
        global_search, notifications_service, conversations, events, filters_functions,
        state_service, oadmin_model, pages_config, global_loader){

            var ctrl = this;
            ctrl.pages_config = pages_config;
            ctrl.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
            this.tpl = {
                header: 'app/components/app_layout/tpl/header.html',
                mobile_header: 'app/components/app_layout/tpl/mobile_header.html',
                desktop_header: 'app/components/app_layout/tpl/desktop_header.html',
                confirm: 'app/shared/elements/confirm/modal.html'
            };

            this.notifications = notifications_service;
            notifications_service.init();
            this.isStudnetAdmin = session.roles[1];
            ctrl.state_service = state_service;
            user_model.get([session.id]).then(function(){
                var me = user_model.list[session.id].datum;
                if(!me.welcome_date){
                    welcome_service.init();
                }
            });
            oadmin_model.queue([session.id]).then(function(){
                ctrl.can_create_course = session.id && ( session.roles[1] || oadmin_model.list[session.id].datum.length );
            });
            function openSettings(){
                modal_service.open({
                    label: 'Settings',
                    template: 'app/shared/custom_elements/settings/modal.html',
                    reference: document.activeElement,
                    scope : {
                        email : session.email
                    }
                });
            }

            this.openSF = function(){
                openSettings();
                $scope.$evalAsync();
            };

            if(session.organization_id){
                page_model.queue([session.organization_id]).then(function(){
                    ctrl.organization = page_model.list[session.organization_id];
                });
            }

            user_courses.load([session.id], true).then(function(){
                this.courses  = user_courses;
            }.bind(this));

            this.session = session;
            this.users = user_model.list;
            this.pages = page_model.list;

            this.global_search = global_search;
            this.global_loader = global_loader;

            this.openPageModal = function($event, type, page){
                page_modal_service.open( $event, type, page);
            };

            this.logout = function(){
                account.logout();
            };

            ctrl.notifAction = notifications_service.notifAction;

            ctrl.openMobileConversations = function(){
                social_service.openMobile();
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

            ctrl.stores = CONFIG.stores;
            ctrl.messengerModal = function(){
                modal_service.open({
                    template: 'app/components/app_layout/tpl/messengermodal.html',
                    scope:{
                        appstore_url : CONFIG.stores.messenger.appstore,
                        googleplay_url : CONFIG.stores.messenger.googleplay,
                    },
                    reference: document.activeElement
                });
            };

            this.support = function(){

                user_model.get([session.id]).then(function(){
                    var user = user_model.list[session.id].datum;

                    if( drift.api ){
                        toggleHelp();
                    }else{
                        drift.on('ready', function(){
                            toggleHelp();
                        });
                    }

                    function toggleHelp(){
                        drift.api.sidebar.toggle();
                        drift.api.setUserAttributes({
                            email: user.email,
                            nickname: user.firstname + ' ' + user.lastname + ' (' + filters_functions.username(user) +')',
                        });
                    }
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

            var previous = 0;
            window.addEventListener('scroll', function(){
                var scrolled = this.scrolled;
                var body = document.querySelector("#body");

                this.scrolled = window.scrollY > 200;

                events_service.process('window.scrolled');
                if( this.scrolled !== scrolled ){
                    $scope.$evalAsync();
                }
            }.bind(this), { passive : true });


            // SOCIAL COLUMN STUFF: Expose social service & eval scope on state change.
            this.social = social_service;

            events_service.on(events.notification_received, evalAsync);
            events_service.on(events.user_follow, reloadUser);
            events_service.on(events.user_unfollow, reloadUser);

            $scope.$on('$destroy', function(){
                events_service.off(events.notification_received, evalAsync);
                events_service.off(events.user_follow, reloadUser);
                events_service.off(events.user_unfollow, reloadUser);
            });

            function evalAsync(){ $scope.$evalAsync(); }
            function reloadUser(e){
                user_model.queue([e.datas[0].data], true);
            }
        }
    ]);
