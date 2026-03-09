from flask import Flask, request

app = Flask(__name__)


@app.get('/predict')
def predict_price():
    item = request.args.get('item', '').strip()
    if not item:
        return 'Please enter an item name.'

    return f'No live model is configured for "{item}" yet. Try again later.'


if __name__ == '__main__':
    app.run(debug=True)
