
# Extend coffeescript arrays to include a unique method
Array::unique = ->
  output = {}
  output[@[key]] = @[key] for key in [0...@length]
  value for key, value of output

class Search
  # Find and return the intersection between two arrays.
  _ary_intersection: (a, b) ->
    [a, b] = [b, a] if a.length > b.length
    value for value in a when value in b

  # Get and cache the search index, there is currently a bug in this that I'm
  # not sure I want to fix. If this is called fast enough it will make the
  # request multiple times. Ideally it would all block until the single request
  # was finished (TODO). Futures and promises might help with this if I can
  # figure out how to use them in javascript.
  _data: ->
    return @_data_cache unless @_data_cache == undefined

    request_object = new XMLHttpRequest
    request_object.open("GET", "/api/v1/search_index.json", false)
    request_object.send(null)

    if request_object.status == 200
      @_data_cache = JSON.parse(request_object.responseText)

    return @_data_cache

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

  # Get the valid known keywords from the search data
  _keywords: ->
    return @_keywords_cache unless @_keywords_cache == undefined
    @_keywords_cache = Object.keys(this._data()["weights"])

  # Map a list of terms to the pages associated with them
  #
  # Now defunct not sure if needed
  _terms_to_pages: (terms) ->
    (this._data()["weights"][t] for t in terms)

  # Check whether a term is in our index or not
  _valid_term: (term) ->
    (this._keywords().indexOf(term) >= 0)

  # Parse query, attempt to find matching results, and return objects that meet
  # the requirements.
  query: (query) ->
    unless this._data()
      console.log("The search index is unavailable.")
      return false

    terms = this._extract_terms(query)
    results = {}

    for t in terms["optional"]
      for page_id in Object.keys(this._data()["weights"][t])
        results[page_id] =  0 if results[page_id] == undefined
        results[page_id] += this._data()["weights"][t][page_id]

    results

# End Class

# Allow the parse query function 
(exports ? this).Search = new Search

formSubmission = (event) ->
  search_results = window.Search.query(event.target.query.value)
  results_container = document.getElementById('results')
  new_results = document.createElement("ul")

  for page_id in Object.keys(search_results)
    page = window.Search._data()["paths"][page_id]

    list_element = document.createElement("li")
    list_element.innerHTML = "<a href='#{page["path"]}'>#{page["title"]}</a>"

    new_results.appendChild(list_element)

  results_container.innerHTML = ""
  results_container.appendChild(new_results)

  event.preventDefault()

document.getElementById('searchForm').addEventListener('submit', formSubmission, false)

