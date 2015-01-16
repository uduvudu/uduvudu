/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);

var defaultRequest = null;
var corsProxyRequest = null;


if (isNode) {
  var http = require('http');
  var https = require('https');
  var url = require('url');

  defaultRequest = function (method, requestUrl, headers, content, callback) {
    var
      options = url.parse(requestUrl),
      client = http;

    options.hash = null;
    options.method = method;
    options.headers = headers;

    if (options.protocol === 'https:') {
      client = https;
    }

    var req = client.request(options, function (res) {
      var resContent = '';

      res.setEncoding('utf8');
      res.on('data', function (chunk) { resContent += chunk; });
      res.on('end', function () { callback(res.statusCode, res.headers, resContent); });
    });

    req.on('error', function (error) { callback(null, null, null, error); });

    if (content != null) {
      req.write(content);
    }

    req.end();
  };
} else {
  defaultRequest = function (method, requestUrl, headers, content, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === xhr.DONE) {
        var
          headerLines = xhr.getAllResponseHeaders().split('\r\n'),
          resHeaders = {};

        for (var i = 0; i < headerLines.length; i++) {
          var headerLine = headerLines[i].split(': ', 2);
          resHeaders[headerLine[0].toLowerCase()] = headerLine[1];
        }

        callback(xhr.status, resHeaders, xhr.responseText);
      }
    };

    xhr.open(method, requestUrl, true);

    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }

    xhr.send(content);
  };

  corsProxyRequest = function (proxyUrl, method, requestUrl, headers, content, callback) {
    var url = proxyUrl + '?url=' + encodeURIComponent(requestUrl);

    defaultRequest(method, url, headers, content, callback);
  };
}


var mixin = function (rdf, options) {
  if (options == null) {
		options = {};
  }

  rdf.ns = {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  };

  if (typeof rdf.Graph === 'undefined') {
		rdf.Graph = {};
  }

  rdf.Graph.difference = function (a, b) {
    var d = rdf.createGraph();

    a.forEach(function (at) {
      if (!b.some(function (bt) { return at.equals(bt); })) {
        d.add(at);
      }
    });

    return d;
  };

  rdf.Graph.intersection = function (a, b) {
    var i = rdf.createGraph();

    a.forEach(function (at) {
      if (b.some(function (bt) { return at.equals(bt); })) {
        i.add(at);
      }
    });

    return i;
  };

  rdf.Graph.map = function (graph, callback) {
    var result = [];

    graph.forEach(function (triple) {
      result.push(callback(triple));
    });

    return result;
  };

  rdf.Graph.merge = function (a, b) {
    var m = rdf.createGraph();

    m.addAll(a);
    m.addAll(b);

    return m;
  };

  rdf.Graph.toString = function (a) {
    var s = '';

    a.forEach(function (t) {
      s += t.toString() + '\n';
    });

    return s;
  };

  var wrappedCreateGraph = rdf.createGraph.bind(rdf);

  rdf.createGraphExt = function (triples) {
    var graph = wrappedCreateGraph(triples);

    graph.difference = rdf.Graph.difference.bind(graph, graph);

    graph.intersection = rdf.Graph.intersection.bind(graph, graph);

    graph.map = rdf.Graph.map.bind(graph, graph);

    graph.toString = rdf.Graph.toString.bind(graph, graph);

    if ('replaceMerge' in options && options.replaceMerge) {
      graph.merge = rdf.Graph.merge.bind(graph, graph);
    }

    return graph;
  };

  Object.defineProperty(rdf, 'createGraph', { value: rdf.createGraphExt });

  rdf.defaultRequest = defaultRequest;
  rdf.corsProxyRequest = corsProxyRequest;
};


if (isNode) {
  module.exports = function (rdf, options) {
    if (options == null) {
      options = {};
    }

    mixin(rdf, options);

    require('./lib/inmemory-store.js')(rdf);
    require('./lib/jsonld-parser.js')(rdf);
    require('./lib/jsonld-serializer.js')(rdf);
    require('./lib/ldp-store.js')(rdf);
    require('./lib/ntriples-serializer.js')(rdf);
    require('./lib/promise.js')(rdf);
    require('./lib/rdfstore-store.js')(rdf);
    require('./lib/rdfxml-parser.js')(rdf);
    require('./lib/sparql-store.js')(rdf);
    require('./lib/turtle-parser.js')(rdf);
    require('./lib/turtle-serializer.js')(rdf);

    //require('./lib/uri-resolver.js')(rdf);
    //require('./lib/microdata-parser.js')(rdf);
  };
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  mixin(rdf);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var InMemoryStore = function (rdf) {
  var graphs = {};

  this.graph = function (iri, callback) {
    if (!(iri in graphs)) {
      return callback(null);
    }

    callback(graphs[iri]);
  };

  this.match = function (iri, subject, predicate, object, callback, limit) {
    if (!(iri in graphs)) {
      return callback(null);
    }

    callback(graphs[iri].match(subject, predicate, object, limit));
  };

  this.add = function (iri, graph, callback) {
    graphs[iri] = rdf.createGraph();
    graphs[iri].addAll(graph);

    callback(graph);
  };

  this.merge = function (iri, graph, callback) {
    if (iri in graphs) {
      graphs[iri].addAll(graph);
    } else {
      graphs[iri] = graph;
    }

    callback(graph);
  };

  this.remove = function (iri, graph, callback) {
    if (iri in graphs) {
      graphs[iri] = rdf.Graph.difference(graphs[iri], graph);
    }

    callback(true);
  };

  this.removeMatches = function (iri, subject, predicate, object, callback) {
    if (iri in graphs) {
      graphs[iri].removeMatches(subject, predicate, object);
    }

    callback(true);
  };

  this.delete = function (iri, callback) {
    if (iri in graphs) {
      delete graphs[iri];
    }

    callback(true);
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.InMemoryStore = InMemoryStore.bind(null, rdf);
  };

  module.exports.store = InMemoryStore;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.InMemoryStore = InMemoryStore.bind(null, rdf);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


if (isNode) {
  global.jsonld = require('jsonld');
}


var JsonLdParser = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  var jsonldExpandFlat = function (data, base, callback) {
    jsonld.expand(data, {'base': base}, function (error, expanded) {
      if (error != null) {
        return callback(null);
      }

      jsonld.flatten(expanded, {}, function (error, flattened) {
        if (error != null) {
          return callback(null);
        }

        if (!('@graph' in flattened)) {
          return callback(null);
        }

        callback(flattened['@graph']);
      });
    });
  };

  var toArray = function (object) {
    if (object == null) {
      return [];
    }

    if (Array.isArray(object)) {
      return object;
    }

    return [object];
  };

  this.process = function (data, callback, base, filter, done) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (base == null) {
      base = '';
    }

    if (filter == null) {
      filter = function () { return true; };
    }

    if (done == null) {
      done = function () {};
    }

    var getLiteral = function (jNode) {
      var
        type = null,
        lang = null;

      if ('@type' in jNode) {
        type = getNode(jNode['@type']);
      }

      if ('@language' in jNode) {
        lang = jNode['@language'];
      }

      return rdf.createLiteral(jNode['@value'], lang, type);
    };

    var nodeCache = {};

    var getNode = function (jNode) {
      // is there already a node?
      if (jNode in nodeCache) {
        return nodeCache[jNode];
      }

      // is it a blank node?
      if (jNode == null || jNode.indexOf('_:') === 0) {
        return nodeCache[jNode] = rdf.createBlankNode();
      }

      // if not it's a named node
      return nodeCache[jNode] = rdf.createNamedNode(jNode);
    };

    var pushTriple = function (subject, predicate, object) {
      var triple = rdf.createTriple(subject, predicate, object);

      if (filter(triple)) {
        callback(triple);
      }
    };

    var processSubject = function (jSubject) {
      var
        subject = jSubject['@id'],
        types = toArray(jSubject['@type']);

      // add type triples
      types.forEach(function (type) {
        pushTriple(
          getNode(subject),
          getNode(rdf.ns.type),
          getNode(type));
      });

      // other triples
      for (var predicate in jSubject) {
        // ignore JSON-LD properties
        if (predicate.indexOf('@') === 0) {
          continue;
        }

        processPredicate(subject, predicate, toArray(jSubject[predicate]));
      }
    };

    var processPredicate = function (subject, predicate, jObjects) {
      jObjects.forEach(function (jObject) {
        pushTriple(
          getNode(subject),
          getNode(predicate),
          processObject(jObject));
      });
    };

    var processObject = function (jObject) {
      // is it a simple literal?
      if (typeof jObject === 'string') {
        return rdf.createLiteral(jObject);
      }

      // or blank node / named node
      if ('@id' in jObject) {
        return getNode(jObject['@id']);
      }

      // or complex literal
      return getLiteral(jObject);
    };

    jsonldExpandFlat(data, base, function (jGraph) {
      if (jGraph == null) {
        return done(false);
      }

      jGraph.forEach(function (jSubject) {
        processSubject(jSubject);
      });

      done(true);
    });

    return true;
  };

  this.parse = function (data, callback, base, filter, graph) {
    if (graph == null) {
      graph = rdf.createGraph();
    }

    return this.process(
      data,
      function (triple) { graph.add(triple); },
      base,
      filter,
      function (success) { callback(success ? graph : null); });
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.JsonLdParser = JsonLdParser.bind(null, rdf);

    var parser = new JsonLdParser(rdf);
    rdf.parseJsonLd = parser.parse.bind(parser);
  };

  module.exports.parser = JsonLdParser;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.JsonLdParser = JsonLdParser.bind(null, rdf);

  var parser = new JsonLdParser(rdf);
  rdf.parseJsonLd = parser.parse.bind(parser);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


if (isNode) {
	global.jsonld = require('jsonld');
}


var JsonLdSerializer = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  var rdfStringNode = rdf.createNamedNode('http://www.w3.org/2001/XMLSchema#string');

  this.serialize = function (graph, callback) {
    if (callback == null) {
      callback = function () {};
    }

    var jsonGraph = [];
    var subjects = {};

    var subjectIndex = function (s) {
      var sValue = s.valueOf();

      if (typeof subjects[sValue] === 'undefined') {
        if (s.interfaceName == 'BlankNode') {
          jsonGraph.push({ '@id': '_:' + sValue });
        } else {
          jsonGraph.push({ '@id': sValue });
        }

        subjects[sValue] = jsonGraph.length - 1;
      }

      return subjects[sValue];
    };

    var objectValue = function (o) {
      if (o.interfaceName == 'NamedNode') {
        return { '@id': o.valueOf() };
      } else if (o.interfaceName == 'BlankNode') {
        return { '@id': '_:' + o.valueOf()};
      } else {
        if (o.language != null) {
          return { '@language': o.language, '@value': o.valueOf() };
        } else if ('datatype' in o && o.datatype != null && !rdfStringNode.equals(o.datatype)) {
          return { '@type': o.datatype.valueOf(), '@value': o.valueOf() };
        } else {
          return o.valueOf();
        }
      }
    };

    graph.forEach(function (t) {
      var s = subjectIndex(t.subject);
      var p = t.predicate.valueOf();

      if (p == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        if (typeof jsonGraph[s]['@type'] === 'undefined') {
          jsonGraph[s]['@type'] = [];
        }

        jsonGraph[s]['@type'].push(t.object.valueOf());
      } else {
        if (typeof jsonGraph[s][p] === 'undefined') {
          jsonGraph[s][p] = objectValue(t.object);
        } else {
          if (!Array.isArray(jsonGraph[s][p])) {
            jsonGraph[s][p] = [jsonGraph[s][p]];
          }

          jsonGraph[s][p].push(objectValue(t.object));
        }
      }
    });

    callback(jsonGraph);

    return jsonGraph;
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.JsonLdSerializer = JsonLdSerializer.bind(null, rdf);

    var serializer = new JsonLdSerializer(rdf);
    rdf.serializeJsonLd = (serializer).serialize.bind(serializer);
  };

  module.exports.serializer = JsonLdSerializer;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.JsonLdSerializer = JsonLdSerializer.bind(null, rdf);

  var serializer = new JsonLdSerializer(rdf);
  rdf.serializeJsonLd = (serializer).serialize.bind(serializer);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var LdpStore = function (rdf, options) {
  var self = this;

  if (options == null) {
    options = {};
  }

  self.parsers = {
    'application/ld+json': rdf.parseJsonLd,
    'text/turtle': rdf.parseTurtle
  };
  self.serializers = {
    'application/ld+json': rdf.serializeJsonLd,
    'application/n-triples': rdf.serializeNTriples,
    'text/turtle': rdf.serializeNTriples
  };
  self.defaultParser = 'text/turtle';
  self.defaultSerializer = 'application/n-triples'; //TODO: use options method to detect
  self.request = rdf.defaultRequest;

  if ('request' in options) {
    self.request = options.request;
  }

  var buildAccept = function() {
    var accept = null;

    for (var mimeType in self.parsers) {
      if (accept == null) {
        accept = mimeType;
      } else {
        accept += ', ' + mimeType;
      }
    }

    return accept;
  };

  var httpSuccess = function (statusCode) {
    return (statusCode >= 200 && statusCode < 300);
  };

  self.graph = function (iri, callback) {
    self.request('GET', iri, {'Accept': buildAccept()}, null,
      function (statusCode, headers, content, error) {
        // error during request
        if (error != null) {
          return callback(null, 'request error: ' + error);
        }

        // http status code != success
        if (!httpSuccess(statusCode)) {
          return callback(null, 'status code error: ' + statusCode);
        }

        // use default parser...
        var contentType = self.defaultParser;

        // ...if content-type is not given or unknown
        if ('content-type' in headers && headers['content-type'] in self.parsers) {
          contentType = headers['content-type'];
        }

        self.parsers[contentType](content, function (graph, error) {
          callback(graph, error != null ? 'parser error: ' + error : null);
        }, iri);
      }
    );
  };

  self.match = function (iri, subject, predicate, object, callback, limit) {
    self.graph(iri, function (graph, error) {
      if (error != null) {
        return callback(null, error);
      }

      callback(graph.match(subject, predicate, object, limit));
    });
  };

  self.add = function (iri, graph, callback) {
    //TODO: implement me
  };

  self.merge = function (iri, graph, callback) {
    //TODO: implement me
    var mimeType = 'text/turtle';

    self.serializers[mimeType](graph, function (data) {
      self.request('PATCH', iri, {'Content-Type': mimeType}, data,
        function (statusCode, headers, content, error) {
          callback(graph, error);
        }
      );
    });
  };

  self.remove = function (iri, graph, callback) {
    //TODO: implement me
  };

  self.removeMatches = function (iri, subject, predicate, object, callback) {
    //TODO: implement me
  };

  self.delete = function (iri, callback) {
    self.request('DELETE', iri, {}, null,
      function (statusCode, headers, content, error) {
        // error during request
        if (error != null) {
          return callback(false, 'request error: ' + error);
        }

        // http status code != success
        if (!httpSuccess(statusCode)) {
          return callback(false, 'status code error: ' + statusCode);
        }

        callback(true);
      }
    );
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.LdpStore = LdpStore.bind(null, rdf);
  };

  module.exports.store = LdpStore;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.LdpStore = LdpStore.bind(null, rdf);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var NTriplesSerializer = function (rdf) {
  this.serialize = function (graph, callback) {
    if (callback == null) {
      callback = function () {};
    }

    var nTriples = rdf.Graph.toString(graph);

    callback(nTriples);

    return nTriples;
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.NTriplesSerializer = NTriplesSerializer.bind(null, rdf);

    var serializer = new NTriplesSerializer(rdf);
    rdf.serializeNTriples = serializer.serialize.bind(serializer);
  };

  module.exports.serializer = NTriplesSerializer;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.NTriplesSerializer = NTriplesSerializer.bind(null, rdf);

  var serializer = new NTriplesSerializer(rdf);
  rdf.serializeNTriples = serializer.serialize.bind(serializer);
}
/* global rdf:true, Promise:false */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var funcTemplate = function (func, PromiseClass) {
  if (typeof PromiseClass === 'undefined') {
    if (isNode) {
      PromiseClass = require('es6-promise').Promise;
    } else {
      PromiseClass = Promise;
    }
  }

  return function () {
    var args = arguments;

    return new PromiseClass(function (resolve, reject) {
      var callback = function (result, error) {
        if (error != null) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      func(args, callback);
    });
  };
};


var ParserPromiseWrapper = function (parser, p) {
  this.process = funcTemplate(function (args, callback) { parser.process(args[0], args[1], args[2], args[3], callback); }, p);
  this.parse = funcTemplate(function (args, callback) { parser.parse(args[0], callback, args[1], args[2], args[3]); }, p);
};


var SerializerPromiseWrapper = function (serializer, p) {
  this.serialize = funcTemplate(function (args, callback) { serializer.serialize(args[0], callback); }, p);
};


var StorePromiseWrapper = function (store, p) {
  this.graph = funcTemplate(function (args, callback) { store.graph(args[0], callback); }, p);
  this.match = funcTemplate(function (args, callback) { store.match(args[0], args[1], args[2], args[3], callback, args[5]); }, p);
  this.add = funcTemplate(function (args, callback) { store.add(args[0], args[1], callback); }, p);
  this.merge = funcTemplate(function (args, callback) { store.merge(args[0], args[1], callback); }, p);
  this.remove = funcTemplate(function (args, callback) { store.remove(args[0], args[1], callback); }, p);
  this.removeMatch = funcTemplate(function (args, callback) { store.removeMatch(args[0], args[1], args[2], args[3], callback); }, p);
  this.delete = funcTemplate(function (args, callback) { store.delete(args[0], callback); }, p);
};


if (isNode) {
  module.exports = function (rdf) {
    if (typeof rdf.promise === 'undefined') {
      rdf.promise = {};
    }

    rdf.promise.Parser = ParserPromiseWrapper;
    rdf.promise.Serializer = SerializerPromiseWrapper;
    rdf.promise.Store = StorePromiseWrapper;
  };
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  if (typeof rdf.promise === 'undefined') {
    rdf.promise = {};
  }

  rdf.promise.Parser = ParserPromiseWrapper;
  rdf.promise.Serializer = SerializerPromiseWrapper;
  rdf.promise.Store = StorePromiseWrapper;
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var RdfstoreStore = function (store, options) {
  if (options == null) {
    options = {};
  }

  var
    self = this,
    rdf = store.rdf;

  self.graph = function (iri, callback) {
    store.graph(iri, function (success, graph) {
      if (success) {
        callback(graph);
      } else {
        callback(null);
      }
    });
  };

  self.match = function (iri, subject, predicate, object, callback, limit) {
    self.graph(iri, function (graph) {
      if (graph == null) {
        callback(null);
      } else {
        callback(graph.match(subject, predicate, object, limit));
      }
    });
  };

  self.add = function (iri, graph, callback) {
    store.clear(iri, function () {
      store.insert(graph, iri, function (insertSuccess) {
        if (insertSuccess) {
          callback(graph);
        } else {
          callback(null);
        }
      });
    });
  };

  self.merge = function (iri, graph, callback) {
    store.insert(graph, iri, function (success) {
      if (success) {
        callback(graph);
      } else {
        callback(null);
      }
    });
  };

  self.remove = function (iri, graph, callback) {
    self.graph(iri, function (oldGraph) {
      var newGraph = rdf.Graph.difference(oldGraph, graph);

      self.add(iri, newGraph, function (addedGraph) {
        callback(addedGraph != null);
      });
    });
  };

  self.removeMatches = function (iri, subject, predicate, object, callback) {
    self.graph(iri, function (oldGraph) {
      var newGraph = oldGraph.removeMatches(subject, predicate, object);

      self.add(iri, newGraph, function (addedGraph) {
        callback(addedGraph != null);
      });
    });
  };

  self.delete = function (iri, callback) {
    store.clear(iri, function (success) {
      if (success) {
        callback(true);
      } else {
        callback(null);
      }
    });
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.RdfstoreStore = RdfstoreStore;
  };

  module.exports.store = RdfstoreStore;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.RdfstoreStore = RdfstoreStore;
}
/**
 * @fileoverview
 *  RDF/XML PARSER
 *
 * Version 0.1
 *  Parser believed to be in full positive RDF/XML parsing compliance
 *  with the possible exception of handling deprecated RDF attributes
 *  appropriately. Parser is believed to comply fully with other W3C
 *  and industry standards where appropriate (DOM, ECMAScript, &c.)
 *
 *  Author: David Sheets <dsheets@mit.edu>
 *
 * W3C� SOFTWARE NOTICE AND LICENSE
 * http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
 * This work (and included software, documentation such as READMEs, or
 * other related items) is being provided by the copyright holders under
 * the following license. By obtaining, using and/or copying this work,
 * you (the licensee) agree that you have read, understood, and will
 * comply with the following terms and conditions.
 * 
 * Permission to copy, modify, and distribute this software and its
 * documentation, with or without modification, for any purpose and
 * without fee or royalty is hereby granted, provided that you include
 * the following on ALL copies of the software and documentation or
 * portions thereof, including modifications:
 * 
 * 1. The full text of this NOTICE in a location viewable to users of
 * the redistributed or derivative work.
 * 2. Any pre-existing intellectual property disclaimers, notices, or terms and
 * conditions. If none exist, the W3C Software Short Notice should be
 * included (hypertext is preferred, text is permitted) within the body
 * of any redistributed or derivative code.
 * 3. Notice of any changes or modifications to the files, including the
 * date changes were made. (We recommend you provide URIs to the location
 * from which the code is derived.)
 * 
 * THIS SOFTWARE AND DOCUMENTATION IS PROVIDED "AS IS," AND COPYRIGHT
 * HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS
 * FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR
 * DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
 * TRADEMARKS OR OTHER RIGHTS.
 * 
 * COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL
 * OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR
 * DOCUMENTATION.
 * 
 * The name and trademarks of copyright holders may NOT be used in
 * advertising or publicity pertaining to the software without specific,
 * written prior permission. Title to copyright in this software and any
 * associated documentation will at all times remain with copyright
 * holders.
 */
/**
 * @class Class defining an RDFParser resource object tied to an RDFStore
 *  
 * @author David Sheets <dsheets@mit.edu>
 * @version 0.1
 * 
 * @constructor
 * @param {RDFStore} store An RDFStore object
 */

var RdfLibParser = function(store){
    var RDFParser = {};
    
    /** Standard namespaces that we know how to handle @final
     *  @member RDFParser
     */
    RDFParser.ns = {'RDF': "http://www.w3.org/1999/02/22-rdf-syntax-ns#", 'RDFS': "http://www.w3.org/2000/01/rdf-schema#"};
    
    /** DOM Level 2 node type magic numbers @final
     *  @member RDFParser
     */
    RDFParser.nodeType = {'ELEMENT': 1, 'ATTRIBUTE': 2, 'TEXT': 3,
			     'CDATA_SECTION': 4, 'ENTITY_REFERENCE': 5,
			     'ENTITY': 6, 'PROCESSING_INSTRUCTION': 7,
			     'COMMENT': 8, 'DOCUMENT': 9, 'DOCUMENT_TYPE': 10,
			     'DOCUMENT_FRAGMENT': 11, 'NOTATION': 12};

    /**
     * Frame class for namespace and base URI lookups
     * Base lookups will always resolve because the parser knows
     * the default base.
     *
     * @private
     */
    
    this.frameFactory = function(parser, parent, element){
        return {'NODE': 1, 'ARC': 2, 'parent': parent, 'parser': parser, 'store': parser.store, 'element': element, 
           'lastChild': 0, 'base': null, 'lang': null, 'node': null, 'nodeType': null, 'listIndex': 1, 'rdfid': null, 'datatype': null, 'collection': false, /** Terminate the frame and notify the store that we're done */
           'terminateFrame': function(){
            if (this.collection){
                
                this.node.close();
            }
        }
        , /** Add a symbol of a certain type to the this frame */'addSymbol': function(type, uri){
            uri = uriJoin(uri, this.base);
            this.node = this.store.sym(uri);
            
            this.nodeType = type;
        }
        , /** Load any constructed triples into the store */'loadTriple': function(){
            if (this.parent.parent.collection){
                this.parent.parent.node.append(this.node);
            }
            else {
                this.store.add(this.parent.parent.node, this.parent.node, this.node, this.parser.why);
            }
            if (this.parent.rdfid != null){
                  // reify
                var triple = this.store.sym(uriJoin("#" + this.parent.rdfid, this.base));
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "type"), this.store.sym(RDFParser.ns.RDF + "Statement"), this.parser.why);
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "subject"), this.parent.parent.node, this.parser.why);
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "predicate"), this.parent.node, this.parser.why);
                
                this.store.add(triple, this.store.sym(RDFParser.ns.RDF + "object"), this.node, this.parser.why);
            }
        }
        , /** Check if it's OK to load a triple */'isTripleToLoad': function(){
            
            return (this.parent != null && this.parent.parent != null && this.nodeType === this.NODE && this.parent.nodeType === 
               this.ARC && this.parent.parent.nodeType === this.NODE);
        }
        , /** Add a symbolic node to this frame */'addNode': function(uri){
            this.addSymbol(this.NODE, uri);
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add a collection node to this frame */'addCollection': function(){
            this.nodeType = this.NODE;
            this.node = this.store.collection();
            this.collection = true;
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add a collection arc to this frame */'addCollectionArc': function(){
            
            this.nodeType = this.ARC;
        }
        , /** Add a bnode to this frame */'addBNode': function(id){
            if (id != null){
                if (this.parser.bnodes[id] != null){
                    this.node = this.parser.bnodes[id];
                }
                else {
                    this.node = this.parser.bnodes[id] = this.store.bnode();
                }
            }
            else {
                this.node = this.store.bnode();
            }
            this.nodeType = this.NODE;
            if (this.isTripleToLoad()){
                
                this.loadTriple();
            }
        }
        , /** Add an arc or property to this frame */'addArc': function(uri){
            if (uri === RDFParser.ns.RDF + "li"){
                uri = RDFParser.ns.RDF + "_" + this.parent.listIndex;
                this.parent.listIndex++;
            }
            
            this.addSymbol(this.ARC, uri);
        }
        , /** Add a literal to this frame */'addLiteral': function(value){
            if (this.parent.datatype){
                this.node = this.store.literal(value, "", this.store.sym(this.parent.datatype));
            }
            else {
                this.node = this.store.literal(value, this.lang);
            }
            this.nodeType = this.NODE;
            if (this.isTripleToLoad()){
                this.loadTriple();
            }
        }
        };
    };
    
    //from the OpenLayers source .. needed to get around IE problems.
    this.getAttributeNodeNS = function(node, uri, name){
        var attributeNode = null;
        if (node.getAttributeNodeNS){
            attributeNode = node.getAttributeNodeNS(uri, name);
        }
        else {
            var attributes = node.attributes;
            var potentialNode, fullName;
            for (var i = 0;i < attributes.length; ++ i){
                potentialNode = attributes[i];
                if (potentialNode.namespaceURI === uri){
                    fullName = (potentialNode.prefix) ? (potentialNode.prefix +":" + name): name;
                    if (fullName === potentialNode.nodeName){
                        attributeNode = potentialNode;
                        break;
                    }
                }
            }
        }
        return attributeNode;
    };
    
    
    /** Our triple store reference @private */
    
    this.store = store;/** Our identified blank nodes @private */
    this.bnodes = {};/** A context for context-aware stores @private */
    this.why = null;/** Reification flag */
    this.reify = false;
    
    /**
     * Build our initial scope frame and parse the DOM into triples
     * @param {DOMTree} document The DOM to parse
     * @param {String} base The base URL to use 
     * @param {Object} why The context to which this resource belongs
     */
    
    this.parse = function(document, base, why){
        var children = document.childNodes;// clean up for the next run
        this.cleanParser();// figure out the root element
        var root;
        if (document.nodeType === RDFParser.nodeType.DOCUMENT){
            for (var c = 0;c < children.length;c++){
                if (children[c].nodeType === RDFParser.nodeType.ELEMENT){
                    root = children[c];
                    break;
                }
            }
        }
        else if (document.nodeType === RDFParser.nodeType.ELEMENT){
            root = document;
        }
        else {
            throw new Error("RDFParser: can't find root in " + base +". Halting. ");
            // return false;
        }
        this.why = why;// our topmost frame
        var f = this.frameFactory(this);
        this.base = base;
        f.base = base;
        f.lang = '';
        this.parseDOM(this.buildFrame(f, root));
        return true;
    };
    
    this.parseDOM = function(frame){
         // a DOM utility function used in parsing
        var rdfid;
        var elementURI = function(el){
            var result = "";
            if (el.namespaceURI == null){
                throw new Error("RDF/XML syntax error: No namespace for " + el.localName + " in " + this.base);
            }
            if (el.namespaceURI){
                result = result + el.namespaceURI;
            }
            if (el.localName){
                result = result + el.localName;
            }
            else if (el.nodeName){
                if (el.nodeName.indexOf(":") >= 0)result = result + el.nodeName.split(":")[1];
                else result = result + el.nodeName;
            }
            return result;
        }.bind(this);
        var dig = true;// if we'll dig down in the tree on the next iter
        while (frame.parent){
            var dom = frame.element;
            var attrs = dom.attributes;
            if (dom.nodeType === RDFParser.nodeType.TEXT || dom.nodeType === RDFParser.nodeType.CDATA_SECTION){
                //we have a literal
                if(frame.parent.nodeType == frame.NODE) {
                    //must have had attributes, store as rdf:value
                    frame.addArc(RDFParser.ns.RDF + 'value');
                    frame = this.buildFrame(frame);
                }
                frame.addLiteral(dom.nodeValue);
            }
            else if (elementURI(dom)!== RDFParser.ns.RDF + "RDF"){
                  // not root
                if (frame.parent && frame.parent.collection){
                     // we're a collection element
                    frame.addCollectionArc();
                    frame = this.buildFrame(frame, frame.element);
                    frame.parent.element = null;
                }
                if ( ! frame.parent || ! frame.parent.nodeType || frame.parent.nodeType === frame.ARC){
                     // we need a node
                    var about = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "about");
                    rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "ID");
                    if (about && rdfid){
                        throw new Error("RDFParser: " + dom.nodeName + " has both rdf:id and rdf:about." + 
                           " Halting. Only one of these" + " properties may be specified on a" + " node.");
                    }
                    if (!about && rdfid){
                        frame.addNode("#" + rdfid.nodeValue);
                        dom.removeAttributeNode(rdfid);
                    }
                    else if (about == null && rdfid == null){
                        var bnid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "nodeID");
                        if (bnid){
                            frame.addBNode(bnid.nodeValue);
                            dom.removeAttributeNode(bnid);
                        }
                        else {
                            frame.addBNode();
                        }
                    }
                    else {
                        frame.addNode(about.nodeValue);
                        dom.removeAttributeNode(about);
                    }
                    // Typed nodes
                    var rdftype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "type");
                    if (RDFParser.ns.RDF + "Description" !== elementURI(dom)){
                        rdftype = {'nodeValue': elementURI(dom)};
                    }
                    if (rdftype != null){
                        this.store.add(frame.node, this.store.sym(RDFParser.ns.RDF + "type"), this.store.sym(uriJoin(rdftype.nodeValue, 
                           frame.base)), this.why);
                        if (rdftype.nodeName){
                            dom.removeAttributeNode(rdftype);
                        }
                    }
                    // Property Attributes
                    for (var x = attrs.length - 1;x >= 0;x--){
                        this.store.add(frame.node, this.store.sym(elementURI(attrs[x])), this.store.literal(attrs[x].nodeValue, 
                           frame.lang), this.why);
                    }
                }
                else {
                      // we should add an arc (or implicit bnode+arc)
                    frame.addArc(elementURI(dom));// save the arc's rdf:ID if it has one
                    if (this.reify){
                        rdfid = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "ID");
                        if (rdfid){
                            frame.rdfid = rdfid.nodeValue;
                            dom.removeAttributeNode(rdfid);
                        }
                    }
                    var parsetype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "parseType");
                    var datatype = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "datatype");
                    if (datatype){
                        frame.datatype = datatype.nodeValue;
                        dom.removeAttributeNode(datatype);
                    }
                    if (parsetype){
                        var nv = parsetype.nodeValue;
                        if (nv === "Literal"){
                            frame.datatype = RDFParser.ns.RDF + "XMLLiteral";// (this.buildFrame(frame)).addLiteral(dom)
                               // should work but doesn't
                            frame = this.buildFrame(frame);
                            frame.addLiteral(dom);
                            dig = false;
                        }
                        else if (nv === "Resource"){
                            frame = this.buildFrame(frame, frame.element);
                            frame.parent.element = null;
                            frame.addBNode();
                        }
                        else if (nv === "Collection"){
                            frame = this.buildFrame(frame, frame.element);
                            frame.parent.element = null;
                            frame.addCollection();
                        }
                        dom.removeAttributeNode(parsetype);
                    }
                    if (attrs.length !== 0){
                        var resource = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "resource");
                        var bnid2 = this.getAttributeNodeNS(dom, RDFParser.ns.RDF, "nodeID");
                        frame = this.buildFrame(frame);
                        if (resource){
                            frame.addNode(resource.nodeValue);
                            dom.removeAttributeNode(resource);
                        }
                        else {
                            if (bnid2){
                                frame.addBNode(bnid2.nodeValue);
                                dom.removeAttributeNode(bnid2);
                            }
                            else {
                                frame.addBNode();
                            }
                        }
                        for (var x1 = attrs.length - 1; x1 >= 0; x1--){
                            var f = this.buildFrame(frame);
                            f.addArc(elementURI(attrs[x1]));
                            if (elementURI(attrs[x1])=== RDFParser.ns.RDF + "type"){
                                (this.buildFrame(f)).addNode(attrs[x1].nodeValue);
                            }
                            else {
                                (this.buildFrame(f)).addLiteral(attrs[x1].nodeValue);
                            }
                        }
                    }
                    else if (dom.childNodes.length === 0){
                        (this.buildFrame(frame)).addLiteral("");
                    }
                }
            }// rdf:RDF
               // dig dug
            dom = frame.element;
            while (frame.parent){
                var pframe = frame;
                while (dom == null){
                    frame = frame.parent;
                    dom = frame.element;
                }
                var candidate = dom.childNodes && dom.childNodes[frame.lastChild];
                if (!candidate || ! dig){
                    frame.terminateFrame();
                    if ( ! (frame = frame.parent)){
                        break;
                    }// done
                    dom = frame.element;
                    dig = true;
                }
                else if ((candidate.nodeType !== RDFParser.nodeType.ELEMENT &&
                        candidate.nodeType !== RDFParser.nodeType.TEXT && 
                        candidate.nodeType !== RDFParser.nodeType.CDATA_SECTION) ||
                    ((candidate.nodeType === RDFParser.nodeType.TEXT ||
                        candidate.nodeType === RDFParser.nodeType.CDATA_SECTION) && 
                        dom.childNodes.length !== 1)){
                    frame.lastChild++;
                }
                else {
                      // not a leaf
                    frame.lastChild++;
                    frame = this.buildFrame(pframe, dom.childNodes[frame.lastChild - 1]);
                    break;
                }
            }
        }// while
    };
    
    /**
     * Cleans out state from a previous parse run
     * @private
     */
    this.cleanParser = function(){
        this.bnodes = {};
        this.why = null;
    };
    
    /**
     * Builds scope frame 
     * @private
     */
    this.buildFrame = function(parent, element){
        var frame = this.frameFactory(this, parent, element);
        if (parent){
            frame.base = parent.base;
            frame.lang = parent.lang;
        }
        if (!element || element.nodeType === RDFParser.nodeType.TEXT ||
                element.nodeType === RDFParser.nodeType.CDATA_SECTION){
            return frame;
        }
        var attrs = element.attributes;
        var base = element.getAttributeNode("xml:base");
        if (base != null){
            frame.base = base.nodeValue;
            element.removeAttribute("xml:base");
        }
        var lang = element.getAttributeNode("xml:lang");
        if (lang != null){
            frame.lang = lang.nodeValue;
            element.removeAttribute("xml:lang");
        }
        // remove all extraneous xml and xmlns attributes
        for (var x = attrs.length - 1;x >= 0;x--){
            if (attrs[x].nodeName.substr(0, 3) === "xml"){
                if (attrs[x].name.slice(0, 6) === 'xmlns:'){
                    var uri = attrs[x].nodeValue;// alert('base for namespac attr:'+this.base);
                    if (this.base) uri = uriJoin(uri, this.base);
                    this.store.setPrefixForURI(attrs[x].name.slice(6), uri);
                }
                //		alert('rdfparser: xml atribute: '+attrs[x].name) //@@
                element.removeAttributeNode(attrs[x]);
            }
        }
        return frame;
    };
};


// taken from rdflib/uri.coffee
var uriJoin = function(given, base) {
    var baseColon, baseHash, baseScheme, baseSingle, colon, lastSlash, path;
    baseHash = base.indexOf('#');
    if (baseHash > 0) {
      base = base.slice(0, baseHash);
    }
    if (given.length === 0) {
      return base;
    }
    if (given.indexOf('#') === 0) {
      return base + given;
    }
    colon = given.indexOf(':');
    if (colon >= 0) {
      return given;
    }
    baseColon = base.indexOf(':');
    if (base.length === 0) {
      return given;
    }
    if (baseColon < 0) {
      alert("Invalid base: " + base + " in join with given: " + given);
      return given;
    }
    baseScheme = base.slice(0, +baseColon + 1 || 9e9);
    if (given.indexOf('//') === 0) {
      return baseScheme + given;
    }
    if (base.indexOf('//', baseColon) === baseColon + 1) {
      baseSingle = base.indexOf('/', baseColon + 3);
      if (baseSingle < 0) {
        if (base.length - baseColon - 3 > 0) {
          return base + '/' + given;
        } else {
          return baseScheme + given;
        }
      }
    } else {
      baseSingle = base.indexOf('/', baseColon + 1);
      if (baseSingle < 0) {
        if (base.length - baseColon - 1 > 0) {
          return base + '/' + given;
        } else {
          return baseScheme + given;
        }
      }
    }
    if (given.indexOf('/') === 0) {
      return base.slice(0, baseSingle) + given;
    }
    path = base.slice(baseSingle);
    lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) {
      return baseScheme + given;
    }
    if (lastSlash >= 0 && lastSlash < path.length - 1) {
      path = path.slice(0, +lastSlash + 1 || 9e9);
    }
    path += given;
    while (path.match(/[^\/]*\/\.\.\//)) {
      path = path.replace(/[^\/]*\/\.\.\//, '');
    }
    path = path.replace(/\.\//g, '');
    path = path.replace(/\/\.$/, '/');
    return base.slice(0, baseSingle) + path;
};


// RDF-Interface API
var RdfXmlParser = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  if (!('parseXml' in options)) {
    if (isNode) {
      options.parseDom = function (toparse, base) {
        var parser = new (require('xmldom').DOMParser);

        return parser.parseFromString(toparse, 'application/xml');
      };
    } else {
      options.parseDom = function (toparse, base) {
        var parser = new DOMParser();

        return parser.parseFromString(toparse, 'application/xml');
      }
    }
  }

  this.process = function (toparse, callback, base, filter, done) {
    if (typeof toparse === 'string') {
      toparse = options.parseDom(toparse);
    }

    if (base == null) {
      base = '';
    }

    if (filter == null) {
      filter = function() { return true; };
    }

    // convert an array of DOM nodes to a XML string
    var domNodesToString = function (nodes) {
      var xmlString = '';

      for(var i=0; i<nodes.length; i++) {
        xmlString += nodes[i].toString();
      }

      return xmlString;
    }

    // rdflib store interface
    var store = {};

    store.add = function (s, p, o ) {
      var triple = rdf.createTriple(s, p, o);

      if (filter(triple)) {
        callback(triple);
      }
    };

    store.bnode = function () { return rdf.createBlankNode(); };

    store.literal = function (value, language, type) {
      // parse type literal
      if (type != null && type.toString() === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral') {
        value = domNodesToString(value.childNodes);
      }

      return rdf.createLiteral(value, language, type);
    };

    store.setPrefixForURI = function () {};

    store.sym = function (iri) { return rdf.createNamedNode(iri); };

    new RdfLibParser(store).parse(toparse, base);

    done(true);

    return true;
  };

  this.parse = function (toparse, callback, base, filter, graph) {
    if (graph == null) {
      graph = rdf.createGraph();
    }

    return this.process(
      toparse,
      function(triple) { graph.add(triple); },
      base,
      filter,
      function(success) { callback(success ? graph : null); });
  };
};

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);

if (isNode) {
  module.exports = function (rdf) {
    rdf.RdfXmlParser = RdfXmlParser.bind(null, rdf);

    var parser = new RdfXmlParser(rdf);
    rdf.parseRdfXml = parser.parse.bind(parser);
  };

  module.exports.parser = RdfXmlParser;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.RdfXmlParser = RdfXmlParser.bind(null, rdf);

  var parser = new RdfXmlParser(rdf);
  rdf.parseRdfXml = parser.parse.bind(parser);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


var SingleGraphStore = function (rdf, singleGraph) {
  this.graph = function (iri, callback) {
    callback(singleGraph);
  };

  this.match = function (iri, subject, predicate, object, callback, limit) {
    callback(singleGraph.match(subject, predicate, object, limit));
  };

  this.add = function (iri, graph, callback) {
    callback(singleGraph = graph);
  };

  this.merge = function (iri, graph, callback) {
    singleGraph.addAll(graph);

    callback(graph);
  };

  this.remove = function (iri, graph, callback) {
    singleGraph = rdf.difference(singleGraph, graph);

    callback(true);
  };

  this.removeMatches = function (iri, subject, predicate, object, callback) {
    singleGraph.removeMatches(subject, predicate, object);

    callback(true);
  };

  this.delete = function (iri, callback) {
    singleGraph.removeMatches();

    callback(true);
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.SingleGraphStore = SingleGraphStore.bind(null, rdf);
  };

  module.exports.store = SingleGraphStore;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.SingleGraphStore = SingleGraphStore.bind(null, rdf);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);

//TODO: handle blank nodes
var SparqlStore = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  var self = this;

  self.endpointUrl = options.endpointUrl;
  self.updateUrl = 'updateUrl' in options ? options.updateUrl : self.endpointUrl;
  self.mimeType = 'mimeType' in options ? options.mimeType : 'text/turtle';
  self.serialize = 'serialize' in options ? options.serialize : rdf.serializeNTriples;
  self.parse = 'parse' in options ? options.parse : rdf.parseTurtle;
  self.request = 'request' in options ? options.request : rdf.defaultRequest;

  var httpSuccess = function (statusCode) {
    return (statusCode >= 200 && statusCode < 300);
  };

  var buildMatch = function (subject, predicate, object) {
    var match = '';

    var nodeToNT = function (node) {
      if (typeof node == 'string') {
        if (node.substr(0, 2) == '_:') {
          return node;
        } else {
          return '<' + node + '>';
        }
      }

      return node.toNT();
    };

    match += subject != null ? nodeToNT(subject) : '?s';
    match += predicate != null ? ' ' + nodeToNT(predicate) : ' ?p';
    match += object != null ? ' ' + nodeToNT(object) : ' ?o';

    return match;
  };

  self.graph = function (graphIri, callback) {
    self.match(graphIri, null, null, null, callback);
  };

  self.match = function (graphIri, subject, predicate, object, callback, limit) {
    var
      filter = buildMatch(subject, predicate, object),
      query = 'CONSTRUCT { ' + filter + ' } { GRAPH <' + graphIri + '> {' + filter + ' }}',
      url = self.endpointUrl + '?query=' + encodeURIComponent(query);

    self.request('GET', url, { 'Accept': self.mimeType }, null,
      function (statusCode, headers, resContent, error) {
        // error during request
        if (error != null) {
          return callback(null, 'request error: ' + error);
        }

        // http status code != success
        if (!httpSuccess(statusCode)) {
          return callback(null, 'status code error: ' + statusCode);
        }

        // TODO: use limit parameters
        self.parse(resContent, callback);
      }
    );
  };

  var updateRequest = function (content, callbackValue, callback) {
    self.request('POST', self.updateUrl, { 'Content-Type': 'application/sparql-update' }, content,
      function (statusCode, headers, resContent, error) {
        // error during request
        if (error != null) {
          return callback(null, 'request error: ' + error);
        }

        // http status code != success
        if (!httpSuccess(statusCode)) {
          return callback(null, 'status code error: ' + statusCode);
        }

        callback(callbackValue);
      }
    );
  };

  self.add = function (graphIri, graph, callback) {
    var content =
      'DROP SILENT GRAPH <' + graphIri + '>;' +
      'INSERT DATA { GRAPH <' + graphIri + '> { ' + self.serialize(graph) + ' } }';

    updateRequest(content, graph, callback);
  };

  self.merge = function (graphIri, graph, callback) {
    var content =
      'INSERT DATA { GRAPH <' + graphIri + '> { ' + self.serialize(graph) + ' } }';

    updateRequest(content, graph, callback);
  };

  self.remove = function (graphIri, graph, callback) {
    var content =
      'DELETE DATA FROM <' + graphIri + '> { ' + self.serialize(graph) + ' }';

    updateRequest(content, true, callback);
  };

  self.removeMatches = function (graphIri, subject, predicate, object, callback) {
    var content =
      'DELETE FROM GRAPH <' + graphIri + '> WHERE { ' +
      buildMatch(subject, predicate, object) + ' }';

    updateRequest(content, true, callback);
  };

  self.delete = function (graphIri, callback) {
    var content = 'CLEAR  GRAPH <' + graphIri + '>';

    updateRequest(content, true, callback);
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.SparqlStore = SparqlStore.bind(null, rdf);
  };

  module.exports.store = SparqlStore;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.SparqlStore = SparqlStore.bind(null, rdf);
}
/* global rdf:true, N3:false */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


if (isNode) {
  global.N3 = require('n3');
}


var TurtleParser = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  this.process = function (data, callback, base, filter, done) {
    var config = {};

    if (base != null) {
      config.documentIRI = base;
    }

    if (filter == null) {
      filter = function () { return true; };
    }

    if (done == null) {
      done = function () {};
    }

    var
      parser = N3.Parser(config),
      blankNodes = {};

    parser.parse(data, function (error, n3Triple) {
      if (error != null) {
        return done(false, error);
      }

      if (n3Triple == null) {
        return done(true);
      }

      var toRdfNode = function (n3Node) {
        if (N3.Util.isIRI(n3Node)) {
          return rdf.createNamedNode(n3Node);
        } else if (N3.Util.isBlank(n3Node)) {
          if (n3Node in blankNodes) {
            return blankNodes[n3Node];
          } else {
            return blankNodes[n3Node] = rdf.createBlankNode();
          }
        } else {
          var
            lang = N3.Util.getLiteralLanguage(n3Node),
            type = N3.Util.getLiteralType(n3Node);

          if (lang === '') {
            lang = null;
          }

          if (type === 'http://www.w3.org/2001/XMLSchema#string') {
            type = null;
          }

          return rdf.createLiteral(
            N3.Util.getLiteralValue(n3Node),
            lang,
            type != null ? rdf.createNamedNode(type) : null);
        }
      };

      var pushTriple = function (n3Triple) {
        var triple = rdf.createTriple(
          toRdfNode(n3Triple.subject),
          toRdfNode(n3Triple.predicate),
          toRdfNode(n3Triple.object));

        if (filter(triple)) {
          callback(triple);
        }
      };

      pushTriple(n3Triple);
    });

    return true;
  };

  this.parse = function (data, callback, base, filter, graph) {
    if (graph == null) {
      graph = rdf.createGraph();
    }

    return this.process(
      data,
      function (triple) { graph.add(triple); },
      base,
      filter,
      function (success, error) { callback(success ? graph : null, error); });
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.TurtleParser = TurtleParser.bind(null, rdf);

    var parser = new TurtleParser(rdf);
    rdf.parseTurtle = parser.parse.bind(parser);
  };

  module.exports.parser = TurtleParser;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  rdf.TurtleParser = TurtleParser.bind(null, rdf);

  var parser = new TurtleParser(rdf);
  rdf.parseTurtle = parser.parse.bind(parser);
}
/* global rdf:true */
'use strict';

var isNode = (typeof process !== 'undefined' && process.versions && process.versions.node);


if (isNode) {
  global.N3 = require('n3');
}


var TurtleSerializer = function (rdf) {
  this.serialize = function (graph, callback) {
    var writer = N3.Writer();

    if (callback == null) {
      callback = function () {};
    }

    var createN3Node = function (node) {
      if (node.interfaceName.toString() === 'NamedNode') {
        return node.nominalValue;
      } else if (node.interfaceName.toString() === 'BlankNode') {
        return '_:' + node.nominalValue;
      } else {
        if (node.datatype != null) {
          return '"' + node.nominalValue + '"^^' + node.datatype.nominalValue;
        } else if (node.language != null) {
          return '"' + node.nominalValue + '"@' + node.language;
        } else {
          return '"' + node.nominalValue + '"';
        }
      }
    };

    graph.forEach(function (triple) {
      writer.addTriple(
        createN3Node(triple.subject),
        createN3Node(triple.predicate),
        createN3Node(triple.object));
    });

    writer.end(function (error, result) {
      if (error != null) {
        callback(null, error);
      } else {
        callback(result);
      }
    });

    return true;
  };
};


if (isNode) {
  module.exports = function (rdf) {
    rdf.TurtleSerializer = TurtleSerializer.bind(null, rdf);

    var serializer = new TurtleSerializer(rdf);
    rdf.serializeTurtle = serializer.serialize.bind(serializer);
  };

  module.exports.serializer = TurtleSerializer;
} else {
  if (typeof rdf === 'undefined') {
    rdf = {};
  }

  if (typeof N3 !== 'undefined') {
    rdf.TurtleSerializer = TurtleSerializer.bind(null, rdf);

    var serializer = new TurtleSerializer(rdf);
    rdf.serializeTurtle = serializer.serialize.bind(serializer);
  }
}
