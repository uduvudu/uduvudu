var combineMatchers = [
    {matcherName: "community", templateId: "community", combineIds: ['depiction','label_comment'], order: 10000000 },
    {matcherName: "label_comment", templateId: "label_comment", combineIds: ['label','comment'], order: 10000000 },
    {matcherName: "person_name", templateId: "person_name", combineIds: ['lastName','firstName'], order: 10000000 },
    {matcherName: "location", templateId: "location", combineIds: ['lat','long'], order: 10000000 },
];

var linkMatchers = [
    {matcherName: "title", predicate: "http://www.patexpert.org/ontologies/pmo.owl#inventorOf", resourcePosition: "object", templateVariable: "inventor", templateId: "inventor", order: 1000000, linkIds: ['lastName']},
];

var predicateMatchers = [
    {matcherName: "label", predicate: "http://www.w3.org/2000/01/rdf-schema#label", resourcePosition: "subject", templateVariable: "title", templateId: "title", order: 1000000 },
    {matcherName: "title", predicate: "http://purl.org/dc/terms/title", resourcePosition: "subject", templateVariable: "title", templateId: "title", order: 1000000 },
    {matcherName: "depiction", predicate: "http://xmlns.com/foaf/0.1/depiction", resourcePosition: "subject", templateVariable: "img_url", templateId: "img", order: 1000000 },
    {matcherName: "pmid", predicate: "http://purl.org/ontology/bibo/pmid", resourcePosition: "subject", templateVariable: "pmid", templateId: "pmid", order: 80000 },
    {matcherName: "name", predicate: "http://xmlns.com/foaf/0.1/name", resourcePosition: "subject", templateVariable: "lastName", templateId: "person_name", order: 60000 },
    {matcherName: "firstName", predicate: "http://xmlns.com/foaf/0.1/firstName", resourcePosition: "subject", templateVariable: "firstName", templateId: "person_name", order: 60000 },
    {matcherName: "lastName", predicate: "http://xmlns.com/foaf/0.1/lastName", resourcePosition: "subject", templateVariable: "lastName", templateId: "person_name", order: 60000 },
    {matcherName: "license", predicate: "http://purl.org/dc/terms/license", resourcePosition: "subject", templateVariable: "license", templateId: "license", order: 20000 },
    {matcherName: "text", predicate: "http://rdfs.org/sioc/ns#content", resourcePosition: "subject", templateVariable: "text", templateId: "text", order: 90000 },
    {matcherName: "comment", predicate: "http://www.w3.org/2000/01/rdf-schema#comment", resourcePosition: "subject", templateVariable: "text", templateId: "text", order: 90000 },
    {matcherName: "abstract", predicate: "http://dbpedia.org/ontology/abstract", resourcePosition: "subject", templateVariable: "text", templateId: "text", order: 90000 },
    {matcherName: "long", predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#long", resourcePosition: "subject", templateVariable: "long", templateId: "literal", order: 90000 },
    {matcherName: "lat", predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#lat", resourcePosition: "subject", templateVariable: "lat", templateId: "literal", order: 90000 },

];
