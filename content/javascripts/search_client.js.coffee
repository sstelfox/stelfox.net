
# Extend coffeescript arrays to include a unique method
Array::unique = ->
  output = {}
  output[@[key]] = @[key] for key in [0...@length]
  value for key, value of output

# Provide a means to store arbitrary key value objects in the users browser.
class DataStorage

  # Perform some initial setup on these instances to pick a storage mechanism.
  constructor: ->
    @_available_storages = []
    this._check_storage_availability()
    @_storage = @_available_storages[0]

  # Method to let users of this class known whether we can store data locally
  # or not.
  available: ->
    @_storage != undefined

  delete: (key) ->
    return false unless this.available
    eval(@_storage).removeItem(key)

  # Gets the value specified at the given key as long as it hasn't expired.
  get: (key) ->
    return false unless this.available
    return null unless (contents = eval(@_storage).getItem(key))
    contents = JSON.parse(contents)

    # If we have contents but they've expired delete them, and return null
    if contents.ttl < new Date().getTime()
      this.delete(key)
      return null

    # We have an unexpired value, return it
    contents.value

  # Stores a value at a specified key along with an expiration time in seconds.
  save: (key, value, ttl = 7200) ->
    return false unless this.available

    # Calculate when this key will expire
    expiration_time = new Date().getTime() + (ttl * 1000)

    eval(@_storage).setItem(key, JSON.stringify({ttl: expiration_time, value: value}))

  # Performs our known storage backend checks and adds them to a list of
  # available storages if the test succeeds.
  _check_storage_availability: ->
    @_available_storages.push("localStorage") if this._local_storage_available()
    @_available_storages.push("sessionStorage") if this._session_storage_available()

  # Attempts to use the local storage mechanism to test whether it's available
  # or not.
  _local_storage_available: ->
    try
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    catch e
      return false

  # Attempts to use the session storage mechanism to test whether it's
  # available or not.
  _session_storage_available: ->
    try
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      return true
    catch e
      return false

# For debugging uncommend the following line to bind the instance of the
# DataStorage class to the window object. It will be able to be accessible via
# window.DataStorage
(exports ? this).DataStorage = new DataStorage

class Search
  constructor: ->
    @_store = new DataStorage

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

    if @_store.available && si = @_store.get('search_index')
      return @_data_cache = si

    request_object = new XMLHttpRequest
    request_object.open("GET", "/api/v1/search_index.json", false)
    request_object.send(null)

    if request_object.status == 200
      @_data_cache = JSON.parse(request_object.responseText)
      @_store.save('search_index', @_data_cache) if @_store.available

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
      unwanted: [],
      required: [],
      optional: []
    }

    # Split the terms out into an array, we only care about three or more
    # characters.
    terms = raw_query.toLowerCase().match(/[+-]?[a-z'-]+/g)

    # TODO: Strip out ' and - after extracting terms

    # Iterate through each of the terms we've extracted
    for t in terms
      [term, prefix] = this._extract_prefix(t)

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

    # TODO: Make use of additional term types
    optional_weights = this._weight_term_list(terms["optional"])
    required_weights = this._weight_term_list(terms["required"], 2)
    unwanted_weights = this._weight_term_list(terms["unwanted"], -2)

    # Merge all the weights
    all_weights = {}
    for weight_list in [optional_weights, required_weights, unwanted_weights]
      for page_id in Object.keys(weight_list)
        all_weights[page_id] = 0 if all_weights[page_id] == undefined
        all_weights[page_id] += weight_list[page_id]

    this._sort_results(this._weight_list_to_results(all_weights))

  # Sort the results in the array by their weights in descending order.
  _sort_results: (results) ->
    results.sort((first, second) =>
      second["weight"] - first["weight"]
    )

  # Convert a list of weighted page IDs to an array of page objects. This will
  # remove any results that have a weight less than or equal to zero
  _weight_list_to_results: (weight_list) ->
    result_list = []

    for page_id in Object.keys(weight_list)
      if weight_list[page_id] > 0
        result = this._data()["pages"][page_id]
        result["weight"] = weight_list[page_id]
        result["page_id"] = page_id
        result_list.push(result)

    result_list

  # Get weighted values for a provided list of terms.
  _weight_term_list: (term_list, scale = 1) ->
    results = {}

    for t in term_list
      for page_id in Object.keys(this._data()["weights"][t])
        results[page_id] =  0 if results[page_id] == undefined
        results[page_id] += (this._data()["weights"][t][page_id] * scale)

    results

search_instance = new Search

# For debugging uncommend the following line to bind the instance of the Search
# class to the window object. It will be able to be accessible via
# window.Search
#(exports ? this).Search = search_instance

# End Class

# When given a query and the results of that query it will update various
# segments of the page to display the results.
displayResults = (query, results, record_history = true) ->
  results_container = document.getElementById('results')
  results_container.innerHTML = ""

  new_results = document.createElement("ul")
  search_header = document.createElement("h2")
  search_header.innerText = "Search Results for #{query}"

  results_container.appendChild(search_header)

  # TODO: Display error if no results.
  for page in results
    list_element = document.createElement("li")
    list_element.innerHTML = "<a href='#{page["path"]}' data-weight='#{page["weight"]}'>#{page["title"]}</a>"

    new_results.appendChild(list_element)

  # Build new title and url
  new_title = "Search Results for #{query} - Stelfox Athen&#xe6;um"
  new_url = "#{window.location.protocol}//#{window.location.host}#{window.location.pathname}?q=#{encodeURIComponent(query)}"

  # If we're recording history add the information to our history state.
  if record_history
    window.history.pushState({query: query, results: results}, new_title, new_url)

  document.title = new_title
  results_container.appendChild(new_results)

# Function that gets called when the form gets submitted while on the search
# page.
formSubmission = (event) ->
  # TODO display error if query field is empty
  q = event.target.q.value
  displayResults(q, search_instance.query(q))
  event.preventDefault()

# Helper for grabbing all of the get parameters for the current page load and
# return them as a hash object for easy consumption elsewhere.
getParams = ->
  query    = window.location.search.substring(1)
  raw_vars = query.split("&")
  params   = {}

  for v in raw_vars
    [key, val]  = v.split("=")
    params[key] = decodeURIComponent(val)

  params

# Bind our search submission function to the actual form.
searchForm = document.getElementById('search')
searchForm.addEventListener('submit', formSubmission, false)

# If this page has a query parameter when the page loads, update the value of
# the search field and grab the results for the specified search.
unless getParams()["q"] == undefined
  q = searchForm.q.value = getParams()["q"]
  displayResults(q, search_instance.query(q))

# Recover the various page elements from our popped state
window.onpopstate = (event) ->
  if event.state
    searchForm.q.value = event.state.query
    displayResults(event.state.query, event.state.results, false)

