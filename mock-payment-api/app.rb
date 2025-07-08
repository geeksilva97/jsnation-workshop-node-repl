# frozen_string_literal: true

require 'sinatra/base'
require 'openssl'
require 'set'
require 'net/http'

# Simple Sinatra application to emulate a payment service
class MockPaymentAPI < Sinatra::Base
  disable :protection

  VALID_PAYMENT_TOKENS = Set.new
  VALID_RESERVATION_IDS = Set.new
  WEBHOOK_URL = ENV.fetch('PAYMENT_WEBHOOK_URL',
                         'http://host.docker.internal:3000/webhooks/payment')
  WEBHOOK_SECRET = ENV.fetch('PAYMENT_WEBHOOK_SECRET', 'secret')

  set :port, 4000

  get '/' do
    redirect '/api-docs'
  end


  get '/status' do
    'ok'
  end

  post '/payment-tokens' do
    raw_body = request.body.read
    begin
      payload = JSON.parse(raw_body)
    rescue JSON::ParserError
      status 400
      content_type :json
      return({ errors: [ 'invalid JSON' ] }.to_json)
    end

    errors = []
    card_number = payload['card_number']
    expiration = payload['expiration']
    cvv = payload['cvv']

    errors << 'card_number is required' unless card_number
    errors << 'expiration is required' unless expiration
    errors << 'cvv is required' unless cvv

    if card_number && card_number !~ /^\d{13,19}$/
      errors << 'card_number must be digits'
    end

    if expiration && expiration !~ %r{\A(0[1-9]|1[0-2])\/\d{2}\z}
      errors << 'expiration must be in MM/YY format'
    end

    if cvv && cvv !~ /^\d{3,4}$/
      errors << 'cvv must be 3 or 4 digits'
    end

    unless errors.empty?
      status 422
      content_type :json
      return({ errors: errors }.to_json)
    end

    token = OpenSSL::HMAC.hexdigest('SHA256', 'secret_key', payload.to_json)
    VALID_PAYMENT_TOKENS << token
    content_type :json
    { payment_token: token }.to_json
  end

  post '/payments' do
    raw_body = request.body.read
    begin
      payload = JSON.parse(raw_body)
    rescue JSON::ParserError
      status 400
      content_type :json
      return({ errors: [ 'invalid JSON' ] }.to_json)
    end

    errors = []
    payment_token = payload['payment_token']
    reservation_id = payload['reservation_id']
    amount = payload['amount']

    if payment_token.nil? || payment_token.to_s.empty?
      errors << 'payment_token is required'
    elsif payment_token !~ /\A[0-9a-f]{64}\z/ || !VALID_PAYMENT_TOKENS.include?(payment_token)
      errors << 'payment_token is invalid'
    end
    errors << 'reservation_id is required' if reservation_id.nil? || reservation_id.to_s.empty?
    if amount.nil?
      errors << 'amount is required'
    elsif !amount.is_a?(Integer) || amount <= 0
      errors << 'amount must be a positive integer'
    end

    unless errors.empty?
      status 422
      content_type :json
      return({ errors: errors }.to_json)
    end

    if rand < 0.3
      status 500
      content_type :json
      return({ errors: [ 'payment processing error' ] }.to_json)
    end

    VALID_RESERVATION_IDS << reservation_id
    content_type :json
    { status: 'PROCESSING' }.to_json
  end

  post '/simulate-payment' do
    raw_body = request.body.read
    begin
      payload = JSON.parse(raw_body)
    rescue JSON::ParserError
      status 400
      content_type :json
      return({ errors: [ 'invalid JSON' ] }.to_json)
    end

    errors = []
    reservation_id = payload['reservation_id']
    status_param = payload['status']

    if reservation_id.nil? || reservation_id.to_s.empty?
      errors << 'reservation_id is required'
    elsif !VALID_RESERVATION_IDS.include?(reservation_id)
      errors << 'reservation_id is invalid'
    end

    if status_param.nil? || status_param.to_s.empty?
      errors << 'status is required'
    elsif !%w[CONFIRMED FAILED].include?(status_param)
      errors << 'status is invalid'
    end

    unless errors.empty?
      status 422
      content_type :json
      return({ errors: errors }.to_json)
    end

    body = { reservation_id: reservation_id, status: status_param }.to_json
    headers = { 'Content-Type' => 'application/json', 'X-Webhook-Secret' => WEBHOOK_SECRET }
    3.times do |batch|
      3.times do
        Net::HTTP.post(URI(WEBHOOK_URL), body, headers)
      end
      sleep 5 if batch < 2
    end

    content_type :json
    { status: 'SENT' }.to_json
  end
end

MockPaymentAPI.run! if $PROGRAM_NAME == __FILE__
