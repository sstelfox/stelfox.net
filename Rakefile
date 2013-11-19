
require 'nanoc/tasks'
require 'rake/clean'
require 'stringex'

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

namespace :new do
  desc "Create a new post"
  task :post, :title do |t, args|
    mkdir_p './content/blog'
    title = args.title

    filename = "./content/blog/#{Time.now.strftime('%Y-%m-%d')}-#{title.to_url}.md"

    if File.exist?(filename)
      abort('rake aborted!') if ask("#{filename} already exists. Want to overwrite?", ['y','n']) == 'n'
    end

    puts "Creating new post: #{filename}"
    open(filename, 'w') do |post|
      post.puts '---'
      post.puts "title: '#{title}'"
      post.puts "created_at: #{Time.now}"
      post.puts "updated_at: #{Time.now}"
      post.puts 'kind: article'
      post.puts 'type: post'
      post.puts 'tags:'
      post.puts '- default'
      post.puts "---\n\n"
    end
  end
end
