
angular.module('elements')
    .directive('uiMap',['$timeout', 'filters_functions',
        function($timeout, filters_functions){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    //Id list
                    address:'=uiMap',
                    options:'=',
                    //Page size
                    editable:'=',
                    hideMap:'='
                },
                link: function( scope, element ){
                    
                    var marker, map;
                    scope.geocoderId =  'GEOCODER_'+ (Math.random()+'').slice(2);
                    scope.mapId =  'MAP_'+ (Math.random()+'').slice(2);
                    mapboxgl.accessToken = CONFIG.mapboxToken;
                    $timeout(function(){
                        map = new mapboxgl.Map({
                        container: scope.mapId,
                        style: 'mapbox://styles/mapbox/streets-v10',
                        zoom: 9 // starting zoom
                        });
                        if(scope.editable){
                            var geocoder = new MapboxGeocoder(Object.assign({ accessToken: mapboxgl.accessToken }, scope.options));
                            element[0].querySelector("#" + scope.geocoderId).appendChild(geocoder.onAdd(map));
                            geocoder.on('result', function(r){
                                $timeout(function(){
                                    if(!!marker){
                                        marker.remove();
                                    }
                                    scope.address = { longitude : r.result.center[0], latitude : r.result.center[1], full_address :  r.result.place_name };
                                    var elements = [r.result].concat(r.result.context);
                                    elements.forEach(function(element){
                                        if(element.id.indexOf('place') === 0){
                                            scope.address.city = { libelle : element.text, name : element.text };
                                        }
                                        else if(element.id.indexOf('country') === 0){
                                            scope.address.country = { short_name : element.text, name : element.text };
                                        }
                                        else if(element.id.indexOf('region') === 0){
                                            scope.address.division = {  name : element.text };
                                        }
                                    });
                                     // add marker to map
                                     marker = new mapboxgl.Marker()
                                        .setLngLat(r.result.center)
                                        .addTo(map);
                                });
                            });


                            geocoder.on('clear', function(){
                                $timeout(function(){
                                    if(!!marker){
                                        marker.remove();
                                    }
                                    scope.address = 0
                                });
                            });
                            if(scope.address && scope.address.latitude !== undefined && scope.address.longitude !== undefined){
                                geocoder.setInput(filters_functions.address(scope.address));
                            }
                        }
                        if(scope.address && scope.address.latitude !== undefined && scope.address.longitude !== undefined){
                             // add marker to map
                            
                            marker = new mapboxgl.Marker()
                                .setLngLat([scope.address.longitude, scope.address.latitude])
                                .addTo(map);
                            map.flyTo({ center : [scope.address.longitude, scope.address.latitude]});
                        }
                    });
                    
                    
                    
                },
                templateUrl: 'app/shared/elements/map/template.html'
            };
        }]
    );
