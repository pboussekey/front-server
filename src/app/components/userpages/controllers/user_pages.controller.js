angular.module('userpages').controller('userpages_controller',
    ['pagetype','user_pages_service','session','page_modal_service', '$timeout',
     'oadmin_model','session', 'pages_config','$scope', 'state_service', 'community_service',
    function( pagetype, user_pages_service, session, page_modal_service, $timeout,
      oadmin_model, session, pages_config, $scope, state_service, community_service ){

        var ctrl = this,
            page = 1,
            n = 12;

        ctrl.type = pagetype;
        ctrl.canCreate = false;
        ctrl.label = pages_config[pagetype].label;
        ctrl.title = 'My '+ ctrl.label +'s';
        ctrl.linkCategory = ctrl.label +'s';
        ctrl.canCreate = true;
        if ( pagetype === 'course' ) {
            ctrl.linkCategory = false;
            oadmin_model.get([session.id]).then(function(){
                ctrl.canCreate = session.roles[1] || oadmin_model.list[session.id].datum.length;
            });
        }

        // SET TITLE
        state_service.setTitle(ctrl.title);
        // GET PAGES
        var searchtimeout = null;
        ctrl.onSearch = function(){
            if(searchtimeout){
                $timeout.cancel(searchtimeout);
            }
            page = 1;
            searchtimeout = $timeout(ctrl.loadPages, 200);
        };


        ctrl.loadPages = function(){
            if(!ctrl.loading){
                ctrl.loading = true;
                community_service.pages(ctrl.search, page, n, ctrl.type, null, null, null, null, null, null, session.id).then(function(pages){
                    if(!ctrl.memberof){
                        ctrl.memberof = pages.count;
                    }
                    ctrl.displayed_pages = page === 1 ? pages.list : (ctrl.displayed_pages || []).concat(pages.list);
                    ctrl.loading = false;
                });
            }
        }

        ctrl.openPageModal = function($event){
            page_modal_service.open( $event, ctrl.type );
        };

        ctrl.loadPages();
    }
]);
