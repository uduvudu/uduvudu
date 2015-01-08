Include in your project
-----------------------

You need to include the following scripts:

    <head>
        <script src="lib/underscore-1.6.0.js" type="text/javascript"></script>
        <script src="lib/rdf.js"></script>
        <script src="lib/n3-browser.js"></script>
        <script src="lib/jsonld.js"></script>
        <script src="lib/rdf-ext.js"></script>
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

    var store = new rdf.LdpStore();
    var source = 'http://dbpedia.org/resource/Nature';
    store.graph(source, function (graph, error) {
        if (error == null) {
            console.debug("successfully loaded "+graph.toArray().length+" triples");
            // resource (entry for template search) is same as source in this example
            $("#main").html(uduvudu.process(graph, source));
         };
    })

You need to have a `div` defined like the following where the rendered content is loaded into.

    <div id="main">
    </div>

Prerequisites
-------------
The code is currently based on rdf.js, rdf-ext.js and underscore. The demo uses bootstrap for a basic design.


Running the included demo
-------------------------
To make it possible to grab external content from the demo page you need to disable cross-site scripting security in your browser. Then open the index.html in your browser.
