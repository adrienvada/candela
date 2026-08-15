// Gamepad Simulation & Automated Dual Controller Test Script for Candela 2D - Web
window.simulateDualGamepads = function(p1Ready = true, p2Ready = true) {
    const fakeGp1 = {
        id: 'DualSense Wireless Controller (SIMULATED P1)',
        index: 0,
        connected: true,
        timestamp: performance.now(),
        mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array(17).fill(0).map((_, i) => ({
            pressed: (i === 0 && p1Ready),
            value: (i === 0 && p1Ready) ? 1.0 : 0.0
        }))
    };

    const fakeGp2 = {
        id: 'Xbox Wireless Controller (SIMULATED P2)',
        index: 1,
        connected: true,
        timestamp: performance.now(),
        mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array(17).fill(0).map((_, i) => ({
            pressed: (i === 0 && p2Ready),
            value: (i === 0 && p2Ready) ? 1.0 : 0.0
        }))
    };

    navigator.getGamepads = () => [fakeGp1, fakeGp2];
    window.dispatchEvent(new CustomEvent('gamepadconnected', { gamepad: fakeGp1 }));
    window.dispatchEvent(new CustomEvent('gamepadconnected', { gamepad: fakeGp2 }));
    console.log("🎮 SIMULATION DE 2 MANETTES ACTIVÉE !");
};
