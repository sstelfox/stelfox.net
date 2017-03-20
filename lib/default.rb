
base_path = File.dirname(__FILE__)
$LOAD_PATH.unshift(base_path) unless $LOAD_PATH.include?(base_path)

require 'stringex'
require 'titleize'
require 'helpers/post_helpers'
require 'helpers/short_code_helper'
require 'helpers/xml_sitemap_helper'

include Nanoc::Helpers::Blogging
include Nanoc::Helpers::Breadcrumbs
include Nanoc::Helpers::LinkTo
include Nanoc::Helpers::Tagging
include Nanoc::Helpers::Text
include Nanoc::Helpers::Rendering

include PostHelpers
include ShortCodeHelper
include XMLSitemapHelper

