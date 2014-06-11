Matcher
-------
The matchers duty is to find defined structures inside an arbitrary graph. The tools the matcher uses can be extended. But in general Uduvudu does deliver three basic matchers which cover a big chunk of all use cases we bumped in.

The predicateMatcher does simply match predicates which have a literal in subject or object position. The combineMatcher then can combine different predicates to a group. And finally the linkMatcher enables to match structures which are linked through triples with an URI in the subject and the object position.

## predicateMatcher
A predicate matcher is e.g. specified the following:

`{matcherName: "firstName", predicate: "http://xmlns.com/foaf/0.1/firstName", templateId: "person_name", order: 60000 }`

  * matcherName
    The internal ID of a matched predicate. Needs to be unique.
  * predicate
    The fully specified name of the predicate.
  * templateId
    The attached template which can render this predicate best.
  * order
    Tells where in the page the template should be rendered. Higher values are a higher priority.
  * (optional)templateVariable
  * (optional)resourcePosition

## combineMatcher

## linkMatcher
