/**{
 * Recipies as an Array of functions.
 */

var matchFuncs = [
    //NAME: community
    {"community": function (graph, resource) {
        var proposal = false;
        var proposals = uduvudu.helper.matchArrayOfFuncs(graph,resource,['depiction','label_comment']);
        if (_.every(proposals, _.identity)) {
            proposal = {
                                elements: _.map(proposals, function (proposal) {return _.reduce(proposal.elements, function (m,n){return m+n;},0);}),
                                context: _.reduce(_.rest(proposals), function(memo,num){return _.extend(memo,num.context);},_.first(proposals).context),
                                template: {name: "community"},
                                cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
                                prio: 100000
                            };
        }
        return proposal;
    }},
    //NAME: title, text, PROTOTYPE: combine, This combines two matchers on the same level
    {"label_comment": function (graph, resource) {
        var proposal = false;
        var proposals = uduvudu.helper.matchArrayOfFuncs(graph,resource,['label','comment']);
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
        var query = uduvudu.helper.createQueries('{ ?s <http://www.w3.org/2002/07/owl#sameAs> ?sameAs.}');

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
    //NAME: inventorOf, PROTOTYPE: ingredientLink
    {"inventorOf": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{ ?inventorId <http://www.patexpert.org/ontologies/pmo.owl#inventorOf> ' + resource + '.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {

                var proposals = _.compact(_.map(results, function(result) {return uduvudu.helper.matchArrayOfFuncs(graph,"<"+result.inventorId.value+">",['lastName'])[0]}));
                if (_.some(proposals)) {
                    proposal = {
                                elements: _.map(proposals, function (proposal) {return _.reduce(proposal.elements, function (m,n){return m+n;},0);}),
                                context: {inventor: _.map(proposals, function(proposal){return proposal.context})},
                                template: {name: "inventor"},
                                cquery: _.flatten(_.map(proposals, function(p) {return p.cquery;})),
                                prio: 100000
                            };
                }
            };
        });
        return proposal;
    }},
    //NAME: lastName
    {"lastName": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{'+resource+' <http://xmlns.com/foaf/0.1/lastName> ?lastName.}', 'LIMIT 1');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {lastName: _.first(results).lastName.value},
                                template: {name: "person_name"},
                                cquery: [query.construct],
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
    //NAME: name
    {"name": function (graph, resource) {
//        attributes = ['<http://xmlns.com/foaf/0.1/firstName','http://xmlns.com/foaf/0.1/lastName']
        var query = uduvudu.helper.createQueries('{'+resource+' <http://xmlns.com/foaf/0.1/name> ?lastName.}', 'LIMIT 1');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {lastName: _.first(results).lastName.value},
                                template: {name: "person_name"},
                                cquery: [query.construct],
                                prio: 71000
                            };
            };
        });
        return proposal;
    }},
    //NAME: person_name
    {"person_name": function (graph, resource) {
//        attributes = ['<http://xmlns.com/foaf/0.1/firstName','http://xmlns.com/foaf/0.1/lastName']
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://xmlns.com/foaf/0.1/firstName> ?firstName. '+resource+' <http://xmlns.com/foaf/0.1/lastName> ?lastName.}');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long. '+resource+' <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat.}','LIMIT 1');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://purl.org/dc/terms/license> ?license. }');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://dbpedia.org/ontology/abstract> ?text. }');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://www.w3.org/2000/01/rdf-schema#comment> ?text. }');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://rdfs.org/sioc/ns#content> ?text. }');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://www.w3.org/2000/01/rdf-schema#label> ?title. }');

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
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://purl.org/dc/terms/title> ?title. }');

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
    //NAME: neighboringMunicipality, List
    {"neighboringMunicipality": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://dbpedia.org/ontology/neighboringMunicipality> ?cities.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {neighboringMunicipalities: _.map(results,function(result) {return {url: result.cities.value}; })},
                                template: {name: "neighboringMunicipalities"},
                                cquery: [query.construct],
                                prio: 80000
                            };
            };
        });
        return proposal;
    }},
    //NAME: citedBy, List
    {"citedBy": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{ ?cites <http://purl.org/ontology/bibo/citedBy> '+resource+'.}');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: results.length,
                                context: {citedBy: _.map(results,function(result) {return result.cites.value;})},
                                template: {name: "citedBy"},
                                cquery: [query.construct],
                                prio: 80000
                            };
            };
        });
        return proposal;
    }},
    //NAME: pmid, PubMedID
    {"pmid": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://purl.org/ontology/bibo/pmid> ?pmid.}');
        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 1,
                                context: {pmid: _.first(results).pmid.value},
                                template: {name: "pmid"},
                                cquery: [query.construct],
                                prio: 90000
                            };
            };
        });
        return proposal;
    }},
    //NAME: depiction
    {"depiction": function (graph, resource) {
        var query = uduvudu.helper.createQueries('{ '+resource+' <http://xmlns.com/foaf/0.1/depiction> ?img_url.}');
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
    /*
    {"literal": function (graph) {
        var query = uduvudu.helper.createQueries('{ ?s ?p ?o.}');
        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                result = _.find(results, function (r) {return r.o.token === "literal"})
                if(result) {
                     proposal =  {
                                    elements: 1,
                                    context:    {
                                                    name: uduvudu.helper.nameFromPredicate(result.p),
                                                    text: result.o.value
                                                },
                                    template: {name: "literal"},
                                    cquery: ['CONSTRUCT {<'+ result.s.value +'> <'+ result.p.value +'> """'+ result.o.value +'""".} WHERE {?s ?p ?o} LIMIT 1'],
                                    prio: 0
                                };
                };
            };
        });
        return proposal;
    }},
    */
    /*
    //NAME: last resort, unknown triple
    {"unknown": function (graph) {
        var query = uduvudu.helper.createQueries('{ ?s ?p ?o.}',' LIMIT 1');

        var proposal = false;
        graph.execute(query.select, function(success, results) {
            if(success && (! _.isEmpty(results))) {
                proposal =  {
                                elements: 0,
                                context:    {
                                                subject: uduvudu.helper.prepareTriple(_.first(results).s),
                                                predicate: uduvudu.helper.prepareTriple(_.first(results).p),
                                                object: uduvudu.helper.prepareTriple(_.first(results).o)
                                            },
                                template: {name: "unknown"},
                                cquery: [query.construct],
                                prio: 0
                            };
            };
        });
        return proposal;
    }},
    */
    /*
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
    }},*/
];
