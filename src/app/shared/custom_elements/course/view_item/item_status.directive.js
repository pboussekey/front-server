angular.module('customElements')
    .directive('itemStatus',['items_model', '$q',
        function(items_model, $q){
            return {
                restrict:'A',
                scope:{
                    id: '=itemStatus'
                },
                template: '<div ng-if="loaded" class="status {{ getStatusClass() }}" translate>{{ getStatus() }}</div>',
                link: function( scope, element, attrs ){
                     var availableStates = {
                        available: 1,
                        not_available: 2,
                        available_on_date: 3
                    };

                    function loadParent(item){
                        var deferred = $q.defer();
                        if(item.datum.parent_id){
                            items_model.queue([item.datum.parent_id]).then(function(){
                                deferred.resolve(items_model.list[item.datum.parent_id].datum.parent_id);
                            });
                        }
                        else{
                            deferred.resolve();
                        }
                        return deferred.promise;
                    };

                    items_model.queue([scope.id]).then(function(){
                       scope.item = items_model.list[scope.id];
                       loadParent(scope.item).then(function(id){
                            if(id){
                                loadParent(items_model.list[id]).then(function(){
                                    scope.loaded = true;
                                });
                            }
                            else{
                                scope.loaded = true;
                            }
                       });

                    });


                   function isAvailable(item_id,  parentCheck ){
                        return items_model.list[item_id] && items_model.list[item_id].datum
                            && ( items_model.list[item_id].datum.is_available === availableStates.available
                                || items_model.list[item_id].datum.is_grade_published
                                || items_model.list[item_id].datum.type === 'SCT'
                                || ( items_model.list[item_id].datum.is_available === availableStates.available_on_date
                                    && ( !items_model.list[item_id].datum.start_date || (new Date(items_model.list[item_id].datum.start_date)).getTime() < Date.now() )
                                    && ( !items_model.list[item_id].datum.end_date || (new Date(items_model.list[item_id].datum.end_date)).getTime() > Date.now() ) ) )
                            && ( !parentCheck
                                || ( !items_model.list[item_id].datum.parent_id || isAvailable( items_model.list[item_id].datum.parent_id, true) ) );
                    }

                    scope.getStatus = function(){
                        var status = 'item.not_available';
                        if( !scope.item.datum.is_published ){
                            status = 'item.unpublished';
                        }else if( scope.item.datum.is_grade_published ){
                            status = 'item.closed';
                        }else if( isAvailable( scope.item.datum.id, true ) ){
                            status = 'item.ongoing';
                        }else if( scope.item.datum.is_available === availableStates.available_on_date
                            && scope.item.datum.end_date && (new Date(scope.item.datum.end_date)).getTime() < Date.now() ){
                            status = 'item.no_longer_available';
                        }else if( scope.item.datum.is_available === availableStates.available_on_date
                            && scope.item.datum.end_date && (new Date(scope.item.datum.end_date)).getTime() < Date.now() ){
                            status = 'item.not_available_yet';
                        }
                        return status;
                    };

                    scope.getStatusClass = function(){
                        var sclass = 'not_available';

                        if( !scope.item.datum.is_published ){
                            sclass = 'not_published';
                        }else if( scope.item.datum.is_grade_published ){
                            sclass = 'closed';
                        }else if( isAvailable(scope.item.datum.id, true) ){
                            sclass = 'ongoing';
                        }
                        return sclass;
                    };

                    scope.item_state = function(){
                        var now = new Date().getTime();
                        var start = scope.item.datum.start_date ? new Date(scope.item.datum.start_date).getTime() : null;
                        var end = scope.item.datum.end_date ? new Date(scope.item.datum.end_date).getTime() : null;

                        if(end && end > now && end <= now + 3600 * 1000){
                            return 'Close end';
                        }
                        else if(start && start < now && (!end || end > now)){
                            return 'Ongoing';
                        }
                        else if(start && start > now && start <= now + 3600 * 1000 ){
                            return 'Imminent';
                        }
                        else if(end && end < now){
                            return 'Ended';
                        }
                        return null;
                    };

                }
            };
        }
    ]);
