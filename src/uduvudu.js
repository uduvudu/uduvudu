// ## Constructor
function Uduvudu(language, device) {
  if (!(this instanceof Uduvudu))
      return new Uduvudu(language, device);
};


Uduvudu.prototype = {
/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization.
 * @param {store} store The input graph as an rdfStore Object.
 * @returns {String} oputut Returns the object as a String.
 */
    process: function (store, resource, language, device) {
        var u = this;

        var language = language || navigator.language.substring(0,2) || "en";
        var device = device || "desktop";

        var visuals = u.matcher(store);
        var output = u.visualizer(visuals, language, device);
        return output;
    },

/*
 * The matcher (cook) is looking for known structures of basket.
 * @param {store} store The input graph as a rdfStore Object.
 * @param {resource} The resource this store is about.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
    matcher: function (inputGraph, resource) {
        // use all functions to see what matches
        var proposals = _.compact( //delete unmatched ones
                            _.map(matchFuncs, function (func){ //map whole function array
                                return _.first(_.values(func))(inputGraph, resource);} //return the result of the lookup
                            )
                        );

        // sort the proposals by number of elements used
        var sorted = _.sortBy(proposals, function (proposal) {return -proposal.elements;});

        // recursive check for availalble stuff
        if( _.isEmpty(sorted)) {
            // nothing left end condition
            return ([]);
        } else {
            // the proposal to use
            finalprop = _.first(sorted);
            // get out the used triples and rerun matcher
            inputGraph.delete(finalprop.graph);
            // return the union of all graphs
            return _.union([finalprop],this.matcher(inputGraph));
        }
    },

 /*
 * The visualizer (server) takes the renderables and renders it regarding language and device.
 * @param {visuals} store The input graph as a rdfStore Object.
 * @param {language} The language which shall be used for rendering.
 * @param {device} The device the html shall be rendered for.
 * @returns {string} outputs the string representing the rendred graph.
 */
    visualizer: function (visuals, language, device) {
        var output = "";
        // order visuals
        visuals = _.sortBy(visuals, function (visual) {return -visual.prio;});
        _.each(visuals,
            function (visual){
               var template = Handlebars.compile($("#"+visual.template.name).html());
               output += template(languageFlattener(visual.context, language));
            });
        return output;
    }
}

/**
 * Recipies helper functions
 */
function createQueries (where, modifier) {
    modifier = modifier || '';
    return  {
                construct:'CONSTRUCT '+where+' WHERE '+where+' '+modifier,
                select: 'SELECT * WHERE '+where+' '+modifier
            }
};

function cutGraph (query, graph) {
    var cutGraph
    graph.execute(query, function(success, graph) {
        cutGraph = graph;
    });
    return cutGraph;
};

function findMatchFunc(name) {
    return _.first(_.values(_.find(matchFuncs, function (func) {return _.first(_.keys(func)) == name;})));
}

function matchArrayOfFuncs(graph, names) {
    return _.map(names, function (name) {return findMatchFunc(name)(graph);});
}

function prepareTriple (element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'literal')
        return element.value;
    else
        return '<a href="?uri='+element.value+'">'+_.last(getName.exec(element.value))+'</a>';
};

function showGraph (graph) {
    graph.execute("SELECT * {?s ?p ?o.}", function(success, results) {
        if(success && (! _.isEmpty(results))) { console.log(results.length, _.map(results, function(res){return res.s.value+"  -  "+res.p.value+"  -  "+res.o.value;})); }
    });
};

var languageFlattener = function(context, language) {
    return _.object(_.keys(context), _.map(_.values(context), function(lang) {
            if (_.isString(lang) || _.isArray(lang)) {
                return {u: lang}
            } else {
                var user;
                if(lang[language]) {
                    user = lang[language];
                } else {
                    if (lang['undefined']) {
                        user = lang['undefined'];
                    } else {
                        user = _.first(_.toArray(lang));
                    }
                }
            }
            return {u: user, l: lang}
        }));
}

/**{
 * Recipies as an Array of functions.
 *
 */
var matchFuncs = [
    //NAME: title, text
    {"title,text": function (graph) {
/*
        var proposal = false;
        var proposals = matchArrayOfFuncs(graph,['title','text']);
        if (_.every(proposals, _.identity)) {
            console.log(proposals);
            proposal = {
                                elements: _.map(proposals, function (proposal) {return _.reduce(proposal.elements, function (m,n){return m+n;},0);}),
                                context: _.extend(proposals),
                                template: {name: "title_text"},
                                graph: cGraph,
                                prio: 100000
                            };
        }

        console.log(proposal);
*/
//        titleProposal = findMatchFunc("title")(graph);
 //       textProposal = findMatchFunc("text")(graph);
  //      console.log(textProposal, titleProposal);

        return false;
/*        var query = createQueries('{ ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.}');
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
*/
    }},
    //NAME: sameAs
    {"sameAs": function (graph) {
        var query = createQueries('{ ?s <http://www.w3.org/2002/07/owl#sameAs> ?sameAs.}');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {},
                                template: {name: "void"},
                                graph: cGraph,
                                prio: 90000
                            };
            };
        });
        return proposal;
    }},
    //NAME: person_name
    {"person_name": function (graph) {
        var query = createQueries('{ ?s <http://xmlns.com/foaf/0.1/firstName> ?firstName. ?s <http://xmlns.com/foaf/0.1/lastName> ?lastName.}');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 2,
                                context: {firstName: _.first(results).firstName.value, lastName: _.first(results).lastName.value},
                                template: {name: "person_name"},
                                graph: cGraph,
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
    //NAME: location
    {"location": function (graph) {
        var query = createQueries('{ ?s <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long. ?s <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat.}','LIMIT 1');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 2,
                                context: {long: _.first(results).long.value, lat: _.first(results).lat.value},
                                template: {name: "location"},
                                graph: cGraph,
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
   //NAME: license
    {"license": function (graph) {
        var query = createQueries('{ ?s <http://purl.org/dc/terms/license> ?license. }');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                var license = _.first(results).license;
                if (license.token == "uri") {
                    context = {uri: license.value};
                } else {
                    context = {license: license.value};
                }
                proposal =  {
                                elements: 1,
                                context: context,
                                template: {name: "license"},
                                graph: cGraph,
                                prio: 1000
                            };
            };
        });
        return proposal;
    }},
    //NAME: comment
    {"comment": function (graph) {
        var query = createQueries('{ ?s <http://dbpedia.org/ontology/abstract> ?text. }');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {text: _.object(_.map(results, function(r){return [r.text.lang,r.text.value]}))},
                                template: {name: "text"},
                                graph: cGraph,
                                prio: 100000
                            };
            };
        });
        return proposal;
    }},
    //NAME: text
    {"text": function (graph) {
        var query = createQueries('{ ?s <http://rdfs.org/sioc/ns#content> ?text. }');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {text: _.first(results).text.value},
                                template: {name: "text"},
                                graph: cGraph,
                                prio: 100000
                            };
            };
        });
        return proposal;
    }},
    //NAME: label
    {"label": function (graph) {
        var query = createQueries('{ ?s <http://www.w3.org/2000/01/rdf-schema#label> ?title. }');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {title: _.object(_.map(results, function(r){return [r.title.lang,r.title.value]}))},
                                template: {name: "title"},
                                graph: cGraph,
                                prio: 100100
                            };
            };
        });
        return proposal;
    }},

    //NAME: title
    {"title": function (graph) {
        var query = createQueries('{ ?s <http://purl.org/dc/terms/title> ?title. }');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {title: _.first(results).title.value},
                                template: {name: "title"},
                                graph: cGraph,
                                prio: 100100
                            };
            };
        });
        return proposal;
    }},
    //NAME: neighboringMunicipality, List
    {"neighboringMunicipality": function (graph) {
        var query = createQueries('{ ?s <http://dbpedia.org/ontology/neighboringMunicipality> ?cities.}');
        var cGraph = cutGraph(query.construct, graph);

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                console.log(results);
                proposal =  {
                                elements: results.length,
                                context: {neighboringMunicipalities: _.map(results,function(result) {return result.cities.value;})},
                                template: {name: "neighboringMunicipalities"},
                                graph: cGraph,
                                prio: 80000
                            };
            };
        });
        return proposal;
    }},

    //NAME: citedBy, List
    {"citedBy": function (graph) {
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
                                prio: 80000
                            };
            };
        });
        return proposal;
    }},
   //NAME: pmid, PubMedID
    {"pmid": function (graph) {
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
    }},
    //NAME: last resort, unknown triple
    {"unknown": function (graph) {
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
    }},
    //NAME: zero graph / for logging purpose
    {"zero": function (graph) {
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
    }},
];


// ## Exports
//
// Export the `Uduvudu` class as a whole.
// module.exports = Uduvudu;
