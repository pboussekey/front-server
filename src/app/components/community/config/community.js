angular.module('community')
    .factory('community_categories',['session', 'community_service', 'global_search', function(session, community_service, global_search){
       var categories = {
          all : {
              name : "All",
              key : "all",
              state : "lms.community.all",
              fill : function(search, page, page_size, filters){

                  community_service.users(search, 1, 6, null, null, null, null, null, { type : 'affinity' }).then(function(r){
                      categories.people.count = r.count;
                      categories.people.list = r.list;
                  });
                  community_service.pages( search, 1, 6, 'event')
                      .then(function(r){
                          categories.events.count = r.count;
                          categories.events.list = r.list;
                  });
                  community_service.pages( search, 1, 6, 'group')
                      .then(function(r){
                          categories.clubs.count = r.count;
                          categories.clubs.list = r.list;
                  });
                  community_service.pages( search, 1, 6, 'organization', null, null, null, null, null, {"page$title":"ASC"})
                      .then(function(r){
                          categories.institutions.count = r.count;
                          categories.institutions.list = r.list;
                  });

                  if(session.roles[1]){
                      community_service.pages( search, 1, 6, 'course')
                          .then(function(r){
                              categories.courses.count = r.count;
                              categories.courses.list = r.list;
                      });
                  }
                  return 0;

              }
          },
          people : {
              name : "People",
              key :  "people",
              state : "lms.community.people",
              list : [],
              fill : function(search, page, page_size, filters){
                  return community_service.users(
                          search,
                          page,
                          page_size, null,
                          filters.organization,
                          filters.role, null,
                          filters.page_type,
                          { type : 'affinity' },
                          null,
                          filters.is_pinned,
                          null,
                          filters.tags
                  )
                      .then(function(r){
                          categories.people.list = page > 1 ? categories.people.list.concat(r.list) : r.list;
                          categories.people.count = r.count;
                          return r.list.length;
                  });
              },
              filters : ['organization', 'role', 'tags']
          },
          clubs : {
              name : "Clubs",
              key : "clubs",
              state : "lms.community.clubs",
              list : [],
              fill : function(search, page, page_size, filters){
                  return community_service.pages( search, page, page_size, 'group', filters.organization )
                      .then(function(r){
                          categories.clubs.list = page > 1 ? categories.clubs.list.concat(r.list) : r.list;
                          categories.clubs.count = r.count;
                          return r.list.length;
                  });
              }
          },
          events : {
              name : "Events",
              key : "events",
              state : "lms.community.events",
              list : [],
              fill : function(search, page, page_size, filters){
                  var start = filters.events === 'upcoming'  ? new Date().toISOString() : null;
                  var end = filters.events === 'past' ? new Date().toISOString() : null;
                  var strict =  filters.events === 'past';
                  return community_service.pages( search, page, page_size, 'event', filters.organization, null, start, end, strict)
                      .then(function(r){
                          categories.events.list = page > 1 ? categories.events.list.concat(r.list) : r.list;
                          categories.events.count = r.count;
                          return r.list.length;
                  });
              },
              filters : ['events']
          },
          institutions : {
              name : "Institutions",
              key : "institutions",
              state : "lms.community.institutions",
              list : [],
              fill : function(search, page, page_size, filters){
                  return community_service.pages( search, page, page_size, 'organization', filters.organization, null, null, null, null, {"page$title":"ASC"} )
                      .then(function(r){
                          categories.institutions.list = page > 1 ? categories.institutions.list.concat(r.list) : r.list;
                          categories.institutions.count = r.count;
                          return r.list.length;
                  });
              },
              filters : []
          },
          courses : {
              name : "Courses",
              key : "courses",
              state : "lms.community.courses",
              list : [],
              fill : function(search, page, page_size, filters){
                  return community_service.pages( search, page, page_size, 'course', filters.organization ).then(function(r){
                      categories.courses.list = page > 1 ? categories.courses.list.concat(r.list) : r.list;
                      categories.courses.count = r.count;
                      return r.list.length;
                  });
              },
              filters : ['organization']
          }

      };
      global_search.getBootstrap().then(function(bootstrap){
              Object.assign(categories.people, { count : bootstrap.users.count, list : bootstrap.users.list.map(function(u){ return u.id;} ) });
              Object.assign(categories.events, { count : bootstrap.events.count, list : bootstrap.events.list.map(function(p){ return p.id;} )});
              Object.assign(categories.clubs, { count : bootstrap.groups.count, list : bootstrap.groups.list.map(function(p){ return p.id;} )});
              Object.assign(categories.institutions, { count : bootstrap.organizations.count, list : bootstrap.organizations.list.map(function(p){ return p.id;} )});
              if(!!session.roles[1]){
                  Object.assign(categories.courses, { count : bootstrap.courses.count, list : bootstrap.courses.list.map(function(p){ return p.id;} )});
              }
        });
        return categories;

    }]);
