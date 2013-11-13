
require 'coderay'
require 'redcarpet'

class HTMLWithCoderay < Redcarpet::Render::HTML
  def block_code(code, language)
    if language.nil?
      "<pre><code>#{code}</code></pre>"
    else
      CodeRay.scan(code, language).div(css: :class, line_numbers: :table)
    end
  end
end
