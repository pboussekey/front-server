angular.module('customElements')
    .directive('notification',['user_model', 'page_model', 'post_model', 'session', 'events_service',
            'notifications', 'filters_functions', 'pages_config', '$q',
            function(user_model, page_model, post_model, session, events_service,
            notifications, filters_functions, pages_config, $q){

            return {
                restrict:'A',
                templateUrl: 'app/shared/notifications/tpl/notification.html',
                scope:{
                    ntf : "=notification"
                },
                link: function( scope, element ){
                  var ntf = scope.ntf;
                  scope.icons = {
                      "connection.accept" : function(){
                            return "i-user";
                      },
                      "post.create": function(){
                          return "i-pencil";
                      },
                      "post.com": function(){
                          return "i-comment";
                      },
                      "post.share": function(){
                          return "i-share";
                      },
                      "page.member":
                      function(){
                          return pages_config[ntf.object.data.page.type].fields.logo.icon;
                      },
                      "page.invited":
                      function(){
                          return pages_config[ntf.object.data.page.type].fields.logo.icon;
                      },
                      "page.pending":
                      function(){
                          return pages_config[ntf.object.data.page.type].fields.logo.icon;
                      },
                      "post.like":
                      function(){
                          return "i-heart";
                      },
                      "post.tag":
                      function(){
                          return "i-at";
                      },
                      "item.publish": function(){
                          return "i-assignment";
                      },
                      "item.update": function(){
                          return "i-assignment";
                      },
                      "page.doc": function(){
                          return "i-assignment";
                      }
                  };

                  scope.texts = {
                      "connection.accept" : function(){
                            return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> is now connected to you";
                      },
                      "post.create": function(){
                          //"USER NAME" OR "PAGE NAME" FOR ANNOUNCEMENT
                          return (!ntf.is_announcement ? ("<b>" + filters_functions.username(ntf.source.data, true) + "</b>") : ("<b>" + filters_functions.limit(ntf.initial.page.title) + "</b>"))
                           + (ntf.is_in_page && ntf.is_announcement !== ntf.is_in_page ? (" just posted in <b>" + filters_functions.limit(ntf.initial.target.title,50) + "</b>") : " just posted")
                           + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                      },
                      "post.com": function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> "
                           // REPLY OR COMMENT
                           + (ntf.is_reply ? ' replied' : ' commented')
                           // "TO" FOR REPLY, "ON" FOR COMMENT, NOTHING IF THE USER COMMENT OR REPLY TO HIMSELF
                           + (ntf.has_announcement_parent ? "" : (ntf.is_reply ? ' to' : ' on'))
                           + (ntf.on_himself && !ntf.has_announcement_parent ? " their" : "")
                           // "YOUR" IF YOU ARE THE OWNER OF THE COMMENTED OR REPLIED POST
                           + (ntf.is_comment && !ntf.is_reply && ntf.on_yours && !ntf.is_announcement? ' your post' : "")
                           + (ntf.is_reply && ntf.on_yours && !ntf.is_announcement ? " your comment" : "")
                           // "PAGE NAME" IF THIS IS A COMMENT OF A PAGE'S POST
                           + (ntf.has_announcement_parent ? (" <b>" + filters_functions.limit(ntf.parent.page.title,50) + "</b>'s") : "")
                           // "USER NAME" IF THIS IS A REPLY/COMMENT TO AN USER'S COMMENT/POST
                           + (!ntf.on_himself && !ntf.on_yours && !ntf.has_announcement_parent ? (" <b>" + filters_functions.username(ntf.parent.user) + "'s </b>") : "")
                           // "USER NAME" IF THIS IS A COMMENT TO AN USER'S POST'S
                           + (ntf.on_yours  && !ntf.has_announcement_parent ? "" : (!ntf.is_reply  ? ' post' : ' comment'))
                            // "IN PAGE NAME" IF THIS POST IS ON A PAGE FEED (BUT NOT FOR PAGE'S POSTS)
                           + (ntf.is_in_page  ? (" in <b>" + filters_functions.limit(ntf.origin.target.title,50) + "</b>") : "")
                            // "POST CONTENT"
                           + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                      },
                      "post.share": function(){
                          //"USER NAME" OR "PAGE NAME" FOR ANNOUNCEMENT
                          return (!ntf.is_announcement ? ("<b>" + filters_functions.username(ntf.source.data, true) + "</b>") : ("<b>" + filters_functions.limit(ntf.initial.page.title,50) + "</b>"))
                           + " shared"
                           //"USER NAME" OR "PAGE NAME" OF THE POST SHARED
                           + (!ntf.has_announcement_share && !ntf.on_yours && (ntf.is_announcement || !ntf.on_himself) ? (" <b>" + filters_functions.username(ntf.shared.user) + "</b>'s post") : "")
                           + (ntf.on_yours && !ntf.has_announcement_share ? ' your post' : '')
                           + (ntf.on_himself && !ntf.has_announcement_share && !ntf.is_announcement ? ' their post' : '')
                           + (ntf.is_announcement && ntf.has_announcement_share === ntf.is_announcement  ? ' their post' : '')
                           + (ntf.has_announcement_share  ? (" <b>" + filters_functions.limit(ntf.shared.page.title,50) + "</b>'s post") : "")
                           // "IN PAGE NAME" IF IT'S NOT AN ANNOUNCEMENT
                           + (ntf.is_in_page  ? (" in <b>" + filters_functions.limit(ntf.initial.target.title,50) + "</b>") : "")
                            // "POST CONTENT"
                           + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                      },
                      "page.member":
                      function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> enrolled you in <b>" +ntf.target.title + "</b>";
                      },
                      "page.invited":
                      function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> invited you to join <b>" +ntf.target.title + "</b>";
                      },
                      "page.pending":
                      function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> requested to join <b>" +ntf.target.title + "</b>";
                      },
                      "post.like":
                      function(){
                          //"USER NAME"
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> liked"
                          // "YOUR" IF THIS YOUR POST OR YOUR COMMENT AND IF IT'S NOT AN ANNOUNCEMENT
                           + (ntf.on_yours ? " your" : "")
                           // "USER NAME" IF IT'S NOT AN ANNOUNCEMENT OR ONE OF YOUR POST/COMMENT AND IF THE USER IS NOT LIKING HIMSELF
                           + (!ntf.on_himself && !ntf.on_yours && !ntf.is_announcement ? (" <b>" + filters_functions.username(ntf.initial.user) + "</b>'s") : "")
                           + (ntf.on_himself && !ntf.is_announcement ? " their" : "")
                           //"PAGE NAME" IF THE POST IS AN ANNOUNCEMENT
                           + (ntf.is_announcement  ? (" <b>" + filters_functions.limit(ntf.initial.page.title,50) + "</b>'s") : "")
                           // IS IT A POST/COMMENT OR REPLY
                           + (ntf.is_reply ? ' reply' : (ntf.is_comment ? ' comment' : ' post'))
                           // IN "PAGE NAME" IF IT'S ON A PAGE
                           + (ntf.is_in_page  ? (" in <b>" + filters_functions.limit((ntf.initial.target || ntf.parent.target || ntf.origin.target).title,50) + "</b>") : "")
                            // "POST CONTENT"
                           + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                      },
                      "post.tag":
                      function(){
                          // "USER NAME" OR "PAGE NAME"
                          return "<b>" +(!ntf.is_announcement ?  filters_functions.username(ntf.source.data, true) : ntf.initial.page.title) + "</b>"
                           + " mentionned you in a"
                           + (ntf.is_reply ? ' reply' : '')
                           + (!ntf.is_reply && ntf.is_comment ? ' comment' : '')
                           + (!ntf.is_comment ? ' post' : '')
                           // IN "PAGE NAME"
                           + (ntf.is_in_page  ? (" in <b>" + filters_functions.limit((ntf.initial.target || ntf.parent.target || ntf.origin.target).title,50) + "</b>") : "")
                            // "POST CONTENT"
                           + (ntf.content ? ": &laquo;" + filters_functions.limit(ntf.content, 50)+ "&raquo;" : "");
                      },
                      "item.publish": function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> published a new item"
                           + (ntf.page ? (" in <b>" + filters_functions.limit(ntf.page.title,50) + "</b>") : " in one of your course");
                      },
                      "item.update": function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> updated an item"
                           + (ntf.page ? (" in <b>" + filters_functions.limit(ntf.page.title,50) + "</b>") : " in one of your course");
                      },
                      "page.doc": function(){
                          return "<b>" + filters_functions.username(ntf.source.data, true) + "</b> added a new material"
                           + (ntf.page ? (" in <b>" + filters_functions.limit(ntf.page.title,50) + "</b>") : " in one of your course");
                    }
                  };

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

                  var promises = [];
                  ntf.icon = scope.icons[ntf.event]();
                  if(notifications.events.post_update_types.indexOf(ntf.event) !== -1){
                      return loadPost(ntf.object.id).then(function(post_infos){
                          if(!post_infos){
                              ntf.removed = true;
                              events_service.process('ntfLoaded' + ntf.id);
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
                          $q.all(promises).then(function(){
                                ntf.target = ntf.initial.target || (ntf.parent && ntf.parent.target) || (ntf.origin && ntf.origin.target);

                                var initial_docs = ntf.initial.post.images || [];
                                var parent_docs = (ntf.parent && ntf.parent.post.images) || [];
                                var origin_docs = (ntf.origin && ntf.origin.post.images) || [];
                                var shared_docs = (ntf.shared && ntf.shared.post.images) || [];
                                var docs = initial_docs.concat(parent_docs).concat(origin_docs).concat(shared_docs);
                                if(docs.length){
                                    ntf.subpicture = docs[0].token;
                                    ntf.subpicture_size = [80, 'm', 80];
                                }
                                else{
                                    ntf.subpicture = ntf.initial.post.picture || (ntf.parent && ntf.parent.post.picture) || (ntf.origin && ntf.origin.post.picture) || (ntf.shared && ntf.shared.post.picture);
                                }

                                ntf.is_comment = (ntf.parent && ntf.parent.post.id !== ntf.initial.post.id && ntf.parent.post.id);
                                ntf.is_reply =  (ntf.parent && ntf.origin &&  ntf.origin.post.id !== ntf.parent.post.id && ntf.parent.post.id);
                                ntf.is_announcement = ntf.initial.page && ntf.initial.page.id;
                                ntf.has_announcement_parent= ntf.parent && ntf.parent.page && ntf.parent.page.id;
                                ntf.has_announcement_origin= ntf.origin && ntf.origin.page && ntf.origin.page.id;
                                ntf.has_announcement_share= ntf.shared && ntf.shared.page && ntf.shared.page.id;
                                ntf.is_in_page = (ntf.initial.target || (ntf.parent && ntf.parent.target) || (ntf.origin && ntf.origin.target) || { id : false}).id;
                                ntf.content = ntf.initial.post.content;
                                var ntf_source = ntf.event === 'post.like' || ntf.event === 'post.create' || ntf.event === 'post.tag' ? ntf.source : (ntf.initial.user);
                                var ntf_object = ntf.event === 'post.like' || ntf.event === 'post.create' || ntf.event === 'post.tag' ? ntf.initial : (ntf.event === 'post.share' ? ntf.shared : ntf.parent);
                                ntf.on_himself = (ntf_object &&  ntf_source.id === ntf_object.user.id);
                                ntf.on_yours =  (ntf_object && ntf_object.user.id === session.id);
                                ntf.text = scope.texts[ntf.event]();
                                ntf.inited = true;
                                events_service.process('ntfLoaded' + ntf.id);
                          });
                      });
                  }
                  else{
                      if(ntf.object.data && ntf.object.data.t_page_id){
                          promises.push(page_model.queue([ntf.object.page_id || ntf.object.data.t_page_id]).then(function(){
                              if(page_model.list[ntf.object.page_id || ntf.object.data.t_page_id]){
                                  ntf.target = page_model.list[ntf.object.page_id || ntf.object.data.t_page_id].datum;
                                  ntf.icon = pages_config[ntf.target.type].fields.logo.icon;
                              }
                              else{
                                  ntf.removed = true;
                              }
                              return;
                          }));
                      }
                      if(ntf.object.page_id || ntf.object.data.page_id){
                          promises.push(page_model.queue([ntf.object.page_id || ntf.object.data.t_page_id]).then(function(){
                              if(page_model.list[ntf.object.page_id || ntf.object.data.t_page_id]){
                                  ntf.page = page_model.list[ntf.object.page_id || ntf.object.data.t_page_id].datum;
                              }
                              else{
                                  ntf.removed = true;
                              }
                              return;
                          }));
                      }
                      if(ntf.object.data && ntf.object.data.user_id){
                          promises.push(user_model.queue([ntf.object.data.user_id]).then(function(){
                            if(user_model.list[ntf.object.data.user_id]){
                                ntf.user = user_model.list[ntf.object.data.user_id].datum;
                            }
                            else{
                                ntf.removed = true;
                            }
                            return;
                          }));
                      }
                      return $q.all(promises).then(function(){
                          ntf.text = scope.texts[ntf.event]();
                          ntf.picture = ntf.source.data.avatar;
                          ntf.inited = true;
                          events_service.process('ntfLoaded' + ntf.id);
                      });
                  }

              }
          };
        }
    ]);
