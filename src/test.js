/**
 * @file
 * @copyright 2013 Berne University of Applied Sciences (BUAS) -- {@link http://bfh.ch}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * THIS FILE HAS NO DEFINITIVE LICENSING INFORMATION.
 * LICENSE IS SUBJECT OF CHANGE ANYTIME SOON - DO NOT DISTRIBUTE!
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * This file contains ...
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */

/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

var request = require('request'),
  querystring = require('querystring');


/***********************************************************
 * Function definitions
 **********************************************************/

var _receiveData = function _receiveData (error, response, body) {
  console.log(body);
};


/***********************************************************
 * Main script
 **********************************************************/

var query = 'SELECT * WHERE { GRAPH ?g { ?s ?p ?o }}';

var options = {
    method: 'POST',
    uri: 'http://localhost:3030/uduvudu/query',
    headers: {
      accept: 'application/sparql-results+json , application/sparql-results+xml;q=0.9 , application/rdf+xml;q=0.9 , text/turtle;charset=utf-8 , /*;q=0.1',
      'content-type': 'application/x-www-form-urlencoded'
    } ,
    body: querystring.stringify({query: query})
};

request(options, _receiveData);
