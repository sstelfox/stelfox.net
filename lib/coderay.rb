
require 'coderay'
require 'redcarpet'

class HTMLWithCoderay < Redcarpet::Render::HTML
  def block_code(code, language)
    language ||= "sh"
    CodeRay.scan(code, language).div(css: :class)
  end
end
