function SearchCtrl($scope, $http, $routeParams, $log, $sce, leafletData, leafletMapEvents) {

  $scope.indexName = "travel";

  $scope.selected = {};

  $scope.center = {
    lat: 37.399285,
    lng: -122.107799,
    zoom: 12
  };

  $scope.searchHotels = function() {
    $http.post('/api/index/'+$scope.indexName+'/query', {
        "size": 10,
        "explain": true,
        "highlight":{},
        "fields":["*"],
        "query": {
            "conjuncts": [
              {
                "term": "hotel",
                "field": "type"
              },
              {
                "boost": 1.0,
                "query": $scope.syntax,
              }
            ]
        }
    }).
    success(function(data) {
        $scope.processResults(data);
    }).
    error(function(data, code) {

    });
  };

  $scope.selectedHotelChanged = function() {
    $scope.findNearby()
  }

  $scope.findNearby = function() {
    $http.post('/api/index/'+$scope.indexName+'/query', {
        "size": 10,
        "explain": true,
        "highlight":{},
        "fields":["*"],
        "query": {
          "conjuncts": [
            {
              "term": "landmark",
              "field": "type"
            },
            {
              "location": {
                "lon": $scope.selected.hotel.fields.geo[0],
                "lat": $scope.selected.hotel.fields.geo[1]
              },
              "distance": "25mi",
              "field": "geo"
            }
          ]
        },
        "sort": [
          {
            "by": "geo_distance",
            "field": "geo",
            "unit": "mi",
            "location": {
              "lon": $scope.selected.hotel.fields.geo[0],
              "lat": $scope.selected.hotel.fields.geo[1]
            }
          }
        ]
    }).
    success(function(data) {
        $scope.nearbyResults = data;
        for(var i in $scope.nearbyResults.hits) {
          hit = $scope.nearbyResults.hits[i];
          dist = $scope.getDistanceFromLatLonInKm(
            $scope.selected.hotel.fields.geo[1],
            $scope.selected.hotel.fields.geo[0],
            hit.fields.geo[1],
            hit.fields.geo[0]
          )
          hit.dist = $scope.roundDist(dist * 1000)
        }
    }).
    error(function(data, code) {

    });
  };

  $scope.markers = {};

$scope.searchBox = function(topLeftLon, topLeftLat, bottomRightLon, bottomRightLat) {
    $http.post('/api/index/'+$scope.indexName+'/query', {
        "size": 10,
        "explain": true,
        "highlight":{},
        "fields":["*"],
        "query": {
            "top_left": {
              "lon": topLeftLon,
              "lat": topLeftLat
            },
            "bottom_right": {
              "lon": bottomRightLon,
              "lat": bottomRightLat
            },
            "field": "geo"
        }
    }).
    success(function(data) {
      $scope.processResults(data);
      $scope.markers = {};
      for(var i in $scope.results.hits) {
        hit = $scope.results.hits[i];
        $scope.markers[hit.id] = {
          lat: hit.fields.geo[1],
          lng: hit.fields.geo[0],
          message: hit.fields.name,
          focus: false,
          draggable: false
        }
      }
    }).
    error(function(data, code) {

    });
  };

    $scope.searchSyntax = function() {
        $http.post('/api/index/'+$scope.indexName+'/query', {
            "size": 10,
            "explain": true,
            "highlight":{},
            "fields":["*"],
            "query": {
                "boost": 1.0,
                "query": $scope.syntax,
            }
        }).
        success(function(data) {
            $scope.processResults(data);
        }).
        error(function(data, code) {

        });
    };

    $scope.expl = function(explanation) {
            rv = "" + $scope.roundScore(explanation.value) + " - " + explanation.message;
            rv = rv + "<ul>";
            for(var i in explanation.children) {
                    child = explanation.children[i];
                    rv = rv + "<li>" + $scope.expl(child) + "</li>";
            }
            rv = rv + "</ul>";
            return rv;
    };

    $scope.roundScore = function(score) {
            return Math.round(score*1000)/1000;
    };

    $scope.roundDist = function(score) {
            return Math.round(score*10)/10;
    };

    $scope.roundTook = function(took) {
        if (took < 1000 * 1000) {
            return "less than 1ms";
        } else if (took < 1000 * 1000 * 1000) {
            return "" + Math.round(took / (1000*1000)) + "ms";
        } else {
            roundMs = Math.round(took / (1000*1000));
            return "" + roundMs/1000 + "s";
        }
	};

    $scope.processResults = function(data) {
        $scope.errorMessage = null;
        $scope.results = data;
        for(var i in $scope.results.hits) {
                hit = $scope.results.hits[i];
                hit.roundedScore = $scope.roundScore(hit.score);
                hit.explanationString = $scope.expl(hit.explanation);
                hit.explanationStringSafe = $sce.trustAsHtml(hit.explanationString);
                for(var ff in hit.fragments) {
                    fragments = hit.fragments[ff];
                    newFragments = [];
                    for(var ffi in fragments) {
                        fragment = fragments[ffi];
                        safeFragment = $sce.trustAsHtml(fragment);
                        newFragments.push(safeFragment);
                    }
                    hit.fragments[ff] = newFragments;
                }
        }
        $scope.results.roundTook = $scope.roundTook(data.took);
    };

    $scope.debugGeoIndex = function() {
        $http.post('/api/debugGeoIndex', {
          "location":[$scope.center.lng,$scope.center.lat]
        }).
        success(function(data) {
          $scope.geojson.data = data;
        }).
        error(function(data, code) {

        });
    };

    $scope.debugBoundingBoxSearch = function() {
        $http.post('/api/debugGeoBoundingBoxSearch', {
          "top_left":[$scope.tl.lng,$scope.tl.lat],
          "bottom_right":[$scope.br.lng,$scope.br.lat]
        }).
        success(function(data) {
          $scope.geojson.data = data;
        }).
        error(function(data, code) {

        });
    };

  $scope.getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in m
    var dLat = $scope.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = $scope.deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos($scope.deg2rad(lat1)) * Math.cos($scope.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  };

  $scope.deg2rad = function(deg) {
    return deg * (Math.PI/180)
  };

  var mapEvents = leafletMapEvents.getAvailableMapEvents();
  for (var k in mapEvents){
      var eventName = 'leafletDirectiveMap.' + mapEvents[k];
      $scope.$on(eventName, function(event){
          if (event.name == "leafletDirectiveMap.moveend") {
              leafletData.getMap().then(function(map) {
                console.log(map.getBounds())
                bounds = map.getBounds()
                $scope.searchBox(bounds._southWest.lng, bounds._northEast.lat, bounds._northEast.lng, bounds._southWest.lat);
              });
          }
      });
  }

}
