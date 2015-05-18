Matcher
-------
The matchers duty is to find defined structures inside an arbitrary graph.The tools the matcher uses can be extended. But in general Uduvudu does deliver three basic matchers which cover a big chunk of all use cases we bumped in.

A matcher returns a list of triples which it can consume. The matcher must return one valid list a time and it will be called multiple times until it returns no values anymore.

The predicateMatcher does simply match predicates which have a literal in subject or object position. The combineMatcher then can combine different predicates to a group. And finally the linkMatcher enables to match structures which are linked through triples with an URI in the subject and the object position.

## predicateMatcher
A predicate matcher is e.g. specified the following:

`{matcherName: "lastName", predicate: "http://xmlns.com/foaf/0.1/lastName", abstractTemplate: "person_name", order: 60000 }`

  * matcherName
  
    The internal ID of a matched predicate. Needs to be unique.
  * predicate
  
    The fully specified name of the predicate.
  * abstractTemplate
  
    The attached template which can render this predicate best.
  * order
  
    Tells where in the page the template should be rendered. Higher values are a higher priority.
  * (optional)templateVariable
  
    The name of the extracted variable. If this is not provided, the "term" of the URI is taken. (See `uduvudu.helper.getTerm` for details.)
  * (optional)resourcePosition
   
    If not provided the resourcePosition will be set automatically to subject.

## combineMatcher
To group different values together on a logical level, and to be able to reuse the same templates we can use the combine matcher. It takes multiple matchers and puts them together.

`{matcherName: "person_name", abstractTemplate: "person_name", combineIds: ['lastName','firstName'], order: 10000000 }`
  * combineIds
  
    Specifies which matcher output is combine together.
  * matcherName
  * predicate
  * abstractTemplate
  * order
  * (optional)templateVariable

## linkMatcher
The different single or combined predicates can be connected to other groups by the help of the link matcher. Like this a matched structure is able to be combined using multiple levels of a tree. 

`{matcherName: "inventor", predicate: "http://www.patexpert.org/ontologies/pmo.owl#inventorOf", resourcePosition: "object", templateVariable: "inventor", abstractTemplate: "inventor", order: 1000000, linkIds: ['lastName']}`
  * linkIds
  
    Specifies which matcher is attached to this link. It is possible to name here all kinds of matchers.
  * matcherName
  * predicate
  * abstractTemplate
  * order
  * (optional)templateVariable
  * (optional)resourcePosition
