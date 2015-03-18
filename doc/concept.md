# Uduvudu Implementation Concept

#### Stakeholders / Figures
* End-User: The user which is consuming rendered visualizations as end product.
* Developer: The developer which is integrating the framework in his application.
* UI Designer: The design specialist which is adding information about how to present information structures.


## Summary
The Uduvudu implementation is a demanded component for the Fusepool EU project. The in this document described requirements are minimaly based on the description of Task T5.5 from the Fusepool DoW. The framework itself does want to solve the problem at hand in a slightly more extensive fashion to be able to be used in a more generalistic use case.

The common prerequisite for the project environment is that the framework does work only based on input data specified in the RDF format. And exactly based on this prerequisite we can infer different advantages for a visualization rendering framework. 

Based on the description of snippets of the input graph structure and a additional description on how to visualize this snippet, the input graph information shall be visualized. 

## Use Case: Adaptive layouts, shared visualizations and feature suggestions
A dashboard framework generates the user interface based on semantically stored data recognizing its description, which is a part of the data itself. In this way it identifies which data items are requested for the specific layout and how. The semantic description declares the type of a layout as well as its properties and context or relation to other types of layouts. This semantic framework enables the system to generate dynamic user interface for any given situation on the fly, independent from a given process or task.

### Scope
The scope of the first implementation in the frame of the Fusepool project is set on the visualization of a small graph.

The size of a small graph can in this case be roughtly defined as to be the amount which is possible to be consumed by a person without having to navigate. Meaning that the visual representation of the information in the graph can be put together on one single screen or on a standard page of paper.

The important take away here is that the selection of which data shall be presented is not part of the Uduvudu framework at this point. In contrary do we define that all data which is given to the framework must be presented in any way to the user.

Making higly specialized layouts for specific information structures and still keep the framework generic and include the ability to remix different visualization snippets is important. This functionality shall than result to spawn certain intelligence as it will be possible to reuse visualization information from other domains or older projects automatically. Also do we want include a high adaptability of the output depending on the consumption case.

We want to achieve this by first (1) splitting the generation of the visualization in tiny but still from a UI designer easily to understand and combinable snippets. And second (2) we do split the generation process in two distingued phases. In the matching step we use external information to find known structures inside the input graph. In a second step the extracted and therefore well known structures are depending on the actuale consumption case visualized.


## Goals

### Requirements
- Visualization of RDF formated without deep knowledge about RDF

  The main requirement is to visualize all input data in the graph. Intialy the data is shown based on a set of minimal visualization rules which are built-in in the framework. Through addition of more descriptive data about the visualization of information structures (snippets of information) it is possible to create more specialized end visualizations. 

- Embrace unknown data structures

  The framework is able to cope with the case where the description how to visualize the information is missing. Because of this propoerty the visualization is robust even if the information structure is enhanced or becomes smaller. 
  
  Further is the goal not only to cope with cases of missing information but to be able to still generate a human friendly representation of the available data.
  
- Adaptive visualizations

  A strong focus is put on the adaptive output of the framework. The created content can be use different forms of visualization regarding to the currently used device (in a first phase mainly the difference between mobile and desktop applicaiton), the preferences the user specifies (new added visualization descriptions and definition of ordering of the information) and also the language.

### Special Cases

#### Language transparency
The specific language of the data could be seen as part of information or as an abstract dimension which is transparent to the framework. It would be nice to propose to the developer a fallback which handles the languages transparent. This would be, based on the specified output language, the correct language version will be used in a language agnostic visualization.

For sure but we need also to give the possibility to the UI designer to access the language data directly to have the ability to create multilanguage representations of the information. (Multiple languages are purposfully shown in one visualization.)

## Implementation
In this chapter we like to summarize the possible paths available to implement such a kind of a framework. The main structure as mentioned in the scope which forsees to have tiny visualization snippets and the two phase approach with a matcher and visualizer we want to develop further in the following pargraphs.

### Matcher
The purpose of the matcher is to extract known structures from the input data. In the case of this framework the input is by definition a RDF graph. Abstractly speaking is this component looking for known sub graph structures. Further can we refine the output of this component to be sub graphs in the form of trees. 

The matcher therefore has as input the whole input graph which needs to be visualized as also a catalog of known graph structures. The output is a collection of the matched strucutures, each with an added information like an identifier of the structure which will be used to access the corresponding visualization information.

The form of the sub graphs can be based on the connection of the data. This are in the case of RDF mostly attributes. Also can we look for structures using schemas inside the graph data. There we would look for types of data.

Matching an information structure with an arbitrary depth can be done in two different approaches we se feasable.

#### 1) Rich matching structures

In this case we match in each iteration trees of information structures. The to match information structure needs to be described in a way that it can find tree structures. Our first approach was to use SPARLQ for this task, this makes it possible to match arbitrary structures. In a second step we need to match the result data from the SPARQL query to a defined structure which does not vary for the later visualization step.

Another approach is to use a recent concept we found named JSON-LD Framing. The main goal of this approach is to generate defined ordering inside of JSON-LD graphs. The motivation arises from the need to be able to cryptically sign and verify a graph.

##### Advantages

- The ability to describe more complex structures in one descriptive matching part.

##### Disadvantages

- Non trivial mechanism (potentially not standardized) needed to create fixed information structures which can be handed to the visualizations. 

- Increased danger of the loss of robustness in special cases.

- Less generic approach of implementation.

- Using of RDF for the description of the matching is problematic. 

- As more complex structures will be described the usefullness for reuse will be diminuished.


#### 2) Flat matchers combined to trees

Another approach is to keep the matching itself flat based on attributes. The depth of the information structure is added by combining the different matchers to tree structures. This makes it necessary to enhance even the simplest information structures with visualization information.

##### Advantages

- Structure of the information is simple to describe.

- The reuse of information description is facilated by design.

- There is only one common tree structuring necessary.

- Might be faster for later use of lists of information structures.

- No need to transfer the matched variables to a tree structure.

##### Disadvantages

- Complexity for the UI Designer is in general higher.

- Smallest information structure units need their own descriptions. (It is but possible to reuse descriptions of basic types.)

### Visualizer
The visualizer is in charge of using the output of the matcher and combinig it, depending of the situation (device, language) with the visualization descriptions.

The framework is incorporating the information about the platform as also the current language which is used.

Every matcher needs at least one generic visualization description to work with. Further can this description be extended for different devices or languages.

The targeted output is mainly HTML, this for we need to make sure that we can also generate visualizations which can have interactive elements. Therefor is the simplest case just to use a template engine writing the values into the rendered stream. But also is it possible to add interactivity by blocks of javascript or design features by adding common CSS blocks.

### User Preferences
User preferences can be included into the system simply by adding additional matching and/or visualization descriptions which have higher priority and overload system defined descriptions. 


## Related Work

### Fresnel - Display Vocabulary for RDF

People knowing Fresnel will see multiple analogies to Uduvudu. This chapter shall in short manner show the differencens and mainly practical advantages of Uduvudu in contrast to Fresnel.

- Complicated implementation through multiple selector language which are in itself each quite demanding.

- Need to fully understand the RDF data structure to use the selection process.

- The visualization part of the Fresnel vocabulary is bound to representation of literals. It is difficult to make more complex visualisations based on the display part of the language.

## Annex

#### Glossar
* Information Structure: A graph which represents an information complex. Eg. a Person with a prename and a lastname and the sex. As also  connected two addresses to it which each helds street, and town.
