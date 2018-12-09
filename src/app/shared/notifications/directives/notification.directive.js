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
                      "user.follow" : function(){
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
                          return pages_config[ntf.object.page_type].fields.logo.icon;
                      },
                      "page.invited":
                      function(){
                          return pages_config[ntf.object.page_type].fields.logo.icon;
                      },
                      "page.pending":
                      function(){
                          return pages_config[ntf.object.page_type].fields.logo.icon;
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
                      "section.publish": function(){
                          return "i-board";
                      },
                      "item.update": function(){
                          return "i-assignment";
                      },
                      "page.doc": function(){
                          return "i-assignment";
                      }
                  };
                  ntf.icon = scope.icons[ntf.event]();
                  ntf.text = ntf.text.replace("{more}", "");
                  if(ntf.text.indexOf('{user}') >= 0){
                      user_model.queue([ntf.target_id]).then(function(){
                          if(ntf.source.id === ntf.target_id){
                              ntf.text = ntf.text.replace('{user}', 'their');
                          }
                          else if(session.id === ntf.target_id){
                              ntf.text = ntf.text.replace('{user}', 'your');
                          }
                          else{
                              ntf.text = ntf.text.replace("{user}", "<b>" + filters_functions.username(user_model.list[ntf.target_id].datum) + "</b>'s");
                          }
                          ntf.inited = true;
                          events_service.process('ntfLoaded' + ntf.id);
                      });
                  }
                  else{
                      ntf.inited = true;
                      events_service.process('ntfLoaded' + ntf.id);
                  }
              }
          };
        }
    ]);
