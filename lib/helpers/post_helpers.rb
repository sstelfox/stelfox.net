
module PostHelpers
  # Brought in from Nanoc blogging helper
  def attribute_to_time(time)
    time = Time.local(time.year, time.month, time.day) if time.is_a?(Date)
    time = Time.parse(time) if time.is_a?(String)
    time
  end

  def items_with_type(type)
    @items.select { |i| i[:type] == type }
  end

  def pretty_time_tag(item)
    timestamp = get_item_time(item)
    "<time datetime='#{}'>#{approximate_hour(timestamp)} on #{pretty_time(timestamp)}</time>"
  end

  def pretty_time(timestamp)
    timestamp.strftime("%B %-d, %Y")
  end

  def get_item_time(item)
    attribute_to_time(item[:updated_at] || item[:created_at] || item[:mtime])
  end

  def approximate_hour(timestamp)
    case timestamp.hour
    when 22..23,0..4
      "in the middle of the night"
    when 5..8
      "far too early"
    when 9..11
      "after his first cup of coffee"
    when 12
      "during lunch"
    when 13..16
      "instead of an afternoon nap"
    when 17
      "for happy hour"
    when 18..21
      "while he should be socializing"
    else
      "during an freak time of day"
    end
  end

  def recent_posts(count = 5)
    sorted_articles[0...count]
  end

  def sort_by_newest(items)
    items.sort_by do |i|
      get_item_time(i)
    end.reverse
  end
end

