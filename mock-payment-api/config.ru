# frozen_string_literal: true

require './app'
require 'rswag/ui/middleware'
require 'rswag/ui/configuration'
require 'rswag/api/middleware'
require 'rswag/api/configuration'

ui_config = Rswag::Ui::Configuration.new
ui_config.openapi_endpoint '/api-docs/v1/swagger.yaml', 'Mock Payment API'

api_config = Rswag::Api::Configuration.new
api_config.openapi_root = File.expand_path('./swagger', __dir__)

map '/api-docs' do
  class PathFix
    def initialize(app)
      @app = app
    end

    def call(env)
      env['PATH_INFO'] = '/' if env['PATH_INFO'].empty?
      @app.call(env)
    end
  end

  use PathFix
  use Rswag::Api::Middleware, api_config
  use Rswag::Ui::Middleware, ui_config
  run ->(_env) { [ 404, { 'Content-Type' => 'text/plain' }, [ 'Not Found' ] ] }
end

run MockPaymentAPI
