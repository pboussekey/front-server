
angular.module('elements')
    .directive('uiMap',["GeoCoder", "NgMap", 'filters_functions',
        function(geoCoder, NgMap, filters_functions ){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    //Id list
                    address:'=uiMap',
                    //Page size
                    editable:'=',
                    required:'=',
                    //Model to bind
                    onsave:'=',
                    initialSearch: '@search'
                },
                link: function( scope ){
                    scope.autocompleteSearch = {};
                    scope.api_key = CONFIG.mapsApiKey;

                    recenterMap();

                    function parseGooglePlace(place) {
                        var address = place.address_components.reduce(function (tmpAddress, address_component) {
                            if (address_component.types.indexOf('street_number') !== -1) {
                                tmpAddress.street_no = address_component.long_name;
                                return tmpAddress;
                            }
                            if (address_component.types.indexOf('route') !== -1) {
                                tmpAddress.street_name = address_component.long_name;
                                return tmpAddress;
                            }
                            if (address_component.types.indexOf('locality') !== -1) {
                                tmpAddress.city = { name: address_component.short_name, libelle: address_component.short_name.toUpperCase() };
                                return tmpAddress;
                            }
                            if (address_component.types.indexOf('administrative_area_level_1') !== -1) {
                                tmpAddress.division = { name: address_component.long_name };
                                return tmpAddress;
                            }
                            if (address_component.types.indexOf('country') !== -1) {
                                tmpAddress.country = { short_name: address_component.long_name };
                                return tmpAddress;
                            }
                            return tmpAddress;
                        }, {});
                        address.latitude = place.geometry.location.lat();
                        address.longitude = place.geometry.location.lng();

                        ['city', 'country', 'division'].forEach(function(property) {
                            if (!address[property]) {
                                address[property] = {};
                            }
                        });

                        return address;
                    }

                    scope.getAddressList = function(search){
                        return geoCoder.geocode({ address : search });
                    };
                    scope.setAddress = function(address){
                        scope.address = address ? parseGooglePlace(address) : 0;
                        if(scope.onsave){
                            scope.onsave(scope.address);
                        }
                        return filters_functions.address(scope.address);
                    };

                    scope.checkToClear = function(){
                        if( !scope.address && scope.autocompleteSearch.search ){
                            scope.autocompleteSearch.search = '';
                        }
                    };

                    var unregister = scope.$watch('address', recenterMap);

                    scope.$on('$destroy', function(){
                        unregister();
                    });

                    function recenterMap(){
                        NgMap.getMap().then(function ( google_map ) {
                            var map = google_map,
                                center = map.getCenter();

                            window.google.maps.event.trigger(google_map, 'resize');
                            map.setCenter( center );
                        },function(){});
                    }
                },
                templateUrl: 'app/shared/elements/map/template.html'
            };
        }]
    );
