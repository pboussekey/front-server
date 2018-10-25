angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'session',
             'modal_service', '$timeout', 'notifications', '$state', '$q', 'user_model', 'page_model', 'post_model',
        function(filters_functions, pages_config, session,
                modal_service, $timeout, notifications, $state, $q, user_model, page_model, post_model){
            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 'post.tag', 'post.share',
                     'connection.accept','connection.request', 'page.invited'],
                academic_types:['page.member', 'item.publish', 'item.update', 'page.doc'],
                page_users_updates_types:['page.member', 'page.invited', 'page.pending', 'pageuser.delete'],
                unread_notifications: 0,
                list : [],
                icons : {
                    "connection.accept" : function(notification){
                          return "i-user";
                    },
                    "post.create": function(notification){
                        return "i-pencil";
                    },
                    "post.com": function(notification){
                        return "i-comment-alt";
                    },
                    "post.share": function(notification){
                        return "i-share";
                    },
                    "page.member":
                    function(notification){
                        return pages_config[notification.object.data.page.type].fields.logo.icon;
                    },
                    "page.invited":
                    function(notification){
                        return pages_config[notification.object.data.page.type].fields.logo.icon;
                    },
                    "page.pending":
                    function(notification){
                        return pages_config[notification.object.data.page.type].fields.logo.icon;
                    },
                    "post.like":
                    function(notification){
                        return "i-heart";
                    },
                    "post.tag":
                    function(notification){
                        return "i-at";
                    },
                    "item.publish": function(notification){
                        return "i-assignment";
                    },
                    "item.update": function(notification){
                        return "i-assignment";
                    },
                    "page.doc": function(notification){
                        return "i-assignment";
                    }
                },
                texts: {
                    /*"user.update": function(notification){
                        return filters_functions.username(notification.source.data, true) + " has an updated profile";
                    },*/
                    "connection.accept" : function(notification){
                          return "<b>" + filters_functions.username(notification.source.data, true) + "</b> is now connected to you";
                    },
                    "post.create": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b>"
                         + (notification.page ? (" posted in <b>" + notification.page.title + "</b>") : " just posted")
                         + (notification.object.data.content ? " : &laquo;" + filters_functions.limit(notification.object.data.content, 50)+ "&raquo;" : "");
                    },
                    "post.com": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> commented"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : "")
                         + (notification.post_user && notification.post_user.id === session.id  && notification.post_user.id === notification.source.id ? (" on") : "")
                         + (notification.post_user && notification.post_user.id === session.id  && !notification.page ? (" on your post") : "")
                         + (notification.post_user && notification.post_user.id !== session.id && notification.post_user.id != notification.source.id  && !notification.page ? (" on <b>" + filters_functions.username(notification.post_user) + "</b>'s post") : "")
                         + (notification.object.data.content ? " : &laquo;" + filters_functions.limit(notification.object.data.content, 50)+ "&raquo;" : "");
                    },
                    "post.share": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> shared a post"
                         + (notification.post_user && !notification.page && notification.post_user.id != notification.source.id ? (" of <b>" + filters_functions.username(notification.post_user) + "</b>") : "");
                    },
                    "page.member":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> enrolled you in a new " + label;
                    },
                    "page.invited":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> invited you to join " + (label === 'event' ? "an " : "a ") + label;
                    },
                    "page.pending":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> requested to join your " + label;
                    },
                    "post.like":
                    function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> liked"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : "")
                         + (notification.post_user && notification.post_user.id === session.id  && !notification.page ? (" one of your post") : "")
                         + (notification.post_user && notification.post_user.id === notification.source.id  && !notification.page ? (" a post") : "")
                         + (notification.post_user && !notification.page && notification.post_user.id !== notification.source.id && notification.post_user.id !== session.id ? (" a post of <b>" + filters_functions.username(notification.post_user) + "</b>") : "");
                    },
                    "post.tag":
                    function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> mentionned you in a post"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : "");
                    },
                    "item.publish": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> published a new item"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : " in one of your course");
                    },
                    "item.update": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> updated an item"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : " in one of your course");
                    },
                    "page.doc": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> added a new material"
                         + (notification.page ? (" in <b>" + notification.page.title + "</b>") : " in one of your course");
                    }
                },
                notify : function(ntf){
                    if(service.texts[ntf.event]){
                        var icon = ntf.source.data.avatar ? filters_functions.dmsLink(ntf.source.data.avatar, [80,'m',80]) : "";
                        service.desktopNotification(
                            ntf.nid,
                            'TWIC',
                            service.texts[ntf.event](ntf),
                            icon,
                            function(e) {
                                service.notifAction(ntf);
                            }
                        );
                    }
                    if(!ntf.page && ntf.object.data.t_page_id){
                        page_model
                    }
                },
                clearEvents : function(){
                    service.list = [];
                    service.unread_notifications = 0;
                },
                read : function(){
                    notifications.read();
                    service.unread_notifications = 0;
                    service.list.forEach(function(ntf){
                        ntf.read_date = new Date();
                    });
                },
                notifAction : function( ntf, $event ){
                    if($event){
                      $event.stopPropagation();
                    }
                    if(!ntf.read_date){
                        ntf.read_date = new Date();
                        service.unread_notifications--;
                        notifications.read(ntf.id);
                    }
                    if(service.post_update_types.indexOf(ntf.event) !== -1){
                        var ref = document.activeElement;
                        if(!$event || ($event && document.querySelector('#dktp-header').contains( $event.target )) ){
                            ref = document.querySelector('#desktopntf');
                        }
                        $timeout(function(){
                            modal_service.open({
                                label: '',
                                template: 'app/shared/custom_elements/post/view_modal.html',
                                scope:{
                                    id:  ntf.object.origin_id || ntf.object.id,
                                    ntf: ntf,
                                    notifications: service
                                },
                                reference: ref
                            });
                        });
                    }
                    else if(service.academic_types.indexOf(ntf.event) !== -1){
                        var states = {
                            'item.publish' : 'lms.page.content',
                            'item.update' : 'lms.page.content',
                            'page.doc' : 'lms.page.resources'
                        };
                        var type = 'course';
                        var id = ntf.object.page_id;
                        if(ntf.object.data.page){
                            type = ntf.object.data.page.type;
                            id = ntf.object.data.page.id;
                        }
                        $state.go(states[ntf.event] || 'lms.page', { type : type, id : id, item_id : ntf.object.item_id, library_id : ntf.object.library_id });
                    }
                },
                desktopNotification : function(id, text, body, icon, onclick){
                  if ("Notification" in window) {
                        var n = new Notification(
                          text || '',
                          { icon : icon, tag : id, body : body || '' }
                        );
                        if(onclick){
                            n.onclick = onclick;
                        }
                    }
                },
                requestPermission : function(){
                    if ("Notification" in window) {
                        Notification.requestPermission(function (status) {
                             if (Notification.permission !== status) {
                                Notification.permission = status;
                             }
                        });
                    }
                },
                notificationsStatus : function(){
                    if (!("Notification" in window)) {
                        return 'denied';
                    }
                    else{
                        return Notification.permission;
                    }
                },
                initNotif : function(ntf){
                    var promises = [];
                    if(ntf.object.data.user_id){
                        promises.push(user_model.queue([ntf.object.data.user_id]).then(function(){
                            ntf.post_user = user_model.list[ntf.object.data.user_id].datum;
                            return true;
                        }));
                    }
                    if(ntf.object.data.t_page_id){
                        promises.push(page_model.queue([ntf.object.data.t_page_id]).then(function(){
                            ntf.page = page_model.list[ntf.object.data.t_page_id].datum;
                            return true;
                        }));
                    }
                    if(service.post_update_types.indexOf(ntf.event) !== -1){
                        promises.push(post_model.queue([ntf.object.id]).then(function(){
                            ntf.post = post_model.list[ntf.object.id].datum;
                            if(ntf.post.picture){
                                ntf.picture = ntf.post.picture;
                            }
                            else if(ntf.post.images && ntf.post.images.length){
                                var image = ntf.post.images.find(function(doc){
                                  return doc.type.indexOf('image') === 0;
                                });
                                if(image){
                                    ntf.picture = filters_functions.dmsLink(image.token, [80, 'm', 80]);
                                }
                            }
                            return true;
                        }));
                    }
                    if(ntf.object.origin_id){
                        promises.push(post_model.queue([ntf.object.origin_id]).then(function(){
                            ntf.origin = post_model.list[ntf.object.origin_id].datum;
                            if(!ntf.picture){
                                if(ntf.origin.picture){
                                    ntf.picture = ntf.origin.picture;
                                }
                                else if(ntf.origin.images && ntf.origin.images.length){
                                    var image = ntf.origin.images.find(function(doc){
                                      return doc.type.indexOf('image') === 0;
                                    });
                                    if(image){
                                        ntf.picture = filters_functions.dmsLink(image.token, [80, 'm', 80]);
                                    }
                                }
                            }
                            return user_model.queue([ntf.origin.user_id]).then(function(){
                                ntf.post_user = user_model.list[ntf.origin.user_id].datum;
                                return true;
                            });
                        }));
                    }
                    if(ntf.object.data.picture){
                        ntf.picture = ntf.object.data.picture;
                    }

                    return $q.all(promises).then(function(){
                        ntf.inited = true;
                        return true;
                    });
                }
            };
            service.init = function(){
                service.clearEvents();
                notifications.getUnreadCount().then(function(count){
                    service.unread_notifications = count;
                });
                notifications.get().then(function(){
                    notifications.list.forEach(service.initNotif);
                    service.list = notifications.list;
                    service.count = notifications.count;
                });
            };

            var loading;
            service.next = function(){
                if(loading){
                    return;
                }
                loading= true;
                var notif_length = notifications.list.length;
                notifications.next().then(function(){
                    notifications.list.forEach(service.initNotif);
                    loading = notif_length === notifications.list.length;
                });
            };
            return service;
    }]);
