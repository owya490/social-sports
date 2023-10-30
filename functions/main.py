# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import json
import os

import flask
import stripe
from firebase_admin import initialize_app
from firebase_functions import https_fn, options
from flask import jsonify
from flask.typing import ResponseClass

initialize_app()
#
#
@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["get", "post"]))
def stripe_checkout(req: https_fn.Request) -> https_fn.Response:
    body_data = req.get_json()
    print(json)
    stripe.api_key = 'sk_test_51NXMlhHhhEIekcchKdLTugG6fhJc4ZEEAMjmJqgPuyXnSURzRbaRrWkUoNQ7Unr9xLU9owyF7HLz4tg7xDFof6qD001TFWn0Hw'

    session = stripe.checkout.Session.create(
        line_items = [{
            'price_data': {
                'currency': 'aud',
                'product_data': {
                    'name': body_data["name"],
                },
                'unit_amount': body_data["price"],
            },
            'quantity': body_data["quantity"],
        }],
        mode = 'payment',
        ui_mode = 'embedded',
        return_url = 'https://www.google.com',
    )
    data = {"clientSecret": session.client_secret}
    # headers = {"Access-Control-Allow-Origin", "*"}
    resp = flask.Response(json.dumps(data))
    # resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers["Content-type"] = "application/json"

    # response = ResponseClass(response=json.dumps(data),
    #                               status=200,
    #                               mimetype='application/json',
    #                               headers=headers)

    # return jsonify(clientSecret=session.client_secret)
    return resp