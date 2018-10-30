angular.module('CUSTOM')
    .factory('customizer',['api_service',function( api_service ){
        var loaded = false;

        var service = {
            datas: {},

            get: function( name ){
                return service.datas ? service.datas[name]: undefined;
            },
            load: function(){
                if( loaded )
                    return loaded;

                return api_service.send('page.getCustom',{libelle: location.hostname.replace( CONFIG.hostname_end, '') })
                    .then(function( result ){
                        if( result && result.custom ){
                            try{
                                service.datas = JSON.parse( result.custom );
                            }catch( e ){
                                console.log('Error loading customization');
                            }
                        }
                        loaded = true;
                        return loaded;
                    },function(){
                        return loaded;
                    }).then(function(){

                        if( service.datas.injectStyle && service.datas.injectStyle.length ){
                            var style = document.createElement("style");
                            // WebKit hack :(
                            style.appendChild(document.createTextNode(""));
                            document.head.appendChild(style);

                            // INSERT RULES
                            service.datas.injectStyle.forEach(function(rule, index){
                                style.sheet.insertRule( rule, index);
                            });
                        }

                    });
            }
        };

        return service;
    }]);
