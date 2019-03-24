
(function() {
    'use strict';

    angular.module("ionic-ajax-interceptor", ['ionic']);

}());
(function(app) {
    'use strict';

    app.provider("AjaxInterceptor", ["$httpProvider", function($httpProvider) {

        var _config = {
            title: "Error",
            defaultMessage: "Unknown error",
            authorizationHeader: "Authorization",
            authorizationToken: null,
            stateChangeError: true,
            fallbackIp: null,
            errHandler : {}
        };

        return {
            config: function (options) {
                angular.extend(_config, options);

                $httpProvider.interceptors.push(["$rootScope", "$q", "$injector", "Constants", function($rootScope, $q, $injector, Constants) {
                    return {
                        request: function(req) {
                            $rootScope.$broadcast('loading:show');

                            if ( _config.authorizationToken ) {
                                req.headers[ _config.authorizationHeader ] = _config.authorizationToken;
                            }
                            req.headers['App-Version'] = Constants.version;

                            return req;
                        },
                        requestError: function(err) {
                            $rootScope.$broadcast('loading:hide');
                            return $q.reject(err);
                        },
                        response: function(response) {
                            $rootScope.$broadcast('loading:hide');
                            return response;
                        },
                        responseError : function (err) {
                            $rootScope.$broadcast('loading:hide');
                            if (err.status == 0 || err.status == -1 || err.status >= 500) {
                                var aux = err.config.url.split("/");
                                //
                                // Swith between fallback and old ip in order to get good response
                                //
                                if (aux[2] != _config.fallbackIp) {
                                    aux[2] = _config.fallbackIp;
                                    _config.svdUrl = err.config.url;
                                    err.config.url = aux.join("/");
                                }else{
                                    err.config.url = _config.svdUrl;
                                    if (Number(err.status) < 500){
                                        alert("Va rugam verificati conexiunea la internet, aplicatia nu s-a putut conecta la server." );
                                    }else{
                                        alert("Va rugam verificati conexiunea la internet, aplicatia nu s-a putut conecta la server. \nStatus:" + err.status );
                                    }
                                }
                                var $http = $injector.get('$http');
                                return $http(err.config);
                            }
                            if (_config.errHandler[err.status]){
                                _config.errHandler[err.status](err);
                                return {};
                            }
                            return $q.reject(err);
                        }
                    }
                }])
            },
            $get: [
                '$ionicPopup',
                '$ionicLoading',
                '$rootScope',
                function($ionicPopup, $ionicLoading, $rootScope) {

                    var _ajaxRequestsInQ = 0;

                    /**
                     * Show loading modal
                     * @private
                     */
                    var _showLoading = function() {
                        if (_ajaxRequestsInQ === 0 ) {
                            $ionicLoading.show({
                                content: 'Loading',
                                animation: 'fade-in',
                                showBackdrop: false,
                                maxWidth: 200,
                                showDelay: 0
                            });
                        }
                        _ajaxRequestsInQ++;
                    };
                    /**
                     * Hide loading modal
                     * @private
                     */
                    var _hideLoading = function() {
                        _ajaxRequestsInQ--;
                        if ( _ajaxRequestsInQ == 0 ) {
                            $ionicLoading.hide();
                        } else if ( _ajaxRequestsInQ < 0 ) {
                            // make sure _ajaxRequestsInQ doesn't go bellow 0
                            _ajaxRequestsInQ = 0;
                        }
                    };

                    return {
                        /**
                         * Set up listeners
                         */
                        run: function() {
                            if ( _config.stateChangeError ) {
                                //
                                // Listen for resolved errors in ui-view
                                //
                                $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                                    $ionicPopup.alert({
                                        title: _config.title,
                                        content: error.message || _config.defaultMessage
                                    });
                                });
                            }
                            //
                            // Listen for show loading screen event
                            //
                            $rootScope.$on('loading:show', function() {
                                _showLoading();
                            });
                            //
                            // Listen for hide loading screen event
                            //
                            $rootScope.$on('loading:hide', function() {
                                _hideLoading();
                            });
                        },
                        setErrorHandler : function(errHandler){
                            _config.errHandler = errHandler;
                        },
                        /**
                         *
                         * @param token
                         */
                        setAuthorizationToken: function(token) {
                            _config.authorizationToken = token;
                        },
                        getAuthorizationToken : function(){
                            return _config.authorizationToken;
                        },
                        /**
                         *
                         */
                        showLoading: function() {
                            _showLoading();
                        },
                        /**
                         *
                         */
                        hideLoading: function() {
                            _hideLoading();
                        }
                    };
                }]
        };
    }]);

}(angular.module("ionic-ajax-interceptor")));