angular.module('elements').directive('textlink',['$sce',
    function( $sce ){
        return {
            scope:{
                textlink:'='
            },
            link: function(scope, element ){

                function buildContent(){
                    return ($sce.getTrustedHtml(scope.textlink)||'')
                            .replace(/(\()(https?:\/\/[^\s:\)\n]*)|(https?:\/\/[^\s:\n]*)/g,'$1<a target="_blank" href="$2$3">$2$3</a>');

                }

                var l = scope.$watch('textlink',function(){
                    element[0].innerHTML = buildContent();

                    element[0].querySelectorAll('a').forEach(function(link){
                        link.addEventListener('click',linkOnClick);
                    });

                }.bind(this));

                function linkOnClick( e ){
                    e.stopPropagation();
                }

                scope.$on('$destroy',l);
            },
            restrict: 'A'
        };
    }]);
