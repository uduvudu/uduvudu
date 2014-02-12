!function() {
    var uduvudu = {
        version: "0.1"
    };

/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization.
 * @param {store} store The input graph as an rdfStore Object.
 * @returns {String} oputut Returns the object as a String.
 */
    uduvudu.process = function (store, resource, language, device) {
        var u = uduvudu;
        
        //if no resource is specified, use open variable
        //TODO: try to find intelligently start resource if no resource is delivered
        if (resource) {
            resource = '<'+encodeURI(resource)+'>'; 
        } else {
            resource = '?s';
        }

        var language = language || navigator.language.substring(0,2) || "en";
        var device = device || "desktop";

        var visuals = u.matcher(store, resource);
        var output = u.visualizer(visuals, language, device);
        return output;
    }

/*
 * The matcher (cook) is looking for known structures of basket.
 * @param {store} store The input graph as a rdfStore Object.
 * @param {resource} The resource this store is about.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
    uduvudu.matcher = function (inputGraph, resource) {
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
            // get out the used triples
            _.each(finalprop.cquery, function (query) {
                var cutGraph;
                inputGraph.execute(query, function(success, graph) {
                    cutGraph = graph;
                });
                inputGraph.delete(cutGraph);
            });
            // return the union of all graphs
            return _.union([finalprop],this.matcher(inputGraph, resource));
        }
    };

 /*
 * The visualizer (server) takes the renderables and renders it regarding language and device.
 * @param {visuals} store The input graph as a rdfStore Object.
 * @param {language} The language which shall be used for rendering.
 * @param {device} The device the html shall be rendered for.
 * @returns {string} outputs the string representing the rendred graph.
 */
    uduvudu.visualizer = function (visuals, language, device) {
        var output = "";
        // order visuals
        visuals = _.sortBy(visuals, function (visual) {return -visual.prio;});
        _.each(visuals,
            function (visual){
               var template = Handlebars.compile($("#"+visual.template.name).html());
               var javascript = $("#"+visual.template.name+"_js").html();
               output += template(languageFlattener(visual.context, language));
               if (javascript) {
                   javascriptTemplate = Handlebars.compile(javascript);
                   output += "<script type=\"text/javascript\">"+javascriptTemplate(languageFlattener(visual.context, language))+"</script>";
               }
           });
        return output;
    };

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

function findMatchFunc(name) {
    return _.first(_.values(_.find(matchFuncs, function (func) {return _.first(_.keys(func)) == name;})));
}

function matchArrayOfFuncs(graph, resource, names) {
    return _.map(names, function (name) {return findMatchFunc(name)(graph, resource);});
}

function prepareTriple (element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'literal')
        return element.value;
    else
        return '<a href="?uri='+element.value+'">'+_.last(getName.exec(element.value))+'</a>';
};

function nameFromPredicate (element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'uri') {
        return _.last(getName.exec(element.value));
    }
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
};

/**{
 * Recipies as an Array of functions.
 */



var matchFuncs = [
    //NAME: community
    {"community": function (graph, resource) {
        var proposal = false;
        var proposals = matchArrayOfFuncs(graph,resource,['depiction','label_comment']);
        if (_.every(proposals, _.identity)) {
            proposal = {
                                elements: _.map(proposals, function (proposal) {return _.reduce(proposal.elements, function (m,n){return m+n;},0);}),
                                context: _.reduce(_.rest(proposals), function(memo,num){return _.extend(memo,num.context);},_.first(proposals).context),
                                template: {name: "community"},
                                cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
//                                graph: _.reduce(_.rest(proposals), function(memo,num){return memo.addAll(num.graph);},_.first(proposals).graph),
                                prio: 100000
                            };
        }
        return proposal;
    }},
    //NAME: title, text
    {"label_comment": function (graph, resource) {
        var proposal = false;
        var proposals = matchArrayOfFuncs(graph,resource,['label','comment']);
        if (_.every(proposals, _.identity)) {
            proposal = {
                                elements: _.map(proposals, function (proposal) {return _.reduce(proposal.elements, function (m,n){return m+n;},0);}),
                                context: _.reduce(_.rest(proposals), function(memo,num){return _.extend(memo,num.context);},_.first(proposals).context),
                                template: {name: "label_comment"},
                                cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
                                prio: 100000
                            };
        }
        return proposal;
    }},
    //NAME: sameAs
    {"sameAs": function (graph) {
        var query = createQueries('{ ?s <http://www.w3.org/2002/07/owl#sameAs> ?sameAs.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {},
                                template: {name: "void"},
                                cquery: [query.construct],
                                prio: 90000
                            };
            };
        });
        return proposal;
    }},
    //NAME: person_name
    {"person_name": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://xmlns.com/foaf/0.1/firstName> ?firstName. '+resource+' <http://xmlns.com/foaf/0.1/lastName> ?lastName.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 2,
                                context: {firstName: _.first(results).firstName.value, lastName: _.first(results).lastName.value},
                                template: {name: "person_name"},
                                cquery: [query.construct],
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
    //NAME: location
    {"location": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long. '+resource+' <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat.}','LIMIT 1');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 2,
                                context: {long: _.first(results).long.value, lat: _.first(results).lat.value},
                                template: {name: "location"},
                                cquery: [query.construct],
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
    //NAME: license
    {"license": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://purl.org/dc/terms/license> ?license. }');

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
                                cquery: [query.construct],
                                prio: 1000
                            };
            };
        });
        return proposal;
    }},
    //NAME: abstract
    {"abstract": function (graph,resource) {
        var query = createQueries('{ '+resource+' <http://dbpedia.org/ontology/abstract> ?text. }');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {text: _.object(_.map(results, function(r){return [r.text.lang,r.text.value]}))},
                                template: {name: "text"},
                                cquery: [query.construct],
                                prio: 100000
                            };
            };
        });
        return proposal;
    }},
    //NAME: comment
    {"comment": function (graph,resource) {
        var query = createQueries('{ '+resource+' <http://www.w3.org/2000/01/rdf-schema#comment> ?text. }');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {text: _.object(_.map(results, function(r){return [r.text.lang,r.text.value]}))},
                                template: {name: "text"},
                                cquery: [query.construct],
                                prio: 100000
                            };
            };
        });
        return proposal;
    }},
    //NAME: text
    {"text": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://rdfs.org/sioc/ns#content> ?text. }');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {text: _.first(results).text.value},
                                template: {name: "text"},
                                cquery: [query.construct],
                                prio: 100000
                            };
            };
        });
        return proposal;
    }},
    //NAME: label
    {"label": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://www.w3.org/2000/01/rdf-schema#label> ?title. }');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {title: _.object(_.map(results, function(r){return [r.title.lang,r.title.value]}))},
                                template: {name: "title"},
                                cquery: [query.construct],
                                prio: 100100
                            };
            };
        });
        return proposal;
    }},
    //NAME: title
    {"title": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://purl.org/dc/terms/title> ?title. }');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {title: _.first(results).title.value},
                                template: {name: "title"},
                                cquery: [query.construct],
                                prio: 100100
                            };
            };
        });
        return proposal;
    }},
    //NAME: neighboringMunicipality, List
    {"neighboringMunicipality": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://dbpedia.org/ontology/neighboringMunicipality> ?cities.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {neighboringMunicipalities: _.map(results,function(result) {return result.cities.value;})},
                                template: {name: "neighboringMunicipalities"},
                                cquery: [query.construct],
                                prio: 80000
                            };
            };
        });
        return proposal;
    }},
    /*NAME: citedBy, List
    {"citedBy": function (graph, resource) {
        var query = createQueries('{ ?cites <http://purl.org/ontology/bibo/citedBy> '+resource+'.}');
        var cGraph = cutGraph([query.construct], graph);

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
    }},*/
    /*NAME: pmid, PubMedID
    {"pmid": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://purl.org/ontology/bibo/pmid> ?pmid.}');
        var cGraph = cutGraph([query.construct], graph);

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
    }},*/
    //NAME: depiction
    {"depiction": function (graph, resource) {
        var query = createQueries('{ '+resource+' <http://xmlns.com/foaf/0.1/depiction> ?img_url.}');
        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {img_url: _.first(results).img_url.value},
                                template: {name: "img"},
                                cquery: [query.construct],
                                prio: 90000
                            };
            };
        });
        return proposal;
    }},
    //NAME: literal
    {"literal": function (graph) {
        var query = createQueries('{ ?s ?p ?o.}',' LIMIT 1');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                if(_.first(results).o.token === "literal") {
                     proposal =  {
                                    elements: 1,
                                    context:    {
                                                    name: nameFromPredicate(_.first(results).p),
                                                    text: _.first(results).o.value
                                                },
                                    template: {name: "literal"},
                                    cquery: [query.construct],
                                    prio: 0
                                };
                };
            };
        });
        return proposal;
    }},
    //NAME: last resort, unknown triple
    {"unknown": function (graph) {
        var query = createQueries('{ ?s ?p ?o.}',' LIMIT 1');

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
                                cquery: [query.construct],
                                prio: 0
                            };
            };
        });
        return proposal;
    }},
    //NAME: zero graph / for logging purpose
/*    {"zero": function (graph) {
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
    }},*/
];


    this.uduvudu = uduvudu;

}();
