angular.module('admin')
    .factory('activities_service',['api_service',
        function( api_service ){ 
    	
    		var service = {
                    get: function( start_date, end_date, page, number, search ){ 
                            return api_service.queue('activity.getList',{ 'search': search, filter:{ n:number, p:page, o : { 'activity.id' : 'DESC' }}, start_date : start_date, end_date : end_date});					
                    },
                    getConnections: function( start_date, end_date, interval_date, page_id, user_id){ 
                        return api_service.queue('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, user_id : user_id});
                    },
                    getConnectionsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id});
                        
                    },
                    getLikesCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('postlike.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id});
                        
                    },
                    getEventsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['event']});
                        
                    },
                    getGroupsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['group']});
                        
                    },
                    getCoursesCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course']});
                        
                    },
                    getVisitsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('activity.getVisitsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course']});
                        
                    },
                    getVisitsPrc : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('activity.getVisitsPrc',{start_date : start_date, end_date : end_date, page_id : page_id, interval_date : interval_date});
                        
                    },
                    getUsersActivities : function(start_date, end_date){
                        return api_service.queue('activity.getUsersActivities',{start_date : start_date, end_date : end_date});
                        
                    },
                    getDocumentsOpeningCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('activity.getDocumentsOpeningCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course']});
                        
                    },
                    getDocumentsOpeningPrc : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('activity.getDocumentsOpeningPrc',{start_date : start_date, end_date : end_date, page_id : page_id});
                        
                    },
                    getPostsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('post.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id});
                        
                    },
                    getRequestsCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('contact.getRequestsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id});
                        
                    },
                    getAcceptedCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('contact.getAcceptedCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id});
                        
                    },
                    getMessagesCount : function(start_date, end_date, interval_date, page_id){
                        return api_service.queue('message.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : [1,2]});
                        
                    },
                    getPages: function( object_name, count, min_date, max_date){
                    return api_service.queue('activity.getPages',{object_name : object_name, count : count, start_date : min_date, end_date : max_date});
                }   
    		};
    		return service;
    	} 
    ]);
    