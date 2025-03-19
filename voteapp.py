from flask import Flask, render_template, request, redirect

app = Flask(__name__)

prompt = None
choices = []
votes = {}

@app.route("/")
def home():
    global prompt, choices
    return render_template("vote.html", prompt=prompt, choices=choices)

@app.route("/vote", methods=["POST"])
def vote():
    global votes
    choice = request.form["choice"]
    if choice in votes:
        votes[choice] += 1
    else:
        votes[choice] = 1
    return redirect("/results")

@app.route("/results")
def results():
    return render_template("results.html", votes=votes)

@app.route("/reset", methods=["POST"])
def reset():
    global prompt, choices, votes
    prompt = None
    choices = []
    votes = {}
    return redirect("/")

if __name__ == "__main__":
    app.run()
