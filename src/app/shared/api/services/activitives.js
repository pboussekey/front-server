angular.module('admin')
    .factory('activities_service',['api_service',
        function( api_service ){ 
    	
    		var service = {
                    get: function( start_date, end_date, page, number, search ){ 
                            return api_service.send('activity.getList',{ 'search': search, filter:{ n:number, p:page, o : { 'activity.id' : 'DESC' }}, start_date : start_date, end_date : end_date});					
                    },
                    getConnections: function( start_date, end_date, interval_date, organization_id, user_id){ 
                        return api_service.send('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, user_id : user_id});
                    },
                    getConnectionsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id});
                        
                    },
                    getLikesCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('postlike.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id});
                        
                    },
                    getEventsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, type : ['event']});
                        
                    },
                    getGroupsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, type : ['group']});
                        
                    },
                    getCoursesCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, type : ['course']});
                        
                    },
                    getVisitsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('activity.getVisitsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, type : ['course']});
                        
                    },
                    getPostsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('post.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id});
                        
                    },
                    getRequestsCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('contact.getRequestsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id});
                        
                    },
                    getAcceptedCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('contact.getAcceptedCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id});
                        
                    },
                    getMessagesCount : function(start_date, end_date, interval_date, organization_id){
                        return api_service.send('message.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, organization_id : organization_id, type : [1,2]});
                        
                    },
                    getPages: function( object_name, count, min_date, max_date){
                    return api_service.send('activity.getPages',{object_name : object_name, count : count, start_date : min_date, end_date : max_date});
                }   
    		};
    		return service;
    	} 
    ]);
    