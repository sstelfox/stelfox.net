
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

  def recent_posts(count = 5)
    sorted_articles[0...count]
  end

  def sort_by_newest(items)
    items.sort_by do |i|
      attribute_to_time(i[:updated_at] || i[:created_at] || i[:mtime])
    end.reverse
  end
end

