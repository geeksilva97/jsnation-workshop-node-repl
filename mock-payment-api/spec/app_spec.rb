# frozen_string_literal: true

require 'spec_helper'
require 'openssl'
require_relative '../app'

describe 'GET /status' do
  it 'returns ok' do
    get '/status'
    expect(last_response.status).to eq(200)
    expect(last_response.body).to eq('ok')
  end
end

describe 'POST /payment-tokens' do
  let(:params) do
    {
      card_number: '4111111111111111',
      expiration: '12/25',
      cvv: '123'
    }.to_json
  end

  it 'returns a payment token' do
    post '/payment-tokens', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(200)
    json = JSON.parse(last_response.body)
    expected_token = OpenSSL::HMAC.hexdigest('SHA256', 'secret_key', params)
    expect(json).to eq('payment_token' => expected_token)
  end

  it 'returns 422 when params are invalid' do
    invalid_params = { card_number: '123', expiration: '13/25', cvv: '12' }.to_json
    post '/payment-tokens', invalid_params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(422)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('card_number must be digits', 'expiration must be in MM/YY format', 'cvv must be 3 or 4 digits')
  end

  it 'returns 400 for invalid JSON' do
    post '/payment-tokens', 'not-json', { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(400)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('invalid JSON')
  end
end

describe 'POST /payments' do
  let(:token_params) do
    {
      card_number: '4111111111111111',
      expiration: '12/25',
      cvv: '123'
    }.to_json
  end

  def generate_token
    post '/payment-tokens', token_params, { 'CONTENT_TYPE' => 'application/json' }
    JSON.parse(last_response.body)['payment_token']
  end

  let(:params) do
    {
      payment_token: generate_token,
      reservation_id: 'res-123',
      amount: 20_000
    }.to_json
  end

  it 'returns PROCESSING status' do
    allow_any_instance_of(Object).to receive(:rand).and_return(0.5)
    post '/payments', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(200)
    json = JSON.parse(last_response.body)
    expect(json).to eq('status' => 'PROCESSING')
  end

  it 'fails randomly with 500 status' do
    allow_any_instance_of(Object).to receive(:rand).and_return(0.1)
    post '/payments', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(500)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('payment processing error')
  end

  it 'returns 422 when params are invalid' do
    invalid = { payment_token: 'bad', amount: -1 }.to_json
    post '/payments', invalid, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(422)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('payment_token is invalid', 'reservation_id is required', 'amount must be a positive integer')
  end

  it 'rejects tokens not issued by the API' do
    invalid_token = 'a' * 64
    invalid = { payment_token: invalid_token, reservation_id: 'res-123', amount: 1000 }.to_json
    post '/payments', invalid, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(422)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('payment_token is invalid')
  end

  it 'returns 400 for invalid JSON' do
    post '/payments', 'oops', { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(400)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('invalid JSON')
  end
end

describe 'POST /simulate-payment' do
  let(:token_params) do
    {
      card_number: '4111111111111111',
      expiration: '12/25',
      cvv: '123'
    }.to_json
  end

  def generate_token
    post '/payment-tokens', token_params, { 'CONTENT_TYPE' => 'application/json' }
    JSON.parse(last_response.body)['payment_token']
  end

  before do
    payment_params = {
      payment_token: generate_token,
      reservation_id: 'res-123',
      amount: 1000
    }.to_json
    post '/payments', payment_params, { 'CONTENT_TYPE' => 'application/json' }
  end

  it 'sends webhook requests' do
    allow(Kernel).to receive(:sleep)
    params = { reservation_id: 'res-123', status: 'CONFIRMED' }.to_json
    expected_headers = {
      'Content-Type' => 'application/json',
      'X-Webhook-Secret' => MockPaymentAPI::WEBHOOK_SECRET
    }
    expect(Net::HTTP).to receive(:post)
      .with(URI(MockPaymentAPI::WEBHOOK_URL), params, expected_headers)
      .exactly(9).times
      .and_return(nil)
    post '/simulate-payment', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(200)
    json = JSON.parse(last_response.body)
    expect(json['status']).to eq('SENT')
  end

  it 'returns 422 for unknown reservation_id' do
    params = { reservation_id: 'bad', status: 'CONFIRMED' }.to_json
    post '/simulate-payment', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(422)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('reservation_id is invalid')
  end

  it 'returns 422 for invalid status' do
    params = { reservation_id: 'res-123', status: 'WRONG' }.to_json
    post '/simulate-payment', params, { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(422)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('status is invalid')
  end

  it 'returns 400 for invalid JSON' do
    post '/simulate-payment', 'oops', { 'CONTENT_TYPE' => 'application/json' }
    expect(last_response.status).to eq(400)
    json = JSON.parse(last_response.body)
    expect(json['errors']).to include('invalid JSON')
  end
end

describe 'GET /api-docs' do
  it 'redirects to the Swagger UI index' do
    get '/api-docs'
    expect(last_response.status).to eq(301)
    follow_redirect!
    expect(last_request.path).to eq('/api-docs/index.html')
  end
end

describe 'GET /api-docs/v1/swagger.yaml' do
  it 'serves the openapi file' do
    get '/api-docs/v1/swagger.yaml'
    expect(last_response.status).to eq(200)
    yaml = YAML.safe_load(last_response.body)
    expect(yaml['paths'].keys).to include('/status', '/payment-tokens', '/payments', '/simulate-payment')
  end
end
