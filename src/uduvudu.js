

function main(store) {
    
    var visuals = matcher(store);

    var output = visualizer(visuals);
    return output;
};


function matcher(inputGraph) {

      var query = 'SELECT ?o \
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?o} \
                     FILTER(LANGMATCHES(LANG(?o), \"en\"))}';

      inputGraph.execute(query, function(success, results) {
            console.log(results); 
        });

    return ([{context:{title: "test", content:"none"}, template:{name: "tempSimple"}}]);
};


function visualizer(visuals) {
    var output = "";
    _.each(visuals,
        function (visual){
           output += "<h1>" + visual.context.title + "</h1>";
        });
    return output;
};
