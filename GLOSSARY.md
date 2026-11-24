# Library

A personal library site: notes grouped by subject on a wall, a blog, and Cinema, all reached from one room. Rows, embers, topics, the wall and the feed are described in `docs/world.md`.

## Language

**Note group**:
A subject on the wall (Python, Docker) together with every note filed under it, published or draft. Each note belongs to exactly one group.
_Avoid_: section, category, folder

**Group view**:
Everything a page shows about one note group: its rows with their numbers and tags, its embers, and its topics.
_Avoid_: group data, group listing

**Way back**:
How a page returns to the page it belongs under (group page → wall, note → its group, post → feed, feed → room, Cinema → room): by history if it was opened from there, otherwise by its `data-back` link.
_Avoid_: back button, return, back navigation
