const Assets = {
    // SVGs for game entities
    playerCat: `
        <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <!-- Body -->
            <ellipse cx="50" cy="65" rx="35" ry="30" fill="#fff" />
            <ellipse cx="50" cy="40" rx="30" ry="28" fill="#fff" />
            <!-- Ears -->
            <path d="M25 20 L40 15 L35 35 Z" fill="#fff" stroke="#ffc0cb" stroke-width="2" />
            <path d="M75 20 L60 15 L65 35 Z" fill="#fff" stroke="#ffc0cb" stroke-width="2" />
            <!-- Eyes -->
            <circle cx="40" cy="35" r="3" fill="#4a4a4a" />
            <circle cx="60" cy="35" r="3" fill="#4a4a4a" />
            <!-- Blushes -->
            <circle cx="35" cy="42" r="5" fill="#ffc0cb" opacity="0.6" />
            <circle cx="65" cy="42" r="5" fill="#ffc0cb" opacity="0.6" />
            <!-- Mouth -->
            <path d="M45 42 Q50 47 55 42" fill="none" stroke="#4a4a4a" stroke-width="2" stroke-linecap="round" />
            <!-- Paws -->
            <circle id="paw-left" cx="20" cy="70" r="10" fill="#fff" stroke="#eee" stroke-width="1" />
            <circle id="paw-right" cx="80" cy="70" r="10" fill="#fff" stroke="#eee" stroke-width="1" />
            <!-- Tail -->
            <path d="M85 65 Q95 50 85 40" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" />
        </svg>
    `,

    toyYarn: `
        <svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#ff8fb1" />
            <path d="M20 50 Q50 20 80 50 T20 50" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" />
            <path d="M50 20 Q80 50 50 80 T50 20" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" />
            <path d="M50 50 L100 0" fill="none" stroke="#ff8fb1" stroke-width="4" stroke-linecap="round" />
        </svg>
    `,

    toyMouse: `
        <svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="60" rx="35" ry="20" fill="#8fd3ff" />
            <circle cx="30" cy="45" r="12" fill="#8fd3ff" />
            <circle cx="70" cy="45" r="12" fill="#8fd3ff" />
            <circle cx="45" cy="60" r="2" fill="#4a4a4a" />
            <circle cx="55" cy="60" r="2" fill="#4a4a4a" />
            <path d="M50 75 Q40 85 30 80" fill="none" stroke="#8fd3ff" stroke-width="4" stroke-linecap="round" />
        </svg>
    `,

    toyRibbon: `
        <svg viewBox="0 0 100 200" width="100" height="200" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 Q70 50 50 100 T50 200" fill="none" stroke="#ffe38f" stroke-width="12" stroke-linecap="round" />
            <path d="M30 10 L70 10" fill="none" stroke="#ffe38f" stroke-width="8" stroke-linecap="round" />
        </svg>
    `,

    bossRobotDog: `
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="80" height="70" rx="10" fill="#ccc" stroke="#999" stroke-width="2" />
            <circle cx="40" cy="55" r="8" fill="#ff4444" />
            <circle cx="80" cy="55" r="8" fill="#ff4444" />
            <rect x="40" y="80" width="40" height="10" rx="5" fill="#444" />
            <path d="M20 30 L10 10 M100 30 L110 10" fill="none" stroke="#999" stroke-width="5" stroke-linecap="round" />
            <circle cx="40" cy="55" r="12" fill="#ff4444" opacity="0.2" />
            <circle cx="80" cy="55" r="12" fill="#ff4444" opacity="0.2" />
        </svg>
    `,

    fishIcon: `
        <svg class="fish-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 50 Q30 20 70 40 T90 50 T70 60 T30 80 T10 50" fill="#8fd3ff" stroke="#fff" stroke-width="2" />
            <circle cx="30" cy="45" r="3" fill="#fff" />
            <path d="M70 40 L85 30 L85 70 L70 60 Z" fill="#8fd3ff" stroke="#fff" stroke-width="2" />
        </svg>
    `,

    getAsset(name) {
        return this[name] || '';
    }
};
