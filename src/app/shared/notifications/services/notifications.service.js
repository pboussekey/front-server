angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'session',
             'modal_service', '$timeout', 'notifications', '$state', '$q', 'user_model', 'page_model', 'post_model',
        function(filters_functions, pages_config, session,
                modal_service, $timeout, notifications, $state, $q, user_model, page_model, post_model){

            function loadPost(id){
                var post_infos = {};
                var promises = [];
                return post_model.queue([id]).then(function(){
                    if(post_model.list[id]){
                        post_infos = { post : post_model.list[id].datum };
                        if(post_infos.post.user_id){
                            promises.push(user_model.queue([post_infos.post.user_id]).then(function(){
                                post_infos.user = user_model.list[post_infos.post.user_id].datum;
                            }));
                        }
                        if(post_infos.post.t_page_id){
                            promises.push(page_model.queue([post_infos.post.t_page_id]).then(function(){
                                post_infos.target = page_model.list[post_infos.post.t_page_id].datum;
                            }));
                        }
                        if(post_infos.post.page_id){
                            promises.push(page_model.queue([post_infos.post.page_id]).then(function(){
                                post_infos.page = page_model.list[post_infos.post.page_id].datum;
                            }));
                        }
                        return $q.all(promises).then(function(){
                            return post_infos;
                        });
                    }
                    else{
                        return false;
                    }
                });
            }

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
                    "connection.accept" : function(ntf){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> is now connected to you";
                    },
                    "post.create": function(ntf){
                        //"USER NAME" OR "PAGE NAME" FOR ANNOUNCEMENT
                        return (!ntf.is_announcement ? ("<b>" + filters_functions.username(ntf.source.data, true) + "</b>") : ("<b>" + ntf.initial.page.title + "</b>"))
                         + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page ? (" posted in <b>" + ntf.initial.target.title + "</b>") : " just posted")
                         + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                    },
                    "post.com": function(ntf){
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> "
                         // REPLY OR COMMENT
                         + (ntf.is_reply ? ' replied' : ' commented')
                         // "TO" FOR REPLY, "ON" FOR COMMENT, NOTHING IF THE USER COMMENT OR REPLY TO HIMSELF
                         + (ntf.on_himself || ntf.has_announcement_parent ? "" : (ntf.is_reply ? ' to' : ' on'))
                         // "YOUR" IF YOU ARE THE OWNER OF THE COMMENTED OR REPLIED POST
                         + (ntf.is_comment && !ntf.is_reply && ntf.on_yours && !ntf.is_announcement? ' your post' : "")
                         + (ntf.is_reply && ntf.on_yours && !ntf.is_announcement ? " your comment" : "")
                         // "PAGE NAME" IF THIS IS A COMMENT OF A PAGE'S POST
                         + (ntf.has_announcement_parent ? (" <b>" + ntf.parent.page.title + "</b>'s") : "")
                         // "USER NAME" IF THIS IS A REPLY/COMMENT TO AN USER'S COMMENT/POST
                         + (!ntf.on_himself && !ntf.on_yours && !ntf.has_announcement_parent ? (" <b>" + filters_functions.username(ntf.parent.user) + "'s </b>") : "")
                         // "USER NAME" IF THIS IS A COMMENT TO AN USER'S POST'S
                         + ((ntf.on_yours || ntf.on_himself) && !ntf.has_announcement_parent ? "" : (!ntf.is_reply  ? ' post' : ' comment'))
                          // "IN PAGE NAME" IF THIS POST IS ON A PAGE FEED (BUT NOT FOR PAGE'S POSTS)
                         + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page && ntf.has_announcement_parent !== ntf.is_in_page ? (" in <b>" + ntf.origin.target.title + "</b>") : "")
                          // "POST CONTENT"
                         + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                    },
                    "post.share": function(ntf){
                        //"USER NAME" OR "PAGE NAME" FOR ANNOUNCEMENT
                        return (!ntf.is_announcement ? ("<b>" + filters_functions.username(ntf.source.data, true) + "</b>") : ("<b>" + ntf.initial.page.title + "</b>"))
                         + " shared"
                         //"USER NAME" OR "PAGE NAME" OF THE POST SHARED
                         + (!ntf.has_announcement_share && !ntf.on_himself && !ntf.on_yours ? (" <b>" + filters_functions.username(ntf.shared.user) + "</b>'s post") : (!ntf.has_announcement_share && ntf.on_himself ? " a post" : (!ntf.has_announcement_share && ntf.on_yours ? " your post" : "")))
                         + (ntf.has_announcement_share  ? (" <b>" + ntf.shared.page.title + "</b>'s post") : "")
                         // "IN PAGE NAME" IF IT'S NOT AN ANNOUNCEMENT
                         + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page  ? (" in <b>" + ntf.initial.target.title + "</b>") : "")
                          // "POST CONTENT"
                         + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "")
                    },
                    "page.member":
                    function(ntf){
                        var label = pages_config[ntf.object.data.page.type].label;
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> enrolled you in a new " + label;
                    },
                    "page.invited":
                    function(ntf){
                        var label = pages_config[ntf.object.data.page.type].label;
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> invited you to join " + (label === 'event' ? "an " : "a ") + label;
                    },
                    "page.pending":
                    function(ntf){
                        var label = pages_config[ntf.object.data.page.type].label;
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> requested to join your " + label;
                    },
                    "post.like":
                    function(ntf){
                        //"USER NAME"
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> liked"
                        // "YOUR" IF THIS YOUR POST OR YOUR COMMENT AND IF IT'S NOT AN ANNOUNCEMENT
                         + (ntf.on_yours ? " your" : "")
                         // "USER NAME" IF IT'S NOT AN ANNOUNCEMENT OR ONE OF YOUR POST/COMMENT AND IF THE USER IS NOT LIKING HIMSELF
                         + (!ntf.on_himself && !ntf.on_yours && !ntf.is_announcement ? (" <b>" + filters_functions.username(ntf.initial.user) + "</b>'s") : (ntf.on_himself && !ntf.is_announcement ? " a" : ""))
                         //"PAGE NAME" IF THE POST IS AN ANNOUNCEMENT
                         + (ntf.is_announcement  ? (" <b>" + ntf.initial.page.title + "</b>'s") : "")
                         // IS IT A POST/COMMENT OR REPLY
                         + (ntf.is_reply ? ' reply' : (ntf.is_comment ? ' comment' : ' post'))
                         // IN "PAGE NAME" IF IT'S ON A PAGE
                         + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page  ? (" in <b>" + (ntf.initial.target || ntf.parent.target || ntf.origin.target).title + "</b>") : "");
                    },
                    "post.tag":
                    function(ntf){
                        // "USER NAME" OR "PAGE NAME"
                        return "<b>" +(!ntf.is_announcement ?  filters_functions.username(ntf.source.data, true) : ntf.initial.page.title) + "</b>"
                         + " mentionned you in a post"
                         // IN "PAGE NAME"
                         + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page ? (" in <b>" + (ntf.origin.target || ntf.initial.target).title + "</b>") : "");
                    },
                    "item.publish": function(ntf){
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> published a new item"
                         + (ntf.page ? (" in <b>" + ntf.page.title + "</b>") : " in one of your course");
                    },
                    "item.update": function(ntf){
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> updated an item"
                         + (ntf.page ? (" in <b>" + ntf.page.title + "</b>") : " in one of your course");
                    },
                    "page.doc": function(ntf){
                        return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> added a new material"
                         + (ntf.page ? (" in <b>" + ntf.page.title + "</b>") : " in one of your course");
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
                                    id:  (ntf.origin || ntf.initial).post.id,
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
                    if(service.post_update_types.indexOf(ntf.event) !== -1){
                        return loadPost(ntf.object.id).then(function(post_infos){
                            if(!post_infos){
                                ntf.removed = true;
                                return;
                            }
                            ntf.initial = post_infos;
                            ntf.picture = ntf.initial.page ? ntf.initial.page.logo : ntf.source.data.avatar ;
                            if(ntf.object.data.parent_id){
                                promises.push(loadPost(ntf.object.data.parent_id).then(function(post_infos){
                                    ntf.parent = post_infos;
                                    return;
                                }));
                            }
                            if(ntf.object.data.origin_id){
                                promises.push(loadPost(ntf.object.data.origin_id).then(function(post_infos){
                                    ntf.origin = post_infos;
                                    return;
                                }));
                            }
                            if(ntf.initial.post.shared_id){
                                promises.push(loadPost(ntf.initial.post.shared_id).then(function(post_infos){
                                    ntf.shared = post_infos;
                                    return;
                                }));
                            }
                            return $q.all(promises).then(function(){
                                  ntf.is_comment = (ntf.parent && ntf.parent.post.id !== ntf.initial.post.id && ntf.parent.post.id);
                                  ntf.is_reply =  (ntf.parent && ntf.origin &&  ntf.origin.post.id !== ntf.parent.post.id && ntf.parent.post.id);
                                  ntf.is_announcement = ntf.initial.page && ntf.initial.page.id;
                                  ntf.has_announcement_parent= ntf.parent && ntf.parent.page && ntf.parent.page.id;
                                  ntf.has_announcement_origin= ntf.origin && ntf.origin.page && ntf.origin.page.id;
                                  ntf.has_announcement_share= ntf.shared && ntf.shared.page && ntf.shared.page.id;
                                  ntf.is_in_page = (ntf.initial.target || (ntf.parent && ntf.parent.target) || (ntf.origin && ntf.origin.target) || { id : false}).id;
                                  ntf.content = ntf.initial.post.content;
                                  var ntf_source = ntf.event === 'post.like' || ntf.event === 'post.create' ? ntf.source : (ntf.initial.user);
                                  var ntf_object = ntf.event === 'post.like' || ntf.event === 'post.create' ? ntf.initial : (ntf.event === 'post.share' ? ntf.shared : ntf.parent);
                                  ntf.on_himself = ( ntf_source.id === ntf_object.user.id);
                                  ntf.on_yours =  (ntf_object.user.id === session.id);
                                  ntf.inited = true;
                                  return;
                            });
                        });
                    }
                    else{
                        if(ntf.object.data.t_page_id){
                            promises.push(page_model.queue([ntf.object.data.t_page_id]).then(function(){
                                ntf.target_page = page_model.list[ntf.object.data.t_page_id].datum;
                                return true;
                            }));
                        }
                        if(ntf.object.data.page_id){
                            promises.push(page_model.queue([ntf.object.data.t_page_id]).then(function(){
                                ntf.page = page_model.list[ntf.object.data.t_page_id].datum;
                                ntf.picture = ntf.page.logo;
                                return;
                            }));
                        }
                        if(ntf.object.data.user_id){
                            promises.push(user_model.queue([ntf.object.data.user_id]).then(function(){
                                ntf.user = user_model.list[ntf.object.data.user_id].datum;
                                if(!ntf.object.data.page_id){
                                   ntf.picture = ntf.user.avatar;
                                }
                                return;
                            }));
                        }
                        return $q.all(promises).then(function(){
                            ntf.inited = true;
                            return true;
                        });
                    }
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
