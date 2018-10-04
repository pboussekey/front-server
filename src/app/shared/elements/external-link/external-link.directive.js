angular.module('elements').directive('externalLink', ['filters_functions',
    function( filters_functions ){
        return {
            scope:{
                url: '@externalLink'
            },
            resrict:'A',
            link: function( scope, element ) {
                  var isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
                  if(isApp){
                      element[0].addEventListener('click', function(){
                            window.open(scope.url, '_system');
                      });
                  }
                  else{
                      element[0].href = scope.url;
                  }

            }
        };
    }
]);
