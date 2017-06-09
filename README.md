# GeoService - AngularJs
An abstraction of the google maps API for easier implementation. Provides methods for generating a map, creating markers with info windows, adding heat map visualization, marker clusters, as well as map bounds and zoom threshold checking for efficient rendering of marker visibility. 

## Dependencies
1) https://github.com/googlemaps/js-marker-clusterer

## Getting Started
Include proper script links to js-marker-clusterer, Google Maps API, and geoService.js file.
```javascript
<body>
    <div id="map"></div>

    <script src="https://maps.googleapis.com/maps/api/js?key=[YOUR_API_KEY]&libraries=visualization" async defer></script>
    <script src="markerclusterer.js"></script>
    <script src="geoService.js"></script>
</body>
```
