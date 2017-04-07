'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'leaflet-directive'
]).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider.when('/search', {templateUrl: '/static/partials/search/syntax.html', controller: 'SearchCtrl'});
  $routeProvider.when('/search/nearby', {templateUrl: '/static/partials/search/search_nearby.html', controller: 'SearchCtrl'});
  $routeProvider.when('/search/map', {templateUrl: '/static/partials/search/search_map.html', controller: 'SearchCtrl'});
  $routeProvider.otherwise({redirectTo: '/search'});
  $locationProvider.html5Mode(true);
}]);
