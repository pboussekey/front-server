angular.module('page')
    .factory('pages_config',['session', '$state', function(session, $state){
        var service =
            {
                event :{
                    label : 'event',
                    parent_state : 'lms.user_events',
                    fields : {
                        background : {
                            displayed : true,
                            default : null
                        },
                        date : {
                            displayed : true
                        },
                        logo : {
                            displayed : false,
                            icon : 'i-events'
                        },
                        start_date : {
                            displayed : true,
                            default : null
                        },
                        end_date : {
                            displayed : true,
                            default : null
                        },
                        address : {
                            displayed : true,
                            default : null
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        website : {
                            displayed : true,
                            default : ""
                        },
                        confidentiality : {
                            displayed : true,
                            default : 0,
                            editable : true
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        users : {
                            verb : 'invite',
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : true
                        },
                        channel : {
                            displayed : true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline', order : 0 },
                        users : { name : "Members", href : 'lms.page.users', order : 1 },
                        resources : { name : "Resources", href : 'lms.page.resources', order : 2 }
                    }

                },
                group : {
                    label : 'club',
                    parent_state : 'lms.user_pages',
                    fields : {
                        background : {
                            displayed : true,
                            default : null
                        },
                        logo : {
                            displayed : true,
                            icon : 'i-groups',
                            editable : true,
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        confidentiality : {
                            displayed : true,
                            default : 0,
                            editable : true
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        users : {
                            verb : 'invite',
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : true
                        },
                        channel : {
                            displayed : true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline', order : 0 },
                        users : { name : "Members", href : 'lms.page.users', order : 1 },
                        resources : { name : "Resources", href : 'lms.page.resources', order : 2 }
                    }
                },
                course : {
                    label : 'course',
                    parent_state : 'lms.user_courses',
                    fields : {
                        background : {
                             displayed : true,
                             default : null
                        },
                        logo : {
                            displayed : true,
                            icon : 'i-courses',
                            editable : true,
                            default : null,
                            label : "Picture"
                        },
                        organization : {
                            displayed : true
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        website : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        confidentiality : {
                            displayed : false,
                            default : 2
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        is_published : {
                            displayed : true,
                            default : 0
                        },
                        channel : {
                            displayed : true
                        },
                        users : {
                            verb : 'add',
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : true
                        },
                        instructors:{
                            displayed: true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline', order : 0 },
                        content : { name : "Content", href : 'lms.page.content', order : 1 },
                        resources : { name : "Materials", href : 'lms.page.resources', order : 2},
                        users : { name : "Members", href : 'lms.page.users', order : 3 },
                        analytics : { name : "Analytics", href : 'lms.page.analytics', roles : ['admin'], order : 4 }
                    }
                },
                organization : {
                    label : 'institution',
                    fields : {
                        background : {
                             displayed : true,
                             default : null
                        },
                        logo : {
                            displayed : true,
                            editable : true,
                            icon : 'i-schools',
                            default : null,
                            label : "Logo"
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        address : {
                            displayed : true,
                            default : null
                        },
                        confidentiality : {
                            displayed : false,
                            default : 0
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        channel : {
                            displayed : false
                        },
                        users : {
                            verb : 'add',
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline', order : 0 },
                        community : { name : "Community", href : 'lms.page.users', order : 1 },
                        users : { name : "Members", href : 'lms.page.users', order : 1 },
                        resources : { name : "Resources", href : 'lms.page.resources', order : 2 },
                        relationship : { name : "Relationship", href : 'lms.page.relationship', order : 3 },
                        grades : { name : "Grades", href : 'lms.page.grades', roles : ['admin'], order : 4 },
                        analytics : { name : "Analytics", href : 'lms.page.analytics', roles : ['admin'], order : 5 },
                        custom : { name : "Custom", href : 'lms.page.custom', roles : [1], order : 6 }
                    }



                },
                getTabs : function(type, editable){
                    var page_type = service[type];
                    var tabs = {};
                    Object.keys(page_type.tabs).forEach(function(key){
                        var tab = page_type.tabs[key];
                        if(session.roles && session.roles[1] || !tab.roles || tab.roles.some(function(role_id){
                            return session.roles && session.roles[role_id] !== undefined || (role_id === 'admin' && editable);
                        })){
                            tabs[key] = tab;
                        }
                    });
                    return tabs;
                },
                getLink : function(tab, page){
                    return $state.href(tab.href, Object.assign({ id : page.id,  type : page.type }, tab.params));
                },
                isDisplayed : function(field){
                    if(!field || !field.displayed){
                        return false;
                    }
                    if(!Array.isArray(field.displayed)){
                        return field.displayed;
                    }
                    return field.displayed.some(function(role_id){
                        return session.roles && session.roles[role_id] !== undefined;
                    });
                },
                getPage : function(type){
                    var page_type = service[type].fields;
                    var page = {};
                    Object.keys(page_type).forEach(function(key){
                        if(page_type[key].default !== undefined){
                            page[key] = page_type[key].default;
                        }
                    });
                    return angular.copy(page);
                }
            };
        return service;

    }]);
