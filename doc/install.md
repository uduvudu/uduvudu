# Include in your project

## With RDF for the _styles_

You need to include the following scripts:

    <head>
        <script src="dist/uduvudu.js" type="text/javascript"></script>
    </head>

Prepare a RDF graph with the matchers and templates combined.

        // load styles (matcher and templates) from files
        var styles = rdf.createGraph();
        var matcher = new rdf.LdpStore();

        matcher.graph('matcher.ttl', function(graph, error) {
            if (!error) {styles.addAll(graph);}
        });
        var template = new rdf.LdpStore();
        template.graph('templates.ttl', function(graph, error) {
            if (!error) {styles.addAll(graph);}
        });

The final call `uduvudu.process(store, resource)` to the Uduvudu library can done with help of jQuery like the following. It returns HTML which can be load into the current document.

    var store = new rdf.LdpStore();
    var source = 'http://dbpedia.org/resource/Nature';
    store.graph(source, function (graph, error) {
        if (error == null) {
            console.debug("successfully loaded "+graph.toArray().length+" triples");
            // resource (entry for template search) is same as source in this example
            $("#main").html(uduvudu.process(graph, {'resource': source, 'styles': styles}));
         };
    })

You need to have a `div` defined like the following where the rendered content is loaded into.

    <div id="main">
    </div>

Prerequisites
-------------
The code is based on rdf-ext.js (which includes different rdf parsers and serializer) and underscore. The demo uses bootstrap for a basic design.


## With JS Arrays, and HTML Templates
By defining the _styles_ (matcher & templates) there is no need to create RDF yourself to consume it.

You need to include the following scripts:

    <head>
        <script src="matcher.js" type="text/javascript"></script>
        <script src="dist/uduvudu.js" type="text/javascript"></script>
    </head>

Where `matcher.js` is the database of matchers defined in JS.

The visualizers you load best with jQuery or you include them inside the HTML itself. Needs to be done before uduvudu is called.

    $("#templates").load("templates.html");

This in turn needs a `div` with `id="templates"` to be defined.

    <div id="templates">
    </div>

The final call `uduvudu.process(store, resource)` to the Uduvudu library can done with help of jQuery like the following. It returns HTML which can be load into the current document.

    var store = new rdf.LdpStore();
    var source = 'http://dbpedia.org/resource/Nature';
    store.graph(source, function (graph, error) {
        if (error == null) {
            console.debug("successfully loaded "+graph.toArray().length+" triples");
            // resource (entry for template search) is same as source in this example
            $("#main").html(uduvudu.process(graph, {'resource': source}));
         };
    })

You need to have a `div` defined like the following where the rendered content is loaded into.

    <div id="main">
    </div>

Running the included demo
-------------------------
To make it possible to grab external content on your _local machine_ from the demo page you need to disable cross-site scripting security in your browser. Then open the index.html in your browser.
