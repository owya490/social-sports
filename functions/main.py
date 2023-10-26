# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import json
import os

import flask
import stripe
from firebase_admin import initialize_app
from firebase_functions import https_fn
from flask import jsonify
from flask.typing import ResponseClass

initialize_app()
#
#
@https_fn.on_request()
def stripe_checkout(req: https_fn.Request) -> https_fn.Response:
    stripe.api_key = 'sk_test_51NXMlhHhhEIekcchKdLTugG6fhJc4ZEEAMjmJqgPuyXnSURzRbaRrWkUoNQ7Unr9xLU9owyF7HLz4tg7xDFof6qD001TFWn0Hw'

    session = stripe.checkout.Session.create(
        line_items = [{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': 'T-shirt',
                },
                'unit_amount': 2000,
            },
            'quantity': 1,
        }],
        mode = 'payment',
        ui_mode = 'embedded',
        return_url = 'https://www.google.com',
    )
    data = {"clientSecret": session.client_secret}
    # headers = {"Access-Control-Allow-Origin", "*"}
    resp = flask.Response(json.dumps(data))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers["Content-type"] = "application/json"

    # response = ResponseClass(response=json.dumps(data),
    #                               status=200,
    #                               mimetype='application/json',
    #                               headers=headers)

    # return jsonify(clientSecret=session.client_secret)
    return resp