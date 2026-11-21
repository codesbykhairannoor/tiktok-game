const WebSocket = require('ws');

class VTubeStudioBridge {
    constructor(port = 8001) {
        this.port = port;
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.token = null;

        this.connect();
    }

    connect() {
        try {
            this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

            this.ws.on('open', () => {
                this.isConnected = true;
                console.log(`[VTube Studio] 🎮 Terhubung ke VTube Studio API di port ${this.port}!`);
                this.authenticate();
            });

            this.ws.on('message', (data) => {
                try {
                    const res = JSON.parse(data.toString());
                    if (res.messageType === 'AuthenticationResponse') {
                        if (res.data.authenticated) {
                            console.log('[VTube Studio] ✅ Autentikasi VTube Studio Berhasil!');
                        }
                    }
                } catch (e) {}
            });

            this.ws.on('error', () => {
                this.isConnected = false;
            });

            this.ws.on('close', () => {
                this.isConnected = false;
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = setTimeout(() => this.connect(), 30000); // Coba reconnect tiap 30s
            });
        } catch (err) {
            this.isConnected = false;
        }
    }

    send(msgType, data = {}) {
        if (!this.isConnected || !this.ws) return;
        try {
            const payload = {
                apiName: 'VTubeStudioPublicAPI',
                apiVersion: '1.0',
                requestID: `req_${Date.now()}`,
                messageType: msgType,
                data: data
            };
            this.ws.send(JSON.stringify(payload));
        } catch (e) {}
    }

    authenticate() {
        this.send('AuthenticationRequest', {
            pluginName: 'AIVtuberStream',
            pluginDeveloper: 'Antigravity',
            authenticationToken: this.token || ''
        });
    }

    /**
     * Memicu hotkey / ekspresi di VTube Studio
     * @param {string} hotkeyNameOrId 
     */
    triggerHotkey(hotkeyNameOrId) {
        if (!this.isConnected) return;
        this.send('HotkeyTriggerRequest', {
            hotkeyID: hotkeyNameOrId
        });
    }

    /**
     * Set ekspresi emosi (blush, happy, angry, cry, laugh)
     */
    setExpression(expressionName) {
        if (!this.isConnected) return;
        this.send('ExpressionActivationRequest', {
            expressionFile: `${expressionName}.exp3.json`,
            active: true
        });

        // Kembalikan ke normal setelah 5 detik
        setTimeout(() => {
            this.send('ExpressionActivationRequest', {
                expressionFile: `${expressionName}.exp3.json`,
                active: false
            });
        }, 5000);
    }
}

module.exports = VTubeStudioBridge;
