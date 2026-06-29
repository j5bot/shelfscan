# 013 b Tag Filtering in Name

Update name, version name, and tag filtering logic and UI

Instead of providing a simple text box for name and version filtering/search and the separate tag 
filtering text box, change the text box for name search to include a dropdown which selects 
between all, name, version, and tag filtering options.

The arrangement should be a left dropdown with left border radius, then the text box with no gap 
and right border radius.  Options in the dropdown should be 'All', 'Name', 'Version', 'Tags'.

When all is selected, the presence of prefixes should allow filtering of the different sub-types.
Filtering should always be case insensitive.

Tags will always be entered with # in them.

Here are some sample cases with the prefixes:

name:Game name
name: game name
version: english
name: game name version:english
name:game name version: english tags:#foo-tag
name:game tags: #foo-tag #bar-tag

Remove the current tag filtering ui

Add the dropdown selection and search string to the url persisted query parameters