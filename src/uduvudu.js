

function main(store) {
    
    var visuals = matcher(store);

    var output = visualizer(visuals);
    return output;
};


var matchFuncs = [
    //NAME: title
    function (graph) {
        var proposal;
        var query = 'SELECT * \
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?title} \
                     FILTER(LANGMATCHES(LANG(?title), \"en\"))}';

        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal = {elements: 1, context:{title: _.first(results).title.value}, template:{name: "title"}};
            }
            else
            {
                proposal = false;
            }
        
        });
        return proposal; 
        },
    //NAME: title, text
    function (graph) {
        var query = 'SELECT *\
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.} \
                     FILTER(LANGMATCHES(LANG(?title), \"en\"))}';

        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal = {elements: 2, context:{title: _.first(results).title.value, text: _.first(results).text.value}, template:{name: "text_title"}};
            }
            else
            {
                 proposal = false;
            }
        
        });
          return proposal;
        },
    //NAME: zero graph
    function (graph) {
        return false;
        },
    ];



function matcher(inputGraph) {

    var proposals = _.compact(_.map(matchFuncs, function (func){return func(inputGraph);}));
    var sorted = _.sortBy(proposals, function (proposal) {return -proposal.elements;});
    if( _.isEmpty(sorted)) {
        return ([{context:{title: "none"}, template:{name: "title"}}]);
    } else {
        return [_.first(sorted)];
    }
};


function visualizer(visuals) {
    console.log(visuals);
    var output = "";
    _.each(visuals,
        function (visual){
           output += "<h1>" + visual.context.title + "</h1>";
        });
    return output;
};
