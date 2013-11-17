
require 'nanoc/tasks'
require 'rake/clean'

CLEAN.include("output/**")

desc "Compile site HTML using nanoc."
task :compile do
  system 'nanoc compile'
end

desc "Start the nanoc autocompiler."
task :auto do
  system 'nanoc autocompile -H thin > autocompile.log 2>&1 &'
end
