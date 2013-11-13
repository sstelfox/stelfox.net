
module PostHelpers
  def recent_posts(count = 5)
    sorted_articles[0...count]
  end
end

