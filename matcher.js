var combineMatchers = [
    {matcherName: "address", templateId: "address", combineIds: ['person_name','addressPart'], order: 10000000 },
    {matcherName: "addressPartCombine", templateId: "address", combineIds: ['address_line2','address_line3'], order: 10000000 },
    {matcherName: "community", templateId: "community", combineIds: ['depiction','label_comment'], order: 10000000 },
    {matcherName: "label_comment", templateId: "label_comment", combineIds: ['label','comment'], order: 10000000 },
    {matcherName: "person_name", templateId: "person_name", combineIds: ['lastName','firstName'], order: 10000000 },
    {matcherName: "location", templateId: "location", combineIds: ['lat','long'], order: 10000000 },
    {matcherName: "createMeta", templateId: "createMeta", combineIds: ['created','creator'], order: 10000000 },
    {matcherName: "address_line2", templateId: "address_line2", combineIds: ['street','street2'], order: 10000000 },
    {matcherName: "address_line3", templateId: "address_line3", combineIds: ['city','country','postalCode'], order: 10000000 },
];

var linkMatchers = [
    {matcherName: "inventor", predicate: "http://www.patexpert.org/ontologies/pmo.owl#inventorOf", resourcePosition: "object", templateVariable: "inventor", templateId: "inventor", order: 1000000, linkIds: ['lastName']},
    {matcherName: "addressPart", predicate: "http://www.w3.org/2000/10/swap/pim/contact#address", templateVariable: "address", templateId: "address", order: 1000000, linkIds: ['addressPartCombine']},
    {matcherName: "creator", predicate: "http://purl.org/dc/terms/creator", templateVariable: "creator", templateId: "creator", order: 20000, linkIds: ['label'] },
];

var predicateMatchers = [
    {matcherName: "label", predicate: "http://www.w3.org/2000/01/rdf-schema#label", templateVariable: "title", templateId: "title", order: 1000000 },
    {matcherName: "preflabel", predicate: "http://www.w3.org/2004/02/skos/core#prefLabel", templateVariable: "title", templateId: "title", order: 1000000 },
    {matcherName: "title", predicate: "http://purl.org/dc/terms/title", templateId: "title", order: 1000000 },
    {matcherName: "depiction", predicate: "http://xmlns.com/foaf/0.1/depiction", templateVariable: "img_url", templateId: "img", order: 1000000 },
    {matcherName: "pmid", predicate: "http://purl.org/ontology/bibo/pmid", templateId: "pmid", order: 80000 },
    {matcherName: "name", predicate: "http://xmlns.com/foaf/0.1/name", templateVariable: "lastName", templateId: "person_name", order: 60000 },
    {matcherName: "firstName", predicate: "http://xmlns.com/foaf/0.1/firstName", templateId: "person_name", order: 60000 },
    {matcherName: "lastName", predicate: "http://xmlns.com/foaf/0.1/lastName", templateId: "person_name", order: 60000 },
    {matcherName: "license", predicate: "http://purl.org/dc/terms/license", templateId: "license", order: 20000 },
    {matcherName: "created", predicate: "http://purl.org/dc/terms/created", templateId: "created", order: 20000 },
    {matcherName: "text", predicate: "http://rdfs.org/sioc/ns#content", templateId: "text", order: 90000 },
    {matcherName: "comment", predicate: "http://www.w3.org/2000/01/rdf-schema#comment", templateVariable: "text", templateId: "text", order: 90000 },
    {matcherName: "abstract", predicate: "http://dbpedia.org/ontology/abstract", templateVariable: "text", templateId: "text", order: 90000 },
    {matcherName: "long", predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#long", templateId: "text", order: 90000 },
    {matcherName: "lat", predicate: "http://www.w3.org/2003/01/geo/wgs84_pos#lat", templateId: "text", order: 90000 },
    {matcherName: "city", predicate: "http://www.w3.org/2000/10/swap/pim/contact#city", templateId: "text", order: 90000 },
    {matcherName: "country", predicate: "http://www.w3.org/2000/10/swap/pim/contact#country", templateId: "text", order: 90000 },
    {matcherName: "street", predicate: "http://www.w3.org/2000/10/swap/pim/contact#street", templateId: "text", order: 90000 },
    {matcherName: "street2", predicate: "http://www.w3.org/2000/10/swap/pim/contact#street2", templateId: "text", order: 90000 },
    {matcherName: "postalCode", predicate: "http://www.w3.org/2000/10/swap/pim/contact#postalCode", templateId: "text", order: 90000 },
];
