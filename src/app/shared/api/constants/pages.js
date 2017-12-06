angular.module('API')
    .constant('pages_constants',{
        pageRoles : {
            ADMIN : 'admin',
            USER : 'user',
            NONE : 'none'
         },
        pageStates : {
            PENDING : 'pending',
            MEMBER : 'member',
            INVITED : 'invited',
            REJECTED : 'rejected',
            NONE : 'none'
        },
        pageAdmission : {
            FREE : 'free',
            OPEN : 'open',
            INVITATION : "invitation"
        },    
        pageTypes : {
            EVENT : 'event',
            GROUP : 'group',
            COURSE :  'course',
            ORGANIZATION :  'organization'
        }
        
    });