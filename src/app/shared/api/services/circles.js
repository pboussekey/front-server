angular.module('API')
    .factory('circles',['api_service',
        function(api_service){
            var service = {
                getList: function(){
                    return api_service.send('circle.getList');
                },
                get : function(id){
                    return api_service.send('circle.get', { id : id });
                },
                save : function(circle){
                    return api_service.send(circle.id ? 'circle.update' : 'circle.add', circle);
                },
                addOrganization : function(circle_id, organization_id){
                    return api_service.send("circle.addOrganizations",{ id : circle_id, organizations : organization_id });
                },
                removeOrganization : function(circle_id, organization_id){
                    return api_service.send("circle.deleteOrganizations", { id : circle_id, organizations : organization_id });
                },
                delete : function(circle_id){
                    return api_service.send("circle.delete", { id : circle_id });
                }
            };
            return service; 
        }
]);