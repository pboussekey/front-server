
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
                    //Scroll selector
                    scrollable:'@',
                },
                link: function( scope, _, attr ){
                    scope.page = 0; 
                    if($parse(attr.loaded).assign){
                        scope.loaded = 0;
                    }
                    scope.scrollable = scope.scrollable || "window";
                    scope.next = scope.nextPage || function(){
                        var defered = $q.defer();
                        if(scope.lock){
                            defered.reject();
                            return defered.promise;
                        }
                        if(scope.ended){
                            return;
                        }
                        scope.lock = true;
                        return scope.model.queue(scope.list.slice(scope.page *  scope.pagination, (scope.page + 1) *  scope.pagination))
                            .then(function(){
                            scope.lock = false;
                            scope.ended = (scope.page + 1) *  scope.pagination >= scope.list.length;

                            scope.page++;
                            scope.loaded = scope.page *  scope.pagination;
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