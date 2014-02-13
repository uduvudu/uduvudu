!function() {
    var uduvudu = {
        version: "0.1.2"
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
uduvudu.helper = {};

uduvudu.helper.createQueries = function (where, modifier) {
    modifier = modifier || '';
    return  {
                construct:'CONSTRUCT '+where+' WHERE '+where+' '+modifier,
                select: 'SELECT * WHERE '+where+' '+modifier
            }
};

uduvudu.helper.findMatchFunc = function(name) {
    return _.first(_.values(_.find(matchFuncs, function (func) {return _.first(_.keys(func)) == name;})));
}

uduvudu.helper.matchArrayOfFuncs = function(graph, resource, names) {
    return _.map(names, function (name) {return uduvudu.helper.findMatchFunc(name)(graph, resource);});
}

uduvudu.helper.prepareTriple = function(element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'literal')
        return element.value;
    else
        return '<a href="?uri='+element.value+'">'+_.last(getName.exec(element.value))+'</a>';
};

uduvudu.helper.nameFromPredicate = function(element) {
    var getName = /(#|\/)([^#\/]*)$/
    if (element.token === 'uri') {
        return _.last(getName.exec(element.value));
    }
};

uduvudu.helper.showGraph = function(graph) {
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

// export
this.uduvudu = uduvudu;

}();
