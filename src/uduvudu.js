/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization. 
 * @param {store} store The input graph as an rdfStore Object.
 * @returns {String} oputut Returns the object as a String.
 */
function main(store) {
    
    var visuals = matcher(store);
    var output = visualizer(visuals);
    return output;
};


/**
 * Recipes as an Array of functions.
 *
 */
var matchFuncs = [
    //NAME: title, text
    function (graph) {
        var query = 'SELECT *\
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.} }';

        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal = {elements: 2, context:{title: _.first(results).title.value, text: _.first(results).text.value}, template:{name: "title_text"}};
            }
            else
            {
                 proposal = false;
            }
        
        });
          return proposal;
        },
    //NAME: title
    function (graph) {
        var proposal;
        var query = 'SELECT * \
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?title} }';

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
    //NAME: zero graph
    function (graph) {
        var query = 'SELECT *\
                     FROM NAMED <inputgraph> { GRAPH <inputgraph> { ?s <http://purl.org/dc/terms/title> ?o.} }';
        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                console.log(results);
            }
        });
        return false;
        },
    ];



function matcher(inputGraph) {
    var proposals = _.compact(_.map(matchFuncs, function (func){return func(inputGraph);}));
    var sorted = _.sortBy(proposals, function (proposal) {return -proposal.elements;});
    console.debug("The sorted found proposals:",sorted)
    if( _.isEmpty(sorted)) {
        return ([{context:{title: "none"}, template:{name: "title"}}]);
    } else {
        return [_.first(sorted)];
    }
};



function visualizer(visuals) {
    var output = "";

    _.each(visuals,
        function (visual){
           var template = Handlebars.compile($("#"+visual.template.name).html());
           output += template(visual.context);
        });
    return output;
};
