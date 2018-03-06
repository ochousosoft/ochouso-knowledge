var env = {
    'development': {
        port: process.env.PORT || 5002,
        hostname: process.env.HOSTNAME,
        api_public: ['*']
    },

    'production': {
        port: process.env.PORT || 8013,
        hostname: process.env.HOSTNAME,
        api_public: ['*']
    }
};

module.exports = env;