
require 'nanoc/tasks'
require 'rake/clean'

CLEAN.include("output/**", "tmp/**", "*.log")

desc "Compile site HTML using nanoc."
task :compile do
  system 'nanoc compile'
end

desc "Start the nanoc autocompiler."
task :auto do
  system 'nanoc autocompile -H thin > autocompile.log 2>&1 &'
end

desc "Run some sanity checks on the site."
task :check do
  system 'nanoc check internal_links css stale external_links'
end
