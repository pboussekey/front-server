angular.module('admin')
    .factory('activities_service',['api_service',
        function( api_service ){ 
    	
    		var service = {
                    get: function( start_date, end_date, page, number, search ){ 
                            return api_service.queue('activity.getList',{ 'search': search, filter:{ n:number, p:page, o : { 'activity.id' : 'DESC' }}, start_date : start_date, end_date : end_date});					
                    },
                    getConnections: function( start_date, end_date, interval_date, page_id, user_id, date_offset){ 
                        return api_service.queue('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, user_id : user_id, date_offset : date_offset});
                    },
                    getConnectionsCount : function(start_date, end_date, interval_date, page_id, _, date_offset){
                        return api_service.queue('activity.getConnections',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, date_offset : date_offset });
                        
                    },
                    getLikesCount : function(start_date, end_date, interval_date, page_id,_, date_offset){
                        return api_service.queue('postlike.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, date_offset : date_offset});
                        
                    },
                    getEventsCount : function(start_date, end_date, interval_date, page_id, _, date_offset){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['event'], date_offset : date_offset});
                        
                    },
                    getGroupsCount : function(start_date, end_date, interval_date, page_id,_, date_offset){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['group'], date_offset : date_offset});
                        
                    },
                    getCoursesCount : function(start_date, end_date, interval_date, page_id,_, date_offset){
                        return api_service.queue('page.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course'], date_offset : date_offset});
                        
                    },
                    getVisitsCount : function(start_date, end_date, interval_date, page_id,_, date_offset){
                        return api_service.queue('activity.getVisitsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course'], date_offset : date_offset});
                        
                    },
                    getVisitsPrc : function(start_date, end_date, interval_date, page_id,_, date_offset){
                        return api_service.queue('activity.getVisitsPrc',{start_date : start_date, end_date : end_date, page_id : page_id, interval_date : interval_date, date_offset : date_offset});
                        
                    },
                    getUsersActivities : function(start_date, end_date){
                        return api_service.queue('activity.getUsersActivities',{start_date : start_date, end_date : end_date});
                        
                    },
                    getDocumentsOpeningCount : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('activity.getDocumentsOpeningCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : ['course'], date_offset : date_offset});
                        
                    },
                    getDocumentsOpeningPrc : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('activity.getDocumentsOpeningPrc',{start_date : start_date, end_date : end_date, page_id : page_id, date_offset : date_offset});
                        
                    },
                    getPostsCount : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('post.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, date_offset : date_offset});
                        
                    },
                    getRequestsCount : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('contact.getRequestsCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, date_offset : date_offset});
                        
                    },
                    getAcceptedCount : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('contact.getAcceptedCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, date_offset : date_offset});
                        
                    },
                    getMessagesCount : function(start_date, end_date, interval_date, page_id, _ , date_offset){
                        return api_service.queue('message.getCount',{start_date : start_date, end_date : end_date, interval_date : interval_date, page_id : page_id, type : [1,2], date_offset : date_offset});
                        
                    },
                    getPages: function( object_name, count, min_date, max_date){
                    return api_service.queue('activity.getPages',{object_name : object_name, count : count, start_date : min_date, end_date : max_date});
                }   
    		};
    		return service;
    	} 
    ]);
    