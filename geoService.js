(function ()
{
    "use strict";

    angular.module(APPNAME)
        .service("geoService", GeoService);

    function GeoService()
    {
        var svc = this;

        svc.lastZoom;
        svc.markerCluster;

        svc.initMap = _initMap;
        svc.createMarker = _createMarker;
        svc.addMarkersToMap = _addMarkersToMap;
        svc.getGeocoder = _getGeocoder;
        svc.getNewHeatMapData = _getNewHeatMapData;
        svc.getHeatMap = _getHeatMap;
        svc.showMarkerClusters = _showMarkerClusters;
        svc.showInfo = _showInfoWindow;
        svc.getMarkersFromArray = _getMarkersFromArray;
        svc.markersBoundsCheck = _markersBoundsCheck;
        svc.onMapIdle = _onMapIdle;
        svc.setMarkerVisibility = _setMarkerVisibility;
        svc.centerAndZoom = _centerAndZoom;


        //==========** THE FOLD **==========

        function _initMap(mapCenter, mapOptions, mapId)
        {
            var centerLatLng = new google.maps.LatLng(mapCenter.lat, mapCenter.long);
            mapOptions.center = centerLatLng;

            var map = new google.maps.Map(document.getElementById(mapId), mapOptions);

            return map;
        }
        function _getGeocoder()
        {
            return new google.maps.Geocoder();
        }
        function _setMarkerVisibility(marker, isVisible)
        {
            marker.setVisible(isVisible);
        }
        function _markerBoundsCheck(map, marker, options)
        {
            var isInBounds = map.getBounds().contains(marker.getPosition());
            // marker is in visible bounds
            options.onIsInBounds(marker, isInBounds);
        }
        function _markersBoundsCheck(map, markers, options)
        {
            for (var i = 0; i < markers.length; i++)
            {
                _markerBoundsCheck(map, markers[i], options);
            }
        }

        function _onMapIdle(map, mapOpts)
        {
            google.maps.event.addListener(map, "idle",
                function ()
                {
                    var boundRequest = {};
                    boundRequest.northEastLatitude = map.getBounds().getNorthEast().lat();
                    boundRequest.northEastLongitude = map.getBounds().getNorthEast().lng();
                    boundRequest.southWestLatitude = map.getBounds().getSouthWest().lat();
                    boundRequest.southWestLongitude = map.getBounds().getSouthWest().lng();
                    //console.log(boundRequest);


                    mapOpts.onIdle(boundRequest, mapOpts.onBoundChanged);



                });
        }

        function _getMarkersFromArray(locArr, markerOpts)
        {
            if (locArr)
            {
                //console.log(locArr)
                var markers = [];
                for (var i = 0; i < locArr.length; i++)
                {
                    if (locArr[i].latitude && locArr[i].longitude)
                    {
                        var marker = _createMarker(locArr[i], markerOpts);

                        markers.push(marker);
                    }
                }
                return markers;
            }
        }
        //PASS IN OPTIONS "model.id = LOC[options.entityId]"
        //pass in another one (title getter function) for the title
        function _createMarker(loc, markerOpts)
        {
            var latLng = new google.maps.LatLng(loc.latitude, loc.longitude);

            var marker = new google.maps.Marker({
                position: latLng
                , animation: google.maps.Animation.DROP
                , visible: markerOpts.markerIsVisible||false
            });

            marker.model = {
                id: loc[markerOpts.entityId]
                , latLng: latLng
                , lat: latLng.lat()
                , lng: latLng.lng()
                , data: loc
            };


            if (markerOpts.getTitle)
            {
                markerOpts.getTitle(marker, loc);
            }

            return marker;
        }

        function _addMarkersToMap(map, newMarkers, markerOpts)
        {
            //console.log(Object.values(markerDict))

            markerOpts.infoWindow = markerOpts.infoWindow || 0;
            markerOpts.zoomVisibility = markerOpts.zoomVisibility || 0;


            var infoWindow;
            if (markerOpts.infoWindow)
            {
                infoWindow = _getNewInfoWindow();
            }

            //ADD TO MAP REGARDLESS OF IF INFOWINDOW IS COMING IN
            for (var i = 0; i < newMarkers.length; i++)
            {
                if (markerOpts.infoWindow)
                {
                    newMarkers[i].model.infoWindow = infoWindow;
                    /* Open marker on click */
                    google.maps.event.addListener(newMarkers[i], 'click', markerOpts.onClick);

                }
                newMarkers[i].setMap(map);
            }

            //on threshold hit/changed MOVE TO NEW FUNCTION
            if (markerOpts.onThresholdChange && markerOpts.zoomThreshold)
            {
                _onThresholdCrossed(map, markerOpts);
            }

            // svc.markerCluster = _initMarkerClusterer(map, Object.values(markerDict));
        }
        function _onThresholdCrossed(map, markerOpts)
        {
            /* Change markers on zoom */
            google.maps.event.addListener(map, 'zoom_changed',
                function ()
                {
                    var currZoom = map.getZoom();
                    var tholdCrossed = _thresholdCheck(currZoom, markerOpts.zoomThreshold);

                    if (tholdCrossed)
                    {
                        //in controller
                        markerOpts.onThresholdChange(tholdCrossed);
                    }
                }
            );
        }
        function _showMarkerClusters(map, markers)
        {
            var options = {
                imagePath: '/js-marker-clusterer/images/m'
            };

            var markerCluster = new MarkerClusterer(map, markers, options);

            return markerCluster;
        }
        function _getNewHeatMapData(oldMapData, newMarkers)
        {
            if (newMarkers.length > 0)
            {
                for (var i = 0; i < newMarkers.length; i++)
                {
                    oldMapData.push(newMarkers[i].model.latLng);
                }
                return oldMapData;
            }
        }
        function _getHeatMap(map, heatMapData)
        {
            var heatmap = new google.maps.visualization.HeatmapLayer({
                data: heatMapData
            });

            heatmap.setMap(map);

            return heatmap;
        }
        //has crossed threshold function returns either null(hasn't been crossed), -1(under threshold), or +1 (over threshold)
        //separate fx accept array of markers & bool (for setVisible) => whether to make visibile or not
        //only needs current zoom, what is the threshold level, what was the last level
        function _thresholdCheck(currZoom, threshold)
        {
            var tholdCrossed = null;

            if (currZoom >= threshold && svc.lastZoom >= threshold || currZoom < threshold && svc.lastZoom < threshold)
            {
                tholdCrossed = null;
            }
            else if (currZoom >= threshold)
            {
                tholdCrossed = 1;
            }
            else
            {
                tholdCrossed = -1;
            }



            return tholdCrossed;
        }
        function _makeUnique(array)
        {
            var a = array.concat();
            for (var i = 0; i < a.length; ++i)
            {
                for (var j = i + 1; j < a.length; ++j)
                {
                    if (a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        }
        function _showInfoWindow(marker, _getWinContent, map)
        {
            var win = marker.model.infoWindow;

            var winContent = _getWinContent(marker.model);

            google.maps.event.addListener(map, "click", function (event)
            {
                win.close();
            });

            win.setContent(winContent);
            win.open(map, marker);
        }

        function _getNewInfoWindow()
        {
            return new google.maps.InfoWindow();
        }

        function _centerAndZoom(map, marker, zoom)
        {
            if (marker.getPosition)
            {
                map.setCenter(marker.getPosition());
                map.setZoom(zoom);
            }
            if (!marker.getPosition)
            {
                var newMarker = new google.maps.Marker({
                    position: marker
                , map: map
                , visible: false
                });

                map.setCenter(newMarker.getPosition());
                map.setZoom(zoom);
            }
        }
    };
})();