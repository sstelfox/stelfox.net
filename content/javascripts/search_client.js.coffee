
class Search
  # Get and cache the search index, there is currently a bug in this that I'm
  # not sure I want to fix. If this is called fast enough it will make the
  # request multiple times. Ideally it would all block until the single request
  # was finished (TODO). Futures and promises might help with this if I can
  # figure out how to use them in javascript.
  _data: ->
    request_object = new XMLHttpRequest
    request_object.open("GET", "/search_index.json", false)
    request_object.send(null)

    if request_object.status == 200
      @index = JSON.parse(request_object.responseText)

    return @index

  # Returns an array that includes the term, and the extracted prefix if there
  # is one.
  _extract_prefix: (term) ->
    # Extract prefixes if they exist
    results = term.match(/([+-]?)(\w+)/)
    [results[2], results[1]]

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
      tp = this._extract_prefix(t)
      term = tp[0]
      prefix = tp[1]

      # Remove any terms that aren't in our index, this could be stop words or
      # just words that don't appear on any pages. We'll warn if the term being
      # removed was in the required words. We don't need to do this for term
      # exclusions as they don't want those results anyway.
      if this._valid_term(term)
        # Add the term to appropriate lookup table
        sorted_terms["required"].push(term) if prefix == "+"
        sorted_terms["unwanted"].push(term) if prefix == "-"
        sorted_terms["optional"].push(term) if prefix == ""
      else if prefix == "+"
        console.log("Removing required term #{term} as it would result in no matches.")

    # Return the sorted terms
    sorted_terms

  # Map a list of terms to the pages associated with them
  #
  # Now defunct not sure if needed
  _terms_to_pages: (terms) ->
    (this._data()["keywords"][t] for t in terms)

  # Check whether a term is in our index or not
  _valid_term: (term) ->
    (Object.keys(this._data()["keywords"]).indexOf(term) >= 0)

  # Parse query, attempt to find matching results, and return objects that meet
  # the requirements.
  query: (query) ->
    unless this._data()
      console.log("The search index is unavailable.")
      return false

    terms = this._extract_terms(query)

# End Class

# Allow the parse query function 
(exports ? this).Search = new Search

