/*
(function(angular) {

    var users = {};

    function isConnectedUser(user) {
        return users.hasOwnProperty(user.id);
    }

    function getPages(user) {
        if (!users.hasOwnProperty(user.id)) {
            return [];
        }

        return users[user.id];
    }

    function connectedUsers(ws_service) {

        ws_service.get().then(function(s) {
            s.on('user.connected', function(connectedUsers) {
                connectedUsers.forEach(function(state) {
                    users[state[0]] = state[1];
                });
            });
        });

        return {
            isConnected: isConnectedUser,
            getPages: getPages,
        };
    }

    connectedUsers.$inject = ['ws_service'];

    angular.module('ws_module').factory('connectedUsers', connectedUsers);

})(angular);
 * 
 */