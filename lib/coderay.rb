
require 'coderay'
require 'redcarpet'

class HTMLWithCoderay < Redcarpet::Render::HTML
  def block_code(code, language)
      # TODO: This needs to escape #{code} from HTML injection attacks
    if language.nil?
      "<pre><code>#{code}</code></pre>"
    else
      CodeRay.scan(code, language).div(css: :class)
    end
  end
end
