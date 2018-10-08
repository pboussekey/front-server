angular.module('API')
    .constant('tags_constants',{
        categories : {
            skill : 'skill',
            career : 'career',
            hobby : 'hobby',
            language : 'language'
         },
         labels : {
            skill : 'Skills',
            career : 'Career Interests',
            hobby : 'Hobbies and Activities',
            language : 'Languages'
         },
         icons : {
            skill : 'i-star',
            career : 'i-xp',
            hobby : 'i-heart',
            language : 'i-globe'
         },
         suggestions : {
            skill : ['Project Management', 'Digital Marketing', 'Business Development','Leadership', 'skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'skill6', 'skill7', 'skill8', 'skill9', 'skill10', 'skill11', 'skill12', 'skill13', 'skill14', 'skill15', 'skill16', 'skill17', 'skill18', 'skill19', 'skill20', 'skill21', 'skill22', 'skill23', 'skill24', 'skill25', 'skill26', 'skill27', 'skill28', 'skill29', 'skill30', 'skill31', 'skill32', 'skill33', 'skill34', 'skill35', 'skill36', 'skill37', 'skill38', 'skill39', 'skill40', 'skill41', 'skill42', 'skill43', 'skill44', 'skill45', 'skill46', 'skill47', 'skill48', 'skill49', 'skill50', 'skill51', 'skill52', 'skill53', 'skill54', 'skill55', 'skill56', 'skill57', 'skill58', 'skill59', 'skill60'],
            career : ['Technology', 'Non-Profit', 'Investment Banking', 'Social Entrepreneurship'],
            hobby : ['Traveling', 'Startup Mentoring', 'Fitness Yoga'],
            language : ['English', 'Spanish', 'Chinese']
         },
         placeholders : {
            skill : 'Press ENTER to add a new skill',
            career : 'Press ENTER to add a new career interest',
            hobby : 'Press ENTER to add a new activity or interest',
            language : 'Add a new language'
         },
    });
