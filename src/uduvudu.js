!function() {
    var uduvudu = {
        version: "0.2.1"
    };

/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization.
 * @param {store} store The input graph as an rdfStore Object.
 * @returns {String} oputut Returns the object as a String.
 */
uduvudu.process = function (store, resource, language, device) {
    console.log("uduvudu.process", resource);
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

    store = uduvudu.helper.deleteSameAs(store);

    var visuals = u.matcher(store, resource, 0);
    var output = u.visualizer(visuals, language, device);
    return output;
}

/*
 * The matcher (cook) is looking for known structures of baskets.
 * @param {store} store The input graph as a rdfStore Object.
 * @param {resource} The resource this store is about.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
uduvudu.matcher = function (inputGraph, resource, depth) {
    console.debug("MatcherDepth: "+depth, uduvudu.helper.showGraph(inputGraph, true));
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
        // nothing left end condition, handle unknown stuff
        return uduvudu.helper.handleUnknown(inputGraph, false);
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
        // return the union of all proposals
        return _.union([finalprop],this.matcher(inputGraph, resource, depth + 1));
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
    // change to mustache style template
    /*_.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /\{\{([\s\S]+?)\}\}/g,
        escape      : /\{\{\{([\s\S]+?)\}\}\}>/g
    };*/

    var output = "";
    // order visuals
//    console.log(visuals);
    visuals = _.sortBy(visuals, function (visual) {return -visual.order;});
    _.each(visuals,
        function (visual){
           // get name of template for the current visual
           templateName = _.toArray(visual.context)[0].t.name;

//           console.log(templateName, JSON.stringify(visual.context,false, "  "))

           // create content part of output
           var content = $("#"+templateName).html();
           if (content) {
               contentTemplate = Handlebars.compile(content);
//               contentTemplate = _.template(content);
           } else {
               console.log("NoTemplateFound", "There was no template with the name '"+templateName+"' found.")
               // fallback if no template found
               contentTemplate = Handlebars.compile('<div>{{'+_.first(_.keys(visual.context))+'.u}}</div>');
           }
           output += contentTemplate(uduvudu.helper.prepareLanguage(visual.context, language));

           // create scripting part of output
           var javascript = $("#"+templateName+"_js").html();
           if (javascript) {
               javascriptTemplate = Handlebars.compile(javascript);
               output += "<script type=\"text/javascript\">"+javascriptTemplate(uduvudu.helper.prepareLanguage(visual.context, language))+"</script>";
           }
       });
    return output;
};

/**
 * Recipies helper functions
 */
uduvudu.helper = {};

uduvudu.helper.createQueries = function (where, modifier) {
    modifier = modifier || '';
    return  {
                construct:'CONSTRUCT '+where+' WHERE '+where+' '+modifier,
                select: 'SELECT * WHERE '+where+' '+modifier
            }
};

/*
* Try to find function with the support name in the matchFuncs Array, if not found return empty function.
* @param {name} String The name of the function.
* @returns {function} Output the a matcher function.
*/
uduvudu.helper.findMatchFunc = function(name) {
    return _.first(_.values(_.find(matchFuncs, function (func) {return _.first(_.keys(func)) == name;}))) || (function (){return false;});
}

uduvudu.helper.matchArrayOfFuncs = function(graph, resource, names) {
    return _.map(names, function (name) {return uduvudu.helper.findMatchFunc(name)(graph, resource);});
}

uduvudu.helper.prepareTriple = function(element) {
    if (element.token === 'literal') {
        return element.value;
    } else {
        return '<a href="?uri='+element.value+'">'+uduvudu.helper.getTerm(element.value)+'</a>';
    }
};

uduvudu.helper.nameFromPredicate = function(element) {
    if (element.token === 'uri') {
        return uduvudu.helper.getTerm(element.value);
    }
};

uduvudu.helper.getTerm = function(string) {
    var getTerm = /(#|\/)([^#\/]*)$/;
    return _.last(getTerm.exec(string));
};

uduvudu.helper.handleUnknown = function (graph) {
    var query = uduvudu.helper.createQueries('{ ?s ?p ?o.}');
    var proposals = [];
    graph.execute(query.select, function(success, results) {
        if(success && (! _.isEmpty(results))) {
            proposals = _.map(results, function(result) {
                if(result.o.token === "literal") {
                    // literal template
                    return   {
                                elements: 1,
                                context: {
                                    literal: {
                                        subject: {l: {undefined:  result.s.value}},
                                        predicate: {l: {undefined:  result.p.value}},
                                        name: {l: {undefined: uduvudu.helper.nameFromPredicate(result.p)}},
                                        text: {l: {undefined:  result.o.value}},
                                        t: {name: "literal"}
                                    }
                                },
                                order: 1
                            };
                } else {
                    // unknown template
                    return   {
                                elements: 0,
                                context: {
                                    unknown: {
                                        subject: {l: {undefined: uduvudu.helper.prepareTriple(result.s)}},
                                        predicate: {l: {undefined: uduvudu.helper.prepareTriple(result.p)}},
                                        object: {l: {undefined: uduvudu.helper.prepareTriple(result.o)}},
                                        t: {name: "unknown"}
                                    }
                                },
                                order: 0
                            };
                };
            });
        };
    });
    return proposals;
};

uduvudu.helper.deleteSameAs = function(graph) {
    var query = uduvudu.helper.createQueries('{ ?s <http://www.w3.org/2002/07/owl#sameAs> ?sameAs.}');

    graph.execute(query.construct, function(success, graph) {
        cutGraph = graph;
    });

    graph.delete(cutGraph);
    
    return graph;
}

uduvudu.helper.showGraph = function(graph, simple) {
    var ret;
    graph.execute("SELECT * {?s ?p ?o.}", function(success, results) {
        if(success && (! _.isEmpty(results))) {
             if(simple) {
                 ret =  results.length;
             } else {
                 ret = [results.length, _.map(results, function(res){return res.s.value+"  -  "+res.p.value+"  -  "+res.o.value;})];
             }
        }
    });
    return ret;
};

uduvudu.helper.prepareLanguage = function(val, language) {
    if (_.isArray(val)) {
        // if isArray nest
        return _.map(val, function(l) {return uduvudu.helper.prepareLanguage(l, language)});
    } else {
        if (_.isObject(val)){
            // if not, is leafe node do nest object 
            if (! (_.has(val,'l'))) {
                return _.object(_.keys(val),_.map(val, function(l) {return uduvudu.helper.prepareLanguage(l, language)}));
            // else if is leafe node (denoted by having a key of 'l') create key 'u' with current language
            } else {
                if(val.l[language]) {
                    val.u = val.l[language];
                } else {
                    if (val.l['undefined']) {
                        val.u = val.l['undefined'];
                    } else {
                        val.u = _.first(_.toArray(val.l));
                    }
                }
            }
        } 
        return val;
    }
}

/**
 * Matcher Factories
 */
uduvudu.matchers = {};

uduvudu.matchers.createCombine = function(defArg) {
    return _.object([[defArg.matcherName,
    function (graph, resource) {
        var def = defArg;

        // if no templateVariable is defined get term from predicate
        def.templateVariable = def.templateVariable || def.matcherName;
        var proposal = false;
        var proposals = uduvudu.helper.matchArrayOfFuncs(graph,resource,def.combineIds);
        if (_.every(proposals, _.identity)) {
            proposal = {
                elements: _.reduce(_.pluck(proposals,'elements'), function (m,n){return m+n;},0),
                context:
                    _.object([[
                        def.templateVariable,
                        _.extend(
                            _.reduce(_.rest(proposals), function(memo,num){return _.extend(memo,num.context);}, _.first(proposals).context),
                           {'t': {name: def.templateId || def.templateVariable}}
                        )
                    ]]),
                cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
                order: def.order
            };
//          console.log("createCombine", def.matcherName, proposal.context, proposal.elements);
        }
        return proposal;
    }]]);
}

uduvudu.matchers.createLink = function(defArg) {
    return _.object([[defArg.matcherName,
    function (graph, resource) {
        var def = defArg;

        // if no templateVariable is defined get term from predicate
        def.templateVariable = def.templateVariable || uduvudu.helper.getTerm(def.predicate);
        // look if subject or object position
        if (def.resourcePosition && def.resourcePosition == "object") {
            var where = '{  ?val <'+def.predicate+'> '+resource+'. }';
        } else {
            var where = '{ '+resource+' <'+def.predicate+'> ?val. }';
        };

        var query = uduvudu.helper.createQueries(where);
        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {

                var proposals = _.compact(_.map(results, function(result) {return uduvudu.helper.matchArrayOfFuncs(graph,"<"+result.val.value+">",def.linkIds)[0]}));
                if (_.some(proposals)) {
                    proposal = {
                        elements: _.reduce(_.pluck(proposals,'elements'), function (m,n){return m+n;},0),
                        context: 
                            _.object([[
                                def.templateVariable, 
                                _.extend(
                                    _.map(proposals, function(proposal){return proposal.context}), 
                                    {'t': {name: def.templateId || def.templateVariable, 'r': resource}}
                                )
                            ]]),
                        cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
                        order: def.order
                    };
                }
//                console.log("createLink", def.matcherName, proposal.context);
            };
        });
        return proposal;
    }]]);
}

uduvudu.matchers.createPredicate = function(defArg) {
    return _.object([[defArg.matcherName,
    function (graph, resource) {
        var def = defArg;

        // if no templateVariable is defined get term from predicate
        def.templateVariable = def.templateVariable || uduvudu.helper.getTerm(def.predicate);

        // look if subject or object position
        if (def.resourcePosition && def.resourcePosition == "object") {
            var where = '{  ?val <'+def.predicate+'> '+resource+'. }';
        } else {
            var where = '{ '+resource+' <'+def.predicate+'> ?val. }';
        };

        var query = uduvudu.helper.createQueries(where);
        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                    elements: results.length,
                    context:
                        _.object([[
                            def.templateVariable,
                            {
                                l: _.object(_.map(results, function(r){return [r.val.lang,r.val.value]})),
                                t: {name: def.templateId || def.templateVariable},
                                p: def.predicate,
                                r: resource
                            }
                        ]]),
                    cquery: [query.construct],
                    order: def.order
                };
//              console.log("createPredicate", proposal.context);
            };
        });
        return proposal;
    }]]);
}

var matchFuncs = [];

// initiate matcher functions
if (! _.isUndefined(window.combineMatchers)) {
    var combineMatcherFuncs = _.map(combineMatchers, function (cM) {return uduvudu.matchers.createCombine(cM);});
    matchFuncs = _.union(combineMatcherFuncs, matchFuncs);
}

if (! _.isUndefined(window.linkMatchers)) {
    var linkMatcherFuncs = _.map(linkMatchers, function (lM) {return uduvudu.matchers.createLink(lM);});
    matchFuncs = _.union(linkMatcherFuncs, matchFuncs);
}

if (! _.isUndefined(window.predicateMatchers)) {
    var predicateMatcherFuncs = _.map(predicateMatchers, function (pM) {return uduvudu.matchers.createPredicate(pM);});
    matchFuncs = _.union(predicateMatcherFuncs, matchFuncs);
}


// export
this.uduvudu = uduvudu;

}();
