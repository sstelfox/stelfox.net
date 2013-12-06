
class Search
  data: ->
    return @_index unless @_index == undefined

    request_object = new XMLHttpRequest
    request_object.open("GET", "/search_index.json", false)
    request_object.send(null)

    if request_object.status == 200
      @_index = JSON.parse(request_object.responseText)

    return @_index

  # A method to extract the search terms into the various categories based on
  # prefixes.
  _extract_terms: (raw_query) ->
    # Initialize our extracted terms hash object
    sorted_terms = {
      negative: [],
      required: [],
      optional: []
    }

    # Split the terms out into an array, we only care about three or more
    # characters.
    terms = raw_query.toLowerCase().match(/[+-]?[a-z'-]{3,}/g)

    # Iterate through each of the terms we've extracted
    for t in terms
      do (t) ->
        {term, prefix} = this._extract_prefix(t)

        # Add the term to appropriate lookup table
        sorted_terms["required"].push(term) if prefix == "+"
        sorted_terms["unwanted"].push(term) if prefix == "-"
        sorted_terms["optional"].push(term) if prefix == ""

    # Return the sorted terms
    sorted_terms

  # Returns an array that includes the term, and the extracted prefix if there
  # is one.
  _extract_prefix: (term) ->
    # Extract prefixes if they exist
    results = term.match(/([+-]?)(\w+)/)
    [results[2], results[1]]

  # Parse query, attempt to find matching results, and return objects that meet
  # the requirements.
  query: (query) ->
    terms = this._extract_terms(query)

    # Remove any terms that aren't in our index, this could be stop words or
    # just words that don't appear on any pages. We'll warn if the term being
    # removed was in the required words. We don't need to do this for term
    # exclusions as they don't want those results anyway.

# End Class

# Allow the parse query function 
(exports ? this).Search = new Search

