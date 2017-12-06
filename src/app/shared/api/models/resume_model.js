
angular.module('API')
    .factory('resume_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*48,  // 2 days.
            
            cache_size: 120,
            cache_model_prefix: 'resume.',
            cache_list_name: 'resume.cached',
            
            _method_get: 'resume.get',
            
            types: {
                0: {name:'about', title:'RESUME_ABOUT'},
                1: {name:'experience', title:'RESUME_EXPERIENCE',del:'DELETE_EXPERIENCE'},
                2: {name:'education', title:'RESUME_EDUCATION',del:'DELETE_EDUCATION'},
                4: {name:'volunteer', title:'RESUME_VOLUNTEER',del:'DELETE_VOLUNTEER'},
                5: {name:'publication', title:'RESUME_PUBLICATION',del:'DELETE_PUBLICATION'},
                7: {name:'project', title:'RESUME_PROJECT',del:'DELETE_PROJECT'},
                8: {name:'language', title:'RESUME_LANGUAGE',del:'DELETE_LANGUAGE'}
            },
            languageLevels : {
                1 : 'Elementary proficiency',
                2 : 'Limited working proficiency',
                3 : 'Professional working proficiency',
                4 : 'Full professional proficiency',
                5 : 'Native or bilingual proficiency'
            }
        });
        
        return service;
    }]);