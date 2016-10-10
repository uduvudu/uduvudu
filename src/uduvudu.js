/* global $:false, Handlebars:false */
'use strict';

var _ = require('underscore')
//var _ = require('lodash')
// we plan to switch, current problems:
// - .object() ?
var rdf = require('rdf-ext')

var uduvudu = {
  version: "0.7.0",
  matchFuncs: [],
  templateCache: {}
};

/**
 * Minimal assets to insert
 */
uduvudu.css = ''+
'.uv {'+
' min-width: 300px;'+
' max-width: 600px;'+
' margin: 5px;'+
' float: left;'+
'}'


/** 
 * Initialize uduvudu
 */
uduvudu.initialize = function () {
    if(_.isUndefined(uduvudu.ready)) {

        // load, if provided, matchers in JSON
        _.each(uduvudu.matchers, function(factory) {
            if (! _.isUndefined(window[factory.jsArray])) {
                var matcherFuncs = _.map(window[factory.jsArray], function (m) {
                    return factory(m);
                });
                uduvudu.matchFuncs = _.union(matcherFuncs, uduvudu.matchFuncs);
            }
        });

        // load, if provided, RDF matcher
        _.each(uduvudu.matchers, function(factory) {
            uduvudu.helper.loadMatcher(factory.rdfClass,factory);
        });

        uduvudu.ready = true;
    }
}

/**
 * Uduvudu edit initialization.
 */

uduvudu.editor = function () {
    throw 'The editor functionality is not loaded, please load additionaly uduvudu_edit.js after uduvudu.js is loaded for this purpose.';
}

/**
 * Main Function of Uduvudu taking an RDF Graph as Input and using the available recipes and serving suggestions to transform to a visualization.
 * @param {graph} input The input graph as an rdf-interface graph.
 * @param {object} [options] Options for the rendering.
 * @param {function} [cb] Callback to use for rendering.
 * @returns {String} Returns the object as a String.
 */

uduvudu.process = function (input) {
  uduvudu.options = uduvudu.options || {};

  if (typeof input == "object") {
    input = uduvudu.helper.deleteSameAs(input);
    uduvudu.input = input;
  }

  if (typeof arguments[1] == "object") {
    uduvudu.options = _.extend(uduvudu.options, arguments[1]) || uduvudu.options;
    uduvudu.cb = arguments[2] || uduvudu.cb;
  } else {
    uduvudu.cb = arguments[1] || uduvudu.cb;
  }

  if (uduvudu.options.language === undefined || uduvudu.options.language === '') uduvudu.options.language = navigator.language.substring(0,2) || "en";
  if (uduvudu.options.device === undefined) uduvudu.options.device = "desktop";
  //TODO: try to find intelligently start resource if no resource is delivered


  uduvudu.initialize();
  console.debug('Uduvudu:', 'Start to process with resource ', uduvudu.options.resource);

  var visuals = uduvudu.matcher(uduvudu.input.match(), uduvudu.options.resource, 0);
  var output = uduvudu.visualizer(visuals, uduvudu.options.language, uduvudu.options.device);
  
  uduvudu.helper.injectCss(uduvudu.css);
  
  if (uduvudu.cb) {
      uduvudu.cb(output)
  }
  return output;
};

/**
 * The matcher (cook) is looking for known structures of baskets.
 * @param {store} store The input graph as a rdfStore Object.
 * @param {resource} The resource this store is about.
 * @returns {renderables} output a list of objects with all information to get rendered
 */
uduvudu.matcher = function (inputGraph, resource, depth) {
  console.debug('Uduvudu:','Matcher in recursion: '+depth,'/' ,uduvudu.helper.showGraph(inputGraph, true) + ' triples still in graph.');
  console.debug('Uduvudu:','Graph', uduvudu.helper.showGraph(inputGraph));

  // use all functions to see what matches
  var proposals =
    _.compact( //delete unmatched ones
      _.map(uduvudu.matchFuncs, function (func){ //map whole function array
        return _.first(_.values(func))(inputGraph, resource);} //return the result of the lookup
      )
    );

  // sort the proposals by number of elements used
  var sorted = _.sortBy(proposals, function (proposal) {return -proposal.elements;});

  // recursive check for available stuff
  if( _.isEmpty(sorted)) {
    // nothing left end condition, handle unknown stuff
    return uduvudu.helper.handleUnknown(inputGraph);
  } else {
    // the proposal to use
    var finalprop = _.first(sorted);

    // remove the used triples
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
      // get the name of template and the context for the current visual
      var
        templateName = _.toArray(visual.context)[0].t.name,
        context = uduvudu.helper.prepareLanguage(visual.context, language);
      // add templateHelper functions
      _.extend(context, uduvudu.helper.templateHelper);
      output += uduvudu.helper.renderContext(templateName, context);
    });

  return output;
};

/**
 * Helper functions
 */
uduvudu.helper = {};

uduvudu.helper.injectCss = function (css) {
    // css
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = _.uniqueId('uvCss');
    style.innerHTML = css;
    try {
        (document.getElementsByTagName('head')[0]||document.body).appendChild(style);
    } catch (err) {
        console.debug(err);
    }
}

/**
 * Final render step which compiles and renders the template with the context.
 * @param {String} [templateName] The templateName used to render.
 * @param {Object} [finalContext] The context structure to render.
 * @returns {String} Returns the output as a String.
 */

uduvudu.helper.renderContext = function (templateName, finalContext) {
      var
        output = '',
        compTemplate;

      //check if cached
      var compTemplate = uduvudu.templateCache[templateName];
      if (!compTemplate) {
          var content = uduvudu.helper.getTemplate(templateName);
          // get content part of output
          if (content) {
              compTemplate = uduvudu.helper.compileTemplate(content);
              uduvudu.templateCache[templateName] = compTemplate;
          } else {
              // fallback if no template found
              console.debug('Uduvudu:','NoTemplateFound', "There was no template with the name '"+templateName+"' found.", finalContext);
              var currentContext = '';
              // get object
              var contextObject = _.find(
                      finalContext,
                      function(p) {currentContext = p; return _.isObject(p);}
                      );
              // get all subtemplates
              var subTemplates = _.map(
                      _.filter( contextObject
                          ,
                          function (m) {return m.m;}
                          ),
                      function (t) {return '<%=template('+currentContext.v+'.'+t.v+')%>\n';}
                      );
              // no subtemplates found
              if(_.isEmpty(subTemplates)) {
                  // render text plain
                  compTemplate = uduvudu.helper.compileTemplate('<div>' + contextObject.v +': ' + contextObject.u  + '</div>');
              } else {
                  // get subTemplates
                  compTemplate = uduvudu.helper.compileTemplate('<div>' + subTemplates.join('')  + '</div>');
              }
          }
      }

      output += compTemplate(finalContext);

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

uduvudu.helper.getTemplate = function (templateName, device, language) {
    var templateContent = ''
    // get templates from stylesStore
    if (uduvudu.options.styles) {
        var styles = uduvudu.options.styles;

        styles.match(null, rdf.resolve('uv:abstractTemplate'), templateName).forEach(function (t) {
            styles.match(t.subject, rdf.resolve('uv:template'), null).forEach(function (t) {
                    templateContent = t.object.toString();
            });
        });
    }

    // fallback look for template in html
    var elem = document.getElementById(templateName);
    if (elem) {
        templateContent =  elem.innerHTML;
    }
    return templateContent || null;
};

uduvudu.helper.templateHelper = {
    // fetch the template of the subcontext provided
    template: function(subcontext) {
         if(subcontext.t && subcontext.t.name && subcontext.v) { 
            var context = _.object([[subcontext.v, subcontext]]);
            _.extend(context, uduvudu.helper.templateHelper);
            return uduvudu.helper.renderContext(subcontext.t.name, context);
         } else {
            console.debug('Uduvudu:','WrongContext', 'The context given to the template() helper is not valid.');
            return null;
         }
    },
    // cast to number, if not possible return 0
    num: function(something) {
         //replace minus-sign with hyphen-minus
         var number = Number(something.replace("−","-"));
         return number?number:0;
    }
}

/**
* Try to find function with the support name in the matchFuncs Array, if not found return empty function.
* @param {name} String The name of the function.
* @returns {function} Output the a matcher function.
*/
uduvudu.helper.findMatchFunc = function(name) {
  return (
    _.first(
      _.values(
        _.find(uduvudu.matchFuncs, function (func) {
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
    return '<a href="?res='+element.nominalValue+'">'+uduvudu.helper.getTerm(element.nominalValue)+'</a>';
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
  // get all literals with proposal structure
  var literals = _.compact(graph.toArray().map(function (t) {
    if(t.object.interfaceName == "Literal") {
      // literal template
      return {
        elements: 1,
        context: {
          literal: {
            subject: {l: {undefined:  t.subject.toString()}},
            predicate: {l: {undefined:  t.predicate.toString()}},
            name: {l: {undefined: uduvudu.helper.nameFromPredicate(t.predicate)}},
            text: {l: {undefined:  t.object.toString()}},
            s: {l: {undefined: uduvudu.helper.getTerm(t.subject.nominalValue) }},
            p: {l: {undefined: uduvudu.helper.getTerm(t.predicate.nominalValue) }},
            o: {l: {undefined: t.object.nominalValue }},
            t: {
                name: "literal"
            },
            m: {
                name: "literal",
                type: "literal",
                p: t.predicate.nominalValue,
                r: t.subject.nominalValue
            },
            v: "literal"
          }
        },
        order: 1
      }
    } else return null;
  }));

  // get all unknowns with proposal structure
  var unknowns = _.compact(graph.toArray().map(function (t) {
    if(t.object.interfaceName != 'Literal') {
      // unknown template
      return {
        elements: 1,
        context: {
          unknown: {
            subject: {l: {undefined: uduvudu.helper.prepareTriple(t.subject)}},
            predicate: {l: {undefined: uduvudu.helper.prepareTriple(t.predicate)}},
            object: {l: {undefined: uduvudu.helper.prepareTriple(t.object)}},
            s: {l: {undefined: uduvudu.helper.getTerm(t.subject.nominalValue) }},
            p: {l: {undefined: uduvudu.helper.getTerm(t.predicate.nominalValue) }},
            o: {l: {undefined: uduvudu.helper.getTerm(t.object.nominalValue) }},
            t: {
                name: "unknown"
            },
            m: {
                name: "unknown",
                type: "unknown",
                p: t.predicate.nominalValue,
                r: t.object.nominalValue
            },
            v: "unknown"
          }
        },
        order: 0
      }
    }
  }));

  // put literals together
  if (_.every(literals, _.identity)) {
      var container_literals = {
        elements: _.reduce(_.pluck(literals,'elements'), function (m,n){return m+n;},0),
        context:
          _.object([[
            'literals',
            _.extend(
              _.map(literals, function(proposal){return proposal.context;}),
                {
                    t: {
                           name: 'literals'
                       },
                    m: {
                           name: 'literals',
                           type: 'link',
                           r: 'undefined'
                       },
                    v: 'literals'
                }
            )
          ]]),
        order: 1
      };
  };

  // put unknowns together
  if (_.every(unknowns, _.identity)) {
      var container_unknowns = {
        elements: _.reduce(_.pluck(unknowns,'elements'), function (m,n){return m+n;},0),
        context:
          _.object([[
            'unknowns',
            _.extend(
              _.map(unknowns, function(proposal){return proposal.context;}),
                {
                    t: {
                           name: 'unknowns'
                       },
                    m: {
                           name: "unknowns",
                           type: 'link',
                           r: 'undefined'
                       },
                    v: 'unknowns'
                }
            )
          ]]),
        order: 0
      };
  }

  return [container_literals, container_unknowns];
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
    return  _.each(val, function(l) {return uduvudu.helper.prepareLanguage(l, language);});
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
          if (val.l['null']) {
            val.u = val.l['null'];
          } else {
            val.u = _.first(_.toArray(val.l));
          }
        }
      }
    }
    return val;
  }
};

uduvudu.helper.addVisualizer = function (template, id) {
    var script = document.createElement("script");
    script.setAttribute("id", id);
    script.setAttribute("type", "text/uduvudu-template");
    var text = document.createTextNode(template);
    script.appendChild(text);
    var element = document.getElementById("visualizer");
    element.appendChild(script);
};

uduvudu.helper.addMatcher = function (matcher) {
  uduvudu.matchFuncs = _.union([matcher], uduvudu.matchFuncs);
};

uduvudu.helper.loadMatcher = function (matcherClass, matcherFunction) {
    if (uduvudu.options.styles) {
        var styles = uduvudu.options.styles;
        styles.match(null, rdf.resolve('a'), rdf.resolve(matcherClass)).forEach( function (m) {
            var propArray = [];
            styles.match(m.subject, null, null).forEach( function (p) {
                propArray.push([uduvudu.helper.getTerm(p.predicate.toString()), p.object.toString()]);
            });

            // fold duplicated properties into an array
            var def = _.object(
                _.map(
                    _.groupBy(
                        propArray,
                        function(a) {return _.first(a);}
                    ),
                    function (b) {
                        if (b.length == 1){
                            return _.first(b);
                        } else {
                            return [_.first(_.first(b)), _.map(b, function(c) {return _.last(c);})];
                        }
                    })
                );
            // use factory function to create new matcher
            uduvudu.helper.addMatcher(matcherFunction(def));
        });
    };
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

      def.combineIds = _.isArray(def.combineIds) ? def.combineIds : [def.combineIds];

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
                    t: {
                           name: def.abstractTemplate,
                       },
                    m: {
                           name: def.matcherName,
                           type: 'combine',
                           r: resource
                       },
                    v: def.templateVariable
                }
              )
            ]]),
            subgraph: subgraph,
            order: def.order || 1000
          };
      }

      return proposal;
  }]]);
};
uduvudu.matchers.createCombine.rdfClass = 'uv:CombineMatcher';
uduvudu.matchers.createCombine.jsArray = 'combineMatchers';

uduvudu.matchers.createLink = function(defArg) {
  return _.object([[defArg.matcherName,
    function (graph, resource) {
      var
        def = defArg,
        subjectVariable,
        subjectFilter = null,
        predicateFilter = null,
        objectFilter = null;

      // if no templateVariable is defined get term from predicate
      def.templateVariable = def.templateVariable || uduvudu.helper.getTerm(def.predicate);

      // if linkIds is a value
      def.linkIds = _.isArray(def.linkIds) ? def.linkIds : [def.linkIds];

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
        var proposals = _.compact(filteredGraph.toArray().map(function (t) {
          if (subjectVariable) {
            return uduvudu.helper.matchArrayOfFuncs(graph, t.subject.toString(), def.linkIds)[0];
          } else {
            return uduvudu.helper.matchArrayOfFuncs(graph, t.object.toString(), def.linkIds)[0];
          }
        }));

      var subgraph = rdf.createGraph();
      proposals.forEach(function(proposal) {
        if (typeof proposal === 'object' && 'subgraph' in proposal) {
          subgraph.addAll(proposal.subgraph);
        }
      });



        if (_.some(proposals)) {
          proposal = {
            elements: _.reduce(_.pluck(proposals,'elements'), function (m,n){return m+n;},0),
            context:
              _.object([[
                def.templateVariable,
                _.extend(
                  _.map(proposals, function(proposal){return proposal.context;}),
                    {
                        t: {
                               name: def.abstractTemplate
                           },
                        m: {
                               type: 'link',
                               name: def.matcherName,
                               p: def.predicate,
                               r: resource
                           },
                        v: def.templateVariable
                    }
                )
              ]]),
            subgraph: subgraph,
            order: def.order || 1000
          };
        }
      }

      return proposal;
    }
  ]]);
};
uduvudu.matchers.createLink.rdfClass = 'uv:LinkMatcher';
uduvudu.matchers.createLink.jsArray = 'linkMatchers';

uduvudu.matchers.createPredicate = function(defArg) {
  return _.object([[defArg.matcherName,
    function (graph, resource) {
      var
        def = defArg,
        subjectVariable,
        subjectFilter = null,
        predicateFilter = null,
        objectFilter = null;

      // if no templateVariable is defined get term from predicate
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
                   if (subjectVariable) {
                     l = t.subject.language;
                     s = t.subject.toString();
                   } else {
                     l= t.object.language;
                     s = t.object.toString();
                   }
                   //add a count to duplicated keys
                   if(_.has(keyCount,l)) {
                       keyCount[l] += 1;
                       return [l+'.'+keyCount[l], s];
                   } else {
                       keyCount[l] = 1;
                       return [l, s];
                   }
                 })),
                t: {
                       name: def.abstractTemplate
                   },
                m: {
                       name: def.matcherName,
                       type: 'predicate',
                       p: def.predicate,
                       r: resource
                   },
                v: def.templateVariable
              }
            ]]),
            subgraph: filteredGraph,
            order: def.order || 1000
          };
      }

      return proposal;
    }
  ]]);
};
uduvudu.matchers.createPredicate.rdfClass = 'uv:PredicateMatcher';
uduvudu.matchers.createPredicate.jsArray = 'predicateMatchers';

//for convinience attach to window
if (typeof window !== 'undefined') {
  window.rdf.LdpStore = require('rdf-store-ldp')
  window.uduvudu = uduvudu
}

module.exports = uduvudu
