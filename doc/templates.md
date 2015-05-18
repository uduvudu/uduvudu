Templates
---------

Based on the tree structures (as a JavaScript objects) extracted by the matcher the templates are rendering the output.

Right now we use the [Underscore](http://underscorejs.org/#template) template engine. The templates need to be defined inside a `div` with the id `visualizer`.

The following example shows an example of a template. The structure provided by the matcher is structured as a tree. Where templateVariable from the matcher (e.g. `person_name`) is the root. The leafs which are literals can be accessed through the variable `u` which represents the language best matched. Under the variable `l` an array with all available languages of this variable can be found.

    <script id="person_name" type="text/x-handlebars-template">
      <div style="height: 235px; width: 235px; float: left; overflow: hidden;">
        <%-person_name.lastName.u%> <%-person_name.firstName.u%>
      </div>
    </script>

If it is necessary to add JavaScript to the output to make the template work correctly, you can specify this by the suffix `_js` in the template id. (This might change soon to be a data-type attribute.)

The following pair load a Google Map based on the coordinates.

    <script id="location" type="text/x-handlebars-template">
        <div id="map-canvas" style="height: 235px; width: 235px; float: left;">
            <big>&#8982;</big> <%-location.lat.u%> / <%-location.long.u%>
        </div>
    </script>

    <script id="location_js" type="text/x-handlebars-template">
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyAFRTcPPyYit9ERj9COlgpgYW-Ve-lUeUs&sensor=false&callback=initializeMap";
            document.body.appendChild(script);
       
            initializeMap = function () {
                var myLatlng = new google.maps.LatLng(<%-location.lat.u%>, <%-location.long.u%>);
                var mapOptions = { center: myLatlng, disableDefaultUI: true, zoomControl: true, zoom: 12, mapTypeId: google.maps.MapTypeId.ROADMAP };
                var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
           };
    </script>

For further details refer to the provided examples.
