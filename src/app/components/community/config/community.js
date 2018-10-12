angular.module('community')
    .factory('community_categories',['session', 'community_service', 'global_search', '$q', function(session, community_service, global_search, $q){
       var promises = {};

       function initPromises(keys){
           angular.forEach(promises, function(deferred){
               deferred.reject();
           });
           promises = {};
           keys.forEach(function(key){
              promises[key] = $q.defer();
           });
       }

       function onResolve(page){
            var toResolve = Object.values(promises).map(function(d){
                return d.promise;
            });
            var keys = Object.keys(promises);
            return $q.all(toResolve).then(function(results){
                var i = 0;
                var r = 0;
                keys.forEach(function(key){
                    var result = results[i];
                    categories[key].count = result.count;
                    categories[key].list = page && page > 1 ? categories[key].list.concat(result.list) : result.list;
                    i++;
                    r += result.list.length;
                });
                return r;

            });
       }

       var categories = {
          all : {
              name : "All",
              key : "all",
              state : "lms.community.all",
              fill : function(search, page, page_size, filters){

                  initPromises(['people', 'events', 'clubs', 'institutions', 'courses']);

                  promises.people.promise = community_service.users(search, 1, 6, null, null, null, null, null, { type : 'affinity' });
                  promises.events.promise = community_service.pages( search, 1, 6, 'event');
                  promises.clubs.promise = community_service.pages( search, 1, 6, 'group');
                  promises.institutions.promise = community_service.pages( search, 1, 6, 'organization', null, null, null, null, null, {"page$title":"ASC"});
                  promises.courses.promise =  community_service.pages( search, 1, 6, 'course');

                  return onResolve();

              }
          },
          people : {
              name : "People",
              key :  "people",
              state : "lms.community.people",
              list : [],
              fill : function(search, page, page_size, filters){

                initPromises(['people']);
                promises.people.promise = community_service.users(
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
                  );
                  return onResolve(page);
              },
              filters : ['organization', 'role', 'tags']
          },
          clubs : {
              name : "Clubs",
              key : "clubs",
              state : "lms.community.clubs",
              list : [],
              fill : function(search, page, page_size, filters){
                  initPromises(['clubs']);
                  promises.clubs.promise = community_service.pages( search, page, page_size, 'group', filters.organization );
                  return onResolve(page);
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
                  initPromises(['events']);
                  promises.events.promise = community_service.pages( search, page, page_size, 'event', filters.organization, null, start, end, strict);
                  return onResolve(page);
              },
              filters : ['events']
          },
          institutions : {
              name : "Institutions",
              key : "institutions",
              state : "lms.community.institutions",
              list : [],
              fill : function(search, page, page_size, filters){
                  initPromises(['institutions']);
                  promises.institutions.promise = community_service.pages( search, page, page_size, 'organization', filters.organization, null, null, null, null, {"page$title":"ASC"} );
                  return onResolve(page);
              },
              filters : []
          },
          courses : {
              name : "Courses",
              key : "courses",
              state : "lms.community.courses",
              list : [],
              fill : function(search, page, page_size, filters){
                  initPromises(['courses']);
                  promises.courses.promise = community_service.pages( search, page, page_size, 'course', filters.organization );
                  return onResolve(page);
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
