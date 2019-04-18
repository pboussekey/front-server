angular.module('dashboard').controller('dashboard_controller',
    ['$scope','feed', 'session', 'user_courses', 'user_groups', 'user_events', 'global_loader',
        'puadmin_model', 'events_service', 'events','post_model', 'oadmin_model', '$timeout', 'user_model',
        'assignments', 'items_model', 'item_submission_model', '$state', 'page_model', 'modal_service', '$stateParams',
        function( $scope, feed, session,  user_courses, user_groups, user_events, global_loader,
        puadmin_model, events_service, events, post_model, oadmin_model, $timeout, user_model,
        assignments, items_model, item_submission_model, $state, page_model, modal_service, $stateParams){
            var ctrl = this;
            ctrl.admins = puadmin_model;
            this.tpl = {
                left_column: 'app/components/app_layout/tpl/aside.html',
                center_column: 'app/components/app_layout/tpl/header.html'
            };

            user_model.queue([session.id]).then(function(){
                ctrl.me = user_model.list[session.id];
            });

            //ASSIGNMENTS
            ctrl.types = {
                //SCT: {icon:'i-section',label:'', },
                //FLD: {icon:'i-folder',label:'page.folder'},
                LC: {icon:'i-camera',label:'item_types.liveclass', has_item_user: false, has_attachment: false},
                A: {icon:'i-assignment',label:'item_types.assignment', has_item_user: true, has_attachment: true},
                GA: {icon:'i-group-assignment',label:'item_types.group_assignment', has_item_user: true, has_attachment: true},
                QUIZ: {icon:'i-quiz',label:'item_types.quiz', has_item_user: true, has_attachment: false},
                PG: {icon:'i-page',label:'item_types.page', has_item_user: false, has_attachment: false},
                DISC: {icon:'i-conversation',label:'item_types.discussion', has_item_user: false, has_attachment: false},
                MEDIA: {icon:'i-media',label:'item_types.media', has_item_user: false, has_attachment: false}
            };
            ctrl.items = items_model.list;
            ctrl.submissions = item_submission_model.list;
            ctrl.pages = page_model.list;
            var search_date = new Date();
            search_date.setHours(search_date.getHours() - 1);
          
            oadmin_model.queue([session.id]).then(function(){
                ctrl.organizations =  oadmin_model.list[session.id].datum;
            });

            // GET FEED POSTS
            feed.get(true).then(function(){
                if(!feed.indexes.length){
                    global_loader.done('post');
                }
            });
            this.post_ids = feed.indexes;

            this.newPost = {
                content: '',
                files: []
            };

            this.onPostAdded = function(){
                ctrl.refresh();
            };

            this.onPostRemoved = function( postId ){
                feed.unset( postId );
            };

            // ON SCROLL => LOAD NEXT FEED POSTS
            ctrl.loadNext = function(){
                if( !ctrl.nomorefeed && !ctrl.loadingNext ){
                    ctrl.loadingNext = true;
                    feed.next().then(function( list ){
                        ctrl.loadingNext = false;

                        if( !list || list.length === 0 ){
                            ctrl.nomorefeed = true;
                        }
                    });
                }
            };

            ctrl.refresh = function( last ){
                ctrl.hasUpdates = 0;
                ctrl.refreshing = true;

                post_model.queue([feed.indexes[0]]);

                feed.refresh().then(function(){
                    ctrl.refreshing = false;
                });
            };

            ctrl.hasUpdates = 0;
            var lfu = events_service.on( events.feed_updates, function(){
                ctrl.hasUpdates++;
                $scope.$evalAsync();
            });

            ctrl.goToAssignment = function(item){
                if(item.type === 'LC'){
                    var url = $state.href('liveclass', { id : item.id });
                    window.open(url).focus();
                }
                else{
                    $state.go('lms.page.content' , { id : item.page_id, type : 'course', item_id : item.id });
                }
            };

            $scope.$on('$destroy', function(){
                events_service.off( events.feed_updates, lfu );
            });

            ctrl.postModal = function(id){
                $timeout(function(){
                    modal_service.open({
                        label: '',
                        template: 'app/shared/custom_elements/post/view_modal.html',
                        scope:{
                            id:  id
                        },
                        reference: document.activeElement
                    });
                });
            };

            if($stateParams.post_id){
                ctrl.postModal($stateParams.post_id);
            }


            ctrl.appsModal = function(){
                modal_service.open({
                    template: 'app/components/app_layout/tpl/appsmodal.html',
                    scope:{
                        stores : CONFIG.stores
                    },
                    reference: document.activeElement
                });
            };

        }
    ]);
