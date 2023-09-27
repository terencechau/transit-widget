# iOS Transit Departures Widget
iOS transit widget, adapted from (and almost identical to) https://github.com/trevorwhealy/scriptable-transit

To get started, install Scriptable on your iPhone, which will allow you to run JavaScript code and display its output in widgets. After that, you need to get a Google Maps API key, which will allow you to make requests to Google Maps Directions and get back JSON files with all the data needed to populate the widget. To do so:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/projectcreate) and create a project titled Transit Widget.
2. Go [here](https://console.cloud.google.com/marketplace/product/google/directions-backend.googleapis.com?q=search&referrer=search&project=transit-widget) and enable the Directions API (make sure to go in and disable all other APIs/restrict it to the Directions API only). You'll be prompted to turn on billing and put in your credit card information (more on this below).
3. You'll be shown your API key (the instructions on the original repository add some more steps, but this is as far as I had to go).

Once you're set, edit the JavaScript code in the repo to match your departure station of choice, and enjoy some public transportation!

# Billing

(All I'm saying here can change and I am not responsible for any charges incurred). 

Google will give you a $200 monthly credit for Maps API calls. As of my last commit, pricing for [1000 basic routes queries cost $5](https://mapsplatform.google.com/pricing/). Given that the widget is set to update every 10 minutes, that's roughly 8,640 directions requests per month, assuming you're tracking 2 routes, about $43 a month. As such, you're not really expected to go over the freee $200 monthly allowance. Definitely toggle the option to be warned if you're going over the allowance, and don't share your API key!

# Next Steps

I'll come back and add two example routes with appropriate filtering.
