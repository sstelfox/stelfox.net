
module PostHelpers
  # Brought in from Nanoc blogging helper
  def attribute_to_time(time)
    time = Time.local(time.year, time.month, time.day) if time.is_a?(Date)
    time = Time.parse(time) if time.is_a?(String)
    time
  end

  def create_tag_pages
    # Build up a reverse association between tags and items
    tagged_items = items.each_with_object(Hash.new([])) do |i, o| 
      tag_list = i[:tags].uniq || []
      tag_list.each do |t|
        o[t.to_s] << i
      end
    end

    tagged_items.keys.each do |t|
      content = "TODO: Content"
      attrs = {title: "Pages Tagged with #{t}"}
      path = "/tags/#{tag.downcase}"

      items << Nanoc3::Item.new(content, attrs, path)
    end
  end

  def items_with_type(type)
    @items.select { |i| i[:type] == type }
  end

  def recent_posts(count = 5)
    sorted_articles[0...count]
  end

  def sort_by_newest(items)
    items.sort_by do |i|
      attribute_to_time(i[:created_at])
    end.reverse
  end
end

