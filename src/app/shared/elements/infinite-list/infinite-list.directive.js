
angular.module('elements')
    .directive('infiniteList',[ '$q', '$parse',
        function( $q, $parse ){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    //Id list
                    list:'=infiniteList',
                    //Page size
                    pagination:'=',
                    //Model to bind
                    model:'=',
                    //Paginated list
                    loaded: '=',
                    //Callback
                    nextPage: '=',
                    //Callback
                    loading: '=?',
                    //Scroll selector
                    scrollable:'@',
                    //Scroll distance
                    distance:'=',
                },
                link: function( scope, _, attr ){
                    scope.page = 0;
                    if($parse(attr.loaded).assign){
                        scope.loaded = 0;
                    }
                    scope.scrollable = scope.scrollable || "window";
                    scope.next = scope.nextPage || function(){
                        if(scope.ended){
                            return;
                        }
                        if(scope.lock){
                            return scope.lock;
                        }
                        scope.loading = true;
                        scope.lock = scope.model.queue(scope.list.slice(scope.page *  scope.pagination, (scope.page + 1) *  scope.pagination))
                            .then(function(){
                            scope.lock = false;
                            scope.ended = (scope.page + 1) *  scope.pagination >= scope.list.length;
                            scope.page++;
                            scope.loaded = scope.page *  scope.pagination;
                            scope.loading = false;
                        }, function(){
                            scope.loading = false;
                        });
                    };

                   if(!scope.nextPage){
                        scope.$watch('list', function(){
                            scope.lock = false;
                            scope.page = 0;
                            scope.ended = false;
                            scope.loaded = 0;
                            scope.next();
                    }, true);
                   }

                },
                templateUrl: 'app/shared/elements/infinite-list/template.html'
            };
        }
    ]);
