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

                        // TO DELETE => TESTING GNAM STYLE
                        /*service.datas = {
                            "powered":true,
                            "injectStyle":[
                                "#login{ background-position: 50% 50%;background-image: url(assets/img/gnam/background.png);background-size: cover;}",
                                "#login form{ padding: 6rem 12rem 10rem; }",
                                "#login .logo{width:25rem;top: 0;left: 0;height: 14rem;background-image: url(assets/img/gnam/logoSquare.jpg);position: relative;background-size: contain;background-repeat: no-repeat;background-position: 50% 50%;margin:0 auto;}"
                            ]
                        };*/

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
