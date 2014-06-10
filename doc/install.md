Include in your project
-----------------------

You need to include the following scripts:

    <head>
        <script src="lib/underscore-1.6.0.js" type="text/javascript"></script>
        <script src="lib/handlebars-v1.3.0.js" type="text/javascript"></script>
        <script src="lib/rdf_store.js" type="text/javascript"></script>
        <script src="matcher.js" type="text/javascript"></script>
        <script src="src/uduvudu.js" type="text/javascript"></script>
    </head>

Where `matcher.js` is the database of matchers defined in JS.

The visualizers you load best with jQuery or you include them inside the HTML itself. Needs to be done before uduvudu is called.

    $("#visualizer").load("visualizer.html");

Needs a `div` with `id="visualizer"`

    <div id="visualizer">
    </div>

The final call `uduvudu.process(store, resource)` to the Uduvudu library can done with help of jQuery like the following. It returns HTML which can be load into the current document.

    var store = rdfstore.create();
    store.load('remote',source, function(success, amountTriples){
        if(success) {
            console.debug("successfully loaded "+amountTriples+" triples");
            $("#main").html(uduvudu.process(store, resource));
        }; 
    })

You need to have a `div` defined like the following where the rendered content is loaded into.

    <div id="main">
    </div>

Prerequisites
-------------
The code is currently based on rdfstore-js, handlebars and underscore. The demo uses bootstrap for a basic design.

Currently it works only with a fixed version of the [rdfstore-js](https://raw2.github.com/l00mi/rdfstore-js/master/dist/browser/rdf_store.js "rdf_store.js") which you find in the lib directory.


Running the included demo
-------------------------
To make it possible to grab external content from the demo page you need to disable cross-site scripting security in your browser. Then open the index.html in your browser.
