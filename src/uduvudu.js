/* global _:false, $:false, Handlebars:false, rdf:false */
'use strict';

var uduvudu = {
  version: "0.3.2"
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
  if (!resource) {
    resource = '?s';
  }

  var language = language || navigator.language.substring(0,2) || "en";
  var device = device || "desktop";

  store = uduvudu.helper.deleteSameAs(store);

  var visuals = u.matcher(store, resource, 0);
  var output = u.visualizer(visuals, language, device);

  return output;
};

/*
 * The matcher (cook) is looking for known structures of baskets.
 * @param {store} store The input graph as a rdfStore Object.
 * @param {resource} The resource this store is about.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
uduvudu.matcher = function (inputGraph, resource, depth) {
  console.debug("MatcherDepth: "+depth, uduvudu.helper.showGraph(inputGraph, true));

  // use all functions to see what matches
  var proposals =
    _.compact( //delete unmatched ones
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
    var finalprop = _.first(sorted);

    // get out the used triples
    if (finalprop.subgraph != null) {
      finalprop.subgraph.forEach(function (t) {
        inputGraph.remove(t);
      });
    }

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
  var output = '';

  // order visuals
  visuals = _.sortBy(visuals, function (visual) {return -visual.order;});

  _.each(visuals,
    function (visual){
      // get name of template for the current visual
      
      var
        templateName = _.toArray(visual.context)[0].t.name,
        context = uduvudu.helper.prepareLanguage(visual.context, language);

      _.extend(context, uduvudu.helper.templateHelper);
      output += uduvudu.helper.renderContext(templateName, context);
    });

  return output;
};

/**
 * Recipies helper functions
 */
uduvudu.helper = {};

uduvudu.helper.renderContext = function (templateName, finalContext) {
      //TODO: Template caching like http://lostechies.com/derickbailey/2012/04/10/javascript-performance-pre-compiling-and-caching-html-templates/
      var
        output = '',
        contentTemplate;
      // create content part of output
      var content = uduvudu.helper.getTemplate(templateName);
      if (content) {
        contentTemplate = uduvudu.helper.compileTemplate(content);
      } else {
        console.log("NoTemplateFound", "There was no template with the name '"+templateName+"' found.");

        // fallback if no template found
        contentTemplate = uduvudu.helper.compileTemplate('<div><span title="missing template">'+templateName+'</span>: <%-'+_.first(_.keys(finalContext))+'.u%></div>');
      }

      output += contentTemplate(finalContext);

      // create scripting part of output
      var javascript = uduvudu.helper.getTemplate(templateName+"_js");

      if (javascript) {
          var javascriptTemplate = uduvudu.helper.compileTemplate(javascript);
          output += "<script type=\"text/javascript\">"+javascriptTemplate(finalContext)+"</script>";
      }
      return output;
}

uduvudu.helper.compileTemplate = function (templateSource) {
    // use underscore to compile templates
    return _.template(templateSource);
};

uduvudu.helper.getTemplate = function (templateName) {
    var elem = document.getElementById(templateName);
    if (elem) { return elem.innerHTML; } else { return null; }
};

uduvudu.helper.templateHelper = {
    // fetch the template of the subcontext provided
    template: function(subcontext) {
         if(subcontext.t && subcontext.t.name && subcontext.v) { 
            var context = _.object([[subcontext.v, subcontext]]);
            _.extend(context, uduvudu.helper.templateHelper);
            return uduvudu.helper.renderContext(subcontext.t.name, context);
         } else {
            console.log("WrongContext", "The context given to the template() helper is not valid.");
            return null;
         }
    },
    // cast to number, if not possible return 0
    number: function(something) {
         //replace minus-sign with hyphen-minus
         var number = Number(something.replace("−","-"));
         return number?number:0;
    }
}

/*
* Try to find function with the support name in the matchFuncs Array, if not found return empty function.
* @param {name} String The name of the function.
* @returns {function} Output the a matcher function.
*/
uduvudu.helper.findMatchFunc = function(name) {
  return (
    _.first(
      _.values(
        _.find(matchFuncs, function (func) {
          return _.first(_.keys(func)) === name;
        })
      )
    ) || (function () { return false; })
  );
};

uduvudu.helper.matchArrayOfFuncs = function(graph, resource, names) {
  return (
    _.map(names, function (name) {
      return uduvudu.helper.findMatchFunc(name)(graph, resource);
    })
  );
};

uduvudu.helper.prepareTriple = function(element) {
    return '<a href="?uri='+element.nominalValue+'">'+uduvudu.helper.getTerm(element.nominalValue)+'</a>';
};

uduvudu.helper.nameFromPredicate = function(element) {
  if (element.interfaceName === 'NamedNode') {
    return uduvudu.helper.getTerm(element.nominalValue);
  }
};

uduvudu.helper.getTerm = function(string) {
  var getTerm = /(#|\/)([^#\/]*)$/;

  return _.last(getTerm.exec(string));
};

uduvudu.helper.handleUnknown = function (graph) {
  var proposals = graph.toArray().map(function (t) {
    if(t.object.interfaceName === "Literal") {
      // literal template
      return {
        elements: 1,
        context: {
          literal: {
            subject: {l: {undefined:  t.subject.toString()}},
            predicate: {l: {undefined:  t.predicate.toString()}},
            name: {l: {undefined: uduvudu.helper.nameFromPredicate(t.predicate)}},
            text: {l: {undefined:  t.object.toString()}},
            t: {name: "literal"}
          }
        },
        order: 1
      };
    } else {
      // unknown template
      return {
        elements: 0,
        context: {
          unknown: {
            subject: {l: {undefined: uduvudu.helper.prepareTriple(t.subject)}},
            predicate: {l: {undefined: uduvudu.helper.prepareTriple(t.predicate)}},
            object: {l: {undefined: uduvudu.helper.prepareTriple(t.object)}},
            t: {name: "unknown"}
          }
        },
        order: 0
      };
    }
  });

  return proposals;
};

uduvudu.helper.deleteSameAs = function(graph) {
  return graph.removeMatches(null, "<http://www.w3.org/2002/07/owl#sameAs>", null);
};

uduvudu.helper.showGraph = function(graph, simple) {
  if (simple) {
    return graph.length;
  }

  return [
    graph.length,
    graph.toArray().map(function (t) {
      return (
        t.subject.toString() + ' - ' +
        t.predicate.toString() + ' - ' +
        t.object.toString()
      );
    })
  ];
};

uduvudu.helper.prepareLanguage = function(val, language) {
  if (_.isArray(val)) {
    // if isArray nest
    return _.map(val, function(l) {return uduvudu.helper.prepareLanguage(l, language);});
  } else {
    if (_.isObject(val)){
      // if not, is leafe node do nest object
      if (! (_.has(val,'l'))) {
        return _.object(_.keys(val),_.map(val, function(l) {return uduvudu.helper.prepareLanguage(l, language);}));
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
};

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
      var subgraph = rdf.createGraph();

      proposals.forEach(function(proposal) {
        if (typeof proposal === 'object' && 'subgraph' in proposal) {
          subgraph.addAll(proposal.subgraph);
        }
      });

      if (_.every(proposals, _.identity)) {
        proposal = {
          elements: _.reduce(_.pluck(proposals,'elements'), function (m,n){return m+n;},0),
          context:
            _.object([[
              def.templateVariable,
              _.extend(
                _.reduce(_.rest(proposals), function(memo,num) {
                  return _.extend(memo,num.context);
                }, _.first(proposals).context),
                {
                    t: {name: def.templateId || def.templateVariable},
                    v: def.templateVariable
                }
              )
            ]]),
            subgraph: subgraph,
            order: def.order
          };
      }

      return proposal;
  }]]);
};

uduvudu.matchers.createLink = function(defArg) {
  return _.object([[defArg.matcherName,
    function (graph, resource) {
      var
        def = defArg,
        subjectVariable,
        subjectFilter = null,
        predicateFilter,
        objectFilter = null;

      // if no templateVariable is defined get term from predicate
      def.templateVariable = def.templateVariable || uduvudu.helper.getTerm(def.predicate);

      // look if subject or object position
      subjectVariable = def.resourcePosition && def.resourcePosition === "object";

      if (subjectVariable) {
        predicateFilter = '<' + def.predicate + '>';
        objectFilter = resource;
      } else {
        subjectFilter = resource;
        predicateFilter = '<' + def.predicate + '>';
      }

      var proposal = false;
      var filteredGraph = graph.match(subjectFilter, predicateFilter, objectFilter);

      if (filteredGraph.length !== 0) {
        var proposals = _.compact(filteredGraph.toArray().map(function (t) {
          if (subjectVariable) {
            return uduvudu.helper.matchArrayOfFuncs(graph, "<" + t.subject.toString() + ">", def.linkIds)[0];
          } else {
            return uduvudu.helper.matchArrayOfFuncs(graph, "<" + t.object.toString() + ">", def.linkIds)[0];
          }
        }));

        if (_.some(proposals)) {
          proposal = {
            elements: _.reduce(_.pluck(proposals,'elements'), function (m,n){return m+n;},0),
            context:
              _.object([[
                def.templateVariable,
                _.extend(
                  _.map(proposals, function(proposal){return proposal.context;}),
                    {
                        t: {name: def.templateId || def.templateVariable},
                        r: resource,
                        v: def.templateVariable
                    }
                )
              ]]),
            subgraph: filteredGraph,
            order: def.order
          };
        }
      }

      return proposal;
    }
  ]]);
};

uduvudu.matchers.createPredicate = function(defArg) {
  return _.object([[defArg.matcherName,
    function (graph, resource) {
      var
        def = defArg,
        subjectVariable,
        subjectFilter = null,
        predicateFilter,
        objectFilter = null;

      // if no templateV  return [r.val.lang,r.val.value]})),ariable is defined get term from predicate
      def.templateVariable = def.templateVariable || uduvudu.helper.getTerm(def.predicate);

      // look if subject or object position
      subjectVariable = def.resourcePosition && def.resourcePosition === "object";

      if (subjectVariable) {
        predicateFilter = def.predicate;
        objectFilter = resource;
      } else {
        subjectFilter = resource;
        predicateFilter = def.predicate;
      }

      var proposal = false;
      var filteredGraph = graph.match(subjectFilter, predicateFilter, objectFilter);

      if (filteredGraph.length !== 0) {
        var l, s, keyCount = {};
        proposal =  {
          elements: filteredGraph.length,
          context:
            _.object([[
              def.templateVariable,
              {
                l: _.object(filteredGraph.toArray().map(function(t) {
                   if (subjectVariable) {$
                     l = t.subject.language;
                     s = t.subject.toString();
                   } else {$
                     l= t.object.language;
                     s = t.object.toString();
                   }
                   //add a count to duplicated keys
                   if(_.has(keyCount,l)) {
                       keyCount[l] += 1;
                       return [l+'.'+keyCount[l], s];$
                   } else {
                       keyCount[l] = 1;
                       return [l, s];$
                   }
                 })),
                t: {name: def.templateId || def.templateVariable},
                p: def.predicate,
                r: resource,
                v: def.templateVariable
              }
            ]]),
            subgraph: filteredGraph,
            order: def.order
          };
      }

      return proposal;
    }
  ]]);
};

var matchFuncs = [];

// initiate matcher functions
if (! _.isUndefined(window.combineMatchers)) {
  var combineMatcherFuncs = _.map(window.combineMatchers, function (cM) {return uduvudu.matchers.createCombine(cM);});

  matchFuncs = _.union(combineMatcherFuncs, matchFuncs);
}

if (! _.isUndefined(window.linkMatchers)) {
  var linkMatcherFuncs = _.map(window.linkMatchers, function (lM) {return uduvudu.matchers.createLink(lM);});

  matchFuncs = _.union(linkMatcherFuncs, matchFuncs);
}

if (! _.isUndefined(window.predicateMatchers)) {
  var predicateMatcherFuncs = _.map(window.predicateMatchers, function (pM) {return uduvudu.matchers.createPredicate(pM);});

  matchFuncs = _.union(predicateMatcherFuncs, matchFuncs);
}


// export
window.uduvudu = uduvudu;
