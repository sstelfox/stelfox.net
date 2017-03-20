# encoding: utf-8

module ShortCodeHelper
  def short_code_map
    @config[:short_urls].each_with_object({}) do |url, map|
      k = Digest::SHA1.base64digest(url)[0...6]
      map[k] = url
    end
  end
end
