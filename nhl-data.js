// NHL Team Data with Arena Locations
const NHL_TEAMS = {
    1: { id: 1, name: "New Jersey Devils", abbr: "NJD", city: "Newark", lat: 40.7335, lng: -74.1711, color: "#CE1126" },
    2: { id: 2, name: "New York Islanders", abbr: "NYI", city: "Elmont", lat: 40.7225, lng: -73.5907, color: "#00539B" },
    3: { id: 3, name: "New York Rangers", abbr: "NYR", city: "New York", lat: 40.7505, lng: -73.9934, color: "#0038A8" },
    4: { id: 4, name: "Philadelphia Flyers", abbr: "PHI", city: "Philadelphia", lat: 39.9012, lng: -75.1720, color: "#F74902" },
    5: { id: 5, name: "Pittsburgh Penguins", abbr: "PIT", city: "Pittsburgh", lat: 40.4394, lng: -79.9894, color: "#000000" },
    6: { id: 6, name: "Boston Bruins", abbr: "BOS", city: "Boston", lat: 42.3662, lng: -71.0621, color: "#FFB81C" },
    7: { id: 7, name: "Buffalo Sabres", abbr: "BUF", city: "Buffalo", lat: 42.8750, lng: -78.8761, color: "#002654" },
    8: { id: 8, name: "Montreal Canadiens", abbr: "MTL", city: "Montreal", lat: 45.4961, lng: -73.5693, color: "#AF1E2D" },
    9: { id: 9, name: "Ottawa Senators", abbr: "OTT", city: "Ottawa", lat: 45.2969, lng: -75.9274, color: "#C52032" },
    10: { id: 10, name: "Toronto Maple Leafs", abbr: "TOR", city: "Toronto", lat: 43.6435, lng: -79.3791, color: "#003E7E" },
    12: { id: 12, name: "Carolina Hurricanes", abbr: "CAR", city: "Raleigh", lat: 35.8032, lng: -78.7219, color: "#CE1126" },
    13: { id: 13, name: "Florida Panthers", abbr: "FLA", city: "Sunrise", lat: 26.1583, lng: -80.3256, color: "#041E42" },
    14: { id: 14, name: "Tampa Bay Lightning", abbr: "TBL", city: "Tampa", lat: 27.9425, lng: -82.4519, color: "#002868" },
    15: { id: 15, name: "Washington Capitals", abbr: "WSH", city: "Washington", lat: 38.8981, lng: -77.0209, color: "#041E42" },
    16: { id: 16, name: "Chicago Blackhawks", abbr: "CHI", city: "Chicago", lat: 41.8807, lng: -87.6742, color: "#CF0A2C" },
    17: { id: 17, name: "Detroit Red Wings", abbr: "DET", city: "Detroit", lat: 42.3410, lng: -83.0550, color: "#CE1126" },
    18: { id: 18, name: "Nashville Predators", abbr: "NSH", city: "Nashville", lat: 36.1591, lng: -86.7786, color: "#FFB81C" },
    19: { id: 19, name: "St. Louis Blues", abbr: "STL", city: "St. Louis", lat: 38.6266, lng: -90.2026, color: "#002F87" },
    20: { id: 20, name: "Calgary Flames", abbr: "CGY", city: "Calgary", lat: 51.0373, lng: -114.0519, color: "#C8102E" },
    21: { id: 21, name: "Colorado Avalanche", abbr: "COL", city: "Denver", lat: 39.7486, lng: -105.0077, color: "#6F263D" },
    22: { id: 22, name: "Edmonton Oilers", abbr: "EDM", city: "Edmonton", lat: 53.5467, lng: -113.4970, color: "#041E42" },
    23: { id: 23, name: "Vancouver Canucks", abbr: "VAN", city: "Vancouver", lat: 49.2778, lng: -123.1089, color: "#00205B" },
    24: { id: 24, name: "Anaheim Ducks", abbr: "ANA", city: "Anaheim", lat: 33.8078, lng: -117.8761, color: "#F47A38" },
    25: { id: 25, name: "Dallas Stars", abbr: "DAL", city: "Dallas", lat: 32.7905, lng: -96.8103, color: "#006847" },
    26: { id: 26, name: "Los Angeles Kings", abbr: "LAK", city: "Los Angeles", lat: 34.0430, lng: -118.2673, color: "#111111" },
    28: { id: 28, name: "San Jose Sharks", abbr: "SJS", city: "San Jose", lat: 37.3326, lng: -121.9010, color: "#006D75" },
    29: { id: 29, name: "Columbus Blue Jackets", abbr: "CBJ", city: "Columbus", lat: 39.9693, lng: -83.0061, color: "#002654" },
    30: { id: 30, name: "Minnesota Wild", abbr: "MIN", city: "St. Paul", lat: 44.9448, lng: -93.1011, color: "#154734" },
    52: { id: 52, name: "Winnipeg Jets", abbr: "WPG", city: "Winnipeg", lat: 49.8928, lng: -97.1436, color: "#041E42" },
    53: { id: 53, name: "Arizona Coyotes", abbr: "ARI", city: "Tempe", lat: 33.4484, lng: -112.0740, color: "#8C2633" },
    54: { id: 54, name: "Vegas Golden Knights", abbr: "VGK", city: "Las Vegas", lat: 36.0909, lng: -115.1784, color: "#B4975A" },
    55: { id: 55, name: "Seattle Kraken", abbr: "SEA", city: "Seattle", lat: 47.6220, lng: -122.3540, color: "#001628" }
};

// NHL API endpoints
const NHL_API_BASE = "https://api-web.nhle.com/v1";

class NHLDataService {
    constructor() {
        this.scheduleCache = {};
        this.currentSeason = "20252026";
    }

    // Get season schedule
    async getSeasonSchedule(season) {
        if (this.scheduleCache[season]) {
            return this.scheduleCache[season];
        }

        try {
            // Fetch schedule for the entire season
            const startDate = this.getSeasonStartDate(season);
            const endDate = this.getSeasonEndDate(season);

            const response = await fetch(
                `${NHL_API_BASE}/schedule/${startDate}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch schedule");
            }

            const data = await response.json();
            this.scheduleCache[season] = data;
            return data;
        } catch (error) {
            console.error("Error fetching schedule:", error);
            // Return mock data for development
            return this.getMockSchedule(season);
        }
    }

    // Get all games up to a specific date
    getGamesUpToDate(schedule, targetDate) {
        const games = [];
        // Parse schedule and filter games
        if (schedule && schedule.gameWeek) {
            schedule.gameWeek.forEach(week => {
                week.games.forEach(game => {
                    const gameDate = new Date(game.startTimeUTC);
                    if (gameDate <= targetDate) {
                        games.push({
                            date: gameDate,
                            awayTeam: game.awayTeam.id,
                            homeTeam: game.homeTeam.id,
                            awayTeamName: game.awayTeam.name,
                            homeTeamName: game.homeTeam.name
                        });
                    }
                });
            });
        }
        return games.sort((a, b) => a.date - b.date);
    }

    getSeasonStartDate(season) {
        const year = parseInt(season.substring(0, 4));
        return `${year}-10-01`;
    }

    getSeasonEndDate(season) {
        const year = parseInt(season.substring(4, 8));
        return `${year}-04-30`;
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance; // Returns distance in kilometers
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Calculate travel distances for all teams
    calculateTeamDistances(games) {
        const teamDistances = {};
        const teamTravels = {};

        // Initialize distances
        Object.keys(NHL_TEAMS).forEach(teamId => {
            teamDistances[teamId] = 0;
            teamTravels[teamId] = [];
        });

        // Track last location for each team
        const lastLocation = {};
        Object.keys(NHL_TEAMS).forEach(teamId => {
            const team = NHL_TEAMS[teamId];
            lastLocation[teamId] = { lat: team.lat, lng: team.lng, city: team.city };
        });

        // Process each game chronologically
        games.forEach(game => {
            const awayTeam = NHL_TEAMS[game.awayTeam];
            const homeTeam = NHL_TEAMS[game.homeTeam];

            if (!awayTeam || !homeTeam) return;

            // Away team travels to home team's location
            const distance = this.calculateDistance(
                lastLocation[game.awayTeam].lat,
                lastLocation[game.awayTeam].lng,
                homeTeam.lat,
                homeTeam.lng
            );

            teamDistances[game.awayTeam] += distance;
            teamTravels[game.awayTeam].push({
                date: game.date,
                from: lastLocation[game.awayTeam],
                to: { lat: homeTeam.lat, lng: homeTeam.lng, city: homeTeam.city },
                distance: distance,
                opponent: homeTeam.name
            });

            // Update away team's last location
            lastLocation[game.awayTeam] = { lat: homeTeam.lat, lng: homeTeam.lng, city: homeTeam.city };
        });

        return { distances: teamDistances, travels: teamTravels };
    }

    // Get mock schedule for development/fallback
    getMockSchedule(season) {
        const games = [];
        const startDate = new Date(this.getSeasonStartDate(season));
        const endDate = new Date(this.getSeasonEndDate(season));
        const teamIds = Object.keys(NHL_TEAMS).map(id => parseInt(id));

        // Generate mock games (each team plays ~82 games)
        const daysInSeason = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

        for (let day = 0; day < daysInSeason; day += 2) {
            const gameDate = new Date(startDate);
            gameDate.setDate(gameDate.getDate() + day);

            // Create random matchups
            const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(10, shuffled.length - 1); i += 2) {
                const awayId = shuffled[i];
                const homeId = shuffled[i + 1];

                games.push({
                    date: gameDate,
                    awayTeam: awayId,
                    homeTeam: homeId,
                    awayTeamName: NHL_TEAMS[awayId].name,
                    homeTeamName: NHL_TEAMS[homeId].name
                });
            }
        }

        return {
            gameWeek: [{
                games: games.map(game => ({
                    startTimeUTC: game.date.toISOString(),
                    awayTeam: { id: game.awayTeam, name: game.awayTeamName },
                    homeTeam: { id: game.homeTeam, name: game.homeTeamName }
                }))
            }]
        };
    }

    // Convert kilometers to miles
    kmToMiles(km) {
        return km * 0.621371;
    }
}

// Export for use in app.js
const nhlDataService = new NHLDataService();
