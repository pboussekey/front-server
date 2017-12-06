angular.module('EVENTS')
    .constant('events',{
        //LOGIN
        logged: 'logged',
        logout_call: 'logout_call',
        logout_success: 'logout_success',
        //NOTIFICATION 
        notification_received : 'notification_received',
        //CONNECTIONS
        connection_requested : 'connection.request',
        connection_accepted : 'connection.accept',
        connection_removed : 'connection.remove',
        //USER
        user_updated : 'user.update',
        
        // POST
        post_commented: 'post.com',
        post_liked: 'post.like',
        post_updated: 'post.update',
        
        feed_updates: 'feed.hasupdates'
    });