
class Search
  constructor: ->

  index = ->
    return @_index unless @_index == undefined

    request_object = new XMLHttpRequest
    request_object.open("GET", "/search_index.json", false)
    request_object.send(null)

    if request_object.status == 200
      @_index = JSON.parse(request_object.responseText)

    return @_index

  # A method to extract the search terms into the various categories based on
  # prefixes.
  _extract_terms = (raw_query) ->
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
        tp = _extract_prefix(t)

        # Add the term to appropriate lookup table
        sorted_terms["required"].push(tp[0]) if tp[1] == "+"
        sorted_terms["unwanted"].push(tp[0]) if tp[1] == "-"
        sorted_terms["optional"].push(tp[0]) if tp[1] == ""

    # Return the sorted terms
    sorted_terms

  # Returns an array that includes the term, and the extracted prefix if there
  # is one.
  _extract_prefix = (term) ->
    # Extract prefixes if they exist
    results = term.match(/([+-]?)(\w+)/)
    [results[2], results[1]]

  # Parse query, attempt to find matching results, and return objects that meet
  # the requirements.
  query = (query) ->
    terms = _extract_terms(query)

# Allow the parse query function 
(exports ? this).Search = Search

