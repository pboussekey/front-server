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
        pageConfidentiality : {
            0 : 'public',
            1 : 'closed',
            2 :  'secret'
        },    
        pageTypes : {
            EVENT : 'event',
            GROUP : 'group',
            COURSE :  'course',
            ORGANIZATION :  'organization'
        }
        
    });