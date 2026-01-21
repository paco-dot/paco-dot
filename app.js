// NHL Travel Map Application
class NHLTravelMap {
    constructor() {
        this.map = null;
        this.markers = {};
        this.routes = [];
        this.currentSeason = "20252026";
        this.scheduleData = null;
        this.allGames = [];
        this.currentGameIndex = 0;
        this.teamDistances = {};
        this.teamTravels = {};
        this.isPlaying = false;
        this.playInterval = null;
        this.filterMode = "all"; // "all" or "current"

        this.init();
    }

    async init() {
        this.initMap();
        this.initEventListeners();
        await this.loadSeasonData(this.currentSeason);
    }

    initMap() {
        // Initialize Leaflet map centered on North America
        this.map = L.map('map', {
            center: [45.0, -95.0],
            zoom: 4,
            minZoom: 3,
            maxZoom: 10
        });

        // Use a dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        // Add team markers
        this.addTeamMarkers();
    }

    addTeamMarkers() {
        Object.values(NHL_TEAMS).forEach(team => {
            const marker = L.circleMarker([team.lat, team.lng], {
                radius: 8,
                fillColor: team.color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            marker.bindPopup(`
                <strong>${team.name}</strong><br>
                ${team.city}<br>
                <span style="color: #4ecdc4;">Click for details</span>
            `);

            marker.on('click', () => this.showTeamDetails(team.id));

            this.markers[team.id] = marker;
        });
    }

    initEventListeners() {
        // Season selector
        document.getElementById('season-select').addEventListener('change', (e) => {
            this.loadSeasonData(e.target.value);
        });

        // Timeline slider
        const timeline = document.getElementById('timeline');
        timeline.addEventListener('input', (e) => {
            this.updateTimelinePosition(parseInt(e.target.value));
        });

        // Play/Pause button
        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetTimeline();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMode = e.target.dataset.filter;
                this.updateLeaderboard();
            });
        });
    }

    async loadSeasonData(season) {
        this.currentSeason = season;
        document.getElementById('leaderboard-list').innerHTML = '<div class="loading">Loading season data...</div>';

        try {
            this.scheduleData = await nhlDataService.getSeasonSchedule(season);

            // Get all games for the season
            const endDate = new Date(nhlDataService.getSeasonEndDate(season));
            this.allGames = nhlDataService.getGamesUpToDate(this.scheduleData, endDate);

            // Set up timeline
            const timeline = document.getElementById('timeline');
            timeline.max = this.allGames.length - 1;
            timeline.value = 0;

            this.currentGameIndex = 0;
            this.updateTimelinePosition(0);

            console.log(`Loaded ${this.allGames.length} games for season ${season}`);
        } catch (error) {
            console.error("Error loading season data:", error);
            document.getElementById('leaderboard-list').innerHTML = '<div class="loading">Error loading data. Using mock data...</div>';

            // Load mock data
            this.scheduleData = nhlDataService.getMockSchedule(season);
            const endDate = new Date(nhlDataService.getSeasonEndDate(season));
            this.allGames = nhlDataService.getGamesUpToDate(this.scheduleData, endDate);

            const timeline = document.getElementById('timeline');
            timeline.max = this.allGames.length - 1;
            timeline.value = 0;

            this.currentGameIndex = 0;
            this.updateTimelinePosition(0);
        }
    }

    updateTimelinePosition(gameIndex) {
        if (gameIndex < 0 || gameIndex >= this.allGames.length) {
            return;
        }

        this.currentGameIndex = gameIndex;
        const gamesUpToNow = this.allGames.slice(0, gameIndex + 1);

        // Calculate distances
        const result = nhlDataService.calculateTeamDistances(gamesUpToNow);
        this.teamDistances = result.distances;
        this.teamTravels = result.travels;

        // Update date display
        const currentDate = this.allGames[gameIndex].date;
        document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update visualization
        this.updateRoutes();
        this.updateLeaderboard();
    }

    updateRoutes() {
        // Clear existing routes
        this.routes.forEach(route => this.map.removeLayer(route));
        this.routes = [];

        // Draw routes for each team up to current point
        Object.entries(this.teamTravels).forEach(([teamId, travels]) => {
            travels.forEach((travel, index) => {
                // Only show recent travels (last 5 for each team) to avoid clutter
                if (index < travels.length - 5) return;

                const opacity = 0.3 + (index / travels.length) * 0.5;
                const team = NHL_TEAMS[teamId];

                const route = L.polyline(
                    [[travel.from.lat, travel.from.lng], [travel.to.lat, travel.to.lng]],
                    {
                        color: team.color,
                        weight: 2,
                        opacity: opacity,
                        dashArray: '5, 10'
                    }
                ).addTo(this.map);

                route.bindTooltip(`${team.abbr}: ${Math.round(travel.distance)} km`, {
                    permanent: false,
                    direction: 'center'
                });

                this.routes.push(route);
            });
        });
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');

        // Create sorted array of teams by distance
        const sortedTeams = Object.entries(this.teamDistances)
            .map(([teamId, distance]) => ({
                team: NHL_TEAMS[teamId],
                distance: distance
            }))
            .sort((a, b) => b.distance - a.distance);

        // Generate leaderboard HTML
        let html = '';
        sortedTeams.forEach((item, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const distanceKm = Math.round(item.distance);
            const distanceMiles = Math.round(nhlDataService.kmToMiles(item.distance));

            html += `
                <div class="leaderboard-item ${rankClass}" data-team-id="${item.team.id}">
                    <span class="rank">${rank}</span>
                    <span class="team-name">${item.team.abbr}</span>
                    <span class="distance">${distanceKm.toLocaleString()} km</span>
                </div>
            `;
        });

        leaderboardList.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.leaderboard-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                this.showTeamDetails(parseInt(teamId));
                this.highlightTeamRoutes(parseInt(teamId));
            });
        });
    }

    showTeamDetails(teamId) {
        const team = NHL_TEAMS[teamId];
        const distance = this.teamDistances[teamId] || 0;
        const travels = this.teamTravels[teamId] || [];

        const distanceKm = Math.round(distance);
        const distanceMiles = Math.round(nhlDataService.kmToMiles(distance));

        const detailsHtml = `
            <h3 style="color: ${team.color}; margin-bottom: 0.5rem;">${team.name}</h3>
            <p><strong>City:</strong> ${team.city}</p>
            <p><strong>Total Distance:</strong> ${distanceKm.toLocaleString()} km (${distanceMiles.toLocaleString()} mi)</p>
            <p><strong>Number of Trips:</strong> ${travels.length}</p>
            ${travels.length > 0 ? `
                <p><strong>Average Trip:</strong> ${Math.round(distance / travels.length)} km</p>
                <p><strong>Longest Trip:</strong> ${Math.round(Math.max(...travels.map(t => t.distance)))} km</p>
            ` : ''}
        `;

        document.getElementById('team-details').innerHTML = detailsHtml;

        // Center map on team
        this.map.setView([team.lat, team.lng], 6);

        // Highlight marker
        Object.values(this.markers).forEach(marker => {
            marker.setStyle({ weight: 2, radius: 8 });
        });
        this.markers[teamId].setStyle({ weight: 4, radius: 12 });
    }

    highlightTeamRoutes(teamId) {
        // Clear and redraw routes with emphasis on selected team
        this.routes.forEach(route => this.map.removeLayer(route));
        this.routes = [];

        const team = NHL_TEAMS[teamId];
        const travels = this.teamTravels[teamId] || [];

        // Draw other team routes faded
        Object.entries(this.teamTravels).forEach(([otherTeamId, otherTravels]) => {
            if (parseInt(otherTeamId) === teamId) return;

            otherTravels.slice(-5).forEach((travel, index) => {
                const opacity = 0.1;
                const otherTeam = NHL_TEAMS[otherTeamId];

                const route = L.polyline(
                    [[travel.from.lat, travel.from.lng], [travel.to.lat, travel.to.lng]],
                    {
                        color: otherTeam.color,
                        weight: 1,
                        opacity: opacity,
                        dashArray: '5, 10'
                    }
                ).addTo(this.map);

                this.routes.push(route);
            });
        });

        // Draw selected team routes highlighted
        travels.forEach((travel, index) => {
            const opacity = 0.5 + (index / travels.length) * 0.5;

            const route = L.polyline(
                [[travel.from.lat, travel.from.lng], [travel.to.lat, travel.to.lng]],
                {
                    color: team.color,
                    weight: 3,
                    opacity: opacity
                }
            ).addTo(this.map);

            route.bindTooltip(
                `${team.abbr} → ${travel.opponent}<br>${Math.round(travel.distance)} km`,
                { permanent: false, direction: 'center' }
            );

            this.routes.push(route);
        });
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause-btn');

        if (this.isPlaying) {
            btn.textContent = '⏸ Pause';
            this.startPlaying();
        } else {
            btn.textContent = '▶ Play';
            this.stopPlaying();
        }
    }

    startPlaying() {
        this.playInterval = setInterval(() => {
            if (this.currentGameIndex < this.allGames.length - 1) {
                this.currentGameIndex++;
                document.getElementById('timeline').value = this.currentGameIndex;
                this.updateTimelinePosition(this.currentGameIndex);
            } else {
                this.stopPlaying();
                document.getElementById('play-pause-btn').textContent = '▶ Play';
                this.isPlaying = false;
            }
        }, 100); // Update every 100ms for smooth animation
    }

    stopPlaying() {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    resetTimeline() {
        this.stopPlaying();
        this.isPlaying = false;
        document.getElementById('play-pause-btn').textContent = '▶ Play';
        document.getElementById('timeline').value = 0;
        this.updateTimelinePosition(0);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new NHLTravelMap();
    window.nhlTravelMap = app; // Make available globally for debugging
});
