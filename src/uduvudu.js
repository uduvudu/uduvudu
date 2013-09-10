var Uduvudu = {};
/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization. 
 * @param {store} store The input graph as an rdfStore Object.
 * @returns {String} oputut Returns the object as a String.
 */
function main (store) {
    var visuals = matcher(store);
    var output = visualizer(visuals);
    return output;
};

/**
 * Recipies helper functions
 */


function createQueries (where, limit) {
    limit = limit || '';
    return  {
                construct:'CONSTRUCT '+where+' WHERE '+where+limit, 
                select: 'SELECT * WHERE '+where+limit 
            }
};

function cutGraph (query, graph) {
        var cutGraph
        graph.execute(query, function(success, graph) {
            cutGraph = graph;
        });
        return cutGraph;
};

function prepareTriple (element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'literal')
        return element.value;
    else
        return '<a href="?uri='+element.value+'">'+_.last(getName.exec(element.value))+'</a>';
};

function showGraph (graph) {
        graph.execute("SELECT * {?s ?p ?o.}", function(success, results) {
            if(success && (! _.isEmpty(results))) { console.log(results.length, results); }
        });
};



/**{
 * Recipies as an Array of functions.
 *
                //store.insert(graph, "default", function (success) {console.log(success);});
 */
var matchFuncs = [
    //NAME: title, text
    function (graph) {
        var query = createQueries('{ ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.}');
        var cGraph = cutGraph(query.construct, graph); 

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 2,
                                context: {title: _.first(results).title.value, text: _.first(results).text.value},
                                template: {name: "title_text"},
                                graph: cGraph,
                                prio: 100000
                            };
            };
        });
        return proposal;
    },
    //NAME: citedBy, List
    function (graph) {
        var query = createQueries('{ ?cites <http://purl.org/ontology/bibo/citedBy> ?o.}');
        var cGraph = cutGraph(query.construct, graph); 

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {citedBy: _.map(results,function(result) {return result.cites.value;})},
                                template: {name: "citedBy"},
                                graph: cGraph,
                                prio: 90000
                            };
            };
        });
        return proposal;
    },
   //NAME: pmid, PubMedID
    function (graph) {
        var query = createQueries('{ ?s <http://purl.org/ontology/bibo/pmid> ?pmid.}');
        var cGraph = cutGraph(query.construct, graph); 

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {pmid: _.first(results).pmid.value},
                                template: {name: "pmid"},
                                graph: cGraph,
                                prio: 90000
                            };
            };
        });
        return proposal;
    },
    //NAME: last resort, unknown triple
    function (graph) {
        var query = createQueries('{ ?s ?p ?o.}',' LIMIT 1');
        var cGraph = cutGraph(query.construct, graph); 

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context:    {
                                                subject: prepareTriple(_.first(results).s),
                                                predicate: prepareTriple(_.first(results).p),
                                                object: prepareTriple(_.first(results).o)
                                            },
                                template: {name: "unknown"},
                                graph: cGraph,
                                prio: 0
                            };
            };
        });
        return proposal; 
    },
    //NAME: zero graph / for logging purpose
    function (graph) {
        var query = 'SELECT * WHERE { ?s ?p ?o.}';
        var getName = /(#|\/)([^#\/]*)$/
        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
//                console.log(results);
//                console.log(_.map(results.toArray(), function (item) {return item.toString();}));
//                console.log(_.map(results, function (item) {return _.last(getName.exec(item.s.value))+" "+_.last(getName.exec(item.p.value))+" "+item.o.value;}));
            }
        });
        return false;
    },
];


/*
 * The matcher (cook) is looking for known structures of basket.
 * @param {store} store The input graph as a rdfStore Object.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
function matcher(inputGraph) {
    var proposals = _.compact(_.map(matchFuncs, function (func){return func(inputGraph);}));
    var sorted = _.sortBy(proposals, function (proposal) {return -proposal.elements;});
//    console.debug("The sorted found proposals:",sorted)
    // recursive check for availalble stuff
    if( _.isEmpty(sorted)) {
        // nothing left end condition
        return ([]);
    } else {
        // the proposal to use
        finalprop = _.first(sorted);
//        showGraph(inputGraph);
        // get out the used triples and rerun matcher
        inputGraph.delete(finalprop.graph, function (bub) {});
//        showGraph(inputGraph);
        return _.union([finalprop],matcher(inputGraph));
    }
};



function visualizer(visuals) {
    var output = "";
    visuals = _.sortBy(visuals, function (visual) {return -visual.prio;});
    _.each(visuals,
        function (visual){
           var template = Handlebars.compile($("#"+visual.template.name).html());
           output += template(visual.context);
        });
    return output;
};
