from flask import Flask, render_template
app = Flask(__name__)
import pandas as pd
import os
import numpy as np
from flask import request

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))


@app.route("/")
def root():
    return render_template("index.html")


@app.route("/summary")
def summary():
    return render_template("summary.html")


@app.route("/segment")
def segment():
    return render_template("segment.html")


@app.route("/score")
def score():
    return render_template("score.html")        

@app.route("/getFields")
def getFields():
    # Load the CSV file from the static folder, inside the current path
    scorecard_data = pd.read_csv(os.path.join(APP_FOLDER,"static/data/college_scorecard_merged.csv"))
    cols = scorecard_data.columns.tolist()

    col_types = []
    for i, type in enumerate(scorecard_data.dtypes):
      data_type = "string"
      if type == np.float64 or type == np.int64:
        data_type = "numeric"
      col_types.append(data_type)

    dict = {'name': cols, 'type': col_types}
    columns = pd.DataFrame(dict)

    # show the post with the given id, the id is an integer
    return columns.to_json(orient='records')

@app.route("/getData")
def getData():
  fieldsArg = request.args.get('fields', '');
  fields = fieldsArg.split(",")

  scorecard_data = pd.read_csv(os.path.join(APP_FOLDER,"static/data/college_scorecard_merged.csv"))

  # dropping ALL duplicate values
  scorecard_data.drop_duplicates(subset = "name", keep = False, inplace = True)

  return scorecard_data[fields].to_json(orient='records')


