College Scorecard Data Viz
=====

This is the final project for the [UC Berkeley's Data Visualization class](https://datascience.berkeley.edu/academics/curriculum/data-visualization), taught by [John Alexis Guerra Gómez](https://johnguerra.co/) in the Data Science Masters (MIDS) program.  

### [Live Demo](http://people.ischool.berkeley.edu/~tonydisera/w209/)
   
### [Video](https://www.youtube.com/watch?v=Q4u2v-RxeMI&feature=youtu.be)

![alt text](https://github.com/tonydisera/collegescorecard/blob/master/vidoes/collegscorecard.gif)

            
The [College Scorecard](https://collegescorecard.ed.gov/) site is a federal
dataset and website that allows users to find, select, and compare higher-education institutions.
Here, we leverage the college scorecard dataset that covers over
7000 higher education institutions by focusing on institutional, academic, admission, financial, and future
value data.
We offer prospective students visualizations that go beyond opaque college rankings to better understand the US college landscape and evaluate and compare particular colleges of interest.

The **By the numbers** visualizations was created by [Vidhu Nath](https://www.ischool.berkeley.edu/people/vidhu-nath#profile-main) using Tableau.  

The **Breaking it down** visualizations was created by [Michael Shum](https://www.ischool.berkeley.edu/people/michael-shum#profile-main) using Tableau.  

The **Compare and Rank** visualization was created by [Tony Di Sera](https://www.ischool.berkeley.edu/people/tony-di-sera#profile-main) using D3. 

The rank visualization design was inspired by the  multi-attribute ranking visualization [Line Up](https://caleydo.org/tools/lineup/).  The summary chart uses the [d3-beeswarm plugin](https://github.com/Kcnarf/d3-beeswarm")


How to Install
======

## Clone the repo

```
git clone https://github.com/tonydisera/collegescorecard.git
```


## How to run it

Make sure you have Flask installed (if having problems make sure to check [the Flask documentation on installation](http://flask.pocoo.org/docs/1.0/installation/) )

```
$ pip3 install Flask
$ pip3 install pandas
```

Then run it like this  (running on port 5000):

```
python3 w209 5000
```

Then open your browser on http://localhost:5000

