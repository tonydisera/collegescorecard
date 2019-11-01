Flask + D3 example
======

A flask app for serving and showing US College Scorecard data.

## How to run it?

Make sure you have Flask installed (if having problems make sure to check [the Flask documentation on installation](http://flask.pocoo.org/docs/1.0/installation/) )

```
$ pip install Flask
$ pip install pandas
```

Then run it like this:

```
$ FLASK_APP=w209.py flask run
```

Then open your browser on http://localhost:5000

## Backend commands:

http://localhost:5000/getFields

This will return all of the field names in the dataset.  Right now, this is a subset of all of the fields.  It has also merged in data from other rankings.



http://localhost:5000/getData?fieldNames=field1,field2,field3

This will return an array of JSON objects for each college with the fields provided.





