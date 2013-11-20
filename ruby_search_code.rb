
require 'json'

index = JSON.parse(File.read('public/search_index.json'))

def id_to_path(id, index)
  index["paths"][id]
end

def search(terms, index, exclusive = false)
  terms = terms.scan(/[a-z\s]+/).join("").split(/\s+/)

  # If we haven't indexed the provided term we don't care about it
  terms.keep_if { |t| index["keywords"].has_key?(t) }

  return {} if terms.empty?

  # Build an AND'd list of IDs that match all keywords we have indexed
  valid_ids = terms.map { |t| index["keywords"][t] }.inject(&:&).map(&:to_i)

  matches = Hash.new(0)
  terms.each do |t|
    (index["weights"][t] || {}).each do |id, weight|
      # When operating in exclusive mode ignore any IDs that didn't have all
      # the keywords.
      next if exclusive && !valid_ids.include?(id.to_i)
      matches[id_to_path(id.to_i, index)] += weight
    end
  end

  # Whether we're operating in exclusive mode or not, pages that matched all
  # the keywords get a 2x bonus to their weight.
  valid_ids.each do |vid|
    matches[id_to_path(vid.to_i, index)] *= 2
  end

  matches
end

puts JSON.pretty_generate(search("ssh chroot session daemon lxc", index))
puts JSON.pretty_generate(search("ssh chroot session daemon lxc", index, true))

