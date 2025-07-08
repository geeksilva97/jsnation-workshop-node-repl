# frozen_string_literal: true

ENV['RACK_ENV'] ||= 'test'

require 'rack/test'
require 'rspec'
require 'json'
require 'yaml'
require 'rack'

RSpec.configure do |config|
  config.include Rack::Test::Methods
end

def app
  Rack::Builder.parse_file(File.expand_path('../config.ru', __dir__))
end
