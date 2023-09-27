// Obtain a Google Maps API key and add here (instructions in readme.md)
const GOOGLE_MAPS_API_KEY = "YOUR API KEY HERE";

// Set the widget labels for each route
// For origins and destinations, it pays to be specific. You can copy the
// exact address Google Maps shows for your station or bus stop. For
// bus destinations, I found it helpful to pick a destination stop that
// only the bus I cared about would go through. This cuts down on candidates
// you have to filter out from the route data afterwards
const route_1_label = "Route 1";
const route_1_origin = "Origin station or bus stop";
const route_1_destination = "Destination station or bus stop";

const route_2_label = "Route 2";
const route_2_origin = "Origin station or bus stop";
const route_2_destination = "Destination station or bus stop";

// Create an array of routes (about 2 will fit in a small iOS widget)
const routes = [
    {
        label: route_1_label,
        origin_destination: [
            route_1_origin,
            route_1_destination,
        ],
    },
    {
        label: route_2_label,
        origin_destination: [
            route_2_origin,
            route_2_destination,
        ],
    },
];

// Light-Mode 1st, Dark-Mode 2nd
const colors = {
    widgetBg: Color.dynamic(
        new Color("#EAECED"),
        new Color("#22262C")
    ),
    cellBackgroundColor: Color.dynamic(
        new Color("#D0D2D4"),
        new Color("#3C4044")
    ),
    update: Color.dynamic(
        new Color("#676767"),
        new Color("#A1A1A6")
    ),
    labelTextColor: Color.dynamic(
        new Color("#00204F"),
        new Color("#88C4C9")
    ),
    cellTextColor: Color.dynamic(
        new Color("#212121"),
        new Color("#FFFFFF")
    ),
};

const widget = new ListWidget();
widget.backgroundColor = colors.widgetBg;

// Create the URL that makes the Google Maps request
// The request will return a JSON file with fields containing routes and
// characteristics (which we'll pull data from)
function composeGoogleMapsRequestUrl(origin, destination) {
    return [
        "https://maps.googleapis.com/maps/api/directions/json",
        `?origin=${encodeURIComponent(origin)}`,
        `&destination=${encodeURIComponent(destination)}`,
        "&mode=transit",
        "&transit_routing_preference=fewer_transfers",
        "&alternatives=true",
        `&key=${GOOGLE_MAPS_API_KEY}`,
    ].join("");
}

// Create the URL, make the request, and load the JSON file
async function getStopData(origin, destination, transit_type) {
    const googleMapsRequestUrl =
        composeGoogleMapsRequestUrl(
            origin,
            destination,
            transit_type
        );
    const googleMapsRequest = new Request(
        googleMapsRequestUrl
    );
    return googleMapsRequest.loadJSON();
}

// Filter JSON request from Google Maps to the correct bus/train/etc
// The complexity of the filtering depends on what kind of transit you want
// Subway to subway stops tend to be straightforward, but bus lines can
// overlap quite a bit (e.g., my stop has one train line and 3 buses heading 
// the same direction). If you want to track a specific bus or train, you 
// can filter on the "html_instructions", "name", or "short_name" fields,
// to cut it down to the exact line. This will sometimes be contained in
// steps[0], or in steps[1], so it's worth checking both. Below is an example
// using "html_instructions"

function getStopTimes(stopData) {
    const routes = stopData.routes.filter((route) => {
        return (
            (route.legs[0]?.steps[0]?.html_instructions &&
                (
                    route.legs[0].steps[0].html_instructions === "YOUR FILTER"
                )) ||
            (route.legs[0]?.steps[1]?.html_instructions &&
                (
                    route.legs[0].steps[1].html_instructions === "YOUR FILTER"
                ))
        );
    });

    const routeTimes = routes.map((route) => {
        const lineColors = getLineColors(route)
        return {
            time: route.legs[0].departure_time.text,
            colors: lineColors
        }
    })

    return routeTimes;
}

// Using similar logic as above, pull route colors (helpful if tracking)
// different trains or buses on the same route
function getLineColors(route) {
    if (
        route &&
        route.legs &&
        route.legs[0] &&
        route.legs[0].steps
    ) {
        const step = route.legs[0].steps.find(step =>
            step &&
            step.transit_details &&
            step.transit_details.line &&
            step.transit_details.line.color
        )

        if (step) {
            return {
                lineColor: new Color(step.transit_details.line.color),
                textColor: new Color(step.transit_details.line.text_color)
            }
        }
    }

    return {}
}

function createRouteScheduleStack(stopTimes, _color, label) {
    let scheduleLabel = widget.addText(label);
    scheduleLabel.textColor = colors.labelTextColor;
    scheduleLabel.font = Font.boldSystemFont(14);

    let row = widget.addStack();
    row.setPadding(4, 0, 0, 0);

    stopTimes.forEach(({ time: _time, colors: { lineColor, textColor } }, idx) => {

        let cell = row.addStack();
        cell.backgroundColor = lineColor || colors.cellBackgroundColor;
        colors.cellBackgroundColor;
        cell.setPadding(1, 2, 1, 2);
        cell.cornerRadius = 4;

        // Slice the "am" or "pm" from the time string
        const time = _time.slice(0, -2);

        let cellText = cell.addText(time);
        cellText.font = Font.mediumSystemFont(12);

        cellText.textColor = textColor || colors.cellTextColor;

        // Add some spacing to the right of each cell
        const isLastIteration = idx === stopTimes.length - 1;

        widget.addStack(row);
        if (!isLastIteration) {
            row.addText(" ");
        }
    });
}

let i = 0;
let len = routes.length;

for (i; i < len; i++) {
    const route = routes[i];
    const [origin, destination] = route.origin_destination;

    const stopData = await getStopData(origin, destination);
    const stopTimes = getStopTimes(stopData);
    createRouteScheduleStack(
        stopTimes.slice(0, 3),
        route.color,
        route.label
    );

    widget.addSpacer();
}

let lastUpdatedAt = "Last updated " + new Date().toLocaleTimeString();
const lastUpdatedAtText = widget.addText(lastUpdatedAt);
lastUpdatedAtText.textColor = colors.updated;
lastUpdatedAtText.font = Font.lightSystemFont(8);

// Refresh the widget every 10 minutes, between 6am and 10pm
// Get the current date and time
const now = new Date();

// Get the current hour in local time
const currentHour = now.getHours();

// Check if the current hour is between 22 (10pm) and 5 (5am)
if (currentHour >= 22 || currentHour < 6) {
    // If it's between 10pm and 6am, set the refresh time to 6am
    now.setHours(6, 0, 0, 0); // Set to 6:00:00.000 AM
} else {
    // If it's not between 10pm and 6am, set the refresh time to 10 minutes from now
    now.setTime(now.getTime() + 1000 * 60 * 10);
}

Script.setWidget(widget);
Script.complete();

widget.presentSmall();
