
base_path = File.dirname(__FILE__)
$LOAD_PATH.unshift(base_path) unless $LOAD_PATH.include?(base_path)

require 'stringex'
require 'titleize'
require 'helpers/post_helpers'
require 'helpers/short_code_helper'
require 'helpers/xml_sitemap_helper'

include Nanoc3::Helpers::Blogging
include Nanoc3::Helpers::Breadcrumbs
include Nanoc3::Helpers::LinkTo
include Nanoc3::Helpers::Tagging
include Nanoc3::Helpers::Text
include Nanoc3::Helpers::Rendering

include PostHelpers
include ShortCodeHelper
include XMLSitemapHelper

