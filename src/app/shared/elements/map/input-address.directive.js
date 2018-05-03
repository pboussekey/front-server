angular.module('elements')
    .directive('inputAddress',['filters_functions',
        function(geoCoder, filters_functions){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    //Id list
                    model:'=inputAddress',
                    id:'@autocompleteId',
                    required:'='
                   
                },
                link: function( scope ){
                    
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
                                tmpAddress.country = { short_name: address_component.long_name, name : address_component.long_name };
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
                        if(!search || !search.length){
                            scope.model = null;
                        }
                        scope.loading = true;
                        /*return geoCoder.geocode({ address : search }).then(function(addresses){
                            scope.loading = false;
                            return addresses;
                        });*/
                    };
                    scope.setAddress = function(address){
                        scope.model = parseGooglePlace(address);
                        return filters_functions.address(scope.model);                       
                    };
                    //window.google.maps.event.addListener("center_changed", oncenterchange);
                },
                templateUrl: 'app/shared/elements/map/input-address.html'
            };
        }]
    );