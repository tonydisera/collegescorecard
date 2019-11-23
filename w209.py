from flask import Flask, render_template
app = Flask(__name__)
import pandas as pd
import os
import numpy as np
import sys
from flask import request

APP_FOLDER = os.path.dirname(os.path.realpath(__file__))

scorecard_data_metric = []
scorecard_data_cleaned = []

metric_all    = "static/data/college_scorecard_merged.csv"
cleaned_all   = "static/data/Most-Recent-Cohorts-All-Data-Elements-ExTitleIV-Cleaned.csv"



@app.route("/")
def root():
    global scorecard_data_metric
    if len(scorecard_data_metric) == 0:
      print("\n\nLOADING DATA\n\n")
      # Load the CSV file from the static folder, inside the current path
      scorecard_data_metric = pd.read_csv(os.path.join(APP_FOLDER,metric_all))
    
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
  global scorecard_data_cleaned

  if len(scorecard_data_cleaned) == 0:
    # Load the CSV file from the static folder, inside the current path
    scorecard_data_cleaned = pd.read_csv(os.path.join(APP_FOLDER,cleaned_all))
  
  cols = scorecard_data_cleaned.columns.tolist()

  col_types = []
  for i, type in enumerate(scorecard_data_cleaned.dtypes):
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
  global scorecard_data_cleaned

  if len(scorecard_data_cleaned) == 0:
    # Load the CSV file from the static folder, inside the current path
    scorecard_data_cleaned = pd.read_csv(os.path.join(APP_FOLDER,cleaned_all))

  fieldsArg = request.args.get('fields', '');
  fields = fieldsArg.split(",")


  # dropping ALL duplicate values
  scorecard_data_cleaned.drop_duplicates(subset = "name", keep = False, inplace = True)


  return scorecard_data_cleaned[fields].to_json(orient='records')




@app.route("/getMetricFields")
def getMetricFields():
    global scorecard_data_metric
    if len(scorecard_data_metric) == 0:
      # Load the CSV file from the static folder, inside the current path
      scorecard_data_metric = pd.read_csv(os.path.join(APP_FOLDER,metric_all))

    cols = scorecard_data_metric.columns.tolist()

    col_types = []
    for i, type in enumerate(scorecard_data_metric.dtypes):
      data_type = "string"
      if type == np.float64 or type == np.int64:
        data_type = "numeric"
      col_types.append(data_type)

    dict = {'name': cols, 'type': col_types}
    columns = pd.DataFrame(dict)

    # show the post with the given id, the id is an integer
    return columns.to_json(orient='records')

@app.route("/getMetricData")
def getMetricData():
  global scorecard_data_metric
  fieldsArg = request.args.get('fields', '');
  fields = fieldsArg.split(",")

  idsArg = request.args.get("ids", '')
  if (idsArg != ''):
    ids = idsArg.split(",")
    print("\n\n ids", len(ids), "\n\n")
  else:
    ids = []

  if len(scorecard_data_metric) == 0:
    # Load the CSV file from the static folder, inside the current path
    scorecard_data_metric = pd.read_csv(os.path.join(APP_FOLDER,metric_all))

  # dropping ALL duplicate values

  scorecard_data_metric.drop_duplicates(subset = "name", keep = False, inplace = True)

  if "instructional_expenditure_per_fte" in fields:
    #scorecard_data = scorecard_data[scorecard_data["instructional_expenditure_per_fte"].isnull() | scorecard_data["instructional_expenditure_per_fte"] < 30000 ]
    scorecard_data_metric['instructional_expenditure_per_fte'][scorecard_data_metric['instructional_expenditure_per_fte'] >= 200000] = 200000

  if "tuition_revenue_per_fte" in fields:
    scorecard_data_metric['tuition_revenue_per_fte'][scorecard_data_metric['tuition_revenue_per_fte'] >= 100000] = 100000

  if (len(ids) > 0):
    data = scorecard_data_metric[scorecard_data_metric.id.isin(ids)]
  else:
    data = scorecard_data_metric

  jsonData = data[fields].to_json(orient='records')

  return jsonData


@app.route("/getDegreesOffered")
def getDegreesOffered():
    fileName = "static/data/degrees_offered_bachelors.csv"
    degrees_offered = pd.read_csv(os.path.join(APP_FOLDER,fileName)) 
    return degrees_offered.to_json(orient="values")

@app.route("/getMetricDataDictionary")
def getMetricDataDictionary():
    fileName = "static/data/data_dictionary.csv"
    data_dictionary = pd.read_csv(os.path.join(APP_FOLDER,fileName)) 
    return data_dictionary.to_json(orient="records")

if __name__ == "__main__":
  port = 80
  if len(sys.argv[1:]) > 0:
    port = sys.argv[1]

  app.run(host="0.0.0.0", port=port)


