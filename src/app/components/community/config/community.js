angular.module('community')
    .factory('community_categories',['session', 'community_service', 'global_search', '$q', function(session, community_service, global_search, $q){
       var _promises = {};
       var filters = {};
       function initPromises(promises, concat){
           angular.forEach(_promises, function(deferred){
               deferred.reject();
           });
           _promises = {};
           angular.forEach(promises,function(promise, key){
                var deferred = $q.defer();
                promise.then(function(result){
                    deferred.resolve(result);
                });
                _promises[key] = deferred;
           });
           return onResolve(concat);
       }

       function onResolve(concat){
            var d = $q.defer();
            var promises = Object.values(_promises).map(function(deferred){
                return deferred.promise;
            });
            var keys = Object.keys(_promises);
            _promise = {};
            $q.all(promises).then(function(results){
                var i = 0;
                var r = 0;
                keys.forEach(function(key){
                    var result = results[i];
                    categories[key].count = result.count;
                    categories[key].list = concat ? categories[key].list.concat(result.list) : result.list;
                    i++;
                    r += result.list.length;
                });
                d.resolve(r);

            }, function(){
            });
            return d.promise;
       }

       var categories = {
          all : {
              name : "All",
              key : "all",
              state : "lms.community.all",
              fill : function(search, page, page_size, filters){
                  this.last_search = search;
                  this.last_filters = filters;
                  return initPromises({
                      'people' : community_service.users(search, 1, 6, null, null, null, null, null, { type : 'affinity' }),
                      'events' : community_service.pages( search, 1, 6, 'event'),
                      'clubs' : community_service.pages( search, 1, 6, 'group'),
                      'institutions' : community_service.pages( search, 1, 6, 'organization', null, null, null, null, null, {"page$title":"ASC"}),
                      'courses' : community_service.pages( search, 1, 6, 'course')}, page > 1);

              }
          },
          people : {
              name : "People",
              key :  "people",
              state : "lms.community.people",
              list : [],
              fill : function(search, page, page_size, filters){
                  this.last_search = search;
                  this.last_filters = filters;
                  return initPromises({'people' : community_service.users(
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
                    )}, page > 1);
              },
              filters : ['organization', 'role', 'tags']
          },
          clubs : {
              name : "Clubs",
              key : "clubs",
              state : "lms.community.clubs",
              list : [],
              fill : function(search, page, page_size, filters){
                  return initPromises({'clubs' : community_service.pages( search, page, page_size, 'group', filters.organization ) }, page > 1);
              }
          },
          events : {
              name : "Events",
              key : "events",
              state : "lms.community.events",
              list : [],
              fill : function(search, page, page_size, filters){
                  this.last_search = search;
                  this.last_filters = filters;
                  var start = filters.events === 'upcoming'  ? new Date().toISOString() : null;
                  var end = filters.events === 'past' ? new Date().toISOString() : null;
                  var strict =  filters.events === 'past';
                  return initPromises({'events': community_service.pages( search, page, page_size, 'event', filters.organization, null, start, end, strict)}, page > 1);
              },
              filters : ['events']
          },
          institutions : {
              name : "Institutions",
              key : "institutions",
              state : "lms.community.institutions",
              list : [],
              fill : function(search, page, page_size, filters){
                  this.last_filters = filters;
                  return initPromises({ 'institutions' : community_service.pages( search, page, page_size, 'organization', filters.organization, null, null, null, null, {"page$title":"ASC"} )}, page > 1);
              },
              filters : []
          },
          courses : {
              name : "Courses",
              key : "courses",
              state : "lms.community.courses",
              list : [],
              fill : function(search, page, page_size, filters){
                  this.last_search = search;
                  this.last_filters = filters;
                  return initPromises({'courses' : community_service.pages( search, page, page_size, 'course', filters.organization )}, page > 1);
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
