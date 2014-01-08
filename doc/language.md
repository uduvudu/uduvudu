# Language layer Uduvudu
## General Language treatment
Languages shall be treated as much as possible transparently in Uduvudu. Meaning that if data is available in different languages in general is treated transparent for the developer of visualization components. But if necessary the developer can choose to show a specific language or even show multiple languages.

## How to match languages

Matcher gives full language packet to visualizer.

Visualizer takes language from user.

1. On Elements match language (languageFlattener) -> no match (use lang-list)
2. Give full list, plus best matched or undefined to templates.
3. Use language template if available, if not take fallback.