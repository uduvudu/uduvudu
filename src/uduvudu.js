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
        var where = '{ ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.}'
        var query = 'CONSTRUCT '+where+' WHERE '+where; 
  
        graph.execute(query, function(success, cutGraph) {
            console.log(cutGraph);
            var tempStore = rdfstore.create(function (success) {return success});
            tempStore.insert(cutGraph);
            tempStore.execute('SELECT * ' + where, function(success, results) {
                console.log(results);
            }); 
        });
          proposal = {elements: 2, context:{title: "blubtitl2", text: "bulbvalue"}, template:{name: "title_text"}};
          return proposal;
        },

    //NAME: title, text
    function (graph) {
        var query = 'SELECT * WHERE { ?s <http://purl.org/dc/terms/title> ?title. ?s <http://rdfs.org/sioc/ns#content> ?text.}';

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
    //NAME: last resort, unknown triple
    function (graph) {
        var proposal;
        var query = 'SELECT * WHERE { ?s ?p ?o}';

        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context:    {
                                                subject: _.first(results).s.value,
                                                predicate: _.first(results).p.value,
                                                object: _.first(results).o.value
                                            },
                                template: {name: "unknown"}
                            };
            }
            else
            {
                proposal = false;
            }
        
        });
        return proposal; 
        },
    //NAME: zero graph / for logging purpose
    function (graph) {
        var query = 'SELECT * WHERE { ?s ?p ?o.}';
        var getName = /(#|\/)([^#\/]*)$/
        graph.execute(query, function(success, results) {
            if(success && (! _.isEmpty(results))) {
p:
                  console.log("b");
//                console.log(_.map(results.toArray(), function (item) {return item.toString();}));
//                console.log(_.map(results, function (item) {return _.last(getName.exec(item.s.value))+" "+_.last(getName.exec(item.p.value))+" "+item.o.value;}));
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
